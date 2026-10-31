'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { usePlatform } from '@/context/PlatformContext';
import { NavSectionId, PeriodFilter } from '@/types/platform';
import {
  CONCEPT_STAGE_LABELS_RU,
  ROLE_LABELS_RU,
  TASK_STATUS_LABELS_RU,
  canUserAccessSection,
  canUserViewFinance,
} from '@/lib/finance';
import { DashboardView } from '@/components/sections/DashboardView';
import { BrandPortfolioView, BrandStrategyView } from '@/components/sections/BrandStrategyView';
import { StrategyPresentationDeck } from '@/components/sections/StrategyPresentationDeck';
import { ProductCatalogView } from '@/components/sections/ProductCatalogView';
import { ProductLabView } from '@/components/sections/ProductLabView';
import { LaunchCalendarView, MarketingGrowthView } from '@/components/sections/LaunchAndGrowthViews';
import { FinanceView } from '@/components/sections/FinanceAndImportViews';
import {
  DocumentsView,
  MarketIntelligenceView,
  RoadmapTasksView,
  SettingsView,
  TeamView,
} from '@/components/sections/ManagementAndSystemViews';

interface NavGroup {
  groupTitle: string;
  items: {
    id: NavSectionId;
    label: string;
  }[];
}

const SIMPLE_NAV_ITEMS: {
  id: NavSectionId;
  step: string;
  label: string;
  subtitle: string;
}[] = [
  {
    id: 'dashboard',
    step: '01',
    label: 'Дашборд и Сводка',
    subtitle: 'Сводка KPI и пульс холдинга',
  },
  {
    id: 'product-lab',
    step: '02',
    label: 'Лаборатория R&D',
    subtitle: '7 этапов отбора и образцы',
  },
  {
    id: 'brand-strategy',
    step: '03',
    label: 'Стратегия брендов',
    subtitle: 'Паспорта 14 блоков ДНК',
  },
  {
    id: 'product-catalog',
    step: '04',
    label: 'Каталог моделей',
    subtitle: 'Матрица 70/30 и юнит-маржа',
  },
  {
    id: 'launch-calendar',
    step: '05',
    label: 'Календарь запусков',
    subtitle: 'Релизы коллекций и чек-листы',
  },
  {
    id: 'finance',
    step: '06',
    label: 'Финансы 2027',
    subtitle: '3 сценария P&L и План/Факт',
  },
];

const OPERATIONAL_NAV_ITEMS: {
  id: NavSectionId;
  step: string;
  label: string;
}[] = [
  { id: 'brand-portfolio', step: '07', label: 'Портфель брендов' },
  { id: 'marketing-growth', step: '08', label: 'Маркетинг и рост' },
  { id: 'market-intelligence', step: '09', label: 'Рынок и конкуренты' },
  { id: 'roadmap-tasks', step: '10', label: 'Задачи и проекты' },
  { id: 'documents', step: '11', label: 'Документы и ТЗ' },
  { id: 'team', step: '12', label: 'Команда и роли' },
  { id: 'settings', step: '13', label: 'Настройки системы' },
];

const NAV_GROUPS: NavGroup[] = [
  {
    groupTitle: 'R&D и Продукт (Ключевой контур)',
    items: [
      { id: 'product-lab', label: 'Лаборатория R&D (Product Lab)' },
      { id: 'product-catalog', label: 'Каталог моделей' },
    ],
  },
  {
    groupTitle: 'Запуски и операции',
    items: [
      { id: 'launch-calendar', label: 'Календарь запусков' },
      { id: 'roadmap-tasks', label: 'Задачи и проекты' },
      { id: 'documents', label: 'Документы и файлы' },
      { id: 'finance', label: 'Финансы и P&L' },
      { id: 'marketing-growth', label: 'Маркетинг и рост' },
    ],
  },
  {
    groupTitle: 'Стратегия и обзор',
    items: [
      { id: 'dashboard', label: 'Дашборд группы' },
      { id: 'brand-portfolio', label: 'Портфель брендов' },
      { id: 'brand-strategy', label: 'Стратегия бренда' },
      { id: 'market-intelligence', label: 'Рынок и конкуренты' },
    ],
  },
  {
    groupTitle: 'Система и доступ',
    items: [
      { id: 'team', label: 'Команда и роли' },
      { id: 'settings', label: 'Настройки' },
    ],
  },
];

