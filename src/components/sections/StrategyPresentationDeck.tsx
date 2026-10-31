'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Expand,
  Layers,
  LayoutGrid,
  Minimize2,
  Printer,
  Sparkles,
} from 'lucide-react';
import { usePlatform } from '@/context/PlatformContext';
import { ConceptStage, FinancialScenario } from '@/types/platform';
import {
  CONCEPT_STAGE_LABELS_RU,
  SCENARIO_LABELS_RU,
  calculateUnitEconomics,
  canUserViewCostPrice,
  canUserViewFinance,
  formatCompactRub,
  formatCurrencyRub,
} from '@/lib/finance';

interface SlideMeta {
  id: string;
  num: string;
  shortTitle: string;
  title: string;
  subtitle: string;
}

const PRESENTATION_SLIDES: SlideMeta[] = [
  {
    id: 'manifesto',
    num: '01',
    shortTitle: 'Манифест и Видение',
    title: 'BORNERS GROUP · Стратегия 2026–2027',
    subtitle: 'Создание нового поколения бельевых брендов на базе живой продуктовой системы',
  },
  {
    id: 'brand-dna',
    num: '02',
    shortTitle: 'ДНК брендов',
    title: 'Архитектура и разграничение портфеля',
    subtitle: 'Чёткое разделение ролей BORNERS и НА ТЕЛЕ без внутренней каннибализации + новые бренды в проработке',
  },
  {
    id: 'product-matrix',
    num: '03',
    shortTitle: 'Матрица 70/30 и SKU',
    title: 'Продуктовая матрица и Юнит-экономика',
    subtitle: 'Формула ассортимента: 70% регулярная высокомаржинальная база + 30% акцентные и сезонные дропы',
  },
  {
    id: 'rnd-pipeline',
    num: '04',
    shortTitle: 'Лаборатория R&D',
    title: 'Product Lab R&D: от идеи до запуска за 7 этапов',
    subtitle: 'Ни одна модель не уходит в производство без проверки рыночного спроса, образца и теста стирки',
  },
  {
    id: 'strategy-14',
    num: '05',
    shortTitle: '14 блоков стратегии',
    title: 'Стратегический паспорт брендов',
    subtitle: 'Полная система координат: от видения и боли покупателя до дистрибуции, маркетинга и рисков',
  },
  {
    id: 'launches-growth',
    num: '06',
    shortTitle: 'Запуски и Маркетинг',
    title: 'Календарь релизов и стратегия продвижения',
    subtitle: 'Синхронизация производства, контента, карточек WB / Ozon и охватных кампаний',
  },
  {
    id: 'finance-2027',
    num: '07',
    shortTitle: 'Финмодель 2027',
    title: 'Финансовая модель и сценарии 2027 года',
    subtitle: 'Помесячная динамика выручки и операционной прибыли (План / Факт) в трёх сценариях',
  },
  {
    id: 'execution',
    num: '08',
    shortTitle: 'Стратегия в работе',
    title: 'Переход от презентации к ежедневным действиям',
    subtitle: 'Стратегические цели 2026–2027, оцифрованные в конкретных модулях рабочей платформы',
  },
];

const RND_STAGES_ORDER: { stage: ConceptStage; num: string; name: string; desc: string }[] = [
  { stage: 'IDEA', num: '01', name: 'Идея', desc: 'Быстрый захват референса' },
  { stage: 'ANALYSIS', num: '02', name: 'Анализ', desc: 'Спрос и конкуренты МП' },
  { stage: 'SAMPLE', num: '03', name: 'Образец', desc: 'Пошив на фабриках' },
  { stage: 'TEST', num: '04', name: 'Тест', desc: 'Носка и 5 циклов стирки' },
  { stage: 'DECISION', num: '05', name: 'Решение', desc: 'Утверждение руководителя' },
  { stage: 'PRODUCTION', num: '06', name: 'Производство', desc: 'Заказ партии и ОТК' },
  { stage: 'LAUNCH', num: '07', name: 'Запуск', desc: 'Старт на МП и замер 7/14/28 дн.' },
];

