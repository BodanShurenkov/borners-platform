'use client';

import React, { useState, useMemo } from 'react';
import {
  Edit3,
  Lock,
  Plus,
  ArrowUpRight,
} from 'lucide-react';
import { usePlatform } from '@/context/PlatformContext';
import { ApprovalStatus, StrategyBlock } from '@/types/platform';
import {
  canUserEditApprovedStrategy,
  canUserEditBrand,
  canUserViewFinance,
  formatCompactRub,
} from '@/lib/finance';

const STATUS_LABELS: Record<ApprovalStatus, { label: string; dotColor: string }> = {
  draft: {
    label: 'Черновик',
    dotColor: 'bg-[#737373]',
  },
  in_review: {
    label: 'На согласовании',
    dotColor: 'bg-[#D99527]',
  },
  approved: {
    label: 'Утверждено',
    dotColor: 'bg-[#16805D]',
  },
};

export function BrandPortfolioView() {
  const {
    brands,
    products,
    concepts,
    launches,
    currentUser,
    platformMode,
    navigateTo,
    setBrandFilter,
    createBrand,
  } = usePlatform();

  const [showNewBrandModal, setShowNewBrandModal] = useState(false);
  const [newBrandForm, setNewBrandForm] = useState({
    code: '',
    name: '',
    tagline: '',
    segment: 'Премиум-капсула',
    accentColor: '#D97745',
  });

  const hasFinance = canUserViewFinance(currentUser);
  const canCreateBrand =
    platformMode === 'management' &&
    (currentUser.role === 'Owner' || currentUser.role === 'Admin');

  const activeBrands = brands.filter((b) => !b.isStrategyInDevelopment);
  const upcomingBrands = brands.filter((b) => b.isStrategyInDevelopment);

  return (
    <div className="space-y-8 pb-20">
      {/* Заголовок страницы в стиле швейцарского ателье */}
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-[#E5E0D8] pb-6">
        <div>
          <div className="flex items-center gap-2.5 text-[11px] font-mono uppercase tracking-[0.2em] text-[#7A756D] mb-2">
            <span>PORTFOLIO ARCHITECTURE</span>
            <span>·</span>
            <span>{activeBrands.length} АКТИВНЫХ БРЕНДА + {upcomingBrands.length} В ПРОРАБОТКЕ</span>
          </div>
          <h1 className="font-serif-editorial text-[34px] md:text-[42px] font-medium tracking-[-0.02em] text-[#161615] leading-[1.08]">
            Портфель брендов и ДНК
          </h1>
        </div>

        {canCreateBrand && (
          <button
            onClick={() => setShowNewBrandModal(true)}
            className="inline-flex items-center gap-2 h-9 rounded-[6px] bg-[#161615] text-[#F8F6F2] px-4 text-[12px] font-medium hover:bg-[#2C2B29] transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Добавить бренд</span>
          </button>
        )}
      </div>

      {/* Крупные карточки брендов со студийной съёмкой */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeBrands.map((brand) => {
          const isBorners = brand.code === 'BORNERS';
          const accentColor = isBorners ? '#161615' : '#8B8078';
          const bProducts = products.filter(
            (p) => !p.isArchived && (p.brandId === brand.code || p.brandId === brand.id)
          );
          const bConcepts = concepts.filter(
            (c) => !c.isArchived && (c.brandId === brand.code || c.brandId === brand.id)
          );
          const bLaunches = launches.filter(
            (l) => !l.isArchived && (l.brandId === brand.code || l.brandId === brand.id)
          );

          return (
            <div
              key={brand.id}
              className="bg-[#FDFCFA] rounded-[8px] border border-[#E5E0D8] overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Студийный кадр коллекции */}
                <div className="relative h-60 w-full bg-[#F2EFE9] border-b border-[#E5E0D8] overflow-hidden">
                  <img
                    src={brand.heroImage}
                    alt={brand.name}
                    className="h-full w-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
                  <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between text-white">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/80">
                        {brand.segment}
                      </div>
                      <h2 className="font-serif-editorial text-[32px] font-medium tracking-tight leading-none mt-1">
                        {brand.name}
                      </h2>
                    </div>
                    <span className="px-2.5 py-1 rounded-[4px] bg-black/55 backdrop-blur-xs text-[11px] font-mono uppercase tracking-[0.14em]">
                      Маржа {brand.targetMarginPct}%
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.16em] text-[#7A756D]">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: accentColor }}
                      />
                      <span>Позиционирование</span>
                    </div>
                    <p className="text-[15px] text-[#161615] mt-1.5 font-medium">
                      {brand.tagline}
                    </p>
                    <p className="text-[13px] text-[#5C5852] mt-2 leading-relaxed">
                      {brand.description}
                    </p>
                  </div>

                  {/* Ключевые показатели бренда */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#E5E0D8]">
                    <div>
                      <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#7A756D]">
                        План 2027
                      </div>
                      <div className="font-serif-editorial text-[22px] font-medium text-[#161615] mt-0.5 tabular-nums">
                        {hasFinance
                          ? formatCompactRub(brand.plannedRevenue2027Rub)
                          : 'Скрыто'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#7A756D]">
                        Целевая маржа
                      </div>
                      <div className="font-serif-editorial text-[22px] font-medium text-[#161615] mt-0.5 tabular-nums">
                        {hasFinance ? `${brand.targetMarginPct}%` : 'Скрыто'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#7A756D]">
                        В каталоге
                      </div>
                      <div className="font-serif-editorial text-[22px] font-medium text-[#161615] mt-0.5 tabular-nums">
                        {bProducts.length} SKU
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#7A756D]">
                        R&D / Запуски
                      </div>
                      <div className="font-serif-editorial text-[22px] font-medium text-[#161615] mt-0.5 tabular-nums">
                        {bConcepts.length} / {bLaunches.length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Действия */}
              <div className="px-6 py-4 bg-[#F8F6F2] border-t border-[#E5E0D8] flex flex-wrap gap-2.5">
                <button
                  onClick={() => {
                    setBrandFilter(brand.code);
                    navigateTo('brand-strategy');
                  }}
                  className="inline-flex items-center gap-1.5 h-9 rounded-[6px] bg-[#161615] text-[#F8F6F2] px-4 text-[12px] font-medium hover:bg-[#2C2B29] transition cursor-pointer"
                >
                  <span>Паспорт стратегии (14 блоков)</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    setBrandFilter(brand.code);
                    navigateTo('product-catalog');
                  }}
                  className="h-9 rounded-[6px] bg-[#FDFCFA] border border-[#E5E0D8] text-[#161615] px-3.5 text-[12px] font-medium hover:border-[#161615] transition cursor-pointer"
                >
                  Каталог ({bProducts.length})
                </button>
                <button
                  onClick={() => {
                    setBrandFilter(brand.code);
                    navigateTo('product-lab');
                  }}
                  className="h-9 rounded-[6px] bg-[#FDFCFA] border border-[#E5E0D8] text-[#161615] px-3.5 text-[12px] font-medium hover:border-[#161615] transition cursor-pointer"
                >
                  R&D ({bConcepts.length})
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* БРЕНДЫ В РАЗРАБОТКЕ: АКУША И LISKANI */}
      {upcomingBrands.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-2">
            <h3 className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[#7A756D]">
              БРЕНДЫ ПОРТФЕЛЯ В РАЗРАБОТКЕ (2026–2027)
            </h3>
            <span className="text-[12px] text-[#7A756D]">
              Формирование позиционирования и ассортиментной матрицы
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {upcomingBrands.map((brand) => (
              <div
                key={brand.id}
                className="bg-[#FDFCFA] rounded-[8px] border border-[#E5E0D8] p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#7A756D]">
                      <span className="h-2 w-2 rounded-full bg-[#A3A39E]" />
                      <span>В ПРОРАБОТКЕ СТРАТЕГИИ</span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[#F8F6F2] border border-[#E5E0D8] font-mono text-[10px] uppercase text-[#6E6A63]">
                      <span>В разработке</span>
                    </span>
                  </div>

                  <div>
                    <h2 className="font-serif-editorial text-[28px] font-semibold text-[#161615] leading-none">
                      {brand.name}
                    </h2>
                    <p className="text-[14px] font-medium text-[#161615] mt-1.5">
                      {brand.tagline}
                    </p>
                    <p className="text-[13px] text-[#6E6A63] mt-2 leading-relaxed">
                      {brand.description}
                    </p>
                  </div>
                </div>

                <div className="pt-3.5 border-t border-[#E5E0D8] flex items-center justify-between text-[12px] text-[#7A756D]">
                  <span>Каталог SKU и финплан: в разработке</span>
                  <span className="font-mono">2026–2027</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Сравнительная таблица разграничения брендов */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-[#E8E8E5] overflow-x-auto">
        <div className="p-6 border-b border-[#E8E8E5]">
          <h3 className="text-[22px] font-bold text-[#171717]">
            Разграничение брендов в портфеле группы
          </h3>
        </div>
        <table className="w-full text-left text-[15px]">
          <thead className="border-b border-[#E8E8E5] text-[13px] font-semibold uppercase tracking-wider text-[#737373] bg-[#F7F7F5]/60">
            <tr>
              <th className="py-4 px-6">Критерий</th>
              <th className="py-4 px-6">BORNERS (Мужской и унисекс базовый)</th>
              <th className="py-4 px-6">НА ТЕЛЕ (Женский вторая кожа)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E8E5]">
            <tr>
              <td className="py-4 px-6 font-semibold text-[#171717]">Роль продукта</td>
              <td className="py-4 px-6 text-[#737373]">
                Инженерная посадка, плотный модал 92% и пима-хлопок, долговечность 80+ стирок
              </td>
              <td className="py-4 px-6 text-[#737373]">
                Бесшовная лазерная обработка края (Free-cut), тактильная невесомость, 6 телесных оттенков
              </td>
            </tr>
            <tr>
              <td className="py-4 px-6 font-semibold text-[#171717]">Ценовой коридор и маржа</td>
              <td className="py-4 px-6 font-semibold text-[#171717]">1 690 – 4 990 ₽ · 72%</td>
              <td className="py-4 px-6 font-semibold text-[#171717]">1 490 – 4 490 ₽ · 75%</td>
            </tr>
            <tr>
              <td className="py-4 px-6 font-semibold text-[#171717]">Визуальный код</td>
              <td className="py-4 px-6 text-[#737373]">
                Строгий графит и терракота (#D97745), матовые тубусы и плотные зип-пакеты 180 мкм
              </td>
              <td className="py-4 px-6 text-[#737373]">
                Тёплый беж (#8B8078), макро-фактура ткани и кожи, калька и пудровый софт-тач
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Модальное окно создания нового бренда */}
      {showNewBrandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-[#E8E8E5] p-8 space-y-5 shadow-2xl">
            <h3 className="text-[22px] font-bold border-b border-[#E8E8E5] pb-4">
              Добавление нового бренда
            </h3>
            <div className="space-y-4 text-[14px]">
              <div>
                <label className="block font-semibold mb-1.5">Название бренда</label>
                <input
                  value={newBrandForm.name}
                  onChange={(e) =>
                    setNewBrandForm({
                      ...newBrandForm,
                      name: e.target.value,
                      code: e.target.value.toUpperCase().replace(/\s+/g, '_'),
                    })
                  }
                  placeholder="Например: BORNERS SPORT"
                  className="w-full h-11 rounded-xl border border-[#E8E8E5] px-3.5 text-[15px]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1.5">Слоган и идея</label>
                <input
                  value={newBrandForm.tagline}
                  onChange={(e) => setNewBrandForm({ ...newBrandForm, tagline: e.target.value })}
                  className="w-full h-11 rounded-xl border border-[#E8E8E5] px-3.5 text-[15px]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1.5">Ценовой сегмент</label>
                <input
                  value={newBrandForm.segment}
                  onChange={(e) => setNewBrandForm({ ...newBrandForm, segment: e.target.value })}
                  className="w-full h-11 rounded-xl border border-[#E8E8E5] px-3.5 text-[15px]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-[#E8E8E5]">
              <button
                onClick={() => setShowNewBrandModal(false)}
                className="h-11 px-5 rounded-xl border border-[#E8E8E5] text-[14px] font-semibold cursor-pointer"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  if (!newBrandForm.name.trim()) return;
                  createBrand({
                    code: newBrandForm.code || 'NEW_BRAND',
                    name: newBrandForm.name.trim(),
                    tagline: newBrandForm.tagline || 'Новое направление BORNERS GROUP',
                    segment: newBrandForm.segment,
                    accentColor: newBrandForm.accentColor,
                  });
                  setShowNewBrandModal(false);
                }}
                className="h-11 px-6 rounded-xl bg-[#111111] text-white text-[14px] font-semibold cursor-pointer"
              >
                Создать бренд
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// СТРАТЕГИЯ БРЕНДА (14 СТРАТЕГИЧЕСКИХ БЛОКОВ, п. 5 ТЗ)
// =============================================================================
export function BrandStrategyView() {
  const {
    brands,
    strategies,
    currentUser,
    platformMode,
    setPlatformMode,
    brandFilter,
    setBrandFilter,
    updateStrategyBlock,
    navigateTo,
  } = usePlatform();

  const activeBrands = brands.filter((b) => !b.isStrategyInDevelopment);
  const activeBrandCode =
    brandFilter !== 'ALL' && activeBrands.some((b) => b.code === brandFilter || b.id === brandFilter)
      ? brandFilter
      : activeBrands[0]?.code || 'BORNERS';

  const activeBrand = useMemo(
    () =>
      activeBrands.find((b) => b.code === activeBrandCode || b.id === activeBrandCode) ||
      activeBrands[0],
    [activeBrands, activeBrandCode]
  );

  const brandBlocks = useMemo(
    () =>
      strategies
        .filter(
          (s) =>
            s.brandId === activeBrand?.code || s.brandId === activeBrand?.id
        )
        .sort((a, b) => a.sectionOrder - b.sectionOrder),
    [strategies, activeBrand]
  );

  const [editingBlock, setEditingBlock] = useState<StrategyBlock | null>(null);
  const [historyBlock, setHistoryBlock] = useState<StrategyBlock | null>(null);

  const [formState, setFormState] = useState<{
    summary: string;
    content: string;
    metricsText: string;
    status: ApprovalStatus;
    changeSummary: string;
  }>({
    summary: '',
    content: '',
    metricsText: '',
    status: 'draft',
    changeSummary: '',
  });

  if (!activeBrand) {
    return null;
  }

  const canEditThisBrand =
    platformMode === 'management' && canUserEditBrand(currentUser, activeBrand.code);
  const canEditApproved = canUserEditApprovedStrategy(currentUser);

  const openEditor = (block: StrategyBlock) => {
    setEditingBlock(block);
    setFormState({
      summary: block.summary,
      content: block.content,
      metricsText: block.kpiHighlights.map((m) => `${m.label}: ${m.value}`).join('\n'),
      status: block.status,
      changeSummary: '',
    });
  };

  const handleSaveBlock = () => {
    if (!editingBlock) return;
    const parsedMetrics = formState.metricsText
      .split('\n')
      .map((line) => {
        const idx = line.indexOf(':');
        if (idx === -1) return null;
        return {
          label: line.slice(0, idx).trim(),
          value: line.slice(idx + 1).trim(),
        };
      })
      .filter((x): x is { label: string; value: string } => x !== null && Boolean(x.label));

    updateStrategyBlock(
      editingBlock.id,
      {
        summary: formState.summary.trim() || editingBlock.summary,
        content: formState.content.trim() || editingBlock.content,
        kpiHighlights:
          parsedMetrics.length > 0 ? parsedMetrics : editingBlock.kpiHighlights,
        status: formState.status,
      },
      formState.changeSummary.trim() || `Обновлён блок «${editingBlock.titleRu}»`
    );
    setEditingBlock(null);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Шапка стратегии в спокойной редакционной эстетике */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#EAE6DF] pb-6">
        <div>
          <div className="text-[12px] font-medium text-[#8C867E] mb-1.5">
            Паспорт бренда · 14 стратегических блоков ДНК
          </div>
          <h1 className="font-serif-editorial text-[34px] md:text-[42px] font-normal tracking-[-0.015em] text-[#181715] leading-[1.08]">
            Стратегия бренда: {activeBrand.name}
          </h1>
          <p className="text-[13.5px] text-[#6E6A63] mt-1.5">
            {activeBrand.tagline} · целевая валовая маржа {activeBrand.targetMarginPct}%
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center h-9 bg-[#F2EFE9] p-0.5 rounded-[6px] border border-[#E5E0D8]">
            {activeBrands.map((b) => {
              const isSelected = b.code === activeBrand.code;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBrandFilter(b.code)}
                  className={`h-full px-3 rounded-[4px] text-[12px] font-medium transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#FDFCFA] text-[#161615] shadow-2xs'
                      : 'text-[#5C5852] hover:text-[#161615]'
                  }`}
                >
                  {b.name}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPlatformMode('strategy')}
            className="h-9 px-3.5 rounded-[6px] bg-[#161615] text-[#F8F6F2] text-[12px] font-medium hover:bg-[#2C2B29] transition cursor-pointer"
          >
            Презентация стратегии (8 слайдов)
          </button>

          <button
            onClick={() => navigateTo('product-catalog')}
            className="h-9 px-3.5 rounded-[6px] border border-[#E5E0D8] bg-[#FDFCFA] text-[12px] font-medium text-[#161615] hover:border-[#161615] transition cursor-pointer"
          >
            Каталог моделей →
          </button>
        </div>
      </div>

      {/* Сетка 14 блоков стратегии */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {brandBlocks.map((block, index) => {
          const st = STATUS_LABELS[block.status];
          const isLockedForManager = block.status === 'approved' && !canEditApproved;
          const canEditBlock = canEditThisBrand && !isLockedForManager;
          const bulletLines = block.content
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean);

          return (
            <div
              key={block.id}
              className="bg-[#FDFCFA] rounded-[8px] border border-[#E5E0D8] p-6 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-[#E5E0D8] pb-3.5">
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#8E8880]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h3 className="font-serif-editorial text-[24px] font-medium text-[#161615]">
                      {block.titleRu}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[#F2EFE9] border border-[#E5E0D8] text-[11px] font-medium text-[#161615]">
                      <span className={`h-1.5 w-1.5 rounded-full ${st.dotColor}`} />
                      <span>{st.label}</span>
                    </span>

                    <button
                      onClick={() => setHistoryBlock(block)}
                      title="История версий"
                      className="rounded-[4px] bg-[#F8F6F2] border border-[#E5E0D8] hover:border-[#161615] px-2 py-0.5 text-[11px] font-mono text-[#7A756D] hover:text-[#161615] cursor-pointer"
                    >
                      v{block.version}
                    </button>

                    {canEditBlock ? (
                      <button
                        onClick={() => openEditor(block)}
                        className="inline-flex items-center gap-1 rounded-[4px] border border-[#E5E0D8] px-2.5 py-0.5 text-[11px] font-medium text-[#161615] hover:bg-[#161615] hover:text-[#F8F6F2] transition cursor-pointer"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>Изменить</span>
                      </button>
                    ) : (
                      isLockedForManager && (
                        <span
                          title="Утверждённый блок защищён от изменений"
                          className="inline-flex items-center gap-1 text-[11px] text-[#7A756D]"
                        >
                          <Lock className="h-3 w-3" />
                        </span>
                      )
                    )}
                  </div>
                </div>

                {/* Ключевой тезис */}
                <p className="text-[15px] font-medium text-[#161615] leading-snug">
                  {block.summary}
                </p>

                {/* Пункты содержания */}
                <ul className="space-y-2 text-[13px] text-[#5C5852]">
                  {bulletLines.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                      <span className="text-[11px] font-mono text-[#8E8880] shrink-0 mt-0.5">
                        —
                      </span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Опорные показатели блока — без обрезания слов и без технических рамок */}
              <div className="pt-4 border-t border-[#EAE6DF] grid grid-cols-1 sm:grid-cols-2 gap-4">
                {block.kpiHighlights.map((m, idx) => (
                  <div key={idx} className="rounded-[8px] bg-[#FAF8F5] border border-[#EAE6DF] px-3.5 py-2.5">
                    <div className="text-[11.5px] text-[#7A756D] leading-snug">
                      {m.label}
                    </div>
                    <div className="text-[14px] font-semibold text-[#181715] mt-0.5 tabular-nums">
                      {m.value.replace(/\s*\(ДЕМО\)/gi, '')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* МОДАЛЬНОЕ ОКНО РЕДАКТИРОВАНИЯ БЛОКА */}
      {editingBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl border border-[#E8E8E5] p-8 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E8E8E5] pb-4">
              <div>
                <div className="text-[12px] font-semibold uppercase text-[#737373]">
                  Редактирование блока стратегии ({activeBrand.name})
                </div>
                <h3 className="text-[22px] font-bold text-[#171717] dark:text-white mt-1">
                  {editingBlock.titleRu}
                </h3>
              </div>
              <button
                onClick={() => setEditingBlock(null)}
                className="text-[13px] font-semibold text-[#737373] hover:text-[#171717] cursor-pointer"
              >
                Закрыть
              </button>
            </div>

            <div className="space-y-4 text-[14px]">
              <div>
                <label className="block font-semibold mb-1.5">Статус согласования</label>
                <select
                  value={formState.status}
                  onChange={(e) =>
                    setFormState({ ...formState, status: e.target.value as ApprovalStatus })
                  }
                  className="w-full h-11 rounded-xl border border-[#E8E8E5] px-3.5 text-[15px] bg-white font-medium"
                >
                  <option value="draft">Черновик</option>
                  <option value="in_review">На согласовании</option>
                  {canEditApproved && <option value="approved">Утверждено</option>}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1.5">Главный тезис</label>
                <input
                  value={formState.summary}
                  onChange={(e) => setFormState({ ...formState, summary: e.target.value })}
                  className="w-full h-11 rounded-xl border border-[#E8E8E5] px-3.5 text-[15px]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1.5">
                  Положения стратегии (каждый пункт с новой строки)
                </label>
                <textarea
                  rows={5}
                  value={formState.content}
                  onChange={(e) => setFormState({ ...formState, content: e.target.value })}
                  className="w-full rounded-xl border border-[#E8E8E5] p-3.5 text-[15px]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1.5">
                  Показатели (формат «Показатель: Значение» с новой строки)
                </label>
                <textarea
                  rows={3}
                  value={formState.metricsText}
                  onChange={(e) =>
                    setFormState({ ...formState, metricsText: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#E8E8E5] p-3.5 text-[14px]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1.5">Комментарий к версии</label>
                <input
                  value={formState.changeSummary}
                  onChange={(e) =>
                    setFormState({ ...formState, changeSummary: e.target.value })
                  }
                  placeholder="Например: Уточнены ориентиры маржи на 2027 год"
                  className="w-full h-11 rounded-xl border border-[#E8E8E5] px-3.5 text-[15px]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#E8E8E5]">
              <button
                onClick={() => setEditingBlock(null)}
                className="h-11 px-5 rounded-xl border border-[#E8E8E5] text-[14px] font-semibold cursor-pointer"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveBlock}
                className="h-11 px-6 rounded-xl bg-[#111111] text-white text-[14px] font-semibold cursor-pointer"
              >
                Сохранить изменения
              </button>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛЬНОЕ ОКНО ИСТОРИИ ВЕРСИЙ */}
      {historyBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-[#E8E8E5] p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E8E8E5] pb-4">
              <div>
                <div className="text-[12px] font-semibold uppercase text-[#737373]">
                  История версий
                </div>
                <h3 className="text-[22px] font-bold mt-1">{historyBlock.titleRu}</h3>
              </div>
              <button
                onClick={() => setHistoryBlock(null)}
                className="text-[13px] font-semibold text-[#737373] hover:text-[#171717] cursor-pointer"
              >
                Закрыть
              </button>
            </div>

            <div className="space-y-4 max-h-80 overflow-y-auto divide-y divide-[#E8E8E5]">
              {historyBlock.history.map((v, idx) => (
                <div key={idx} className="pt-4 first:pt-0 text-[14px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[15px] text-[#171717]">
                      v{v.version} · {v.authorName}
                    </span>
                    <span className="text-[13px] text-[#737373]">{v.updatedAt}</span>
                  </div>
                  <p className="text-[#737373]">{v.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
