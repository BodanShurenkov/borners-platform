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
    <div className="space-y-10 pb-20">
      {/* Заголовок страницы (32–40px по ТЗ) */}
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-[#E8E8E5] pb-6">
        <div>
          <div className="text-[13px] font-medium uppercase tracking-widest text-[#737373] mb-1.5">
            Портфель группы · {activeBrands.length} активных бренда + {upcomingBrands.length} в проработке
          </div>
          <h1 className="text-[34px] md:text-[40px] font-bold tracking-[-0.03em] text-[#171717] dark:text-white">
            Портфель брендов
          </h1>
        </div>

        {canCreateBrand && (
          <button
            onClick={() => setShowNewBrandModal(true)}
            className="inline-flex items-center gap-2 h-11 rounded-xl bg-[#111111] text-white px-5 text-[15px] font-semibold hover:bg-neutral-800 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Добавить бренд</span>
          </button>
        )}
      </div>

      {/* Крупные карточки брендов с предметной съёмкой */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeBrands.map((brand) => {
          const isBorners = brand.code === 'BORNERS';
          const accentColor = isBorners ? '#D97745' : '#8B8078';
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
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-[#E8E8E5] dark:border-zinc-800 p-7 md:p-8 flex flex-col justify-between space-y-6"
            >
              <div className="space-y-6">
                {/* Чистый предметный кадр коллекции */}
                <div className="h-52 w-full rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] flex items-center justify-center p-6">
                  <img
                    src={brand.heroImage}
                    alt={brand.name}
                    className="h-full w-full object-contain"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2.5 text-[13px] font-semibold uppercase tracking-wider text-[#737373]">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: accentColor }}
                    />
                    <span>{brand.segment}</span>
                  </div>
                  <h2 className="text-[28px] md:text-[32px] font-bold tracking-tight text-[#171717] dark:text-white mt-1">
                    {brand.name}
                  </h2>
                  <p className="text-[16px] text-[#171717] mt-1.5 font-medium">
                    {brand.tagline}
                  </p>
                  <p className="text-[15px] text-[#737373] mt-3 leading-relaxed">
                    {brand.description}
                  </p>
                </div>

                {/* Ключевые показатели бренда */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 pt-5 border-t border-[#E8E8E5]">
                  <div>
                    <div className="text-[13px] text-[#737373]">План 2027</div>
                    <div className="text-[22px] font-bold text-[#171717] dark:text-white mt-0.5">
                      {hasFinance
                        ? formatCompactRub(brand.plannedRevenue2027Rub)
                        : 'Скрыто'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[13px] text-[#737373]">Целевая маржа</div>
                    <div className="text-[22px] font-bold text-[#171717] dark:text-white mt-0.5">
                      {hasFinance ? `${brand.targetMarginPct}%` : 'Скрыто'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[13px] text-[#737373]">В каталоге</div>
                    <div className="text-[22px] font-bold text-[#171717] dark:text-white mt-0.5">
                      {bProducts.length} SKU
                    </div>
                  </div>
                  <div>
                    <div className="text-[13px] text-[#737373]">R&D / Запуски</div>
                    <div className="text-[22px] font-bold text-[#171717] dark:text-white mt-0.5">
                      {bConcepts.length} / {bLaunches.length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Действия */}
              <div className="pt-5 border-t border-[#E8E8E5] flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setBrandFilter(brand.code);
                    navigateTo('brand-strategy');
                  }}
                  className="inline-flex items-center gap-2 h-11 rounded-xl bg-[#111111] text-white px-5 text-[15px] font-semibold hover:bg-neutral-800 transition cursor-pointer"
                >
                  <span>Стратегия (14 блоков)</span>
                  <ArrowUpRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setBrandFilter(brand.code);
                    navigateTo('product-catalog');
                  }}
                  className="h-11 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] text-[#171717] px-5 text-[15px] font-semibold hover:border-[#171717] transition cursor-pointer"
                >
                  Каталог ({bProducts.length})
                </button>
                <button
                  onClick={() => {
                    setBrandFilter(brand.code);
                    navigateTo('product-lab');
                  }}
                  className="h-11 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] text-[#171717] px-5 text-[15px] font-semibold hover:border-[#171717] transition cursor-pointer"
                >
                  R&D ({bConcepts.length})
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* НОВЫЕ БРЕНДЫ В ПРОРАБОТКЕ СТРАТЕГИИ: АКУША И LISKANI */}
      {upcomingBrands.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[22px] font-bold text-[#171717] dark:text-white">
              Новые бренды в проработке стратегии
            </h3>
            <span className="text-[13px] font-medium text-[#737373]">
              Статус: формирование позиционирования и ассортиментной матрицы
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {upcomingBrands.map((brand) => (
              <div
                key={brand.id}
                className="bg-white/65 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-[#E8E8E5] p-7 flex flex-col justify-between space-y-5 opacity-85"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-[#737373]">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#A3A39E]" />
                      <span>{brand.segment}</span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#F7F7F5] border border-[#E8E8E5] text-[12px] font-semibold text-[#737373]">
                      <span className="h-2 w-2 rounded-full bg-[#D99527]" />
                      <span>{brand.statusNote || 'Ведётся проработка стратегии'}</span>
                    </span>
                  </div>

                  <div>
                    <h2 className="text-[26px] font-bold text-[#171717] dark:text-white">
                      {brand.name}
                    </h2>
                    <p className="text-[15px] font-medium text-[#171717] mt-1">
                      {brand.tagline}
                    </p>
                    <p className="text-[14px] text-[#737373] mt-2 leading-relaxed">
                      {brand.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-dashed border-[#E8E8E5] flex items-center justify-between text-[13px] text-[#737373]">
                  <span>Каталог SKU и финплан: в разработке</span>
                  <span className="font-semibold">Старт проработки: 2026–2027</span>
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
    brandFilter,
    setBrandFilter,
    updateStrategyBlock,
    navigateTo,
    notify,
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
    <div className="space-y-10 pb-20">
      {/* Шапка стратегии */}
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-[#E8E8E5] pb-6">
        <div>
          <div className="text-[13px] font-medium uppercase tracking-widest text-[#737373] mb-1.5">
            Стратегический паспорт · {brandBlocks.length} блоков
          </div>
          <h1 className="text-[34px] md:text-[40px] font-bold tracking-[-0.03em] text-[#171717] dark:text-white">
            Стратегия: {activeBrand.name}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-[#F7F7F5] p-1 rounded-xl border border-[#E8E8E5]">
            {brands.map((b) => {
              if (b.isStrategyInDevelopment) {
                return (
                  <button
                    key={b.id}
                    type="button"
                    title="Неактивен · Ведётся проработка стратегии"
                    onClick={() =>
                      notify(
                        'warning',
                        `Бренд «${b.name}» в разработке`,
                        'Сейчас ведётся проработка стратегии бренда'
                      )
                    }
                    className="px-3.5 py-2 rounded-lg text-[14px] font-medium text-[#737373]/70 cursor-not-allowed inline-flex items-center gap-1.5"
                  >
                    <span>{b.name}</span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-white/80 border border-[#E8E8E5]">
                      в проработке
                    </span>
                  </button>
                );
              }
              const active = b.code === activeBrand.code;
              return (
                <button
                  key={b.id}
                  onClick={() => setBrandFilter(b.code)}
                  className={`px-4 py-2 rounded-lg text-[14px] font-semibold transition cursor-pointer ${
                    active
                      ? 'bg-white text-[#171717] shadow-2xs'
                      : 'text-[#737373] hover:text-[#171717]'
                  }`}
                >
                  {b.name}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => navigateTo('product-catalog')}
            className="h-11 px-5 rounded-xl border border-[#E8E8E5] bg-white text-[14px] font-semibold hover:bg-[#111111] hover:text-white transition cursor-pointer"
          >
            Каталог моделей →
          </button>
        </div>
      </div>

      {/* Сетка 14 блоков стратегии */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-[#E8E8E5] p-7 flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-[#E8E8E5] pb-4">
                  <div className="flex items-baseline gap-3">
                    <span className="text-[13px] font-semibold text-[#737373]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h3 className="text-[22px] font-bold text-[#171717] dark:text-white">
                      {block.titleRu}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="inline-flex items-center gap-2 text-[13px] font-medium text-[#171717]">
                      <span className={`h-2.5 w-2.5 rounded-full ${st.dotColor}`} />
                      <span>{st.label}</span>
                    </span>

                    <button
                      onClick={() => setHistoryBlock(block)}
                      title="История версий"
                      className="rounded-lg bg-[#F7F7F5] border border-[#E8E8E5] hover:border-[#171717] px-2.5 py-1 text-[12px] font-semibold text-[#737373] hover:text-[#171717] cursor-pointer"
                    >
                      v{block.version}
                    </button>

                    {canEditBlock ? (
                      <button
                        onClick={() => openEditor(block)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8E8E5] px-3 py-1 text-[13px] font-semibold text-[#171717] hover:bg-[#111111] hover:text-white transition cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Изменить</span>
                      </button>
                    ) : (
                      isLockedForManager && (
                        <span
                          title="Утверждённый блок защищён от изменений"
                          className="inline-flex items-center gap-1 text-[12px] text-[#737373]"
                        >
                          <Lock className="h-3.5 w-3.5" />
                        </span>
                      )
                    )}
                  </div>
                </div>

                {/* Ключевой тезис */}
                <p className="text-[17px] font-semibold text-[#171717] dark:text-zinc-200 leading-snug">
                  {block.summary}
                </p>

                {/* Пункты содержания */}
                <ul className="space-y-2.5 text-[15px] text-[#737373] dark:text-zinc-400">
                  {bulletLines.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-3 leading-relaxed">
                      <span className="text-[14px] font-bold text-[#171717] shrink-0 mt-0.5">
                        •
                      </span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Опорные показатели блока */}
              <div className="pt-5 border-t border-[#E8E8E5] grid grid-cols-1 sm:grid-cols-3 gap-4">
                {block.kpiHighlights.map((m, idx) => (
                  <div key={idx}>
                    <div className="text-[12px] text-[#737373]">{m.label}</div>
                    <div className="text-[16px] font-bold text-[#171717] dark:text-white mt-0.5">
                      {m.value}
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
