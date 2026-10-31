'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Bell,
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
      <div className="min-h-screen bg-[#F7F7F5] dark:bg-zinc-950 text-[#171717] dark:text-zinc-100 flex">
        {/* МОБИЛЬНЫЙ ОВЕРЛЕЙ */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          />
        )}

        {/* ЛЕВЫЙ САЙДБАР (п. 3 ТЗ: светлый минимализм #FFFFFF, тонкая граница #E8E8E5, крупный шрифт) */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-[276px] bg-white dark:bg-zinc-900 border-r border-[#E8E8E5] dark:border-zinc-800 flex flex-col justify-between transition-transform lg:static lg:translate-x-0 shrink-0 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-6 space-y-7 overflow-y-auto">
            {/* Логотип группы */}
            <div className="flex items-start justify-between border-b border-[#E8E8E5] dark:border-zinc-800 pb-5">
              <button
                onClick={() => navigateTo('dashboard')}
                className="text-left cursor-pointer block"
              >
                <span className="font-bold tracking-[-0.03em] text-[22px] text-[#171717] dark:text-white block leading-none">
                  BORNERS GROUP
                </span>
                <span className="text-[13px] text-[#737373] mt-1.5 block font-medium">
                  Стратегия и продукт · 26–27
                </span>
              </button>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="lg:hidden p-1 text-[#737373] hover:text-[#171717]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Меню разделов */}
            <nav className="space-y-6">
              {NAV_GROUPS.map((group) => {
                const allowedItems = group.items.filter((item) =>
                  canUserAccessSection(currentUser, item.id)
                );
                if (allowedItems.length === 0) return null;

                return (
                  <div key={group.groupTitle} className="space-y-1">
                    <div className="px-3.5 pb-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#737373]">
                      {group.groupTitle}
                    </div>
                    {allowedItems.map((item) => {
                      const isActive = activeSection === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            navigateTo(item.id);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-[15px] transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-[#111111] text-white font-semibold'
                              : 'text-[#171717] dark:text-zinc-300 hover:bg-[#F7F7F5] dark:hover:bg-zinc-800 font-medium'
                          }`}
                        >
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Быстрый фильтр по брендам внизу сайдбара (акценты по ТЗ: #D97745 и #8B8078 + Акуша и Liskani в проработке) */}
          <div className="p-6 border-t border-[#E8E8E5] dark:border-zinc-800 space-y-3">
            <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#737373]">
              Бренды группы
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setBrandFilter(brandFilter === 'BORNERS' ? 'ALL' : 'BORNERS')}
                className={`py-2.5 px-3 rounded-xl text-[14px] font-semibold border flex items-center justify-center gap-2 cursor-pointer transition ${
                  brandFilter === 'BORNERS'
                    ? 'bg-[#D97745] text-white border-[#D97745]'
                    : 'bg-[#F7F7F5] border-[#E8E8E5] text-[#171717] hover:border-[#D97745]'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    brandFilter === 'BORNERS' ? 'bg-white' : 'bg-[#D97745]'
                  }`}
                />
                <span>BORNERS</span>
              </button>
              <button
                onClick={() => setBrandFilter(brandFilter === 'NA_TELE' ? 'ALL' : 'NA_TELE')}
                className={`py-2.5 px-3 rounded-xl text-[14px] font-semibold border flex items-center justify-center gap-2 cursor-pointer transition ${
                  brandFilter === 'NA_TELE'
                    ? 'bg-[#8B8078] text-white border-[#8B8078]'
                    : 'bg-[#F7F7F5] border-[#E8E8E5] text-[#171717] hover:border-[#8B8078]'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    brandFilter === 'NA_TELE' ? 'bg-white' : 'bg-[#8B8078]'
                  }`}
                />
                <span>НА ТЕЛЕ</span>
              </button>
            </div>

            {/* Неактивные бренды в проработке стратегии: Акуша и Liskani */}
            <div className="pt-2 border-t border-dashed border-[#E8E8E5] space-y-1.5">
              <div className="text-[11px] font-medium text-[#737373]">
                Ведётся проработка стратегии:
              </div>
              <div className="grid grid-cols-2 gap-2">
                {brands
                  .filter((b) => b.isStrategyInDevelopment)
                  .map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      title="Неактивен · Ведётся проработка стратегии"
                      onClick={() =>
                        notify(
                          'warning',
                          `Бренд «${b.name}» в разработке`,
                          'Сейчас ведётся проработка стратегии и концепции бренда'
                        )
                      }
                      className="py-2 px-2.5 rounded-xl text-[13px] font-medium border border-dashed border-[#E8E8E5] bg-[#F7F7F5]/60 text-[#737373] flex items-center justify-center gap-1.5 cursor-not-allowed opacity-75"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[#A3A39E]" />
                      <span>{b.name}</span>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </aside>

        {/* ОСНОВНАЯ РАБОЧАЯ ОБЛАСТЬ */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* ВЕРХНЯЯ ПАНЕЛЬ (п. 3, 14 ТЗ: бренды, режим Strategy/Management, период, поиск, + Создать, уведомления, профиль) */}
          <header className="sticky top-0 z-30 h-20 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xs border-b border-[#E8E8E5] dark:border-zinc-800 px-6 md:px-10 flex items-center justify-between gap-4">
            {/* Левая часть: Назад + Переключатель брендов */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden rounded-xl border border-[#E8E8E5] p-2.5"
              >
                <Menu className="h-5 w-5" />
              </button>

              {navHistory.length > 1 && (
                <button
                  onClick={goBack}
                  title="Назад"
                  className="inline-flex items-center gap-2 h-11 px-3.5 rounded-xl bg-[#F7F7F5] dark:bg-zinc-800 border border-[#E8E8E5] text-[14px] font-medium text-[#171717] hover:bg-[#111111] hover:text-white transition cursor-pointer shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Назад</span>
                </button>
              )}

              {/* Переключатель брендов: Все бренды | BORNERS | НА ТЕЛЕ + неактивные Акуша | Liskani */}
              <div className="hidden md:flex items-center bg-[#F7F7F5] dark:bg-zinc-800 p-1 rounded-xl border border-[#E8E8E5] dark:border-zinc-700 overflow-x-auto">
                <button
                  onClick={() => setBrandFilter('ALL')}
                  className={`px-3.5 py-2 rounded-lg text-[14px] transition cursor-pointer shrink-0 ${
                    brandFilter === 'ALL'
                      ? 'bg-white dark:bg-zinc-900 text-[#171717] dark:text-white font-semibold shadow-2xs'
                      : 'text-[#737373] hover:text-[#171717] font-medium'
                  }`}
                >
                  Все бренды
                </button>
                {brands.map((b) => {
                  if (b.isStrategyInDevelopment) {
                    return (
                      <button
                        key={b.id}
                        type="button"
                        title="Ведётся проработка стратегии"
                        onClick={() =>
                          notify(
                            'warning',
                            `Бренд «${b.name}» пока неактивен`,
                            'Ведётся проработка стратегии и позиционирования'
                          )
                        }
                        className="px-3 py-2 rounded-lg text-[14px] text-[#737373]/70 font-medium inline-flex items-center gap-1.5 cursor-not-allowed shrink-0 select-none"
                      >
                        <span className="h-2 w-2 rounded-full bg-[#A3A39E]/60 shrink-0" />
                        <span>{b.name}</span>
                        <span className="hidden 2xl:inline text-[11px] px-1.5 py-0.5 rounded bg-white/80 border border-[#E8E8E5] text-[#737373]">
                          в проработке
                        </span>
                      </button>
                    );
                  }

                  const active = brandFilter === b.id || brandFilter === b.code;
                  const dotColor =
                    b.code === 'BORNERS'
                      ? '#D97745'
                      : b.code === 'NA_TELE'
                      ? '#8B8078'
                      : b.accentColor;
                  return (
                    <button
                      key={b.id}
                      onClick={() => setBrandFilter(b.code)}
                      className={`px-3.5 py-2 rounded-lg text-[14px] transition cursor-pointer inline-flex items-center gap-2 shrink-0 ${
                        active
                          ? 'bg-white dark:bg-zinc-900 text-[#171717] dark:text-white font-semibold shadow-2xs'
                          : 'text-[#737373] hover:text-[#171717] font-medium'
                      }`}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: dotColor }}
                      />
                      <span>{b.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Правая группа действий */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Переключатель Strategy Mode / Management Mode (п. 14 ТЗ) */}
              <div
                title="Переключение между операционным режимом управления и чистым режимом презентации стратегии (п. 14 ТЗ)"
                className="hidden lg:flex items-center bg-[#F7F7F5] dark:bg-zinc-800 p-1 rounded-xl border border-[#E8E8E5]"
              >
                <button
                  onClick={() => setPlatformMode('management')}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold transition cursor-pointer ${
                    platformMode === 'management'
                      ? 'bg-white text-[#171717] shadow-2xs'
                      : 'text-[#737373] hover:text-[#171717]'
                  }`}
                >
                  Управление
                </button>
                <button
                  onClick={() => setPlatformMode('strategy')}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold transition cursor-pointer ${
                    platformMode === 'strategy'
                      ? 'bg-[#111111] text-white shadow-2xs'
                      : 'text-[#737373] hover:text-[#171717]'
                  }`}
                >
                  Презентация
                </button>
              </div>

              {/* Поиск */}
              <button
                onClick={() => setSearchModalOpen(true)}
                className="inline-flex items-center gap-2.5 h-11 rounded-xl bg-[#F7F7F5] dark:bg-zinc-800 border border-[#E8E8E5] hover:border-[#737373] px-3.5 text-[14px] font-medium text-[#737373] hover:text-[#171717] transition cursor-pointer"
              >
                <Search className="h-4 w-4 text-[#171717]" />
                <span className="hidden sm:inline">Поиск</span>
                <kbd className="hidden sm:inline-block text-[11px] text-[#737373] bg-white px-1.5 py-0.5 rounded-md border border-[#E8E8E5]">
                  ⌘K
                </kbd>
              </button>

              {/* Выбор периода */}
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
                className="hidden xl:block h-11 rounded-xl bg-[#F7F7F5] dark:bg-zinc-800 border border-[#E8E8E5] px-3.5 text-[14px] font-medium text-[#171717] dark:text-zinc-200 cursor-pointer outline-none"
              >
                <option value="2027">Период: 2027</option>
                <option value="Q1 2027">Q1 2027</option>
                <option value="Q2 2027">Q2 2027</option>
                <option value="2026">2026</option>
                <option value="ALL">2026 — 2027</option>
              </select>

              {/* Кнопка + Создать (скрыта в режиме презентации по п. 14 ТЗ) */}
              {platformMode === 'management' && (
                <div className="relative">
                  <button
                    onClick={() => setQuickCreateOpen(!quickCreateOpen)}
                    className="inline-flex items-center gap-2 h-11 rounded-xl bg-[#111111] dark:bg-white text-white dark:text-zinc-900 px-4 text-[14px] font-semibold hover:bg-neutral-800 transition cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Создать</span>
                  </button>

                  {quickCreateOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 rounded-2xl border border-[#E8E8E5] shadow-xl p-2 z-50 text-[15px]">
                      <button
                        onClick={() => {
                          setQuickCreateOpen(false);
                          navigateTo('product-lab');
                        }}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-[#F7F7F5] dark:hover:bg-zinc-800 font-medium cursor-pointer"
                      >
                        + Разработку в R&D
                      </button>
                      <button
                        onClick={() => {
                          setQuickCreateOpen(false);
                          navigateTo('product-catalog');
                        }}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-[#F7F7F5] dark:hover:bg-zinc-800 font-medium cursor-pointer"
                      >
                        + Модель в каталоге
                      </button>
                      <button
                        onClick={() => {
                          setQuickCreateOpen(false);
                          navigateTo('launch-calendar');
                        }}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-[#F7F7F5] dark:hover:bg-zinc-800 font-medium cursor-pointer"
                      >
                        + Запуск коллекции
                      </button>
                      <button
                        onClick={() => {
                          setQuickCreateOpen(false);
                          navigateTo('roadmap-tasks');
                        }}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-[#F7F7F5] dark:hover:bg-zinc-800 font-medium cursor-pointer"
                      >
                        + Задачу команде
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Уведомления */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative h-11 w-11 rounded-xl bg-[#F7F7F5] dark:bg-zinc-800 border border-[#E8E8E5] flex items-center justify-center text-[#171717] cursor-pointer"
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-[#C94B4B]" />
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-zinc-900 rounded-2xl border border-[#E8E8E5] shadow-xl p-5 z-50 text-[14px] space-y-4">
                    <div className="font-semibold text-[16px] flex justify-between items-center pb-3 border-b border-[#E8E8E5]">
                      <span>Уведомления</span>
                      <button
                        onClick={() => setNotificationsOpen(false)}
                        className="text-[13px] text-[#737373] hover:text-[#171717] cursor-pointer"
                      >
                        Закрыть
                      </button>
                    </div>
                    <div
                      onClick={() => {
                        setNotificationsOpen(false);
                        navigateTo('roadmap-tasks');
                      }}
                      className="rounded-xl bg-[#F7F7F5] p-3.5 cursor-pointer hover:border-[#C94B4B] border border-transparent transition"
                    >
                      <div className="font-semibold text-[#C94B4B]">Просрочен дедлайн задачи</div>
                      <div className="text-[#171717] mt-1">
                        Согласовать цветопробу Pantone Тон 03 (НА ТЕЛЕ)
                      </div>
                    </div>
                    <div
                      onClick={() => {
                        setNotificationsOpen(false);
                        navigateTo('launch-calendar', { launchId: 'launch-big-love' });
                      }}
                      className="rounded-xl bg-[#F7F7F5] p-3.5 cursor-pointer hover:border-[#D97745] border border-transparent transition"
                    >
                      <div className="font-semibold text-[#171717] dark:text-white">
                        Запуск BIG LOVE · 14.02.2027
                      </div>
                      <div className="text-[#737373] mt-1">
                        Партия 12 000 шт. · готовность 70%
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Профиль и переключение ролей */}
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="inline-flex items-center gap-2.5 h-11 rounded-xl bg-[#F7F7F5] dark:bg-zinc-800 border border-[#E8E8E5] px-3.5 text-[15px] font-medium cursor-pointer transition"
                >
                  <span className="h-7 w-7 rounded-lg bg-[#111111] text-white flex items-center justify-center text-[13px] font-semibold">
                    {currentUser.avatarInitials}
                  </span>
                  <span className="hidden sm:inline text-[#171717] dark:text-zinc-200">
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

          {/* РАБОЧАЯ ОБЛАСТЬ КОНТЕНТА (много воздуха по п. 2.4 ТЗ) */}
          <main className="flex-1 px-6 md:px-10 py-8 md:py-10 max-w-[1600px] w-full mx-auto space-y-6">
            {/* Навигационная цепочка Breadcrumbs (п. 20 ТЗ) + маркировка DEMO (п. 23 ТЗ) */}
            {(() => {
              const currentGroup = NAV_GROUPS.find((g) =>
                g.items.some((i) => i.id === activeSection)
              );
              const currentItem = currentGroup?.items.find((i) => i.id === activeSection);
              const activeBrandLabel =
                brandFilter === 'ALL'
                  ? 'Все бренды'
                  : brands.find((b) => b.code === brandFilter || b.id === brandFilter)?.name ||
                    brandFilter;
              const selectedEntityName =
                (activeSection === 'product-catalog' &&
                  selectedProductId &&
                  products.find((p) => p.id === selectedProductId)?.sku) ||
                (activeSection === 'product-lab' &&
                  selectedConceptId &&
                  concepts.find((c) => c.id === selectedConceptId)?.code) ||
                (activeSection === 'launch-calendar' &&
                  selectedLaunchId &&
                  launches.find((l) => l.id === selectedLaunchId)?.name) ||
                null;

              return (
                <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-[#737373]">
                  <nav aria-label="Breadcrumbs" className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => navigateTo('dashboard')}
                      className="hover:text-[#171717] font-medium cursor-pointer"
                    >
                      BORNERS GROUP
                    </button>
                    <span>/</span>
                    <span>{currentGroup?.groupTitle || 'Платформа'}</span>
                    <span>/</span>
                    <span className="font-semibold text-[#171717] dark:text-white">
                      {currentItem?.label || 'Дашборд'}
                    </span>
                    <span>/</span>
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-900 border border-[#E8E8E5] font-medium text-[#171717] dark:text-zinc-200">
                      {activeBrandLabel}
                    </span>
                    {selectedEntityName && (
                      <>
                        <span>/</span>
                        <span className="font-semibold text-[#D97745]">{selectedEntityName}</span>
                      </>
                    )}
                  </nav>

                  <div className="flex items-center gap-2">
                    <span
                      title="Демонстрационные показатели маркированы DEMO согласно п. 23 ТЗ"
                      className="px-2.5 py-0.5 rounded-md bg-white dark:bg-zinc-900 border border-[#E8E8E5] text-[11px] font-semibold uppercase tracking-wider text-[#737373]"
                    >
                      DEMO · Данные 2026–2027
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Плашка презентационного режима Strategy Mode (п. 14 ТЗ) */}
            {platformMode === 'strategy' && (
              <div className="bg-[#111111] text-white rounded-2xl px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-[14px]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#D97745]" />
                  <span>
                    <b>Режим презентации (Strategy Mode):</b> служебные кнопки редактирования,
                    черновые формы и комментарии скрыты для защиты демонстрации.
                  </span>
                </div>
                <button
                  onClick={() => setPlatformMode('management')}
                  className="px-3.5 py-1.5 rounded-lg bg-white text-[#171717] text-[13px] font-semibold hover:bg-neutral-200 transition cursor-pointer"
                >
                  Вернуться в режим управления
                </button>
              </div>
            )}

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