export function AppShell() {
  const {
    isAuthenticated,
    currentUser,
    users,
    loginAs,
    logout,
    brands,
    products,
    concepts,
    launches,
    projects,
    tasks,
    documents,
    competitors,
    activeSection,
    navHistory,
    navigateTo,
    goBack,
    brandFilter,
    setBrandFilter,
    periodFilter,
    setPeriodFilter,
    platformMode,
    setPlatformMode,
    simpleMode,
    setSimpleMode,
    darkMode,
    selectedProductId,
    selectedConceptId,
    selectedLaunchId,
    notify,
    toasts,
    dismissToast,
  } = usePlatform();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const searchResults = useMemo(() => {
    const q = globalSearchQuery.trim().toLowerCase();
    if (!q) return [];
    const hasFin = canUserViewFinance(currentUser);

    const results: {
      id: string;
      category: string;
      title: string;
      subtitle: string;
      onSelect: () => void;
    }[] = [];

    for (const p of products) {
      if (p.isArchived) continue;
      if (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)) {
        results.push({
          id: `p-${p.id}`,
          category: 'Модель',
          title: `${p.sku} — ${p.name}`,
          subtitle: `${p.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : p.brandId} · ${p.collection}`,
          onSelect: () => {
            navigateTo('product-catalog', { productId: p.id });
            setSearchModalOpen(false);
          },
        });
      }
    }

    for (const c of concepts) {
      if (c.isArchived) continue;
      if (c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)) {
        results.push({
          id: `c-${c.id}`,
          category: 'R&D',
          title: `${c.code} — ${c.name}`,
          subtitle: `${CONCEPT_STAGE_LABELS_RU[c.stage]} · Запуск: ${c.targetLaunchDate}`,
          onSelect: () => {
            navigateTo('product-lab', { conceptId: c.id });
            setSearchModalOpen(false);
          },
        });
      }
    }

    for (const l of launches) {
      if (l.isArchived) continue;
      if (l.name.toLowerCase().includes(q) || l.collectionName.toLowerCase().includes(q)) {
        results.push({
          id: `l-${l.id}`,
          category: 'Запуск',
          title: l.name,
          subtitle: `Старт: ${l.startDate} · Готовность ${l.readinessPct}%`,
          onSelect: () => {
            navigateTo('launch-calendar', { launchId: l.id });
            setSearchModalOpen(false);
          },
        });
      }
    }

    for (const pr of projects) {
      if (pr.name.toLowerCase().includes(q)) {
        results.push({
          id: `pr-${pr.id}`,
          category: 'Проект',
          title: pr.name,
          subtitle: `${pr.brandId} · ${pr.quarter}`,
          onSelect: () => {
            navigateTo('roadmap-tasks');
            setSearchModalOpen(false);
          },
        });
      }
    }

    for (const t of tasks) {
      if (t.isArchived) continue;
      if (t.title.toLowerCase().includes(q)) {
        results.push({
          id: `t-${t.id}`,
          category: 'Задача',
          title: t.title,
          subtitle: `${TASK_STATUS_LABELS_RU[t.status]} · до ${t.deadline}`,
          onSelect: () => {
            navigateTo('roadmap-tasks');
            setSearchModalOpen(false);
          },
        });
      }
    }

    for (const d of documents) {
      if (d.isArchived) continue;
      if (d.isFinancialRestricted && !hasFin) continue;
      if (d.title.toLowerCase().includes(q) || d.fileName.toLowerCase().includes(q)) {
        results.push({
          id: `d-${d.id}`,
          category: 'Документ',
          title: d.title,
          subtitle: `${d.fileName} (${d.category})`,
          onSelect: () => {
            navigateTo('documents');
            setSearchModalOpen(false);
          },
        });
      }
    }

    for (const comp of competitors) {
      if (comp.brandName.toLowerCase().includes(q)) {
        results.push({
          id: `comp-${comp.id}`,
          category: 'Конкурент',
          title: comp.brandName,
          subtitle: comp.positioning,
          onSelect: () => {
            navigateTo('market-intelligence');
            setSearchModalOpen(false);
          },
        });
      }
    }

    return results.slice(0, 12);
  }, [
    globalSearchQuery,
    currentUser,
    products,
    concepts,
    launches,
    projects,
    tasks,
    documents,
    competitors,
    navigateTo,
  ]);

  if (!isAuthenticated) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <div className="min-h-screen bg-[#F7F7F5] dark:bg-zinc-950 text-[#171717] dark:text-zinc-100 flex items-center justify-center p-8">
          <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl border border-[#E8E8E5] dark:border-zinc-800 p-10 space-y-8 shadow-xs">
            <div className="space-y-2 border-b border-[#E8E8E5] pb-6">
              <div className="text-[13px] font-medium uppercase tracking-widest text-[#737373]">
                BORNERS GROUP · 2026 / 2027
              </div>
              <h1 className="text-[32px] font-bold tracking-tight text-[#171717] dark:text-white">
                Вход в рабочую систему
              </h1>
            </div>

            <div className="divide-y divide-[#E8E8E5] dark:divide-zinc-800">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => loginAs(u.id)}
                  className="w-full py-5 px-4 text-left hover:bg-[#F7F7F5] dark:hover:bg-zinc-800 rounded-xl transition flex items-center justify-between cursor-pointer group"
                >
                  <div>
                    <div className="text-[18px] font-semibold text-[#171717] dark:text-zinc-100">
                      {u.fullName}
                    </div>
                    <div className="text-[14px] text-[#737373] mt-0.5">{u.jobTitle}</div>
                  </div>
                  <span className="text-[13px] font-medium text-[#171717] dark:text-zinc-300 bg-[#F7F7F5] border border-[#E8E8E5] rounded-lg px-3.5 py-1.5">
                    {ROLE_LABELS_RU[u.role]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-[#F8F6F2] dark:bg-zinc-950 text-[#161615] dark:text-zinc-100 flex">
        {/* МОБИЛЬНЫЙ ОВЕРЛЕЙ */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          />
        )}

        {/* ЛЕВЫЙ САЙДБАР: швейцарская архитектурная колонка с живой телеметрией разделов и пульсом портфеля */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-[276px] bg-[#FDFCFA] dark:bg-zinc-900 border-r border-[#E5E0D8] dark:border-zinc-800 flex flex-col justify-between transition-transform lg:static lg:translate-x-0 shrink-0 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="overflow-y-auto flex-1">
            {/* Архитектурный логотип группы (ровно в высоту верхнего хедера h-14 для идеального совпадения линий) */}
            <div className="h-14 px-5 border-b border-[#E5E0D8] dark:border-zinc-800 flex items-center justify-between">
              <button
                onClick={() => {
                  setPlatformMode('management');
                  navigateTo('dashboard');
                }}
                className="text-left cursor-pointer flex items-baseline gap-2.5 group"
              >
                <span className="font-serif-editorial text-[22px] font-semibold tracking-[0.03em] text-[#161615] dark:text-white leading-none">
                  BORNERS
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#7A756D]">
                  GROUP · 27
                </span>
              </button>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="lg:hidden p-1 text-[#7A756D] hover:text-[#161615]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* КОНТУР I: Ключевые разделы с живыми счётчиками и описанием роли */}
            <nav className="p-3.5 space-y-4">
              <div className="space-y-1.5">
                <div className="px-2 pb-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-[#8C867E]">
                  <span>I · Ядро системы</span>
                  <span>01—06</span>
                </div>

                {SIMPLE_NAV_ITEMS.filter((item) =>
                  canUserAccessSection(currentUser, item.id)
                ).map((item) => {
                  const isActive = platformMode === 'management' && activeSection === item.id;

                  const activeConceptsCount = concepts.filter((c) => !c.isArchived).length;
                  const activeProductsCount = products.filter((p) => !p.isArchived).length;
                  const activeLaunchesCount = launches.filter((l) => !l.isArchived).length;

                  const badgeText =
                    item.id === 'dashboard'
                      ? 'Сводка'
                      : item.id === 'product-lab'
                      ? `${activeConceptsCount} мод.`
                      : item.id === 'brand-strategy'
                      ? '28 бл.'
                      : item.id === 'product-catalog'
                      ? `${activeProductsCount} SKU`
                      : item.id === 'launch-calendar'
                      ? `${activeLaunchesCount} рел.`
                      : '3 сцен.';

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setPlatformMode('management');
                        navigateTo(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full rounded-[6px] px-3 py-2.5 text-left transition-all cursor-pointer border ${
                        isActive
                          ? 'bg-[#161615] text-[#F8F6F2] border-[#161615]'
                          : 'bg-[#FDFCFA] text-[#161615] border-transparent hover:bg-[#F3EFE8] hover:border-[#E5E0D8]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`font-mono text-[10px] uppercase tracking-[0.12em] shrink-0 ${
                              isActive ? 'text-[#A39E93]' : 'text-[#8C867E]'
                            }`}
                          >
                            {item.step}
                          </span>
                          <span className="text-[13px] font-medium tracking-[-0.01em] truncate">
                            {item.label}
                          </span>
                        </div>
                        <span
                          className={`px-1.5 py-0.5 rounded-[4px] font-mono text-[10px] shrink-0 ${
                            isActive
                              ? 'bg-white/12 text-[#E5E0D8]'
                              : 'bg-[#F2EFE9] text-[#6E6A63] border border-[#E5E0D8]'
                          }`}
                        >
                          {badgeText}
                        </span>
                      </div>
                      <div
                        className={`text-[11px] mt-0.5 pl-[22px] truncate ${
                          isActive ? 'text-[#B8B2A8]' : 'text-[#7A756D]'
                        }`}
                      >
                        {item.subtitle}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* КОНТУР II: Операционное управление и аналитика (всегда на виду, чтобы не было пустоты) */}
              <div className="pt-3 border-t border-[#E5E0D8] space-y-1">
                <div className="px-2 pb-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-[#8C867E]">
                  <span>II · Операции и штаб</span>
                  <span>07—13</span>
                </div>

                {OPERATIONAL_NAV_ITEMS.filter((item) =>
                  canUserAccessSection(currentUser, item.id)
                ).map((item) => {
                  const isActive =
                    platformMode === 'management' && activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setPlatformMode('management');
                        navigateTo(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full h-8 rounded-[6px] px-2.5 flex items-center justify-between text-left text-[12.5px] transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#161615] text-[#F8F6F2] font-medium'
                          : 'text-[#5C5852] hover:text-[#161615] hover:bg-[#F3EFE8]'
                      }`}
                    >
                      <span className="truncate">{item.label}</span>
                      <span
                        className={`font-mono text-[10px] shrink-0 ${
                          isActive ? 'text-[#A39E93]' : 'text-[#9E988E]'
                        }`}
                      >
                        {item.step}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* КОНТУР III: Пульс брендов в сайдбаре (быстрый фильтр + сводка портфеля) */}
              <div className="pt-3 border-t border-[#E5E0D8] space-y-2">
                <div className="px-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-[#8C867E]">
                  <span>III · Фокус портфеля</span>
                  <span>{brandFilter === 'ALL' ? 'ГРУППА' : brandFilter}</span>
                </div>

                <div className="rounded-[6px] border border-[#E5E0D8] bg-[#F8F6F2] p-2.5 space-y-2">
                  {[
                    {
                      code: 'ALL' as const,
                      title: 'Все бренды группы',
                      meta: `${products.filter((p) => !p.isArchived).length} SKU · ${
                        concepts.filter((c) => !c.isArchived).length
                      } R&D`,
                      dot: '#161615',
                    },
                    {
                      code: 'BORNERS' as const,
                      title: 'BORNERS',
                      meta: `${
                        products.filter((p) => !p.isArchived && p.brandId === 'BORNERS').length
                      } SKU · ${
                        concepts.filter((c) => !c.isArchived && c.brandId === 'BORNERS').length
                      } R&D`,
                      dot: '#B85D35',
                    },
                    {
                      code: 'NA_TELE' as const,
                      title: 'НА ТЕЛЕ',
                      meta: `${
                        products.filter((p) => !p.isArchived && p.brandId === 'NA_TELE').length
                      } SKU · ${
                        concepts.filter((c) => !c.isArchived && c.brandId === 'NA_TELE').length
                      } R&D`,
                      dot: '#7D7268',
                    },
                  ].map((b) => {
                    const selected = brandFilter === b.code;
                    return (
                      <button
                        key={b.code}
                        type="button"
                        onClick={() => setBrandFilter(b.code)}
                        className={`w-full px-2.5 py-1.5 rounded-[4px] flex items-center justify-between text-left transition cursor-pointer ${
                          selected
                            ? 'bg-[#FDFCFA] border border-[#161615] text-[#161615] font-medium'
                            : 'hover:bg-[#FDFCFA] text-[#5C5852] border border-transparent'
                        }`}
                      >
                        <span className="inline-flex items-center gap-2 text-[12px] truncate">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: b.dot }}
                          />
                          <span className="truncate">{b.title}</span>
                        </span>
                        <span className="font-mono text-[10px] text-[#7A756D] shrink-0">
                          {b.meta}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </nav>
          </div>

          {/* Нижняя карточка сайдбара: Быстрый вход в Презентацию совета директоров */}
          <div className="p-3.5 border-t border-[#E5E0D8] dark:border-zinc-800 bg-[#F8F6F2]/70">
            <button
              type="button"
              onClick={() =>
                setPlatformMode(platformMode === 'strategy' ? 'management' : 'strategy')
              }
              className={`w-full rounded-[6px] p-3 text-left transition cursor-pointer border ${
                platformMode === 'strategy'
                  ? 'bg-[#161615] text-[#F8F6F2] border-[#161615]'
                  : 'bg-[#FDFCFA] hover:bg-[#161615] text-[#161615] hover:text-[#F8F6F2] border-[#E5E0D8] group'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.16em] opacity-75">
                <span>BOARDROOM DECK</span>
                <span>08 СЛАЙДОВ ↗</span>
              </div>
              <div className="font-serif-editorial text-[17px] font-medium mt-0.5 leading-snug">
                {platformMode === 'strategy'
                  ? 'Вернуться в рабочую систему'
                  : 'Презентация стратегии 2027'}
              </div>
            </button>
          </div>
        </aside>

        {/* ОСНОВНАЯ РАБОЧАЯ ОБЛАСТЬ */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* ВЕРХНЯЯ ПАНЕЛЬ: единая высота h-14, строгая геометрия rounded-[6px] */}
          <header className="sticky top-0 z-30 h-14 bg-[#FDFCFA]/95 dark:bg-zinc-900/95 backdrop-blur-xs border-b border-[#E5E0D8] dark:border-zinc-800 px-6 md:px-8 flex items-center justify-between gap-4">
            {/* Левая группа: Назад + Выпадающий список брендов */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden h-9 w-9 rounded-[6px] bg-white border border-[#E5E0D8] flex items-center justify-center"
              >
                <Menu className="h-4 w-4" />
              </button>

              {navHistory.length > 1 && (
                <button
                  onClick={goBack}
                  title="Назад"
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[6px] bg-white border border-[#E5E0D8] text-[12.5px] font-medium text-[#161615] hover:border-[#161615] transition cursor-pointer shrink-0"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Назад</span>
                </button>
              )}

              {/* ВЫПАДАЮЩИЙ СПИСОК БРЕНДОВ */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setBrandDropdownOpen(!brandDropdownOpen)}
                  className="h-9 px-3.5 rounded-[6px] bg-white hover:border-[#161615] border border-[#E5E0D8] text-[13px] text-[#161615] inline-flex items-center gap-3 cursor-pointer transition min-w-[180px] justify-between"
                >
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          brandFilter === 'BORNERS'
                            ? '#B85D35'
                            : brandFilter === 'NA_TELE'
                            ? '#7D7268'
                            : '#161615',
                      }}
                    />
                    <span className="text-[#6E6A63]">
                      Бренд:{' '}
                      <span className="font-medium text-[#161615]">
                        {brandFilter === 'ALL'
                          ? 'Все бренды'
                          : brandFilter === 'NA_TELE'
                          ? 'НА ТЕЛЕ'
                          : 'BORNERS'}
                      </span>
                    </span>
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-[#8C867E]" />
                </button>

                {brandDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setBrandDropdownOpen(false)}
                    />
                    <div className="absolute left-0 mt-1.5 w-64 rounded-[8px] bg-white border border-[#E5E0D8] shadow-lg p-1.5 z-50 text-[13px] space-y-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setBrandFilter('ALL');
                          setBrandDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 rounded-[5px] text-left flex items-center justify-between cursor-pointer ${
                          brandFilter === 'ALL'
                            ? 'bg-[#161615] text-white font-medium'
                            : 'text-[#161615] hover:bg-[#F2EFE9]'
                        }`}
                      >
                        <span className="inline-flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-current" />
                          <span>Все бренды группы</span>
                        </span>
                      </button>

                      {brands
                        .filter((b) => !b.isStrategyInDevelopment)
                        .map((b) => {
                          const isSelected = brandFilter === b.code || brandFilter === b.id;
                          const dotColor = b.code === 'BORNERS' ? '#B85D35' : '#7D7268';
                          return (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => {
                                setBrandFilter(b.code);
                                setBrandDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2 rounded-[5px] text-left flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? 'bg-[#161615] text-white font-medium'
                                  : 'text-[#161615] hover:bg-[#F2EFE9]'
                              }`}
                            >
                              <span className="inline-flex items-center gap-2">
                                <span
                                  className="h-2 w-2 rounded-full"
                                  style={{ backgroundColor: dotColor }}
                                />
                                <span>{b.name}</span>
                              </span>
                              <span
                                className={`font-mono text-[10px] uppercase ${
                                  isSelected ? 'text-neutral-300' : 'text-[#8C867E]'
                                }`}
                              >
                                Активен
                              </span>
                            </button>
                          );
                        })}

                      <div className="pt-2 mt-1 border-t border-[#E5E0D8] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8C867E]">
                        В проработке стратегии
                      </div>

                      {brands
                        .filter((b) => b.isStrategyInDevelopment)
                        .map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => {
                              setBrandDropdownOpen(false);
                              notify(
                                'warning',
                                `Бренд «${b.name}» в проработке`,
                                'Сейчас формируется стратегия и позиционирование бренда'
                              );
                            }}
                            className="w-full px-3 py-2 rounded-[5px] text-left flex items-center justify-between text-[#8C867E] hover:bg-[#F2EFE9] cursor-not-allowed"
                          >
                            <span className="inline-flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#B8B2A8]" />
                              <span>{b.name}</span>
                            </span>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-[4px] bg-[#F2EFE9] border border-[#E5E0D8]">
                              2027
                            </span>
                          </button>
                        ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Правая группа: строгая симметрия h-9 без эмодзи */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Переключатель: Платформа vs Презентация */}
              <div className="flex items-center h-9 bg-[#F2EFE9] p-0.5 rounded-[6px] border border-[#E5E0D8]">
                <button
                  onClick={() => setPlatformMode('management')}
                  className={`h-7 px-3 rounded-[4px] text-[12.5px] font-medium transition cursor-pointer ${
                    platformMode === 'management'
                      ? 'bg-white text-[#161615] shadow-2xs'
                      : 'text-[#6E6A63] hover:text-[#161615]'
                  }`}
                >
                  Рабочая система
                </button>
                <button
                  onClick={() => setPlatformMode('strategy')}
                  className={`h-7 px-3 rounded-[4px] text-[12.5px] font-medium transition cursor-pointer ${
                    platformMode === 'strategy'
                      ? 'bg-[#161615] text-white'
                      : 'text-[#6E6A63] hover:text-[#161615]'
                  }`}
                >
                  Презентация стратегии
                </button>
              </div>

              {/* Поиск */}
              <button
                onClick={() => setSearchModalOpen(true)}
                className="inline-flex items-center gap-2 h-9 rounded-[6px] bg-white border border-[#E5E0D8] hover:border-[#161615] px-3 text-[12.5px] font-medium text-[#161615] transition cursor-pointer"
              >
                <Search className="h-3.5 w-3.5 text-[#6E6A63]" />
                <span className="hidden sm:inline">Поиск</span>
                <span className="hidden md:inline font-mono text-[10px] text-[#8C867E] border border-[#E5E0D8] rounded-[3px] px-1">
                  ⌘K
                </span>
              </button>

              {/* Профиль */}
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="inline-flex items-center gap-2 h-9 rounded-[6px] bg-white border border-[#E5E0D8] hover:border-[#161615] pl-2 pr-3 text-[12.5px] font-medium cursor-pointer transition"
                >
                  <span className="h-5 w-5 rounded-[4px] bg-[#161615] text-white flex items-center justify-center font-mono text-[10px]">
                    {currentUser.avatarInitials}
                  </span>
                  <span className="hidden sm:inline text-[#161615]">
                    {ROLE_LABELS_RU[currentUser.role]}
                  </span>
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 rounded-2xl border border-[#E8E8E5] shadow-xl p-5 z-50 text-[14px] space-y-4">
                    <div className="border-b border-[#E8E8E5] pb-3">
                      <div className="font-semibold text-[16px] text-[#171717] dark:text-white">
                        {currentUser.fullName}
                      </div>
                      <div className="text-[#737373] mt-0.5">
                        {currentUser.jobTitle} · {ROLE_LABELS_RU[currentUser.role]}
                      </div>
                    </div>

                    {/* Режим отображения */}
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[#171717]">Режим презентации</span>
                      <button
                        onClick={() =>
                          setPlatformMode(
                            platformMode === 'strategy' ? 'management' : 'strategy'
                          )
                        }
                        className={`rounded-lg border px-3 py-1.5 text-[13px] font-semibold cursor-pointer ${
                          platformMode === 'strategy'
                            ? 'bg-[#111111] text-white border-[#111111]'
                            : 'bg-[#F7F7F5] text-[#171717] border-[#E8E8E5]'
                        }`}
                      >
                        {platformMode === 'strategy' ? 'Включён' : 'Выключен'}
                      </button>
                    </div>

                    {/* Проверка прав доступа (смена роли) */}
                    <div className="pt-3 border-t border-[#E8E8E5] space-y-1">
                      <div className="text-[12px] font-semibold uppercase tracking-wider text-[#737373] mb-2">
                        Проверка роли доступа:
                      </div>
                      {users.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            loginAs(u.id);
                            setProfileMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between cursor-pointer ${
                            u.id === currentUser.id
                              ? 'bg-[#111111] text-white font-semibold'
                              : 'text-[#171717] hover:bg-[#F7F7F5]'
                          }`}
                        >
                          <span className="truncate pr-2">{u.fullName}</span>
                          <span
                            className={`text-[13px] shrink-0 ${
                              u.id === currentUser.id ? 'text-neutral-300' : 'text-[#737373]'
                            }`}
                          >
                            {ROLE_LABELS_RU[u.role]}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-[#E8E8E5]">
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          logout();
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#E8E8E5] hover:bg-[#C94B4B] hover:border-[#C94B4B] hover:text-white text-[#171717] py-2.5 font-semibold transition cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Выйти из профиля</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* РАБОЧАЯ ОБЛАСТЬ КОНТЕНТА (чистая симметрия, без лишних верхних полос) */}
          <main className="flex-1 px-6 md:px-8 py-6 md:py-8 max-w-[1600px] w-full mx-auto space-y-6">
            {/* Режим интерактивной презентации стратегии (8 слайдов + лонгрид + весь экран) */}
            {platformMode === 'strategy' ? (
              <StrategyPresentationDeck
                onExitPresentation={() => setPlatformMode('management')}
              />
            ) : (
              <>
                {activeSection === 'dashboard' && <DashboardView />}
                {activeSection === 'brand-portfolio' && <BrandPortfolioView />}
                {activeSection === 'brand-strategy' && <BrandStrategyView />}
                {activeSection === 'market-intelligence' && <MarketIntelligenceView />}
                {activeSection === 'product-catalog' && <ProductCatalogView />}
                {activeSection === 'product-lab' && <ProductLabView />}
                {activeSection === 'marketing-growth' && <MarketingGrowthView />}
                {activeSection === 'launch-calendar' && <LaunchCalendarView />}
                {activeSection === 'finance' && <FinanceView />}
                {activeSection === 'roadmap-tasks' && <RoadmapTasksView />}
                {activeSection === 'documents' && <DocumentsView />}
                {activeSection === 'team' && <TeamView />}
                {activeSection === 'settings' && <SettingsView />}
              </>
            )}
          </main>
        </div>

        {/* МОДАЛЬНОЕ ОКНО ПОИСКА (⌘K) */}
        {searchModalOpen && (
          <div
            onClick={() => setSearchModalOpen(false)}
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-24 p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl border border-[#E8E8E5] shadow-2xl overflow-hidden"
            >
              <div className="flex items-center gap-3 border-b border-[#E8E8E5] px-6 py-4">
                <Search className="h-5 w-5 text-[#737373]" />
                <input
                  autoFocus
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  placeholder="Артикул, название модели, запуск или задача..."
                  className="flex-1 bg-transparent text-[17px] font-medium outline-none text-[#171717] dark:text-white"
                />
                <button
                  onClick={() => setSearchModalOpen(false)}
                  className="rounded-lg border border-[#E8E8E5] px-2.5 py-1 text-[12px] font-semibold text-[#737373] cursor-pointer"
                >
                  ESC
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto divide-y divide-[#E8E8E5] p-2">
                {searchResults.map((res) => (
                  <div
                    key={res.id}
                    onClick={res.onSelect}
                    className="px-4 py-3.5 rounded-xl hover:bg-[#F7F7F5] cursor-pointer flex items-center justify-between transition"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-[12px] font-semibold uppercase text-[#737373] bg-[#F7F7F5] px-2.5 py-0.5 rounded-md border border-[#E8E8E5]">
                          {res.category}
                        </span>
                        <span className="text-[16px] font-semibold text-[#171717] dark:text-white">
                          {res.title}
                        </span>
                      </div>
                      <div className="text-[14px] text-[#737373] mt-1">{res.subtitle}</div>
                    </div>
                    <span className="text-[14px] font-semibold text-[#171717]">Открыть →</span>
                  </div>
                ))}

                {globalSearchQuery && searchResults.length === 0 && (
                  <div className="py-12 text-center text-[15px] text-[#737373]">
                    Ничего не найдено по запросу «{globalSearchQuery}»
                  </div>
                )}

                {!globalSearchQuery && (
                  <div className="py-10 text-center text-[14px] text-[#737373]">
                    Введите артикул (например, BRN-MOD-01), название модели, запуск или задачу
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* УВЕДОМЛЕНИЯ ВНИЗУ ЭКРАНА */}
        <div className="fixed bottom-6 right-6 z-50 space-y-2 max-w-md w-full pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="pointer-events-auto bg-[#111111] text-white rounded-2xl border border-[#E8E8E5]/20 shadow-xl px-5 py-4 text-[14px] flex items-start justify-between gap-4"
            >
              <div>
                <div className="font-semibold text-[15px]">{t.title}</div>
                {t.description && (
                  <div className="text-neutral-300 text-[14px] mt-1">{t.description}</div>
                )}
              </div>
              <button
                onClick={() => dismissToast(t.id)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
