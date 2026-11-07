'use client';

import React, { useMemo, useState } from 'react';
import { usePlatform } from '@/context/PlatformContext';
import {
  MONTHS_SHORT_RU,
  computeModelScenarioMetrics,
} from '@/lib/scenarioData';
import { ACTING_2027_SCENARIO_ID, getActingSkuByWbOrVendor } from '@/lib/actingAssortment2027';
import {
  computeFinancialPnL,
  computeProcurementPlan,
  detectModelBrandPortfolioLabel,
  exportStructuredScenarioPlan,
  groupRecommendedBatchesByFactory,
  serializeStructuredPlanToCsv,
} from '@/lib/unifiedBusinessEngine';
import { useLiveScenarioPortfolio } from '@/lib/useLiveScenarioPortfolio';
import { canUserViewCostPrice, canUserViewFinance } from '@/lib/finance';
import { ScenarioSalesPlanScreen } from '@/components/sections/ScenarioSalesPlanScreen';
import { RoadmapTasksView } from '@/components/sections/ManagementAndSystemViews';
import { FinanceView } from '@/components/sections/FinanceAndImportViews';

function formatMln(rub: number): string {
  return `${(rub / 1_000_000).toFixed(2).replace('.', ',')} млн ₽`;
}

function ScenarioContourHeader({
  stepCode,
  title,
  subtitle,
  selectedScenarioId,
  orderedScenarios,
  onSelectScenario,
  includeGroupPortfolioInS1,
  onToggleGroupPortfolio,
  rightSlot,
}: {
  stepCode: string;
  title: string;
  subtitle: string;
  selectedScenarioId: number;
  orderedScenarios: ReturnType<typeof useLiveScenarioPortfolio>['orderedScenarios'];
  onSelectScenario: (id: number) => void;
  includeGroupPortfolioInS1: boolean;
  onToggleGroupPortfolio: (v: boolean) => void;
  rightSlot?: React.ReactNode;
}) {
  return (
    <section className="rounded-[18px] bg-white border-[1.5px] border-[#C8C7BE] p-5 md:p-6 space-y-4 shadow-[0_2px_10px_rgba(20,20,19,0.03)]">
      <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b-[1.5px] border-[#DFDED6]">
        <div>
          <div className="font-mono text-[11px] font-bold uppercase tracking-[0.07em] text-[#5E5D58]">
            {stepCode}
          </div>
          <h1 className="text-[22px] md:text-[25px] font-bold tracking-[-0.02em] text-[#141413] mt-0.5">
            {title}
          </h1>
          <p className="text-[12.5px] text-[#5E5D58] mt-0.5">{subtitle}</p>
        </div>
        {rightSlot && <div className="flex flex-wrap items-center gap-2">{rightSlot}</div>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11.5px] font-bold text-[#5E5D58] mr-1">
            Активный сценарий:
          </span>
          {orderedScenarios.map((sc) => {
            const isSel = sc.id === selectedScenarioId;
            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => onSelectScenario(sc.id)}
                className={`h-8.5 px-3 rounded-[9px] text-[12px] font-semibold border-[1.5px] transition cursor-pointer ${
                  isSel
                    ? 'bg-[#141413] text-white border-[#141413]'
                    : 'bg-[#F7F7F4] hover:bg-white hover:border-[#141413] text-[#262624] border-[#CECDC4]'
                }`}
              >
                {sc.id === ACTING_2027_SCENARIO_ID
                  ? 'Исходный план (7 SKU)'
                  : `${sc.title} · ${sc.monthlyTargetMln} млн ₽/мес`}
              </button>
            );
          })}
        </div>

        {selectedScenarioId === 1 && (
          <div className="inline-flex items-center rounded-[9px] bg-[#EFEFE9] border-[1.5px] border-[#CECDC4] p-0.5 text-[11.5px]">
            <button
              type="button"
              onClick={() => onToggleGroupPortfolio(false)}
              className={`px-2.5 py-1 rounded-[7px] transition cursor-pointer ${
                !includeGroupPortfolioInS1
                  ? 'bg-[#141413] text-white font-semibold'
                  : 'text-[#52514C] hover:text-[#141413] font-semibold'
              }`}
            >
              Цель BORNERS · 21 SKU
            </button>
            <button
              type="button"
              onClick={() => onToggleGroupPortfolio(true)}
              className={`px-2.5 py-1 rounded-[7px] transition cursor-pointer ${
                includeGroupPortfolioInS1
                  ? 'bg-[#141413] text-white font-semibold'
                  : 'text-[#52514C] hover:text-[#141413] font-semibold'
              }`}
            >
              С FUKAI · 23 SKU
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// =============================================================================
// 02 · ПРОДАЖИ: СВОДНАЯ МАТРИЦА ПРОДАЖ ВСЕХ SKU НА 12 МЕСЯЦЕВ (2027)
// =============================================================================
export function SalesMatrixContourView() {
  const { navigateTo, notify } = usePlatform();
  const {
    scenarios,
    orderedScenarios,
    currentScenario,
    selectedScenarioId,
    setSelectedScenarioId,
    includeGroupPortfolioInS1,
    setIncludeGroupPortfolioInS1,
    eligibleModels,
    totals,
    updateModelSpec,
  } = useLiveScenarioPortfolio();

  const [unitMode, setUnitMode] = useState<'rub' | 'packs'>('rub');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingModelId, setEditingModelId] = useState<string | null>(null);

  const visibleModels = useMemo(() => {
    if (!searchQuery.trim()) return eligibleModels;
    const q = searchQuery.toLowerCase();
    return eligibleModels.filter(
      (m) =>
        m.code.toLowerCase().includes(q) ||
        m.title.toLowerCase().includes(q) ||
        m.subtitle.toLowerCase().includes(q)
    );
  }, [eligibleModels, searchQuery]);

  const editingModel = useMemo(
    () => eligibleModels.find((m) => m.id === editingModelId) || null,
    [eligibleModels, editingModelId]
  );

  const handleExportCsv = () => {
    const rows = exportStructuredScenarioPlan(eligibleModels, currentScenario);
    const csv = serializeStructuredPlanToCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `borners_sales_matrix_s${currentScenario.id}_2027.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify('success', `Выгружена матрица продаж «${currentScenario.title}» (${rows.length} строк)`);
  };

  const openSkuPassportOnDashboard = (modelId: string) => {
    try {
      sessionStorage.setItem('borners_open_scenario_model_id', modelId);
    } catch {
      // ignore
    }
    navigateTo('dashboard');
  };

  if (editingModel) {
    return (
      <div className="space-y-5 pb-16">
        <div className="rounded-[14px] bg-white border-[1.5px] border-[#C8C7BE] px-4 py-2.5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setEditingModelId(null)}
            className="h-8.5 px-3.5 rounded-[8px] bg-[#141413] text-white text-[12.5px] font-semibold cursor-pointer"
          >
            ← Ко всей матрице продаж ({eligibleModels.length} SKU)
          </button>
          <button
            type="button"
            onClick={() => openSkuPassportOnDashboard(editingModel.id)}
            className="h-8.5 px-3.5 rounded-[8px] bg-[#F5F5F1] border-[1.5px] border-[#CECDC4] hover:border-[#141413] text-[12.5px] font-semibold text-[#141413] cursor-pointer"
          >
            Открыть паспорт модели
          </button>
        </div>

        <ScenarioSalesPlanScreen
          model={editingModel}
          scenario={currentScenario}
          allScenarios={scenarios}
          onSelectScenario={setSelectedScenarioId}
          onBackToModel={() => setEditingModelId(null)}
          onUpdateModel={updateModelSpec}
          notify={notify}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      <ScenarioContourHeader
        stepCode="02 · Продажи · Помесячная матрица портфеля"
        title="План продаж на 12 месяцев (все SKU сценария)"
        subtitle="Сводная таблица выкупов и выручки по каждому артикулу на 2027 год. Нажмите на строку SKU для помесячного редактирования."
        selectedScenarioId={selectedScenarioId}
        orderedScenarios={orderedScenarios}
        onSelectScenario={setSelectedScenarioId}
        includeGroupPortfolioInS1={includeGroupPortfolioInS1}
        onToggleGroupPortfolio={setIncludeGroupPortfolioInS1}
        rightSlot={
          <>
            <div className="inline-flex rounded-[9px] bg-[#EFEFE9] border-[1.5px] border-[#CECDC4] p-0.5 text-[12px] font-semibold">
              <button
                type="button"
                onClick={() => setUnitMode('rub')}
                className={`h-8 px-3 rounded-[7px] transition cursor-pointer ${
                  unitMode === 'rub'
                    ? 'bg-[#141413] text-white'
                    : 'text-[#52514C] hover:text-[#141413]'
                }`}
              >
                Млн ₽
              </button>
              <button
                type="button"
                onClick={() => setUnitMode('packs')}
                className={`h-8 px-3 rounded-[7px] transition cursor-pointer ${
                  unitMode === 'packs'
                    ? 'bg-[#141413] text-white'
                    : 'text-[#52514C] hover:text-[#141413]'
                }`}
              >
                Комплекты (шт.)
              </button>
            </div>
            <button
              type="button"
              onClick={handleExportCsv}
              className="h-9 px-3.5 rounded-[9px] bg-white hover:border-[#141413] border-[1.5px] border-[#CECDC4] text-[12px] font-semibold text-[#141413] cursor-pointer"
            >
              Экспорт CSV
            </button>
          </>
        }
      />

      {/* 4 ключевых показателя продаж */}
      <section className="rounded-[18px] bg-white border-[1.5px] border-[#C8C7BE] overflow-hidden grid grid-cols-2 lg:grid-cols-4 divide-x-[1.5px] divide-y-[1.5px] lg:divide-y-0 divide-[#D8D7CF]">
        <div className="p-5 space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#5E5D58]">
            Годовая выручка 2027
          </div>
          <div className="text-[24px] font-bold text-[#141413]">
            {formatMln(totals.annualRevenueRub)}
          </div>
          <div className="text-[11.5px] text-[#5E5D58]">
            {totals.annualRevenueRub.toLocaleString('ru-RU')} ₽ за 12 мес.
          </div>
        </div>

        <div className="p-5 space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#5E5D58]">
            Выручка в декабре 2027
          </div>
          <div className="text-[24px] font-bold text-[#141413]">
            {formatMln(totals.decRevenueRub)}
          </div>
          <div className="text-[11.5px] text-[#157347] font-semibold">
            Цель сценария: {currentScenario.monthlyTargetMln} млн ₽ / мес
          </div>
        </div>

        <div className="p-5 space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#5E5D58]">
            Выкупы за 2027 год
          </div>
          <div className="text-[24px] font-bold text-[#141413]">
            {totals.annualPacks.toLocaleString('ru-RU')} компл.
          </div>
          <div className="text-[11.5px] text-[#5E5D58]">
            В декабре: {totals.decPacks.toLocaleString('ru-RU')} компл.
          </div>
        </div>

        <div className="p-5 space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#5E5D58]">
            Моделей в матрице
          </div>
          <div className="text-[24px] font-bold text-[#141413]">
            {eligibleModels.length} SKU
          </div>
          <div className="text-[11.5px] text-[#5E5D58]">
            Средний чек:{' '}
            {totals.annualPacks > 0
              ? `${Math.round(totals.annualRevenueRub / totals.annualPacks).toLocaleString('ru-RU')} ₽`
              : '—'}
          </div>
        </div>
      </section>

      {/* Полноширинная матрица 12 месяцев по всем SKU */}
      <section className="rounded-[18px] bg-white border-[1.5px] border-[#C8C7BE] p-5 md:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-[16px] font-bold text-[#141413]">
            Помесячная матрица ({unitMode === 'rub' ? 'млн ₽' : 'комплектов'})
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Фильтр по артикулу или модели..."
            className="h-9 px-3.5 rounded-[9px] bg-[#F7F7F4] focus:bg-white border-[1.5px] border-[#CECDC4] focus:border-[#141413] text-[12.5px] font-medium text-[#141413] w-64"
          />
        </div>

        <div className="overflow-x-auto rounded-[12px] border-[1.5px] border-[#CECDC4]">
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="bg-[#F5F5F1] text-[#5E5D58] border-b-[1.5px] border-[#CECDC4]">
                <th className="py-2.5 px-3 font-bold min-w-[210px]">Артикул / Модель</th>
                <th className="py-2.5 px-2 font-bold text-right">Цена</th>
                {MONTHS_SHORT_RU.map((m, idx) => (
                  <th
                    key={m}
                    className={`py-2.5 px-2 font-bold text-right ${
                      idx === 11 ? 'bg-[#EAEAE3] text-[#141413]' : ''
                    }`}
                  >
                    {m}
                  </th>
                ))}
                <th className="py-2.5 px-3 font-bold text-right bg-[#EFEFE9] text-[#141413]">
                  Год 2027
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E3DC]">
              {visibleModels.map((mod) => {
                const met = computeModelScenarioMetrics(mod, currentScenario);
                const acting = getActingSkuByWbOrVendor(mod.code, mod.title);
                return (
                  <tr
                    key={mod.id}
                    onClick={() => setEditingModelId(mod.id)}
                    title="Нажмите, чтобы редактировать помесячный план модели"
                    className="hover:bg-[#FAFAF7] cursor-pointer transition"
                  >
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-[#141413] truncate max-w-[240px]">
                        {mod.title}
                      </div>
                      <div className="font-mono text-[10.5px] text-[#5E5D58]">
                        {acting ? `WB ${acting.wbSku}` : mod.code} ·{' '}
                        {detectModelBrandPortfolioLabel(mod)}
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-[#5E5D58]">
                      {mod.retailPriceRub.toLocaleString('ru-RU')} ₽
                    </td>
                    {MONTHS_SHORT_RU.map((_, mIdx) => {
                      const valRub = met.monthlyRevenuesRub[mIdx] || 0;
                      const valPacks = met.plan.monthlyPacks[mIdx] || 0;
                      return (
                        <td
                          key={mIdx}
                          className={`py-2.5 px-2 text-right font-mono ${
                            mIdx === 11
                              ? 'bg-[#F7F7F3] font-bold text-[#141413]'
                              : valPacks === 0
                              ? 'text-[#B5B4AD]'
                              : 'text-[#262624]'
                          }`}
                        >
                          {unitMode === 'rub'
                            ? valRub > 0
                              ? (valRub / 1_000_000).toFixed(2).replace('.', ',')
                              : '—'
                            : valPacks > 0
                            ? valPacks.toLocaleString('ru-RU')
                            : '—'}
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#141413] bg-[#FAFAF7]">
                      {unitMode === 'rub'
                        ? (met.annualRevenueRub / 1_000_000).toFixed(2).replace('.', ',')
                        : met.annualPacks.toLocaleString('ru-RU')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-[#F5F5F1] font-bold text-[#141413] border-t-[1.5px] border-[#CECDC4]">
                <td className="py-3 px-3">ИТОГО ({eligibleModels.length} SKU)</td>
                <td className="py-3 px-2 text-right">—</td>
                {MONTHS_SHORT_RU.map((_, mIdx) => (
                  <td
                    key={mIdx}
                    className={`py-3 px-2 text-right font-mono ${
                      mIdx === 11 ? 'bg-[#E5E4DC] text-[#157347]' : ''
                    }`}
                  >
                    {unitMode === 'rub'
                      ? (totals.monthlyRevRub[mIdx] / 1_000_000).toFixed(1).replace('.', ',')
                      : totals.monthlyPacks[mIdx].toLocaleString('ru-RU')}
                  </td>
                ))}
                <td className="py-3 px-3 text-right font-mono bg-[#EAEAE3]">
                  {unitMode === 'rub'
                    ? (totals.annualRevenueRub / 1_000_000).toFixed(2).replace('.', ',')
                    : totals.annualPacks.toLocaleString('ru-RU')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}

// =============================================================================
// 03 · ЗАКУПКИ: СВОДНЫЕ ПАРТИИ ФАБРИК, ЗАКАЗЫ PO И ОПЕРАЦИОННЫЕ ЗАДАЧИ CRM
// =============================================================================
export function ProcurementContourView() {
  const { tasks, navigateTo } = usePlatform();
  const {
    orderedScenarios,
    currentScenario,
    selectedScenarioId,
    setSelectedScenarioId,
    includeGroupPortfolioInS1,
    setIncludeGroupPortfolioInS1,
    eligibleModels,
  } = useLiveScenarioPortfolio();

  const [subTab, setSubTab] = useState<'batches' | 'crm'>('batches');

  const openTasksCount = useMemo(
    () => tasks.filter((t) => !t.isArchived && t.status !== 'Done').length,
    [tasks]
  );

  const procData = useMemo(() => {
    let approvedCount = 0;
    let approvedRub = 0;
    let recPacks = 0;
    let recUnits = 0;
    let recBudgetRub = 0;
    let urgentCount = 0;
    let deficitSkuCount = 0;

    const perSku = eligibleModels.map((m) => {
      const plan = computeProcurementPlan(m, currentScenario);
      approvedCount += plan.approvedOrders.length;
      approvedRub += plan.approvedOrders.reduce((s, o) => s + o.totalOrderRub, 0);
      recPacks += plan.totalRecommendedPacks;
      recUnits += plan.totalRecommendedUnits;
      recBudgetRub += plan.totalRecommendedBudgetRub || 0;
      const skuUrgent = plan.recommendedBatches.filter(
        (b) => b.isUrgentPastOrderDate
      ).length;
      urgentCount += skuUrgent;
      if (plan.hasDeficit) deficitSkuCount += 1;
      return { model: m, plan, skuUrgent };
    });

    const factoryGroups = groupRecommendedBatchesByFactory(
      eligibleModels,
      currentScenario
    );

    return {
      approvedCount,
      approvedRub,
      recPacks,
      recUnits,
      recBudgetRub,
      urgentCount,
      deficitSkuCount,
      perSku,
      factoryGroups,
    };
  }, [eligibleModels, currentScenario]);

  const openSkuPassport = (modelId: string) => {
    try {
      sessionStorage.setItem('borners_open_scenario_model_id', modelId);
    } catch {
      // ignore
    }
    navigateTo('dashboard');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Переключатель: Партии фабрик и PO | Операционные задачи CRM */}
      <div className="rounded-[14px] bg-white border-[1.5px] border-[#C8C7BE] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-[9px] bg-[#EFEFE9] border-[1.5px] border-[#CECDC4] p-0.5 text-[12.5px] font-semibold">
          <button
            type="button"
            onClick={() => setSubTab('batches')}
            className={`h-8 px-3.5 rounded-[7px] transition cursor-pointer ${
              subTab === 'batches'
                ? 'bg-[#141413] text-white'
                : 'text-[#52514C] hover:text-[#141413]'
            }`}
          >
            Партии фабрик и заказы PO ({procData.factoryGroups.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('crm')}
            className={`h-8 px-3.5 rounded-[7px] transition cursor-pointer ${
              subTab === 'crm'
                ? 'bg-[#141413] text-white'
                : 'text-[#52514C] hover:text-[#141413]'
            }`}
          >
            Задачи и поручения CRM ({openTasksCount})
          </button>
        </div>

        <span className="text-[12px] text-[#5E5D58]">
          Единый контур снабжения 2027: остатки и заказы PO общие для всех сценариев
        </span>
      </div>

      {subTab === 'crm' ? (
        <RoadmapTasksView />
      ) : (
        <>
          <ScenarioContourHeader
            stepCode="03 · Закупки · График размещения заказов фабрикам"
            title="Потребность в закупках, партии фабрик и дедлайны PO"
            subtitle="Расчёт партий с учётом начальных остатков, MOQ фабрики, производственного цикла, логистики и страхового запаса."
            selectedScenarioId={selectedScenarioId}
            orderedScenarios={orderedScenarios}
            onSelectScenario={setSelectedScenarioId}
            includeGroupPortfolioInS1={includeGroupPortfolioInS1}
            onToggleGroupPortfolio={setIncludeGroupPortfolioInS1}
          />

          <section className="rounded-[18px] bg-white border-[1.5px] border-[#C8C7BE] overflow-hidden grid grid-cols-2 lg:grid-cols-4 divide-x-[1.5px] divide-y-[1.5px] lg:divide-y-0 divide-[#D8D7CF]">
            <div className="p-5 space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#5E5D58]">
                Рекомендовано к заказу
              </div>
              <div className="text-[23px] font-bold text-[#141413]">
                {procData.recPacks.toLocaleString('ru-RU')} компл.
              </div>
              <div className="text-[11.5px] text-[#5E5D58]">
                {procData.recUnits.toLocaleString('ru-RU')} физ. изделий (без двойного счёта)
              </div>
            </div>

            <div className="p-5 space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#5E5D58]">
                Бюджет рекомендованных партий
              </div>
              <div className="text-[23px] font-bold text-[#141413]">
                {formatMln(procData.recBudgetRub)}
              </div>
              <div className="text-[11.5px] text-[#5E5D58]">
                Авансы 30%: {formatMln(procData.recBudgetRub * 0.3)}
              </div>
            </div>

            <div className="p-5 space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#5E5D58]">
                Утверждённые заказы PO
              </div>
              <div className="text-[23px] font-bold text-[#141413]">
                {procData.approvedCount} шт.
              </div>
              <div className="text-[11.5px] text-[#5E5D58]">
                На сумму: {formatMln(procData.approvedRub)}
              </div>
            </div>

            <div className="p-5 space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#5E5D58]">
                Контроль дефицита и сроков
              </div>
              <div className="text-[23px] font-bold text-[#141413]">
                {procData.deficitSkuCount} SKU без PO
              </div>
              <div className="text-[11.5px] text-[#B45309] font-semibold">
                Срочные партии (дата прошла): {procData.urgentCount}
              </div>
            </div>
          </section>

          {/* 1. Сводные партии по фабрикам и месяцам */}
          <section className="rounded-[18px] bg-white border-[1.5px] border-[#C8C7BE] p-5 md:p-6 space-y-4">
            <div>
              <div className="font-mono text-[11px] font-bold uppercase tracking-[0.07em] text-[#5E5D58]">
                01 · Календарь размещения на фабриках
              </div>
              <h2 className="text-[18px] font-bold text-[#141413] mt-0.5">
                Сводные партии по фабрикам и месяцу заказа ({procData.factoryGroups.length})
              </h2>
            </div>

            <div className="overflow-x-auto rounded-[12px] border-[1.5px] border-[#CECDC4]">
              <table className="w-full text-left border-collapse text-[12.5px]">
                <thead>
                  <tr className="bg-[#F5F5F1] text-[#5E5D58] border-b-[1.5px] border-[#CECDC4]">
                    <th className="py-2.5 px-3.5 font-bold">Месяц размещения</th>
                    <th className="py-2.5 px-3.5 font-bold">Фабрика</th>
                    <th className="py-2.5 px-3.5 font-bold text-right">Позиций SKU</th>
                    <th className="py-2.5 px-3.5 font-bold text-right">Комплектов</th>
                    <th className="py-2.5 px-3.5 font-bold text-right">Физ. изделий</th>
                    <th className="py-2.5 px-3.5 font-bold text-right">Предоплата 30%</th>
                    <th className="py-2.5 px-3.5 font-bold text-right">Бюджет партии</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E3DC]">
                  {procData.factoryGroups.map((grp) => (
                    <tr
                      key={`${grp.factoryName}-${grp.orderMonthLabel}`}
                      className="hover:bg-[#FAFAF7]"
                    >
                      <td className="py-2.5 px-3.5 font-mono font-bold text-[#141413]">
                        {grp.orderMonthLabel}
                      </td>
                      <td className="py-2.5 px-3.5 font-semibold text-[#141413]">
                        {grp.factoryName}
                      </td>
                      <td className="py-2.5 px-3.5 text-right">{grp.itemsCount}</td>
                      <td className="py-2.5 px-3.5 text-right font-semibold">
                        {grp.totalPacks.toLocaleString('ru-RU')} компл.
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-[#5E5D58]">
                        {grp.totalPhysicalUnits.toLocaleString('ru-RU')} изд.
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-[#5E5D58]">
                        {Math.round(grp.totalBudgetRub * 0.3).toLocaleString('ru-RU')} ₽
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-bold text-[#141413]">
                        {grp.totalBudgetRub.toLocaleString('ru-RU')} ₽
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 2. Обеспеченность каждого SKU */}
          <section className="rounded-[18px] bg-white border-[1.5px] border-[#C8C7BE] p-5 md:p-6 space-y-4">
            <div>
              <div className="font-mono text-[11px] font-bold uppercase tracking-[0.07em] text-[#5E5D58]">
                02 · Детализация по артикулам
              </div>
              <h2 className="text-[18px] font-bold text-[#141413] mt-0.5">
                Обеспеченность каждого SKU ({procData.perSku.length} мод.)
              </h2>
            </div>

            <div className="overflow-x-auto rounded-[12px] border-[1.5px] border-[#CECDC4]">
              <table className="w-full text-left border-collapse text-[12.5px]">
                <thead>
                  <tr className="bg-[#F5F5F1] text-[#5E5D58] border-b-[1.5px] border-[#CECDC4]">
                    <th className="py-2.5 px-3.5 font-bold">SKU / Модель</th>
                    <th className="py-2.5 px-3 font-bold text-right">Нач. остаток</th>
                    <th className="py-2.5 px-3 font-bold text-right">План 2027</th>
                    <th className="py-2.5 px-3 font-bold text-right">К заказу</th>
                    <th className="py-2.5 px-3 font-bold text-right">Цикл</th>
                    <th className="py-2.5 px-3 font-bold text-right">Бюджет закупки</th>
                    <th className="py-2.5 px-3.5 font-bold">Статус обеспечения</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E3DC]">
                  {procData.perSku.map(({ model, plan, skuUrgent }) => {
                    const acting = getActingSkuByWbOrVendor(model.code, model.title);
                    return (
                      <tr
                        key={model.id}
                        onClick={() => openSkuPassport(model.id)}
                        title="Нажмите, чтобы открыть карточку SKU и утвердить заказ PO"
                        className="hover:bg-[#FAFAF7] cursor-pointer transition"
                      >
                        <td className="py-2.5 px-3.5">
                          <div className="font-bold text-[#141413]">{model.title}</div>
                          <div className="font-mono text-[10.5px] text-[#5E5D58]">
                            {acting ? `WB ${acting.wbSku}` : model.code} · {model.unitsInPack} изд./компл.
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {plan.netOpeningAvailablePacks.toLocaleString('ru-RU')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold">
                          {plan.annualDemandPacks.toLocaleString('ru-RU')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#141413]">
                          {plan.totalRecommendedPacks.toLocaleString('ru-RU')} компл.
                        </td>
                        <td className="py-2.5 px-3 text-right text-[#5E5D58]">
                          {plan.totalLeadDays} дн.
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-[#141413]">
                          {plan.totalRecommendedBudgetRub !== null
                            ? `${(plan.totalRecommendedBudgetRub / 1_000_000)
                                .toFixed(2)
                                .replace('.', ',')} млн ₽`
                            : '—'}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-[6px] text-[10.5px] font-bold border ${
                              !plan.hasDeficit
                                ? 'bg-[#EAF6F0] text-[#157347] border-[#BBE5CE]'
                                : skuUrgent > 0
                                ? 'bg-[#FFF7ED] text-[#B45309] border-[#FCD34D]'
                                : 'bg-[#F3F3EE] text-[#3F3E3A] border-[#D8D7CF]'
                            }`}
                          >
                            {plan.supplyStatusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

// =============================================================================
// 04 · ФИНАНСЫ: РЕАЛЬНЫЙ P&L, КЭШФЛОУ И ОБОРОТНЫЙ КАПИТАЛ СЦЕНАРИЕВ 2027
// =============================================================================
export function FinanceContourView() {
  const { currentUser, navigateTo } = usePlatform();
  const {
    orderedScenarios,
    currentScenario,
    selectedScenarioId,
    setSelectedScenarioId,
    includeGroupPortfolioInS1,
    setIncludeGroupPortfolioInS1,
    eligibleModels,
    totals,
  } = useLiveScenarioPortfolio();

  const [subTab, setSubTab] = useState<'scenarios-pnl' | 'legacy-plan-fact'>(
    'scenarios-pnl'
  );

  const hasFinance = canUserViewFinance(currentUser);
  const hasCost = canUserViewCostPrice(currentUser);

  const finSummary = useMemo(() => {
    let totalCogsRub = 0;
    let totalGrossProfitRub = 0;
    let honestOpProfitRub = 0;
    let filledOpCount = 0;
    let unfilledOpCount = 0;
    let peakCapitalRub = 0;

    const monthlyInflow = Array(12).fill(0) as number[];
    const monthlyProcOutflow = Array(12).fill(0) as number[];
    const monthlyVarOpexOutflow = Array(12).fill(0) as number[];
    const monthlyNet = Array(12).fill(0) as number[];

    const perSku = eligibleModels.map((m) => {
      const proc = computeProcurementPlan(m, currentScenario);
      const pnl = computeFinancialPnL(m, currentScenario, proc);

      totalCogsRub += pnl.annualCogsRub || 0;
      totalGrossProfitRub += pnl.annualGrossProfitRub || 0;
      if (pnl.annualOperatingProfitRub !== null) {
        honestOpProfitRub += pnl.annualOperatingProfitRub;
        filledOpCount += 1;
      } else {
        unfilledOpCount += 1;
      }
      peakCapitalRub += pnl.peakCapitalDeficitRub;

      pnl.monthlyCashFlow.forEach((row, idx) => {
        monthlyInflow[idx] += row.inflowSalesRub;
        monthlyProcOutflow[idx] += row.outflowProcurementRub;
        monthlyVarOpexOutflow[idx] += row.outflowVariableAndOpexRub;
        monthlyNet[idx] += row.netCashFlowRub;
      });

      return { model: m, pnl };
    });

    const cumulativeCash: number[] = [];
    let running = 0;
    for (let i = 0; i < 12; i++) {
      running += monthlyNet[i];
      cumulativeCash.push(running);
    }

    return {
      totalCogsRub,
      totalGrossProfitRub,
      honestOpProfitRub,
      filledOpCount,
      unfilledOpCount,
      peakCapitalRub,
      monthlyInflow,
      monthlyProcOutflow,
      monthlyVarOpexOutflow,
      monthlyNet,
      cumulativeCash,
      perSku,
    };
  }, [eligibleModels, currentScenario]);

  if (!hasFinance) {
    return (
      <div className="rounded-[18px] bg-white border-[1.5px] border-[#C8C7BE] p-10 text-center space-y-2">
        <div className="text-[19px] font-bold text-[#141413]">
          Доступ к разделу «Финансы и P&amp;L» ограничен
        </div>
        <p className="text-[13px] text-[#5E5D58]">
          Текущая роль профиля не включает просмотр сводного P&amp;L и себестоимости партий.
        </p>
      </div>
    );
  }

  const openSkuPassport = (modelId: string) => {
    try {
      sessionStorage.setItem('borners_open_scenario_model_id', modelId);
    } catch {
      // ignore
    }
    navigateTo('dashboard');
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="rounded-[14px] bg-white border-[1.5px] border-[#C8C7BE] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-[9px] bg-[#EFEFE9] border-[1.5px] border-[#CECDC4] p-0.5 text-[12.5px] font-semibold">
          <button
            type="button"
            onClick={() => setSubTab('scenarios-pnl')}
            className={`h-8 px-3.5 rounded-[7px] transition cursor-pointer ${
              subTab === 'scenarios-pnl'
                ? 'bg-[#141413] text-white'
                : 'text-[#52514C] hover:text-[#141413]'
            }`}
          >
            P&amp;L и оборотный капитал сценариев 2027
          </button>
          <button
            type="button"
            onClick={() => setSubTab('legacy-plan-fact')}
            className={`h-8 px-3.5 rounded-[7px] transition cursor-pointer ${
              subTab === 'legacy-plan-fact'
                ? 'bg-[#141413] text-white'
                : 'text-[#52514C] hover:text-[#141413]'
            }`}
          >
            План / Факт и импорт таблиц CSV
          </button>
        </div>

        <span className="text-[12px] text-[#5E5D58]">
          Синхронизировано со сценариями 2027 (без фиктивной маржи при незаполненных комиссиях MP)
        </span>
      </div>

      {subTab === 'legacy-plan-fact' ? (
        <FinanceView />
      ) : (
        <>
          <ScenarioContourHeader
            stepCode="04 · Финансы · Сводный P&L и потребность в капитале"
            title="Финансовая модель, денежный поток и юнит-экономика 2027"
            subtitle="Единый расчёт выручки, себестоимости выкупленного товара (COGS), операционной прибыли и графика авансов фабрикам."
            selectedScenarioId={selectedScenarioId}
            orderedScenarios={orderedScenarios}
            onSelectScenario={setSelectedScenarioId}
            includeGroupPortfolioInS1={includeGroupPortfolioInS1}
            onToggleGroupPortfolio={setIncludeGroupPortfolioInS1}
          />

          <section className="rounded-[18px] bg-white border-[1.5px] border-[#C8C7BE] overflow-hidden grid grid-cols-2 lg:grid-cols-4 divide-x-[1.5px] divide-y-[1.5px] lg:divide-y-0 divide-[#D8D7CF]">
            <div className="p-5 space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#5E5D58]">
                Плановая выручка 2027
              </div>
              <div className="text-[24px] font-bold text-[#141413]">
                {formatMln(totals.annualRevenueRub)}
              </div>
              <div className="text-[11.5px] text-[#5E5D58]">
                Декабрь 2027: {formatMln(totals.decRevenueRub)}
              </div>
            </div>

            <div className="p-5 space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#5E5D58]">
                Товарная себестоимость (COGS)
              </div>
              <div className="text-[24px] font-bold text-[#141413]">
                {hasCost ? formatMln(finSummary.totalCogsRub) : 'Скрыто ролью'}
              </div>
              <div className="text-[11.5px] text-[#5E5D58]">
                Валовая прибыль до MP:{' '}
                {hasCost ? formatMln(finSummary.totalGrossProfitRub) : '—'}
              </div>
            </div>

            <div className="p-5 space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#5E5D58]">
                Операционная прибыль (честная)
              </div>
              <div className="text-[24px] font-bold text-[#141413]">
                {finSummary.filledOpCount > 0
                  ? formatMln(finSummary.honestOpProfitRub)
                  : 'Не рассчитана'}
              </div>
              <div className="text-[11.5px] text-[#5E5D58]">
                Заполнены MP/OPEX: {finSummary.filledOpCount} из {eligibleModels.length} SKU
              </div>
            </div>

            <div className="p-5 space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#5E5D58]">
                Пиковая потребность в капитале
              </div>
              <div className="text-[24px] font-bold text-[#141413]">
                {formatMln(finSummary.peakCapitalRub)}
              </div>
              <div className="text-[11.5px] text-[#5E5D58]">
                С учётом авансов фабрикам (30% / 70%)
              </div>
            </div>
          </section>

          {/* 1. Помесячный Cash Flow 2027 */}
          <section className="rounded-[18px] bg-white border-[1.5px] border-[#C8C7BE] p-5 md:p-6 space-y-4">
            <div>
              <div className="font-mono text-[11px] font-bold uppercase tracking-[0.07em] text-[#5E5D58]">
                01 · Денежный поток 2027
              </div>
              <h2 className="text-[18px] font-bold text-[#141413] mt-0.5">
                Помесячный Cash Flow: поступления от продаж и выплаты фабрикам (млн ₽)
              </h2>
            </div>

            <div className="overflow-x-auto rounded-[12px] border-[1.5px] border-[#CECDC4]">
              <table className="w-full text-left border-collapse text-[12px]">
                <thead>
                  <tr className="bg-[#F5F5F1] text-[#5E5D58] border-b-[1.5px] border-[#CECDC4]">
                    <th className="py-2.5 px-3 font-bold min-w-[200px]">Статья потока</th>
                    {MONTHS_SHORT_RU.map((m) => (
                      <th key={m} className="py-2.5 px-2 font-bold text-right">
                        {m}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E3DC]">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-[#141413]">
                      Поступления от продаж
                    </td>
                    {finSummary.monthlyInflow.map((v, i) => (
                      <td key={i} className="py-2.5 px-2 text-right font-mono text-[#157347] font-semibold">
                        {(v / 1_000_000).toFixed(1).replace('.', ',')}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-[#141413]">
                      Оплаты фабрикам (30% / 70%)
                    </td>
                    {finSummary.monthlyProcOutflow.map((v, i) => (
                      <td key={i} className="py-2.5 px-2 text-right font-mono text-[#5E5D58]">
                        {v > 0 ? `−${(v / 1_000_000).toFixed(1).replace('.', ',')}` : '0,0'}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-[#FAFAF7] font-bold">
                    <td className="py-2.5 px-3 text-[#141413]">Чистый поток месяца</td>
                    {finSummary.monthlyNet.map((v, i) => (
                      <td
                        key={i}
                        className={`py-2.5 px-2 text-right font-mono ${
                          v < 0 ? 'text-[#B45309]' : 'text-[#141413]'
                        }`}
                      >
                        {v >= 0 ? '+' : ''}
                        {(v / 1_000_000).toFixed(1).replace('.', ',')}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 2. Юнит-экономика по моделям */}
          <section className="rounded-[18px] bg-white border-[1.5px] border-[#C8C7BE] p-5 md:p-6 space-y-4">
            <div>
              <div className="font-mono text-[11px] font-bold uppercase tracking-[0.07em] text-[#5E5D58]">
                02 · Юнит-экономика по SKU
              </div>
              <h2 className="text-[18px] font-bold text-[#141413] mt-0.5">
                Маржинальность и статус расходов по каждой модели ({finSummary.perSku.length} SKU)
              </h2>
            </div>

            <div className="overflow-x-auto rounded-[12px] border-[1.5px] border-[#CECDC4]">
              <table className="w-full text-left border-collapse text-[12.5px]">
                <thead>
                  <tr className="bg-[#F5F5F1] text-[#5E5D58] border-b-[1.5px] border-[#CECDC4]">
                    <th className="py-2.5 px-3.5 font-bold">SKU / Модель</th>
                    <th className="py-2.5 px-3 font-bold text-right">Цена компл.</th>
                    <th className="py-2.5 px-3 font-bold text-right">Себест. компл.</th>
                    <th className="py-2.5 px-3 font-bold text-right">Валовая маржа</th>
                    <th className="py-2.5 px-3 font-bold text-right">Выручка 2027</th>
                    <th className="py-2.5 px-3.5 font-bold text-right">Опер. прибыль 2027</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E3DC]">
                  {finSummary.perSku.map(({ model, pnl }) => {
                    const acting = getActingSkuByWbOrVendor(model.code, model.title);
                    return (
                      <tr
                        key={model.id}
                        onClick={() => openSkuPassport(model.id)}
                        title="Нажмите, чтобы заполнить комиссии MP и OPEX в карточке SKU"
                        className="hover:bg-[#FAFAF7] cursor-pointer transition"
                      >
                        <td className="py-2.5 px-3.5">
                          <div className="font-bold text-[#141413]">{model.title}</div>
                          <div className="font-mono text-[10.5px] text-[#5E5D58]">
                            {acting ? `WB ${acting.wbSku}` : model.code}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {Math.round(pnl.avgRealizedPricePerPackRub).toLocaleString('ru-RU')} ₽
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-[#5E5D58]">
                          {hasCost && pnl.unitCostPerPackRub !== null
                            ? `${pnl.unitCostPerPackRub.toLocaleString('ru-RU')} ₽`
                            : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold">
                          {hasCost && pnl.grossMarginPct !== null
                            ? `${pnl.grossMarginPct.toFixed(1).replace('.', ',')}%`
                            : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#141413]">
                          {formatMln(pnl.annualRevenueRub)}
                        </td>
                        <td className="py-2.5 px-3.5 text-right">
                          {pnl.annualOperatingProfitRub !== null ? (
                            <span className="font-mono font-bold text-[#157347]">
                              {formatMln(pnl.annualOperatingProfitRub)}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-[6px] bg-[#F3F3EE] border border-[#D8D7CF] text-[10.5px] font-semibold text-[#5E5D58]">
                              Не заполнены MP/OPEX
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
