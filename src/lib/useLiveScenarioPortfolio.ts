'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  GrowthScenarioDef,
  INITIAL_SCENARIOS,
  ScenarioModelSpec,
  computeModelScenarioMetrics,
} from '@/lib/scenarioData';
import {
  ACTING_2027_SCENARIO_DEF,
  ACTING_2027_SCENARIO_ID,
  ACTING_2027_SCENARIO_MODELS,
  getActingSkuByWbOrVendor,
} from '@/lib/actingAssortment2027';
import {
  S1_100M_SCENARIO_MODELS,
  applyClientSavedS1SalesPlan,
  isUnverifiedActingSku,
} from '@/lib/scenarioS1_100M';
import { safeGetStorageJson, safeSetStorageJson } from '@/lib/safeStorage';

export const STORAGE_KEY_SCENARIOS = 'borners_tz_scenarios_v1';
export const STORAGE_KEY_MODELS = 'borners_tz_models_v1';
export const STORAGE_KEY_ACTIVE_SCENARIO_ID = 'borners_active_scenario_id_v1';
export const STORAGE_KEY_S1_GROUP_PORTFOLIO = 'borners_s1_include_fukai_v1';

const DEFAULT_MODELS_LIST: ScenarioModelSpec[] = applyClientSavedS1SalesPlan([
  ...ACTING_2027_SCENARIO_MODELS,
  ...S1_100M_SCENARIO_MODELS,
]);

export function filterModelsForScenario(
  models: ScenarioModelSpec[],
  scenario: GrowthScenarioDef,
  includeGroupPortfolioInS1: boolean
): ScenarioModelSpec[] {
  const isActing = scenario.id === ACTING_2027_SCENARIO_ID;
  return models.filter((m) => {
    if (m.launchStatus === 'В архиве') return false;
    if (isActing) {
      return (
        Boolean(getActingSkuByWbOrVendor(m.code, m.title)) ||
        (!['scen-model-001', 'scen-model-002', 'scen-model-003', 'scen-model-004'].includes(
          m.id
        ) &&
          Boolean(m.plansByScenario[ACTING_2027_SCENARIO_ID]))
      );
    }
    if (
      ['scen-model-001', 'scen-model-002', 'scen-model-003', 'scen-model-004'].includes(
        m.id
      )
    ) {
      return false;
    }
    if (!scenario.includedBrands.includes(m.brandId)) {
      return false;
    }
    if (
      scenario.id === 1 &&
      !includeGroupPortfolioInS1 &&
      isUnverifiedActingSku(m.code)
    ) {
      return false;
    }
    return true;
  });
}

