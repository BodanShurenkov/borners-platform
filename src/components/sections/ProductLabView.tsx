'use client';

import React, { useState, useMemo } from 'react';
import {
  AlertCircle,
  Archive,
  ArrowRight,
  CheckCircle2,
  ClipboardPaste,
  Columns3,
  GripVertical,
  LayoutGrid,
  Lock,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  Table2,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { usePlatform } from '@/context/PlatformContext';
import {
  ConceptStage,
  ProductConcept,
  RnDDevelopmentType,
  TaskPriority,
} from '@/types/platform';
import {
  CONCEPT_STAGE_LABELS_RU,
  RND_DEVELOPMENT_TYPE_LABELS_RU,
  ROLE_LABELS_RU,
  SEVEN_KANBAN_STAGES,
  SevenKanbanStage,
  TASK_PRIORITY_LABELS_RU,
  canUserApproveProduction,
  canUserEditBrand,
  canUserViewBrandConcept,
  normalizeConceptStageToSeven,
  validateRnDStageTransition,
} from '@/lib/finance';
import {
  ProductLabCardBody,
  RND_CARD_TABS,
  RnDCardTabId,
} from '@/components/sections/ProductLabTabs';

const STAGE_SUBTITLES: Record<SevenKanbanStage, { num: string; title: string; subtitle: string }> = {
  IDEA: { num: '01', title: 'ИДЕЯ', subtitle: 'Захват и сохранение' },
  ANALYSIS: { num: '02', title: 'АНАЛИЗ', subtitle: 'Рынок и гипотеза' },
  SAMPLE: { num: '03', title: 'ОБРАЗЕЦ', subtitle: 'Физический продукт' },
  TEST: { num: '04', title: 'ТЕСТ', subtitle: 'Качество и посадка' },
  DECISION: { num: '05', title: 'РЕШЕНИЕ', subtitle: 'Утвердить / вернуть' },
  PRODUCTION: { num: '06', title: 'ПРОИЗВОДСТВО', subtitle: 'Партия и контроль' },
  LAUNCH: { num: '07', title: 'ЗАПУСК', subtitle: 'Продажи и результат' },
};

export function ProductLabView() {
  const {
    concepts,
    products,
    launches,
    tasks,
    competitors,
    users,
    currentUser,
    brandFilter,
    setBrandFilter,
    platformMode,
    simpleMode,
    setSimpleMode,
    selectedConceptId,
    setSelectedConceptId,
    createConcept,
    updateConcept,
    updateConceptStage,
    deleteConcept,
    createProductFromConcept,
    createLaunch,
    createTask,
    navigateTo,
    notify,
  } = usePlatform();

  const isStrategyMode = false;

  // 4 режима отображения (п. 3.1 и 3.2 ТЗ: Доска Kanban — основной режим, Таблица, Галерея, Архив)
  const [viewMode, setViewMode] = useState<'kanban' | 'table' | 'gallery' | 'archive'>(
    'kanban'
  );

  // Фильтры и поиск (п. 3.3 ТЗ)
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [ownerFilter, setOwnerFilter] = useState<string>('ALL');
  const [factoryFilter, setFactoryFilter] = useState<string>('ALL');

  // Вкладка внутри открытой единой карточки разработки (п. 5 ТЗ — 9 вкладок)
  const [activeCardTab, setActiveCardTab] = useState<RnDCardTabId>('overview');

  // Drag & Drop на семиэтапной доске Kanban
  const [draggedConceptId, setDraggedConceptId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<SevenKanbanStage | null>(null);

  // Модальное окно быстрого создания новой идеи (Схема 3, п. 4.1–4.2 ТЗ)
  const [quickIdeaOpen, setQuickIdeaOpen] = useState(false);
  const [quickIdeaForm, setQuickIdeaForm] = useState({
    brandId: brandFilter === 'NA_TELE' ? 'NA_TELE' : 'BORNERS',
    name: '',
    comment: '',
    referenceLink: '',
    developmentType: 'new_construction' as RnDDevelopmentType,
    ownerId: currentUser.id,
    tagsText: '',
    images: [] as string[],
  });

  // Диалоговое окно контроля перехода между этапами (п. 15 ТЗ)
  const [stageGateModal, setStageGateModal] = useState<{
    concept: ProductConcept;
    targetStage: ConceptStage;
    missingFields: string[];
    requiresManagerApproval: boolean;
  } | null>(null);
  const [gateFillForm, setGateFillForm] = useState({
    ownerId: '',
    whatAttracted: '',
    hypothesis: '',
    risks: '',
    supplierName: '',
    approvalJustification: '',
    exceptionReason: '',
  });

  // ---------------------------------------------------------------------------
  // ИЗОЛЯЦИЯ БРЕНДОВ ПО ПРАВАМ ДОСТУПА (КРИТЕРИЙ 08 ТЗ) И ФИЛЬТРАЦИЯ
  // ---------------------------------------------------------------------------
  const accessibleConcepts = useMemo(() => {
    return concepts.filter((c) => canUserViewBrandConcept(currentUser, c.brandId));
  }, [concepts, currentUser]);

  const activeConcepts = useMemo(() => {
    return accessibleConcepts.filter(
      (c) =>
        !c.isArchived &&
        !c.isDemo &&
        c.stage !== 'REJECTED' &&
        c.stage !== 'POSTPONED' &&
        c.stage !== 'CANCELLED'
    );
  }, [accessibleConcepts]);

  const archivedOrDemoConcepts = useMemo(() => {
    return accessibleConcepts.filter(
      (c) =>
        c.isArchived ||
        c.isDemo ||
        c.stage === 'REJECTED' ||
        c.stage === 'POSTPONED' ||
        c.stage === 'CANCELLED'
    );
  }, [accessibleConcepts]);

  const filteredConcepts = useMemo(() => {
    const baseList = viewMode === 'archive' ? archivedOrDemoConcepts : activeConcepts;
    const q = searchQuery.trim().toLowerCase();

    return baseList.filter((c) => {
      if (brandFilter !== 'ALL' && c.brandId !== brandFilter) return false;
      if (typeFilter !== 'ALL' && (c.developmentType || 'new_construction') !== typeFilter)
        return false;
      if (stageFilter !== 'ALL' && normalizeConceptStageToSeven(c.stage) !== stageFilter)
        return false;
      if (priorityFilter !== 'ALL' && (c.priority || 'Medium') !== priorityFilter)
        return false;
      if (ownerFilter !== 'ALL' && c.ownerId !== ownerFilter) return false;
      if (
        factoryFilter !== 'ALL' &&
        !(c.supplierName || '').toLowerCase().includes(factoryFilter.toLowerCase())
      )
        return false;

      if (q) {
        const hay = [
          c.code,
          c.name,
          c.ideaDescription,
          c.whatAttracted,
          ...(c.tags || []),
          c.supplierName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    viewMode,
    archivedOrDemoConcepts,
    activeConcepts,
    brandFilter,
    typeFilter,
    stageFilter,
    priorityFilter,
    ownerFilter,
    factoryFilter,
    searchQuery,
  ]);

  // ---------------------------------------------------------------------------
  // 16. ПОКАЗАТЕЛИ ВЕРХНЕЙ ПАНЕЛИ И СКВОЗНАЯ АНАЛИТИКА ПРОЦЕССА (ЧЕСТНЫЙ РАСЧЁТ)
  // ---------------------------------------------------------------------------
  const labMetrics = useMemo(() => {
    const brandScoped = activeConcepts.filter(
      (c) => brandFilter === 'ALL' || c.brandId === brandFilter
    );
    const totalActive = brandScoped.length;
    const ideasAndAnalysis = brandScoped.filter((c) =>
      ['IDEA', 'ANALYSIS'].includes(normalizeConceptStageToSeven(c.stage))
    ).length;
    const samplesInCheck = brandScoped.filter((c) =>
      ['SAMPLE', 'TEST'].includes(normalizeConceptStageToSeven(c.stage))
    ).length;
    const awaitingDecision = brandScoped.filter(
      (c) => normalizeConceptStageToSeven(c.stage) === 'DECISION'
    ).length;
    const delayedProductions = brandScoped.filter(
      (c) =>
        normalizeConceptStageToSeven(c.stage) === 'PRODUCTION' &&
        (c.productionOrders?.some((o) => o.hasDelayRisk) || c.isBlocked)
    ).length;
    const upcomingLaunches = brandScoped.filter(
      (c) => normalizeConceptStageToSeven(c.stage) === 'LAUNCH'
    ).length;

    const todayStr = '2026-10-31';
    const overdueTasksCount = tasks.filter(
      (t) =>
        !t.isArchived &&
        t.status !== 'Done' &&
        (brandFilter === 'ALL' || t.brandId === brandFilter) &&
        t.deadline < todayStr
    ).length;

    // Сквозная воронка конверсии по фактическим этапам карточек (п. 16 ТЗ)
    const stageRank: Record<SevenKanbanStage, number> = {
      IDEA: 1,
      ANALYSIS: 2,
      SAMPLE: 3,
      TEST: 4,
      DECISION: 5,
      PRODUCTION: 6,
      LAUNCH: 7,
    };
    const reachedAnalysis = brandScoped.filter(
      (c) => stageRank[normalizeConceptStageToSeven(c.stage)] >= 2
    ).length;
    const reachedSample = brandScoped.filter(
      (c) => stageRank[normalizeConceptStageToSeven(c.stage)] >= 3
    ).length;
    const passedTesting = brandScoped.filter(
      (c) =>
        stageRank[normalizeConceptStageToSeven(c.stage)] >= 5 ||
        c.testProtocols?.some(
          (tp) => tp.verdict === 'passed' || tp.verdict === 'passed_with_remarks'
        )
    ).length;
    const reachedLaunch = brandScoped.filter(
      (c) => stageRank[normalizeConceptStageToSeven(c.stage)] >= 7
    ).length;

    const ideaToAnalysisPct =
      totalActive > 0 ? Math.round((reachedAnalysis / totalActive) * 100) : 0;
    const analysisToSamplePct =
      reachedAnalysis > 0 ? Math.round((reachedSample / reachedAnalysis) * 100) : 0;
    const sampleToTestPassPct =
      reachedSample > 0 ? Math.round((passedTesting / reachedSample) * 100) : 0;
    const totalToLaunchPct =
      totalActive > 0 ? Math.round((reachedLaunch / totalActive) * 100) : 0;

    return {
      totalActive,
      ideasAndAnalysis,
      samplesInCheck,
      awaitingDecision,
      delayedProductions,
      upcomingLaunches,
      overdueTasksCount,
      ideaToAnalysisPct,
      analysisToSamplePct,
      sampleToTestPassPct,
      totalToLaunchPct,
    };
  }, [activeConcepts, brandFilter, tasks]);

  // ---------------------------------------------------------------------------
  // ПОИСК ДУБЛИКАТОВ ПРИ СОЗДАНИИ НОВОЙ ИДЕИ (П. 4.2 ТЗ)
  // ---------------------------------------------------------------------------
  const duplicateCandidates = useMemo(() => {
    const titleQ = quickIdeaForm.name.trim().toLowerCase();
    const linkQ = quickIdeaForm.referenceLink.trim().toLowerCase();
    if (titleQ.length < 3 && linkQ.length < 5) return [];

    return accessibleConcepts.filter((c) => {
      if (linkQ.length >= 5) {
        const hasSameLink = (c.referenceLinks || []).some((l) =>
          l.toLowerCase().includes(linkQ)
        );
        if (hasSameLink) return true;
      }
      if (titleQ.length >= 3) {
        const words = titleQ.split(/\s+/).filter((w) => w.length >= 4);
        if (c.name.toLowerCase().includes(titleQ)) return true;
        if (words.some((w) => c.name.toLowerCase().includes(w))) return true;
      }
      return false;
    });
  }, [accessibleConcepts, quickIdeaForm.name, quickIdeaForm.referenceLink]);

  const stageToTabId = (st: SevenKanbanStage): RnDCardTabId => {
    switch (st) {
      case 'IDEA':
        return 'overview';
      case 'ANALYSIS':
        return 'analysis';
      case 'SAMPLE':
        return 'samples';
      case 'TEST':
        return 'testing';
      case 'DECISION':
        return 'decisions';
      case 'PRODUCTION':
        return 'production';
      case 'LAUNCH':
        return 'launch';
    }
  };

  const tabIdToStage = (tab: RnDCardTabId): SevenKanbanStage | null => {
    switch (tab) {
      case 'overview':
        return 'IDEA';
      case 'analysis':
        return 'ANALYSIS';
      case 'samples':
        return 'SAMPLE';
      case 'testing':
        return 'TEST';
      case 'decisions':
        return 'DECISION';
      case 'production':
        return 'PRODUCTION';
      case 'launch':
        return 'LAUNCH';
      default:
        return null;
    }
  };

  // Переход между этапами: сразу переключает экран этапа и переводит карточку
  const attemptStageTransition = (concept: ProductConcept, targetStage: ConceptStage) => {
    const norm = normalizeConceptStageToSeven(targetStage);
    setActiveCardTab(stageToTabId(norm));
    if (isStrategyMode) return;
    if (normalizeConceptStageToSeven(concept.stage) === norm) {
      return;
    }

    if (norm === 'PRODUCTION' && !canUserApproveProduction(currentUser, concept.brandId)) {
      notify(
        'warning',
        'Утвердить в производство может руководитель',
        'Вкладка производства открыта для просмотра'
      );
      return;
    }

    updateConceptStage(
      concept.id,
      targetStage,
      `Переход на этап «${CONCEPT_STAGE_LABELS_RU[targetStage]}»`
    );
  };

  const handleConfirmStageGateModal = () => {
    if (!stageGateModal) return;
    const { concept, targetStage, requiresManagerApproval } = stageGateModal;

    if (requiresManagerApproval && !canUserApproveProduction(currentUser, concept.brandId)) {
      notify(
        'error',
        'Переход заблокирован (п. 10 и 15 ТЗ)',
        'Простым перетаскиванием запрещено обходить утверждение производства. Обратитесь к Владельцу или руководителю бренда.'
      );
      return;
    }

    const normalizedTarget = normalizeConceptStageToSeven(targetStage);
    const patch: Partial<ProductConcept> = {
      stage: targetStage,
      ownerId: gateFillForm.ownerId || concept.ownerId,
      whatAttracted: gateFillForm.whatAttracted || concept.whatAttracted,
      ideaDescription: gateFillForm.whatAttracted || concept.ideaDescription,
      supplierName: gateFillForm.supplierName || concept.supplierName,
    };

    if (normalizedTarget === 'SAMPLE') {
      patch.analysisReport = {
        ...(concept.analysisReport || {
          whatWeCreate: '',
          targetBuyer: '',
          concreteAdvantage: '',
          whyChooseUs: '',
          demandType: 'incremental',
          marketEvidences: [],
          nicheConclusion: '',
          buyerMotives: '',
          competitorProsAndComplaints: '',
          priceBenchmarksAndObjections: '',
          potentialFactories: '',
          materialsAndMoq: '',
          estimatedProductionCostNote: '',
          estimatedLogisticsNote: '',
          estimatedLandedCostNote: '',
          productionRisks: '',
          summaryAndPros: '',
          openQuestionsAndRisks: '',
          confidenceLevel: 'medium',
          whatToVerifyOnSample: '',
          recommendation: 'continue',
        }),
        whatWeCreate: gateFillForm.hypothesis || 'Сформулированная гипотеза',
        openQuestionsAndRisks: gateFillForm.risks || 'Риски зафиксированы при переходе',
        recommendation: 'continue',
      };
    }

    if (normalizedTarget === 'PRODUCTION' && canUserApproveProduction(currentUser, concept.brandId)) {
      const nowTime = new Date().toISOString().slice(0, 16).replace('T', ' ');
      patch.approvalDecisions = [
        {
          id: `dec-${Date.now()}`,
          decision: 'approve',
          authorName: currentUser.fullName,
          authorRole: currentUser.role,
          decidedAt: nowTime,
          approvedSampleLabel:
            concept.samples?.[0]?.versionCode || `Версия v${concept.selectedDesignVersion}`,
          justification:
            gateFillForm.approvalJustification ||
            gateFillForm.exceptionReason ||
            'Утверждено руководителем при переходе на этап Производство',
          conditions: 'Стандартный контроль качества AQL 1.5',
        },
        ...(concept.approvalDecisions || []),
      ];
    }

    const nowTime = new Date().toISOString().slice(0, 16).replace('T', ' ');
    patch.stageHistory = [
      {
        id: `sh-${Date.now()}`,
        timestamp: nowTime,
        authorName: currentUser.fullName,
        authorRole: currentUser.role,
        actionType: gateFillForm.exceptionReason.trim()
          ? 'exception_override'
          : 'stage_change',
        fromStage: concept.stage,
        toStage: targetStage,
        reason: gateFillForm.exceptionReason.trim()
          ? `Мотивированное решение руководителя: ${gateFillForm.exceptionReason.trim()}`
          : `Дозаполнены обязательные данные и выполнен переход на этап «${CONCEPT_STAGE_LABELS_RU[targetStage]}»`,
      },
      ...(concept.stageHistory || []),
    ];

    updateConcept(concept.id, patch);
    setStageGateModal(null);
    notify('success', `Карточка переведена на этап «${CONCEPT_STAGE_LABELS_RU[targetStage]}»`);
  };

  // Быстрое создание новой идеи (Схема 3, п. 4.1 ТЗ)
  const handleQuickCreateIdea = () => {
    if (!quickIdeaForm.name.trim() && !quickIdeaForm.comment.trim()) {
      notify('warning', 'Укажите название или краткое описание продуктовой идеи');
      return;
    }
    const title =
      quickIdeaForm.name.trim() ||
      quickIdeaForm.comment.trim().slice(0, 60) ||
      'Новая продуктовая идея';

    const tags = quickIdeaForm.tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    createConcept({
      name: title,
      brandId: quickIdeaForm.brandId,
      stage: 'IDEA',
      developmentType: quickIdeaForm.developmentType,
      whatAttracted: quickIdeaForm.comment.trim() || title,
      ideaDescription: quickIdeaForm.comment.trim() || title,
      ownerId: quickIdeaForm.ownerId || currentUser.id,
      tags,
      referenceLinks: quickIdeaForm.referenceLink.trim()
        ? [quickIdeaForm.referenceLink.trim()]
        : [],
      imageUrl: quickIdeaForm.images[0] || undefined,
    });

    setQuickIdeaOpen(false);
    setQuickIdeaForm({
      brandId: brandFilter === 'NA_TELE' ? 'NA_TELE' : 'BORNERS',
      name: '',
      comment: '',
      referenceLink: '',
      developmentType: 'new_construction',
      ownerId: currentUser.id,
      tagsText: '',
      images: [],
    });
  };

  // Ручное объединение дубликата с существующей карточкой (п. 4.2 ТЗ)
  const handleMergeIntoExisting = (target: ProductConcept) => {
    const nowTime = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const mergedLinks = Array.from(
      new Set([
        ...(target.referenceLinks || []),
        ...(quickIdeaForm.referenceLink.trim() ? [quickIdeaForm.referenceLink.trim()] : []),
      ])
    );
    updateConcept(target.id, {
      referenceLinks: mergedLinks,
      comments: [
        ...target.comments,
        {
          id: `cm-merge-${Date.now()}`,
          authorName: currentUser.fullName,
          authorRole: currentUser.role,
          text: `[Объединено из новой идеи «${quickIdeaForm.name || 'без названия'}»]: ${
            quickIdeaForm.comment || 'Добавлена ссылка/материалы без создания дубликата'
          }`,
          createdAt: nowTime,
        },
      ],
      stageHistory: [
        {
          id: `sh-merge-${Date.now()}`,
          timestamp: nowTime,
          authorName: currentUser.fullName,
          authorRole: currentUser.role,
          actionType: 'stage_change',
          fromStage: target.stage,
          toStage: target.stage,
          reason: `Ручное объединение дублирующей идеи «${quickIdeaForm.name}» с сохранением всех ссылок и комментариев (п. 4.2 ТЗ).`,
        },
        ...(target.stageHistory || []),
      ],
    });
    setQuickIdeaOpen(false);
    setSelectedConceptId(target.id);
    notify(
      'success',
      `Объединено с карточкой ${target.code}`,
      'Все ссылки, комментарии и история сохранены без дублирования'
    );
  };

  const activeConcept: ProductConcept | null = useMemo(
    () => accessibleConcepts.find((c) => c.id === selectedConceptId) || null,
    [accessibleConcepts, selectedConceptId]
  );

  const canEditActiveConcept =
    !isStrategyMode &&
    activeConcept !== null &&
    canUserEditBrand(currentUser, activeConcept.brandId);
  return (
    <div className="space-y-6 pb-20">
      {/* =====================================================================
          ШАПКА ЛАБОРАТОРИИ R&D: СТРОГАЯ СИММЕТРИЯ В ОДНУ ЛИНИЮ
      ===================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E8E8E5] pb-5">
        <div>
          <h1 className="text-[28px] md:text-[32px] font-bold tracking-[-0.03em] text-[#171717] dark:text-white leading-tight">
            Лаборатория R&D
          </h1>
          <p className="text-[14px] text-[#737373] mt-0.5">
            Путь новинки по 7 этапам: от идеи и образца до запуска партии
          </p>
        </div>

        {/* Правая панель управления: Поиск + Вид + Новая идея (все ровно h-10) */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-60 sm:w-64">
            <Search className="h-4 w-4 text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск модели или ID..."
              className="w-full h-10 rounded-xl bg-white border border-[#E8E8E5] pl-9 pr-3.5 text-[13px] outline-none focus:border-[#171717]"
            />
          </div>

          <div className="flex items-center h-10 bg-white p-1 rounded-xl border border-[#E8E8E5]">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-semibold transition cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-[#111111] text-white'
                  : 'text-[#737373] hover:text-[#171717]'
              }`}
            >
              <Columns3 className="h-3.5 w-3.5" />
              <span>Доска</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-semibold transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#111111] text-white'
                  : 'text-[#737373] hover:text-[#171717]'
              }`}
            >
              <Table2 className="h-3.5 w-3.5" />
              <span>Таблица</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('gallery')}
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-semibold transition cursor-pointer ${
                viewMode === 'gallery'
                  ? 'bg-[#111111] text-white'
                  : 'text-[#737373] hover:text-[#171717]'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Галерея</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('archive')}
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-semibold transition cursor-pointer ${
                viewMode === 'archive'
                  ? 'bg-[#111111] text-white'
                  : 'text-[#737373] hover:text-[#171717]'
              }`}
            >
              <Archive className="h-3.5 w-3.5" />
              <span>Архив ({archivedOrDemoConcepts.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setQuickIdeaOpen(true)}
            className="inline-flex items-center gap-1.5 h-10 rounded-xl bg-[#D97745] hover:bg-[#C26535] text-white px-4 text-[13px] font-bold shadow-2xs transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Новая идея</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          4 СИММЕТРИЧНЫЕ КАРТОЧКИ СВОДКИ (ОДИНАКОВАЯ ВЫСОТА И СТРУКТУРА)
      ===================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#E8E8E5] bg-white p-5 flex items-center justify-between">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-wider text-[#737373]">
              Всего в работе
            </div>
            <div className="text-[28px] font-bold text-[#171717] mt-1">
              {labMetrics.totalActive}
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-[#F7F7F5] border border-[#E8E8E5] text-[12px] font-semibold text-[#737373]">
            7 этапов
          </span>
        </div>

        <div className="rounded-2xl border border-[#E8E8E5] bg-white p-5 flex items-center justify-between">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-wider text-[#737373]">
              Идеи и Анализ
            </div>
            <div className="text-[28px] font-bold text-[#171717] mt-1">
              {labMetrics.ideasAndAnalysis}
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-[#F7F7F5] border border-[#E8E8E5] text-[12px] font-semibold text-[#737373]">
            Этапы 01–02
          </span>
        </div>

        <div className="rounded-2xl border border-[#E8E8E5] bg-white p-5 flex items-center justify-between">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-wider text-[#737373]">
              Образцы и Тесты
            </div>
            <div className="text-[28px] font-bold text-[#171717] mt-1">
              {labMetrics.samplesInCheck}
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-[#F7F7F5] border border-[#E8E8E5] text-[12px] font-semibold text-[#737373]">
            Этапы 03–04
          </span>
        </div>

        <div className="rounded-2xl border border-[#E8E8E5] bg-white p-5 flex items-center justify-between">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-wider text-[#D97745]">
              Решение и Тираж
            </div>
            <div className="text-[28px] font-bold text-[#171717] mt-1">
              {labMetrics.awaitingDecision +
                labMetrics.upcomingLaunches +
                labMetrics.delayedProductions}
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-[#D97745]/10 text-[12px] font-bold text-[#D97745]">
            Этапы 05–07
          </span>
        </div>
      </div>

      {/* =====================================================================
          ДОСКА KANBAN ИЗ 7 СИММЕТРИЧНЫХ КОЛОНОК
      ===================================================================== */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-6">
          {SEVEN_KANBAN_STAGES.map((stage) => {
            const stageMeta = STAGE_SUBTITLES[stage];
            const stageCards = filteredConcepts.filter(
              (c) => normalizeConceptStageToSeven(c.stage) === stage
            );
            const isDropTarget = dragOverStage === stage;

            return (
              <div
                key={stage}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverStage !== stage) setDragOverStage(stage);
                }}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  const cid = e.dataTransfer.getData('text/plain') || draggedConceptId;
                  setDraggedConceptId(null);
                  setDragOverStage(null);
                  if (!cid) return;
                  const card = accessibleConcepts.find((c) => c.id === cid);
                  if (card) {
                    attemptStageTransition(card, stage);
                  }
                }}
                className={`w-[280px] shrink-0 rounded-2xl p-3.5 min-h-[540px] flex flex-col border transition-all ${
                  isDropTarget
                    ? 'bg-white border-2 border-[#D97745] shadow-lg'
                    : 'bg-[#F7F7F5] border-[#E8E8E5]'
                }`}
              >
                {/* Заголовок колонки: строгая симметрия */}
                <div className="flex items-center justify-between mb-3.5 pb-3 border-b border-[#E8E8E5]">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-[#111111] text-white text-[11px] font-bold flex items-center justify-center">
                      {stageMeta.num}
                    </span>
                    <div>
                      <div className="text-[13px] font-bold tracking-tight text-[#171717] leading-none">
                        {stageMeta.title}
                      </div>
                      <div className="text-[11px] text-[#737373] mt-0.5">
                        {stageMeta.subtitle}
                      </div>
                    </div>
                  </div>
                  <span className="w-6 h-6 rounded-lg bg-white border border-[#E8E8E5] text-[12px] font-bold text-[#171717] flex items-center justify-center">
                    {stageCards.length}
                  </span>
                </div>

                {/* Карточки: одинаковая высота и структура для идеальной симметрии */}
                <div className="space-y-3 flex-1">
                  {stageCards.map((card) => {
                    const isBorners = card.brandId === 'BORNERS';
                    const owner = users.find((u) => u.id === card.ownerId);

                    return (
                      <div
                        key={card.id}
                        draggable
                        onDragStart={(e) => {
                          setDraggedConceptId(card.id);
                          e.dataTransfer.setData('text/plain', card.id);
                        }}
                        onDragEnd={() => {
                          setDraggedConceptId(null);
                          setDragOverStage(null);
                        }}
                        onClick={() => {
                          setSelectedConceptId(card.id);
                          setActiveCardTab(
                            stage === 'ANALYSIS'
                              ? 'analysis'
                              : stage === 'SAMPLE'
                              ? 'samples'
                              : stage === 'TEST'
                              ? 'testing'
                              : stage === 'DECISION'
                              ? 'decisions'
                              : stage === 'PRODUCTION'
                              ? 'production'
                              : stage === 'LAUNCH'
                              ? 'launch'
                              : 'overview'
                          );
                        }}
                        className="bg-white rounded-xl border border-[#E8E8E5] hover:border-[#171717] p-3.5 flex flex-col justify-between gap-3 cursor-pointer transition group shadow-2xs"
                      >
                        {/* Верхняя строка: Бренд + ID слева, Кнопка удаления справа */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold">
                            <span
                              className="px-2 py-0.5 rounded-md text-white"
                              style={{
                                backgroundColor: isBorners ? '#D97745' : '#8B8078',
                              }}
                            >
                              {isBorners ? 'BORNERS' : 'НА ТЕЛЕ'}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-md bg-[#F7F7F5] border border-[#E8E8E5] text-[#737373]">
                              {card.code}
                            </span>
                          </div>

                          <button
                            type="button"
                            title="Удалить карточку"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConcept(card.id);
                            }}
                            className="p-1.5 rounded-lg text-[#737373] hover:text-[#DC2626] hover:bg-[#DC2626]/10 cursor-pointer transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Центр: Симметричное превью фото + Название (ровно 2 строки) */}
                        <div className="space-y-2.5">
                          <div className="h-28 w-full rounded-lg bg-[#F7F7F5] border border-[#E8E8E5] p-2 flex items-center justify-center">
                            <img
                              src={card.imageUrl}
                              alt={card.name}
                              className="max-h-24 w-full object-contain"
                            />
                          </div>

                          <div className="text-[14px] font-bold text-[#171717] group-hover:text-[#D97745] transition leading-snug line-clamp-2 min-h-[38px]">
                            {card.name}
                          </div>
                        </div>

                        {/* Нижняя строка: Ответственный и Дата */}
                        <div className="flex items-center justify-between pt-2.5 border-t border-[#E8E8E5] text-[11px] text-[#737373]">
                          <span className="font-semibold text-[#171717] truncate max-w-[130px]">
                            {owner ? owner.fullName : 'Не назначен'}
                          </span>
                          <span className="shrink-0">
                            {card.targetLaunchDate || 'Без срока'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =====================================================================
          РЕЖИМ 2: ТАБЛИЦА — СРАВНЕНИЕ И МАССОВАЯ РАБОТА (П. 3.2 ТЗ)
      ===================================================================== */}
      {viewMode === 'table' && (
        <div className="rounded-2xl border border-[#E8E8E5] bg-white overflow-x-auto">
          <table className="w-full text-left border-collapse text-[14px]">
            <thead>
              <tr className="bg-[#F7F7F5] border-b border-[#E8E8E5] text-[12px] uppercase text-[#737373]">
                <th className="p-4">ID и Модель</th>
                <th className="p-4">Бренд</th>
                <th className="p-4">Тип разработки</th>
                <th className="p-4">Этап (1–7)</th>
                <th className="p-4">Образцы / Тесты</th>
                <th className="p-4">Ответственный</th>
                <th className="p-4">Следующий шаг</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E5]">
              {filteredConcepts.map((c) => {
                const owner = users.find((u) => u.id === c.ownerId);
                return (
                  <tr
                    key={c.id}
                    onClick={() => {
                      setSelectedConceptId(c.id);
                      setActiveCardTab('overview');
                    }}
                    className="hover:bg-[#F7F7F5]/60 cursor-pointer transition"
                  >
                    <td className="p-4">
                      <div className="font-bold text-[#171717]">
                        {c.code} · {c.name}
                      </div>
                      <div className="text-[12px] text-[#737373] line-clamp-1">
                        {c.ideaDescription}
                      </div>
                    </td>
                    <td className="p-4 font-bold">
                      <span
                        style={{
                          color: c.brandId === 'BORNERS' ? '#D97745' : '#8B8078',
                        }}
                      >
                        {c.brandId === 'BORNERS' ? 'BORNERS' : 'НА ТЕЛЕ'}
                      </span>
                    </td>
                    <td className="p-4 text-[13px]">
                      {
                        RND_DEVELOPMENT_TYPE_LABELS_RU[
                          c.developmentType || 'new_construction'
                        ]
                      }
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-lg bg-[#F7F7F5] border border-[#E8E8E5] text-[12px] font-bold">
                        {CONCEPT_STAGE_LABELS_RU[c.stage]}
                      </span>
                    </td>
                    <td className="p-4 text-[13px]">
                      Образцов: <b>{c.samples?.length || 0}</b> · Тестов:{' '}
                      <b>{c.testProtocols?.length || 0}</b>
                    </td>
                    <td className="p-4 text-[13px] font-medium">
                      {owner?.fullName || '—'}
                    </td>
                    <td className="p-4 text-[13px] text-[#737373] max-w-xs truncate">
                      {c.nextStep || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* =====================================================================
          РЕЖИМ 3: ГАЛЕРЕЯ — ИДЕИ С ПРИОРИТЕТОМ ФОТОГРАФИЙ (П. 3.2 ТЗ)
      ===================================================================== */}
      {viewMode === 'gallery' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredConcepts.map((c) => (
            <div
              key={c.id}
              onClick={() => {
                setSelectedConceptId(c.id);
                setActiveCardTab('overview');
              }}
              className="rounded-2xl border border-[#E8E8E5] hover:border-[#171717] bg-white p-6 space-y-4 cursor-pointer transition group"
            >
              <div className="h-56 w-full rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] flex items-center justify-center p-6">
                <img
                  src={c.imageUrl}
                  alt={c.name}
                  className="h-full w-full object-contain group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="flex items-center justify-between text-[12px] font-bold">
                <span
                  style={{ color: c.brandId === 'BORNERS' ? '#D97745' : '#8B8078' }}
                >
                  {c.brandId === 'BORNERS' ? 'BORNERS' : 'НА ТЕЛЕ'} · {c.code}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#F7F7F5] border border-[#E8E8E5] text-[#171717]">
                  {CONCEPT_STAGE_LABELS_RU[c.stage]}
                </span>
              </div>
              <div>
                <h3 className="text-[19px] font-bold text-[#171717]">{c.name}</h3>
                <p className="text-[13px] text-[#737373] mt-1 line-clamp-2">
                  {c.ideaDescription}
                </p>
              </div>
              {c.nextStep && (
                <div className="pt-3 border-t border-[#E8E8E5] text-[13px]">
                  <span className="text-[#737373]">Следующий шаг: </span>
                  <b className="text-[#171717]">{c.nextStep}</b>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* =====================================================================
          РЕЖИМ 4: АРХИВ И ДЕМО-ЗАПИСИ (П. 3.2 И 21 ТЗ)
      ===================================================================== */}
      {viewMode === 'archive' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#E8E8E5] bg-[#F7F7F5] p-5 text-[14px]">
            <b>Архив и отделённые демонстрационные записи (п. 3.2 и 21 ТЗ):</b> Здесь хранятся отложенные, отклонённые разработки, а также демонстрационные капсулы из первой версии интерфейса (отделены от реальных разработок без удаления файлов). Любую карточку можно возобновить в 1 клик.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredConcepts.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-[#E8E8E5] bg-white p-5 flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[12px] font-bold">
                    <span>{c.code}</span>
                    {c.isDemo && (
                      <span className="px-2 py-0.5 rounded bg-[#D97745]/15 text-[#D97745]">
                        ДЕМО-АРХИВ (п. 21 ТЗ)
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E8E8E5]">
                      {CONCEPT_STAGE_LABELS_RU[c.stage]}
                    </span>
                  </div>
                  <div className="text-[17px] font-bold text-[#171717]">{c.name}</div>
                  <p className="text-[13px] text-[#737373]">{c.ideaDescription}</p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedConceptId(c.id);
                      setActiveCardTab('overview');
                    }}
                    className="px-3.5 py-2 rounded-xl border border-[#E8E8E5] text-[13px] font-semibold cursor-pointer"
                  >
                    Открыть
                  </button>
                  {!isStrategyMode && (
                    <button
                      type="button"
                      onClick={() => {
                        updateConcept(c.id, {
                          isArchived: false,
                          isDemo: false,
                          stage: 'IDEA',
                        });
                        notify(
                          'success',
                          `Карточка ${c.code} возобновлена на этап «01 · Идея»`
                        );
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#111111] text-white text-[13px] font-semibold cursor-pointer"
                    >
                      Возобновить в Идеи
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          5. ЕДИНАЯ КАРТОЧКА РАЗРАБОТКИ С 9 ВКЛАДКАМИ (П. 5–18 ТЗ)
      ===================================================================== */}
      {activeConcept && (
        <div
          onClick={() => setSelectedConceptId(null)}
          className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-[1px]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl bg-white dark:bg-zinc-900 h-full overflow-y-auto p-6 md:p-9 space-y-6 shadow-2xl border-l border-[#E8E8E5]"
          >
            {/* Шапка карточки: название, бренд, статус, ответственный, следующий шаг (п. 5 ТЗ) */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E8E8E5] pb-5">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-[12px] font-bold">
                  <span className="px-2.5 py-1 rounded-md bg-[#111111] text-white">
                    {activeConcept.code}
                  </span>
                  <span
                    className="px-2.5 py-1 rounded-md text-white"
                    style={{
                      backgroundColor:
                        activeConcept.brandId === 'BORNERS' ? '#D97745' : '#8B8078',
                    }}
                  >
                    {activeConcept.brandId === 'BORNERS' ? 'BORNERS' : 'НА ТЕЛЕ'}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-[#F7F7F5] border border-[#E8E8E5] text-[#171717]">
                    {
                      RND_DEVELOPMENT_TYPE_LABELS_RU[
                        activeConcept.developmentType || 'new_construction'
                      ]
                    }
                  </span>
                  {activeConcept.isBlocked && (
                    <span className="px-2.5 py-1 rounded-md bg-[#DC2626] text-white">
                      Заблокировано: {activeConcept.blockReason || 'Пауза'}
                    </span>
                  )}
                </div>
                <h2 className="text-[26px] md:text-[30px] font-bold text-[#171717] dark:text-white leading-tight">
                  {activeConcept.name}
                </h2>
                {activeConcept.nextStep && (
                  <div className="text-[13px] text-[#737373]">
                    Следующий шаг:{' '}
                    <b className="text-[#171717]">{activeConcept.nextStep}</b>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!isStrategyMode && (
                  <button
                    type="button"
                    onClick={() => deleteConcept(activeConcept.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#DC2626]/30 bg-[#DC2626]/10 hover:bg-[#DC2626] text-[#DC2626] hover:text-white px-3.5 py-2.5 text-[13px] font-bold transition cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Удалить карточку</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedConceptId(null)}
                  className="rounded-xl border border-[#E8E8E5] p-2.5 text-[#171717] hover:bg-[#111111] hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Единая панель этапов и разделов карточки: клик сразу меняет экран и этап */}
            <div className="rounded-2xl bg-[#F7F7F5] border border-[#E8E8E5] p-2 space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-7 gap-1.5">
                {SEVEN_KANBAN_STAGES.map((st) => {
                  const tabForStage = stageToTabId(st);
                  const isTabOpen = activeCardTab === tabForStage;
                  const isCurrentStage =
                    normalizeConceptStageToSeven(activeConcept.stage) === st;
                  const meta = STAGE_SUBTITLES[st];

                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        setActiveCardTab(tabForStage);
                        if (!isStrategyMode && !isCurrentStage) {
                          attemptStageTransition(activeConcept, st);
                        }
                      }}
                      className={`p-2.5 rounded-xl text-left border transition cursor-pointer ${
                        isTabOpen
                          ? 'bg-[#111111] text-white border-[#111111] shadow-xs'
                          : isCurrentStage
                          ? 'bg-white text-[#171717] border-[#D97745]'
                          : 'bg-white text-[#171717] border-[#E8E8E5] hover:border-[#171717]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-[10px] font-bold ${
                            isTabOpen || isCurrentStage ? 'text-[#D97745]' : 'text-[#737373]'
                          }`}
                        >
                          {meta.num}
                        </span>
                        {isCurrentStage && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#D97745]" />
                        )}
                      </div>
                      <div className="text-[12px] font-bold truncate mt-0.5">
                        {meta.title}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveCardTab('files')}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer transition ${
                    activeCardTab === 'files'
                      ? 'bg-[#111111] text-white'
                      : 'bg-white border border-[#E8E8E5] text-[#737373] hover:text-[#171717]'
                  }`}
                >
                  Комментарии ({activeConcept.comments?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCardTab('history')}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer transition ${
                    activeCardTab === 'history'
                      ? 'bg-[#111111] text-white'
                      : 'bg-white border border-[#E8E8E5] text-[#737373] hover:text-[#171717]'
                  }`}
                >
                  История этапов
                </button>
              </div>
            </div>

            {/* Содержимое активной вкладки */}
            <ProductLabCardBody
              concept={activeConcept}
              activeTab={activeCardTab}
              canEdit={canEditActiveConcept}
              isStrategyMode={isStrategyMode}
              currentUser={currentUser}
              users={users}
              products={products}
              launches={launches}
              tasks={tasks}
              competitors={competitors}
              onUpdateConcept={updateConcept}
              onChangeStageWithGate={attemptStageTransition}
              onCreateLaunchFromConcept={(c) => {
                const created = createLaunch({
                  name: `Запуск R&D: ${c.name}`,
                  brandId: c.brandId,
                  collectionName: c.collectionName,
                  conceptId: c.id,
                  startDate: c.targetLaunchDate || '2027-03-01',
                  marketingBudgetRub: 450000,
                  salesPlanUnits: 2500,
                  salesPlanRub: 2500 * (c.plannedRetailPrice || 1890),
                  ownerId: c.ownerId || currentUser.id,
                });
                updateConcept(c.id, { linkedLaunchId: created.id });
                setSelectedConceptId(null);
                navigateTo('launch-calendar', { launchId: created.id });
              }}
              onCreateProductFromConcept={(cid) => {
                createProductFromConcept(cid);
              }}
              onCreateTaskForConcept={(title, assigneeId, deadline) => {
                createTask({
                  title,
                  brandId: activeConcept.brandId,
                  conceptId: activeConcept.id,
                  assigneeId,
                  priority: 'High',
                  deadline,
                });
              }}
              onNavigateToSection={(sec, opts) => {
                setSelectedConceptId(null);
                navigateTo(sec, opts);
              }}
              notify={notify}
            />
          </div>
        </div>
      )}

      {/* =====================================================================
          4. МОДАЛЬНОЕ ОКНО БЫСТРОГО СОЗДАНИЯ НОВОЙ ИДЕИ (СХЕМА 3, П. 4.1–4.2 ТЗ)
      ===================================================================== */}
      {quickIdeaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            onPaste={(e) => {
              const items = Array.from(e.clipboardData?.items || []);
              items.forEach((item) => {
                if (item.type.startsWith('image/')) {
                  const file = item.getAsFile();
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    if (typeof reader.result === 'string') {
                      setQuickIdeaForm((prev) => ({
                        ...prev,
                        images: [...prev.images, reader.result as string],
                      }));
                      notify('success', 'Скриншот вставлен из буфера обмена');
                    }
                  };
                  reader.readAsDataURL(file);
                }
              });
            }}
            className="w-full max-w-2xl bg-white rounded-3xl border border-[#E8E8E5] p-7 md:p-8 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-[#E8E8E5] pb-4">
              <div>
                <h3 className="text-[24px] font-bold text-[#171717]">
                  Новая продуктовая идея
                </h3>
                <p className="text-[13px] text-[#737373]">
                  Схема 3 ТЗ: минимум действий на входе — обязательны только бренд и название/описание (без требования себестоимости и фабрики)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleQuickCreateIdea}
                  className="h-10 px-5 rounded-full bg-[#D97745] hover:bg-[#C26535] text-white text-[13px] font-bold uppercase tracking-wider cursor-pointer"
                >
                  СОХРАНИТЬ
                </button>
                <button
                  type="button"
                  onClick={() => setQuickIdeaOpen(false)}
                  className="p-2 rounded-xl border border-[#E8E8E5] text-[#737373] hover:text-[#171717] cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4 text-[14px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#737373] mb-1">
                    Бренд (обязательно)
                  </label>
                  <select
                    value={quickIdeaForm.brandId}
                    onChange={(e) =>
                      setQuickIdeaForm({ ...quickIdeaForm, brandId: e.target.value })
                    }
                    className="w-full h-11 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] px-3.5 font-bold"
                  >
                    <option value="BORNERS">BORNERS</option>
                    <option value="NA_TELE">НА ТЕЛЕ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-[#737373] mb-1">
                    Тип разработки (опционально)
                  </label>
                  <select
                    value={quickIdeaForm.developmentType}
                    onChange={(e) =>
                      setQuickIdeaForm({
                        ...quickIdeaForm,
                        developmentType: e.target.value as RnDDevelopmentType,
                      })
                    }
                    className="w-full h-11 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] px-3.5 font-semibold"
                  >
                    {Object.entries(RND_DEVELOPMENT_TYPE_LABELS_RU).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#737373] mb-1">
                  Название
                </label>
                <input
                  value={quickIdeaForm.name}
                  onChange={(e) =>
                    setQuickIdeaForm({ ...quickIdeaForm, name: e.target.value })
                  }
                  placeholder="Напр.: Свободные трусы в эстетике Old Money"
                  className="w-full h-11 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] px-4 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#737373] mb-1">
                  Комментарий / суть идеи
                </label>
                <textarea
                  rows={2}
                  value={quickIdeaForm.comment}
                  onChange={(e) =>
                    setQuickIdeaForm({ ...quickIdeaForm, comment: e.target.value })
                  }
                  placeholder="Изучить посадку, резинку, материалы и доступную цену"
                  className="w-full rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] p-3.5"
                />
              </div>

              {/* 4.2 Проверка дубликатов с кнопкой ручного объединения */}
              {duplicateCandidates.length > 0 && (
                <div className="rounded-2xl border border-[#D97745] bg-[#D97745]/10 p-4 space-y-2.5 text-[13px]">
                  <div className="font-bold text-[#171717]">
                    Найдены возможные совпадения в базе (п. 4.2 ТЗ «Дубликаты»):
                  </div>
                  {duplicateCandidates.map((dup) => (
                    <div
                      key={dup.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3 border border-[#E8E8E5]"
                    >
                      <div>
                        <span className="font-bold text-[#171717]">
                          {dup.code} · {dup.name}
                        </span>
                        <span className="text-[12px] text-[#737373] ml-2">
                          ({CONCEPT_STAGE_LABELS_RU[dup.stage]})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleMergeIntoExisting(dup)}
                        className="px-3 py-1.5 rounded-lg bg-[#111111] text-white text-[12px] font-semibold cursor-pointer"
                      >
                        Объединить с этой карточкой
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-[#737373] mb-1">
                    Ссылка на WB / Ozon / соцсети (сохраняется всегда)
                  </label>
                  <input
                    value={quickIdeaForm.referenceLink}
                    onChange={(e) =>
                      setQuickIdeaForm({
                        ...quickIdeaForm,
                        referenceLink: e.target.value,
                      })
                    }
                    placeholder="https://www.wildberries.ru/catalog/..."
                    className="w-full h-10 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] px-3"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#737373] mb-1">
                    Теги через запятую (опционально)
                  </label>
                  <input
                    value={quickIdeaForm.tagsText}
                    onChange={(e) =>
                      setQuickIdeaForm({ ...quickIdeaForm, tagsText: e.target.value })
                    }
                    placeholder="Old Money, хлопок, Узбекистан"
                    className="w-full h-10 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] px-3"
                  />
                </div>
              </div>

              {/* Зона множественной загрузки, drag-and-drop и вставки из буфера обмена (Схема 3 ТЗ) */}
              <label className="block rounded-2xl border-2 border-dashed border-[#E8E8E5] hover:border-[#D97745] bg-[#F7F7F5]/60 p-5 text-center cursor-pointer transition">
                <div className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#737373]">
                  <Upload className="h-4 w-4 text-[#D97745]" />
                  <span>
                    + Фото / скриншоты / видео / перетащите файлы или нажмите Cmd+V (из буфера)
                  </span>
                </div>
                {quickIdeaForm.images.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 mt-3">
                    {quickIdeaForm.images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt="preview"
                        className="h-14 w-14 rounded-lg object-cover border border-[#E8E8E5] bg-white"
                      />
                    ))}
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    files.forEach((f) => {
                      const r = new FileReader();
                      r.onload = () => {
                        if (typeof r.result === 'string') {
                          setQuickIdeaForm((prev) => ({
                            ...prev,
                            images: [...prev.images, r.result as string],
                          }));
                        }
                      };
                      r.readAsDataURL(f);
                    });
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          15. ДИАЛОГОВОЕ ОКНО КОНТРОЛЯ ПЕРЕХОДА МЕЖДУ ЭТАПАМИ (STAGE GATE MODAL)
      ===================================================================== */}
      {stageGateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl bg-white rounded-3xl border border-[#E8E8E5] p-7 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-[#E8E8E5] pb-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#D97745]">
                  Контрольная точка перехода (п. 15 ТЗ)
                </div>
                <h3 className="text-[20px] font-bold text-[#171717] mt-0.5">
                  Переход на этап «{CONCEPT_STAGE_LABELS_RU[stageGateModal.targetStage]}»
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setStageGateModal(null)}
                className="p-2 rounded-xl border border-[#E8E8E5] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-xl bg-[#D97745]/10 border border-[#D97745]/30 p-4 space-y-1.5 text-[13px]">
              <div className="font-bold text-[#171717]">
                Для перехода требуется проверить и дополнить следующие условия:
              </div>
              {stageGateModal.missingFields.map((mf, i) => (
                <div key={i} className="text-[#171717]">
                  • {mf}
                </div>
              ))}
            </div>

            {stageGateModal.requiresManagerApproval &&
            !canUserApproveProduction(currentUser, stageGateModal.concept.brandId) ? (
              <div className="rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/30 p-4 text-[13px] text-[#DC2626] font-semibold">
                Ваша роль ({ROLE_LABELS_RU[currentUser.role]}) не позволяет утверждать передачу в производство. Простым перетаскиванием запрещено обходить утверждение руководителя (п. 15 и Критерий 05 ТЗ).
              </div>
            ) : (
              <div className="space-y-3 text-[14px]">
                <div className="font-bold text-[#171717]">
                  Дозаполнить недостающие данные прямо в окне:
                </div>

                {normalizeConceptStageToSeven(stageGateModal.targetStage) === 'ANALYSIS' && (
                  <>
                    <div>
                      <label className="block text-[12px] font-semibold mb-1">
                        Ответственный за разработку
                      </label>
                      <select
                        value={gateFillForm.ownerId}
                        onChange={(e) =>
                          setGateFillForm({ ...gateFillForm, ownerId: e.target.value })
                        }
                        className="w-full h-10 rounded-xl border border-[#E8E8E5] px-3 bg-white font-semibold"
                      >
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.fullName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold mb-1">
                        Суть идеи / что привлекло внимание
                      </label>
                      <input
                        value={gateFillForm.whatAttracted}
                        onChange={(e) =>
                          setGateFillForm({ ...gateFillForm, whatAttracted: e.target.value })
                        }
                        className="w-full h-10 rounded-xl border border-[#E8E8E5] px-3"
                      />
                    </div>
                  </>
                )}

                {normalizeConceptStageToSeven(stageGateModal.targetStage) === 'SAMPLE' && (
                  <>
                    <div>
                      <label className="block text-[12px] font-semibold mb-1">
                        Продуктовая гипотеза
                      </label>
                      <input
                        value={gateFillForm.hypothesis}
                        onChange={(e) =>
                          setGateFillForm({ ...gateFillForm, hypothesis: e.target.value })
                        }
                        placeholder="Что создаём и в чём преимущество..."
                        className="w-full h-10 rounded-xl border border-[#E8E8E5] px-3"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold mb-1">
                        Ключевые риски
                      </label>
                      <input
                        value={gateFillForm.risks}
                        onChange={(e) =>
                          setGateFillForm({ ...gateFillForm, risks: e.target.value })
                        }
                        placeholder="Что необходимо проверить на образце..."
                        className="w-full h-10 rounded-xl border border-[#E8E8E5] px-3"
                      />
                    </div>
                  </>
                )}

                {normalizeConceptStageToSeven(stageGateModal.targetStage) ===
                  'PRODUCTION' && (
                  <>
                    <div>
                      <label className="block text-[12px] font-semibold mb-1">
                        Утверждённая фабрика-производитель
                      </label>
                      <input
                        value={gateFillForm.supplierName}
                        onChange={(e) =>
                          setGateFillForm({ ...gateFillForm, supplierName: e.target.value })
                        }
                        placeholder="Напр.: Фабрика A (Гуандун, КНР)"
                        className="w-full h-10 rounded-xl border border-[#E8E8E5] px-3"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold mb-1">
                        Обоснование утверждения руководителем
                      </label>
                      <input
                        value={gateFillForm.approvalJustification}
                        onChange={(e) =>
                          setGateFillForm({
                            ...gateFillForm,
                            approvalJustification: e.target.value,
                          })
                        }
                        placeholder="Образец проверен, себестоимость и посадка согласованы..."
                        className="w-full h-10 rounded-xl border border-[#E8E8E5] px-3"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[12px] font-semibold text-[#737373] mb-1">
                    Комментарий к переходу / причина мотивированного исключения руководителя
                  </label>
                  <input
                    value={gateFillForm.exceptionReason}
                    onChange={(e) =>
                      setGateFillForm({ ...gateFillForm, exceptionReason: e.target.value })
                    }
                    placeholder="Запишется в неизменяемую историю карточки..."
                    className="w-full h-10 rounded-xl border border-[#E8E8E5] px-3"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-[#E8E8E5]">
              <button
                type="button"
                onClick={() => setStageGateModal(null)}
                className="h-10 px-4 rounded-xl border border-[#E8E8E5] text-[13px] font-semibold cursor-pointer"
              >
                Отмена
              </button>
              {(!stageGateModal.requiresManagerApproval ||
                canUserApproveProduction(currentUser, stageGateModal.concept.brandId)) && (
                <button
                  type="button"
                  onClick={handleConfirmStageGateModal}
                  className="h-10 px-5 rounded-xl bg-[#111111] text-white text-[13px] font-bold cursor-pointer"
                >
                  Сохранить данные и перевести этап →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