export function StrategyPresentationDeck({
  onExitPresentation,
}: {
  onExitPresentation?: () => void;
}) {
  const {
    brands,
    strategies,
    products,
    concepts,
    launches,
    campaigns,
    financialPlans,
    strategicGoals,
    currentUser,
    brandFilter,
    setBrandFilter,
    financialScenario,
    setFinancialScenario,
    setPlatformMode,
    navigateTo,
  } = usePlatform();

  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [viewLayout, setViewLayout] = useState<'slides' | 'all'>('slides');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [strategyBrandTab, setStrategyBrandTab] = useState<'BORNERS' | 'NA_TELE'>('BORNERS');
  const [strategyChapter, setStrategyChapter] = useState<'all' | 'brand' | 'product' | 'growth' | 'finance'>('all');

  const hasFinance = canUserViewFinance(currentUser);
  const hasCost = canUserViewCostPrice(currentUser);

  // Клавиатурная навигация стрелками влево/вправо
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }
      if (viewLayout === 'slides') {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          setActiveSlideIdx((prev) => Math.min(PRESENTATION_SLIDES.length - 1, prev + 1));
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setActiveSlideIdx((prev) => Math.max(0, prev - 1));
        } else if (e.key === 'Escape' && isFullscreen) {
          setIsFullscreen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewLayout, isFullscreen]);

  const activeBrands = useMemo(
    () => brands.filter((b) => !b.isStrategyInDevelopment),
    [brands]
  );
  const upcomingBrands = useMemo(
    () => brands.filter((b) => b.isStrategyInDevelopment),
    [brands]
  );

  const filteredProducts = useMemo(
    () =>
      products.filter(
        (p) => !p.isArchived && (brandFilter === 'ALL' || p.brandId === brandFilter)
      ),
    [products, brandFilter]
  );

  const filteredConcepts = useMemo(
    () =>
      concepts.filter(
        (c) =>
          !c.isArchived &&
          !['REJECTED', 'CANCELLED'].includes(c.stage) &&
          (brandFilter === 'ALL' || c.brandId === brandFilter)
      ),
    [concepts, brandFilter]
  );

  const filteredLaunches = useMemo(
    () =>
      launches
        .filter((l) => !l.isArchived && (brandFilter === 'ALL' || l.brandId === brandFilter))
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [launches, brandFilter]
  );

  const monthlyChartData = useMemo(() => {
    const scenarioRows = financialPlans.filter(
      (r) =>
        r.scenario === financialScenario &&
        (brandFilter === 'ALL' || r.brandId === brandFilter)
    );
    const byMonth = new Map<
      string,
      {
        periodMonth: string;
        periodLabel: string;
        planRevenueM: number;
        factRevenueM: number | null;
        planProfitM: number;
        factProfitM: number | null;
        planRevenueRaw: number;
        factRevenueRaw: number | null;
        planProfitRaw: number;
        factProfitRaw: number | null;
      }
    >();

    for (const row of scenarioRows) {
      const existing = byMonth.get(row.periodMonth);
      if (!existing) {
        byMonth.set(row.periodMonth, {
          periodMonth: row.periodMonth,
          periodLabel: row.periodLabel,
          planRevenueM: Number((row.plannedRevenueRub / 1_000_000).toFixed(2)),
          factRevenueM:
            row.actualRevenueRub !== null
              ? Number((row.actualRevenueRub / 1_000_000).toFixed(2))
              : null,
          planProfitM: Number((row.plannedOperatingProfitRub / 1_000_000).toFixed(2)),
          factProfitM:
            row.actualOperatingProfitRub !== null
              ? Number((row.actualOperatingProfitRub / 1_000_000).toFixed(2))
              : null,
          planRevenueRaw: row.plannedRevenueRub,
          factRevenueRaw: row.actualRevenueRub,
          planProfitRaw: row.plannedOperatingProfitRub,
          factProfitRaw: row.actualOperatingProfitRub,
        });
      } else {
        existing.planRevenueRaw += row.plannedRevenueRub;
        existing.planRevenueM = Number((existing.planRevenueRaw / 1_000_000).toFixed(2));
        if (row.actualRevenueRub !== null) {
          existing.factRevenueRaw = (existing.factRevenueRaw ?? 0) + row.actualRevenueRub;
          existing.factRevenueM = Number((existing.factRevenueRaw / 1_000_000).toFixed(2));
        }
        existing.planProfitRaw += row.plannedOperatingProfitRub;
        existing.planProfitM = Number((existing.planProfitRaw / 1_000_000).toFixed(2));
        if (row.actualOperatingProfitRub !== null) {
          existing.factProfitRaw =
            (existing.factProfitRaw ?? 0) + row.actualOperatingProfitRub;
          existing.factProfitM = Number((existing.factProfitRaw / 1_000_000).toFixed(2));
        }
      }
    }

    return Array.from(byMonth.values()).sort((a, b) =>
      a.periodMonth.localeCompare(b.periodMonth)
    );
  }, [financialPlans, financialScenario, brandFilter]);

  const totalPlanYearRub = useMemo(
    () => monthlyChartData.reduce((acc, m) => acc + m.planRevenueRaw, 0),
    [monthlyChartData]
  );

  const totalPlanProfitYearRub = useMemo(
    () => monthlyChartData.reduce((acc, m) => acc + m.planProfitRaw, 0),
    [monthlyChartData]
  );

  const avgMarginPct = useMemo(() => {
    if (filteredProducts.length === 0) return 73.5;
    const sum = filteredProducts.reduce(
      (s, p) => s + calculateUnitEconomics(p.economics).marginPct,
      0
    );
    return Number((sum / filteredProducts.length).toFixed(1));
  }, [filteredProducts]);

  const jumpToWorkingSection = (
    section:
      | 'dashboard'
      | 'brand-strategy'
      | 'product-lab'
      | 'product-catalog'
      | 'launch-calendar'
      | 'finance',
    opts?: { productId?: string; conceptId?: string; launchId?: string }
  ) => {
    setIsFullscreen(false);
    setPlatformMode('management');
    navigateTo(section, opts);
  };

  // Рендер конкретного слайда по его индексу
  const renderSlideContent = (slideIndex: number) => {
    const slide = PRESENTATION_SLIDES[slideIndex];

    // =========================================================================
    // СЛАЙД 01: МАНИФЕСТ, ВИДЕНИЕ И ПОРТФЕЛЬ BORNERS GROUP 2026–2027
    // =========================================================================
    if (slide.id === 'manifesto') {
      return (
        <div className="space-y-8">
          {/* Чёрный флагманский Hero-слайд в эстетике Apple / Fashion Tech */}
          <div className="rounded-3xl bg-[#111111] text-white p-8 md:p-12 lg:p-14 relative overflow-hidden border border-neutral-800">
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
              <div className="lg:col-span-8 space-y-6">
                <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 text-[12px] font-bold uppercase tracking-[0.16em] text-[#D97745]">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>BORNERS GROUP · СТРАТЕГИЯ РАЗВИТИЯ 2026–2027</span>
                </div>

                <h1 className="text-[38px] md:text-[54px] lg:text-[62px] font-bold tracking-[-0.035em] leading-[1.04] text-white">
                  Создаём новое поколение бельевых брендов
                </h1>

                <p className="text-[17px] md:text-[19px] text-neutral-300 leading-relaxed max-w-3xl">
                  Мы перевели стратегию из статичных документов в <b className="text-white">единую живую систему</b>:
                  каждая цель привязана к разработке новинок в <b className="text-white">Product Lab R&D</b>,
                  каталогу моделей, календарю запусков и финансовому плану 2027 года.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-3 text-[13px] font-semibold text-neutral-300">
                  <span className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/10">
                    1. Позиционирование и ДНК брендов
                  </span>
                  <span>→</span>
                  <span className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/10">
                    2. 7 этапов разработки R&D
                  </span>
                  <span>→</span>
                  <span className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/10">
                    3. Каталог, Запуски и План 2027
                  </span>
                </div>
              </div>

              {/* Опорные цифры группы 2027 */}
              <div className="lg:col-span-4 grid grid-cols-2 gap-3.5">
                <div className="rounded-2xl bg-white/8 border border-white/12 p-5">
                  <div className="text-[12px] uppercase tracking-wider text-neutral-400">
                    План выручки 2027
                  </div>
                  <div className="text-[28px] md:text-[32px] font-bold text-white mt-1">
                    {hasFinance ? formatCompactRub(totalPlanYearRub) : 'Скрыто'}
                  </div>
                  <div className="text-[12px] text-[#D97745] font-semibold mt-1">
                    Сценарий: {SCENARIO_LABELS_RU[financialScenario]}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/8 border border-white/12 p-5">
                  <div className="text-[12px] uppercase tracking-wider text-neutral-400">
                    Опер. прибыль 2027
                  </div>
                  <div className="text-[28px] md:text-[32px] font-bold text-[#16805D] mt-1">
                    {hasFinance ? formatCompactRub(totalPlanProfitYearRub) : 'Скрыто'}
                  </div>
                  <div className="text-[12px] text-neutral-400 mt-1">
                    Валовая маржа ≈ {avgMarginPct}%
                  </div>
                </div>

                <div className="rounded-2xl bg-white/8 border border-white/12 p-5">
                  <div className="text-[12px] uppercase tracking-wider text-neutral-400">
                    В разработке R&D
                  </div>
                  <div className="text-[28px] md:text-[32px] font-bold text-white mt-1">
                    {filteredConcepts.length} моделей
                  </div>
                  <div className="text-[12px] text-neutral-400 mt-1">
                    Воронка 7 этапов
                  </div>
                </div>

                <div className="rounded-2xl bg-white/8 border border-white/12 p-5">
                  <div className="text-[12px] uppercase tracking-wider text-neutral-400">
                    Портфель группы
                  </div>
                  <div className="text-[28px] md:text-[32px] font-bold text-white mt-1">
                    2 + 2
                  </div>
                  <div className="text-[12px] text-neutral-400 mt-1">
                    2 активных + 2 в проработке
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 карточки брендов портфеля (2 действующих + 2 в проработке стратегии) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeBrands.map((b) => {
              const isBorners = b.code === 'BORNERS';
              const accent = isBorners ? '#D97745' : '#8B8078';
              const bProducts = products.filter(
                (p) => !p.isArchived && (p.brandId === b.code || p.brandId === b.id)
              );
              const bConcepts = concepts.filter(
                (c) => !c.isArchived && (c.brandId === b.code || c.brandId === b.id)
              );

              return (
                <div
                  key={b.id}
                  className="rounded-3xl bg-white border border-[#E8E8E5] p-7 md:p-8 flex flex-col justify-between gap-6 shadow-2xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                    <div className="sm:col-span-5 h-44 rounded-2xl bg-[#F7F7F5] border border-[#E8E8E5] p-4 flex items-center justify-center">
                      <img
                        src={b.heroImage}
                        alt={b.name}
                        className="max-h-36 w-full object-contain"
                      />
                    </div>
                    <div className="sm:col-span-7 space-y-2.5">
                      <div className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[#737373]">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: accent }}
                        />
                        <span>{b.segment}</span>
                      </div>
                      <h3 className="text-[30px] font-bold tracking-tight text-[#171717]">
                        {b.name}
                      </h3>
                      <p className="text-[15px] font-semibold text-[#171717]">{b.tagline}</p>
                      <p className="text-[14px] text-[#737373] leading-relaxed">
                        {b.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-5 border-t border-[#E8E8E5]">
                    <div>
                      <div className="text-[12px] text-[#737373]">План выручки 2027</div>
                      <div className="text-[20px] font-bold text-[#171717] mt-0.5">
                        {hasFinance ? formatCompactRub(b.plannedRevenue2027Rub) : 'Скрыто'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[12px] text-[#737373]">Целевая маржа</div>
                      <div className="text-[20px] font-bold text-[#171717] mt-0.5">
                        {hasFinance ? `${b.targetMarginPct}%` : 'Скрыто'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[12px] text-[#737373]">Матрица / R&D</div>
                      <div className="text-[20px] font-bold text-[#171717] mt-0.5">
                        {bProducts.length} SKU · {bConcepts.length} R&D
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Новые бренды в проработке стратегии: Акуша и Liskani */}
          {upcomingBrands.length > 0 && (
            <div className="rounded-3xl bg-white border border-dashed border-[#D97745]/50 p-6 md:p-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-[#D97745]">
                  <span>Новые направления BORNERS GROUP в проработке стратегии (2026–2027)</span>
                </div>
                <span className="text-[12px] font-semibold px-3 py-1 rounded-full bg-[#F7F7F5] border border-[#E8E8E5] text-[#737373]">
                  Этап: формирование ДНК и продуктовой гипотезы
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingBrands.map((ub) => (
                  <div
                    key={ub.id}
                    className="rounded-2xl bg-[#F7F7F5]/70 border border-[#E8E8E5] p-5 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="text-[12px] font-semibold text-[#737373]">
                        {ub.segment}
                      </div>
                      <div className="text-[22px] font-bold text-[#171717]">{ub.name}</div>
                      <p className="text-[14px] text-[#737373] leading-relaxed">
                        {ub.description}
                      </p>
                    </div>
                    <span className="shrink-0 px-3 py-1 rounded-lg bg-white border border-[#E8E8E5] text-[12px] font-semibold text-[#D99527]">
                      В проработке
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // =========================================================================
    // СЛАЙД 02: ДНК, ПОЗИЦИОНИРОВАНИЕ И РАЗГРАНИЧЕНИЕ БРЕНДОВ
    // =========================================================================
    if (slide.id === 'brand-dna') {
      return (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* BORNERS DNA */}
            <div className="rounded-3xl bg-white border-2 border-[#D97745]/30 p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-[#E8E8E5] pb-5">
                <div>
                  <span className="inline-block px-3 py-1 rounded-lg bg-[#D97745] text-white text-[12px] font-bold uppercase tracking-wider">
                    МУЖСКОЙ И УНИСЕКС БРЕНД
                  </span>
                  <h3 className="text-[34px] font-bold tracking-tight text-[#171717] mt-2">
                    BORNERS
                  </h3>
                  <p className="text-[15px] text-[#737373] font-medium">
                    Инженерный комфорт на каждый день + яркие лимитированные капсулы
                  </p>
                </div>
                <img
                  src="/borners-platform/images/products/borners-core-modal.svg"
                  alt="BORNERS"
                  className="h-24 w-24 object-contain rounded-2xl bg-[#F7F7F5] p-2 border border-[#E8E8E5]"
                />
              </div>

              <div className="space-y-4 text-[15px]">
                <div className="p-4 rounded-2xl bg-[#F7F7F5] space-y-1">
                  <div className="text-[12px] font-bold uppercase text-[#737373]">
                    Главная задача продукта
                  </div>
                  <div className="font-semibold text-[#171717]">
                    Анатомический крой без задирания штанин, плотный модал 92% (160–180 г/м²) и пима-хлопок, ресурс 80+ стирок без катышков.
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl border border-[#E8E8E5]">
                    <div className="text-[12px] text-[#737373]">Ценовой коридор</div>
                    <div className="text-[20px] font-bold text-[#171717] mt-0.5">
                      1 690 – 4 990 ₽
                    </div>
                    <div className="text-[12px] text-[#16805D] font-semibold">
                      Целевая маржа: 72%
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl border border-[#E8E8E5]">
                    <div className="text-[12px] text-[#737373]">Ключевой формат</div>
                    <div className="text-[20px] font-bold text-[#171717] mt-0.5">
                      Наборы 3 / 4 / 6 шт.
                    </div>
                    <div className="text-[12px] text-[#737373]">
                      + свободные семейные трусы
                    </div>
                  </div>
                </div>

                {/* Фирменная палитра */}
                <div className="space-y-2 pt-2">
                  <div className="text-[12px] font-bold uppercase text-[#737373]">
                    Ключевые цветовые коды коллекции
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {[
                      { hex: '#111111', name: 'Графит / Чёрный' },
                      { hex: '#1E293B', name: 'Глубокий синий' },
                      { hex: '#D97745', name: 'Терракота (Акцент)' },
                      { hex: '#3F4E4F', name: 'Олива / Хаки' },
                    ].map((c) => (
                      <div
                        key={c.name}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] text-[13px] font-medium"
                      >
                        <span
                          className="h-4 w-4 rounded-full border border-black/10"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span>{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* НА ТЕЛЕ DNA */}
            <div className="rounded-3xl bg-white border-2 border-[#8B8078]/40 p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-[#E8E8E5] pb-5">
                <div>
                  <span className="inline-block px-3 py-1 rounded-lg bg-[#8B8078] text-white text-[12px] font-bold uppercase tracking-wider">
                    ЖЕНСКИЙ ПРЕМИАЛЬНЫЙ БРЕНД
                  </span>
                  <h3 className="text-[34px] font-bold tracking-tight text-[#171717] mt-2">
                    НА ТЕЛЕ
                  </h3>
                  <p className="text-[15px] text-[#737373] font-medium">
                    Эстетика «второй кожи», бесшовные технологии и палитра оттенков кожи
                  </p>
                </div>
                <img
                  src="/borners-platform/images/products/natele-skin-tone.svg"
                  alt="НА ТЕЛЕ"
                  className="h-24 w-24 object-contain rounded-2xl bg-[#F7F7F5] p-2 border border-[#E8E8E5]"
                />
              </div>

              <div className="space-y-4 text-[15px]">
                <div className="p-4 rounded-2xl bg-[#F7F7F5] space-y-1">
                  <div className="text-[12px] font-bold uppercase text-[#737373]">
                    Главная задача продукта
                  </div>
                  <div className="font-semibold text-[#171717]">
                    Абсолютная незаметность под облегающей одеждой (лазерный край Free-cut), невесомая микрофибра Sensil и 100% хлопковая ластовица.
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl border border-[#E8E8E5]">
                    <div className="text-[12px] text-[#737373]">Ценовой коридор</div>
                    <div className="text-[20px] font-bold text-[#171717] mt-0.5">
                      1 490 – 4 490 ₽
                    </div>
                    <div className="text-[12px] text-[#16805D] font-semibold">
                      Целевая маржа: 75%
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl border border-[#E8E8E5]">
                    <div className="text-[12px] text-[#737373]">Ключевой формат</div>
                    <div className="text-[20px] font-bold text-[#171717] mt-0.5">
                      Skin Tone Капсулы
                    </div>
                    <div className="text-[12px] text-[#737373]">
                      6 натуральных оттенков кожи
                    </div>
                  </div>
                </div>

                {/* Фирменная палитра */}
                <div className="space-y-2 pt-2">
                  <div className="text-[12px] font-bold uppercase text-[#737373]">
                    Палитра Skin Tone Collection
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {[
                      { hex: '#F5EFE6', name: 'Молочный шёлк' },
                      { hex: '#E6D2C4', name: 'Фарфоровый беж' },
                      { hex: '#C8AD98', name: 'Тёплый миндаль' },
                      { hex: '#8B8078', name: 'Глубокий мокко' },
                    ].map((c) => (
                      <div
                        key={c.name}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] text-[13px] font-medium"
                      >
                        <span
                          className="h-4 w-4 rounded-full border border-black/10"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span>{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // СЛАЙД 03: ПРОДУКТОВАЯ МАТРИЦА (70% БАЗА / 30% ДРОПЫ) И КАТАЛОГ SKU
    // =========================================================================
    if (slide.id === 'product-matrix') {
      return (
        <div className="space-y-8">
          {/* Формула матрицы 70 / 30 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 rounded-3xl bg-[#111111] text-white p-8 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-lg bg-[#16805D] text-white text-[12px] font-bold uppercase">
                  70% ВЫРУЧКИ ГРУППЫ · CORE BASE
                </span>
                <span className="text-[28px] font-bold text-white">70%</span>
              </div>
              <h3 className="text-[26px] font-bold">
                Регулярная высокомаржинальная база (Always-In-Stock)
              </h3>
              <p className="text-[15px] text-neutral-300 leading-relaxed">
                Базовые боксеры из модала, комплекты по 3 / 4 / 6 штук, свободные семейные трусы BORNERS и бесшовная телесная база НА ТЕЛЕ. Обеспечивают стабильный органический трафик на WB и Ozon, высокий процент повторных покупок (LTV) и минимальный риск неликвида.
              </p>
            </div>

            <div className="lg:col-span-5 rounded-3xl bg-white border-2 border-[#D97745] p-8 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-lg bg-[#D97745] text-white text-[12px] font-bold uppercase">
                  30% ВЫРУЧКИ · ЛИМИТИРОВАННЫЕ ДРОПЫ
                </span>
                <span className="text-[28px] font-bold text-[#D97745]">30%</span>
              </div>
              <h3 className="text-[24px] font-bold text-[#171717]">
                Сезонные капсулы и подарочные наборы
              </h3>
              <p className="text-[15px] text-[#737373] leading-relaxed">
                Коллекция <b>BIG LOVE (к 14 февраля)</b>, новые цветовые паки, подарочные тубусы и боксы. Дают всплеск продаж в высокий сезон, инфоповоды для блогеров и повышенную наценку.
              </p>
            </div>
          </div>

          {/* Живые карточки моделей из каталога */}
          <div className="rounded-3xl bg-white border border-[#E8E8E5] p-7 md:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-[24px] font-bold text-[#171717]">
                  Флагманские модели в действующем каталоге ({filteredProducts.length} SKU)
                </h3>
                <p className="text-[14px] text-[#737373]">
                  Данные синхронизированы с разделом «04 · Каталог моделей» в реальном времени:
                </p>
              </div>
              <button
                type="button"
                onClick={() => jumpToWorkingSection('product-catalog')}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-[#111111] text-white text-[14px] font-semibold cursor-pointer hover:bg-neutral-800 transition"
              >
                <span>Перейти в рабочий Каталог SKU</span>
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredProducts.slice(0, 6).map((p) => {
                const ue = calculateUnitEconomics(p.economics);
                return (
                  <div
                    key={p.id}
                    onClick={() => jumpToWorkingSection('product-catalog', { productId: p.id })}
                    className="rounded-2xl border border-[#E8E8E5] hover:border-[#171717] bg-[#F7F7F5]/50 p-5 flex flex-col justify-between gap-4 cursor-pointer transition group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-20 w-20 rounded-xl bg-white border border-[#E8E8E5] p-2 flex items-center justify-center shrink-0">
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="max-h-16 w-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#D97745]">
                          {p.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : 'BORNERS'} · {p.sku}
                        </div>
                        <div className="text-[16px] font-bold text-[#171717] group-hover:text-[#D97745] transition truncate">
                          {p.name}
                        </div>
                        <div className="text-[13px] text-[#737373] truncate">
                          {p.fabricComposition} · {p.fabricDensityGsm} г/м²
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#E8E8E5] text-[13px]">
                      <div>
                        <span className="text-[11px] text-[#737373] block">Цена МП</span>
                        <span className="font-bold text-[#171717]">
                          {formatCurrencyRub(p.economics.actualRetailPrice)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-[#737373] block">Себест.</span>
                        <span className="font-bold text-[#171717]">
                          {hasCost ? formatCurrencyRub(p.economics.unitCostPrice) : 'Скрыто'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-[#737373] block">Маржа</span>
                        <span className="font-bold text-[#16805D]">
                          {hasFinance ? `${ue.marginPct}%` : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // СЛАЙД 04: ЛАБОРАТОРИЯ R&D (7 ЭТАПОВ ОТ ИДЕИ ДО ЗАПУСКА)
    // =========================================================================
    if (slide.id === 'rnd-pipeline') {
      return (
        <div className="space-y-8">
          {/* Схема 7 этапов с живым количеством карточек */}
          <div className="rounded-3xl bg-white border border-[#E8E8E5] p-7 md:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-[24px] font-bold text-[#171717]">
                  Единый конвейер разработки продукта (7 этапов внутри одной карточки)
                </h3>
                <p className="text-[14px] text-[#737373]">
                  Идея создаётся за 15 секунд, а перед вложением денег в тираж проходит обязательную проверку рынка, образца и стирки:
                </p>
              </div>
              <button
                type="button"
                onClick={() => jumpToWorkingSection('product-lab')}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-[#D97745] text-white text-[14px] font-semibold cursor-pointer hover:opacity-90 transition"
              >
                <span>Открыть доску R&D ({filteredConcepts.length})</span>
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {RND_STAGES_ORDER.map((st) => {
                const count = filteredConcepts.filter((c) => c.stage === st.stage).length;
                return (
                  <div
                    key={st.stage}
                    onClick={() => jumpToWorkingSection('product-lab')}
                    className="rounded-2xl border border-[#E8E8E5] hover:border-[#171717] bg-[#F7F7F5]/60 p-4 flex flex-col justify-between gap-3 cursor-pointer transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-bold px-2 py-0.5 rounded bg-[#111111] text-white">
                        {st.num}
                      </span>
                      <span className="text-[20px] font-bold text-[#D97745]">{count}</span>
                    </div>
                    <div>
                      <div className="font-bold text-[15px] text-[#171717]">{st.name}</div>
                      <div className="text-[12px] text-[#737373] mt-0.5 leading-snug">
                        {st.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Живые карточки ключевых разработок в воронке */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {filteredConcepts.slice(0, 8).map((c) => (
              <div
                key={c.id}
                onClick={() => jumpToWorkingSection('product-lab', { conceptId: c.id })}
                className="rounded-2xl bg-white border border-[#E8E8E5] hover:border-[#D97745] p-5 flex flex-col justify-between gap-4 cursor-pointer transition group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase px-2.5 py-1 rounded-md bg-[#F7F7F5] text-[#171717]">
                      {c.code} · {c.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : 'BORNERS'}
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-[#D97745]/15 text-[#D97745]">
                      {CONCEPT_STAGE_LABELS_RU[c.stage]}
                    </span>
                  </div>

                  <div className="h-32 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] p-3 flex items-center justify-center">
                    <img
                      src={c.imageUrl}
                      alt={c.name}
                      className="max-h-24 w-full object-contain"
                    />
                  </div>

                  <div>
                    <h4 className="font-bold text-[16px] text-[#171717] group-hover:text-[#D97745] transition">
                      {c.name}
                    </h4>
                    <p className="text-[13px] text-[#737373] line-clamp-2 mt-1">
                      {c.whatAttracted || c.ideaDescription}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E8E8E5] text-[12px] text-[#737373] flex items-center justify-between">
                  <span className="truncate">Шаг: {c.nextStep || 'В работе'}</span>
                  <span className="font-bold text-[#171717] shrink-0 ml-2">Открыть →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // =========================================================================
    // СЛАЙД 05: 14 БЛОКОВ СТРАТЕГИИ БРЕНДОВ (С ГЛАВАМИ И ПЕРЕКЛЮЧАТЕЛЕМ БРЕНДА)
    // =========================================================================
    if (slide.id === 'strategy-14') {
      const blocks = strategies
        .filter((s) => s.brandId === strategyBrandTab)
        .sort((a, b) => a.sectionOrder - b.sectionOrder);

      const filteredBlocks = blocks.filter((b) => {
        if (strategyChapter === 'all') return true;
        if (strategyChapter === 'brand') return b.sectionOrder >= 1 && b.sectionOrder <= 4;
        if (strategyChapter === 'product') return b.sectionOrder >= 5 && b.sectionOrder <= 8;
        if (strategyChapter === 'growth') return b.sectionOrder >= 9 && b.sectionOrder <= 11;
        return b.sectionOrder >= 12 && b.sectionOrder <= 14;
      });

      return (
        <div className="space-y-6">
          {/* Переключатель бренда + смысловых глав стратегии */}
          <div className="rounded-3xl bg-white border border-[#E8E8E5] p-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 bg-[#F7F7F5] p-1.5 rounded-2xl border border-[#E8E8E5]">
              <button
                type="button"
                onClick={() => setStrategyBrandTab('BORNERS')}
                className={`px-5 py-2.5 rounded-xl text-[14px] font-bold cursor-pointer transition ${
                  strategyBrandTab === 'BORNERS'
                    ? 'bg-[#D97745] text-white shadow-xs'
                    : 'text-[#171717] hover:bg-white'
                }`}
              >
                BORNERS (14 блоков)
              </button>
              <button
                type="button"
                onClick={() => setStrategyBrandTab('NA_TELE')}
                className={`px-5 py-2.5 rounded-xl text-[14px] font-bold cursor-pointer transition ${
                  strategyBrandTab === 'NA_TELE'
                    ? 'bg-[#8B8078] text-white shadow-xs'
                    : 'text-[#171717] hover:bg-white'
                }`}
              >
                НА ТЕЛЕ (14 блоков)
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'all' as const, label: 'Все 14 блоков' },
                { id: 'brand' as const, label: '1–4 · Видение и Клиент' },
                { id: 'product' as const, label: '5–8 · Продукт и Преимущества' },
                { id: 'growth' as const, label: '9–11 · Цены, Каналы и Маркетинг' },
                { id: 'finance' as const, label: '12–14 · Финцели, Roadmap и Риски' },
              ].map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setStrategyChapter(ch.id)}
                  className={`px-3.5 py-2 rounded-xl text-[13px] font-semibold cursor-pointer transition border ${
                    strategyChapter === ch.id
                      ? 'bg-[#111111] text-white border-[#111111]'
                      : 'bg-[#F7F7F5] text-[#171717] border-[#E8E8E5] hover:border-[#171717]'
                  }`}
                >
                  {ch.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredBlocks.map((block) => {
              const points = block.content
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean);
              return (
                <div
                  key={block.id}
                  className="rounded-3xl bg-white border border-[#E8E8E5] p-7 flex flex-col justify-between gap-5"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between border-b border-[#E8E8E5] pb-3.5">
                      <div className="flex items-center gap-3">
                        <span className="h-8 w-8 rounded-xl bg-[#111111] text-white text-[13px] font-bold flex items-center justify-center">
                          {String(block.sectionOrder).padStart(2, '0')}
                        </span>
                        <h4 className="text-[20px] font-bold text-[#171717]">
                          {block.titleRu}
                        </h4>
                      </div>
                      <span className="text-[12px] font-semibold text-[#16805D] bg-[#16805D]/10 px-2.5 py-1 rounded-lg">
                        Утверждено · v{block.version}
                      </span>
                    </div>

                    <p className="text-[16px] font-bold text-[#171717] leading-snug">
                      {block.summary}
                    </p>

                    <ul className="space-y-2 text-[14px] text-[#737373]">
                      {points.map((pt, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="text-[#D97745] font-bold mt-0.5">•</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#E8E8E5] bg-[#F7F7F5]/60 -mx-7 -mb-7 p-5 rounded-b-3xl">
                    {block.kpiHighlights.map((k, idx) => (
                      <div key={idx}>
                        <div className="text-[11px] text-[#737373]">{k.label}</div>
                        <div className="text-[14px] font-bold text-[#171717] mt-0.5">
                          {k.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // =========================================================================
    // СЛАЙД 06: КАЛЕНДАРЬ ЗАПУСКОВ И МАРКЕТИНГ РОСТА
    // =========================================================================
    if (slide.id === 'launches-growth') {
      return (
        <div className="space-y-8">
          <div className="rounded-3xl bg-white border border-[#E8E8E5] p-7 md:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-[24px] font-bold text-[#171717]">
                  План-график ключевых релизов 2026–2027 ({filteredLaunches.length})
                </h3>
                <p className="text-[14px] text-[#737373]">
                  Каждый запуск объединяет готовность партии на фабрике, съёмку контента, карточки МП и рекламный бюджет:
                </p>
              </div>
              <button
                type="button"
                onClick={() => jumpToWorkingSection('launch-calendar')}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-[#111111] text-white text-[14px] font-semibold cursor-pointer"
              >
                <span>Открыть Календарь запусков</span>
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {filteredLaunches.map((l) => (
                <div
                  key={l.id}
                  onClick={() => jumpToWorkingSection('launch-calendar', { launchId: l.id })}
                  className="rounded-2xl border border-[#E8E8E5] hover:border-[#171717] bg-[#F7F7F5]/60 p-6 flex flex-col justify-between gap-5 cursor-pointer transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-lg bg-[#111111] text-white text-[12px] font-bold">
                        Старт: {l.startDate}
                      </span>
                      <span className="text-[13px] font-bold text-[#D97745]">
                        Готовность {l.readinessPct}%
                      </span>
                    </div>
                    <h4 className="text-[20px] font-bold text-[#171717]">{l.name}</h4>
                    <div className="text-[13px] text-[#737373]">{l.productionStatus}</div>

                    {/* Прогресс-бар */}
                    <div className="h-2.5 w-full rounded-full bg-[#E8E8E5] overflow-hidden">
                      <div
                        className="h-full bg-[#16805D] rounded-full"
                        style={{ width: `${l.readinessPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#E8E8E5] text-[13px]">
                    <div>
                      <span className="text-[11px] text-[#737373] block">План продаж</span>
                      <span className="font-bold text-[#171717]">
                        {hasFinance ? formatCompactRub(l.salesPlanRub) : `${l.salesPlanUnits} шт.`}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#737373] block">Маркетинг</span>
                      <span className="font-bold text-[#171717]">
                        {hasFinance ? formatCompactRub(l.marketingBudgetRub) : 'По плану'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Каналы дистрибуции и маркетинга */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {campaigns.slice(0, 3).map((camp) => (
              <div
                key={camp.id}
                className="rounded-3xl bg-white border border-[#E8E8E5] p-6 space-y-3"
              >
                <div className="flex items-center justify-between text-[12px] font-bold uppercase text-[#737373]">
                  <span>{camp.channel}</span>
                  <span className="text-[#16805D]">{camp.status}</span>
                </div>
                <h4 className="text-[18px] font-bold text-[#171717]">{camp.name}</h4>
                <p className="text-[13px] text-[#737373]">{camp.goal}</p>
                <div className="pt-3 border-t border-[#E8E8E5] flex items-center justify-between text-[13px]">
                  <span className="text-[#737373]">Плановая выручка:</span>
                  <b className="text-[#171717]">
                    {hasFinance ? formatCompactRub(camp.plannedRevenueRub) : '—'}
                  </b>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // =========================================================================
    // СЛАЙД 07: ФИНАНСОВАЯ МОДЕЛЬ 2027 И СЦЕНАРИИ
    // =========================================================================
    if (slide.id === 'finance-2027') {
      return (
        <div className="space-y-8">
          <div className="rounded-3xl bg-white border border-[#E8E8E5] p-7 md:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-[24px] font-bold text-[#171717]">
                  Помесячный финансовый план 2027 · {SCENARIO_LABELS_RU[financialScenario]} сценарий
                </h3>
                <p className="text-[14px] text-[#737373]">
                  Переключайте сценарий прямо на слайде — все показатели пересчитываются мгновенно:
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex bg-[#F7F7F5] p-1 rounded-xl border border-[#E8E8E5]">
                  {(['Conservative', 'Base', 'Optimistic'] as FinancialScenario[]).map((sc) => (
                    <button
                      key={sc}
                      type="button"
                      onClick={() => setFinancialScenario(sc)}
                      className={`px-3.5 py-2 rounded-lg text-[13px] font-bold cursor-pointer transition ${
                        financialScenario === sc
                          ? 'bg-[#111111] text-white'
                          : 'text-[#737373] hover:text-[#171717]'
                      }`}
                    >
                      {SCENARIO_LABELS_RU[sc]}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => jumpToWorkingSection('finance')}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-[#D97745] text-white text-[13px] font-bold cursor-pointer"
                >
                  <span>Таблица P&L →</span>
                </button>
              </div>
            </div>

            {hasFinance ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-2xl bg-[#F7F7F5] p-5 border border-[#E8E8E5]">
                    <div className="text-[13px] text-[#737373]">Годовой план выручки 2027</div>
                    <div className="text-[30px] font-bold text-[#171717] mt-1">
                      {formatCompactRub(totalPlanYearRub)}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#F7F7F5] p-5 border border-[#E8E8E5]">
                    <div className="text-[13px] text-[#737373]">Плановая операционная прибыль</div>
                    <div className="text-[30px] font-bold text-[#16805D] mt-1">
                      {formatCompactRub(totalPlanProfitYearRub)}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#F7F7F5] p-5 border border-[#E8E8E5]">
                    <div className="text-[13px] text-[#737373]">Средняя расчётная маржа SKU</div>
                    <div className="text-[30px] font-bold text-[#D97745] mt-1">
                      {avgMarginPct}%
                    </div>
                  </div>
                </div>

                <div className="h-[340px] w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyChartData}
                      margin={{ top: 10, right: 16, left: 0, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E5" vertical={false} />
                      <XAxis
                        dataKey="periodLabel"
                        tick={{ fontSize: 12, fill: '#737373' }}
                        axisLine={{ stroke: '#E8E8E5' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#737373' }}
                        axisLine={false}
                        tickLine={false}
                        unit=" млн"
                      />
                      <Tooltip
                        formatter={(val) => [`${val} млн ₽`, '']}
                        contentStyle={{
                          borderRadius: '14px',
                          border: '1px solid #E8E8E5',
                          fontSize: '13px',
                        }}
                      />
                      <Bar
                        dataKey="planRevenueM"
                        name="План выручки (млн ₽)"
                        fill="#111111"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="factRevenueM"
                        name="Факт выручки (млн ₽)"
                        fill="#D97745"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="planProfitM"
                        name="План прибыли (млн ₽)"
                        fill="#16805D"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="p-8 rounded-2xl bg-[#F7F7F5] text-center text-[#737373]">
                Финансовые показатели доступны пользователям с правом просмотра финансов.
              </div>
            )}
          </div>
        </div>
      );
    }

    // =========================================================================
    // СЛАЙД 08: ДОРОЖНАЯ КАРТА И ПЕРЕХОД К ЕЖЕДНЕВНОЙ РАБОТЕ
    // =========================================================================
    return (
      <div className="space-y-8">
        {/* Стратегические цели 2026-2027 */}
        <div className="rounded-3xl bg-white border border-[#E8E8E5] p-7 md:p-8 space-y-6">
          <div>
            <h3 className="text-[24px] font-bold text-[#171717]">
              Ключевые стратегические цели группы 2026–2027
            </h3>
            <p className="text-[14px] text-[#737373]">
              Контрольные точки масштабирования BORNERS и НА ТЕЛЕ:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {strategicGoals.map((g) => (
              <div
                key={g.id}
                className="rounded-2xl border border-[#E8E8E5] bg-[#F7F7F5]/60 p-6 space-y-3"
              >
                <div className="flex items-center justify-between text-[12px] font-bold uppercase">
                  <span className="text-[#D97745]">
                    {g.brandId === 'ALL'
                      ? 'Вся группа'
                      : g.brandId === 'NA_TELE'
                      ? 'НА ТЕЛЕ'
                      : 'BORNERS'}{' '}
                    · Период: {g.periodQuarter}
                  </span>
                  <span className="text-[#16805D]">{g.progressPct}% выполнено</span>
                </div>
                <h4 className="text-[18px] font-bold text-[#171717]">{g.title}</h4>
                <div className="text-[14px] text-[#737373]">
                  Целевой ориентир: <b className="text-[#171717]">{g.targetMetric}</b> ({g.status})
                </div>
                <div className="h-2.5 w-full rounded-full bg-[#E8E8E5] overflow-hidden">
                  <div
                    className="h-full bg-[#111111] rounded-full"
                    style={{ width: `${g.progressPct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Финальный блок: переход из презентации в рабочие модули */}
        <div className="rounded-3xl bg-[#111111] text-white p-8 md:p-10 space-y-6">
          <div className="max-w-2xl space-y-2">
            <div className="text-[12px] font-bold uppercase tracking-widest text-[#D97745]">
              ОТ СТРАТЕГИИ К ДЕЙСТВИЮ
            </div>
            <h3 className="text-[28px] md:text-[34px] font-bold">
              Запустить стратегию в ежедневную работу команды
            </h3>
            <p className="text-[15px] text-neutral-300">
              Нажмите на любой рабочий контур ниже, чтобы переключиться из презентации в режим операционного управления:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                section: 'product-lab' as const,
                step: '01 · R&D ЛАБОРАТОРИЯ',
                title: 'Разработка новинок',
                desc: `${filteredConcepts.length} карточек на 7 этапах Канбана`,
              },
              {
                section: 'product-catalog' as const,
                step: '02 · КАТАЛОГ SKU',
                title: 'Модели и себестоимость',
                desc: `${filteredProducts.length} утверждённых моделей в матрице`,
              },
              {
                section: 'launch-calendar' as const,
                step: '03 · ЗАПУСКИ',
                title: 'Календарь релизов',
                desc: `${filteredLaunches.length} коллекций в графике выходов`,
              },
              {
                section: 'finance' as const,
                step: '04 · ФИНАНСЫ 2027',
                title: 'План / Факт и P&L',
                desc: 'Юнит-экономика и 3 сценария 2027',
              },
            ].map((item) => (
              <button
                key={item.section}
                type="button"
                onClick={() => jumpToWorkingSection(item.section)}
                className="rounded-2xl bg-white/10 hover:bg-[#D97745] border border-white/15 p-5 text-left transition cursor-pointer group"
              >
                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 group-hover:text-white">
                  {item.step}
                </div>
                <div className="text-[18px] font-bold text-white mt-1.5 flex items-center justify-between">
                  <span>{item.title}</span>
                  <ArrowUpRight className="h-4 w-4" />
                </div>
                <div className="text-[13px] text-neutral-300 group-hover:text-white/90 mt-1">
                  {item.desc}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const currentSlide = PRESENTATION_SLIDES[activeSlideIdx];

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#F7F7F5] overflow-y-auto p-6 md:p-10'
          : 'space-y-6 pb-20'
      }
    >
      {/* ВЕРХНЯЯ ПАНЕЛЬ УПРАВЛЕНИЯ ПРЕЗЕНТАЦИЕЙ */}
      <div className="sticky top-2 z-30 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E8E8E5] p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Левая часть: заголовок презентации и фильтр бренда */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#111111] text-white text-[12px] font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-[#D97745]" />
              <span>Презентация стратегии 2026–2027</span>
            </div>

            <div className="flex items-center bg-[#F7F7F5] p-1 rounded-xl border border-[#E8E8E5] text-[13px]">
              <button
                type="button"
                onClick={() => setBrandFilter('ALL')}
                className={`px-3 py-1 rounded-lg font-semibold cursor-pointer ${
                  brandFilter === 'ALL'
                    ? 'bg-white text-[#171717] shadow-2xs'
                    : 'text-[#737373]'
                }`}
              >
                Все бренды
              </button>
              <button
                type="button"
                onClick={() => setBrandFilter('BORNERS')}
                className={`px-3 py-1 rounded-lg font-semibold cursor-pointer ${
                  brandFilter === 'BORNERS'
                    ? 'bg-[#D97745] text-white'
                    : 'text-[#737373]'
                }`}
              >
                BORNERS
              </button>
              <button
                type="button"
                onClick={() => setBrandFilter('NA_TELE')}
                className={`px-3 py-1 rounded-lg font-semibold cursor-pointer ${
                  brandFilter === 'NA_TELE'
                    ? 'bg-[#8B8078] text-white'
                    : 'text-[#737373]'
                }`}
              >
                НА ТЕЛЕ
              </button>
            </div>
          </div>

          {/* Правая часть: переключатель Слайд-шоу / Все слайды / На весь экран / Выход */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-[#F7F7F5] p-1 rounded-xl border border-[#E8E8E5] text-[13px]">
              <button
                type="button"
                onClick={() => setViewLayout('slides')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                  viewLayout === 'slides'
                    ? 'bg-[#111111] text-white'
                    : 'text-[#737373] hover:text-[#171717]'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>По слайдам ({activeSlideIdx + 1}/8)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('all')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                  viewLayout === 'all'
                    ? 'bg-[#111111] text-white'
                    : 'text-[#737373] hover:text-[#171717]'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Все слайды подряд</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              title="Печать или сохранение презентации в PDF"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] text-[13px] font-semibold text-[#171717] hover:border-[#171717] cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">PDF / Печать</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] text-[13px] font-semibold text-[#171717] hover:border-[#171717] cursor-pointer"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5" />
                  <span>Свернуть окно</span>
                </>
              ) : (
                <>
                  <Expand className="h-3.5 w-3.5" />
                  <span>На весь экран</span>
                </>
              )}
            </button>

            {onExitPresentation && (
              <button
                type="button"
                onClick={() => {
                  setIsFullscreen(false);
                  onExitPresentation();
                }}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#D97745] text-white text-[13px] font-bold hover:opacity-90 cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>К рабочему режиму</span>
              </button>
            )}
          </div>
        </div>

        {/* Навигация по 8 слайдам (если выбран режим По слайдам) */}
        {viewLayout === 'slides' && (
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#E8E8E5] overflow-x-auto">
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              {PRESENTATION_SLIDES.map((s, idx) => {
                const active = idx === activeSlideIdx;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveSlideIdx(idx)}
                    className={`px-3 py-1.5 rounded-xl text-[12px] font-bold whitespace-nowrap cursor-pointer transition ${
                      active
                        ? 'bg-[#111111] text-white'
                        : 'bg-[#F7F7F5] text-[#737373] hover:text-[#171717]'
                    }`}
                  >
                    <span className="text-[#D97745] mr-1">{s.num}</span>
                    {s.shortTitle}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                disabled={activeSlideIdx === 0}
                onClick={() => setActiveSlideIdx((i) => Math.max(0, i - 1))}
                className="h-8 px-3 rounded-lg border border-[#E8E8E5] bg-white text-[12px] font-bold disabled:opacity-40 cursor-pointer inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Пред.</span>
              </button>
              <button
                type="button"
                disabled={activeSlideIdx === PRESENTATION_SLIDES.length - 1}
                onClick={() =>
                  setActiveSlideIdx((i) => Math.min(PRESENTATION_SLIDES.length - 1, i + 1))
                }
                className="h-8 px-3 rounded-lg bg-[#111111] text-white text-[12px] font-bold disabled:opacity-40 cursor-pointer inline-flex items-center gap-1"
              >
                <span>След. слайд</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* СОДЕРЖИМОЕ ПРЕЗЕНТАЦИИ */}
      {viewLayout === 'slides' ? (
        <div className="space-y-6">
          {/* Заголовок текущего слайда */}
          <div className="flex flex-wrap items-end justify-between gap-4 px-1">
            <div>
              <div className="text-[12px] font-bold uppercase tracking-widest text-[#D97745]">
                Слайд {currentSlide.num} из 08 · {currentSlide.shortTitle}
              </div>
              <h2 className="text-[28px] md:text-[36px] font-bold tracking-tight text-[#171717]">
                {currentSlide.title}
              </h2>
              <p className="text-[15px] text-[#737373] mt-0.5">{currentSlide.subtitle}</p>
            </div>
          </div>

          {renderSlideContent(activeSlideIdx)}

          {/* Нижняя панель листания слайдов */}
          <div className="rounded-2xl bg-white border border-[#E8E8E5] p-4 flex items-center justify-between">
            <button
              type="button"
              disabled={activeSlideIdx === 0}
              onClick={() => setActiveSlideIdx((i) => Math.max(0, i - 1))}
              className="h-11 px-5 rounded-xl border border-[#E8E8E5] text-[14px] font-semibold disabled:opacity-40 cursor-pointer inline-flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Предыдущий слайд</span>
            </button>

            <div className="text-[13px] font-semibold text-[#737373]">
              Слайд <b className="text-[#171717]">{activeSlideIdx + 1}</b> из{' '}
              {PRESENTATION_SLIDES.length} (можно листать клавишами ← →)
            </div>

            <button
              type="button"
              disabled={activeSlideIdx === PRESENTATION_SLIDES.length - 1}
              onClick={() =>
                setActiveSlideIdx((i) => Math.min(PRESENTATION_SLIDES.length - 1, i + 1))
              }
              className="h-11 px-6 rounded-xl bg-[#111111] text-white text-[14px] font-semibold disabled:opacity-40 cursor-pointer inline-flex items-center gap-2"
            >
              <span>Следующий слайд</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        /* РЕЖИМ ЛОНГРИДА: ВСЕ 8 СЛАЙДОВ ПОДРЯД */
        <div className="space-y-14">
          {PRESENTATION_SLIDES.map((s, idx) => (
            <section
              key={s.id}
              className="space-y-5 pt-6 border-t-2 border-[#E8E8E5] first:border-t-0 first:pt-0"
            >
              <div>
                <div className="text-[12px] font-bold uppercase tracking-widest text-[#D97745]">
                  Раздел {s.num} · {s.shortTitle}
                </div>
                <h2 className="text-[28px] md:text-[36px] font-bold tracking-tight text-[#171717]">
                  {s.title}
                </h2>
                <p className="text-[15px] text-[#737373] mt-0.5">{s.subtitle}</p>
              </div>
              {renderSlideContent(idx)}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
