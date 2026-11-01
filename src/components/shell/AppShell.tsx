'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  Box,
  ChevronDown,
  Coins,
  Eye,
  EyeOff,
  Factory,
  FileText,
  HelpCircle,
  Home,
  LogOut,
  Megaphone,
  Menu,
  Plus,
  RotateCcw,
  Search,
  Settings,
  ShoppingCart,
  Sparkles,
  Trash2,
  TrendingUp,
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
    id: 'product-catalog',
    step: '03',
    label: 'Каталог моделей',
    subtitle: 'Матрица 70/30 и юнит-маржа',
  },
  {
    id: 'roadmap-tasks',
    step: '04',
    label: 'CRM · Задачи и проекты',
    subtitle: 'Канбан-доска, дедлайны и поручения',
  },
  {
    id: 'launch-calendar',
    step: '05',
    label: 'Календарь запусков',
    subtitle: 'Релизы коллекций и чек-листы',
  },
  {
    id: 'brand-strategy',
    step: '06',
    label: 'Стратегия брендов',
    subtitle: 'Паспорта 14 блоков ДНК',
  },
  {
    id: 'finance',
    step: '07',
    label: 'Финансы 2027',
    subtitle: '3 сценария P&L и План/Факт',
  },
];

const OPERATIONAL_NAV_ITEMS: {
  id: NavSectionId;
  step: string;
  label: string;
}[] = [
  { id: 'brand-portfolio', step: '08', label: 'Портфель брендов' },
  { id: 'marketing-growth', step: '09', label: 'Маркетинг и рост' },
  { id: 'market-intelligence', step: '10', label: 'Рынок и конкуренты' },
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
    restoreEntity,
    permanentlyDeleteEntity,
    emptyTrash,
    notify,
    toasts,
    dismissToast,
  } = usePlatform();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarBlurred, setSidebarBlurred] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
  const [trashModalOpen, setTrashModalOpen] = useState(false);
  const [tourModalOpen, setTourModalOpen] = useState(false);
  const [tourStepIdx, setTourStepIdx] = useState(0);

  const trashItems = useMemo(() => {
    const items: {
      id: string;
      entityType: 'product' | 'concept' | 'launch' | 'task' | 'document';
      typeLabel: string;
      title: string;
      subtitle: string;
    }[] = [];

    concepts
      .filter((c) => c.isArchived)
      .forEach((c) => {
        items.push({
          id: c.id,
          entityType: 'concept',
          typeLabel: 'Карточка R&D',
          title: `${c.code} — ${c.name}`,
          subtitle: `Бренд: ${c.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : 'BORNERS'} · Этап: ${CONCEPT_STAGE_LABELS_RU[c.stage]}`,
        });
      });

    products
      .filter((p) => p.isArchived)
      .forEach((p) => {
        items.push({
          id: p.id,
          entityType: 'product',
          typeLabel: 'Модель SKU',
          title: `${p.sku} — ${p.name}`,
          subtitle: `Бренд: ${p.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : 'BORNERS'} · ${p.collection}`,
        });
      });

    launches
      .filter((l) => l.isArchived)
      .forEach((l) => {
        items.push({
          id: l.id,
          entityType: 'launch',
          typeLabel: 'Релиз в календаре',
          title: l.name,
          subtitle: `Старт: ${l.startDate} · Готовность ${l.readinessPct}%`,
        });
      });

    tasks
      .filter((t) => t.isArchived)
      .forEach((t) => {
        items.push({
          id: t.id,
          entityType: 'task',
          typeLabel: 'Задача CRM',
          title: t.title,
          subtitle: `Срок: ${t.deadline} · ${TASK_STATUS_LABELS_RU[t.status]}`,
        });
      });

    documents
      .filter((d) => d.isArchived)
      .forEach((d) => {
        items.push({
          id: d.id,
          entityType: 'document',
          typeLabel: 'Документ / ТЗ',
          title: d.title,
          subtitle: `${d.fileName} · ${d.category}`,
        });
      });

    return items;
  }, [concepts, products, launches, tasks, documents]);

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

    // 0. Навигация по разделам платформы (CRM, Задачи, R&D, Каталог, Финансы, Документы и т.д.)
    const allSections: { id: NavSectionId; title: string; subtitle: string; keywords: string }[] = [
      {
        id: 'roadmap-tasks',
        title: 'CRM · Задачи и проекты',
        subtitle: 'Канбан-доска поручений, дедлайны и дорожная карта',
        keywords: 'crm задачи проекты канбан поручения дедлайн',
      },
      {
        id: 'product-lab',
        title: 'Лаборатория R&D (Product Lab)',
        subtitle: '7 этапов отбора от идеи до заказа фабрике',
        keywords: 'лаборатория r&d разработка концепты образцы',
      },
      {
        id: 'product-catalog',
        title: 'Каталог моделей и SKU',
        subtitle: 'Ассортиментная матрица 70/30 и юнит-экономика',
        keywords: 'каталог модели sku матрица ассортимент',
      },
      {
        id: 'launch-calendar',
        title: 'Календарь запусков',
        subtitle: 'График релизов коллекций и чек-листы готовности',
        keywords: 'календарь запуски релизы дропы',
      },
      {
        id: 'finance',
        title: 'Финансовая модель 2027 (P&L)',
        subtitle: '3 сценария, выручка, маржа и План / Факт',
        keywords: 'финансы финмодель p&l бюджет выручка прибыль',
      },
      {
        id: 'documents',
        title: 'Документы и ТЗ (PDF / Excel)',
        subtitle: 'Производственные спецификации, лекала и отчёты',
        keywords: 'документы тз спецификации лекала файлы pdf excel',
      },
      {
        id: 'brand-strategy',
        title: 'Стратегия брендов (14 блоков)',
        subtitle: 'ДНК брендов BORNERS и НА ТЕЛЕ',
        keywords: 'стратегия днк бренд позиционирование',
      },
      {
        id: 'market-intelligence',
        title: 'Рынок и конкуренты',
        subtitle: 'Досье конкурентов, цены и рыночные ниши',
        keywords: 'рынок конкуренты аналитика исследования',
      },
    ];

    for (const sec of allSections) {
      if (
        sec.title.toLowerCase().includes(q) ||
        sec.keywords.includes(q)
      ) {
        results.push({
          id: `sec-${sec.id}`,
          category: 'Раздел',
          title: sec.title,
          subtitle: sec.subtitle,
          onSelect: () => {
            setPlatformMode('management');
            navigateTo(sec.id);
            setGlobalSearchQuery('');
            setSearchModalOpen(false);
          },
        });
      }
    }

    for (const p of products) {
      if (p.isArchived) continue;
      const brandRu = p.brandId === 'NA_TELE' ? 'на теле' : 'borners';
      if (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        brandRu.includes(q)
      ) {
        results.push({
          id: `p-${p.id}`,
          category: 'Модель',
          title: `${p.sku} — ${p.name}`,
          subtitle: `${p.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : p.brandId} · ${p.collection}`,
          onSelect: () => {
            setPlatformMode('management');
            navigateTo('product-catalog', { productId: p.id, brandId: 'ALL' });
            setGlobalSearchQuery('');
            setSearchModalOpen(false);
            notify('success', `Открыта модель ${p.sku}`, p.name);
          },
        });
      }
    }

    for (const c of concepts) {
      if (c.isArchived) continue;
      const brandRu = c.brandId === 'NA_TELE' ? 'на теле' : 'borners';
      if (
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        brandRu.includes(q)
      ) {
        results.push({
          id: `c-${c.id}`,
          category: 'R&D',
          title: `${c.code} — ${c.name}`,
          subtitle: `${CONCEPT_STAGE_LABELS_RU[c.stage]} · Запуск: ${c.targetLaunchDate}`,
          onSelect: () => {
            setPlatformMode('management');
            navigateTo('product-lab', { conceptId: c.id, brandId: 'ALL' });
            setGlobalSearchQuery('');
            setSearchModalOpen(false);
            notify('success', `Открыта разработка ${c.code}`, c.name);
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
            setPlatformMode('management');
            navigateTo('launch-calendar', { launchId: l.id, brandId: 'ALL' });
            setGlobalSearchQuery('');
            setSearchModalOpen(false);
            notify('success', 'Открыт релиз в календаре', l.name);
          },
        });
      }
    }

    for (const pr of projects) {
      if (pr.name.toLowerCase().includes(q)) {
        results.push({
          id: `pr-${pr.id}`,
          category: 'Проект CRM',
          title: pr.name,
          subtitle: `${pr.brandId} · ${pr.quarter}`,
          onSelect: () => {
            setPlatformMode('management');
            navigateTo('roadmap-tasks', { brandId: 'ALL' });
            setGlobalSearchQuery('');
            setSearchModalOpen(false);
          },
        });
      }
    }

    for (const t of tasks) {
      if (t.isArchived) continue;
      if (t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) {
        results.push({
          id: `t-${t.id}`,
          category: 'Задача CRM',
          title: t.title,
          subtitle: `${TASK_STATUS_LABELS_RU[t.status]} · до ${t.deadline}`,
          onSelect: () => {
            setPlatformMode('management');
            navigateTo('roadmap-tasks', { brandId: 'ALL' });
            setGlobalSearchQuery('');
            setSearchModalOpen(false);
            notify('success', 'Открыта доска CRM · Задачи', t.title);
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
            setPlatformMode('management');
            navigateTo('documents', { brandId: 'ALL' });
            setGlobalSearchQuery('');
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
            setPlatformMode('management');
            navigateTo('market-intelligence', { brandId: 'ALL' });
            setGlobalSearchQuery('');
            setSearchModalOpen(false);
          },
        });
      }
    }

    return results.slice(0, 14);
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
    setPlatformMode,
    notify,
  ]);

  if (!isAuthenticated) {
    return (
      <div>
        <div className="min-h-screen bg-[#F7F7F5] text-[#171717] flex items-center justify-center p-8">
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
    <div>
      <div className="min-h-screen bg-[#F8F6F2] text-[#161615] flex overflow-x-hidden">
        {/* МОБИЛЬНЫЙ ОВЕРЛЕЙ */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          />
        )}

        {/* ЛЕВЫЙ САЙДБАР В ПРЕМИАЛЬНОМ СТИЛЕ APPLE PRO (BORNERS® STRATEGY PLATFORM) */}
        <aside
          aria-hidden={sidebarBlurred}
          className={`fixed inset-y-0 left-0 z-40 w-[240px] bg-[#161822] text-white border-r border-white/[0.08] flex flex-col justify-between transition-all duration-300 ease-in-out lg:static shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.08)] ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } ${
            sidebarBlurred
              ? 'lg:-ml-[240px] lg:-translate-x-full lg:opacity-0 lg:blur-[8px] lg:pointer-events-none'
              : 'lg:ml-0 lg:translate-x-0 lg:opacity-100 lg:blur-none'
          }`}
        >
          <div className="overflow-y-auto flex-1">
            {/* Фирменный заголовок BORNERS® STRATEGY PLATFORM */}
            <div className="px-6 pt-7 pb-5 flex items-start justify-between gap-2">
              <button
                onClick={() => {
                  setPlatformMode('management');
                  navigateTo('dashboard');
                }}
                className={`text-left cursor-pointer flex flex-col justify-center group transition-all duration-300 ${
                  sidebarBlurred ? 'blur-[5px] opacity-35 select-none pointer-events-none' : ''
                }`}
              >
                <span className="text-[21px] font-bold tracking-[0.04em] text-white leading-none">
                  BORNERS<sup className="text-[11px] font-semibold ml-0.5 opacity-80">®</sup>
                </span>
                <span className="text-[10.5px] font-medium tracking-[0.14em] text-[#8F96A6] mt-2 uppercase">
                  STRATEGY PLATFORM
                </span>
              </button>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setSidebarBlurred((prev) => !prev)}
                  title={
                    sidebarBlurred
                      ? 'Показать левую панель'
                      : 'Скрыть левую панель для фокуса на центральной части'
                  }
                  aria-label="Переключить левую панель"
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-[#8F96A6] hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  {sidebarBlurred ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>

                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="lg:hidden p-1 text-[#8F96A6] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <nav
              onClickCapture={(e) => {
                if (sidebarBlurred) {
                  e.stopPropagation();
                  e.preventDefault();
                  setSidebarBlurred(false);
                }
              }}
              title={sidebarBlurred ? 'Нажмите, чтобы вернуть меню' : undefined}
              className={`px-3.5 py-2 space-y-1 transition-all duration-300 ${
                sidebarBlurred
                  ? 'blur-[6px] opacity-30 select-none cursor-pointer'
                  : ''
              }`}
            >
              {[
                { id: 'dashboard' as NavSectionId, label: 'Главная', Icon: Home },
                { id: 'brand-strategy' as NavSectionId, label: 'Сценарии роста', Icon: BarChart3 },
                { id: 'product-catalog' as NavSectionId, label: 'Модели (SKU)', Icon: Box },
                { id: 'launch-calendar' as NavSectionId, label: 'План продаж', Icon: TrendingUp },
                { id: 'product-lab' as NavSectionId, label: 'Производство', Icon: Factory },
                { id: 'roadmap-tasks' as NavSectionId, label: 'Закупки', Icon: ShoppingCart },
                { id: 'finance' as NavSectionId, label: 'Финансы', Icon: Coins },
                { id: 'marketing-growth' as NavSectionId, label: 'Маркетинг', Icon: Megaphone },
                { id: 'documents' as NavSectionId, label: 'Отчёты', Icon: FileText },
              ]
                .filter((item) => canUserAccessSection(currentUser, item.id))
                .map(({ id, label, Icon }) => {
                  const isActive = platformMode === 'management' && activeSection === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setPlatformMode('management');
                        navigateTo(id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full h-[42px] rounded-[11px] px-3.5 flex items-center gap-3.5 text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-white/[0.12] text-white font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]'
                          : 'text-[#A2A8B8] hover:text-white hover:bg-white/[0.05] font-medium'
                      }`}
                    >
                      <Icon
                        className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                          isActive ? 'text-white stroke-[2.1]' : 'text-[#8F96A6] stroke-[1.8]'
                        }`}
                      />
                      <span className="text-[14px] tracking-[-0.01em] truncate">
                        {label}
                      </span>
                    </button>
                  );
                })}

              {/* Компактные системные ссылки внизу списка */}
              <div className="pt-4 mt-4 border-t border-white/[0.08] space-y-0.5">
                {[
                  { id: 'brand-portfolio' as NavSectionId, label: 'Портфель брендов' },
                  { id: 'market-intelligence' as NavSectionId, label: 'Рынок и конкуренты' },
                  { id: 'settings' as NavSectionId, label: 'Настройки · borners-group.ru' },
                ]
                  .filter((item) => canUserAccessSection(currentUser, item.id))
                  .map((item) => {
                    const isActive =
                      platformMode === 'management' && activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setPlatformMode('management');
                          navigateTo(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full h-8 rounded-[9px] px-3.5 flex items-center justify-between text-left text-[12.5px] transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-white/[0.12] text-white font-semibold'
                            : 'text-[#7D8496] hover:text-[#D0D5E0] hover:bg-white/[0.04]'
                        }`}
                      >
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
              </div>
            </nav>
          </div>

          {/* Нижняя карточка сайдбара: Переход в презентацию стратегии */}
          <div
            onClick={() => {
              if (sidebarBlurred) setSidebarBlurred(false);
            }}
            className={`p-3.5 border-t border-white/[0.08] transition-all duration-300 ${
              sidebarBlurred ? 'blur-[6px] opacity-30 select-none cursor-pointer' : ''
            }`}
          >
            <button
              type="button"
              onClick={(e) => {
                if (sidebarBlurred) {
                  e.stopPropagation();
                  setSidebarBlurred(false);
                  return;
                }
                setPlatformMode(platformMode === 'strategy' ? 'management' : 'strategy');
              }}
              className={`w-full rounded-[12px] p-3 text-left transition cursor-pointer border ${
                platformMode === 'strategy'
                  ? 'bg-[#C8A97E] text-[#161822] border-[#C8A97E] font-semibold'
                  : 'bg-white/[0.06] hover:bg-white/[0.11] text-white border-white/[0.1]'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] opacity-75">
                <span>Презентация · 16 слайдов</span>
                <span>→</span>
              </div>
              <div className="text-[13.5px] font-semibold mt-0.5 leading-snug">
                {platformMode === 'strategy'
                  ? 'Вернуться в систему'
                  : 'Стратегия развития 2027'}
              </div>
            </button>
          </div>
        </aside>

        {/* ОСНОВНАЯ РАБОЧАЯ ОБЛАСТЬ */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* ВЕРХНЯЯ ПАНЕЛЬ: единая высота h-14, строгая геометрия rounded-[6px], z-50 чтобы выпадающие списки всегда были поверх контента */}
          <header className="sticky top-0 z-50 h-14 bg-[#FDFCFA]/95 backdrop-blur-xs border-b-[1.5px] border-[#D4CDC2] px-6 md:px-8 flex items-center justify-between gap-4">
            {/* Левая группа: Кнопка возврата панели (Глазик, когда левая колонка скрыта) + Назад + Выпадающий список брендов */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden h-9 w-9 rounded-[6px] bg-white border-[1.5px] border-[#D4CDC2] flex items-center justify-center"
              >
                <Menu className="h-4 w-4" />
              </button>

              {sidebarBlurred && (
                <button
                  type="button"
                  onClick={() => setSidebarBlurred(false)}
                  title="Вернуть левую панель на место"
                  aria-label="Вернуть левую панель на место"
                  className="hidden lg:inline-flex items-center justify-center h-9 w-9 rounded-[8px] bg-[#181715] text-white hover:bg-[#2C2B29] shadow-2xs transition cursor-pointer shrink-0 mr-1"
                >
                  <EyeOff className="h-4 w-4" />
                </button>
              )}

              {navHistory.length > 1 && (
                <button
                  onClick={goBack}
                  title="Назад"
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[6px] bg-white border-[1.5px] border-[#D4CDC2] text-[12.5px] font-medium text-[#161615] hover:border-[#161615] transition cursor-pointer shrink-0"
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
              {/* Быстрый переход в CRM с задачами и проектами из любой точки сервиса */}
              <button
                type="button"
                onClick={() => {
                  setPlatformMode('management');
                  navigateTo('roadmap-tasks');
                }}
                title="Открыть CRM · Задачи и проекты"
                className={`inline-flex items-center gap-2 h-9 px-3.5 rounded-[6px] border-[1.5px] text-[12.5px] font-medium transition cursor-pointer ${
                  platformMode === 'management' && activeSection === 'roadmap-tasks'
                    ? 'bg-[#161615] text-white border-[#161615]'
                    : 'bg-white text-[#161615] border-[#D4CDC2] hover:border-[#161615]'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-[#B85D35] shrink-0" />
                <span>CRM · Задачи</span>
                <span
                  className={`font-mono text-[10.5px] px-1.5 py-0.2 rounded-[4px] ${
                    platformMode === 'management' && activeSection === 'roadmap-tasks'
                      ? 'bg-white/20 text-white'
                      : 'bg-[#F2EFE9] text-[#5C5852]'
                  }`}
                >
                  {tasks.filter((t) => !t.isArchived && t.status !== 'Done').length}
                </span>
              </button>

              {/* Переключатель: Платформа vs Презентация */}
              <div className="flex items-center h-9 bg-[#F2EFE9] p-0.5 rounded-[6px] border-[1.5px] border-[#D4CDC2]">
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

              {/* Обучение с подсветкой этапов (как в Peakly) */}
              <button
                type="button"
                onClick={() => {
                  setTourStepIdx(0);
                  setTourModalOpen(true);
                }}
                title="Интерактивное обучение с подсветкой этапов"
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[6px] bg-[#FAF8F5] border-[1.5px] border-[#D4CDC2] hover:border-[#161615] text-[12.5px] font-medium text-[#161615] transition cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#B85D35]" />
                <span className="hidden xl:inline">Обучение</span>
              </button>

              {/* Корзина удалений (восстановление удалённых карточек) */}
              <button
                type="button"
                onClick={() => setTrashModalOpen(true)}
                title="Корзина удалений — восстановить случайно удалённые карточки"
                className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-[6px] border-[1.5px] text-[12.5px] font-medium transition cursor-pointer ${
                  trashItems.length > 0
                    ? 'bg-[#FAF8F5] border-[#B85D35] text-[#181715]'
                    : 'bg-white border-[#D4CDC2] hover:border-[#161615] text-[#161615]'
                }`}
              >
                <Trash2 className="h-3.5 w-3.5 text-[#6E6A63]" />
                <span className="hidden md:inline">Корзина</span>
                <span className="font-mono text-[10.5px] px-1.5 py-0.2 rounded-[4px] bg-[#F2EFE9] text-[#5C5852]">
                  {trashItems.length}
                </span>
              </button>

              {/* Поиск */}
              <button
                onClick={() => setSearchModalOpen(true)}
                className="inline-flex items-center gap-2 h-9 rounded-[6px] bg-white border-[1.5px] border-[#D4CDC2] hover:border-[#161615] px-3 text-[12.5px] font-medium text-[#161615] transition cursor-pointer"
              >
                <Search className="h-3.5 w-3.5 text-[#6E6A63]" />
                <span className="hidden sm:inline">Поиск</span>
                <span className="hidden md:inline font-mono text-[10px] text-[#8C867E] border border-[#D4CDC2] rounded-[3px] px-1">
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
                  <>
                    <div
                      onClick={() => setProfileMenuOpen(false)}
                      className="fixed inset-0 z-40"
                    />
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
                  </>
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
              className="w-full max-w-2xl bg-white rounded-2xl border-[1.5px] border-[#181715] shadow-2xl overflow-hidden"
            >
              <div className="flex items-center gap-3 border-b-2 border-[#181715] px-6 py-4 bg-[#FAF8F5]">
                <Search className="h-5 w-5 text-[#181715]" />
                <input
                  autoFocus
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchResults.length > 0) {
                      e.preventDefault();
                      searchResults[0].onSelect();
                    } else if (e.key === 'Escape') {
                      setSearchModalOpen(false);
                    }
                  }}
                  placeholder="Артикул, модель, НА ТЕЛЕ / BORNERS, задача CRM или раздел..."
                  className="flex-1 bg-transparent text-[16px] font-medium outline-none text-[#171717]"
                />
                <button
                  type="button"
                  onClick={() => setSearchModalOpen(false)}
                  className="rounded-[6px] border-[1.5px] border-[#D4CDC2] bg-white px-2.5 py-1 text-[11.5px] font-semibold text-[#5C5852] hover:border-[#181715] hover:text-[#181715] cursor-pointer"
                >
                  ESC
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto divide-y divide-[#E5E0D8] p-2">
                {searchResults.map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      res.onSelect();
                    }}
                    onClick={res.onSelect}
                    className="w-full text-left px-4 py-3.5 rounded-xl hover:bg-[#F3EFE8] cursor-pointer flex items-center justify-between gap-4 transition group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[11px] font-mono font-semibold uppercase text-[#181715] bg-[#EFECE6] px-2.5 py-0.5 rounded-[5px] border border-[#D4CDC2] shrink-0">
                          {res.category}
                        </span>
                        <span className="text-[15px] font-semibold text-[#181715] group-hover:underline truncate">
                          {res.title}
                        </span>
                      </div>
                      <div className="text-[13px] text-[#6E6A63] mt-1 truncate">{res.subtitle}</div>
                    </div>
                    <span className="text-[13px] font-semibold text-[#181715] shrink-0 px-3 py-1.5 rounded-[6px] bg-[#FAF8F5] group-hover:bg-[#181715] group-hover:text-white border border-[#D4CDC2] transition">
                      Открыть →
                    </span>
                  </button>
                ))}

                {globalSearchQuery && searchResults.length === 0 && (
                  <div className="py-12 text-center text-[15px] text-[#737373]">
                    Ничего не найдено по запросу «{globalSearchQuery}»
                  </div>
                )}

                {!globalSearchQuery && (
                  <div className="p-4 space-y-3">
                    <div className="text-[12px] font-mono uppercase tracking-wider text-[#7A756D]">
                      Быстрый переход по ключевым модулям:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'roadmap-tasks' as const, label: 'CRM · Задачи и проекты' },
                        { id: 'product-lab' as const, label: 'Лаборатория R&D' },
                        { id: 'product-catalog' as const, label: 'Каталог моделей SKU' },
                        { id: 'launch-calendar' as const, label: 'Календарь запусков' },
                        { id: 'finance' as const, label: 'Финансы 2027 (P&L)' },
                        { id: 'documents' as const, label: 'Документы (PDF / Excel)' },
                      ].map((sec) => (
                        <button
                          key={sec.id}
                          type="button"
                          onClick={() => {
                            setPlatformMode('management');
                            navigateTo(sec.id);
                            setSearchModalOpen(false);
                          }}
                          className="px-3.5 py-2.5 rounded-[8px] border-[1.5px] border-[#D4CDC2] hover:border-[#181715] bg-[#FAF8F5] hover:bg-[#EFECE6] text-left text-[13px] font-medium text-[#181715] transition cursor-pointer"
                        >
                          {sec.label} →
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* КОРЗИНА УДАЛЕНИЙ (ВОССТАНОВЛЕНИЕ ИЛИ ОКОНЧАТЕЛЬНОЕ УДАЛЕНИЕ) */}
        {trashModalOpen && (
          <div
            onClick={() => setTrashModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-white rounded-2xl border-[1.5px] border-[#181715] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="px-6 py-4 border-b-2 border-[#181715] bg-[#FAF8F5] flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <Trash2 className="h-5 w-5 text-[#B85D35]" />
                  <div>
                    <h3 className="text-[19px] font-bold text-[#181715]">
                      Корзина удалений ({trashItems.length})
                    </h3>
                    <p className="text-[12.5px] text-[#5C5852]">
                      Случайно удалённые разработки R&amp;D, модели SKU, релизы, задачи и документы можно вернуть в 1 клик
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTrashModalOpen(false)}
                  className="h-9 px-3.5 rounded-[8px] border-[1.5px] border-[#CFC8BC] bg-white hover:border-[#181715] text-[12.5px] font-semibold text-[#181715] cursor-pointer"
                >
                  Закрыть
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {trashItems.length === 0 ? (
                  <div className="py-12 text-center space-y-2 rounded-xl border-[1.5px] border-dashed border-[#D4CDC2] bg-[#FAF8F5]">
                    <div className="text-[16px] font-semibold text-[#181715]">
                      Корзина удалений пуста
                    </div>
                    <div className="text-[13px] text-[#6E6A63]">
                      Все карточки разработок R&amp;D, модели каталога, запуски и задачи находятся в рабочем контуре
                    </div>
                  </div>
                ) : (
                  trashItems.map((item) => (
                    <div
                      key={`${item.entityType}-${item.id}`}
                      className="rounded-xl border-[1.5px] border-[#D4CDC2] bg-[#FAF8F5] p-4 flex flex-wrap items-center justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="inline-flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-[4px] bg-white border border-[#CFC8BC] font-mono text-[10.5px] font-semibold uppercase text-[#B85D35]">
                            {item.typeLabel}
                          </span>
                        </div>
                        <div className="text-[15px] font-bold text-[#181715] truncate">
                          {item.title}
                        </div>
                        <div className="text-[12.5px] text-[#6E6A63] truncate">
                          {item.subtitle}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => restoreEntity(item.entityType, item.id)}
                          className="h-9 px-3.5 rounded-[8px] bg-[#1F6E50] hover:bg-[#17563E] text-white text-[12.5px] font-semibold transition cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Восстановить</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => permanentlyDeleteEntity(item.entityType, item.id)}
                          className="h-9 px-3 rounded-[8px] border border-[#C94B4B]/40 hover:bg-[#C94B4B] text-[#C94B4B] hover:text-white text-[12px] font-semibold transition cursor-pointer"
                        >
                          Удалить навсегда
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {trashItems.length > 0 && (
                <div className="px-6 py-3.5 border-t-[1.5px] border-[#D4CDC2] bg-[#FAF8F5] flex items-center justify-between">
                  <span className="text-[12.5px] text-[#5C5852]">
                    Нажмите на пустое место вокруг окна, чтобы закрыть корзину
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Очистить корзину удалений безвозвратно?')) {
                        emptyTrash();
                      }
                    }}
                    className="h-9 px-4 rounded-[8px] border border-[#C94B4B] text-[#C94B4B] hover:bg-[#C94B4B] hover:text-white text-[12.5px] font-semibold transition cursor-pointer"
                  >
                    Очистить всю корзину
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ИНТЕРАКТИВНАЯ ОБУЧАЛКА С ПОДСВЕТКОЙ ЭТАПОВ (КАК В PEAKLY) */}
        {tourModalOpen && (
          <div
            onClick={() => setTourModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs"
          >
            {(() => {
              const TOUR_STEPS = [
                {
                  stepNum: '01 / 07',
                  badge: 'ЭТАП R&D · ЗАПУСК ГИПОТЕЗЫ',
                  title: '01 Идея → 02 Анализ и расчёт комплекта',
                  desc: 'Создайте карточку разработки за 15 секунд: загрузите лицевое и оборотное фото, укажите количество штук в комплекте (2 / 3 / 4 / 6 шт.) — система автоматически пересчитает себестоимость за 1 пару и весь набор.',
                  highlightStages: [0, 1],
                  targetSection: 'product-lab' as NavSectionId,
                  ctaLabel: 'Перейти в Лабораторию R&D',
                },
                {
                  stepNum: '02 / 07',
                  badge: 'ЭТАП R&D · ОБРАЗЕЦ, СТИРКА И РЕШЕНИЕ',
                  title: '03 Образец (100% состав) → 04 Тест → 05 Решение',
                  desc: 'Конструктор ткани проверяет сумму волокон ровно на 100%, чек-лист фиксирует 4 протокола стирки и посадки, а на этапе «05 Решение» руководитель утверждает модель в тираж.',
                  highlightStages: [2, 3, 4],
                  targetSection: 'product-lab' as NavSectionId,
                  ctaLabel: 'Открыть карточки на проверке',
                },
                {
                  stepNum: '03 / 07',
                  badge: 'ЭТАП R&D · СПЕЦИФИКАЦИЯ ФАБРИКЕ (PDF 中文 + ₽/$/¥)',
                  title: '06 Производство + Конструктор PDF → 07 Запуск',
                  desc: 'Перед отправкой на фабрику откройте «Конструктор PDF»: выберите лицевое и оборотное фото товара, валюту расчёта (Юани ¥, Доллары $, Рубли ₽) и двуязычные блоки КРУПНЫМ КИТАЙСКИМ + мелким русским шрифтом.',
                  highlightStages: [5, 6],
                  targetSection: 'product-lab' as NavSectionId,
                  ctaLabel: 'Открыть Product Lab и PDF-конструктор',
                },
                {
                  stepNum: '04 / 07',
                  badge: 'ДАШБОРД · СТУДИЯ ИДЕЙ И БЕСКОНЕЧНЫЙ ХОЛСТ',
                  title: 'Студия идей: бесконечная доска со стрелочками, фото и голосом',
                  desc: 'На главном дашборде расположена интерактивная Студия идей: бесконечно двигайте холст в любую сторону, прикрепляйте стикеры друг к другу стрелочками, загружайте фото-референсы и записывайте голосовые заметки.',
                  highlightStages: [0, 1, 2, 3, 4, 5, 6],
                  targetSection: 'dashboard' as NavSectionId,
                  ctaLabel: 'Перейти в Студию идей',
                },
                {
                  stepNum: '05 / 07',
                  badge: 'ОПЕРАЦИОННЫЙ КОНТРОЛЬ · CRM, ТЗ И КОРЗИНА',
                  title: 'CRM · Задачи, пакетные документы и Корзина удалений',
                  desc: 'Управляйте поручениями на Канбан-доске CRM, загружайте сразу много ТЗ с привязкой к конкретной карточке R&D/SKU и восстанавливайте случайно удалённые объекты через «Корзину» в верхней панели.',
                  highlightStages: [0, 1, 2, 3, 4, 5, 6],
                  targetSection: 'roadmap-tasks' as NavSectionId,
                  ctaLabel: 'Открыть доску CRM · Задачи',
                },
              ];

              const currentTour = TOUR_STEPS[tourStepIdx] || TOUR_STEPS[0];
              const RND_STAGE_NAMES = [
                '01 Идея',
                '02 Анализ',
                '03 Образец',
                '04 Тест',
                '05 Решение',
                '06 Производство',
                '07 Запуск',
              ];

              return (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-2xl bg-white rounded-2xl border-2 border-[#181715] shadow-2xl overflow-hidden"
                >
                  {/* Верхняя полоса с подсветкой шагов */}
                  <div className="px-6 py-4 bg-[#181715] text-white flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="h-4 w-4 text-[#D97745]" />
                      <span className="font-mono text-[11.5px] uppercase tracking-[0.14em] text-[#D8D1C5]">
                        ИНТЕРАКТИВНЫЙ ГИД BORNERS GROUP · ШАГ {tourStepIdx + 1} ИЗ {TOUR_STEPS.length}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTourModalOpen(false)}
                      className="text-[12px] font-mono text-white/75 hover:text-white cursor-pointer"
                    >
                      Закрыть [ESC]
                    </button>
                  </div>

                  <div className="p-6 md:p-8 space-y-6">
                    {/* Визуальная шкала подсветки 7 этапов (Spotlight) */}
                    <div className="rounded-xl bg-[#FAF8F5] border-[1.5px] border-[#CFC8BC] p-4 space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] font-mono uppercase text-[#7A756D]">
                        <span>Подсветка этапов жизненного цикла модели (01–07)</span>
                        <span className="text-[#1F6E50] font-semibold">● Активный фокус</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-7 gap-1.5">
                        {RND_STAGE_NAMES.map((stName, i) => {
                          const isSpotlit = currentTour.highlightStages.includes(i);
                          const isPassed = i < Math.min(...currentTour.highlightStages);
                          return (
                            <div
                              key={stName}
                              className={`px-2.5 py-2 rounded-[6px] border text-center transition-all ${
                                isSpotlit
                                  ? 'bg-[#B85D35] text-white border-[#181715] font-bold shadow-sm scale-[1.03]'
                                  : isPassed
                                  ? 'bg-[#1F6E50]/12 text-[#1F6E50] border-[#1F6E50]/30 font-semibold'
                                  : 'bg-white text-[#8C867E] border-[#E2DCD2]'
                              }`}
                            >
                              <div className="text-[10.5px] font-mono truncate">{stName}</div>
                              <div className="text-[9.5px] mt-0.5">
                                {isSpotlit ? '● Фокус' : isPassed ? '✓ Готово' : '○ Этап'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B85D35]">
                        {currentTour.badge}
                      </div>
                      <h3 className="font-serif-editorial text-[28px] md:text-[32px] font-semibold text-[#181715] leading-tight">
                        {currentTour.title}
                      </h3>
                      <p className="text-[14.5px] text-[#5C5852] leading-relaxed">
                        {currentTour.desc}
                      </p>
                    </div>

                    {/* Точки быстрого переключения шагов */}
                    <div className="flex items-center gap-2 pt-1">
                      {TOUR_STEPS.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setTourStepIdx(idx)}
                          className={`h-2 rounded-full transition-all cursor-pointer ${
                            idx === tourStepIdx
                              ? 'w-8 bg-[#181715]'
                              : 'w-2 bg-[#D4CDC2] hover:bg-[#8C867E]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-[#FAF8F5] border-t-[1.5px] border-[#CFC8BC] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={tourStepIdx === 0}
                        onClick={() => setTourStepIdx((i) => Math.max(0, i - 1))}
                        className="h-9 px-3.5 rounded-[8px] border-[1.5px] border-[#CFC8BC] bg-white text-[12.5px] font-semibold text-[#181715] disabled:opacity-40 cursor-pointer inline-flex items-center gap-1"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Назад</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (tourStepIdx < TOUR_STEPS.length - 1) {
                            setTourStepIdx((i) => i + 1);
                          } else {
                            setTourModalOpen(false);
                          }
                        }}
                        className="h-9 px-4 rounded-[8px] border-[1.5px] border-[#181715] bg-white hover:bg-[#EFECE6] text-[12.5px] font-semibold text-[#181715] cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>
                          {tourStepIdx < TOUR_STEPS.length - 1 ? 'Следующий шаг' : 'Завершить гид'}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setPlatformMode('management');
                        navigateTo(currentTour.targetSection);
                        setTourModalOpen(false);
                      }}
                      className="h-9 px-4 rounded-[8px] bg-[#181715] hover:bg-[#2C2B29] text-white text-[12.5px] font-semibold cursor-pointer"
                    >
                      {currentTour.ctaLabel} →
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
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
