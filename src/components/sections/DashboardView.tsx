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
  calculatePlanFactVariance,
  calculateUnitEconomics,
  canUserViewFinance,
  formatCompactRub,
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
          1. EDITORIAL HERO CARD (В ЭСТЕТИКЕ ОБЛОЖКИ UX SPEC V2.0)
      ===================================================================== */}
      <div className="rounded-[32px] bg-white border border-[#EAE6DF] p-7 md:p-10 space-y-7 shadow-2xs">
        <div className="space-y-2">
          <div className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#6E6A64]">
            BORNERS GROUP · STRATEGY 2027 / PRODUCT LAB
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#D97745]" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-3">
            <h1 className="text-[36px] md:text-[46px] font-extrabold tracking-[-0.03em] leading-[1.06] text-[#171717]">
              ПЛАТФОРМА СТРАТЕГИИ И ЛАБОРАТОРИИ БЕЗ ЛИШНЕГО
            </h1>
            <p className="text-[16px] text-[#6E6A64] leading-relaxed">
              Единая система управления брендами <b className="text-[#171717]">BORNERS</b> и{' '}
              <b className="text-[#171717]">НА ТЕЛЕ</b>: визуальные идеи, понятные решения,
              готовый заказ фабрике и финансовая модель 2027.
            </p>
          </div>

          {/* Блок «ОДНА КАРТОЧКА. СЕМЬ ЭТАПОВ.» из обложки PDF */}
          <div
            onClick={() => navigateTo('product-lab')}
            className="lg:col-span-6 rounded-[24px] border border-[#EAE6DF] bg-[#FAF8F5] p-6 space-y-4 cursor-pointer hover:border-[#D97745] transition group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#6E6A64]">
                ОДНА КАРТОЧКА. СЕМЬ ЭТАПОВ. ({filteredConcepts.length} МОДЕЛЕЙ В РАБОТЕ)
              </span>
              <span className="text-[12px] font-bold text-[#D97745] group-hover:translate-x-1 transition">
                Открыть фотодоску →
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { num: '01', title: 'Идея', warm: true },
                { num: '02', title: 'Анализ', warm: false },
                { num: '03', title: 'Образец', warm: false },
                { num: '04', title: 'Тест', warm: false },
              ].map((st) => (
                <div
                  key={st.num}
                  className={`h-12 rounded-xl px-3.5 flex items-center text-[13px] font-bold text-[#171717] ${
                    st.warm ? 'bg-[#FBF1EA]' : 'bg-[#EFECE6]'
                  }`}
                >
                  {st.num} {st.title}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2.5 max-w-md mx-auto">
              {[
                { num: '05', title: 'Решение', warm: true },
                { num: '06', title: 'Производство', warm: false },
                { num: '07', title: 'Запуск', warm: false },
              ].map((st) => (
                <div
                  key={st.num}
                  className={`h-12 rounded-xl px-3.5 flex items-center text-[13px] font-bold text-[#171717] ${
                    st.warm ? 'bg-[#FBF1EA]' : 'bg-[#EFECE6]'
                  }`}
                >
                  {st.num} {st.title}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Тёмная плашка ПРАВИЛО ПРОЕКТА + 2 главные кнопки */}
        <div className="rounded-[22px] bg-[#141413] text-white p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#D97745]">
              ПРАВИЛО ПРОЕКТА
            </div>
            <div className="text-[16px] md:text-[18px] font-bold">
              Меньше полей. Больше фотографий. Каждый этап заканчивается понятным результатом.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setPlatformMode('strategy')}
              className="h-11 px-5 rounded-full bg-white text-[#171717] text-[13px] font-bold hover:bg-[#F4F1EC] transition cursor-pointer"
            >
              🎬 Презентация стратегии (8 слайдов)
            </button>
            <button
              type="button"
              onClick={() => navigateTo('product-lab')}
              className="h-11 px-6 rounded-full bg-[#D97745] hover:bg-[#C26535] text-white text-[13px] font-bold transition cursor-pointer"
            >
              Лаборатория продукта →
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          2. СИММЕТРИЧНАЯ ПОЛОСА 4 КЛЮЧЕВЫХ МЕТРИК (РОВНАЯ СЕТКА 4 КОЛОНКИ)
      ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div
          onClick={() => navigateTo('finance')}
          className="rounded-[24px] bg-white border border-[#EAE6DF] hover:border-[#171717] p-6 flex flex-col justify-between cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-[13px] font-bold uppercase tracking-wider text-[#6E6A64]">
            <span>План выручки 2027</span>
            <ArrowUpRight className="h-4 w-4 text-[#D97745]" />
          </div>
          <div className="mt-4">
            <div className="text-[32px] font-extrabold tracking-tight text-[#171717]">
              {hasFinanceAccess ? formatCompactRub(kpiTotals.totalPlanYear) : 'Скрыто'}
            </div>
            <div className="text-[13px] text-[#6E6A64] mt-1">
              Сценарий: <b className="text-[#171717]">{SCENARIO_LABELS_RU[financialScenario]}</b>
            </div>
          </div>
        </div>

        <div
          onClick={() => navigateTo('finance')}
          className="rounded-[24px] bg-white border border-[#EAE6DF] hover:border-[#171717] p-6 flex flex-col justify-between cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-[13px] font-bold uppercase tracking-wider text-[#6E6A64]">
            <span>Операционная прибыль</span>
            <ArrowUpRight className="h-4 w-4 text-[#16805D]" />
          </div>
          <div className="mt-4">
            <div className="text-[32px] font-extrabold tracking-tight text-[#171717]">
              {hasFinanceAccess
                ? formatCompactRub(kpiTotals.totalPlanProfitYear)
                : 'Скрыто'}
            </div>
            <div className="text-[13px] text-[#16805D] font-bold mt-1">
              Средняя валовая маржа: {kpiTotals.avgMargin}%
            </div>
          </div>
        </div>

        <div
          onClick={() => navigateTo('product-lab')}
          className="rounded-[24px] bg-white border border-[#EAE6DF] hover:border-[#171717] p-6 flex flex-col justify-between cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-[13px] font-bold uppercase tracking-wider text-[#6E6A64]">
            <span>Лаборатория продукта</span>
            <ArrowUpRight className="h-4 w-4 text-[#D97745]" />
          </div>
          <div className="mt-4">
            <div className="text-[32px] font-extrabold tracking-tight text-[#171717]">
              {filteredConcepts.length} моделей
            </div>
            <div className="text-[13px] text-[#6E6A64] mt-1">
              Фотодоска · 7 этапов до заказа фабрике
            </div>
          </div>
        </div>

        <div
          onClick={() => navigateTo('product-catalog')}
          className="rounded-[24px] bg-white border border-[#EAE6DF] hover:border-[#171717] p-6 flex flex-col justify-between cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-[13px] font-bold uppercase tracking-wider text-[#6E6A64]">
            <span>Каталог и Запуски</span>
            <ArrowUpRight className="h-4 w-4 text-[#171717]" />
          </div>
          <div className="mt-4">
            <div className="text-[32px] font-extrabold tracking-tight text-[#171717]">
              {filteredProducts.length} SKU · {filteredLaunches.length} релиза
            </div>
            <div className="text-[13px] text-[#6E6A64] mt-1">
              Матрица 70% База / 30% Дропы
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. ДВА ФЛАГМАНСКИХ БРЕНДА В СТРОГОЙ СИММЕТРИИ (BORNERS И НА ТЕЛЕ)
      ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeBrands.map((brand) => {
          const isBorners = brand.code === 'BORNERS';
          const accentColor = isBorners ? '#D97745' : '#8B8078';
          const brandProducts = products.filter(
            (p) => !p.isArchived && (p.brandId === brand.code || p.brandId === brand.id)
          );
          const brandConcepts = concepts.filter(
            (c) =>
              !c.isArchived &&
              !['REJECTED', 'CANCELLED'].includes(c.stage) &&
              (c.brandId === brand.code || c.brandId === brand.id)
          );

          return (
            <div
              key={brand.id}
              className="rounded-[28px] bg-white border border-[#EAE6DF] p-7 flex flex-col justify-between space-y-6 shadow-2xs"
            >
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                  <div className="sm:col-span-5 h-44 rounded-2xl bg-[#F4F1EC] border border-[#EAE6DF] flex items-center justify-center p-4">
                    <img
                      src={brand.heroImage}
                      alt={brand.name}
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <div className="sm:col-span-7 space-y-2">
                    <div className="inline-flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-wider text-[#6E6A64]">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: accentColor }}
                      />
                      <span>{brand.segment}</span>
                    </div>
                    <h2 className="text-[28px] font-extrabold tracking-tight text-[#171717]">
                      {brand.name}
                    </h2>
                    <p className="text-[14px] font-semibold text-[#171717]">
                      {brand.tagline}
                    </p>
                    <p className="text-[13px] text-[#6E6A64] line-clamp-2">
                      {brand.description}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 pt-4 border-t border-[#EAE6DF] text-[13px]">
                  <div>
                    <div className="text-[11px] uppercase font-bold text-[#6E6A64]">
                      План 2027
                    </div>
                    <div className="text-[18px] font-extrabold text-[#171717] mt-0.5">
                      {hasFinanceAccess
                        ? formatCompactRub(brand.plannedRevenue2027Rub)
                        : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase font-bold text-[#6E6A64]">
                      Маржа
                    </div>
                    <div className="text-[18px] font-extrabold text-[#171717] mt-0.5">
                      {hasFinanceAccess ? `${brand.targetMarginPct}%` : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase font-bold text-[#6E6A64]">
                      Каталог
                    </div>
                    <div className="text-[18px] font-extrabold text-[#171717] mt-0.5">
                      {brandProducts.length} SKU
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase font-bold text-[#6E6A64]">
                      В R&D
                    </div>
                    <div className="text-[18px] font-extrabold text-[#D97745] mt-0.5">
                      {brandConcepts.length} мод.
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-[#EAE6DF]">
                <button
                  type="button"
                  onClick={() => {
                    setBrandFilter(brand.code);
                    navigateTo('brand-strategy');
                  }}
                  className="h-10 rounded-full bg-[#141413] text-white text-[12px] font-bold hover:bg-[#D97745] transition cursor-pointer"
                >
                  Стратегия (14 блоков)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBrandFilter(brand.code);
                    navigateTo('product-lab');
                  }}
                  className="h-10 rounded-full bg-[#FBF1EA] text-[#D97745] text-[12px] font-bold hover:bg-[#D97745] hover:text-white transition cursor-pointer"
                >
                  Фотодоска R&D ({brandConcepts.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBrandFilter(brand.code);
                    navigateTo('product-catalog');
                  }}
                  className="h-10 rounded-full bg-[#F4F1EC] text-[#171717] text-[12px] font-bold hover:bg-[#141413] hover:text-white transition cursor-pointer"
                >
                  Каталог ({brandProducts.length})
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Компактная плашка брендов в проработке (Акуша и Liskani) */}
      {upcomingBrands.length > 0 && brandFilter === 'ALL' && (
        <div className="rounded-[24px] bg-white border border-[#EAE6DF] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-[#F4F1EC] text-[11px] font-extrabold uppercase tracking-wider text-[#6E6A64]">
              В проработке Q3–Q4 2026
            </span>
            <span className="text-[14px] font-bold text-[#171717]">
              Новые направления портфеля:{' '}
              {upcomingBrands.map((b) => `${b.name} (${b.segment})`).join(' · ')}
            </span>
          </div>
          <span className="text-[13px] text-[#6E6A64]">
            Сейчас формируется продуктовая матрица и позиционирование
          </span>
        </div>
      )}

      {/* =====================================================================
          4. НИЖНИЙ РЯД В 2 КОЛОНКИ: СЛЕВА ГРАФИК 2027, СПРАВА БЛИЖАЙШИЕ ЗАПУСКИ
      ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* График выручки и прибыли по месяцам */}
        <div className="lg:col-span-7 rounded-[28px] bg-white border border-[#EAE6DF] p-7 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE6DF] pb-4">
            <div>
              <h2 className="text-[20px] font-extrabold text-[#171717]">
                Динамика выручки и прибыли 2027 (млн ₽)
              </h2>
              <p className="text-[13px] text-[#6E6A64]">
                План / Факт по месяцам · пустые будущие периоды — «Нет данных»
              </p>
            </div>

            <div className="flex items-center bg-[#F4F1EC] p-1 rounded-full border border-[#EAE6DF]">
              <button
                type="button"
                onClick={() => setChartMetric('revenue')}
                className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold transition cursor-pointer ${
                  chartMetric === 'revenue'
                    ? 'bg-white text-[#171717] shadow-2xs'
                    : 'text-[#6E6A64]'
                }`}
              >
                Выручка
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('profit')}
                className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold transition cursor-pointer ${
                  chartMetric === 'profit'
                    ? 'bg-white text-[#171717] shadow-2xs'
                    : 'text-[#6E6A64]'
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#EAE6DF" vertical={false} />
                  <XAxis
                    dataKey="periodLabel"
                    tick={{ fontSize: 12, fill: '#6E6A64', fontWeight: 600 }}
                    axisLine={{ stroke: '#EAE6DF' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6E6A64', fontWeight: 600 }}
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
                      borderRadius: '16px',
                      border: '1px solid #EAE6DF',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  />
                  <Bar
                    dataKey={chartMetric === 'revenue' ? 'planRevenueM' : 'planProfitM'}
                    name="План"
                    fill="#E5E0D8"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey={chartMetric === 'revenue' ? 'factRevenueM' : 'factProfitM'}
                    name="Факт"
                    fill="#D97745"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center rounded-2xl border border-dashed border-[#EAE6DF] text-[14px] text-[#6E6A64]">
              Финансовая аналитика доступна Владельцу и Администратору
            </div>
          )}
        </div>

        {/* Ближайшие запуски коллекций */}
        <div className="lg:col-span-5 rounded-[28px] bg-white border border-[#EAE6DF] p-7 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-4">
              <div>
                <h2 className="text-[20px] font-extrabold text-[#171717]">
                  Ближайшие запуски
                </h2>
                <p className="text-[13px] text-[#6E6A64]">
                  Готовность партий и карточек МП
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigateTo('launch-calendar')}
                className="text-[13px] font-bold text-[#D97745] hover:underline cursor-pointer"
              >
                Все запуски →
              </button>
            </div>

            <div className="space-y-3">
              {filteredLaunches.slice(0, 3).map((launch) => {
                const isBorners = launch.brandId === 'BORNERS';
                return (
                  <div
                    key={launch.id}
                    onClick={() => navigateTo('launch-calendar', { launchId: launch.id })}
                    className="rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF] hover:border-[#171717] p-4 flex items-center gap-4 cursor-pointer transition"
                  >
                    <div className="h-14 w-14 rounded-xl bg-white border border-[#EAE6DF] p-1.5 shrink-0 flex items-center justify-center">
                      <img
                        src={launch.imageUrl}
                        alt={launch.name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between text-[12px]">
                        <span
                          className="font-extrabold uppercase"
                          style={{ color: isBorners ? '#D97745' : '#8B8078' }}
                        >
                          {isBorners ? 'BORNERS' : 'НА ТЕЛЕ'}
                        </span>
                        <span className="text-[#6E6A64] font-semibold">
                          Старт: {launch.startDate}
                        </span>
                      </div>
                      <div className="font-bold text-[15px] text-[#171717] truncate">
                        {launch.name}
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[#E5E0D8] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${launch.readinessPct}%`,
                            backgroundColor: isBorners ? '#D97745' : '#8B8078',
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
