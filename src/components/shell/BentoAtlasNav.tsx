'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Boxes,
  CheckCircle2,
  Clock,
  FileText,
  FlaskConical,
  FolderKanban,
  Globe,
  LayoutGrid,
  Megaphone,
  Presentation,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { AppUser, NavSectionId } from '@/types/platform';
import { canUserAccessSection } from '@/lib/finance';
import { DraftModuleKey } from '@/lib/draftModules';

export interface BentoAtlasItem {
  id: string;
  sectionId?: NavSectionId;
  title: string;
  subtitle: string;
  metricBadge: string;
  icon: React.ComponentType<{ className?: string }>;
  contour: 'strategy' | 'product' | 'operations' | 'finance';
  isDraft?: boolean;
  onCustomSelect?: () => void;
}

interface BentoAtlasNavProps {
  open: boolean;
  onClose: () => void;
  activeSection: NavSectionId;
  platformMode: 'management' | 'strategy';
  onSelectSection: (section: NavSectionId) => void;
  onSetPlatformMode: (mode: 'management' | 'strategy') => void;
  currentUser: AppUser;
  recentSections: NavSectionId[];
  productsCount: number;
  activeConceptsCount: number;
  openTasksCount: number;
  documentsCount: number;
  usersCount: number;
  trashCount: number;
  draftModules: Record<DraftModuleKey, boolean>;
  enabledDraftCount: number;
  totalDraftCount: number;
  onOpenTour: () => void;
  onOpenDraftAdmin: () => void;
  onOpenTrash: () => void;
}

const SECTION_SHORT_LABELS: Record<NavSectionId, string> = {
  dashboard: 'Сводка и сценарии',
  'brand-strategy': 'ДНК и стратегия',
  'brand-portfolio': 'Портфель брендов',
  'market-intelligence': 'Рынок и конкуренты',
  'product-catalog': 'Каталог SKU',
  'product-lab': 'Лаборатория R&D',
  'launch-calendar': 'План продаж 2027',
  'roadmap-tasks': 'Закупки и задачи',
  'marketing-growth': 'Маркетинг и рост',
  finance: 'Финансы и P&L',
  documents: 'Документы и ТЗ',
  team: 'Команда и роли',
  settings: 'Настройки',
};

const CONTOUR_META: {
  key: BentoAtlasItem['contour'];
  step: string;
  title: string;
  caption: string;
}[] = [
  {
    key: 'strategy',
    step: 'I',
    title: 'Сводка и Стратегия',
    caption: 'Цели 2027 и позиционирование',
  },
  {
    key: 'product',
    step: 'II',
    title: '01 · Продукт и R&D',
    caption: 'Матрица SKU, фото и образцы',
  },
  {
    key: 'operations',
    step: 'III',
    title: '02–03 · Продажи и Закупки',
    caption: 'Помесячный план, партии и CRM',
  },
  {
    key: 'finance',
    step: 'IV',
    title: '04 · Финансы и Документы',
    caption: 'P&L, спецификации и доступы',
  },
];

