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
  Expand,
  Minimize2,
  Printer,
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
  normalizeConceptStageToSeven,
} from '@/lib/finance';

interface SlideMeta {
  id: string;
  num: string;
  shortTitle: string;
  kicker: string;
  title: string;
  subtitle: string;
}

const PRESENTATION_SLIDES: SlideMeta[] = [
  {
    id: 'manifesto',
    num: '01',
    shortTitle: 'Манифест и Портфель',
    kicker: 'ЧАСТЬ I · ВИДЕНИЕ И СТРУКТУРА ГРУППЫ',
    title: 'BORNERS GROUP · Стратегия 2026–2027',
    subtitle:
      'Переход от разрозненных таблиц и чатов к единой операционной системе бельевых брендов: R&D, матрица SKU, запуски и P&L.',
  },
  {
    id: 'brand-dna',
    num: '02',
    shortTitle: 'ДНК брендов',
    kicker: 'ЧАСТЬ II · РАЗГРАНИЧЕНИЕ ПОРТФЕЛЯ',
    title: 'Архитектура BORNERS и НА ТЕЛЕ без каннибализации',
    subtitle:
      'Чёткое разделение аудиторий, конструкций лекал, плотностей полотна и ценовых сегментов внутри единой производственной базы.',
  },
  {
    id: 'product-matrix',
    num: '03',
    shortTitle: 'Матрица 70/30 и Экономика',
    kicker: 'ЧАСТЬ III · АССОРТИМЕНТНАЯ МОДЕЛЬ',
    title: 'Формула 70 / 30 и юнит-экономика комплекта',
    subtitle:
      '70% выручки формирует регулярная высокомаржинальная база (Always-In-Stock), 30% — сезонные капсулы и подарочные наборы.',
  },
  {
    id: 'rnd-pipeline',
    num: '04',
    shortTitle: 'Product Lab R&D',
    kicker: 'ЧАСТЬ IV · ЛАБОРАТОРИЯ ПРОДУКТА',
    title: 'Одна карточка — семь этапов до заказа фабрике',
    subtitle:
      'Ни одна модель не уходит в серийный тираж без расчёта цены за пару, проверки состава 100%, четырёх тестов стирки и решения руководителя.',
  },
  {
    id: 'strategy-14',
    num: '05',
    shortTitle: '14 блоков стратегии',
    kicker: 'ЧАСТЬ V · СТРАТЕГИЧЕСКИЙ ПАСПОРТ',
    title: 'Система координат брендов: 14 утверждённых блоков',
    subtitle:
      'Полный свод правил по каждому бренду: от боли покупателя и тональности коммуникации до дистрибуции, маркетинга и рисков.',
  },
  {
    id: 'launches-growth',
    num: '06',
    shortTitle: 'Релизы и Маркетинг',
    kicker: 'ЧАСТЬ VI · ВЫВОД НА РЫНОК',
    title: 'Синхронизация календаря запусков и каналов роста',
    subtitle:
      'Единая готовность производственной партии, фотоконтента, карточек маркетплейсов и внешнего трафика к дате старта.',
  },
  {
    id: 'finance-2027',
    num: '07',
    shortTitle: 'Финмодель 2027',
    kicker: 'ЧАСТЬ VII · ФИНАНСОВЫЙ ПЛАН И СЦЕНАРИИ',
    title: 'Финансовая модель 2027 в трёх сценариях',
    subtitle:
      'Сравнение консервативного, базового и оптимистичного планов по выручке, операционной прибыли и точкам контроля План / Факт.',
  },
  {
    id: 'execution',
    num: '08',
    shortTitle: 'Дорожная карта',
    kicker: 'ЧАСТЬ VIII · ИСПОЛНЕНИЕ В СИСТЕМЕ',
    title: 'Квартальные цели и переход в рабочий контур',
    subtitle:
      'Каждая стратегическая цель оцифрована в конкретном модуле платформы для ежедневной работы команды.',
  },
];

