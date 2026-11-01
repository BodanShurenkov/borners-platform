'use client';

import { useEffect, useState } from 'react';
import { NavSectionId } from '@/types/platform';

export type DraftModuleKey =
  | 'finance'
  | 'marketing'
  | 'brandPortfolio'
  | 'marketIntelligence'
  | 'settingsSection'
  | 'strategyPresentationCard'
  | 'legacyReleaseCalendar';

export interface DraftModuleMeta {
  key: DraftModuleKey;
  title: string;
  subtitle: string;
  sectionId?: NavSectionId;
  badge: string;
}

export const DRAFT_MODULES_META: DraftModuleMeta[] = [
  {
    key: 'finance',
    title: 'Финансы (P&L и статьи расходов)',
    subtitle: 'Раздел «Финансы» в левом меню: таблица P&L, статьи БДР и точка безубыточности',
    sectionId: 'finance',
    badge: 'Боковое меню',
  },
  {
    key: 'marketing',
    title: 'Маркетинг и инфлюенсеры',
    subtitle: 'Раздел «Маркетинг» в левом меню: кампании, блогеры, посевы и ДРР',
    sectionId: 'marketing-growth',
    badge: 'Боковое меню',
  },
  {
    key: 'brandPortfolio',
    title: 'Портфель брендов и 14 блоков ДНК',
    subtitle: 'Раздел «Портфель брендов» и вкладка 14 стратегических блоков ДНК внутри стратегии',
    sectionId: 'brand-portfolio',
    badge: 'Стратегия · Черновик',
  },
  {
    key: 'marketIntelligence',
    title: 'Рынок и конкуренты',
    subtitle: 'Раздел «Рынок и конкуренты»: матрица игроков, ценовые сегменты и доли рынка',
    sectionId: 'market-intelligence',
    badge: 'Аналитика · Черновик',
  },
  {
    key: 'strategyPresentationCard',
    title: 'Презентация стратегии (16 слайдов)',
    subtitle: 'Нижняя карточка в левом меню и полноэкранный режим защиты стратегии',
    badge: 'Режим презентации',
  },
  {
    key: 'legacyReleaseCalendar',
    title: 'Календарь релизов и чек-листов (расширенный)',
    subtitle: 'Дополнительная вкладка старого календаря дропов внутри раздела «План продаж»',
    sectionId: 'launch-calendar',
    badge: 'Внутри Плана продаж',
  },
  {
    key: 'settingsSection',
    title: 'Настройки системы в боковом меню',
    subtitle: 'Пункт «Настройки · borners-group.ru» в нижней части левой навигации',
    sectionId: 'settings',
    badge: 'Системный раздел',
  },
];

export type DraftModulesState = Record<DraftModuleKey, boolean>;

export const DEFAULT_DRAFT_MODULES_STATE: DraftModulesState = {
  finance: false,
  marketing: false,
  brandPortfolio: false,
  marketIntelligence: false,
  settingsSection: false,
  strategyPresentationCard: false,
  legacyReleaseCalendar: false,
};

const STORAGE_KEY = 'borners_draft_modules_v1';
const EVENT_NAME = 'borners-draft-modules-changed';

export function loadDraftModulesState(): DraftModulesState {
  if (typeof window === 'undefined') return DEFAULT_DRAFT_MODULES_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DRAFT_MODULES_STATE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_DRAFT_MODULES_STATE,
      ...(typeof parsed === 'object' && parsed !== null ? parsed : {}),
    };
  } catch {
    return DEFAULT_DRAFT_MODULES_STATE;
  }
}

export function saveDraftModulesState(next: DraftModulesState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: next }));
  } catch {
    // ignore storage errors
  }
}

export function useDraftModules() {
  const [draftModules, setDraftModules] = useState<DraftModulesState>(
    DEFAULT_DRAFT_MODULES_STATE
  );

  useEffect(() => {
    setDraftModules(loadDraftModulesState());

    const handleChange = () => {
      setDraftModules(loadDraftModulesState());
    };
    window.addEventListener(EVENT_NAME, handleChange);
    window.addEventListener('storage', handleChange);
    return () => {
      window.removeEventListener(EVENT_NAME, handleChange);
      window.removeEventListener('storage', handleChange);
    };
  }, []);

  const toggleDraftModule = (key: DraftModuleKey) => {
    const current = loadDraftModulesState();
    const updated: DraftModulesState = {
      ...current,
      [key]: !current[key],
    };
    setDraftModules(updated);
    saveDraftModulesState(updated);
  };

  const setAllDraftModules = (enabled: boolean) => {
    const updated: DraftModulesState = {
      finance: enabled,
      marketing: enabled,
      brandPortfolio: enabled,
      marketIntelligence: enabled,
      settingsSection: enabled,
      strategyPresentationCard: enabled,
      legacyReleaseCalendar: enabled,
    };
    setDraftModules(updated);
    saveDraftModulesState(updated);
  };

  const enabledCount = Object.values(draftModules).filter(Boolean).length;

  return {
    draftModules,
    toggleDraftModule,
    setAllDraftModules,
    enabledCount,
    totalCount: DRAFT_MODULES_META.length,
  };
}
