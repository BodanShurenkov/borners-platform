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
}[] = [
  {
    id: 'dashboard',
    step: '01',
    label: 'Дашборд и Сводка',
  },
  {
    id: 'product-lab',
    step: '02',
    label: 'Лаборатория R&D',
  },
  {
    id: 'brand-strategy',
    step: '03',
    label: 'Стратегия брендов',
  },
  {
    id: 'product-catalog',
    step: '04',
    label: 'Каталог моделей',
  },
  {
    id: 'launch-calendar',
    step: '05',
    label: 'Календарь запусков',
  },
  {
    id: 'finance',
    step: '06',
    label: 'Финансы 2027',
  },
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
      <div className="min-h-screen bg-[#FAF8F5] dark:bg-zinc-950 text-[#171717] dark:text-zinc-100 flex border-l-[6px] border-l-[#D97745]">
        {/* МОБИЛЬНЫЙ ОВЕРЛЕЙ */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          />
        )}

        {/* ЛЕВЫЙ САЙДБАР: строгая симметрия, чистая навигация в 1 строку без обрезаний */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-[260px] bg-white dark:bg-zinc-900 border-r border-[#EAE6DF] dark:border-zinc-800 flex flex-col justify-between transition-transform lg:static lg:translate-x-0 shrink-0 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-6 space-y-6 overflow-y-auto">
            {/* Логотип группы (с фирменной терракотовой линией из PDF) */}
            <div className="space-y-3 pb-4 border-b border-[#EAE6DF] dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setPlatformMode('management');
                    navigateTo('dashboard');
                  }}
                  className="text-left cursor-pointer block"
                >
                  <span className="font-extrabold tracking-[-0.03em] text-[19px] text-[#171717] dark:text-white block leading-none">
                    BORNERS GROUP
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6E6A64] mt-1.5 block">
                    STRATEGY 2027 / PRODUCT LAB
                  </span>
                </button>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="lg:hidden p-1 text-[#737373] hover:text-[#171717]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="h-1 w-16 rounded-full bg-[#D97745]" />
            </div>

            {/* Меню разделов: идеальная симметрия, одинаковая высота кнопок h-11 */}
            <nav className="space-y-1.5">
              <div className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#6E6A64]">
                Навигация платформы
              </div>

              {SIMPLE_NAV_ITEMS.filter((item) =>
                canUserAccessSection(currentUser, item.id)
              ).map((item) => {
                const isActive = platformMode === 'management' && activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setPlatformMode('management');
                      navigateTo(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full h-11 rounded-2xl px-3.5 flex items-center gap-3 text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#141413] text-white font-semibold shadow-xs'
                        : 'text-[#171717] hover:bg-[#F4F1EC] font-medium'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-lg text-[11px] font-bold flex items-center justify-center shrink-0 ${
                        isActive
                          ? 'bg-[#D97745] text-white'
                          : 'bg-[#FBF1EA] text-[#D97745]'
                      }`}
                    >
                      {item.step}
                    </span>
                    <span className="text-[14px] whitespace-nowrap">{item.label}</span>
                  </button>
                );
              })}

              {/* Дополнительные разделы (раскрываются аккуратно) */}
              {!simpleMode && (
                <div className="pt-4 mt-4 border-t border-[#EAE6DF] space-y-1">
                  <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#6E6A64]">
                    Дополнительные разделы
                  </div>
                  {[
                    { id: 'brand-portfolio' as NavSectionId, label: 'Портфель брендов' },
                    { id: 'market-intelligence' as NavSectionId, label: 'Рынок и конкуренты' },
                    { id: 'marketing-growth' as NavSectionId, label: 'Маркетинг и рост' },
                    { id: 'roadmap-tasks' as NavSectionId, label: 'Задачи и проекты' },
                    { id: 'documents' as NavSectionId, label: 'Документы и файлы' },
                    { id: 'team' as NavSectionId, label: 'Команда и роли' },
                    { id: 'settings' as NavSectionId, label: 'Настройки' },
                  ]
                    .filter((item) => canUserAccessSection(currentUser, item.id))
                    .map((item) => {
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
                          className={`w-full h-10 rounded-xl px-3.5 flex items-center text-left text-[14px] transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-[#141413] text-white font-semibold'
                              : 'text-[#6E6A64] hover:text-[#171717] hover:bg-[#F4F1EC] font-medium'
                          }`}
                        >
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                </div>
              )}
            </nav>
          </div>

          {/* Нижняя кнопка сайдбара: переключение 6 основных / все 13 разделов */}
          <div className="p-5 border-t border-[#EAE6DF] dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setSimpleMode(!simpleMode)}
              className="w-full h-10 px-3.5 rounded-full bg-[#F4F1EC] hover:bg-[#141413] hover:text-white text-[12px] font-bold text-[#171717] transition cursor-pointer flex items-center justify-center"
            >
              {simpleMode ? '+ Показать все разделы (13)' : '← Оставить 6 главных разделов'}
            </button>
          </div>
        </aside>

        {/* ОСНОВНАЯ РАБОЧАЯ ОБЛАСТЬ */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* ВЕРХНЯЯ ПАНЕЛЬ: идеальная симметрия, мягкие капсулы rounded-full */}
          <header className="sticky top-0 z-30 h-16 bg-[#FAF8F5]/95 dark:bg-zinc-900/95 backdrop-blur-xs border-b border-[#EAE6DF] dark:border-zinc-800 px-6 md:px-10 flex items-center justify-between gap-4">
            {/* Левая группа: Назад + Выпадающий список брендов */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden h-10 w-10 rounded-full bg-white border border-[#EAE6DF] flex items-center justify-center"
              >
                <Menu className="h-4 w-4" />
              </button>

              {navHistory.length > 1 && (
                <button
                  onClick={goBack}
                  title="Назад"
                  className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-white border border-[#EAE6DF] text-[13px] font-bold text-[#171717] hover:bg-[#141413] hover:text-white transition cursor-pointer shrink-0"
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
                  className="h-10 px-4 rounded-full bg-white hover:border-[#171717] border border-[#EAE6DF] text-[13px] font-semibold text-[#171717] inline-flex items-center gap-3 cursor-pointer transition min-w-[185px] justify-between shadow-2xs"
                >
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          brandFilter === 'BORNERS'
                            ? '#D97745'
                            : brandFilter === 'NA_TELE'
                            ? '#8B8078'
                            : '#141413',
                      }}
                    />
                    <span>
                      Бренд:{' '}
                      <b>
                        {brandFilter === 'ALL'
                          ? 'Все бренды'
                          : brandFilter === 'NA_TELE'
                          ? 'НА ТЕЛЕ'
                          : 'BORNERS'}
                      </b>
                    </span>
                  </span>
                  <ChevronDown className="h-4 w-4 text-[#6E6A64]" />
                </button>

                {brandDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setBrandDropdownOpen(false)}
                    />
                    <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-white border border-[#EAE6DF] shadow-xl p-2 z-50 text-[13px] space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setBrandFilter('ALL');
                          setBrandDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center justify-between cursor-pointer ${
                          brandFilter === 'ALL'
                            ? 'bg-[#141413] text-white font-bold'
                            : 'text-[#171717] hover:bg-[#F4F1EC] font-medium'
                        }`}
                      >
                        <span className="inline-flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-current" />
                          <span>Все бренды группы</span>
                        </span>
                      </button>

                      {brands
                        .filter((b) => !b.isStrategyInDevelopment)
                        .map((b) => {
                          const isSelected = brandFilter === b.code || brandFilter === b.id;
                          const dotColor = b.code === 'BORNERS' ? '#D97745' : '#8B8078';
                          return (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => {
                                setBrandFilter(b.code);
                                setBrandDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? 'bg-[#141413] text-white font-bold'
                                  : 'text-[#171717] hover:bg-[#F4F1EC] font-medium'
                              }`}
                            >
                              <span className="inline-flex items-center gap-2">
                                <span
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: dotColor }}
                                />
                                <span>{b.name}</span>
                              </span>
                              <span
                                className={`text-[11px] ${
                                  isSelected ? 'text-neutral-300' : 'text-[#6E6A64]'
                                }`}
                              >
                                Активен
                              </span>
                            </button>
                          );
                        })}

                      <div className="pt-2 mt-1 border-t border-[#EAE6DF] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#6E6A64]">
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
                            className="w-full px-3 py-2 rounded-xl text-left flex items-center justify-between text-[#6E6A64] hover:bg-[#F4F1EC] cursor-not-allowed"
                          >
                            <span className="inline-flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-[#A3A39E]" />
                              <span>{b.name}</span>
                            </span>
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#F4F1EC] border border-[#EAE6DF]">
                              в разработке
                            </span>
                          </button>
                        ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Правая группа: идеальная симметрия капсул h-10 */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Переключатель: Работа vs Презентация */}
              <div className="flex items-center h-10 bg-white p-1 rounded-full border border-[#EAE6DF] shadow-2xs">
                <button
                  onClick={() => setPlatformMode('management')}
                  className={`h-8 px-4 rounded-full text-[13px] font-bold transition cursor-pointer ${
                    platformMode === 'management'
                      ? 'bg-[#141413] text-white'
                      : 'text-[#6E6A64] hover:text-[#171717]'
                  }`}
                >
                  Платформа
                </button>
                <button
                  onClick={() => setPlatformMode('strategy')}
                  className={`h-8 px-4 rounded-full text-[13px] font-bold transition cursor-pointer ${
                    platformMode === 'strategy'
                      ? 'bg-[#D97745] text-white'
                      : 'text-[#171717] hover:text-[#D97745]'
                  }`}
                >
                  🎬 Презентация
                </button>
              </div>

              {/* Поиск */}
              <button
                onClick={() => setSearchModalOpen(true)}
                className="inline-flex items-center gap-2 h-10 rounded-full bg-white border border-[#EAE6DF] hover:border-[#171717] px-4 text-[13px] font-semibold text-[#171717] transition cursor-pointer shadow-2xs"
              >
                <Search className="h-4 w-4 text-[#6E6A64]" />
                <span className="hidden sm:inline">Поиск</span>
              </button>

              {/* Профиль */}
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="inline-flex items-center gap-2 h-10 rounded-full bg-white border border-[#EAE6DF] pl-2 pr-3.5 text-[13px] font-semibold cursor-pointer transition shadow-2xs"
                >
                  <span className="h-6 w-6 rounded-full bg-[#141413] text-white flex items-center justify-center text-[11px] font-bold">
                    {currentUser.avatarInitials}
                  </span>
                  <span className="hidden sm:inline text-[#171717]">
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