const RND_STAGES_ORDER: { stage: ConceptStage; num: string; name: string; desc: string; gate: string }[] = [
  { stage: 'IDEA', num: '01', name: 'Идея', desc: 'Фото, бренд, автор и суть гипотезы', gate: 'Запуск за 15 сек' },
  { stage: 'ANALYSIS', num: '02', name: 'Анализ', desc: 'Рынок, продукт и цена за пару', gate: 'Пересчёт комплекта' },
  { stage: 'SAMPLE', num: '03', name: 'Образец', desc: 'Фабрика и конструктор состава', gate: 'Сумма = 100%' },
  { stage: 'TEST', num: '04', name: 'Тест', desc: '4 проверки посадки и стирки', gate: 'Контроль дефектов' },
  { stage: 'DECISION', num: '05', name: 'Решение', desc: 'Сводка для руководителя', gate: 'Утвердить / Доработать' },
  { stage: 'PRODUCTION', num: '06', name: 'Производство', desc: 'Матрица S–4XL и расклад цветов', gate: 'PDF RU / EN / 中文' },
  { stage: 'LAUNCH', num: '07', name: 'Запуск', desc: 'Ссылка на МП и дата старта', gate: 'Переход в Каталог SKU' },
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

  // Клавиатурная навигация ← / → / Esc
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
          !['REJECTED', 'CANCELLED', 'POSTPONED'].includes(c.stage) &&
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

  // Сводка по всем 3 сценариям для сравнительной таблицы на Слайде 07
  const scenarioSummaryTable = useMemo(() => {
    const scenarios: FinancialScenario[] = ['Conservative', 'Base', 'Optimistic'];
    return scenarios.map((sc) => {
      const rows = financialPlans.filter(
        (r) => r.scenario === sc && (brandFilter === 'ALL' || r.brandId === brandFilter)
      );
      const rev = rows.reduce((s, r) => s + r.plannedRevenueRub, 0);
      const prof = rows.reduce((s, r) => s + r.plannedOperatingProfitRub, 0);
      const mkt = rows.reduce((s, r) => s + r.marketingBudgetRub, 0);
      const ros = rev > 0 ? Number(((prof / rev) * 100).toFixed(1)) : 0;
      return {
        scenario: sc,
        label: SCENARIO_LABELS_RU[sc],
        revenueRub: rev,
        profitRub: prof,
        marketingRub: mkt,
        rosPct: ros,
      };
    });
  }, [financialPlans, brandFilter]);

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

  const renderSlideContent = (slideIndex: number) => {
    const slide = PRESENTATION_SLIDES[slideIndex];

    // =========================================================================
    // СЛАЙД 01: МАНИФЕСТ И АРХИТЕКТУРА ПОРТФЕЛЯ ГРУППЫ
    // =========================================================================
    if (slide.id === 'manifesto') {
      return (
        <div className="space-y-6">
          {/* Редакционный разворот с живыми студийными фотографиями */}
          <div className="rounded-[8px] bg-[#161615] text-[#F8F6F2] border border-[#2C2B29] overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-7 p-8 md:p-11 flex flex-col justify-between space-y-8">
                <div className="space-y-4">
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-[#B89F86]">
                    BORNERS GROUP · EXECUTIVE STRATEGY DECK 2026 / 2027
                  </div>
                  <h1 className="font-serif-editorial text-[36px] md:text-[50px] font-normal tracking-[-0.01em] leading-[1.06] text-white">
                    Новое поколение бельевых брендов на базе инженерной дисциплины продукта
                  </h1>
                  <p className="text-[15px] text-[#C8C3B9] leading-relaxed max-w-2xl">
                    Мы объединили стратегию портфеля, визуальную лабораторию разработки{' '}
                    <span className="text-white font-medium">Product Lab R&amp;D</span>, матрицу
                    себестоимости и календарь релизов в единую операционную систему. Каждое решение о
                    запуске тиража опирается на проверенный рыночный спрос, тест стирки и точную
                    экономику комплекта.
                  </p>
                </div>

                {/* 3 ключевых столпа стратегии */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-white/12">
                  <div>
                    <div className="font-mono text-[10px] text-[#B89F86] uppercase tracking-wider">
                      01 / ПОРТФЕЛЬ
                    </div>
                    <div className="text-[14px] font-medium text-white mt-1">
                      Разделение ДНК без каннибализации
                    </div>
                    <div className="text-[12px] text-[#9E988E] mt-0.5">
                      BORNERS (масс-маркет+) и НА ТЕЛЕ (премиум вторая кожа)
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] text-[#B89F86] uppercase tracking-wider">
                      02 / PRODUCT LAB
                    </div>
                    <div className="text-[14px] font-medium text-white mt-1">
                      1 карточка = 7 этапов R&amp;D
                    </div>
                    <div className="text-[12px] text-[#9E988E] mt-0.5">
                      Защита капитала до размещения заказа на фабрике
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] text-[#B89F86] uppercase tracking-wider">
                      03 / МАТРИЦА 70/30
                    </div>
                    <div className="text-[14px] font-medium text-white mt-1">
                      70% регулярная база + 30% дропы
                    </div>
                    <div className="text-[12px] text-[#9E988E] mt-0.5">
                      Высокий LTV базовых комплектов + сезонные пики
                    </div>
                  </div>
                </div>
              </div>

              {/* Правая колонка: коллаж реальных студийных фотографий + опорные цифры */}
              <div className="lg:col-span-5 bg-[#1F1E1C] border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col justify-between">
                <div className="grid grid-cols-2 border-b border-white/10 h-60">
                  <div className="border-r border-white/10 overflow-hidden relative">
                    <img
                      src="images/products/rnd-print-family.png"
                      alt="BORNERS"
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-[3px] bg-black/75 font-mono text-[10px] text-white uppercase tracking-wider">
                      BORNERS
                    </span>
                  </div>
                  <div className="overflow-hidden relative">
                    <img
                      src="images/products/rnd-seamless-hero.png"
                      alt="НА ТЕЛЕ"
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-[3px] bg-black/75 font-mono text-[10px] text-white uppercase tracking-wider">
                      НА ТЕЛЕ
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 divide-x divide-y divide-white/10">
                  <div className="p-5">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[#9E988E]">
                      Целевая выручка 2027
                    </div>
                    <div className="font-serif-editorial text-[30px] font-semibold text-white mt-1 leading-none">
                      {hasFinance ? formatCompactRub(totalPlanYearRub) : 'Скрыто'}
                    </div>
                    <div className="text-[11.5px] text-[#B89F86] mt-1.5">
                      Сценарий: {SCENARIO_LABELS_RU[financialScenario]}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[#9E988E]">
                      Операционная прибыль
                    </div>
                    <div className="font-serif-editorial text-[30px] font-semibold text-white mt-1 leading-none">
                      {hasFinance ? formatCompactRub(totalPlanProfitYearRub) : 'Скрыто'}
                    </div>
                    <div className="text-[11.5px] text-[#9E988E] mt-1.5">
                      Валовая маржа SKU ≈ {avgMarginPct}%
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[#9E988E]">
                      Моделей в R&amp;D воронке
                    </div>
                    <div className="font-serif-editorial text-[30px] font-semibold text-white mt-1 leading-none">
                      {filteredConcepts.length} проектов
                    </div>
                    <div className="text-[11.5px] text-[#9E988E] mt-1.5">
                      На 7 этапах от идеи до запуска
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[#9E988E]">
                      Структура портфеля
                    </div>
                    <div className="font-serif-editorial text-[30px] font-semibold text-white mt-1 leading-none">
                      2 + 2 бренда
                    </div>
                    <div className="text-[11.5px] text-[#9E988E] mt-1.5">
                      2 активных + Акуша и Liskani
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Карточки брендов портфеля в паспортной рамке Tech-Pack */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeBrands.map((b) => {
              const isBorners = b.code === 'BORNERS';
              const bProducts = products.filter(
                (p) => !p.isArchived && (p.brandId === b.code || p.brandId === b.id)
              );
              const bConcepts = concepts.filter(
                (c) =>
                  !c.isArchived &&
                  !['REJECTED', 'CANCELLED', 'POSTPONED'].includes(c.stage) &&
                  (c.brandId === b.code || c.brandId === b.id)
              );

              return (
                <div
                  key={b.id}
                  className="rounded-[8px] bg-[#FDFCFA] border border-[#E5E0D8] overflow-hidden grid grid-cols-1 sm:grid-cols-12"
                >
                  <div className="sm:col-span-5 p-4 bg-[#F3EFE8] border-b sm:border-b-0 sm:border-r border-[#E5E0D8] flex flex-col justify-between gap-2.5">
                    <div className="flex items-center justify-between font-mono text-[9.5px] uppercase tracking-[0.14em] text-[#7A756D]">
                      <span>{isBorners ? 'SPECIMEN #BRN-01' : 'SPECIMEN #NTL-01'}</span>
                      <span>LAB ARCHIVE</span>
                    </div>
                    <div className="h-44 w-full rounded-[4px] bg-white border border-[#E5E0D8] overflow-hidden p-1.5">
                      <img
                        src={b.heroImage}
                        alt={b.name}
                        className="h-full w-full object-cover rounded-[2px]"
                      />
                    </div>
                    <div className="flex items-center justify-between font-mono text-[9.5px] text-[#6E6A63] pt-0.5">
                      <span>
                        {isBorners ? 'Modal 92% · 190 г/м²' : 'Polyamide 78% · Free-Cut'}
                      </span>
                      <span className="text-[#161615] font-medium">
                        {isBorners ? 'Core + Print' : '6 Skin Tones'}
                      </span>
                    </div>
                  </div>
                  <div className="sm:col-span-7 p-6 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#7A756D]">
                        {b.segment}
                      </div>
                      <h3 className="font-serif-editorial text-[30px] font-semibold text-[#161615] leading-none">
                        {b.name}
                      </h3>
                      <p className="text-[13.5px] font-medium text-[#161615]">{b.tagline}</p>
                      <p className="text-[13px] text-[#6E6A63] leading-relaxed">
                        {b.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#E5E0D8]">
                      <div>
                        <div className="font-mono text-[10px] uppercase text-[#8C867E]">
                          План 2027
                        </div>
                        <div className="text-[16px] font-semibold text-[#161615] mt-0.5">
                          {hasFinance ? formatCompactRub(b.plannedRevenue2027Rub) : 'Скрыто'}
                        </div>
                      </div>
                      <div>
                        <div className="font-mono text-[10px] uppercase text-[#8C867E]">
                          Целевая маржа
                        </div>
                        <div className="text-[16px] font-semibold text-[#161615] mt-0.5">
                          {hasFinance ? `${b.targetMarginPct}%` : 'Скрыто'}
                        </div>
                      </div>
                      <div>
                        <div className="font-mono text-[10px] uppercase text-[#8C867E]">
                          Матрица / R&amp;D
                        </div>
                        <div className="text-[16px] font-semibold text-[#161615] mt-0.5">
                          {bProducts.length} SKU · {bConcepts.length} R&amp;D
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Бренды портфеля в разработке (без пометки «Новое направление») */}
          {upcomingBrands.length > 0 && (
            <div className="rounded-[8px] bg-[#FDFCFA] border border-[#E5E0D8] p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E0D8] pb-3">
                <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#7A756D]">
                  БРЕНДЫ BORNERS GROUP В РАЗРАБОТКЕ (2026–2027)
                </div>
                <span className="font-mono text-[10.5px] text-[#6E6A63]">
                  Этап: исследование ниши, подбор фабрик и расчёт экономики
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingBrands.map((ub) => (
                  <div
                    key={ub.id}
                    className="rounded-[6px] bg-[#F8F6F2] border border-[#E5E0D8] p-4 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="font-mono text-[10px] uppercase text-[#8C867E]">
                        В ПРОРАБОТКЕ СТРАТЕГИИ
                      </div>
                      <div className="font-serif-editorial text-[24px] font-semibold text-[#161615] leading-none">
                        {ub.name}
                      </div>
                      <p className="text-[13px] text-[#6E6A63] leading-relaxed pt-1">
                        {ub.description}
                      </p>
                    </div>
                    <span className="shrink-0 px-2.5 py-1 rounded-[4px] bg-white border border-[#E5E0D8] font-mono text-[10px] uppercase text-[#6E6A63]">
                      В разработке
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
    // СЛАЙД 02: ДНК, ПОЗИЦИОНИРОВАНИЕ И СРАВНИТЕЛЬНАЯ МАТРИЦА БРЕНДОВ
    // =========================================================================
    if (slide.id === 'brand-dna') {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* BORNERS DNA */}
            <div className="rounded-[8px] bg-[#FDFCFA] border border-[#E5E0D8] overflow-hidden flex flex-col justify-between">
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-12 border-b border-[#E5E0D8]">
                  <div className="sm:col-span-5 h-52 sm:h-auto bg-[#F2EFE9] border-b sm:border-b-0 sm:border-r border-[#E5E0D8] overflow-hidden">
                    <img
                      src="images/products/rnd-print-family.png"
                      alt="BORNERS"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="sm:col-span-7 p-6 space-y-2.5">
                    <span className="inline-block px-2.5 py-0.5 rounded-[4px] bg-[#161615] text-white font-mono text-[10px] uppercase tracking-wider">
                      МАСС-МАРКЕТ+ · МУЖСКОЕ И УНИСЕКС
                    </span>
                    <h3 className="font-serif-editorial text-[34px] font-semibold text-[#161615] leading-none">
                      BORNERS
                    </h3>
                    <p className="text-[13.5px] text-[#5C5852] leading-relaxed">
                      Инженерный комфорт на каждый день, выгодные мультипаки по 3–6 штук, тканые
                      семейные трусы в эстетике Old Money и яркие подарочные капсулы.
                    </p>
                  </div>
                </div>

                <div className="p-6 space-y-4 text-[13.5px]">
                  <div className="p-4 rounded-[6px] bg-[#F8F6F2] border border-[#E5E0D8] space-y-1">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[#7A756D]">
                      Продуктовое преимущество
                    </div>
                    <div className="font-medium text-[#161615]">
                      Анатомический крой с ластовицей без центрального заднего шва, гребенной хлопок
                      пенье и модал 180–185 г/м², ресурс 80+ циклов стирки без пиллинга.
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-[6px] border border-[#E5E0D8]">
                      <div className="font-mono text-[10px] uppercase text-[#8C867E]">
                        Ценовой коридор комплекта
                      </div>
                      <div className="text-[18px] font-semibold text-[#161615] mt-1">
                        1 490 – 2 690 ₽
                      </div>
                      <div className="text-[12px] text-[#1F6E50] font-medium mt-0.5">
                        Целевая валовая маржа: 72%
                      </div>
                    </div>
                    <div className="p-3.5 rounded-[6px] border border-[#E5E0D8]">
                      <div className="font-mono text-[10px] uppercase text-[#8C867E]">
                        Формат продаж
                      </div>
                      <div className="text-[18px] font-semibold text-[#161615] mt-1">
                        Наборы 3 / 4 / 6 шт.
                      </div>
                      <div className="text-[12px] text-[#6E6A63] mt-0.5">
                        Экономия на логистике ФБО WB/Ozon
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[#7A756D]">
                      Фирменная палитра коллекций
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { hex: '#161615', name: 'Глубокий графит' },
                        { hex: '#1E293B', name: 'Тёмно-синий Navy' },
                        { hex: '#B85D35', name: 'Терракота' },
                        { hex: '#6B8EAE', name: 'Полоска Old Money' },
                      ].map((c) => (
                        <div
                          key={c.name}
                          className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[4px] bg-[#F8F6F2] border border-[#E5E0D8] text-[12px]"
                        >
                          <span
                            className="h-3 w-3 rounded-full border border-black/15"
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

            {/* НА ТЕЛЕ DNA */}
            <div className="rounded-[8px] bg-[#FDFCFA] border border-[#E5E0D8] overflow-hidden flex flex-col justify-between">
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-12 border-b border-[#E5E0D8]">
                  <div className="sm:col-span-5 h-52 sm:h-auto bg-[#F2EFE9] border-b sm:border-b-0 sm:border-r border-[#E5E0D8] overflow-hidden">
                    <img
                      src="images/products/rnd-seamless-hero.png"
                      alt="НА ТЕЛЕ"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="sm:col-span-7 p-6 space-y-2.5">
                    <span className="inline-block px-2.5 py-0.5 rounded-[4px] bg-[#7D7268] text-white font-mono text-[10px] uppercase tracking-wider">
                      ПРЕМИУМ · АРХИТЕКТУРА «ВТОРОЙ КОЖИ»
                    </span>
                    <h3 className="font-serif-editorial text-[34px] font-semibold text-[#161615] leading-none">
                      НА ТЕЛЕ
                    </h3>
                    <p className="text-[13.5px] text-[#5C5852] leading-relaxed">
                      Тактильный минимализм, бесшовные клеевые технологии, невесомый микромодал
                      Lenzing и выверенная палитра натуральных оттенков кожи.
                    </p>
                  </div>
                </div>

                <div className="p-6 space-y-4 text-[13.5px]">
                  <div className="p-4 rounded-[6px] bg-[#F8F6F2] border border-[#E5E0D8] space-y-1">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[#7A756D]">
                      Продуктовое преимущество
                    </div>
                    <div className="font-medium text-[#161615]">
                      Лазерный срез края с микросиликоновой фиксацией от скручивания, закрытый пояс
                      без давления и ультратонкое полотно 150–175 г/м².
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-[6px] border border-[#E5E0D8]">
                      <div className="font-mono text-[10px] uppercase text-[#8C867E]">
                        Ценовой коридор
                      </div>
                      <div className="text-[18px] font-semibold text-[#161615] mt-1">
                        2 490 – 3 490 ₽
                      </div>
                      <div className="text-[12px] text-[#1F6E50] font-medium mt-0.5">
                        Целевая валовая маржа: 75%
                      </div>
                    </div>
                    <div className="p-3.5 rounded-[6px] border border-[#E5E0D8]">
                      <div className="font-mono text-[10px] uppercase text-[#8C867E]">
                        Формат продаж
                      </div>
                      <div className="text-[18px] font-semibold text-[#161615] mt-1">
                        1–2 шт. в футляре
                      </div>
                      <div className="text-[12px] text-[#6E6A63] mt-0.5">
                        Капсулы Skin Tone + Бесшовная база 2.0
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[#7A756D]">
                      Палитра Skin Tone &amp; Seamless
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { hex: '#F5EFE6', name: 'Молочный шёлк' },
                        { hex: '#D7BFA8', name: 'Тёплый песочный' },
                        { hex: '#8E9AA6', name: 'Дымчато-голубой' },
                        { hex: '#7D7268', name: 'Глубокий мокко' },
                      ].map((c) => (
                        <div
                          key={c.name}
                          className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[4px] bg-[#F8F6F2] border border-[#E5E0D8] text-[12px]"
                        >
                          <span
                            className="h-3 w-3 rounded-full border border-black/15"
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

          {/* Сравнительная таблица разграничения портфеля по 5 осям */}
          <div className="rounded-[8px] bg-[#FDFCFA] border border-[#E5E0D8] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5E0D8] bg-[#F8F6F2] flex items-center justify-between">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#7A756D]">
                МАТРИЦА РАЗГРАНИЧЕНИЯ БРЕНДОВ (ЗАЩИТА ОТ ВНУТРЕННЕЙ КОНКУРЕНЦИИ)
              </span>
              <span className="font-mono text-[10.5px] text-[#6E6A63]">
                5 ключевых параметров
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[#E5E0D8] text-[#7A756D] font-mono text-[10.5px] uppercase">
                    <th className="py-3 px-5 w-1/4">Критерий</th>
                    <th className="py-3 px-5 w-3/8 border-l border-[#E5E0D8] text-[#161615]">
                      BORNERS
                    </th>
                    <th className="py-3 px-5 w-3/8 border-l border-[#E5E0D8] text-[#161615]">
                      НА ТЕЛЕ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E0D8]">
                  <tr>
                    <td className="py-3 px-5 font-medium text-[#6E6A63]">Мотив покупки</td>
                    <td className="py-3 px-5 border-l border-[#E5E0D8] text-[#161615]">
                      Надёжная база на каждый день в выгодном комплекте (3–6 шт.) или готовый подарок в тубусе
                    </td>
                    <td className="py-3 px-5 border-l border-[#E5E0D8] text-[#161615]">
                      Тактильное удовольствие, невидимость под одеждой и эстетика «второй кожи»
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-medium text-[#6E6A63]">Конструкция и швы</td>
                    <td className="py-3 px-5 border-l border-[#E5E0D8] text-[#161615]">
                      Плоские распошивальные швы (4 иглы 6 нитей), жаккардовый или обтяжной пояс 35–40 мм
                    </td>
                    <td className="py-3 px-5 border-l border-[#E5E0D8] text-[#161615]">
                      Бесшовная ультразвуковая склейка, лазерный край с микросиликоном, скрытый пояс 26–30 мм
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-medium text-[#6E6A63]">Полотна и составы</td>
                    <td className="py-3 px-5 border-l border-[#E5E0D8] text-[#161615]">
                      Хлопок пенье + модал (180–185 г/м²), 100% тканый гребенной поплин (семейные трусы)
                    </td>
                    <td className="py-3 px-5 border-l border-[#E5E0D8] text-[#161615]">
                      Микромодал Lenzing Air с эластаном Lycra (150–170 г/м²), микрорубчик премиум
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-medium text-[#6E6A63]">Средняя цена за 1 ед.</td>
                    <td className="py-3 px-5 border-l border-[#E5E0D8] text-[#161615]">
                      430 – 830 ₽ за 1 пару белья в составе мультипака
                    </td>
                    <td className="py-3 px-5 border-l border-[#E5E0D8] text-[#161615]">
                      1 245 – 2 590 ₽ за 1 изделие в индивидуальном кашированном футляре
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-medium text-[#6E6A63]">Производственные хабы</td>
                    <td className="py-3 px-5 border-l border-[#E5E0D8] text-[#161615]">
                      Китай (Фошань, Нинбо — трикотаж) + Узбекистан (Ташкент — 100% тканый хлопок)
                    </td>
                    <td className="py-3 px-5 border-l border-[#E5E0D8] text-[#161615]">
                      Специализированные бесшовные фабрики Ханчжоу и Гуандуна (КНР)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // СЛАЙД 03: ПРОДУКТОВАЯ МАТРИЦА 70 / 30 И КАТАЛОГ SKU
    // =========================================================================
    if (slide.id === 'product-matrix') {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 rounded-[8px] bg-[#161615] text-[#F8F6F2] p-7 space-y-4">
              <div className="flex items-center justify-between border-b border-white/12 pb-3">
                <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#B89F86]">
                  ЯДРО АССОРТИМЕНТА · ALWAYS-IN-STOCK
                </span>
                <span className="font-serif-editorial text-[34px] font-semibold text-white leading-none">
                  70% выручки
                </span>
              </div>
              <h3 className="font-serif-editorial text-[28px] font-normal text-white leading-tight">
                Регулярная высокомаржинальная база в комплектах
              </h3>
              <p className="text-[14px] text-[#C8C3B9] leading-relaxed">
                Базовые боксеры из модала, комплекты по 3 / 4 / 6 штук, свободные семейные трусы
                BORNERS и бесшовная база НА ТЕЛЕ. Формируют прогнозируемый денежный поток,
                удерживают топ выдачи WB / Ozon и дают максимальную маржу за счёт единой логистики
                на комплект.
              </p>
            </div>

            <div className="lg:col-span-5 rounded-[8px] bg-[#FDFCFA] border border-[#E5E0D8] p-7 space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-3">
                <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#B85D35]">
                  АКЦЕНТНЫЕ И СЕЗОННЫЕ КАПСУЛЫ
                </span>
                <span className="font-serif-editorial text-[34px] font-semibold text-[#161615] leading-none">
                  30% выручки
                </span>
              </div>
              <h3 className="font-serif-editorial text-[28px] font-normal text-[#161615] leading-tight">
                Лимитированные дропы и подарочные тубусы
              </h3>
              <p className="text-[14px] text-[#5C5852] leading-relaxed">
                Сезонная капсула <span className="font-medium text-[#161615]">BIG LOVE</span> (к 14
                февраля), подарочные наборы в жёстких матовых тубусах и новые цветовые паки.
                Генерируют высокую добавленную стоимость (+400 ₽ к чеку при +65 ₽ на упаковку).
              </p>
            </div>
          </div>

          {/* Живые карточки моделей из каталога */}
          <div className="rounded-[8px] bg-[#FDFCFA] border border-[#E5E0D8] p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E0D8] pb-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8C867E]">
                  ДЕЙСТВУЮЩАЯ МАТРИЦА SKU
                </div>
                <h3 className="text-[20px] font-semibold text-[#161615] mt-0.5">
                  Флагманские модели в каталоге ({filteredProducts.length} SKU)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => jumpToWorkingSection('product-catalog')}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-[6px] bg-[#161615] text-white text-[12.5px] font-medium cursor-pointer hover:bg-[#2C2B29] transition"
              >
                <span>Открыть Каталог моделей</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProducts.slice(0, 6).map((p) => {
                const ue = calculateUnitEconomics(p.economics);
                return (
                  <div
                    key={p.id}
                    onClick={() => jumpToWorkingSection('product-catalog', { productId: p.id })}
                    className="rounded-[6px] border border-[#E5E0D8] hover:border-[#161615] bg-[#F8F6F2] p-4 flex flex-col justify-between gap-4 cursor-pointer transition group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="h-20 w-20 rounded-[4px] bg-[#EAE5DC] border border-[#E5E0D8] overflow-hidden shrink-0">
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-mono text-[10px] uppercase tracking-wider text-[#7A756D]">
                          {p.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : 'BORNERS'} · {p.sku}
                        </div>
                        <div className="text-[14.5px] font-semibold text-[#161615] group-hover:underline truncate mt-0.5">
                          {p.name}
                        </div>
                        <div className="text-[12px] text-[#6E6A63] truncate mt-0.5">
                          {p.fabricComposition} · {p.fabricDensityGsm} г/м²
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#E5E0D8] text-[12.5px]">
                      <div>
                        <span className="font-mono text-[10px] uppercase text-[#8C867E] block">
                          Цена МП
                        </span>
                        <span className="font-semibold text-[#161615]">
                          {formatCurrencyRub(p.economics.actualRetailPrice)}
                        </span>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] uppercase text-[#8C867E] block">
                          Себест.
                        </span>
                        <span className="font-semibold text-[#161615]">
                          {hasCost ? formatCurrencyRub(p.economics.unitCostPrice) : 'Скрыто'}
                        </span>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] uppercase text-[#8C867E] block">
                          Маржа
                        </span>
                        <span className="font-semibold text-[#1F6E50]">
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
    // СЛАЙД 04: PRODUCT LAB R&D — 7 ЭТАПОВ ОТ ИДЕИ ДО ЗАКАЗА ФАБРИКЕ
    // =========================================================================
    if (slide.id === 'rnd-pipeline') {
      return (
        <div className="space-y-6">
          <div className="rounded-[8px] bg-[#FDFCFA] border border-[#E5E0D8] p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E0D8] pb-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8C867E]">
                  PRODUCT LAB v2.0 · ЛАБОРАТОРИЯ БЕЗ ЛИШНЕГО
                </div>
                <h3 className="text-[20px] font-semibold text-[#161615] mt-0.5">
                  Семь этапов внутри одной карточки с обязательными точками контроля
                </h3>
              </div>
              <button
                type="button"
                onClick={() => jumpToWorkingSection('product-lab')}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-[6px] bg-[#161615] text-white text-[12.5px] font-medium cursor-pointer hover:bg-[#2C2B29] transition"
              >
                <span>Открыть фотодоску R&amp;D ({filteredConcepts.length})</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {RND_STAGES_ORDER.map((st) => {
                const count = filteredConcepts.filter(
                  (c) => normalizeConceptStageToSeven(c.stage) === st.stage
                ).length;
                return (
                  <div
                    key={st.stage}
                    onClick={() => jumpToWorkingSection('product-lab')}
                    className="rounded-[6px] border border-[#E5E0D8] hover:border-[#161615] bg-[#F8F6F2] p-3.5 flex flex-col justify-between gap-3 cursor-pointer transition"
                  >
                    <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-2">
                      <span className="font-mono text-[11px] text-[#7A756D]">
                        {st.num}
                      </span>
                      <span className="font-mono text-[15px] font-semibold text-[#161615]">
                        {count}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-[14px] text-[#161615]">{st.name}</div>
                      <div className="text-[11.5px] text-[#6E6A63] mt-0.5 leading-snug">
                        {st.desc}
                      </div>
                    </div>
                    <div className="pt-2 border-t border-[#E5E0D8] font-mono text-[10px] text-[#B85D35]">
                      {st.gate}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Живые карточки разработок с реальными фото */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredConcepts.slice(0, 8).map((c) => (
              <div
                key={c.id}
                onClick={() => jumpToWorkingSection('product-lab', { conceptId: c.id })}
                className="rounded-[8px] bg-[#FDFCFA] border border-[#E5E0D8] hover:border-[#161615] overflow-hidden flex flex-col justify-between cursor-pointer transition group"
              >
                <div>
                  <div className="h-44 bg-[#F2EFE9] border-b border-[#E5E0D8] overflow-hidden relative flex items-center justify-center">
                    {c.imageUrl ? (
                      <img
                        src={c.imageUrl}
                        alt={c.name}
                        className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      />
                    ) : (
                      <span className="font-mono text-[11px] uppercase tracking-wider text-[#8C867E]">
                        Карточка без фото
                      </span>
                    )}
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-[4px] bg-white/90 border border-[#E5E0D8] font-mono text-[10px] text-[#161615]">
                      {CONCEPT_STAGE_LABELS_RU[c.stage]}
                    </span>
                  </div>

                  <div className="p-4 space-y-1.5">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[#7A756D]">
                      {c.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : 'BORNERS'} · {c.code}
                    </div>
                    <h4 className="font-semibold text-[14.5px] text-[#161615] line-clamp-1">
                      {c.name}
                    </h4>
                    <p className="text-[12.5px] text-[#6E6A63] line-clamp-2">
                      {c.ideaDescription || c.whatAttracted}
                    </p>
                  </div>
                </div>

                <div className="px-4 py-2.5 border-t border-[#E5E0D8] bg-[#F8F6F2] text-[11.5px] text-[#6E6A63] flex items-center justify-between">
                  <span className="truncate">Срок: {c.targetLaunchDate}</span>
                  <span className="font-medium text-[#161615] shrink-0 ml-2">Карточка →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // =========================================================================
    // СЛАЙД 05: 14 БЛОКОВ СТРАТЕГИИ БРЕНДОВ
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
        <div className="space-y-5">
          <div className="rounded-[8px] bg-[#FDFCFA] border border-[#E5E0D8] p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 bg-[#F2EFE9] p-1 rounded-[6px] border border-[#E5E0D8]">
              <button
                type="button"
                onClick={() => setStrategyBrandTab('BORNERS')}
                className={`px-4 py-1.5 rounded-[4px] text-[13px] font-medium cursor-pointer transition ${
                  strategyBrandTab === 'BORNERS'
                    ? 'bg-[#161615] text-white'
                    : 'text-[#6E6A63] hover:text-[#161615]'
                }`}
              >
                BORNERS (14 блоков)
              </button>
              <button
                type="button"
                onClick={() => setStrategyBrandTab('NA_TELE')}
                className={`px-4 py-1.5 rounded-[4px] text-[13px] font-medium cursor-pointer transition ${
                  strategyBrandTab === 'NA_TELE'
                    ? 'bg-[#161615] text-white'
                    : 'text-[#6E6A63] hover:text-[#161615]'
                }`}
              >
                НА ТЕЛЕ (14 блоков)
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all' as const, label: 'Все 14 блоков' },
                { id: 'brand' as const, label: 'I · Видение и Клиент (1–4)' },
                { id: 'product' as const, label: 'II · Продукт и Матрица (5–8)' },
                { id: 'growth' as const, label: 'III · Каналы и Маркетинг (9–11)' },
                { id: 'finance' as const, label: 'IV · Финцели и Риски (12–14)' },
              ].map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setStrategyChapter(ch.id)}
                  className={`px-3 py-1.5 rounded-[5px] text-[12px] font-medium cursor-pointer transition border ${
                    strategyChapter === ch.id
                      ? 'bg-[#161615] text-white border-[#161615]'
                      : 'bg-white text-[#5C5852] border-[#E5E0D8] hover:border-[#161615]'
                  }`}
                >
                  {ch.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredBlocks.map((block) => {
              const points = block.content
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean);
              return (
                <div
                  key={block.id}
                  className="rounded-[8px] bg-[#FDFCFA] border border-[#E5E0D8] overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-3">
                      <div className="flex items-baseline gap-2.5">
                        <span className="font-mono text-[12px] text-[#8C867E]">
                          {String(block.sectionOrder).padStart(2, '0')} /
                        </span>
                        <h4 className="font-serif-editorial text-[22px] font-semibold text-[#161615] leading-none">
                          {block.titleRu}
                        </h4>
                      </div>
                      <span className="font-mono text-[10px] uppercase text-[#1F6E50] bg-[#1F6E50]/10 px-2 py-0.5 rounded-[4px]">
                        v{block.version}
                      </span>
                    </div>

                    <p className="text-[14px] font-medium text-[#161615] leading-snug">
                      {block.summary}
                    </p>

                    <ul className="space-y-1.5 text-[13px] text-[#5C5852]">
                      {points.map((pt, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[#8C867E] font-mono text-[11px] mt-0.5">—</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-3 gap-3 px-6 py-3.5 border-t border-[#E5E0D8] bg-[#F8F6F2]">
                    {block.kpiHighlights.map((k, idx) => (
                      <div key={idx}>
                        <div className="font-mono text-[10px] uppercase text-[#8C867E]">
                          {k.label}
                        </div>
                        <div className="text-[13px] font-semibold text-[#161615] mt-0.5">
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
        <div className="space-y-6">
          <div className="rounded-[8px] bg-[#FDFCFA] border border-[#E5E0D8] p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E0D8] pb-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8C867E]">
                  ГРАФИК ВЫВОДА НА РЫНОК
                </div>
                <h3 className="text-[20px] font-semibold text-[#161615] mt-0.5">
                  Ключевые релизы коллекций 2026–2027 ({filteredLaunches.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => jumpToWorkingSection('launch-calendar')}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-[6px] bg-[#161615] text-white text-[12.5px] font-medium cursor-pointer"
              >
                <span>Открыть Календарь запусков</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredLaunches.map((l) => (
                <div
                  key={l.id}
                  onClick={() => jumpToWorkingSection('launch-calendar', { launchId: l.id })}
                  className="rounded-[6px] border border-[#E5E0D8] hover:border-[#161615] bg-[#F8F6F2] overflow-hidden flex flex-col justify-between cursor-pointer transition"
                >
                  <div>
                    <div className="h-40 bg-[#EAE5DC] border-b border-[#E5E0D8] overflow-hidden relative">
                      <img
                        src={l.imageUrl}
                        alt={l.name}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-[4px] bg-[#161615] text-white font-mono text-[10px]">
                        Старт: {l.startDate}
                      </span>
                    </div>

                    <div className="p-5 space-y-2.5">
                      <div className="flex items-center justify-between font-mono text-[10.5px]">
                        <span className="uppercase text-[#7A756D]">
                          {l.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : 'BORNERS'}
                        </span>
                        <span className="font-semibold text-[#161615]">
                          Готовность {l.readinessPct}%
                        </span>
                      </div>
                      <h4 className="text-[16px] font-semibold text-[#161615] leading-snug">
                        {l.name}
                      </h4>
                      <div className="text-[12.5px] text-[#6E6A63]">{l.productionStatus}</div>

                      <div className="h-1.5 w-full rounded-full bg-[#E5E0D8] overflow-hidden">
                        <div
                          className="h-full bg-[#161615]"
                          style={{ width: `${l.readinessPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 px-5 py-3 border-t border-[#E5E0D8] bg-white text-[12.5px]">
                    <div>
                      <span className="font-mono text-[10px] uppercase text-[#8C867E] block">
                        План продаж
                      </span>
                      <span className="font-semibold text-[#161615]">
                        {hasFinance ? formatCompactRub(l.salesPlanRub) : `${l.salesPlanUnits} шт.`}
                      </span>
                    </div>
                    <div>
                      <span className="font-mono text-[10px] uppercase text-[#8C867E] block">
                        Бюджет промо
                      </span>
                      <span className="font-semibold text-[#161615]">
                        {hasFinance ? formatCompactRub(l.marketingBudgetRub) : 'По плану'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {campaigns.slice(0, 3).map((camp) => (
              <div
                key={camp.id}
                className="rounded-[8px] bg-[#FDFCFA] border border-[#E5E0D8] p-5 space-y-2.5"
              >
                <div className="flex items-center justify-between font-mono text-[10px] uppercase text-[#7A756D]">
                  <span>{camp.channel}</span>
                  <span className="text-[#1F6E50]">{camp.status}</span>
                </div>
                <h4 className="text-[16px] font-semibold text-[#161615]">{camp.name}</h4>
                <p className="text-[12.5px] text-[#6E6A63]">{camp.goal}</p>
                <div className="pt-3 border-t border-[#E5E0D8] flex items-center justify-between text-[12.5px]">
                  <span className="text-[#6E6A63]">Целевая выручка кампании:</span>
                  <span className="font-semibold text-[#161615]">
                    {hasFinance ? formatCompactRub(camp.plannedRevenueRub) : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // =========================================================================
    // СЛАЙД 07: ФИНАНСОВАЯ МОДЕЛЬ 2027 И СРАВНЕНИЕ 3 СЦЕНАРИЕВ
    // =========================================================================
    if (slide.id === 'finance-2027') {
      return (
        <div className="space-y-6">
          <div className="rounded-[8px] bg-[#FDFCFA] border border-[#E5E0D8] p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E0D8] pb-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8C867E]">
                  ФИНАНСОВЫЙ ПЛАН ГРУППЫ · 2027
                </div>
                <h3 className="text-[20px] font-semibold text-[#161615] mt-0.5">
                  Помесячная динамика и матрица сценариев ({SCENARIO_LABELS_RU[financialScenario]})
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex bg-[#F2EFE9] p-0.5 rounded-[6px] border border-[#E5E0D8]">
                  {(['Conservative', 'Base', 'Optimistic'] as FinancialScenario[]).map((sc) => (
                    <button
                      key={sc}
                      type="button"
                      onClick={() => setFinancialScenario(sc)}
                      className={`px-3 py-1.5 rounded-[4px] text-[12px] font-medium cursor-pointer transition ${
                        financialScenario === sc
                          ? 'bg-[#161615] text-white'
                          : 'text-[#6E6A63] hover:text-[#161615]'
                      }`}
                    >
                      {SCENARIO_LABELS_RU[sc]}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => jumpToWorkingSection('finance')}
                  className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-[6px] border border-[#161615] bg-white text-[#161615] text-[12px] font-medium cursor-pointer hover:bg-[#F2EFE9]"
                >
                  <span>Таблица P&amp;L →</span>
                </button>
              </div>
            </div>

            {hasFinance ? (
              <>
                {/* Сравнительная таблица всех 3 сценариев */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {scenarioSummaryTable.map((row) => {
                    const isSelected = row.scenario === financialScenario;
                    return (
                      <div
                        key={row.scenario}
                        onClick={() => setFinancialScenario(row.scenario)}
                        className={`rounded-[6px] p-5 border cursor-pointer transition ${
                          isSelected
                            ? 'bg-[#161615] text-white border-[#161615]'
                            : 'bg-[#F8F6F2] text-[#161615] border-[#E5E0D8] hover:border-[#161615]'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider">
                          <span className={isSelected ? 'text-[#B89F86]' : 'text-[#7A756D]'}>
                            Сценарий: {row.label}
                          </span>
                          {isSelected && (
                            <span className="px-1.5 py-0.5 rounded-[3px] bg-white/15 text-white">
                              Выбран
                            </span>
                          )}
                        </div>
                        <div className="font-serif-editorial text-[32px] font-semibold mt-2 leading-none">
                          {formatCompactRub(row.revenueRub)}
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-current/15 text-[12px]">
                          <div>
                            <span className="opacity-65 block">Опер. прибыль</span>
                            <span className="font-semibold">{formatCompactRub(row.profitRub)}</span>
                          </div>
                          <div>
                            <span className="opacity-65 block">Рентабельность</span>
                            <span className="font-semibold">{row.rosPct}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="h-[320px] w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyChartData}
                      margin={{ top: 10, right: 16, left: 0, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="2 2" stroke="#E5E0D8" vertical={false} />
                      <XAxis
                        dataKey="periodLabel"
                        tick={{ fontSize: 11, fill: '#6E6A63' }}
                        axisLine={{ stroke: '#E5E0D8' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#6E6A63' }}
                        axisLine={false}
                        tickLine={false}
                        unit=" млн"
                      />
                      <Tooltip
                        formatter={(val) => [`${val} млн ₽`, '']}
                        contentStyle={{
                          borderRadius: '6px',
                          border: '1px solid #E5E0D8',
                          fontSize: '12.5px',
                        }}
                      />
                      <Bar
                        dataKey="planRevenueM"
                        name="План выручки (млн ₽)"
                        fill="#D8D2C7"
                        radius={[3, 3, 0, 0]}
                      />
                      <Bar
                        dataKey="factRevenueM"
                        name="Факт выручки (млн ₽)"
                        fill="#161615"
                        radius={[3, 3, 0, 0]}
                      />
                      <Bar
                        dataKey="planProfitM"
                        name="План прибыли (млн ₽)"
                        fill="#B85D35"
                        radius={[3, 3, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="p-8 rounded-[6px] bg-[#F8F6F2] text-center text-[#6E6A63]">
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
      <div className="space-y-6">
        <div className="rounded-[8px] bg-[#FDFCFA] border border-[#E5E0D8] p-6 space-y-5">
          <div className="border-b border-[#E5E0D8] pb-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8C867E]">
              КОНТРОЛЬНЫЕ ТОЧКИ ИСПОЛНЕНИЯ
            </div>
            <h3 className="text-[20px] font-semibold text-[#161615] mt-0.5">
              Стратегические цели группы 2026–2027
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {strategicGoals.map((g) => (
              <div
                key={g.id}
                className="rounded-[6px] border border-[#E5E0D8] bg-[#F8F6F2] p-5 space-y-2.5"
              >
                <div className="flex items-center justify-between font-mono text-[10.5px] uppercase">
                  <span className="text-[#7A756D]">
                    {g.brandId === 'ALL'
                      ? 'Вся группа'
                      : g.brandId === 'NA_TELE'
                      ? 'НА ТЕЛЕ'
                      : 'BORNERS'}{' '}
                    · {g.periodQuarter}
                  </span>
                  <span className="text-[#1F6E50] font-semibold">{g.progressPct}% выполнено</span>
                </div>
                <h4 className="text-[16px] font-semibold text-[#161615]">{g.title}</h4>
                <div className="text-[13px] text-[#6E6A63]">
                  Целевой ориентир: <span className="font-medium text-[#161615]">{g.targetMetric}</span> ({g.status})
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#E5E0D8] overflow-hidden">
                  <div
                    className="h-full bg-[#161615]"
                    style={{ width: `${g.progressPct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[8px] bg-[#161615] text-[#F8F6F2] p-7 md:p-9 space-y-6">
          <div className="max-w-2xl space-y-2">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[#B89F86]">
              ОПЕРАЦИОННЫЙ КОНТУР
            </div>
            <h3 className="font-serif-editorial text-[30px] md:text-[36px] font-normal text-white leading-tight">
              Перейти от презентации к рабочим модулям системы
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[
              {
                section: 'product-lab' as const,
                step: '01 / PRODUCT LAB R&D',
                title: 'Фотодоска и разработка',
                desc: `${filteredConcepts.length} моделей на 7 этапах`,
              },
              {
                section: 'product-catalog' as const,
                step: '02 / КАТАЛОГ SKU',
                title: 'Матрица и себестоимость',
                desc: `${filteredProducts.length} утверждённых моделей`,
              },
              {
                section: 'launch-calendar' as const,
                step: '03 / КАЛЕНДАРЬ РЕЛИЗОВ',
                title: 'График запусков',
                desc: `${filteredLaunches.length} коллекций в подготовке`,
              },
              {
                section: 'finance' as const,
                step: '04 / ФИНАНСЫ 2027',
                title: 'План / Факт и P&L',
                desc: 'Юнит-экономика и 3 сценария',
              },
            ].map((item) => (
              <button
                key={item.section}
                type="button"
                onClick={() => jumpToWorkingSection(item.section)}
                className="rounded-[6px] bg-white/8 hover:bg-white/15 border border-white/15 p-5 text-left transition cursor-pointer group"
              >
                <div className="font-mono text-[10px] uppercase tracking-wider text-[#B89F86]">
                  {item.step}
                </div>
                <div className="text-[16px] font-semibold text-white mt-2 flex items-center justify-between">
                  <span>{item.title}</span>
                  <ArrowUpRight className="h-4 w-4 text-[#B89F86] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                </div>
                <div className="text-[12.5px] text-[#9E988E] mt-1">{item.desc}</div>
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
          ? 'fixed inset-0 z-50 bg-[#F8F6F2] overflow-y-auto p-6 md:p-10'
          : 'space-y-6 pb-20'
      }
    >
      {/* ВЕРХНЯЯ ПАНЕЛЬ УПРАВЛЕНИЯ ПРЕЗЕНТАЦИЕЙ (АРХИТЕКТУРНЫЙ ДЕК, z-20 чтобы не перекрывать выпадающие меню шапки z-50) */}
      <div
        className={`${
          isFullscreen ? 'sticky top-2 z-20' : 'sticky top-[64px] z-20'
        } rounded-[8px] bg-[#FDFCFA]/95 backdrop-blur-md border border-[#E5E0D8] overflow-hidden shadow-xs`}
      >
        <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Левая часть: индекс слайда и фильтр бренда */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[4px] bg-[#161615] text-white font-mono text-[10.5px] uppercase tracking-[0.14em]">
              <span>BORNERS GROUP · DECK 2027</span>
            </div>

            <div className="flex items-center bg-[#F2EFE9] p-0.5 rounded-[5px] border border-[#E5E0D8] text-[12px]">
              <button
                type="button"
                onClick={() => setBrandFilter('ALL')}
                className={`px-2.5 py-1 rounded-[4px] font-medium cursor-pointer ${
                  brandFilter === 'ALL'
                    ? 'bg-white text-[#161615] shadow-2xs'
                    : 'text-[#6E6A63]'
                }`}
              >
                Все бренды
              </button>
              <button
                type="button"
                onClick={() => setBrandFilter('BORNERS')}
                className={`px-2.5 py-1 rounded-[4px] font-medium cursor-pointer ${
                  brandFilter === 'BORNERS'
                    ? 'bg-[#161615] text-white'
                    : 'text-[#6E6A63]'
                }`}
              >
                BORNERS
              </button>
              <button
                type="button"
                onClick={() => setBrandFilter('NA_TELE')}
                className={`px-2.5 py-1 rounded-[4px] font-medium cursor-pointer ${
                  brandFilter === 'NA_TELE'
                    ? 'bg-[#161615] text-white'
                    : 'text-[#6E6A63]'
                }`}
              >
                НА ТЕЛЕ
              </button>
            </div>
          </div>

          {/* Правая часть: режим просмотра, печать, полный экран, выход */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-[#F2EFE9] p-0.5 rounded-[5px] border border-[#E5E0D8] text-[12px]">
              <button
                type="button"
                onClick={() => setViewLayout('slides')}
                className={`px-3 py-1 rounded-[4px] font-medium cursor-pointer ${
                  viewLayout === 'slides'
                    ? 'bg-[#161615] text-white'
                    : 'text-[#6E6A63] hover:text-[#161615]'
                }`}
              >
                Слайд-дек ({activeSlideIdx + 1}/8)
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('all')}
                className={`px-3 py-1 rounded-[4px] font-medium cursor-pointer ${
                  viewLayout === 'all'
                    ? 'bg-[#161615] text-white'
                    : 'text-[#6E6A63] hover:text-[#161615]'
                }`}
              >
                Полный меморандум
              </button>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              title="Печать или сохранение в PDF"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[5px] bg-white border border-[#E5E0D8] text-[12px] font-medium text-[#161615] hover:border-[#161615] cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[5px] bg-white border border-[#E5E0D8] text-[12px] font-medium text-[#161615] hover:border-[#161615] cursor-pointer"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5" />
                  <span>Обычное окно</span>
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
                className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-[5px] bg-[#161615] text-white text-[12px] font-medium hover:bg-[#2C2B29] cursor-pointer"
              >
                <span>В рабочую систему</span>
              </button>
            )}
          </div>
        </div>

        {/* Оглавление 8 слайдов */}
        {viewLayout === 'slides' && (
          <div className="px-4 py-2 border-t border-[#E5E0D8] bg-[#F8F6F2] flex items-center justify-between gap-3 overflow-x-auto">
            <div className="flex items-center gap-1 overflow-x-auto">
              {PRESENTATION_SLIDES.map((s, idx) => {
                const active = idx === activeSlideIdx;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveSlideIdx(idx)}
                    className={`px-2.5 py-1 rounded-[4px] text-[12px] whitespace-nowrap cursor-pointer transition ${
                      active
                        ? 'bg-[#161615] text-white font-medium'
                        : 'text-[#6E6A63] hover:text-[#161615] hover:bg-white'
                    }`}
                  >
                    <span className="font-mono text-[10.5px] opacity-65 mr-1.5">{s.num}</span>
                    <span>{s.shortTitle}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                disabled={activeSlideIdx === 0}
                onClick={() => setActiveSlideIdx((i) => Math.max(0, i - 1))}
                className="h-7 px-2.5 rounded-[4px] border border-[#E5E0D8] bg-white text-[11.5px] font-medium disabled:opacity-40 cursor-pointer inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>Назад</span>
              </button>
              <button
                type="button"
                disabled={activeSlideIdx === PRESENTATION_SLIDES.length - 1}
                onClick={() =>
                  setActiveSlideIdx((i) => Math.min(PRESENTATION_SLIDES.length - 1, i + 1))
                }
                className="h-7 px-2.5 rounded-[4px] bg-[#161615] text-white text-[11.5px] font-medium disabled:opacity-40 cursor-pointer inline-flex items-center gap-1"
              >
                <span>Далее</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* СОДЕРЖИМОЕ ПРЕЗЕНТАЦИИ */}
      {viewLayout === 'slides' ? (
        <div className="space-y-6">
          {/* Редакционный заголовок текущего слайда */}
          <div className="border-b border-[#E5E0D8] pb-5 flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#7A756D]">
                СЛАЙД {currentSlide.num} / 08 · {currentSlide.kicker}
              </div>
              <h2 className="font-serif-editorial text-[32px] md:text-[40px] font-medium tracking-[-0.01em] text-[#161615] leading-tight">
                {currentSlide.title}
              </h2>
              <p className="text-[14.5px] text-[#5C5852] max-w-3xl">{currentSlide.subtitle}</p>
            </div>
          </div>

          {renderSlideContent(activeSlideIdx)}

          {/* Нижняя навигация по слайдам */}
          <div className="rounded-[8px] bg-[#FDFCFA] border border-[#E5E0D8] px-5 py-3.5 flex items-center justify-between">
            <button
              type="button"
              disabled={activeSlideIdx === 0}
              onClick={() => setActiveSlideIdx((i) => Math.max(0, i - 1))}
              className="h-9 px-4 rounded-[6px] border border-[#E5E0D8] bg-white text-[13px] font-medium disabled:opacity-40 cursor-pointer inline-flex items-center gap-2 hover:border-[#161615]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Предыдущий слайд</span>
            </button>

            <div className="font-mono text-[11px] text-[#7A756D]">
              СЛАЙД {String(activeSlideIdx + 1).padStart(2, '0')} / 08 · КЛАВИШИ ← →
            </div>

            <button
              type="button"
              disabled={activeSlideIdx === PRESENTATION_SLIDES.length - 1}
              onClick={() =>
                setActiveSlideIdx((i) => Math.min(PRESENTATION_SLIDES.length - 1, i + 1))
              }
              className="h-9 px-5 rounded-[6px] bg-[#161615] text-white text-[13px] font-medium disabled:opacity-40 cursor-pointer inline-flex items-center gap-2 hover:bg-[#2C2B29]"
            >
              <span>Следующий слайд</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* РЕЖИМ ПОЛНОГО МЕМОРАНДУМА: ВСЕ 8 СЛАЙДОВ ПОДРЯД */
        <div className="space-y-12">
          {PRESENTATION_SLIDES.map((s, idx) => (
            <section
              key={s.id}
              className="space-y-5 pt-8 border-t border-[#E5E0D8] first:border-t-0 first:pt-0"
            >
              <div className="space-y-1">
                <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#7A756D]">
                  РАЗДЕЛ {s.num} / 08 · {s.kicker}
                </div>
                <h2 className="font-serif-editorial text-[32px] md:text-[38px] font-medium text-[#161615] leading-tight">
                  {s.title}
                </h2>
                <p className="text-[14.5px] text-[#5C5852] max-w-3xl">{s.subtitle}</p>
              </div>
              {renderSlideContent(idx)}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
