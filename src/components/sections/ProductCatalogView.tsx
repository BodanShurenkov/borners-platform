'use client';

import React, { useState, useMemo } from 'react';
import {
  Archive,
  ArrowUpRight,
  CalendarPlus,
  Download,
  FilePlus,
  ImagePlus,
  Lock,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { usePlatform } from '@/context/PlatformContext';
import { Product, ProductStatus } from '@/types/platform';
import { exportDocumentAsPdf } from '@/lib/document-export';
import {
  calculateUnitEconomics,
  canUserEditBrand,
  canUserViewCostPrice,
  canUserViewFinance,
  formatCurrencyRub,
} from '@/lib/finance';

const STATUS_META: Record<ProductStatus, { label: string; dotColor: string }> = {
  in_development: {
    label: 'В разработке',
    dotColor: 'bg-[#D99527]',
  },
  sampled: {
    label: 'Образец готов',
    dotColor: 'bg-[#171717]',
  },
  approved: {
    label: 'Утверждён',
    dotColor: 'bg-[#16805D]',
  },
  in_production: {
    label: 'В производстве',
    dotColor: 'bg-[#D97745]',
  },
  active: {
    label: 'В продаже',
    dotColor: 'bg-[#16805D]',
  },
  out_of_stock: {
    label: 'Нет в наличии',
    dotColor: 'bg-[#C94B4B]',
  },
  archived: {
    label: 'Архив',
    dotColor: 'bg-[#737373]',
  },
};

export function ProductCatalogView() {
  const {
    products,
    concepts,
    launches,
    campaigns,
    tasks,
    documents,
    users,
    currentUser,
    brandFilter,
    platformMode,
    selectedProductId,
    setSelectedProductId,
    navigateTo,
    createProduct,
    updateProduct,
    createLaunch,
    archiveEntity,
    notify,
  } = usePlatform();

  const isStrategyMode = platformMode === 'strategy';
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [productTypeFilter, setProductTypeFilter] = useState<string>('ALL');
  const [priceSegmentFilter, setPriceSegmentFilter] = useState<string>('ALL');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [drawerTab, setDrawerTab] = useState<
    'passport' | 'variants' | 'economics' | 'relations'
  >('passport');

  const [newVariantForm, setNewVariantForm] = useState({
    skuVariant: '',
    color: 'Чёрный Оникс',
    size: 'L' as 'S' | 'M' | 'L' | 'XL' | 'XXL',
    packConfiguration: '1-pack' as '1-pack' | '2-pack' | '3-pack',
    stockQty: '450',
  });

  const [newSkuForm, setNewSkuForm] = useState({
    sku: 'BRN-MOD-08',
    name: '',
    brandId: brandFilter === 'NA_TELE' ? 'NA_TELE' : 'BORNERS',
    category: 'Боксеры' as Product['category'],
    productType: 'Базовая коллекция' as Product['productType'],
    priceSegment: 'Middle+' as Product['priceSegment'],
    collection: 'CORE 2027',
    materials: '92% микромодал (Австрия), 8% эластан, 190 г/м²',
    fitType: 'Анатомический крой без заднего среднего шва',
    plannedRetailPrice: '2390',
    unitCostPrice: '470',
    logisticsRub: '110',
    imageUrl: '',
  });

  const hasFinance = canUserViewFinance(currentUser);
  const hasCostAccess = canUserViewCostPrice(currentUser);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (!p.isArchived && (brandFilter === 'ALL' || p.brandId === brandFilter)) {
        set.add(p.category);
      }
    });
    return Array.from(set);
  }, [products, brandFilter]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.isArchived) return false;
      if (brandFilter !== 'ALL' && p.brandId !== brandFilter) return false;
      if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (productTypeFilter !== 'ALL' && p.productType !== productTypeFilter) return false;
      if (priceSegmentFilter !== 'ALL' && p.priceSegment !== priceSegmentFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.collection.toLowerCase().includes(q) ||
          p.materials.toLowerCase().includes(q) ||
          p.supplierName.toLowerCase().includes(q) ||
          p.colorCombinations.some((c) => c.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [
    products,
    brandFilter,
    categoryFilter,
    statusFilter,
    productTypeFilter,
    priceSegmentFilter,
    searchQuery,
  ]);

  const activeProduct: Product | null = useMemo(
    () => products.find((p) => p.id === selectedProductId) || null,
    [products, selectedProductId]
  );

  const canEditActiveProduct =
    !isStrategyMode &&
    activeProduct !== null &&
    canUserEditBrand(currentUser, activeProduct.brandId);

  const handleCreateProduct = () => {
    if (!newSkuForm.name.trim()) return;
    const retail = Number(newSkuForm.plannedRetailPrice) || 2390;
    const cost = Number(newSkuForm.unitCostPrice) || 470;
    const log = Number(newSkuForm.logisticsRub) || 110;

    createProduct({
      sku: newSkuForm.sku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
      name: newSkuForm.name.trim(),
      brandId: newSkuForm.brandId,
      category: newSkuForm.category,
      productType: newSkuForm.productType,
      priceSegment: newSkuForm.priceSegment,
      collection: newSkuForm.collection,
      materials: newSkuForm.materials,
      fitType: newSkuForm.fitType,
      imageUrl: newSkuForm.imageUrl || undefined,
      status: 'in_development',
      economics: {
        currency: 'RUB',
        plannedRetailPrice: retail,
        actualRetailPrice: retail,
        discountPct: 10,
        vatPct: 20,
        returnRatePct: 8,
        unitCostPrice: cost,
        marketplaceCommissionRub: Math.round(retail * 0.18),
        logisticsRub: log,
        advertisingRub: Math.round(retail * 0.1),
        otherVariableRub: 45,
      },
    });
    setCreateModalOpen(false);
  };

  const handleUploadProductPhoto = (
    e: React.ChangeEvent<HTMLInputElement>,
    product: Product
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) return;
      updateProduct(product.id, {
        imageUrl: dataUrl,
        galleryUrls: [dataUrl, ...product.galleryUrls],
      });
      notify('success', `Фотография для ${product.sku} обновлена`);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadTechFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    product: Product
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    updateProduct(product.id, {
      techFiles: [
        ...product.techFiles,
        {
          id: `asset-${Date.now()}`,
          title: file.name,
          assetType: 'tech_pack',
          url: '#',
          uploadedAt: new Date().toISOString().slice(0, 10),
        },
      ],
    });
    notify('success', `Техфайл «${file.name}» прикреплён к паспорту ${product.sku}`);
  };

  const handleAddVariant = (product: Product) => {
    const skuVar =
      newVariantForm.skuVariant.trim() ||
      `${product.sku}-${newVariantForm.size}-${product.variants.length + 1}`;
    const nextVar = {
      id: `var-${Date.now()}`,
      productId: product.id,
      variantSku: skuVar,
      colorName: newVariantForm.color,
      colorHex: '#171717',
      size: newVariantForm.size,
      packConfiguration: newVariantForm.packConfiguration,
      stockQty: Number(newVariantForm.stockQty) || 0,
    };
    updateProduct(product.id, {
      variants: [...product.variants, nextVar],
    });
    setNewVariantForm((prev) => ({ ...prev, skuVariant: '' }));
    notify('success', `Добавлен вариант ${skuVar}`);
  };

  const handleCreateLaunchForProduct = (product: Product) => {
    const created = createLaunch({
      name: `Релиз SKU: ${product.name}`,
      brandId: product.brandId,
      collectionName: product.collection,
      productId: product.id,
      conceptId: product.conceptId,
      startDate: '2027-04-20',
      marketingBudgetRub: 900000,
      salesPlanUnits: 4000,
      salesPlanRub: 4000 * product.economics.actualRetailPrice,
      ownerId: product.ownerId || currentUser.id,
    });
    setSelectedProductId(null);
    navigateTo('launch-calendar', { launchId: created.id });
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Заголовок страницы (32–40px по ТЗ) */}
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-[#E8E8E5] pb-6">
        <div>
          <div className="text-[13px] font-medium uppercase tracking-widest text-[#737373] mb-1.5">
            Ассортиментная матрица · {filteredProducts.length} моделей
          </div>
          <h1 className="text-[34px] md:text-[40px] font-bold tracking-[-0.03em] text-[#171717] dark:text-white">
            Каталог моделей
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-[#F7F7F5] p-1 rounded-xl border border-[#E8E8E5]">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg text-[14px] font-semibold transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#171717] shadow-2xs'
                  : 'text-[#737373] hover:text-[#171717]'
              }`}
            >
              Галерея
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-lg text-[14px] font-semibold transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#171717] shadow-2xs'
                  : 'text-[#737373] hover:text-[#171717]'
              }`}
            >
              Таблица
            </button>
          </div>

          {!isStrategyMode && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-2 h-11 rounded-xl bg-[#111111] text-white px-5 text-[15px] font-semibold hover:bg-neutral-800 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Добавить модель</span>
            </button>
          )}
        </div>
      </div>

      {/* Панель поиска и расширенных фильтров (п. 6 и 17 ТЗ) */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`px-4 py-2 rounded-xl text-[14px] font-semibold border transition cursor-pointer ${
                categoryFilter === 'ALL'
                  ? 'bg-[#111111] text-white border-[#111111]'
                  : 'bg-white text-[#171717] border-[#E8E8E5] hover:border-[#171717]'
              }`}
            >
              Все категории
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 rounded-xl text-[14px] font-semibold border transition cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'bg-white text-[#171717] border-[#E8E8E5] hover:border-[#171717]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-64">
              <Search className="h-4 w-4 text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск SKU, ткани, фабрики..."
                className="w-full h-11 rounded-xl bg-white border border-[#E8E8E5] pl-10 pr-4 text-[14px] outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 rounded-xl bg-white border border-[#E8E8E5] px-3.5 text-[13px] font-semibold outline-none cursor-pointer"
            >
              <option value="ALL">Все статусы</option>
              <option value="active">В продаже</option>
              <option value="in_production">В производстве</option>
              <option value="approved">Утверждён</option>
              <option value="sampled">Образец готов</option>
              <option value="in_development">В разработке</option>
              <option value="out_of_stock">Нет в наличии</option>
            </select>

            <select
              value={productTypeFilter}
              onChange={(e) => setProductTypeFilter(e.target.value)}
              className="h-11 rounded-xl bg-white border border-[#E8E8E5] px-3.5 text-[13px] font-semibold outline-none cursor-pointer"
            >
              <option value="ALL">Все типы линеек</option>
              <option value="Базовая коллекция">Базовая коллекция</option>
              <option value="Лимитированная коллекция">Лимитированная коллекция</option>
              <option value="Капсула оттенков кожи">Капсула оттенков кожи</option>
              <option value="Мультипак">Мультипак</option>
            </select>

            <select
              value={priceSegmentFilter}
              onChange={(e) => setPriceSegmentFilter(e.target.value)}
              className="h-11 rounded-xl bg-white border border-[#E8E8E5] px-3.5 text-[13px] font-semibold outline-none cursor-pointer"
            >
              <option value="ALL">Все ценовые сегменты</option>
              <option value="Mass-Market+">Mass-Market+</option>
              <option value="Middle+">Middle+</option>
              <option value="Premium">Premium</option>
            </select>
          </div>
        </div>
      </div>

      {/* РЕЖИМ 1: ГАЛЕРЕЯ МОДЕЛЕЙ (крупные карточки с чистой предметной иллюстрацией без плашек поверх фото) */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const st = STATUS_META[product.status];
            const calc = calculateUnitEconomics(product.economics);
            const isBorners = product.brandId === 'BORNERS';

            return (
              <div
                key={product.id}
                onClick={() => {
                  setSelectedProductId(product.id);
                  setDrawerTab('passport');
                }}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-[#E8E8E5] hover:border-[#171717] p-6 flex flex-col justify-between transition cursor-pointer group space-y-5"
              >
                <div className="space-y-4">
                  {/* Предметное фото модели в чистой рамке без наслоения бейджей */}
                  <div className="h-52 w-full rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] flex items-center justify-center p-5">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-contain group-hover:scale-[1.03] transition-transform"
                    />
                  </div>

                  {/* Строка бренда, SKU и статуса под иллюстрацией */}
                  <div className="flex items-center justify-between gap-2 text-[13px]">
                    <div className="flex items-center gap-2 font-semibold">
                      <span
                        style={{ color: isBorners ? '#D97745' : '#8B8078' }}
                      >
                        {isBorners ? 'BORNERS' : 'НА ТЕЛЕ'}
                      </span>
                      <span className="text-[#737373]">· {product.sku}</span>
                      {product.isDemo && (
                        <span className="px-1.5 py-0.5 rounded bg-[#F7F7F5] border border-[#E8E8E5] text-[10px] font-semibold text-[#737373]">
                          DEMO
                        </span>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1.5 font-medium text-[#171717]">
                      <span className={`h-2 w-2 rounded-full ${st.dotColor}`} />
                      <span>{st.label}</span>
                    </span>
                  </div>

                  {/* Название модели и коллекция */}
                  <div>
                    <h3 className="text-[20px] font-bold text-[#171717] dark:text-white leading-snug">
                      {product.name}
                    </h3>
                    <div className="text-[14px] text-[#737373] mt-1">
                      {product.category} · {product.collection} · {product.productType}
                    </div>
                  </div>

                  {/* Состав ткани */}
                  <p className="text-[14px] text-[#737373] leading-relaxed">
                    {product.fabricComposition} · {product.fabricDensityGsm} г/м²
                  </p>
                </div>

                {/* Нижний блок: Цена, Себестоимость и Маржа */}
                <div className="pt-4 border-t border-[#E8E8E5] grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-[12px] text-[#737373]">РРЦ</div>
                    <div className="text-[18px] font-bold text-[#171717] dark:text-white mt-0.5">
                      {formatCurrencyRub(product.economics.actualRetailPrice)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[12px] text-[#737373]">Себестоимость</div>
                    <div className="text-[18px] font-bold text-[#171717] dark:text-white mt-0.5">
                      {hasCostAccess
                        ? formatCurrencyRub(product.economics.unitCostPrice)
                        : 'Скрыто'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] text-[#737373]">Маржа</div>
                    <div
                      className={`text-[18px] font-bold mt-0.5 ${
                        hasFinance
                          ? calc.marginPct >= 30
                            ? 'text-[#16805D]'
                            : 'text-[#D99527]'
                          : 'text-[#737373]'
                      }`}
                    >
                      {hasFinance ? `${calc.marginPct}%` : '—'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* РЕЖИМ 2: ТАБЛИЦА КАТАЛОГА */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-[#E8E8E5] overflow-x-auto">
          <table className="w-full text-left text-[15px]">
            <thead className="border-b border-[#E8E8E5] text-[13px] font-semibold uppercase tracking-wider text-[#737373] bg-[#F7F7F5]/60">
              <tr>
                <th className="py-4 px-6">SKU</th>
                <th className="py-4 px-4">Модель и состав</th>
                <th className="py-4 px-4">Бренд</th>
                <th className="py-4 px-4">Категория / Тип</th>
                <th className="py-4 px-4 text-right">РРЦ</th>
                <th className="py-4 px-4 text-right">Себестоимость</th>
                <th className="py-4 px-4 text-right">Прибыль / ед.</th>
                <th className="py-4 px-4 text-right">Маржа</th>
                <th className="py-4 px-6 text-right">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E5]">
              {filteredProducts.map((p) => {
                const st = STATUS_META[p.status];
                const calc = calculateUnitEconomics(p.economics);
                return (
                  <tr
                    key={p.id}
                    onClick={() => {
                      setSelectedProductId(p.id);
                      setDrawerTab('passport');
                    }}
                    className="hover:bg-[#F7F7F5]/60 transition cursor-pointer"
                  >
                    <td className="py-4 px-6 font-semibold text-[#171717]">
                      {p.sku}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-[16px] text-[#171717] dark:text-white">
                        {p.name}
                      </div>
                      <div className="text-[13px] text-[#737373] truncate max-w-md">
                        {p.fabricComposition} · {p.fabricDensityGsm} г/м²
                      </div>
                    </td>
                    <td className="py-4 px-4 font-semibold">
                      {p.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : 'BORNERS'}
                    </td>
                    <td className="py-4 px-4 text-[#737373]">
                      <div>{p.category}</div>
                      <div className="text-[12px]">{p.productType}</div>
                    </td>
                    <td className="py-4 px-4 text-right font-semibold">
                      {formatCurrencyRub(p.economics.actualRetailPrice)}
                    </td>
                    <td className="py-4 px-4 text-right text-[#737373]">
                      {hasCostAccess
                        ? formatCurrencyRub(p.economics.unitCostPrice)
                        : 'Скрыто'}
                    </td>
                    <td className="py-4 px-4 text-right font-semibold">
                      {hasFinance ? formatCurrencyRub(calc.unitProfitRub) : '—'}
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-[#16805D]">
                      {hasFinance ? `${calc.marginPct}%` : '—'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="inline-flex items-center gap-2 text-[13px] font-medium">
                        <span className={`h-2 w-2 rounded-full ${st.dotColor}`} />
                        <span>{st.label}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* БОКОВАЯ ПАНЕЛЬ ПАСПОРТА МОДЕЛИ (ВСЕ 6 РАЗДЕЛОВ ПО П. 6 ТЗ) */}
      {activeProduct && (
        <div
          onClick={() => setSelectedProductId(null)}
          className="fixed inset-0 z-50 flex justify-end bg-black/40"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl bg-white dark:bg-zinc-900 h-full overflow-y-auto p-8 md:p-10 space-y-8 shadow-2xl border-l border-[#E8E8E5]"
          >
            {/* Шапка спецификации */}
            <div className="flex items-start justify-between gap-4 border-b border-[#E8E8E5] pb-6">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5 text-[13px] font-semibold">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#111111] text-white">
                    {activeProduct.sku}
                  </span>
                  <span className="text-[#737373]">
                    UUID: {activeProduct.id} ·{' '}
                    {activeProduct.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : 'BORNERS'} ·{' '}
                    {activeProduct.collection}
                  </span>
                  {activeProduct.isDemo && (
                    <span className="px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E8E8E5] text-[11px] text-[#737373]">
                      DEMO
                    </span>
                  )}
                </div>
                <h2 className="text-[28px] font-bold text-[#171717] dark:text-white">
                  {activeProduct.name}
                </h2>
              </div>

              <button
                onClick={() => setSelectedProductId(null)}
                className="rounded-xl border border-[#E8E8E5] p-2 text-[#171717] hover:bg-[#111111] hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Переключение статуса и быстрый запуск */}
            {canEditActiveProduct && (
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E8E8E5] pb-6">
                <div className="flex items-center gap-3">
                  <span className="text-[14px] font-semibold text-[#171717]">
                    Статус SKU:
                  </span>
                  <select
                    value={activeProduct.status}
                    onChange={(e) =>
                      updateProduct(activeProduct.id, {
                        status: e.target.value as ProductStatus,
                      })
                    }
                    className="h-11 rounded-xl border border-[#E8E8E5] px-4 text-[14px] font-semibold bg-white cursor-pointer"
                  >
                    <option value="in_development">В разработке</option>
                    <option value="sampled">Образец готов</option>
                    <option value="approved">Утверждён</option>
                    <option value="in_production">В производстве</option>
                    <option value="active">В продаже</option>
                    <option value="out_of_stock">Нет в наличии</option>
                  </select>
                </div>

                <button
                  onClick={() => handleCreateLaunchForProduct(activeProduct)}
                  className="inline-flex items-center gap-2 h-11 rounded-xl border border-[#E8E8E5] bg-white px-4 text-[14px] font-semibold text-[#171717] hover:bg-[#F7F7F5] transition cursor-pointer"
                >
                  <CalendarPlus className="h-4 w-4" />
                  <span>+ Создать запуск по этой модели</span>
                </button>
              </div>
            )}

            {/* Навигация по 6 блокам паспорта продукта */}
            <div className="flex flex-wrap bg-[#F7F7F5] p-1 rounded-xl border border-[#E8E8E5] gap-1">
              <button
                onClick={() => setDrawerTab('passport')}
                className={`flex-1 py-2.5 px-3 rounded-lg text-[13px] font-semibold transition cursor-pointer ${
                  drawerTab === 'passport'
                    ? 'bg-white text-[#171717] shadow-2xs'
                    : 'text-[#737373] hover:text-[#171717]'
                }`}
              >
                1–2. Основное и дизайн
              </button>
              <button
                onClick={() => setDrawerTab('variants')}
                className={`flex-1 py-2.5 px-3 rounded-lg text-[13px] font-semibold transition cursor-pointer ${
                  drawerTab === 'variants'
                    ? 'bg-white text-[#171717] shadow-2xs'
                    : 'text-[#737373] hover:text-[#171717]'
                }`}
              >
                3. Варианты ({activeProduct.variants.length}) и Фабрика
              </button>
              <button
                onClick={() => setDrawerTab('economics')}
                className={`flex-1 py-2.5 px-3 rounded-lg text-[13px] font-semibold transition cursor-pointer ${
                  drawerTab === 'economics'
                    ? 'bg-white text-[#171717] shadow-2xs'
                    : 'text-[#737373] hover:text-[#171717]'
                }`}
              >
                4–5. Экономика и Продажи
              </button>
              <button
                onClick={() => setDrawerTab('relations')}
                className={`flex-1 py-2.5 px-3 rounded-lg text-[13px] font-semibold transition cursor-pointer ${
                  drawerTab === 'relations'
                    ? 'bg-white text-[#171717] shadow-2xs'
                    : 'text-[#737373] hover:text-[#171717]'
                }`}
              >
                6. Связи (R&D, Релизы, Задачи)
              </button>
            </div>

            {/* ВКЛАДКА 1: ОСНОВНАЯ ИНФОРМАЦИЯ И ПАРАМЕТРЫ ПРОДУКТА */}
            {drawerTab === 'passport' && (
              <div className="space-y-8 text-[15px]">
                {/* Галерея и загрузка фото */}
                <div className="space-y-3">
                  <div className="h-56 w-full rounded-2xl bg-[#F7F7F5] border border-[#E8E8E5] flex items-center justify-center p-6">
                    <img
                      src={activeProduct.imageUrl}
                      alt={activeProduct.name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {activeProduct.galleryUrls.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            updateProduct(activeProduct.id, { imageUrl: url })
                          }
                          className={`h-14 w-14 rounded-xl bg-[#F7F7F5] border p-1.5 cursor-pointer ${
                            activeProduct.imageUrl === url
                              ? 'border-[#171717]'
                              : 'border-[#E8E8E5]'
                          }`}
                        >
                          <img
                            src={url}
                            alt=""
                            className="h-full w-full object-contain"
                          />
                        </button>
                      ))}
                    </div>

                    {canEditActiveProduct && (
                      <label className="inline-flex items-center gap-2 h-10 rounded-xl border border-[#E8E8E5] bg-white px-4 text-[13px] font-semibold text-[#171717] hover:bg-[#F7F7F5] cursor-pointer">
                        <ImagePlus className="h-4 w-4" />
                        <span>Загрузить фото / рендер</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUploadProductPhoto(e, activeProduct)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* 1. Основная информация */}
                <div className="space-y-4">
                  <h3 className="text-[19px] font-bold border-b border-[#E8E8E5] pb-2">
                    1. Основная информация паспорта
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-[14px]">
                    <div>
                      <div className="text-[12px] text-[#737373]">Системный ID</div>
                      <div className="font-semibold text-[#171717] mt-0.5">
                        {activeProduct.id}
                      </div>
                    </div>
                    <div>
                      <div className="text-[12px] text-[#737373]">Артикул (SKU)</div>
                      <div className="font-semibold text-[#171717] mt-0.5">
                        {activeProduct.sku}
                      </div>
                    </div>
                    <div>
                      <div className="text-[12px] text-[#737373]">Тип продукта</div>
                      <div className="font-semibold text-[#171717] mt-0.5">
                        {activeProduct.productType}
                      </div>
                    </div>
                    <div>
                      <div className="text-[12px] text-[#737373]">Ценовой сегмент</div>
                      <div className="font-semibold text-[#171717] mt-0.5">
                        {activeProduct.priceSegment}
                      </div>
                    </div>
                    <div>
                      <div className="text-[12px] text-[#737373]">Ответственный</div>
                      <div className="font-semibold text-[#171717] mt-0.5">
                        {users.find((u) => u.id === activeProduct.ownerId)?.fullName ||
                          'Команда продукта'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[12px] text-[#737373]">Размерный ряд</div>
                      <div className="font-semibold text-[#171717] mt-0.5">
                        {activeProduct.sizes.join(' · ')}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[12px] text-[#737373] mb-1">Описание модели</div>
                    {canEditActiveProduct ? (
                      <textarea
                        rows={2}
                        value={activeProduct.description}
                        onChange={(e) =>
                          updateProduct(activeProduct.id, {
                            description: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-[#E8E8E5] p-3 text-[14px]"
                      />
                    ) : (
                      <p className="text-[14px] text-[#171717]">
                        {activeProduct.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. Дизайн и параметры продукта */}
                <div className="space-y-4">
                  <h3 className="text-[19px] font-bold border-b border-[#E8E8E5] pb-2">
                    2. Дизайн, материалы и конструкция
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-[14px]">
                    <div>
                      <div className="text-[12px] text-[#737373] mb-1">Полотно и плотность</div>
                      <div className="font-semibold text-[#171717]">
                        {activeProduct.fabricComposition} ({activeProduct.fabricDensityGsm} г/м²)
                      </div>
                    </div>
                    <div>
                      <div className="text-[12px] text-[#737373] mb-1">Цветовая палитра</div>
                      <div className="font-semibold text-[#171717]">
                        {activeProduct.colorCombinations.join(', ')}
                      </div>
                    </div>
                    <div>
                      <div className="text-[12px] text-[#737373] mb-1">Посадка и тип резинки</div>
                      <div className="font-semibold text-[#171717]">
                        {activeProduct.fitType} · {activeProduct.waistbandType}
                      </div>
                    </div>
                    <div>
                      <div className="text-[12px] text-[#737373] mb-1">Конструктивные особенности</div>
                      <div className="font-semibold text-[#171717]">
                        {activeProduct.constructionDetails}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ВКЛАДКА 2: ВАРИАНТЫ (ЦВЕТОРАЗМЕРЫ) И ПРОИЗВОДСТВО */}
            {drawerTab === 'variants' && (
              <div className="space-y-8 text-[15px]">
                {/* Таблица вариантов (Variants) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[19px] font-bold">
                      Матрица цветоразмеров и комплектов (Variants)
                    </h3>
                    <span className="text-[13px] font-semibold text-[#737373]">
                      Всего остаток:{' '}
                      {activeProduct.variants
                        .reduce((s, v) => s + v.stockQty, 0)
                        .toLocaleString('ru-RU')}{' '}
                      шт.
                    </span>
                  </div>

                  <div className="rounded-2xl border border-[#E8E8E5] overflow-x-auto">
                    <table className="w-full text-left text-[14px]">
                      <thead className="bg-[#F7F7F5] border-b border-[#E8E8E5] text-[12px] font-semibold uppercase text-[#737373]">
                        <tr>
                          <th className="py-3 px-4">Артикул варианта</th>
                          <th className="py-3 px-4">Цвет</th>
                          <th className="py-3 px-4">Размер</th>
                          <th className="py-3 px-4">Комплектация</th>
                          <th className="py-3 px-4 text-right">Остаток (шт.)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8E8E5]">
                        {activeProduct.variants.map((v) => (
                          <tr key={v.id}>
                            <td className="py-3 px-4 font-semibold text-[#171717]">
                              {v.variantSku}
                            </td>
                            <td className="py-3 px-4">{v.colorName}</td>
                            <td className="py-3 px-4 font-semibold">{v.size}</td>
                            <td className="py-3 px-4 text-[#737373]">
                              {v.packConfiguration}
                            </td>
                            <td className="py-3 px-4 text-right font-bold">
                              {v.stockQty.toLocaleString('ru-RU')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {canEditActiveProduct && (
                    <div className="rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] p-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-[13px]">
                      <input
                        value={newVariantForm.color}
                        onChange={(e) =>
                          setNewVariantForm({ ...newVariantForm, color: e.target.value })
                        }
                        placeholder="Цвет"
                        className="h-10 rounded-lg bg-white border border-[#E8E8E5] px-3"
                      />
                      <select
                        value={newVariantForm.size}
                        onChange={(e) =>
                          setNewVariantForm({
                            ...newVariantForm,
                            size: e.target.value as typeof newVariantForm.size,
                          })
                        }
                        className="h-10 rounded-lg bg-white border border-[#E8E8E5] px-3 font-semibold"
                      >
                        {(['S', 'M', 'L', 'XL', 'XXL'] as const).map((sz) => (
                          <option key={sz} value={sz}>
                            {sz}
                          </option>
                        ))}
                      </select>
                      <select
                        value={newVariantForm.packConfiguration}
                        onChange={(e) =>
                          setNewVariantForm({
                            ...newVariantForm,
                            packConfiguration: e.target
                              .value as typeof newVariantForm.packConfiguration,
                          })
                        }
                        className="h-10 rounded-lg bg-white border border-[#E8E8E5] px-3 font-semibold"
                      >
                        <option value="1-pack">1-pack</option>
                        <option value="2-pack">2-pack</option>
                        <option value="3-pack">3-pack</option>
                      </select>
                      <input
                        type="number"
                        value={newVariantForm.stockQty}
                        onChange={(e) =>
                          setNewVariantForm({
                            ...newVariantForm,
                            stockQty: e.target.value,
                          })
                        }
                        placeholder="Остаток"
                        className="h-10 rounded-lg bg-white border border-[#E8E8E5] px-3"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddVariant(activeProduct)}
                        className="h-10 rounded-lg bg-[#111111] text-white font-semibold hover:bg-neutral-800 cursor-pointer"
                      >
                        + Добавить вариант
                      </button>
                    </div>
                  )}
                </div>

                {/* 3. Производство и техфайлы */}
                <div className="space-y-4 pt-4 border-t border-[#E8E8E5]">
                  <h3 className="text-[19px] font-bold">
                    3. Производственный паспорт и техфайлы
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-[14px]">
                    <div>
                      <div className="text-[12px] text-[#737373]">Фабрика-производитель</div>
                      <div className="font-semibold text-[#171717] mt-0.5">
                        {activeProduct.supplierName}
                      </div>
                    </div>
                    <div>
                      <div className="text-[12px] text-[#737373]">Страна производства</div>
                      <div className="font-semibold text-[#171717] mt-0.5">
                        {activeProduct.supplierCountry}
                      </div>
                    </div>
                    <div>
                      <div className="text-[12px] text-[#737373]">Минимальный тираж (MOQ)</div>
                      <div className="font-semibold text-[#171717] mt-0.5">
                        {activeProduct.moq.toLocaleString('ru-RU')} шт.
                      </div>
                    </div>
                    <div>
                      <div className="text-[12px] text-[#737373]">Цикл пошива / Доставка</div>
                      <div className="font-semibold text-[#171717] mt-0.5">
                        {activeProduct.productionLeadDays} дн. / {activeProduct.deliveryLeadDays} дн.
                      </div>
                    </div>
                    <div>
                      <div className="text-[12px] text-[#737373]">Тип линейки</div>
                      <div className="font-semibold text-[#171717] mt-0.5">
                        {activeProduct.productType}
                      </div>
                    </div>
                    <div>
                      <div className="text-[12px] text-[#737373]">Статус жизненного цикла</div>
                      <div className="font-semibold text-[#171717] mt-0.5">
                        {STATUS_META[activeProduct.status].label}
                      </div>
                    </div>
                  </div>

                  {/* Техфайлы */}
                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-[#737373]">
                        Прикреплённые техфайлы и лекала ({activeProduct.techFiles.length})
                      </span>
                      {canEditActiveProduct && (
                        <label className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#171717] hover:underline cursor-pointer">
                          <FilePlus className="h-4 w-4" />
                          <span>Прикрепить техфайл</span>
                          <input
                            type="file"
                            onChange={(e) => handleUploadTechFile(e, activeProduct)}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activeProduct.techFiles.map((tf) => (
                        <button
                          key={tf.id}
                          type="button"
                          onClick={() =>
                            exportDocumentAsPdf(
                              {
                                id: tf.id,
                                title: `${tf.title} — ${activeProduct.name}`,
                                fileName: `${activeProduct.sku}_${tf.title.replace(/\s+/g, '_')}.pdf`,
                                fileType: 'PDF',
                                fileSizeBytes: 1_450_000,
                                brandId: activeProduct.brandId,
                                category: 'производство',
                                productId: activeProduct.id,
                                tags: ['Техфайл', activeProduct.sku],
                                isFinancialRestricted: false,
                                minRole: 'Viewer',
                                uploadedBy: 'КБ BORNERS GROUP',
                                uploadedAt: tf.uploadedAt,
                                isDemo: false,
                                isArchived: false,
                              },
                              { products, concepts },
                            )
                          }
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#F7F7F5] hover:bg-[#EFECE6] border border-[#E8E8E5] text-[13px] font-medium text-[#171717] transition-colors cursor-pointer"
                          title="Скачать техническую спецификацию (PDF)"
                        >
                          <Download className="h-3.5 w-3.5 text-[#737373]" />
                          <span>
                            {tf.title} ({tf.assetType})
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ВКЛАДКА 3: ЮНИТ-ЭКОНОМИКА И ПРОДАЖИ */}
            {drawerTab === 'economics' && (
              <div className="space-y-8 text-[15px]">
                {/* 4. Калькулятор юнит-экономики */}
                <div className="space-y-4">
                  <h3 className="text-[19px] font-bold border-b border-[#E8E8E5] pb-2">
                    4. Юнит-экономика (на 1 ед.)
                  </h3>

                  {hasFinance && hasCostAccess ? (
                    (() => {
                      const res = calculateUnitEconomics(activeProduct.economics);
                      return (
                        <div className="space-y-5 rounded-2xl border border-[#E8E8E5] p-6 bg-[#F7F7F5]">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-[14px]">
                            <div>
                              <label className="block font-semibold mb-1.5">
                                Розничная цена (₽)
                              </label>
                              <input
                                type="number"
                                disabled={!canEditActiveProduct}
                                value={activeProduct.economics.actualRetailPrice}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 0;
                                  updateProduct(activeProduct.id, {
                                    economics: {
                                      ...activeProduct.economics,
                                      actualRetailPrice: val,
                                      plannedRetailPrice: val,
                                    },
                                  });
                                }}
                                className="w-full h-11 rounded-xl bg-white border border-[#E8E8E5] px-3.5 font-semibold"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold mb-1.5">
                                Себестоимость (₽)
                              </label>
                              <input
                                type="number"
                                disabled={!canEditActiveProduct}
                                value={activeProduct.economics.unitCostPrice}
                                onChange={(e) => {
                                  updateProduct(activeProduct.id, {
                                    economics: {
                                      ...activeProduct.economics,
                                      unitCostPrice: Number(e.target.value) || 0,
                                    },
                                  });
                                }}
                                className="w-full h-11 rounded-xl bg-white border border-[#E8E8E5] px-3.5 font-semibold"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold mb-1.5">
                                Логистика (₽)
                              </label>
                              <input
                                type="number"
                                disabled={!canEditActiveProduct}
                                value={activeProduct.economics.logisticsRub}
                                onChange={(e) => {
                                  updateProduct(activeProduct.id, {
                                    economics: {
                                      ...activeProduct.economics,
                                      logisticsRub: Number(e.target.value) || 0,
                                    },
                                  });
                                }}
                                className="w-full h-11 rounded-xl bg-white border border-[#E8E8E5] px-3.5 font-semibold"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold mb-1.5">
                                Комиссия МП (₽)
                              </label>
                              <input
                                type="number"
                                disabled={!canEditActiveProduct}
                                value={activeProduct.economics.marketplaceCommissionRub}
                                onChange={(e) => {
                                  updateProduct(activeProduct.id, {
                                    economics: {
                                      ...activeProduct.economics,
                                      marketplaceCommissionRub:
                                        Number(e.target.value) || 0,
                                    },
                                  });
                                }}
                                className="w-full h-11 rounded-xl bg-white border border-[#E8E8E5] px-3.5 font-semibold"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold mb-1.5">
                                Реклама на 1 ед. (₽)
                              </label>
                              <input
                                type="number"
                                disabled={!canEditActiveProduct}
                                value={activeProduct.economics.advertisingRub}
                                onChange={(e) => {
                                  updateProduct(activeProduct.id, {
                                    economics: {
                                      ...activeProduct.economics,
                                      advertisingRub: Number(e.target.value) || 0,
                                    },
                                  });
                                }}
                                className="w-full h-11 rounded-xl bg-white border border-[#E8E8E5] px-3.5 font-semibold"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold mb-1.5">
                                Скидка СПП / Промо (%)
                              </label>
                              <input
                                type="number"
                                disabled={!canEditActiveProduct}
                                value={activeProduct.economics.discountPct}
                                onChange={(e) => {
                                  updateProduct(activeProduct.id, {
                                    economics: {
                                      ...activeProduct.economics,
                                      discountPct: Number(e.target.value) || 0,
                                    },
                                  });
                                }}
                                className="w-full h-11 rounded-xl bg-white border border-[#E8E8E5] px-3.5 font-semibold"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#E8E8E5]">
                            <div>
                              <div className="text-[12px] text-[#737373]">Чистая выручка</div>
                              <div className="text-[18px] font-bold mt-0.5">
                                {formatCurrencyRub(res.netRevenuePerUnit)}
                              </div>
                            </div>
                            <div>
                              <div className="text-[12px] text-[#737373]">
                                Переменные расх.
                              </div>
                              <div className="text-[18px] font-bold mt-0.5">
                                {formatCurrencyRub(res.totalVariableCostsPerUnit)}
                              </div>
                            </div>
                            <div>
                              <div className="text-[12px] text-[#737373]">
                                Прибыль на 1 шт.
                              </div>
                              <div className="text-[18px] font-bold text-[#16805D] mt-0.5">
                                {formatCurrencyRub(res.unitProfitRub)}
                              </div>
                            </div>
                            <div>
                              <div className="text-[12px] text-[#737373]">Чистая маржа</div>
                              <div className="text-[18px] font-bold text-[#171717] mt-0.5">
                                {res.marginPct}%
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="rounded-xl border border-dashed border-[#E8E8E5] p-6 text-[15px] text-[#737373] flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      <span>Себестоимость и маржа скрыты для вашей роли</span>
                    </div>
                  )}
                </div>

                {/* 5. Продажи и каналы (п. 6 ТЗ) */}
                <div className="space-y-4">
                  <h3 className="text-[19px] font-bold border-b border-[#E8E8E5] pb-2">
                    5. Продажи и каналы дистрибуции
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="rounded-xl border border-[#E8E8E5] p-4">
                      <div className="text-[12px] text-[#737373]">Продано штук</div>
                      <div className="text-[20px] font-bold text-[#171717] mt-1">
                        {activeProduct.unitsSold.toLocaleString('ru-RU')} шт.
                      </div>
                    </div>
                    <div className="rounded-xl border border-[#E8E8E5] p-4">
                      <div className="text-[12px] text-[#737373]">Выручка модели</div>
                      <div className="text-[20px] font-bold text-[#171717] mt-1">
                        {hasFinance
                          ? formatCurrencyRub(activeProduct.revenueRub)
                          : 'Скрыто'}
                      </div>
                    </div>
                    <div className="rounded-xl border border-[#E8E8E5] p-4">
                      <div className="text-[12px] text-[#737373]">Опер. прибыль</div>
                      <div className="text-[20px] font-bold text-[#16805D] mt-1">
                        {hasFinance
                          ? formatCurrencyRub(activeProduct.operatingProfitRub)
                          : 'Скрыто'}
                      </div>
                    </div>
                    <div className="rounded-xl border border-[#E8E8E5] p-4">
                      <div className="text-[12px] text-[#737373]">Динамика к м/м</div>
                      <div className="text-[20px] font-bold text-[#16805D] mt-1">
                        +{activeProduct.monthlyDynamicsPct}%
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <span className="text-[13px] font-semibold text-[#737373]">
                      Активные каналы продаж:
                    </span>
                    {activeProduct.salesChannels.map((ch) => (
                      <span
                        key={ch}
                        className="px-3 py-1 rounded-lg bg-[#F7F7F5] border border-[#E8E8E5] text-[13px] font-semibold text-[#171717]"
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ВКЛАДКА 4: СВЯЗАННЫЕ СУЩНОСТИ (R&D, ЗАПУСКИ, КАМПАНИИ, ЗАДАЧИ, ДОКУМЕНТЫ) */}
            {drawerTab === 'relations' && (
              <div className="space-y-6 text-[15px]">
                <h3 className="text-[19px] font-bold border-b border-[#E8E8E5] pb-2">
                  6. Связанные разделы экосистемы BORNERS GROUP
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Запуски */}
                  {launches
                    .filter((l) => l.productIds.includes(activeProduct.id))
                    .map((l) => (
                      <div
                        key={l.id}
                        onClick={() => {
                          setSelectedProductId(null);
                          navigateTo('launch-calendar', { launchId: l.id });
                        }}
                        className="rounded-xl border border-[#E8E8E5] p-4 hover:bg-[#F7F7F5] cursor-pointer transition flex items-center justify-between"
                      >
                        <div>
                          <div className="text-[11px] font-semibold uppercase text-[#737373]">
                            Запуск в календаре · {l.startDate}
                          </div>
                          <div className="text-[15px] font-bold text-[#171717] mt-0.5">
                            {l.name}
                          </div>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-[#171717]" />
                      </div>
                    ))}

                  {/* Прототип R&D */}
                  {activeProduct.conceptId && (
                    <div
                      onClick={() => {
                        const cId = activeProduct.conceptId!;
                        setSelectedProductId(null);
                        navigateTo('product-lab', { conceptId: cId });
                      }}
                      className="rounded-xl border border-[#E8E8E5] p-4 hover:bg-[#F7F7F5] cursor-pointer transition flex items-center justify-between"
                    >
                      <div>
                        <div className="text-[11px] font-semibold uppercase text-[#737373]">
                          Прототип R&D
                        </div>
                        <div className="text-[15px] font-bold text-[#171717] mt-0.5">
                          {concepts.find((c) => c.id === activeProduct.conceptId)?.name ||
                            'Открыть карточку R&D'}
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-[#171717]" />
                    </div>
                  )}

                  {/* Маркетинговые кампании */}
                  {campaigns
                    .filter((camp) => camp.productIds.includes(activeProduct.id))
                    .map((camp) => (
                      <div
                        key={camp.id}
                        onClick={() => {
                          setSelectedProductId(null);
                          navigateTo('marketing-growth');
                        }}
                        className="rounded-xl border border-[#E8E8E5] p-4 hover:bg-[#F7F7F5] cursor-pointer transition flex items-center justify-between"
                      >
                        <div>
                          <div className="text-[11px] font-semibold uppercase text-[#737373]">
                            Маркетинговая кампания · {camp.channel}
                          </div>
                          <div className="text-[15px] font-bold text-[#171717] mt-0.5">
                            {camp.name}
                          </div>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-[#171717]" />
                      </div>
                    ))}

                  {/* Задачи */}
                  {tasks
                    .filter((t) => t.productId === activeProduct.id)
                    .map((t) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          setSelectedProductId(null);
                          navigateTo('roadmap-tasks');
                        }}
                        className="rounded-xl border border-[#E8E8E5] p-4 hover:bg-[#F7F7F5] cursor-pointer transition flex items-center justify-between"
                      >
                        <div>
                          <div className="text-[11px] font-semibold uppercase text-[#737373]">
                            Задача · Срок {t.deadline}
                          </div>
                          <div className="text-[15px] font-bold text-[#171717] mt-0.5">
                            {t.title}
                          </div>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-[#171717]" />
                      </div>
                    ))}

                  {/* Документы */}
                  {documents
                    .filter((d) => d.productId === activeProduct.id)
                    .map((d) => (
                      <div
                        key={d.id}
                        onClick={() => {
                          setSelectedProductId(null);
                          navigateTo('documents');
                        }}
                        className="rounded-xl border border-[#E8E8E5] p-4 hover:bg-[#F7F7F5] cursor-pointer transition flex items-center justify-between"
                      >
                        <div>
                          <div className="text-[11px] font-semibold uppercase text-[#737373]">
                            Документ · {d.fileType}
                          </div>
                          <div className="text-[15px] font-bold text-[#171717] mt-0.5">
                            {d.title}
                          </div>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-[#171717]" />
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Кнопка удаления в корзину */}
            {canEditActiveProduct && (
              <div className="pt-6 border-t border-[#E8E8E5] flex justify-between items-center">
                <button
                  onClick={() => {
                    archiveEntity('product', activeProduct.id);
                    setSelectedProductId(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#C94B4B] px-4 py-2.5 text-[14px] font-semibold text-[#C94B4B] hover:bg-[#C94B4B] hover:text-white transition cursor-pointer"
                >
                  <Archive className="h-4 w-4" />
                  <span>Удалить в корзину</span>
                </button>
                <span className="text-[13px] text-[#737373]">
                  Обновлено: {activeProduct.updatedAt}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Модальное окно создания модели */}
      {createModalOpen && (
        <div
          onClick={() => setCreateModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-white rounded-2xl border border-[#E8E8E5] p-8 space-y-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#E8E8E5] pb-4">
              <h3 className="text-[22px] font-bold">Новая модель в каталоге</h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-[13px] font-semibold text-[#737373] hover:text-[#171717] cursor-pointer"
              >
                Закрыть
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[14px]">
              <div>
                <label className="block font-semibold mb-1.5">Артикул (SKU)</label>
                <input
                  value={newSkuForm.sku}
                  onChange={(e) => setNewSkuForm({ ...newSkuForm, sku: e.target.value })}
                  className="w-full h-11 rounded-xl border border-[#E8E8E5] px-3.5 text-[15px]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1.5">Бренд</label>
                <select
                  value={newSkuForm.brandId}
                  onChange={(e) => setNewSkuForm({ ...newSkuForm, brandId: e.target.value })}
                  className="w-full h-11 rounded-xl border border-[#E8E8E5] px-3.5 text-[15px] bg-white font-medium"
                >
                  <option value="BORNERS">BORNERS</option>
                  <option value="NA_TELE">НА ТЕЛЕ</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1.5">Наименование модели</label>
                <input
                  value={newSkuForm.name}
                  onChange={(e) => setNewSkuForm({ ...newSkuForm, name: e.target.value })}
                  placeholder="Например: Боксеры BORNERS Architect Modal"
                  className="w-full h-11 rounded-xl border border-[#E8E8E5] px-3.5 text-[15px]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1.5">Категория</label>
                <select
                  value={newSkuForm.category}
                  onChange={(e) =>
                    setNewSkuForm({
                      ...newSkuForm,
                      category: e.target.value as Product['category'],
                    })
                  }
                  className="w-full h-11 rounded-xl border border-[#E8E8E5] px-3.5 text-[15px] bg-white"
                >
                  <option value="Боксеры">Боксеры</option>
                  <option value="Транки">Транки</option>
                  <option value="Брифы">Брифы</option>
                  <option value="Мультипак">Мультипак</option>
                  <option value="Лимитированная капсула">Лимитированная капсула</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1.5">Коллекция</label>
                <input
                  value={newSkuForm.collection}
                  onChange={(e) =>
                    setNewSkuForm({ ...newSkuForm, collection: e.target.value })
                  }
                  className="w-full h-11 rounded-xl border border-[#E8E8E5] px-3.5 text-[15px]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1.5">Розничная цена (РРЦ, ₽)</label>
                <input
                  type="number"
                  value={newSkuForm.plannedRetailPrice}
                  onChange={(e) =>
                    setNewSkuForm({ ...newSkuForm, plannedRetailPrice: e.target.value })
                  }
                  className="w-full h-11 rounded-xl border border-[#E8E8E5] px-3.5 text-[15px]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1.5">Себестоимость пошива (₽)</label>
                <input
                  type="number"
                  value={newSkuForm.unitCostPrice}
                  onChange={(e) =>
                    setNewSkuForm({ ...newSkuForm, unitCostPrice: e.target.value })
                  }
                  className="w-full h-11 rounded-xl border border-[#E8E8E5] px-3.5 text-[15px]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1.5">Фото / рендер модели (опционально)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const r = new FileReader();
                    r.onload = () => {
                      if (typeof r.result === 'string') {
                        setNewSkuForm((prev) => ({ ...prev, imageUrl: r.result as string }));
                      }
                    };
                    r.readAsDataURL(f);
                  }}
                  className="w-full text-[13px] text-[#737373]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#E8E8E5]">
              <button
                onClick={() => setCreateModalOpen(false)}
                className="h-11 px-5 rounded-xl border border-[#E8E8E5] text-[14px] font-semibold cursor-pointer"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateProduct}
                className="h-11 px-6 rounded-xl bg-[#111111] text-white text-[14px] font-semibold cursor-pointer"
              >
                Создать модель
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
