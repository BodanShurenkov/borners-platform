'use client';

import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { ArrowUpRight } from 'lucide-react';
import { usePlatform } from '@/context/PlatformContext';
import {
  SCENARIO_LABELS_RU,
  SEVEN_KANBAN_STAGES,
  CONCEPT_STAGE_LABELS_RU,
  calculatePlanFactVariance,
  calculateUnitEconomics,
  canUserViewFinance,
  formatCompactRub,
  normalizeConceptStageToSeven,
} from '@/lib/finance';

export function DashboardView() {
  const {
    brands,
    products,
    concepts,
    launches,
    financialPlans,
    currentUser,
    brandFilter,
    setBrandFilter,
    setPlatformMode,
    financialScenario,
    navigateTo,
  } = usePlatform();

  const [chartMetric, setChartMetric] = useState<'revenue' | 'profit'>('revenue');

  const hasFinanceAccess = canUserViewFinance(currentUser);

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

  const kpiTotals = useMemo(() => {
    const filledMonths = monthlyChartData.filter((m) => m.factRevenueRaw !== null);
    const totalPlanFilled = filledMonths.reduce((acc, m) => acc + m.planRevenueRaw, 0);
    const totalFactFilled = filledMonths.reduce(
      (acc, m) => acc + (m.factRevenueRaw ?? 0),
      0
    );
    const totalPlanYear = monthlyChartData.reduce((acc, m) => acc + m.planRevenueRaw, 0);
    const totalPlanProfitYear = monthlyChartData.reduce(
      (acc, m) => acc + m.planProfitRaw,
      0
    );

    const revVariance = calculatePlanFactVariance(
      totalPlanFilled,
      filledMonths.length > 0 ? totalFactFilled : null
    );

    const avgMargin =
      filteredProducts.length > 0
        ? Number(
            (
              filteredProducts.reduce(
                (s, p) => s + calculateUnitEconomics(p.economics).marginPct,
                0
              ) / filteredProducts.length
            ).toFixed(1)
          )
        : 73.5;

    return {
      totalPlanYear,
      totalPlanProfitYear,
      totalFactFilled: filledMonths.length > 0 ? totalFactFilled : null,
      revVariance,
      avgMargin,
    };
  }, [monthlyChartData, filteredProducts]);

  const activeBrands = brands.filter(
    (b) =>
      !b.isStrategyInDevelopment &&
      (brandFilter === 'ALL' || b.code === brandFilter || b.id === brandFilter)
  );
  const upcomingBrands = brands.filter((b) => b.isStrategyInDevelopment);

  return (
    <div className="space-y-8 pb-20">
      {/* =====================================================================
          1. СПОКОЙНАЯ РЕДАКЦИОННАЯ ШАПКА + БЕСШОВНАЯ ЛЕНТА ЭТАПОВ PRODUCT LAB
      ===================================================================== */}
      <div className="rounded-[12px] bg-white border border-[#EAE6DF] overflow-hidden">
        <div className="p-7 md:p-9 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-7 space-y-2.5">
            <div className="text-[12.5px] font-medium text-[#8C867E]">
              Операционная сводка портфеля · 2026–2027
            </div>
            <h1 className="font-serif-editorial text-[34px] md:text-[42px] font-medium tracking-[-0.01em] leading-[1.1] text-[#181715]">
              Стратегия брендов, разработка продукта и экономика тиражей
            </h1>
            <p className="text-[14.5px] text-[#5C5852] leading-relaxed max-w-2xl pt-0.5">
              Единое рабочее пространство портфеля <span className="font-medium text-[#181715]">BORNERS</span> и{' '}
              <span className="font-medium text-[#181715]">НА ТЕЛЕ</span>: от фотореференса и расчёта
              себестоимости за пару до протокола стирки, производственного заказа фабрике и годового плана.
            </p>
          </div>

          <div className="lg:col-span-5 flex flex-wrap lg:justify-end items-center gap-2.5">
            <button
              type="button"
              onClick={() => setPlatformMode('strategy')}
              className="h-10 px-4 rounded-[8px] border border-[#DCD6CC] bg-[#FAF8F5] hover:bg-[#F2EFE9] text-[#181715] text-[13px] font-medium transition cursor-pointer inline-flex items-center gap-2"
            >
              <span>Презентация стратегии</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-[#7A756D]" />
            </button>
            <button
              type="button"
              onClick={() => navigateTo('product-lab')}
              className="h-10 px-5 rounded-[8px] bg-[#181715] hover:bg-[#2C2B29] text-[#FAF8F5] text-[13px] font-medium transition cursor-pointer inline-flex items-center gap-2"
            >
              <span>Лаборатория R&amp;D</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Единая бесшовная лента 7 этапов R&D вместо 7 отдельных рамок */}
        <div className="border-t border-[#EAE6DF] bg-[#FAF8F5]">
          <div className="px-7 py-3 border-b border-[#EAE6DF] flex flex-wrap items-center justify-between gap-2">
            <span className="text-[12px] font-medium text-[#7A756D]">
              Этапы отбора моделей в Product Lab
            </span>
            <button
              type="button"
              onClick={() => navigateTo('product-lab')}
              className="text-[12.5px] font-medium text-[#181715] hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              <span>Открыть фотодоску ({filteredConcepts.length} в работе)</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 divide-y sm:divide-y-0 sm:divide-x divide-[#EAE6DF]">
            {SEVEN_KANBAN_STAGES.map((stageCode, idx) => {
              const count = filteredConcepts.filter(
                (c) => normalizeConceptStageToSeven(c.stage) === stageCode
              ).length;
              return (
                <button
                  key={stageCode}
                  type="button"
                  onClick={() => navigateTo('product-lab')}
                  className="px-5 py-3.5 text-left hover:bg-[#F2EFE9] transition cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <span className="text-[11px] text-[#9E988E] block">
                      Этап {idx + 1}
                    </span>
                    <span className="text-[13.5px] font-medium text-[#181715]">
                      {CONCEPT_STAGE_LABELS_RU[stageCode]}
                    </span>
                  </div>
                  <span className="font-serif-editorial text-[22px] font-medium text-[#181715] tabular-nums">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* =====================================================================
          2. ЕДИНАЯ АРХИТЕКТУРНАЯ ЛЕНТА КЛЮЧЕВЫХ ПОКАЗАТЕЛЕЙ (БЕЗ РАЗРОЗНЕННЫХ КОРОБОК)
      ===================================================================== */}
      <div className="rounded-[12px] bg-white border border-[#EAE6DF] overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#EAE6DF]">
          <div
            onClick={() => navigateTo('finance')}
            className="p-6 hover:bg-[#FAF8F5] flex flex-col justify-between cursor-pointer transition"
          >
            <div className="flex items-center justify-between text-[12.5px] font-medium text-[#7A756D]">
              <span>План выручки на 2027 год</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-[#9E988E]" />
            </div>
            <div className="mt-4 space-y-1.5">
              <div className="font-serif-editorial text-[36px] font-medium tracking-tight text-[#181715] leading-none">
                {hasFinanceAccess ? formatCompactRub(kpiTotals.totalPlanYear) : 'Скрыто'}
              </div>
              <div className="text-[12.5px] text-[#7A756D]">
                Сценарий: <span className="text-[#181715] font-medium">{SCENARIO_LABELS_RU[financialScenario]}</span>
              </div>
            </div>
          </div>

          <div
            onClick={() => navigateTo('finance')}
            className="p-6 hover:bg-[#FAF8F5] flex flex-col justify-between cursor-pointer transition"
          >
            <div className="flex items-center justify-between text-[12.5px] font-medium text-[#7A756D]">
              <span>Операционная прибыль</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-[#9E988E]" />
            </div>
            <div className="mt-4 space-y-1.5">
              <div className="font-serif-editorial text-[36px] font-medium tracking-tight text-[#181715] leading-none">
                {hasFinanceAccess
                  ? formatCompactRub(kpiTotals.totalPlanProfitYear)
                  : 'Скрыто'}
              </div>
              <div className="text-[12.5px] text-[#2A6F53] font-medium">
                Средняя валовая маржа: {kpiTotals.avgMargin}%
              </div>
            </div>
          </div>

          <div
            onClick={() => navigateTo('product-lab')}
            className="p-6 hover:bg-[#FAF8F5] flex flex-col justify-between cursor-pointer transition"
          >
            <div className="flex items-center justify-between text-[12.5px] font-medium text-[#7A756D]">
              <span>Разработка в Product Lab</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-[#9E988E]" />
            </div>
            <div className="mt-4 space-y-1.5">
              <div className="font-serif-editorial text-[36px] font-medium tracking-tight text-[#181715] leading-none">
                {filteredConcepts.length} моделей
              </div>
              <div className="text-[12.5px] text-[#7A756D]">
                Проходят отбор и тестирование образцов
              </div>
            </div>
          </div>

          <div
            onClick={() => navigateTo('product-catalog')}
            className="p-6 hover:bg-[#FAF8F5] flex flex-col justify-between cursor-pointer transition"
          >
            <div className="flex items-center justify-between text-[12.5px] font-medium text-[#7A756D]">
              <span>Каталог и запуски</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-[#9E988E]" />
            </div>
            <div className="mt-4 space-y-1.5">
              <div className="font-serif-editorial text-[36px] font-medium tracking-tight text-[#181715] leading-none">
                {filteredProducts.length} SKU · {filteredLaunches.length} релиза
              </div>
              <div className="text-[12.5px] text-[#7A756D]">
                Пропорция 70% регулярная база / 30% дропы
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. ДВА ФЛАГМАНСКИХ БРЕНДА С ЭСТЕТИЧНОЙ СТУДИЙНОЙ СЪЁМКОЙ НА ЛЬНЕ И КАМНЕ
      ===================================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-serif-editorial text-[26px] font-medium text-[#181715]">
            Флагманские бренды портфеля
          </h2>
          <button
            type="button"
            onClick={() => navigateTo('brand-strategy')}
            className="text-[13px] font-medium text-[#5C5852] hover:text-[#181715] cursor-pointer inline-flex items-center gap-1"
          >
            <span>Стратегические паспорта (14 блоков)</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeBrands.map((brand) => {
            const isBorners = brand.code === 'BORNERS';
            const accentColor = isBorners ? '#B85D35' : '#8C7A6B';
            const brandProducts = products.filter(
              (p) => !p.isArchived && (p.brandId === brand.code || p.brandId === brand.id)
            );
            const brandConcepts = concepts.filter(
              (c) =>
                !c.isArchived &&
                !['REJECTED', 'CANCELLED', 'POSTPONED'].includes(c.stage) &&
                (c.brandId === brand.code || c.brandId === brand.id)
            );

            return (
              <div
                key={brand.id}
                className="rounded-[12px] bg-white border border-[#EAE6DF] overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Студийный редакционный кадр на травертине и натуральном льне */}
                  <div className="h-60 w-full bg-[#F3EFE8] border-b border-[#EAE6DF] overflow-hidden relative">
                    <img
                      src={brand.heroImage}
                      alt={brand.name}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>

                  <div className="p-6 md:p-7 space-y-5">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 text-[12px] font-medium text-[#7A756D]">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: accentColor }}
                        />
                        <span>{brand.segment}</span>
                      </div>
                      <h3 className="font-serif-editorial text-[32px] font-medium tracking-tight text-[#181715] leading-none">
                        {brand.name}
                      </h3>
                      <p className="text-[14.5px] font-medium text-[#181715]">
                        {brand.tagline}
                      </p>
                      <p className="text-[13.5px] text-[#6E6A63] leading-relaxed">
                        {brand.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-4 gap-4 pt-5 border-t border-[#EAE6DF]">
                      <div>
                        <div className="text-[11.5px] text-[#8C867E]">
                          План 2027
                        </div>
                        <div className="font-serif-editorial text-[22px] font-medium text-[#181715] mt-0.5 tabular-nums">
                          {hasFinanceAccess
                            ? formatCompactRub(brand.plannedRevenue2027Rub)
                            : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11.5px] text-[#8C867E]">
                          Целевая маржа
                        </div>
                        <div className="font-serif-editorial text-[22px] font-medium text-[#181715] mt-0.5 tabular-nums">
                          {hasFinanceAccess ? `${brand.targetMarginPct}%` : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11.5px] text-[#8C867E]">
                          В каталоге
                        </div>
                        <div className="font-serif-editorial text-[22px] font-medium text-[#181715] mt-0.5 tabular-nums">
                          {brandProducts.length} SKU
                        </div>
                      </div>
                      <div>
                        <div className="text-[11.5px] text-[#8C867E]">
                          В R&amp;D
                        </div>
                        <div className="font-serif-editorial text-[22px] font-medium text-[#181715] mt-0.5 tabular-nums">
                          {brandConcepts.length} мод.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 divide-x divide-[#EAE6DF] border-t border-[#EAE6DF] bg-[#FAF8F5]">
                  <button
                    type="button"
                    onClick={() => {
                      setBrandFilter(brand.code);
                      navigateTo('brand-strategy');
                    }}
                    className="h-10 px-3 text-[12.5px] font-medium text-[#4A4742] hover:bg-[#EFECE6] hover:text-[#181715] transition cursor-pointer"
                  >
                    Стратегия бренда
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBrandFilter(brand.code);
                      navigateTo('product-lab');
                    }}
                    className="h-10 px-3 text-[12.5px] font-medium text-[#4A4742] hover:bg-[#EFECE6] hover:text-[#181715] transition cursor-pointer"
                  >
                    Product Lab ({brandConcepts.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBrandFilter(brand.code);
                      navigateTo('product-catalog');
                    }}
                    className="h-10 px-3 text-[12.5px] font-medium text-[#4A4742] hover:bg-[#EFECE6] hover:text-[#181715] transition cursor-pointer"
                  >
                    Каталог ({brandProducts.length})
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Компактная плашка брендов в разработке (Акуша и Liskani) */}
      {upcomingBrands.length > 0 && brandFilter === 'ALL' && (
        <div className="rounded-[12px] bg-white border border-[#EAE6DF] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-[6px] bg-[#F3EFE8] text-[11.5px] font-medium text-[#6E6A63]">
              В разработке
            </span>
            <span className="text-[14px] font-medium text-[#181715]">
              Бренды портфеля на этапе проработки стратегии:{' '}
              {upcomingBrands.map((b) => b.name).join(' и ')}
            </span>
          </div>
          <span className="text-[13px] text-[#7A756D]">
            Формирование бренд-платформы, подбор фабрик и расчёт экономики
          </span>
        </div>
      )}

      {/* =====================================================================
          4. НИЖНИЙ РЯД: СЛЕВА ГРАФИК 2027, СПРАВА БЛИЖАЙШИЕ ЗАПУСКИ
      ===================================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-serif-editorial text-[26px] font-medium text-[#181715]">
            Финансовая динамика и ближайшие релизы
          </h2>
          <button
            type="button"
            onClick={() => navigateTo('launch-calendar')}
            className="text-[13px] font-medium text-[#5C5852] hover:text-[#181715] cursor-pointer inline-flex items-center gap-1"
          >
            <span>Календарь запусков</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* График выручки и прибыли по месяцам */}
          <div className="lg:col-span-7 rounded-[12px] bg-white border border-[#EAE6DF] p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E0D8] pb-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8C867E]">
                ФИНАНСОВАЯ ДИНАМИКА · 2027
              </div>
              <h2 className="text-[18px] font-semibold text-[#161615] mt-0.5">
                Помесячный план и факт (млн ₽)
              </h2>
            </div>

            <div className="flex items-center bg-[#F2EFE9] p-0.5 rounded-[6px] border border-[#E5E0D8]">
              <button
                type="button"
                onClick={() => setChartMetric('revenue')}
                className={`px-3 py-1 rounded-[4px] text-[12px] font-medium transition cursor-pointer ${
                  chartMetric === 'revenue'
                    ? 'bg-white text-[#161615] shadow-2xs'
                    : 'text-[#6E6A63]'
                }`}
              >
                Выручка
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('profit')}
                className={`px-3 py-1 rounded-[4px] text-[12px] font-medium transition cursor-pointer ${
                  chartMetric === 'profit'
                    ? 'bg-white text-[#161615] shadow-2xs'
                    : 'text-[#6E6A63]'
                }`}
              >
                Прибыль
              </button>
            </div>
          </div>

          {hasFinanceAccess ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyChartData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
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
                    unit=" М"
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (value === null || value === undefined) {
                        return ['Нет данных', String(name)];
                      }
                      return [`${value} млн ₽`, String(name)];
                    }}
                    contentStyle={{
                      borderRadius: '6px',
                      border: '1px solid #E5E0D8',
                      fontSize: '12.5px',
                    }}
                  />
                  <Bar
                    dataKey={chartMetric === 'revenue' ? 'planRevenueM' : 'planProfitM'}
                    name="План"
                    fill="#D8D2C7"
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey={chartMetric === 'revenue' ? 'factRevenueM' : 'factProfitM'}
                    name="Факт"
                    fill="#161615"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center rounded-[6px] border border-dashed border-[#E5E0D8] text-[13.5px] text-[#6E6A63]">
              Финансовая аналитика доступна Владельцу и Администратору
            </div>
          )}
        </div>

        {/* Ближайшие запуски коллекций */}
        <div className="lg:col-span-5 rounded-[8px] bg-[#FDFCFA] border border-[#E5E0D8] p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8C867E]">
                  КАЛЕНДАРЬ РЕЛИЗОВ
                </div>
                <h2 className="text-[18px] font-semibold text-[#161615] mt-0.5">
                  Ближайшие запуски
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigateTo('launch-calendar')}
                className="text-[12.5px] font-medium text-[#161615] hover:underline cursor-pointer"
              >
                Все релизы →
              </button>
            </div>

            <div className="space-y-3">
              {filteredLaunches.slice(0, 3).map((launch) => {
                const isBorners = launch.brandId === 'BORNERS';
                return (
                  <div
                    key={launch.id}
                    onClick={() => navigateTo('launch-calendar', { launchId: launch.id })}
                    className="rounded-[6px] bg-[#F8F6F2] border border-[#E5E0D8] hover:border-[#161615] p-3.5 flex items-center gap-3.5 cursor-pointer transition"
                  >
                    <div className="h-14 w-14 rounded-[4px] bg-[#EAE5DC] border border-[#E5E0D8] overflow-hidden shrink-0">
                      <img
                        src={launch.imageUrl}
                        alt={launch.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between font-mono text-[10.5px]">
                        <span className="uppercase text-[#161615] font-medium">
                          {isBorners ? 'BORNERS' : 'НА ТЕЛЕ'}
                        </span>
                        <span className="text-[#6E6A63]">
                          Старт: {launch.startDate}
                        </span>
                      </div>
                      <div className="font-medium text-[14px] text-[#161615] truncate">
                        {launch.name}
                      </div>
                      <div className="h-1 w-full rounded-full bg-[#E5E0D8] overflow-hidden">
                        <div
                          className="h-full bg-[#161615]"
                          style={{
                            width: `${launch.readinessPct}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