export function useLiveScenarioPortfolio() {
  const [scenarios, setScenarios] = useState<GrowthScenarioDef[]>(INITIAL_SCENARIOS);
  const [models, setModels] = useState<ScenarioModelSpec[]>(DEFAULT_MODELS_LIST);
  const [selectedScenarioId, setSelectedScenarioIdState] = useState<number>(1);
  const [includeGroupPortfolioInS1, setIncludeGroupState] = useState<boolean>(false);

  const syncFromStorage = useCallback(() => {
    const parsedScen = safeGetStorageJson<GrowthScenarioDef[]>(STORAGE_KEY_SCENARIOS);
    if (Array.isArray(parsedScen) && parsedScen.length > 0) {
      const hasActing = parsedScen.some((s) => s.id === ACTING_2027_SCENARIO_ID);
      setScenarios(hasActing ? parsedScen : [ACTING_2027_SCENARIO_DEF, ...parsedScen]);
    }

    const parsedModels = safeGetStorageJson<ScenarioModelSpec[]>(STORAGE_KEY_MODELS);
    if (Array.isArray(parsedModels) && parsedModels.length > 0) {
      const clean = parsedModels.filter(
        (m) =>
          !['scen-model-001', 'scen-model-002', 'scen-model-003', 'scen-model-004'].includes(
            m.id
          )
      );
      if (clean.length > 0) {
        setModels(clean);
      }
    }

    const savedScenId = safeGetStorageJson<number>(STORAGE_KEY_ACTIVE_SCENARIO_ID);
    if (typeof savedScenId === 'number') {
      setSelectedScenarioIdState(savedScenId);
    }

    const savedGroupFlag = safeGetStorageJson<boolean>(STORAGE_KEY_S1_GROUP_PORTFOLIO);
    if (typeof savedGroupFlag === 'boolean') {
      setIncludeGroupState(savedGroupFlag);
    }
  }, []);

  useEffect(() => {
    syncFromStorage();
    window.addEventListener('borners-scenario-models-changed', syncFromStorage);
    window.addEventListener('borners-scenarios-changed', syncFromStorage);
    window.addEventListener('borners-active-scenario-changed', syncFromStorage);
    window.addEventListener('storage', syncFromStorage);
    return () => {
      window.removeEventListener('borners-scenario-models-changed', syncFromStorage);
      window.removeEventListener('borners-scenarios-changed', syncFromStorage);
      window.removeEventListener('borners-active-scenario-changed', syncFromStorage);
      window.removeEventListener('storage', syncFromStorage);
    };
  }, [syncFromStorage]);

  const setSelectedScenarioId = useCallback((nextId: number) => {
    setSelectedScenarioIdState(nextId);
    safeSetStorageJson(STORAGE_KEY_ACTIVE_SCENARIO_ID, nextId);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('borners-active-scenario-changed'));
    }
  }, []);

  const setIncludeGroupPortfolioInS1 = useCallback((nextVal: boolean) => {
    setIncludeGroupState(nextVal);
    safeSetStorageJson(STORAGE_KEY_S1_GROUP_PORTFOLIO, nextVal);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('borners-active-scenario-changed'));
    }
  }, []);

  const updateModelSpec = useCallback((updated: ScenarioModelSpec) => {
    setModels((prev) => {
      const next = prev.map((m) => (m.id === updated.id ? updated : m));
      safeSetStorageJson(STORAGE_KEY_MODELS, next);
      if (typeof window !== 'undefined') {
        window.setTimeout(() => {
          window.dispatchEvent(new CustomEvent('borners-scenario-models-changed'));
        }, 0);
      }
      return next;
    });
  }, []);

  const orderedScenarios = useMemo(
    () =>
      [...scenarios].sort((a, b) =>
        a.id === ACTING_2027_SCENARIO_ID
          ? -1
          : b.id === ACTING_2027_SCENARIO_ID
          ? 1
          : a.id - b.id
      ),
    [scenarios]
  );

  const currentScenario = useMemo(
    () => scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0],
    [scenarios, selectedScenarioId]
  );

  const eligibleModels = useMemo(
    () =>
      filterModelsForScenario(models, currentScenario, includeGroupPortfolioInS1),
    [models, currentScenario, includeGroupPortfolioInS1]
  );

  const totals = useMemo(() => {
    let annualRevenueRub = 0;
    let decRevenueRub = 0;
    let annualPacks = 0;
    let decPacks = 0;
    const monthlyRevRub = Array(12).fill(0) as number[];
    const monthlyPacks = Array(12).fill(0) as number[];

    for (const m of eligibleModels) {
      const met = computeModelScenarioMetrics(m, currentScenario);
      annualRevenueRub += met.annualRevenueRub;
      decRevenueRub += met.targetMonthRevenueRub;
      annualPacks += met.annualPacks;
      decPacks += met.targetMonthPacks;
      for (let i = 0; i < 12; i++) {
        monthlyRevRub[i] += met.monthlyRevenuesRub[i] || 0;
        monthlyPacks[i] += met.plan.monthlyPacks[i] || 0;
      }
    }

    return {
      annualRevenueRub,
      decRevenueRub,
      annualPacks,
      decPacks,
      monthlyRevRub,
      monthlyPacks,
    };
  }, [eligibleModels, currentScenario]);

  return {
    scenarios,
    orderedScenarios,
    models,
    currentScenario,
    selectedScenarioId,
    setSelectedScenarioId,
    includeGroupPortfolioInS1,
    setIncludeGroupPortfolioInS1,
    eligibleModels,
    totals,
    updateModelSpec,
  };
}
