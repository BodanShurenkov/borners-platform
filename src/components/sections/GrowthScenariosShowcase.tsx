'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Plus,
  Search,
  ChevronRight,
  Sparkles,
  Calendar,
  X,
} from 'lucide-react';
import { usePlatform } from '@/context/PlatformContext';
import {
  GrowthScenarioDef,
  INITIAL_SCENARIOS,
  INITIAL_SCENARIO_MODELS,
  MONTHS_SHORT_RU,
  ScenarioModelSpec,
  computeModelScenarioMetrics,
} from '@/lib/scenarioData';
import { BoxerPackStackSvg } from '@/components/sections/ScenarioVisualParts';
import { ScenarioModelCardScreen } from '@/components/sections/ScenarioModelCardScreen';
import { ScenarioSalesPlanScreen } from '@/components/sections/ScenarioSalesPlanScreen';
import { PdfConstructorModal } from '@/components/sections/PdfConstructorModal';

export const STORAGE_KEY_SCENARIOS = 'borners_tz_scenarios_v1';
export const STORAGE_KEY_MODELS = 'borners_tz_models_v1';

interface GrowthScenariosShowcaseProps {
  initialScreen?: 'scenarios' | 'model' | 'sales-plan';
  initialModelId?: string;
}

export function GrowthScenariosShowcase({
  initialScreen = 'scenarios',
  initialModelId,
}: GrowthScenariosShowcaseProps = {}) {
  const { concepts, createProduct, pushScenarioStep, notify } = usePlatform();

  // Архитектура из 3 экранов (п. 02 ТЗ):
  // 'scenarios' (Экран №1) -> 'model' (Экран №2) -> 'sales-plan' (Экран №3)
  const [screen, setScreen] = useState<'scenarios' | 'model' | 'sales-plan'>(
    initialScreen
  );

  const [scenarios, setScenarios] = useState<GrowthScenarioDef[]>(INITIAL_SCENARIOS);
  const [models, setModels] = useState<ScenarioModelSpec[]>(INITIAL_SCENARIO_MODELS);
  const [selectedScenarioId, setSelectedScenarioId] = useState<number>(1);
  const [selectedModelId, setSelectedModelId] = useState<string>(
    initialModelId || 'scen-model-001'
  );

  const navigateScreen = (
    nextScreen: 'scenarios' | 'model' | 'sales-plan',
    nextModelId?: string
  ) => {
    const targetModelId = nextModelId || selectedModelId;
    if (nextModelId) {
      setSelectedModelId(nextModelId);
    }
    setScreen(nextScreen);
    pushScenarioStep(nextScreen, targetModelId);
  };

  useEffect(() => {
    const onHistoryRestore = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.scenarioScreen) {
        setScreen(detail.scenarioScreen);
      }
      if (detail?.scenarioModelId) {
        setSelectedModelId(detail.scenarioModelId);
      }
    };
    window.addEventListener('borners-history-restore', onHistoryRestore);
    return () =>
      window.removeEventListener('borners-history-restore', onHistoryRestore);
  }, []);

  useEffect(() => {
    setScreen(initialScreen);
  }, [initialScreen]);

  useEffect(() => {
    if (initialModelId) {
      setSelectedModelId(initialModelId);
    }
    try {
      const pendingModelId = sessionStorage.getItem('borners_open_scenario_model_id');
      if (pendingModelId) {
        sessionStorage.removeItem('borners_open_scenario_model_id');
        setSelectedModelId(pendingModelId);
        setScreen('model');
        pushScenarioStep('model', pendingModelId);
      }
    } catch {
      // ignore
    }
  }, [initialModelId, pushScenarioStep]);

  // Фильтры каталога на Экране №1
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilterLocal, setBrandFilterLocal] = useState<
    'ALL' | 'BORNERS' | 'NA_TELE'
  >('ALL');
  const [statusFilterLocal, setStatusFilterLocal] = useState<string>('ALL');

  // Модальные окна создания модели (п. 7.1), создания сценария (п. 7.3) и PDF (Тест 10)
  const [newModelModalOpen, setNewModelModalOpen] = useState(false);
  const [newScenarioModalOpen, setNewScenarioModalOpen] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  // Поля формы создания новой модели (Тест 11: короткая форма, работает даже без всех полей)
  const [draftBrand, setDraftBrand] = useState<'BORNERS' | 'NA_TELE'>('BORNERS');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftType, setDraftType] = useState('Боксеры (trunks)');
  const [draftUnitsInPack, setDraftUnitsInPack] = useState(4);
  const [draftRetailPrice, setDraftRetailPrice] = useState(1290);
  const [draftUnitCost, setDraftUnitCost] = useState(410);

  // Поля формы создания нового сценария (п. 7.3)
  const [draftScenTitle, setDraftScenTitle] = useState('');
  const [draftScenTargetMln, setDraftScenTargetMln] = useState(250);
  const [draftScenScope, setDraftScenScope] = useState<'BORNERS' | 'GROUP'>('GROUP');
  const [draftCopyFromScenarioId, setDraftCopyFromScenarioId] = useState<number>(2);

  // Загрузка сохранённых данных из localStorage
  useEffect(() => {
    try {
      const rawScen = localStorage.getItem(STORAGE_KEY_SCENARIOS);
      if (rawScen) {
        const parsed = JSON.parse(rawScen);
        if (Array.isArray(parsed) && parsed.length > 0) setScenarios(parsed);
      }
      const rawModels = localStorage.getItem(STORAGE_KEY_MODELS);
      if (rawModels) {
        const parsed = JSON.parse(rawModels);
        if (Array.isArray(parsed) && parsed.length > 0) setModels(parsed);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // Автосохранение в localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SCENARIOS, JSON.stringify(scenarios));
    } catch {
      // ignore
    }
  }, [scenarios]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MODELS, JSON.stringify(models));
      window.dispatchEvent(new CustomEvent('borners-scenario-models-changed'));
    } catch {
      // ignore
    }
  }, [models]);

  const currentScenario =
    scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  const activeModel =
    models.find((m) => m.id === selectedModelId) || models[0];

  // Расчёт показателей каждого сценария снизу вверх из планов моделей (п. 8 ТЗ)
  const scenarioAggregates = useMemo(() => {
    const map: Record<
      number,
      {
        annualRevenueRub: number;
        annualProfitRub: number;
        totalPurchaseNeedRub: number;
        targetMonthRevenueRub: number;
        goalCompletionPct: number;
        monthlyBornersMln: number[];
        monthlyNaTeleMln: number[];
        monthlyTotalMln: number[];
        modelsCount: number;
      }
    > = {};

    for (const sc of scenarios) {
      const eligibleModels = models.filter(
        (m) =>
          m.launchStatus !== 'В архиве' && sc.includedBrands.includes(m.brandId)
      );

      let annualRevenueRub = 0;
      let annualProfitRub = 0;
      let totalPurchaseNeedRub = 0;
      let targetMonthRevenueRub = 0;
      const monthlyBornersMln = Array(12).fill(0);
      const monthlyNaTeleMln = Array(12).fill(0);

      for (const m of eligibleModels) {
        const met = computeModelScenarioMetrics(m, sc);
        annualRevenueRub += met.annualRevenueRub;
        annualProfitRub += met.annualProfitRub;
        totalPurchaseNeedRub += met.totalPurchaseNeedRub;
        targetMonthRevenueRub += met.targetMonthRevenueRub;

        for (let i = 0; i < 12; i++) {
          const revMln = met.monthlyRevenuesRub[i] / 1_000_000;
          if (m.brandId === 'BORNERS') {
            monthlyBornersMln[i] += revMln;
          } else {
            monthlyNaTeleMln[i] += revMln;
          }
        }
      }

      const monthlyTotalMln = monthlyBornersMln.map(
        (b, idx) => Math.round((b + monthlyNaTeleMln[idx]) * 10) / 10
      );

      const targetRub = sc.monthlyTargetMln * 1_000_000;
      const goalCompletionPct =
        targetRub > 0
          ? Math.round((targetMonthRevenueRub / targetRub) * 1000) / 10
          : 0;

      map[sc.id] = {
        annualRevenueRub,
        annualProfitRub,
        totalPurchaseNeedRub,
        targetMonthRevenueRub,
        goalCompletionPct,
        monthlyBornersMln,
        monthlyNaTeleMln,
        monthlyTotalMln,
        modelsCount: eligibleModels.length,
      };
    }
    return map;
  }, [scenarios, models]);

  const currentAgg =
    scenarioAggregates[currentScenario.id] || scenarioAggregates[1];

  // Отфильтрованные модели для каталога на Экране №1
  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      if (m.launchStatus === 'В архиве' && statusFilterLocal !== 'В архиве') {
        return false;
      }
      if (!currentScenario.includedBrands.includes(m.brandId)) {
        return false;
      }
      if (brandFilterLocal !== 'ALL' && m.brandId !== brandFilterLocal) {
        return false;
      }
      if (statusFilterLocal !== 'ALL' && m.launchStatus !== statusFilterLocal) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          m.code.toLowerCase().includes(q) ||
          m.title.toLowerCase().includes(q) ||
          m.subtitle.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [models, currentScenario, brandFilterLocal, statusFilterLocal, searchQuery]);

  const handleUpdateModel = (updated: ScenarioModelSpec) => {
    setModels((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  };

  // Дублирование модели (п. 4.1)
  const handleDuplicateModel = (source: ScenarioModelSpec) => {
    const nextNum = String(models.length + 1).padStart(3, '0');
    const copy: ScenarioModelSpec = {
      ...source,
      id: `scen-model-${Date.now()}`,
      code: `№${nextNum}`,
      title: `${source.title} (КОПИЯ)`,
      launchStatus: 'В плане',
      hasActualSalesOrPurchases: false,
    };
    setModels((prev) => [...prev, copy]);
    setSelectedModelId(copy.id);
    notify('success', `Создана копия модели ${copy.code} · ${copy.title}`);
  };

  // Архивация / удаление модели с проверкой связанных закупок и продаж (п. 7.2)
  const handleDeleteOrArchiveModel = (target: ScenarioModelSpec) => {
    if (target.hasActualSalesOrPurchases) {
      handleUpdateModel({ ...target, launchStatus: 'В архиве' });
      setScreen('scenarios');
      notify(
        'warning',
        `Модель ${target.code} перенесена в архив`,
        'У модели есть связанные закупки и продажи — полное удаление запрещено по ТЗ (п. 7.2).'
      );
    } else {
      setModels((prev) => prev.filter((m) => m.id !== target.id));
      setScreen('scenarios');
      notify('success', `Модель ${target.code} удалена из сценария`);
    }
  };

  // Создание новой модели через короткую форму (п. 7.1, Тест 11)
  const handleCreateNewModel = (e: React.FormEvent) => {
    e.preventDefault();
    const nextNum = String(models.length + 1).padStart(3, '0');
    const cleanTitle = draftTitle.trim() || `НОВАЯ МОДЕЛЬ ${draftUnitsInPack} PACK`;
    const newId = `scen-model-${Date.now()}`;

    const basePlanPacks = [
      1800, 2200, 2700, 3200, 3800, 4200, 4600, 5100, 5600, 6200, 7100, 7500,
    ];
    const plansByScenario: ScenarioModelSpec['plansByScenario'] = {};
    scenarios.forEach((sc) => {
      plansByScenario[sc.id] = {
        scenarioId: sc.id,
        monthlyPacks: [...basePlanPacks],
        monthlyPricesRub: Array(12).fill(draftRetailPrice || 1290),
        monthlyReceiptsPacks: [6000, 0, 10000, 0, 12000, 0, 15000, 0, 16000, 0, 0, 0],
        initialStockPacks: 0,
        firstOrderPacks: 6000,
        nextOrderDateLabel: '20 мая 2027',
        salesStartMonthIdx: 2,
        warehouseArrivalMonthIdx: 2,
        warehouseArrivalDateLabel: '18 марта',
      };
    });

    const created: ScenarioModelSpec = {
      ...INITIAL_SCENARIO_MODELS[0],
      id: newId,
      code: `№${nextNum}`,
      title: cleanTitle.toUpperCase(),
      subtitle: `${draftType} · ${draftUnitsInPack} шт. в комплекте`,
      brandId: draftBrand,
      launchStatus: 'В плане',
      unitsInPack: draftUnitsInPack,
      retailPriceRub: draftRetailPrice || 1290,
      unitCostRub: draftUnitCost || 410,
      hasActualSalesOrPurchases: false,
      plansByScenario,
    };

    setModels((prev) => [...prev, created]);
    setSelectedModelId(created.id);
    setNewModelModalOpen(false);
    setDraftTitle('');

    // Автоматически синхронизируем созданную модель с разделом «Модели (SKU)»
    createProduct({
      sku: `${draftBrand === 'NA_TELE' ? 'NT' : 'BRN'}-${created.code.replace('№', '')}`,
      name: created.title,
      brandId: draftBrand,
      category: 'Боксеры',
      productType: 'Базовая коллекция',
      priceSegment: 'Middle+',
      collection: `${draftBrand === 'NA_TELE' ? 'НА ТЕЛЕ' : 'BORNERS'} 2027`,
      materials: created.fabric.composition,
      fitType: `${created.subtitle} · резинка ${created.waistband.width}`,
      economics: {
        currency: 'RUB',
        plannedRetailPrice: created.retailPriceRub,
        actualRetailPrice: created.retailPriceRub,
        discountPct: 0,
        vatPct: 20,
        returnRatePct: 3.5,
        unitCostPrice: created.unitCostRub,
        marketplaceCommissionRub: Math.round(
          (created.retailPriceRub * created.marketplaceFeePct) / 100
        ),
        logisticsRub: created.logisticsRub,
        advertisingRub: Math.round(
          (created.retailPriceRub * created.adsPct) / 100
        ),
        otherVariableRub: 0,
      },
    });

    // Сразу открываем карточку новой модели на Экране №2 (п. 7.1 ТЗ)
    setScreen('model');
    notify(
      'success',
      `Модель ${created.code} / ${created.title} создана и добавлена в «Модели (SKU)»`,
      'Незаполненные параметры можно уточнить в карточке модели по мере готовности.'
    );
  };

  // Создание нового сценария (п. 7.3 ТЗ: без дублирования товаров, копируются только коммерческие планы)
  const handleCreateNewScenario = (e: React.FormEvent) => {
    e.preventDefault();
    const newScenId = Math.max(...scenarios.map((s) => s.id)) + 1;
    const sourceScen =
      scenarios.find((s) => s.id === draftCopyFromScenarioId) || scenarios[0];
    const ratio =
      sourceScen.monthlyTargetMln > 0
        ? draftScenTargetMln / sourceScen.monthlyTargetMln
        : 1;

    const newScen: GrowthScenarioDef = {
      id: newScenId,
      title: draftScenTitle.trim() || `Сценарий №${newScenId}`,
      monthlyTargetMln: Math.max(10, draftScenTargetMln),
      targetMonthLabel: 'Декабрь 2027',
      targetMonthIdx: 11,
      scopeLabel: draftScenScope === 'BORNERS' ? 'BORNERS' : 'группа',
      includedBrands:
        draftScenScope === 'BORNERS' ? ['BORNERS'] : ['BORNERS', 'NA_TELE'],
      year: 2027,
    };

    // Копируем коммерческие планы моделей под новый сценарий без дублирования самих моделей
    setModels((prev) =>
      prev.map((m) => {
        const srcPlan =
          m.plansByScenario[sourceScen.id] || m.plansByScenario[1];
        return {
          ...m,
          plansByScenario: {
            ...m.plansByScenario,
            [newScenId]: {
              ...srcPlan,
              scenarioId: newScenId,
              monthlyPacks: srcPlan.monthlyPacks.map((p) =>
                Math.round(p * ratio)
              ),
              firstOrderPacks: Math.round(srcPlan.firstOrderPacks * ratio),
            },
          },
        };
      })
    );

    setScenarios((prev) => [...prev, newScen]);
    setSelectedScenarioId(newScenId);
    setNewScenarioModalOpen(false);
    setDraftScenTitle('');
    notify(
      'success',
      `${newScen.title} (${newScen.monthlyTargetMln} млн ₽/мес) создан`,
      'Товары остались едиными, скопированы и масштабированы только планы продаж.'
    );
  };

  const conceptForPdf = concepts[0];
  const maxChartVal = Math.max(
    currentScenario.monthlyTargetMln * 0.45,
    ...(currentAgg?.monthlyTotalMln || [20])
  );

  return (
    <div className="space-y-6">
      {/* НАВИГАЦИОННАЯ ПАНЕЛЬ БЫСТРОГО ПЕРЕКЛЮЧЕНИЯ 3 ЭКРАНОВ ТЗ */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] bg-white border border-[#E6E0D4] px-4 py-2.5 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
          <button
            type="button"
            onClick={() => navigateScreen('scenarios')}
            className={`h-8 px-3 rounded-[9px] font-semibold transition cursor-pointer ${
              screen === 'scenarios'
                ? 'bg-[#1D1D1F] text-white'
                : 'text-[#5A564F] hover:bg-[#FAF8F4] hover:text-[#1D1D1F]'
            }`}
          >
            1. Сценарии роста ({currentScenario.title})
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-[#8E8A82]" />
          <button
            type="button"
            onClick={() => navigateScreen('model')}
            className={`h-8 px-3 rounded-[9px] font-semibold transition cursor-pointer ${
              screen === 'model'
                ? 'bg-[#1D1D1F] text-white'
                : 'text-[#5A564F] hover:bg-[#FAF8F4] hover:text-[#1D1D1F]'
            }`}
          >
            2. Карточка модели ({activeModel.code} {activeModel.title})
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-[#8E8A82]" />
          <button
            type="button"
            onClick={() => navigateScreen('sales-plan')}
            className={`h-8 px-3 rounded-[9px] font-semibold transition cursor-pointer ${
              screen === 'sales-plan'
                ? 'bg-[#1D1D1F] text-white'
                : 'text-[#5A564F] hover:bg-[#FAF8F4] hover:text-[#1D1D1F]'
            }`}
          >
            3. План продаж и производства
          </button>
        </div>

        <span className="text-[11px] font-medium text-[#6E6E73]">
          Архитектура ТЗ v1.0 · макс. 2 клика от сценария до помесячного плана
        </span>
      </div>

      {/* ЭКРАН №2: КАРТОЧКА МОДЕЛИ (Стр. 5–6, макет Стр. 14) */}
      {screen === 'model' && (
        <ScenarioModelCardScreen
          model={activeModel}
          scenario={currentScenario}
          onBackToScenarios={() => navigateScreen('scenarios')}
          onOpenSalesPlan={() => navigateScreen('sales-plan')}
          onUpdateModel={handleUpdateModel}
          onDuplicateModel={handleDuplicateModel}
          onDeleteOrArchiveModel={handleDeleteOrArchiveModel}
          onOpenPdfModal={() => setPdfModalOpen(true)}
          notify={notify}
        />
      )}

      {/* ЭКРАН №3: ПЛАН ПРОДАЖ И ПРОИЗВОДСТВА (Стр. 7–8, макет Стр. 15) */}
      {screen === 'sales-plan' && (
        <ScenarioSalesPlanScreen
          model={activeModel}
          scenario={currentScenario}
          allScenarios={scenarios}
          onSelectScenario={(id) => setSelectedScenarioId(id)}
          onBackToModel={() => navigateScreen('model')}
          onUpdateModel={handleUpdateModel}
          notify={notify}
        />
      )}

      {/* ЭКРАН №1: СЦЕНАРИИ РОСТА (Стр. 3–4, макет Стр. 13) */}
      {screen === 'scenarios' && (
        <div className="rounded-[24px] bg-[#FAF8F4] border border-[#E6E0D4] p-5 md:p-7 space-y-6 shadow-[0_12px_36px_rgba(24,23,21,0.05)]">
          {/* A. Заголовок экрана */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-[22px] md:text-[26px] font-bold tracking-[-0.02em] text-[#1D1D1F]">
                Стратегия роста BORNERS GROUP
              </h2>
              <p className="text-[13px] text-[#6E6E73] mt-0.5">
                Модели, продажи и финансовый план на 2027 год
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="h-9 px-3.5 rounded-[10px] bg-white border border-[#DED8CC] text-[12.5px] font-semibold text-[#1D1D1F] inline-flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-[#8B6F47]" />
                <span>Год: 2027</span>
              </div>
              <button
                type="button"
                onClick={() => setNewScenarioModalOpen(true)}
                className="h-9 px-4 rounded-[10px] bg-[#1D1D1F] hover:bg-[#323236] text-white text-[12.5px] font-semibold inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Plus className="h-4 w-4" />
                <span>Новый сценарий</span>
              </button>
            </div>
          </div>

          {/* B. Выбор сценария (ряд из карточек — макет Стр. 13) */}
          <div
            data-tour="growth-scenarios"
            className="grid grid-cols-1 md:grid-cols-3 gap-3.5"
          >
            {scenarios.map((sc) => {
              const isSelected = sc.id === currentScenario.id;
              const agg = scenarioAggregates[sc.id];
              const annualMln = agg
                ? (agg.annualRevenueRub / 1_000_000).toFixed(1).replace('.', ',')
                : '0';
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => setSelectedScenarioId(sc.id)}
                  className={`rounded-[18px] p-4 text-left transition-all cursor-pointer border relative ${
                    isSelected
                      ? 'bg-[#4E6A85] text-white border-[#4E6A85] shadow-[0_10px_24px_rgba(78,106,133,0.22)]'
                      : 'bg-white hover:bg-[#F5F2EB] text-[#1D1D1F] border-[#E4DEC9]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11.5px] font-semibold ${
                        isSelected ? 'text-white/80' : 'text-[#6E6E73]'
                      }`}
                    >
                      {sc.title} · {sc.scopeLabel}
                    </span>
                    {isSelected && (
                      <span className="h-5 w-5 rounded-full bg-[#F5E6CE] text-[#2C3E50] flex items-center justify-center">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <div className="text-[24px] font-bold tracking-[-0.02em] mt-1">
                    {sc.monthlyTargetMln} млн ₽{' '}
                    <span className="text-[14px] font-normal opacity-75">/ мес</span>
                  </div>

                  <div
                    className={`mt-2 pt-2 border-t text-[11.5px] flex flex-wrap items-center justify-between gap-2 ${
                      isSelected
                        ? 'border-white/15 text-white/80'
                        : 'border-[#EFECE4] text-[#6E6E73]'
                    }`}
                  >
                    <span>Цель: {sc.targetMonthLabel}</span>
                    <span className="font-semibold">
                      За 2027 г.: {annualMln} млн ₽ · {agg?.modelsCount || 0} мод.
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* C. Четыре ключевых показателя выбранного сценария (ровно 4, п. 3.2 C ТЗ) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="rounded-[16px] bg-white border border-[#E6E0D4] p-4 space-y-1 shadow-2xs">
              <div className="text-[11.5px] text-[#6E6E73]">Выручка за год</div>
              <div className="text-[24px] font-bold tracking-[-0.02em] text-[#1D1D1F]">
                {(currentAgg.annualRevenueRub / 1_000_000)
                  .toFixed(1)
                  .replace('.', ',')}{' '}
                млн ₽
              </div>
              <div className="text-[11px] font-medium text-[#2E6B4E]">
                Сумма 12 мес. всех моделей сценария
              </div>
            </div>

            <div className="rounded-[16px] bg-white border border-[#E6E0D4] p-4 space-y-1 shadow-2xs">
              <div className="text-[11.5px] text-[#6E6E73]">Плановая прибыль</div>
              <div className="text-[24px] font-bold tracking-[-0.02em] text-[#1D1D1F]">
                {(currentAgg.annualProfitRub / 1_000_000)
                  .toFixed(1)
                  .replace('.', ',')}{' '}
                млн ₽
              </div>
              <div className="text-[11px] text-[#6E6E73]">
                После закупки, комиссии, логистики и DRR
              </div>
            </div>

            <div className="rounded-[16px] bg-white border border-[#E6E0D4] p-4 space-y-1 shadow-2xs">
              <div className="text-[11.5px] text-[#6E6E73]">
                Потребность в закупках
              </div>
              <div className="text-[24px] font-bold tracking-[-0.02em] text-[#1D1D1F]">
                {(currentAgg.totalPurchaseNeedRub / 1_000_000)
                  .toFixed(1)
                  .replace('.', ',')}{' '}
                млн ₽
              </div>
              <div className="text-[11px] text-[#6E6E73]">
                Себестоимость партий с доставкой в РФ
              </div>
            </div>

            <div className="rounded-[16px] bg-white border border-[#E6E0D4] p-4 space-y-1 shadow-2xs">
              <div className="text-[11.5px] text-[#6E6E73]">Выполнение цели</div>
              <div className="text-[24px] font-bold tracking-[-0.02em] text-[#8B6F47]">
                {currentAgg.goalCompletionPct.toFixed(1).replace('.', ',')}%
              </div>
              <div className="text-[11px] text-[#6E6E73]">
                {(currentAgg.targetMonthRevenueRub / 1_000_000)
                  .toFixed(1)
                  .replace('.', ',')}{' '}
                из {currentScenario.monthlyTargetMln} млн ₽ в декабре
              </div>
            </div>
          </div>

          {/* D. Каталог моделей («Модели в сценарии №...» — макет Стр. 13) */}
          <div className="space-y-4 pt-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-[18px] font-bold text-[#1D1D1F]">
                  Модели в {currentScenario.title.toLowerCase()}
                </h3>
                <p className="text-[12px] text-[#6E6E73]">
                  Нажмите на любую карточку, чтобы открыть паспорт модели (Экран №2)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-[#8E8A82] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск модели..."
                    className="h-9 pl-8 pr-3 rounded-[10px] bg-white border border-[#DED8CC] text-[12.5px] text-[#1D1D1F] w-44"
                  />
                </div>

                <select
                  value={brandFilterLocal}
                  onChange={(e) =>
                    setBrandFilterLocal(
                      e.target.value as 'ALL' | 'BORNERS' | 'NA_TELE'
                    )
                  }
                  className="h-9 px-3 rounded-[10px] bg-white border border-[#DED8CC] text-[12px] font-semibold text-[#1D1D1F] cursor-pointer"
                >
                  <option value="ALL">Все бренды</option>
                  <option value="BORNERS">BORNERS</option>
                  <option value="NA_TELE">НА ТЕЛЕ</option>
                </select>

                <select
                  value={statusFilterLocal}
                  onChange={(e) => setStatusFilterLocal(e.target.value)}
                  className="h-9 px-3 rounded-[10px] bg-white border border-[#DED8CC] text-[12px] font-semibold text-[#1D1D1F] cursor-pointer"
                >
                  <option value="ALL">Все статусы</option>
                  <option value="В плане">В плане</option>
                  <option value="В разработке">В разработке</option>
                  <option value="Утверждено">Утверждено</option>
                  <option value="В архиве">В архиве</option>
                </select>

                <button
                  type="button"
                  onClick={() => setNewModelModalOpen(true)}
                  className="h-9 px-3.5 rounded-[10px] bg-[#1D1D1F] hover:bg-[#323236] text-white text-[12px] font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Добавить модель</span>
                </button>
              </div>
            </div>

            {/* Сетка карточек моделей (показываем ТОЛЬКО разрешённые в п. 3.2 D поля) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredModels.map((mod, modIdx) => {
                const met = computeModelScenarioMetrics(mod, currentScenario);
                const mainGallery =
                  mod.gallery.find((g) => g.isMain) || mod.gallery[0];
                const colors = mod.palettes[0]?.colors || [];

                return (
                  <button
                    key={mod.id}
                    type="button"
                    data-tour={modIdx === 0 ? 'model-passport' : undefined}
                    onClick={() => {
                      navigateScreen('model', mod.id);
                    }}
                    className="group rounded-[20px] bg-white hover:bg-[#FDFCFA] border border-[#E6E0D4] hover:border-[#C8A97E] p-4 text-left transition-all cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-[0_10px_26px_rgba(24,23,21,0.08)]"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="text-[11px] font-bold tracking-[0.04em] text-[#6E6E73]">
                          {mod.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : 'BORNERS'}{' '}
                          {mod.code}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            mod.launchStatus === 'Утверждено'
                              ? 'bg-[#2E6B4E]/12 text-[#2E6B4E]'
                              : mod.launchStatus === 'В разработке'
                              ? 'bg-[#D97706]/15 text-[#B45309]'
                              : 'bg-[#EFECE4] text-[#5A564F]'
                          }`}
                        >
                          {mod.launchStatus}
                        </span>
                      </div>

                      <div className="rounded-[14px] bg-gradient-to-b from-[#FAF7F0] to-[#F2ECE1] border border-[#EAE3D5] p-2 mb-3">
                        <BoxerPackStackSvg
                          colors={colors}
                          brandLabel={
                            mod.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : 'BORNERS'
                          }
                          customPhotoUrl={mainGallery?.url}
                        />
                      </div>

                      <div className="text-[15.5px] font-bold text-[#1D1D1F] group-hover:text-[#8B6F47] transition">
                        {mod.title}
                      </div>
                      <div className="text-[11.5px] text-[#6E6E73]">
                        {mod.subtitle}
                      </div>
                    </div>

                    <div className="mt-3.5 pt-3 border-t border-[#EFECE4] flex items-end justify-between gap-2">
                      <div>
                        <div className="text-[16px] font-bold text-[#1D1D1F]">
                          {(met.annualRevenueRub / 1_000_000)
                            .toFixed(1)
                            .replace('.', ',')}{' '}
                          млн ₽{' '}
                          <span className="text-[11px] font-normal text-[#6E6E73]">
                            / год
                          </span>
                        </div>
                        <div className="text-[11px] text-[#6E6E73] mt-0.5">
                          Декабрь:{' '}
                          <span className="font-semibold text-[#1D1D1F]">
                            {(met.targetMonthRevenueRub / 1_000_000)
                              .toFixed(1)
                              .replace('.', ',')}{' '}
                            млн ₽
                          </span>
                        </div>
                      </div>

                      <span className="px-2 py-1 rounded-[8px] bg-[#FAF4EC] border border-[#E8D8C3] text-[11px] font-bold text-[#8B6F47] shrink-0">
                        {met.goalSharePct.toFixed(1).replace('.', ',')}% цели
                      </span>
                    </div>
                  </button>
                );
              })}

              {/* Карточка «+ Добавить модель» (как на макете Стр. 13) */}
              <button
                type="button"
                onClick={() => setNewModelModalOpen(true)}
                className="rounded-[20px] border-2 border-dashed border-[#D8D0C1] hover:border-[#8B6F47] bg-[#FAF7F0]/70 hover:bg-white p-6 flex flex-col items-center justify-center text-center gap-2.5 transition cursor-pointer min-h-[290px]"
              >
                <div className="h-12 w-12 rounded-full bg-white border border-[#E2DACB] flex items-center justify-center text-[#1D1D1F] shadow-2xs">
                  <Plus className="h-5 w-5" />
                </div>
                <div className="text-[15px] font-bold text-[#1D1D1F]">
                  + Добавить модель
                </div>
                <p className="text-[12px] text-[#6E6E73] max-w-[200px]">
                  Новая товарная линейка в сценарий ({currentScenario.scopeLabel})
                </p>
              </button>
            </div>
          </div>

          {/* E. Общий график (ровно ОДИН график ниже каталога — п. 3.2 E ТЗ и макет Стр. 13) */}
          <div className="rounded-[20px] bg-white border border-[#E6E0D4] p-5 space-y-4 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-[15.5px] font-bold text-[#1D1D1F]">
                  Прогноз выручки по месяцам (2027, млн ₽)
                </h3>
                <p className="text-[11.5px] text-[#6E6E73]">
                  Сумма помесячных планов всех моделей сценария · наведите на месяц для просмотра плана и отклонения от цели
                </p>
              </div>

              <div className="flex items-center gap-4 text-[11.5px]">
                <span className="inline-flex items-center gap-1.5 font-medium text-[#1D1D1F]">
                  <span className="h-2.5 w-2.5 rounded-[3px] bg-[#1D1D1F]" />
                  BORNERS
                </span>
                {currentScenario.includedBrands.includes('NA_TELE') && (
                  <span className="inline-flex items-center gap-1.5 font-medium text-[#8B6F47]">
                    <span className="h-2.5 w-2.5 rounded-[3px] bg-[#D5B29C]" />
                    НА ТЕЛЕ
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-full bg-[#FAF4EC] border border-[#E8D8C3] text-[11px] font-bold text-[#8B6F47]">
                  Цель декабря: {currentScenario.monthlyTargetMln} млн ₽
                </span>
              </div>
            </div>

            <div className="h-[190px] grid grid-cols-12 gap-2.5 items-end pt-4 border-b border-[#E6E0D4] px-1">
              {MONTHS_SHORT_RU.map((mName, idx) => {
                const bVal = currentAgg?.monthlyBornersMln[idx] || 0;
                const nVal = currentAgg?.monthlyNaTeleMln[idx] || 0;
                const totVal = Math.round((bVal + nVal) * 10) / 10;
                const bHeight = Math.max(
                  6,
                  Math.round((bVal / maxChartVal) * 130)
                );
                const nHeight =
                  nVal > 0 ? Math.max(4, Math.round((nVal / maxChartVal) * 130)) : 0;
                const diffFromTarget =
                  Math.round((totVal - currentScenario.monthlyTargetMln) * 10) / 10;

                return (
                  <div
                    key={mName}
                    title={`${mName} 2027 · План моделей: ${totVal.toFixed(
                      1
                    )} млн ₽ | Цель сценария: ${
                      currentScenario.monthlyTargetMln
                    } млн ₽ (${diffFromTarget >= 0 ? '+' : ''}${diffFromTarget.toFixed(
                      1
                    )} млн ₽)`}
                    className="h-full flex flex-col justify-end items-center gap-1.5 group cursor-pointer"
                  >
                    <div className="text-[10.5px] font-bold text-[#1D1D1F]">
                      {totVal.toFixed(1).replace('.', ',')}
                    </div>
                    <div className="w-full flex flex-col justify-end items-center rounded-t-[6px] overflow-hidden">
                      {nHeight > 0 && (
                        <div
                          style={{ height: `${nHeight}px` }}
                          className="w-full bg-[#D5B29C]"
                        />
                      )}
                      <div
                        style={{ height: `${bHeight}px` }}
                        className={`w-full transition-colors ${
                          idx === 11
                            ? 'bg-[#C8A97E]'
                            : 'bg-[#1D1D1F] group-hover:bg-[#3A3A3E]'
                        }`}
                      />
                    </div>
                    <div
                      className={`text-[10.5px] ${
                        idx === 11
                          ? 'font-bold text-[#1D1D1F]'
                          : 'font-medium text-[#6E6E73]'
                      }`}
                    >
                      {mName}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛЬНОЕ ОКНО СОЗДАНИЯ НОВОЙ МОДЕЛИ (п. 7.1 ТЗ, Тест 11) */}
      {newModelModalOpen && (
        <div
          onClick={() => setNewModelModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreateNewModel}
            className="w-full max-w-md rounded-[22px] bg-white border border-[#E6E0D4] p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-[#1D1D1F]">
                Новая модель в портфель
              </h3>
              <button
                type="button"
                onClick={() => setNewModelModalOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-[#FAF8F4] flex items-center justify-center cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[12px] text-[#6E6E73]">
              Достаточно указать базовые поля — остальные характеристики можно заполнить позже в карточке модели.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11.5px] font-semibold text-[#1D1D1F]">
                  Бренд
                </label>
                <select
                  value={draftBrand}
                  onChange={(e) =>
                    setDraftBrand(e.target.value as 'BORNERS' | 'NA_TELE')
                  }
                  className="w-full h-9 px-3 mt-1 rounded-[10px] border border-[#DED8CC] text-[13px] font-semibold"
                >
                  <option value="BORNERS">BORNERS</option>
                  <option value="NA_TELE">НА ТЕЛЕ</option>
                </select>
              </div>

              <div>
                <label className="text-[11.5px] font-semibold text-[#1D1D1F]">
                  Название модели
                </label>
                <input
                  type="text"
                  placeholder="Например: SPORT MODAL 3 PACK"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  className="w-full h-9 px-3 mt-1 rounded-[10px] border border-[#DED8CC] text-[13px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11.5px] font-semibold text-[#1D1D1F]">
                    Тип изделия
                  </label>
                  <input
                    type="text"
                    value={draftType}
                    onChange={(e) => setDraftType(e.target.value)}
                    className="w-full h-9 px-3 mt-1 rounded-[10px] border border-[#DED8CC] text-[13px]"
                  />
                </div>
                <div>
                  <label className="text-[11.5px] font-semibold text-[#1D1D1F]">
                    Штук в комплекте
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={draftUnitsInPack}
                    onChange={(e) =>
                      setDraftUnitsInPack(Math.max(1, Number(e.target.value) || 1))
                    }
                    className="w-full h-9 px-3 mt-1 rounded-[10px] border border-[#DED8CC] text-[13px] font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11.5px] font-semibold text-[#1D1D1F]">
                    Розничная цена (₽)
                  </label>
                  <input
                    type="number"
                    value={draftRetailPrice}
                    onChange={(e) => setDraftRetailPrice(Number(e.target.value))}
                    className="w-full h-9 px-3 mt-1 rounded-[10px] border border-[#DED8CC] text-[13px]"
                  />
                </div>
                <div>
                  <label className="text-[11.5px] font-semibold text-[#1D1D1F]">
                    Себестоимость (₽)
                  </label>
                  <input
                    type="number"
                    value={draftUnitCost}
                    onChange={(e) => setDraftUnitCost(Number(e.target.value))}
                    className="w-full h-9 px-3 mt-1 rounded-[10px] border border-[#DED8CC] text-[13px]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNewModelModalOpen(false)}
                className="h-9 px-4 rounded-[10px] border border-[#DED8CC] text-[12.5px] font-semibold cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="h-9 px-4 rounded-[10px] bg-[#1D1D1F] text-white text-[12.5px] font-semibold cursor-pointer"
              >
                Создать и открыть карточку →
              </button>
            </div>
          </form>
        </div>
      )}

      {/* МОДАЛЬНОЕ ОКНО СОЗДАНИЯ НОВОГО СЦЕНАРИЯ (п. 7.3 ТЗ) */}
      {newScenarioModalOpen && (
        <div
          onClick={() => setNewScenarioModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreateNewScenario}
            className="w-full max-w-md rounded-[22px] bg-white border border-[#E6E0D4] p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-[#1D1D1F]">
                Новый сценарий роста
              </h3>
              <button
                type="button"
                onClick={() => setNewScenarioModalOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-[#FAF8F4] flex items-center justify-center cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[12px] text-[#6E6E73]">
              Карточки моделей не дублируются — в новый сценарий копируются только плановые объёмы продаж и допущения.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11.5px] font-semibold text-[#1D1D1F]">
                  Название сценария
                </label>
                <input
                  type="text"
                  placeholder="Например: Сценарий №4 · Экспансия СНГ"
                  value={draftScenTitle}
                  onChange={(e) => setDraftScenTitle(e.target.value)}
                  className="w-full h-9 px-3 mt-1 rounded-[10px] border border-[#DED8CC] text-[13px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11.5px] font-semibold text-[#1D1D1F]">
                    Цель в месяц (млн ₽)
                  </label>
                  <input
                    type="number"
                    value={draftScenTargetMln}
                    onChange={(e) =>
                      setDraftScenTargetMln(Math.max(10, Number(e.target.value) || 100))
                    }
                    className="w-full h-9 px-3 mt-1 rounded-[10px] border border-[#DED8CC] text-[13px] font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11.5px] font-semibold text-[#1D1D1F]">
                    Включённые бренды
                  </label>
                  <select
                    value={draftScenScope}
                    onChange={(e) =>
                      setDraftScenScope(e.target.value as 'BORNERS' | 'GROUP')
                    }
                    className="w-full h-9 px-3 mt-1 rounded-[10px] border border-[#DED8CC] text-[12.5px] font-semibold"
                  >
                    <option value="GROUP">Группа (BORNERS + НА ТЕЛЕ)</option>
                    <option value="BORNERS">Только BORNERS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11.5px] font-semibold text-[#1D1D1F]">
                  Скопировать базовые допущения из сценария
                </label>
                <select
                  value={draftCopyFromScenarioId}
                  onChange={(e) =>
                    setDraftCopyFromScenarioId(Number(e.target.value))
                  }
                  className="w-full h-9 px-3 mt-1 rounded-[10px] border border-[#DED8CC] text-[12.5px]"
                >
                  {scenarios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.monthlyTargetMln} млн ₽ / мес)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNewScenarioModalOpen(false)}
                className="h-9 px-4 rounded-[10px] border border-[#DED8CC] text-[12.5px] font-semibold cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="h-9 px-4 rounded-[10px] bg-[#1D1D1F] text-white text-[12.5px] font-semibold cursor-pointer"
              >
                Создать сценарий
              </button>
            </div>
          </form>
        </div>
      )}

      {/* КОНСТРУКТОР PDF ТЕХНИЧЕСКОГО ЗАДАНИЯ (Тест 10) */}
      {pdfModalOpen && conceptForPdf && (
        <PdfConstructorModal
          concept={{
            ...conceptForPdf,
            code: `BRN-${activeModel.code.replace('№', '')}`,
            name: `${
              activeModel.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : 'BORNERS'
            } ${activeModel.code} · ${activeModel.title}`,
            plannedUnitCost: activeModel.unitCostRub,
            plannedRetailPrice: activeModel.retailPriceRub,
            packUnitsCount: activeModel.unitsInPack,
          }}
          onClose={() => setPdfModalOpen(false)}
          onSaveToConcept={() => {
            notify(
              'success',
              `PDF ТЗ для ${activeModel.code} ${activeModel.title} сформирован`
            );
          }}
        />
      )}
    </div>
  );
}
