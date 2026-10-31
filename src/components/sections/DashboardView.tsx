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
import { ArrowUpRight, Lock } from 'lucide-react';
import { usePlatform } from '@/context/PlatformContext';
import {
  ROLE_LABELS_RU,
  SCENARIO_LABELS_RU,
  TASK_STATUS_LABELS_RU,
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
    strategicGoals,
    tasks,
    users,
    currentUser,
    brandFilter,
    setBrandFilter,
    periodFilter,
    platformMode,
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

  const filteredGoals = useMemo(
    () =>
      strategicGoals.filter(
        (g) => brandFilter === 'ALL' || g.brandId === 'ALL' || g.brandId === brandFilter
      ),
    [strategicGoals, brandFilter]
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
    const totalPlanProfitFilled = filledMonths.reduce(
      (acc, m) => acc + m.planProfitRaw,
      0
    );
    const totalFactProfitFilled = filledMonths.reduce(
      (acc, m) => acc + (m.factProfitRaw ?? 0),
      0
    );
    const totalPlanYear = monthlyChartData.reduce((acc, m) => acc + m.planRevenueRaw, 0);

    const revVariance = calculatePlanFactVariance(
      totalPlanFilled,
      filledMonths.length > 0 ? totalFactFilled : null
    );
    const profitVariance = calculatePlanFactVariance(
      totalPlanProfitFilled,
      filledMonths.length > 0 ? totalFactProfitFilled : null
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
        : 0;

    return {
      totalPlanYear,
      totalPlanFilled,
      totalFactFilled: filledMonths.length > 0 ? totalFactFilled : null,
      totalPlanProfitFilled,
      totalFactProfitFilled: filledMonths.length > 0 ? totalFactProfitFilled : null,
      revVariance,
      profitVariance,
      avgMargin,
    };
  }, [monthlyChartData, filteredProducts]);

  const todayStr = '2027-02-01';

  const priorityTasks = useMemo(
    () =>
      tasks
        .filter(
          (t) =>
            !t.isArchived &&
            t.status !== 'Done' &&
            (brandFilter === 'ALL' || t.brandId === 'ALL' || t.brandId === brandFilter)
        )
        .sort((a, b) => a.deadline.localeCompare(b.deadline))
        .slice(0, 6),
    [tasks, brandFilter]
  );

  const overdueCount = useMemo(
    () =>
      tasks.filter(
        (t) =>
          !t.isArchived &&
          t.status !== 'Done' &&
          t.deadline < todayStr &&
          (brandFilter === 'ALL' || t.brandId === 'ALL' || t.brandId === brandFilter)
      ).length,
    [tasks, brandFilter]
  );

  const getUserName = (id: string) =>
    users.find((u) => u.id === id)?.fullName || 'Команда';

  return (
    <div className="space-y-10 pb-20">
      {/* БЛОК 1 — HERO (п. 4 ТЗ: Тёмный блок #111111, заголовок 48–64px) */}
      <div className="bg-[#111111] text-white rounded-2xl p-8 md:p-11 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-3 text-[13px] font-medium uppercase tracking-[0.14em] text-neutral-400">
            <span className="h-2 w-2 rounded-full bg-[#D97745]" />
            <span>
              BORNERS GROUP · СТРАТЕГИЯ И ПРОДУКТ · {periodFilter} ·{' '}
              {SCENARIO_LABELS_RU[financialScenario]}
            </span>
          </div>
          <h1 className="text-[36px] md:text-[50px] font-bold tracking-[-0.03em] leading-[1.08] text-white">
            Создаём новое поколение бельевых брендов
          </h1>
          <p className="text-[16px] text-neutral-300 leading-relaxed max-w-2xl">
            Единая платформа управления брендами <b className="text-white">BORNERS</b> и{' '}
            <b className="text-white">НА ТЕЛЕ</b>: от продуктовой матрицы и лаборатории R&D
            до ТЗ для фабрик, запусков и юнит-экономики.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => navigateTo('product-catalog')}
            className="h-12 px-6 rounded-xl bg-white text-[#171717] text-[15px] font-semibold hover:bg-neutral-200 transition cursor-pointer"
          >
            Каталог моделей ({filteredProducts.length})
          </button>
          <button
            onClick={() => navigateTo('product-lab')}
            className="h-12 px-6 rounded-xl bg-[#D97745] text-white text-[15px] font-semibold hover:opacity-90 transition cursor-pointer"
          >
            Лаборатория R&D →
          </button>
        </div>
      </div>

      {/* БЛОК 2 — КАРТОЧКИ БРЕНДОВ BORNERS И НА ТЕЛЕ (п. 4 ТЗ + предметная съёмка) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {brands
          .filter((b) => !b.isStrategyInDevelopment)
          .map((brand) => {
            const isBorners = brand.code === 'BORNERS';
            const accentColor = isBorners ? '#D97745' : '#8B8078';
            const bProducts = products.filter(
              (p) => !p.isArchived && (p.brandId === brand.id || p.brandId === brand.code)
            );
            const bLaunches = launches.filter(
              (l) => !l.isArchived && (l.brandId === brand.id || l.brandId === brand.code)
            );

            return (
              <div
                key={brand.id}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-[#E8E8E5] dark:border-zinc-800 p-7 flex flex-col justify-between gap-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-6 items-start">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: accentColor }}
                      />
                      <span className="text-[13px] font-semibold uppercase tracking-wider text-[#737373]">
                        {brand.segment}
                      </span>
                      {brand.isDemo && (
                        <span className="px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E8E8E5] text-[11px] font-semibold text-[#737373]">
                          DEMO
                        </span>
                      )}
                    </div>
                    <h2 className="text-[28px] font-bold tracking-tight text-[#171717] dark:text-white">
                      {brand.name}
                    </h2>
                    <p className="text-[15px] text-[#737373] leading-relaxed">
                      {brand.description}
                    </p>
                  </div>

                  {/* Предметная иллюстрация бренда в чистой рамке без наслоения плашек */}
                  <div className="h-40 w-full rounded-xl bg-[#F7F7F5] dark:bg-zinc-800 border border-[#E8E8E5] flex items-center justify-center p-4 overflow-hidden">
                    <img
                      src={brand.heroImage}
                      alt={brand.name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-5 border-t border-[#E8E8E5]">
                  <div>
                    <div className="text-[13px] text-[#737373]">Активные модели</div>
                    <div className="text-[22px] font-bold text-[#171717] dark:text-white mt-0.5">
                      {bProducts.length} SKU
                    </div>
                  </div>
                  <div>
                    <div className="text-[13px] text-[#737373]">План выручки 2027</div>
                    <div className="text-[22px] font-bold text-[#171717] dark:text-white mt-0.5">
                      {hasFinanceAccess
                        ? formatCompactRub(brand.plannedRevenue2027Rub)
                        : 'Скрыто'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[13px] text-[#737373]">Запуски</div>
                    <div className="text-[22px] font-bold text-[#171717] dark:text-white mt-0.5">
                      {bLaunches.length} релиза
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    onClick={() => {
                      setBrandFilter(brand.code);
                      navigateTo('brand-strategy');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#111111] text-white text-[14px] font-semibold hover:bg-neutral-800 transition cursor-pointer"
                  >
                    Стратегия бренда →
                  </button>
                  <button
                    onClick={() => {
                      setBrandFilter(brand.code);
                      navigateTo('product-catalog');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] text-[#171717] text-[14px] font-semibold hover:border-[#171717] transition cursor-pointer"
                  >
                    Каталог моделей
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {/* НОВЫЕ БРЕНДЫ В ПРОРАБОТКЕ СТРАТЕГИИ: АКУША И LISKANI (неактивные) */}
      {brands.some((b) => b.isStrategyInDevelopment) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {brands
            .filter((b) => b.isStrategyInDevelopment)
            .map((brand) => (
              <div
                key={brand.id}
                className="bg-white/60 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-[#E8E8E5] dark:border-zinc-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-80"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#A3A39E]" />
                    <span className="text-[12px] font-semibold uppercase tracking-wider text-[#737373]">
                      Новый бренд портфеля · Неактивен
                    </span>
                  </div>
                  <h3 className="text-[22px] font-bold text-[#171717] dark:text-white">
                    {brand.name}
                  </h3>
                  <p className="text-[14px] text-[#737373] max-w-xl">
                    {brand.description}
                  </p>
                </div>

                <div className="shrink-0">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] text-[13px] font-semibold text-[#737373]">
                    <span className="h-2 w-2 rounded-full bg-[#D99527]" />
                    <span>{brand.statusNote || 'Ведётся проработка стратегии'}</span>
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* БЛОК 3 — КЛЮЧЕВЫЕ МЕТРИКИ (6 карточек по п. 4 ТЗ) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {/* 1. Выручка */}
        <div
          onClick={() => hasFinanceAccess && navigateTo('finance')}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-[#E8E8E5] p-6 flex flex-col justify-between cursor-pointer hover:border-[#737373] transition"
        >
          <div className="flex items-center justify-between text-[14px] font-medium text-[#737373]">
            <span>Выручка (закрытые месяцы)</span>
            <ArrowUpRight className="h-4 w-4 text-[#737373]" />
          </div>
          {hasFinanceAccess ? (
            <div className="mt-4">
              <div className="text-[34px] font-bold tracking-tight text-[#171717] dark:text-white">
                {kpiTotals.totalFactFilled !== null
                  ? formatCompactRub(kpiTotals.totalFactFilled)
                  : 'Нет данных'}
              </div>
              <div className="mt-2 flex items-center gap-3 text-[14px]">
                <span className="text-[#737373]">
                  План: {formatCompactRub(kpiTotals.totalPlanFilled)}
                </span>
                {kpiTotals.revVariance.diffPct !== null && (
                  <span
                    className={`font-semibold ${
                      kpiTotals.revVariance.diffPct >= 0
                        ? 'text-[#16805D]'
                        : 'text-[#C94B4B]'
                    }`}
                  >
                    {kpiTotals.revVariance.diffPct >= 0 ? '+' : ''}
                    {kpiTotals.revVariance.diffPct}%
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2 text-[15px] text-[#737373]">
              <Lock className="h-4 w-4" />
              <span>Скрыто ({ROLE_LABELS_RU[currentUser.role]})</span>
            </div>
          )}
        </div>

        {/* 2. Операционная прибыль */}
        <div
          onClick={() => hasFinanceAccess && navigateTo('finance')}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-[#E8E8E5] p-6 flex flex-col justify-between cursor-pointer hover:border-[#737373] transition"
        >
          <div className="flex items-center justify-between text-[14px] font-medium text-[#737373]">
            <span>Операционная прибыль</span>
            <ArrowUpRight className="h-4 w-4 text-[#737373]" />
          </div>
          {hasFinanceAccess ? (
            <div className="mt-4">
              <div className="text-[34px] font-bold tracking-tight text-[#171717] dark:text-white">
                {kpiTotals.totalFactProfitFilled !== null
                  ? formatCompactRub(kpiTotals.totalFactProfitFilled)
                  : 'Нет данных'}
              </div>
              <div className="mt-2 flex items-center gap-3 text-[14px]">
                <span className="text-[#737373]">
                  План: {formatCompactRub(kpiTotals.totalPlanProfitFilled)}
                </span>
                {kpiTotals.profitVariance.diffPct !== null && (
                  <span
                    className={`font-semibold ${
                      kpiTotals.profitVariance.diffPct >= 0
                        ? 'text-[#16805D]'
                        : 'text-[#C94B4B]'
                    }`}
                  >
                    {kpiTotals.profitVariance.diffPct >= 0 ? '+' : ''}
                    {kpiTotals.profitVariance.diffPct}%
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2 text-[15px] text-[#737373]">
              <Lock className="h-4 w-4" />
              <span>Доступ ограничен</span>
            </div>
          )}
        </div>

        {/* 3. Маржинальность */}
        <div
          onClick={() => navigateTo('product-catalog')}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-[#E8E8E5] p-6 flex flex-col justify-between cursor-pointer hover:border-[#737373] transition"
        >
          <div className="flex items-center justify-between text-[14px] font-medium text-[#737373]">
            <span>Средняя маржинальность</span>
            <ArrowUpRight className="h-4 w-4 text-[#737373]" />
          </div>
          {hasFinanceAccess ? (
            <div className="mt-4">
              <div className="text-[34px] font-bold tracking-tight text-[#171717] dark:text-white">
                {kpiTotals.avgMargin}%
              </div>
              <div className="mt-2 text-[14px] text-[#737373]">
                Годовой план выручки:{' '}
                <b className="text-[#171717]">
                  {formatCompactRub(kpiTotals.totalPlanYear)}
                </b>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-[15px] text-[#737373]">Доступ ограничен</div>
          )}
        </div>

        {/* 4. Активные модели */}
        <div
          onClick={() => navigateTo('product-catalog')}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-[#E8E8E5] p-6 flex flex-col justify-between cursor-pointer hover:border-[#737373] transition"
        >
          <div className="flex items-center justify-between text-[14px] font-medium text-[#737373]">
            <span>Активные модели в каталоге</span>
            <ArrowUpRight className="h-4 w-4 text-[#737373]" />
          </div>
          <div className="mt-4">
            <div className="text-[34px] font-bold tracking-tight text-[#171717] dark:text-white">
              {filteredProducts.length} SKU
            </div>
            <div className="mt-2 text-[14px] text-[#737373]">
              Базовые коллекции, мультипаки и лимитированные капсулы
            </div>
          </div>
        </div>

        {/* 5. Новые разработки */}
        <div
          onClick={() => navigateTo('product-lab')}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-[#E8E8E5] p-6 flex flex-col justify-between cursor-pointer hover:border-[#737373] transition"
        >
          <div className="flex items-center justify-between text-[14px] font-medium text-[#737373]">
            <span>Новые разработки (R&D)</span>
            <ArrowUpRight className="h-4 w-4 text-[#737373]" />
          </div>
          <div className="mt-4">
            <div className="text-[34px] font-bold tracking-tight text-[#171717] dark:text-white">
              {filteredConcepts.length} концептов
            </div>
            <div className="mt-2 text-[14px] text-[#737373]">
              От идеи и прототипа до утверждения фабричного образца
            </div>
          </div>
        </div>

        {/* 6. Ближайшие запуски */}
        <div
          onClick={() => navigateTo('launch-calendar')}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-[#E8E8E5] p-6 flex flex-col justify-between cursor-pointer hover:border-[#737373] transition"
        >
          <div className="flex items-center justify-between text-[14px] font-medium text-[#737373]">
            <span>Ближайшие запуски</span>
            <ArrowUpRight className="h-4 w-4 text-[#737373]" />
          </div>
          <div className="mt-4">
            <div className="text-[28px] font-bold tracking-tight text-[#171717] dark:text-white truncate">
              {filteredLaunches[0]?.name || 'Нет запусков'}
            </div>
            <div className="mt-2 flex items-center gap-3 text-[14px]">
              <span className="text-[#737373]">
                Старт: <b className="text-[#171717]">{filteredLaunches[0]?.startDate || '—'}</b>
              </span>
              <span className="text-[#16805D] font-semibold">
                Готовность {filteredLaunches[0]?.readinessPct ?? 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* БЛОК 4 — ГРАФИК ВЫРУЧКИ И ПРИБЫЛИ (п. 4 ТЗ) */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-[#E8E8E5] p-7 md:p-8 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#E8E8E5] pb-5">
          <div>
            <h2 className="text-[22px] font-bold tracking-tight text-[#171717] dark:text-white">
              График выручки и прибыли по месяцам (млн ₽)
            </h2>
            <p className="text-[14px] text-[#737373] mt-1">
              Сравнение План / Факт · пустые будущие периоды отображаются как «Нет данных»
            </p>
          </div>

          <div className="flex items-center bg-[#F7F7F5] p-1 rounded-xl border border-[#E8E8E5]">
            <button
              onClick={() => setChartMetric('revenue')}
              className={`px-4 py-2 rounded-lg text-[14px] font-semibold transition cursor-pointer ${
                chartMetric === 'revenue'
                  ? 'bg-white text-[#171717] shadow-2xs'
                  : 'text-[#737373] hover:text-[#171717]'
              }`}
            >
              Выручка
            </button>
            <button
              onClick={() => setChartMetric('profit')}
              className={`px-4 py-2 rounded-lg text-[14px] font-semibold transition cursor-pointer ${
                chartMetric === 'profit'
                  ? 'bg-white text-[#171717] shadow-2xs'
                  : 'text-[#737373] hover:text-[#171717]'
              }`}
            >
              Операционная прибыль
            </button>
          </div>
        </div>

        {hasFinanceAccess ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyChartData}
                margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E5" vertical={false} />
                <XAxis
                  dataKey="periodLabel"
                  tick={{ fontSize: 13, fill: '#737373', fontWeight: 500 }}
                  axisLine={{ stroke: '#E8E8E5' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 13, fill: '#737373', fontWeight: 500 }}
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
                    borderRadius: '12px',
                    border: '1px solid #E8E8E5',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                />
                <Bar
                  dataKey={chartMetric === 'revenue' ? 'planRevenueM' : 'planProfitM'}
                  name="План"
                  fill="#E8E8E5"
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
          <div className="h-56 flex items-center justify-center rounded-xl border border-dashed border-[#E8E8E5] text-[15px] text-[#737373]">
            Финансовая аналитика доступна только Владельцу и Администратору
          </div>
        )}
      </div>

      {/* БЛОК 5 — БЛИЖАЙШИЕ ЗАПУСКИ (с предметными превью, датой, статусом и ответственным) */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-[#E8E8E5] p-7 md:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[#E8E8E5] pb-4">
          <div>
            <h2 className="text-[22px] font-bold tracking-tight text-[#171717] dark:text-white">
              Ближайшие запуски коллекций
            </h2>
            <p className="text-[14px] text-[#737373] mt-0.5">
              Готовность производства, контента и отгрузки на склады маркетплейсов
            </p>
          </div>
          <button
            onClick={() => navigateTo('launch-calendar')}
            className="text-[14px] font-semibold text-[#171717] hover:underline cursor-pointer"
          >
            Открыть календарь запусков →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {filteredLaunches.map((launch) => {
            const isBorners = launch.brandId === 'BORNERS';
            return (
              <div
                key={launch.id}
                onClick={() => navigateTo('launch-calendar', { launchId: launch.id })}
                className="rounded-2xl border border-[#E8E8E5] p-5 hover:border-[#171717] transition cursor-pointer flex flex-col justify-between gap-4 bg-[#F7F7F5]/50"
              >
                <div className="space-y-4">
                  <div className="h-36 w-full rounded-xl bg-white border border-[#E8E8E5] flex items-center justify-center p-4">
                    <img
                      src={launch.imageUrl}
                      alt={launch.name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[13px]">
                      <span
                        className="font-semibold"
                        style={{ color: isBorners ? '#D97745' : '#8B8078' }}
                      >
                        {isBorners ? 'BORNERS' : 'НА ТЕЛЕ'}
                      </span>
                      <span className="text-[#737373] font-medium">{launch.status}</span>
                    </div>
                    <h3 className="text-[18px] font-bold text-[#171717] dark:text-white">
                      {launch.name}
                    </h3>
                    <div className="text-[14px] text-[#737373]">{launch.collectionName}</div>
                  </div>
                </div>

                <div className="space-y-2.5 pt-3 border-t border-[#E8E8E5]">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-[#737373]">
                      Старт: <b className="text-[#171717]">{launch.startDate}</b>
                    </span>
                    <span className="font-semibold text-[#171717]">
                      {launch.readinessPct}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#E8E8E5] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${launch.readinessPct}%`,
                        backgroundColor: isBorners ? '#D97745' : '#8B8078',
                      }}
                    />
                  </div>
                  <div className="text-[13px] text-[#737373]">
                    Ответственный: <b className="text-[#171717]">{getUserName(launch.ownerId)}</b>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* БЛОК 6 И 7 — СТРАТЕГИЧЕСКИЙ ПРОГРЕСС И ACTION CENTER (п. 4, 14 ТЗ) */}
      <div
        className={`grid grid-cols-1 ${
          platformMode === 'management' ? 'lg:grid-cols-2' : ''
        } gap-6`}
      >
        {/* Блок 6: Стратегический прогресс */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-[#E8E8E5] p-7 space-y-5">
          <div className="flex items-center justify-between border-b border-[#E8E8E5] pb-4">
            <h2 className="text-[22px] font-bold tracking-tight text-[#171717]">
              Стратегические цели 2026–2027
            </h2>
            <button
              onClick={() => navigateTo('brand-strategy')}
              className="text-[14px] font-semibold text-[#171717] hover:underline cursor-pointer"
            >
              Стратегия →
            </button>
          </div>

          <div className="divide-y divide-[#E8E8E5]">
            {filteredGoals.map((goal) => (
              <div key={goal.id} className="py-4 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[16px] font-semibold text-[#171717]">
                      {goal.title}
                    </div>
                    <div className="text-[14px] text-[#737373] mt-0.5">
                      Цель: {goal.targetMetric} · {goal.periodQuarter} {goal.periodYear}
                    </div>
                  </div>
                  <span className="text-[15px] font-bold text-[#171717] shrink-0">
                    {goal.progressPct}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#F7F7F5] border border-[#E8E8E5] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#16805D]"
                    style={{ width: `${goal.progressPct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Блок 7: Action Center (скрыт в режиме презентации по п. 14 ТЗ) */}
        {platformMode === 'management' && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-[#E8E8E5] p-7 space-y-5">
          <div className="flex items-center justify-between border-b border-[#E8E8E5] pb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-[22px] font-bold tracking-tight text-[#171717]">
                Action Center · Задачи
              </h2>
              {overdueCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-lg bg-[#C94B4B]/10 text-[#C94B4B] text-[13px] font-semibold">
                  Просрочено: {overdueCount}
                </span>
              )}
            </div>
            <button
              onClick={() => navigateTo('roadmap-tasks')}
              className="text-[14px] font-semibold text-[#171717] hover:underline cursor-pointer"
            >
              Все задачи →
            </button>
          </div>

          <div className="divide-y divide-[#E8E8E5]">
            {priorityTasks.map((task) => {
              const isOverdue = task.deadline < todayStr && task.status !== 'Done';
              return (
                <div
                  key={task.id}
                  onClick={() => navigateTo('roadmap-tasks')}
                  className="py-3.5 flex items-center justify-between gap-4 hover:bg-[#F7F7F5] px-3 rounded-xl transition cursor-pointer"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                          isOverdue ? 'bg-[#C94B4B]' : 'bg-[#16805D]'
                        }`}
                      />
                      <span className="text-[16px] font-semibold text-[#171717] dark:text-white truncate">
                        {task.title}
                      </span>
                    </div>
                    <div className="text-[14px] text-[#737373] pl-5">
                      {TASK_STATUS_LABELS_RU[task.status]} ·{' '}
                      {task.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : task.brandId} ·{' '}
                      {getUserName(task.assigneeId)}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-[14px] font-semibold ${
                        isOverdue ? 'text-[#C94B4B]' : 'text-[#737373]'
                      }`}
                    >
                      до {task.deadline}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