export function BentoAtlasNav({
  open,
  onClose,
  activeSection,
  platformMode,
  onSelectSection,
  onSetPlatformMode,
  currentUser,
  recentSections,
  productsCount,
  activeConceptsCount,
  openTasksCount,
  documentsCount,
  usersCount,
  trashCount,
  draftModules,
  enabledDraftCount,
  totalDraftCount,
  onOpenTour,
  onOpenDraftAdmin,
  onOpenTrash,
}: BentoAtlasNavProps) {
  const [filterQuery, setFilterQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      setFilterQuery('');
      return;
    }
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 40);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  const allItems = useMemo<BentoAtlasItem[]>(() => {
    const raw: BentoAtlasItem[] = [
      // I. Сводка и Стратегия
      {
        id: 'dashboard',
        sectionId: 'dashboard',
        title: 'Сводка и Сценарии роста',
        subtitle: 'Планы 100 / 150 / 200 млн ₽, модели и контроль партий',
        metricBadge: '4 сценария',
        icon: LayoutGrid,
        contour: 'strategy',
      },
      {
        id: 'brand-strategy',
        sectionId: 'brand-strategy',
        title: 'ДНК и стратегия брендов',
        subtitle: 'Паспорта позиционирования BORNERS и НА ТЕЛЕ (14 блоков)',
        metricBadge: '2 бренда',
        icon: TrendingUp,
        contour: 'strategy',
      },
      {
        id: 'presentation-mode',
        title: 'Презентация стратегии 2027',
        subtitle: 'Полноэкранный режим слайдов для защиты стратегии',
        metricBadge: '16 слайдов',
        icon: Presentation,
        contour: 'strategy',
        onCustomSelect: () => {
          onSetPlatformMode('strategy');
          onClose();
        },
      },
      ...(draftModules.brandPortfolio
        ? [
            {
              id: 'brand-portfolio',
              sectionId: 'brand-portfolio' as NavSectionId,
              title: 'Портфель брендов',
              subtitle: 'Архитектура марок и долей ассортимента',
              metricBadge: 'Портфель',
              icon: Sparkles,
              contour: 'strategy' as const,
              isDraft: true,
            },
          ]
        : []),
      ...(draftModules.marketIntelligence
        ? [
            {
              id: 'market-intelligence',
              sectionId: 'market-intelligence' as NavSectionId,
              title: 'Рынок и конкуренты',
              subtitle: 'Ценовые сегменты, бенчмарки и доли на WB / Ozon',
              metricBadge: 'Аналитика',
              icon: Globe,
              contour: 'strategy' as const,
              isDraft: true,
            },
          ]
        : []),

      // II. Продукт и R&D
      {
        id: 'product-catalog',
        sectionId: 'product-catalog',
        title: 'Каталог моделей (SKU)',
        subtitle: 'Единые паспорта изделий, фото без обрезки и себестоимость',
        metricBadge: `${productsCount} SKU`,
        icon: Boxes,
        contour: 'product',
      },
      {
        id: 'product-lab',
        sectionId: 'product-lab',
        title: 'Лаборатория R&D (01–07)',
        subtitle: 'Отбор образцов, тесты стирки и утверждение лекал',
        metricBadge: `${activeConceptsCount} в работе`,
        icon: FlaskConical,
        contour: 'product',
      },

      // III. Продажи и Закупки
      {
        id: 'launch-calendar',
        sectionId: 'launch-calendar',
        title: 'План продаж и производства',
        subtitle: 'Помесячная матрица 12 мес. по комплектам, ценам и выручке',
        metricBadge: '12 мес. · 2027',
        icon: BarChart3,
        contour: 'operations',
      },
      {
        id: 'roadmap-tasks',
        sectionId: 'roadmap-tasks',
        title: 'Закупки, партии и задачи CRM',
        subtitle: 'Контроль дедлайнов фабрик, поручений и поставок',
        metricBadge: `${openTasksCount} задач`,
        icon: FolderKanban,
        contour: 'operations',
      },
      ...(draftModules.marketing
        ? [
            {
              id: 'marketing-growth',
              sectionId: 'marketing-growth' as NavSectionId,
              title: 'Маркетинг и продвижение',
              subtitle: 'Воронка трафика, ДРР и медиаплан запусков',
              metricBadge: 'Рост',
              icon: Megaphone,
              contour: 'operations' as const,
              isDraft: true,
            },
          ]
        : []),

      // IV. Финансы и Документы
      {
        id: 'finance',
        sectionId: 'finance',
        title: 'Финансы и P&L 2027',
        subtitle: 'Сводный отчёт о прибылях, маржинальности и план/факт',
        metricBadge: 'P&L · Капитал',
        icon: Wallet,
        contour: 'finance',
      },
      {
        id: 'documents',
        sectionId: 'documents',
        title: 'Документы, ТЗ и PDF',
        subtitle: 'ТЗ v1.1, спецификации фабрик, отчёты и таблицы',
        metricBadge: `${documentsCount} файл.`,
        icon: FileText,
        contour: 'finance',
      },
      {
        id: 'team',
        sectionId: 'team',
        title: 'Команда и роли доступа',
        subtitle: 'Разграничение прав владельца, продакт-менеджера и финансов',
        metricBadge: `${usersCount} ролей`,
        icon: Users,
        contour: 'finance',
      },
      ...(draftModules.settingsSection
        ? [
            {
              id: 'settings',
              sectionId: 'settings' as NavSectionId,
              title: 'Настройки системы',
              subtitle: 'Параметры домена, резервных копий и справочников',
              metricBadge: 'Система',
              icon: ShieldCheck,
              contour: 'finance' as const,
              isDraft: true,
            },
          ]
        : []),
    ];

    return raw.filter((item) =>
      item.sectionId ? canUserAccessSection(currentUser, item.sectionId) : true
    );
  }, [
    activeConceptsCount,
    currentUser,
    documentsCount,
    draftModules,
    onClose,
    onSetPlatformMode,
    openTasksCount,
    productsCount,
    usersCount,
  ]);

  const filteredItems = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.metricBadge.toLowerCase().includes(q)
    );
  }, [allItems, filterQuery]);

  if (!open) return null;

  return (
    <>
      {/* Спокойный полупрозрачный фон */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity"
      />

      {/* Выпадающий Бенто-Атлас под шапкой */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Бенто-атлас всех разделов BORNERS"
        className="fixed inset-x-3 sm:inset-x-6 lg:inset-x-10 top-[64px] z-50 max-w-[1440px] mx-auto rounded-[20px] bg-white border border-[#E5E4DF] shadow-[0_24px_64px_rgba(20,20,19,0.14)] overflow-hidden flex flex-col max-h-[calc(100vh-84px)]"
      >
        {/* Верхняя панель Бенто-Атласа: фильтр + недавние переходы */}
        <div className="px-5 py-3.5 border-b border-[#ECEBE6] bg-[#FAFAF8] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
            <div className="relative flex-1 max-w-sm">
              <Search className="h-3.5 w-3.5 text-[#8A8983] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={inputRef}
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filteredItems.length > 0) {
                    const first = filteredItems[0];
                    if (first.onCustomSelect) {
                      first.onCustomSelect();
                    } else if (first.sectionId) {
                      onSetPlatformMode('management');
                      onSelectSection(first.sectionId);
                      onClose();
                    }
                  }
                }}
                placeholder="Найти раздел (например: закупки, P&L, R&D)..."
                className="w-full h-8.5 pl-8.5 pr-3 rounded-[9px] bg-white border border-[#E5E4DF] text-[12.5px] text-[#141413] placeholder:text-[#8E8D87]"
              />
            </div>

            {recentSections.length > 0 && !filterQuery && (
              <div className="hidden xl:flex items-center gap-1.5 text-[11.5px]">
                <span className="inline-flex items-center gap-1 text-[#8A8983] font-medium mr-0.5">
                  <Clock className="h-3 w-3" />
                  <span>Недавние:</span>
                </span>
                {recentSections.slice(0, 4).map((secId) => (
                  <button
                    key={secId}
                    type="button"
                    onClick={() => {
                      onSetPlatformMode('management');
                      onSelectSection(secId);
                      onClose();
                    }}
                    className={`h-7 px-2.5 rounded-[7px] border text-[11.5px] font-medium transition cursor-pointer ${
                      platformMode === 'management' && activeSection === secId
                        ? 'bg-[#141413] text-white border-[#141413]'
                        : 'bg-white hover:bg-[#F3F3F0] text-[#3F3E3A] border-[#E5E4DF]'
                    }`}
                  >
                    {SECTION_SHORT_LABELS[secId] || secId}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-[9px] bg-[#F1F1EE] border border-[#E5E4DF] p-0.5 text-[11.5px] font-semibold">
              <button
                type="button"
                onClick={() => onSetPlatformMode('management')}
                className={`px-2.5 py-1 rounded-[7px] transition cursor-pointer ${
                  platformMode === 'management'
                    ? 'bg-white text-[#141413] shadow-2xs'
                    : 'text-[#686762] hover:text-[#141413]'
                }`}
              >
                Рабочая система
              </button>
              <button
                type="button"
                onClick={() => {
                  onSetPlatformMode('strategy');
                  onClose();
                }}
                className={`px-2.5 py-1 rounded-[7px] transition cursor-pointer ${
                  platformMode === 'strategy'
                    ? 'bg-white text-[#141413] shadow-2xs'
                    : 'text-[#686762] hover:text-[#141413]'
                }`}
              >
                Презентация
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть атлас разделов"
              className="h-8 w-8 rounded-[9px] bg-white hover:bg-[#F1F1EE] border border-[#E5E4DF] flex items-center justify-center text-[#52524E] cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Основная 4-колоночная Бенто-сетка контуров */}
        <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {CONTOUR_META.map((contour) => {
            const items = filteredItems.filter((i) => i.contour === contour.key);
            if (items.length === 0) return null;

            return (
              <div key={contour.key} className="space-y-2.5">
                <div className="px-1 flex items-baseline justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#141413]">
                      {contour.title}
                    </div>
                    <div className="text-[11px] text-[#7A7974]">
                      {contour.caption}
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-[#9A9992] font-semibold">
                    {contour.step}
                  </span>
                </div>

                <div className="space-y-2">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.id === 'presentation-mode'
                        ? platformMode === 'strategy'
                        : platformMode === 'management' &&
                          item.sectionId === activeSection;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          if (item.onCustomSelect) {
                            item.onCustomSelect();
                          } else if (item.sectionId) {
                            onSetPlatformMode('management');
                            onSelectSection(item.sectionId);
                            onClose();
                          }
                        }}
                        className={`group w-full text-left rounded-[14px] p-3.5 border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                          isActive
                            ? 'bg-[#F8F8F6] border-[#141413] shadow-[0_4px_14px_rgba(20,20,19,0.05)]'
                            : 'bg-white hover:bg-[#FAFAF8] border-[#E5E4DF] hover:border-[#C5C4BD]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 w-full">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`h-8 w-8 rounded-[9px] border flex items-center justify-center shrink-0 transition ${
                                isActive
                                  ? 'bg-[#141413] text-white border-[#141413]'
                                  : 'bg-[#F6F6F4] text-[#3A3A36] border-[#E8E7E2] group-hover:bg-[#141413] group-hover:text-white group-hover:border-[#141413]'
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <div className="text-[13px] font-semibold text-[#141413] leading-snug flex items-center gap-1.5">
                                <span className="truncate">{item.title}</span>
                                {isActive && (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-[#157347] shrink-0" />
                                )}
                              </div>
                              <div className="font-mono text-[10.5px] text-[#686762] mt-0.5">
                                {item.metricBadge}
                                {item.isDraft ? ' · черновик' : ''}
                              </div>
                            </div>
                          </div>

                          <ArrowUpRight className="h-3.5 w-3.5 text-[#A3A29B] group-hover:text-[#141413] shrink-0 transition" />
                        </div>

                        <p className="text-[11.5px] text-[#686762] leading-relaxed line-clamp-2">
                          {item.subtitle}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="col-span-full py-10 text-center text-[13.5px] text-[#686762]">
              По запросу «{filterQuery}» разделов не найдено
            </div>
          )}
        </div>

        {/* Спокойная сервисная полоса снизу Бенто-Атласа */}
        <div className="px-5 py-3 border-t border-[#ECEBE6] bg-[#FAFAF8] flex flex-wrap items-center justify-between gap-3 text-[12px]">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenTour();
              }}
              className="h-7.5 px-3 rounded-[8px] bg-white hover:bg-[#F2F2EF] border border-[#E5E4DF] text-[#262624] font-medium inline-flex items-center gap-1.5 cursor-pointer transition"
            >
              <BookOpen className="h-3.5 w-3.5 text-[#686762]" />
              <span>Гид по системе (5 шагов)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenDraftAdmin();
              }}
              className="h-7.5 px-3 rounded-[8px] bg-white hover:bg-[#F2F2EF] border border-[#E5E4DF] text-[#262624] font-medium inline-flex items-center gap-1.5 cursor-pointer transition"
            >
              <Settings className="h-3.5 w-3.5 text-[#686762]" />
              <span>
                Черновик разделов ({enabledDraftCount}/{totalDraftCount})
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenTrash();
              }}
              className="h-7.5 px-3 rounded-[8px] bg-white hover:bg-[#F2F2EF] border border-[#E5E4DF] text-[#262624] font-medium inline-flex items-center gap-1.5 cursor-pointer transition"
            >
              <Trash2 className="h-3.5 w-3.5 text-[#686762]" />
              <span>Корзина ({trashCount})</span>
            </button>
          </div>

          <div className="text-[11px] text-[#8A8983]">
            Быстрый вызов атласа: <kbd className="font-mono px-1.5 py-0.5 rounded bg-white border border-[#E5E4DF] text-[#3F3E3A]">⌘J</kbd> · Глобальный поиск SKU: <kbd className="font-mono px-1.5 py-0.5 rounded bg-white border border-[#E5E4DF] text-[#3F3E3A]">⌘K</kbd>
          </div>
        </div>
      </div>
    </>
  );
}
