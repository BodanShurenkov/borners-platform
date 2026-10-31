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
          1. РЕДАКЦИОННАЯ ШАПКА ГРУППЫ (БЕЗ ДЕКОРАТИВНЫХ ОРАНЖЕВЫХ ПОЛОСОК)
      ===================================================================== */}
      <div className="rounded-[8px] bg-[#FDFCFA] border border-[#E5E0D8] overflow-hidden">
        <div className="p-7 md:p-9 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-7 space-y-3">
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#7A756D]">
              BORNERS GROUP · ОПЕРАЦИОННАЯ СИСТЕМА 2026–2027
            </div>
            <h1 className="font-serif-editorial text-[34px] md:text-[44px] font-medium tracking-[-0.01em] leading-[1.08] text-[#161615]">
              Стратегия брендов, лаборатория продукта и экономика тиражей
            </h1>
            <p className="text-[14.5px] text-[#5C5852] leading-relaxed max-w-2xl">
              Единый рабочий контур портфеля <span className="font-medium text-[#161615]">BORNERS</span> и{' '}
              <span className="font-medium text-[#161615]">НА ТЕЛЕ</span>: от фотореференса и расчёта
              себестоимости за пару до протокола стирки, производственного заказа фабрике и годового P&amp;L.
            </p>
          </div>

          <div className="lg:col-span-5 flex flex-wrap lg:justify-end items-center gap-2.5">
            <button
              type="button"
              onClick={() => setPlatformMode('strategy')}
              className="h-10 px-4 rounded-[6px] border border-[#161615] bg-white hover:bg-[#F2EFE9] text-[#161615] text-[13px] font-medium transition cursor-pointer inline-flex items-center gap-2"
            >
              <span>Презентация стратегии (08 слайдов)</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => navigateTo('product-lab')}
              className="h-10 px-5 rounded-[6px] bg-[#161615] hover:bg-[#2C2B29] text-[#F8F6F2] text-[13px] font-medium transition cursor-pointer inline-flex items-center gap-2"
            >
              <span>Открыть Product Lab</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Конвейер R&D: 7 этапов в одной архитектурной строке */}
        <div className="border-t border-[#E5E0D8] bg-[#F8F6F2] px-7 py-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#7A756D]">
              PRODUCT LAB · КОНВЕЙЕР РАЗРАБОТКИ (1 КАРТОЧКА = 7 ЭТАПОВ)
            </span>
            <button
              type="button"
              onClick={() => navigateTo('product-lab')}
              className="text-[12.5px] font-medium text-[#161615] hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              <span>Перейти к фотодоске ({filteredConcepts.length} в работе)</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {SEVEN_KANBAN_STAGES.map((stageCode, idx) => {
              const count = filteredConcepts.filter(
                (c) => normalizeConceptStageToSeven(c.stage) === stageCode
              ).length;
              return (
                <button
                  key={stageCode}
                  type="button"
                  onClick={() => navigateTo('product-lab')}
                  className="rounded-[6px] bg-white border border-[#E5E0D8] hover:border-[#161615] px-3 py-2.5 text-left transition cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono text-[10px] text-[#8C867E] block">
                      0{idx + 1}
                    </span>
                    <span className="text-[13px] font-medium text-[#161615]">
                      {CONCEPT_STAGE_LABELS_RU[stageCode]}
                    </span>
                  </div>
                  <span className="font-mono text-[14px] font-medium text-[#161615]">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* =====================================================================
          2. СТРОГАЯ СЕТКА 4 КЛЮЧЕВЫХ ПОКАЗАТЕЛЕЙ (АРХИТЕКТУРНЫЕ КАРТОЧКИ)
      ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigateTo('finance')}
          className="rounded-[8px] bg-[#FDFCFA] border border-[#E5E0D8] hover:border-[#161615] p-5 flex flex-col justify-between cursor-pointer transition"
        >
          <div className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#7A756D]">
            <span>01 / План выручки 2027</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-[#8C867E]" />
          </div>
          <div className="mt-4">
            <div className="font-serif-editorial text-[34px] font-semibold tracking-tight text-[#161615] leading-none">
              {hasFinanceAccess ? formatCompactRub(kpiTotals.totalPlanYear) : 'Скрыто'}
            </div>
            <div className="text-[12.5px] text-[#6E6A63] mt-2">
              Сценарий: <span className="font-medium text-[#161615]">{SCENARIO_LABELS_RU[financialScenario]}</span>
            </div>
          </div>
        </div>

        <div
          onClick={() => navigateTo('finance')}
          className="rounded-[8px] bg-[#FDFCFA] border border-[#E5E0D8] hover:border-[#161615] p-5 flex flex-col justify-between cursor-pointer transition"
        >
          <div className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#7A756D]">
            <span>02 / Операционная прибыль</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-[#8C867E]" />
          </div>
          <div className="mt-4">
            <div className="font-serif-editorial text-[34px] font-semibold tracking-tight text-[#161615] leading-none">
              {hasFinanceAccess
                ? formatCompactRub(kpiTotals.totalPlanProfitYear)
                : 'Скрыто'}
            </div>
            <div className="text-[12.5px] text-[#1F6E50] font-medium mt-2">
              Расчётная валовая маржа: {kpiTotals.avgMargin}%
            </div>
          </div>
        </div>

        <div
          onClick={() => navigateTo('product-lab')}
          className="rounded-[8px] bg-[#FDFCFA] border border-[#E5E0D8] hover:border-[#161615] p-5 flex flex-col justify-between cursor-pointer transition"
        >
          <div className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#7A756D]">
            <span>03 / Лаборатория R&amp;D</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-[#8C867E]" />
          </div>
          <div className="mt-4">
            <div className="font-serif-editorial text-[34px] font-semibold tracking-tight text-[#161615] leading-none">
              {filteredConcepts.length} моделей
            </div>
            <div className="text-[12.5px] text-[#6E6A63] mt-2">
              В проработке на 7 этапах доски
            </div>
          </div>
        </div>

        <div
          onClick={() => navigateTo('product-catalog')}
          className="rounded-[8px] bg-[#FDFCFA] border border-[#E5E0D8] hover:border-[#161615] p-5 flex flex-col justify-between cursor-pointer transition"
        >
          <div className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#7A756D]">
            <span>04 / Матрица и Релизы</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-[#8C867E]" />
          </div>
          <div className="mt-4">
            <div className="font-serif-editorial text-[34px] font-semibold tracking-tight text-[#161615] leading-none">
              {filteredProducts.length} SKU · {filteredLaunches.length} релиза
            </div>
            <div className="text-[12.5px] text-[#6E6A63] mt-2">
              Пропорция 70% База / 30% Капсулы
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. ДВА ФЛАГМАНСКИХ БРЕНДА С РЕАЛЬНЫМИ СТУДИЙНЫМИ ФОТОГРАФИЯМИ
      ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeBrands.map((brand) => {
          const isBorners = brand.code === 'BORNERS';
          const accentColor = isBorners ? '#B85D35' : '#7D7268';
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
              className="rounded-[8px] bg-[#FDFCFA] border border-[#E5E0D8] overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-12 border-b border-[#E5E0D8]">
                  <div className="sm:col-span-5 h-56 sm:h-auto bg-[#F2EFE9] border-b sm:border-b-0 sm:border-r border-[#E5E0D8] overflow-hidden">
                    <img
                      src={brand.heroImage}
                      alt={brand.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="sm:col-span-7 p-6 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#7A756D]">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: accentColor }}
                        />
                        <span>{brand.segment}</span>
                      </div>
                      <h2 className="font-serif-editorial text-[30px] font-semibold tracking-tight text-[#161615] leading-none">
                        {brand.name}
                      </h2>
                      <p className="text-[13.5px] font-medium text-[#161615]">
                        {brand.tagline}
                      </p>
                      <p className="text-[13px] text-[#6E6A63] leading-relaxed line-clamp-3">
                        {brand.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-4 gap-3 pt-4 border-t border-[#E5E0D8]">
                      <div>
                        <div className="font-mono text-[10px] uppercase text-[#8C867E]">
                          План 2027
                        </div>
                        <div className="text-[15px] font-semibold text-[#161615] mt-0.5">
                          {hasFinanceAccess
                            ? formatCompactRub(brand.plannedRevenue2027Rub)
                            : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="font-mono text-[10px] uppercase text-[#8C867E]">
                          Маржа
                        </div>
                        <div className="text-[15px] font-semibold text-[#161615] mt-0.5">
                          {hasFinanceAccess ? `${brand.targetMarginPct}%` : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="font-mono text-[10px] uppercase text-[#8C867E]">
                          Матрица
                        </div>
                        <div className="text-[15px] font-semibold text-[#161615] mt-0.5">
                          {brandProducts.length} SKU
                        </div>
                      </div>
                      <div>
                        <div className="font-mono text-[10px] uppercase text-[#8C867E]">
                          R&amp;D
                        </div>
                        <div className="text-[15px] font-semibold text-[#161615] mt-0.5">
                          {brandConcepts.length} мод.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 divide-x divide-[#E5E0D8] bg-[#F8F6F2]">
                <button
                  type="button"
                  onClick={() => {
                    setBrandFilter(brand.code);
                    navigateTo('brand-strategy');
                  }}
                  className="h-10 px-3 text-[12.5px] font-medium text-[#161615] hover:bg-[#161615] hover:text-white transition cursor-pointer"
                >
                  Стратегия (14 блоков)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBrandFilter(brand.code);
                    navigateTo('product-lab');
                  }}
                  className="h-10 px-3 text-[12.5px] font-medium text-[#161615] hover:bg-[#161615] hover:text-white transition cursor-pointer"
                >
                  Product Lab ({brandConcepts.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBrandFilter(brand.code);
                    navigateTo('product-catalog');
                  }}
                  className="h-10 px-3 text-[12.5px] font-medium text-[#161615] hover:bg-[#161615] hover:text-white transition cursor-pointer"
                >
                  Каталог SKU ({brandProducts.length})
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Компактная плашка брендов в проработке (Акуша и Liskani) */}
      {upcomingBrands.length > 0 && brandFilter === 'ALL' && (
        <div className="rounded-[8px] bg-[#FDFCFA] border border-[#E5E0D8] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-[4px] bg-[#F2EFE9] border border-[#E5E0D8] font-mono text-[10px] uppercase tracking-[0.12em] text-[#6E6A63]">
              В разработке 2026–2027
            </span>
            <span className="text-[13.5px] font-medium text-[#161615]">
              Перспективные бренды портфеля:{' '}
              {upcomingBrands.map((b) => `${b.name} (${b.segment})`).join(' · ')}
            </span>
          </div>
          <span className="text-[12.5px] text-[#6E6A63]">
            Формирование бренд-платформы и расчёт юнит-экономики
          </span>
        </div>
      )}

      {/* =====================================================================
          4. НИЖНИЙ РЯД: СЛЕВА ГРАФИК 2027, СПРАВА БЛИЖАЙШИЕ ЗАПУСКИ
      ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* График выручки и прибыли по месяцам */}
        <div className="lg:col-span-7 rounded-[8px] bg-[#FDFCFA] border border-[#E5E0D8] p-6 space-y-5">
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
  );
}
