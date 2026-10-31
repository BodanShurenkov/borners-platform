'use client';

import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Columns3,
  LayoutGrid,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  Upload,
  X,
  ZoomIn,
} from 'lucide-react';
import { usePlatform } from '@/context/PlatformContext';
import {
  ConceptStage,
  ProductConcept,
  RnDDevelopmentType,
} from '@/types/platform';
import {
  CONCEPT_STAGE_LABELS_RU,
  RND_DEVELOPMENT_TYPE_LABELS_RU,
  SEVEN_KANBAN_STAGES,
  SevenKanbanStage,
  canUserApproveProduction,
  canUserEditBrand,
  validateRnDStageTransition,
  normalizeConceptStageToSeven,
} from '@/lib/finance';
import {
  ProductLabCardBody,
  RND_CARD_TABS,
  RnDCardTabId,
} from '@/components/sections/ProductLabTabs';

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
    selectedConceptId,
    setSelectedConceptId,
    navigateTo,
    createConcept,
    updateConcept,
    updateConceptStage,
    deleteConcept,
    createProductFromConcept,
    createLaunch,
    createTask,
    notify,
  } = usePlatform();

  const isStrategyMode = false;

  const [viewMode, setViewMode] = useState<'kanban' | 'gallery'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('ALL');

  const [draggedConceptId, setDraggedConceptId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<SevenKanbanStage | null>(null);
  const [isDraggingPhotoOverCard, setIsDraggingPhotoOverCard] = useState(false);

  // Вкладка внутри открытой карточки (7 этапов + История)
  const [activeCardTab, setActiveCardTab] = useState<RnDCardTabId>('overview');

  // Индекс выбранного фото в галерее карточки и зум-лайтбокс
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [zoomPhotoUrl, setZoomPhotoUrl] = useState<string | null>(null);

  // Быстрое создание новой идеи (за 30–60 секунд, Стр. 2 и 4 PDF)
  const [quickIdeaOpen, setQuickIdeaOpen] = useState(false);
  const [quickIdeaForm, setQuickIdeaForm] = useState<{
    brandId: string;
    name: string;
    comment: string;
    referenceLink: string;
    developmentType: RnDDevelopmentType;
    ownerId: string;
    targetLaunchDate: string;
    images: string[];
  }>({
    brandId: brandFilter === 'NA_TELE' ? 'NA_TELE' : 'BORNERS',
    name: '',
    comment: '',
    referenceLink: '',
    developmentType: 'new_construction',
    ownerId: currentUser.id,
    targetLaunchDate: '2027-01-15',
    images: [],
  });

  // Короткая проверка перед сменой этапа (Стр. 3 и Сценарий №3 PDF)
  const [stageGateModal, setStageGateModal] = useState<{
    concept: ProductConcept;
    targetStage: ConceptStage;
    missingFields: string[];
    requiresManagerApproval: boolean;
  } | null>(null);

  const [gateFillForm, setGateFillForm] = useState({
    ownerId: currentUser.id,
    whatAttracted: '',
    hypothesis: '',
    risks: '',
    supplierName: '',
    approvalJustification: '',
  });

  const accessibleConcepts = useMemo(() => {
    return concepts.filter((c) => {
      if (c.isArchived) return false;
      if (brandFilter !== 'ALL' && c.brandId !== brandFilter) return false;
      return true;
    });
  }, [concepts, brandFilter]);

  const filteredConcepts = useMemo(() => {
    return accessibleConcepts.filter((c) => {
      const normStage = normalizeConceptStageToSeven(c.stage);
      if (stageFilter !== 'ALL' && normStage !== stageFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesText =
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.ideaDescription.toLowerCase().includes(q) ||
          (c.whatAttracted || '').toLowerCase().includes(q);
        if (!matchesText) return false;
      }
      return true;
    });
  }, [accessibleConcepts, stageFilter, searchQuery]);

  const getUserFullName = (id?: string) =>
    users.find((u) => u.id === id)?.fullName || 'Алексей Морозов';

  const getUserShortName = (id?: string) => {
    const full = getUserFullName(id);
    return full.split(' ')[0] || full;
  };

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

  const openConceptCard = (concept: ProductConcept, tab?: RnDCardTabId) => {
    setSelectedConceptId(concept.id);
    setActivePhotoIndex(0);
    const norm = normalizeConceptStageToSeven(concept.stage);
    setActiveCardTab(tab || stageToTabId(norm));
  };

  // Короткая проверка перед сменой этапа (Стр. 3 и Сценарий №3 PDF)
  const attemptStageTransition = (concept: ProductConcept, targetStage: ConceptStage) => {
    const normTarget = normalizeConceptStageToSeven(targetStage);
    const normCurrent = normalizeConceptStageToSeven(concept.stage);

    if (normCurrent === normTarget && targetStage !== 'REJECTED') {
      setActiveCardTab(stageToTabId(normTarget));
      return;
    }

    const check = validateRnDStageTransition(concept, targetStage, currentUser);
    if (!check.allowed) {
      setGateFillForm({
        ownerId: concept.ownerId || currentUser.id,
        whatAttracted: concept.whatAttracted || concept.ideaDescription || '',
        hypothesis:
          concept.analysisReport?.whatWeCreate ||
          concept.whatAttracted ||
          concept.ideaDescription ||
          '',
        risks:
          concept.analysisReport?.openQuestionsAndRisks ||
          'Проверить посадку и усадку после стирки',
        supplierName: concept.supplierName || 'Ташкент Текстиль №1 (Узбекистан)',
        approvalJustification: 'Образец и тесты проверены, утверждено в производство',
      });
      setStageGateModal({
        concept,
        targetStage,
        missingFields: check.missingFields,
        requiresManagerApproval: check.requiresManagerApproval,
      });
      return;
    }

    updateConceptStage(
      concept.id,
      targetStage,
      `Переход на этап «${CONCEPT_STAGE_LABELS_RU[targetStage]}»`
    );
    setActiveCardTab(stageToTabId(normTarget));
  };

  const handleConfirmStageGateModal = () => {
    if (!stageGateModal) return;
    const { concept, targetStage, requiresManagerApproval } = stageGateModal;

    if (requiresManagerApproval && !canUserApproveProduction(currentUser, concept.brandId)) {
      notify(
        'error',
        'Утвердить передачу в производство может только руководитель'
      );
      return;
    }

    const normalizedTarget = normalizeConceptStageToSeven(targetStage);
    const patch: Partial<ProductConcept> = {
      stage: targetStage,
      ownerId: gateFillForm.ownerId || concept.ownerId || currentUser.id,
      whatAttracted:
        gateFillForm.whatAttracted || concept.whatAttracted || concept.name,
      ideaDescription:
        gateFillForm.whatAttracted || concept.ideaDescription || concept.name,
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
        whatWeCreate: gateFillForm.hypothesis || 'Продуктовая гипотеза зафиксирована',
        openQuestionsAndRisks:
          gateFillForm.risks || 'Проверить посадку и стирку на образце',
        recommendation: 'continue',
      };
    }

    const nowTime = new Date().toISOString().slice(0, 16).replace('T', ' ');
    patch.stageHistory = [
      {
        id: `sh-${Date.now()}`,
        timestamp: nowTime,
        authorName: currentUser.fullName,
        authorRole: currentUser.role,
        actionType: 'stage_change',
        fromStage: concept.stage,
        toStage: targetStage,
        reason: `Дополнены недостающие поля и выполнен переход на этап «${CONCEPT_STAGE_LABELS_RU[targetStage]}»`,
      },
      ...(concept.stageHistory || []),
    ];

    updateConcept(concept.id, patch);
    setStageGateModal(null);
    setActiveCardTab(stageToTabId(normalizedTarget));
    notify('success', `Статус изменён: «${CONCEPT_STAGE_LABELS_RU[targetStage]}»`);
  };

  // Быстрое создание новой идеи (Сценарий №1 и №2 со Стр. 10 PDF)
  const handleQuickCreateIdea = () => {
    if (!quickIdeaForm.name.trim() && !quickIdeaForm.comment.trim()) {
      notify('warning', 'Укажите название или короткую суть идеи');
      return;
    }
    const title =
      quickIdeaForm.name.trim() ||
      quickIdeaForm.comment.trim().slice(0, 60) ||
      'Новая продуктовая идея';

    const created = createConcept({
      name: title,
      brandId: quickIdeaForm.brandId,
      stage: 'IDEA',
      developmentType: quickIdeaForm.developmentType,
      whatAttracted: quickIdeaForm.comment.trim() || title,
      ideaDescription: quickIdeaForm.comment.trim() || title,
      ownerId: quickIdeaForm.ownerId || currentUser.id,
      targetLaunchDate: quickIdeaForm.targetLaunchDate || '2027-01-15',
      referenceLinks: quickIdeaForm.referenceLink.trim()
        ? [quickIdeaForm.referenceLink.trim()]
        : [],
      imageUrl: quickIdeaForm.images[0] || undefined,
    });

    if (quickIdeaForm.images.length > 0) {
      updateConcept(created.id, {
        imageUrl: quickIdeaForm.images[0],
        galleryPhotos: quickIdeaForm.images.map((url, idx) => ({
          id: `ph-${Date.now()}-${idx}`,
          url,
          caption: idx === 0 ? 'Обложка карточки' : `Фото ${idx + 1}`,
        })),
      });
    }

    setQuickIdeaOpen(false);
    setQuickIdeaForm({
      brandId: brandFilter === 'NA_TELE' ? 'NA_TELE' : 'BORNERS',
      name: '',
      comment: '',
      referenceLink: '',
      developmentType: 'new_construction',
      ownerId: currentUser.id,
      targetLaunchDate: '2027-01-15',
      images: [],
    });
    openConceptCard(created, 'overview');
  };

  const activeConcept: ProductConcept | null = useMemo(
    () => accessibleConcepts.find((c) => c.id === selectedConceptId) || null,
    [accessibleConcepts, selectedConceptId]
  );

  const canEditActiveConcept =
    activeConcept !== null &&
    canUserEditBrand(currentUser, activeConcept.brandId);

  // Все фотографии открытой карточки (главное фото + лента миниатюр, Стр. 4 и 9 PDF)
  const activeGalleryPhotos = useMemo(() => {
    if (!activeConcept) return [];
    if (activeConcept.galleryPhotos && activeConcept.galleryPhotos.length > 0) {
      return activeConcept.galleryPhotos;
    }
    if (activeConcept.imageUrl) {
      return [
        {
          id: 'ph-cover',
          url: activeConcept.imageUrl,
          caption: 'Главное фото',
        },
      ];
    }
    return [];
  }, [activeConcept]);

  const appendPhotosToActiveConcept = (dataUrls: string[]) => {
    if (!activeConcept || dataUrls.length === 0) return;
    const existing = activeGalleryPhotos;
    const added = dataUrls.map((url, idx) => ({
      id: `ph-${Date.now()}-${idx}`,
      url,
      caption: `Фото ${existing.length + idx + 1}`,
    }));
    const nextList = [...existing, ...added];
    updateConcept(activeConcept.id, {
      imageUrl: nextList[0].url,
      galleryPhotos: nextList,
    });
    notify(
      'success',
      dataUrls.length === 1
        ? 'Фотография добавлена в галерею карточки'
        : `Добавлено фотографий: ${dataUrls.length}`
    );
  };

  const setPhotoAsCover = (idx: number) => {
    if (!activeConcept) return;
    const list = [...activeGalleryPhotos];
    const [picked] = list.splice(idx, 1);
    if (!picked) return;
    const reordered = [picked, ...list];
    updateConcept(activeConcept.id, {
      imageUrl: picked.url,
      galleryPhotos: reordered,
    });
    setActivePhotoIndex(0);
    notify('success', 'Назначено главным фото (обложкой карточки)');
  };

  const movePhotoOrder = (idx: number, dir: -1 | 1) => {
    if (!activeConcept) return;
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= activeGalleryPhotos.length) return;
    const list = [...activeGalleryPhotos];
    const temp = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = temp;
    updateConcept(activeConcept.id, {
      imageUrl: list[0].url,
      galleryPhotos: list,
    });
    setActivePhotoIndex(targetIdx);
  };

  const removePhotoFromGallery = (idx: number) => {
    if (!activeConcept) return;
    const list = activeGalleryPhotos.filter((_, i) => i !== idx);
    updateConcept(activeConcept.id, {
      imageUrl: list[0]?.url || '',
      galleryPhotos: list,
    });
    setActivePhotoIndex(0);
  };

  // Короткая 3-я строка статуса на карточке фотодоски (Стр. 3 PDF)
  const getBoardCardStatusLine = (c: ProductConcept, stage: SevenKanbanStage) => {
    if (stage === 'TEST') {
      return { text: 'Нужен тест', highlight: true };
    }
    if (stage === 'SAMPLE') {
      return { text: `Тест до ${c.targetLaunchDate?.slice(5) || '15.11'}`, highlight: false };
    }
    if (c.targetLaunchDate) {
      const [yyyy, mm] = c.targetLaunchDate.split('-');
      return {
        text: `Запуск: ${mm || '01'}.${yyyy || '2027'}`,
        highlight: false,
      };
    }
    return { text: 'Запуск: 01.2027', highlight: false };
  };

  return (
    <div className="space-y-6 pb-20">
      {/* =====================================================================
          02 / ГЛАВНЫЙ ЭКРАН — ФОТОДОСКА (БЕЗ ИИ-ПОЛОСОК, СТРОГАЯ АРХИТЕКТУРА)
      ===================================================================== */}
      <div className="rounded-[8px] bg-[#FDFCFA] border border-[#E5E0D8] p-6 md:p-7 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#E5E0D8] pb-5">
          <div className="space-y-1">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#7A756D]">
              BORNERS GROUP · PRODUCT LAB R&amp;D
            </div>
            <h1 className="font-serif-editorial text-[32px] md:text-[38px] font-medium tracking-[-0.01em] text-[#161615] leading-none">
              Лаборатория продукта
            </h1>
            <p className="text-[13.5px] text-[#6E6A63] pt-1">
              Визуальная доска разработки: от первой фотографии и анализа рынка до протокола стирки и заказа фабрике
            </p>
          </div>

          <button
            type="button"
            onClick={() => setQuickIdeaOpen(true)}
            className="inline-flex items-center gap-2 h-9 rounded-[6px] bg-[#161615] hover:bg-[#2C2B29] text-white px-4 text-[13px] font-medium transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Новая идея</span>
          </button>
        </div>

        {/* Панель фильтров: Все бренды | Все этапы | Поиск | Вид */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="h-9 rounded-[6px] bg-[#F8F6F2] hover:border-[#161615] border border-[#E5E0D8] px-3 text-[12.5px] font-medium text-[#161615] outline-none cursor-pointer transition"
            >
              <option value="ALL">Все бренды</option>
              <option value="BORNERS">BORNERS</option>
              <option value="NA_TELE">НА ТЕЛЕ</option>
            </select>

            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="h-9 rounded-[6px] bg-[#F8F6F2] hover:border-[#161615] border border-[#E5E0D8] px-3 text-[12.5px] font-medium text-[#161615] outline-none cursor-pointer transition"
            >
              <option value="ALL">Все этапы (01–07)</option>
              {SEVEN_KANBAN_STAGES.map((st, idx) => (
                <option key={st} value={st}>
                  0{idx + 1} · {CONCEPT_STAGE_LABELS_RU[st]}
                </option>
              ))}
            </select>

            <div className="relative w-56 sm:w-64">
              <Search className="h-3.5 w-3.5 text-[#8C867E] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск модели или ID..."
                className="w-full h-9 rounded-[6px] bg-[#F8F6F2] border border-[#E5E0D8] pl-8 pr-3 text-[12.5px] outline-none focus:bg-white focus:border-[#161615]"
              />
            </div>
          </div>

          <div className="flex items-center h-9 bg-[#F2EFE9] p-0.5 rounded-[6px] border border-[#E5E0D8]">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-[4px] text-[12.5px] font-medium transition cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white text-[#161615] shadow-2xs'
                  : 'text-[#6E6A63] hover:text-[#161615]'
              }`}
            >
              <Columns3 className="h-3.5 w-3.5" />
              <span>Фотодоска</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('gallery')}
              className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-[4px] text-[12.5px] font-medium transition cursor-pointer ${
                viewMode === 'gallery'
                  ? 'bg-white text-[#161615] shadow-2xs'
                  : 'text-[#6E6A63] hover:text-[#161615]'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Галерея</span>
            </button>
          </div>
        </div>

        {/* ===================================================================
            ФОТОДОСКА KANBAN (Крупные карточки 252px, фото 60% высоты, 3 строки текста)
        =================================================================== */}
        {viewMode === 'kanban' && (
          <div className="space-y-3">
            <div className="flex gap-3.5 overflow-x-auto pb-3 pt-1">
              {SEVEN_KANBAN_STAGES.map((stage, stageIdx) => {
                const stageItems = filteredConcepts.filter(
                  (c) => normalizeConceptStageToSeven(c.stage) === stage
                );
                const isOver = dragOverStage === stage;

                return (
                  <div
                    key={stage}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverStage(stage);
                    }}
                    onDragLeave={() => setDragOverStage(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      const cid =
                        e.dataTransfer.getData('text/plain') || draggedConceptId;
                      setDraggedConceptId(null);
                      setDragOverStage(null);
                      if (!cid) return;
                      const found = concepts.find((x) => x.id === cid);
                      if (found) {
                        attemptStageTransition(found, stage);
                      }
                    }}
                    className={`w-[254px] shrink-0 rounded-[8px] p-3 flex flex-col gap-3 min-h-[520px] border transition ${
                      isOver
                        ? 'border-[#161615] bg-[#EAE5DC]'
                        : 'border-[#E5E0D8] bg-[#F6F4EF]'
                    }`}
                  >
                    {/* Заголовок колонки */}
                    <div className="flex items-center justify-between px-1 pb-2 border-b border-[#E5E0D8]">
                      <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#161615] font-medium">
                        <span className="text-[#8C867E] mr-1.5">0{stageIdx + 1}</span>
                        {CONCEPT_STAGE_LABELS_RU[stage]}
                      </span>
                      <span className="font-mono text-[11px] text-[#7A756D]">
                        {stageItems.length}
                      </span>
                    </div>

                    {/* Список крупных фото-карточек */}
                    <div className="space-y-3 flex-1">
                      {stageItems.map((concept) => {
                        const statusLine = getBoardCardStatusLine(concept, stage);
                        const hasPhoto = Boolean(concept.imageUrl && concept.imageUrl.trim());

                        return (
                          <div
                            key={concept.id}
                            draggable
                            onDragStart={(e) => {
                              setDraggedConceptId(concept.id);
                              e.dataTransfer.effectAllowed = 'move';
                              e.dataTransfer.setData('text/plain', concept.id);
                            }}
                            onClick={() => openConceptCard(concept)}
                            className="group relative bg-white rounded-[6px] border border-[#E5E0D8] hover:border-[#161615] overflow-hidden cursor-pointer transition flex flex-col"
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteConcept(concept.id);
                              }}
                              title="Удалить карточку"
                              className="opacity-0 group-hover:opacity-100 absolute top-2.5 right-2.5 z-10 h-6 w-6 rounded-[4px] bg-white/90 border border-[#E5E0D8] flex items-center justify-center text-[#7A756D] hover:text-[#B83E3E] hover:border-[#B83E3E] transition cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>

                            {/* Крупное изображение (~60% высоты карточки) */}
                            <div className="h-[196px] w-full bg-[#EFECE6] border-b border-[#E5E0D8] overflow-hidden flex items-center justify-center">
                              {hasPhoto ? (
                                <img
                                  src={concept.imageUrl}
                                  alt={concept.name}
                                  className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                                />
                              ) : (
                                <div className="text-center px-4 font-mono text-[11px] uppercase tracking-wider text-[#8C867E]">
                                  Карточка без фото
                                </div>
                              )}
                            </div>

                            {/* Ровно 3 чистые строки под фото */}
                            <div className="p-3 space-y-1">
                              <h4 className="text-[14px] font-semibold text-[#161615] leading-snug line-clamp-1">
                                {concept.name}
                              </h4>

                              <div className="text-[12px] text-[#6E6A63] truncate">
                                {concept.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : 'BORNERS'} ·{' '}
                                {getUserShortName(concept.ownerId)}
                              </div>

                              <div className="flex items-center justify-between gap-2 pt-1">
                                <span
                                  className={`font-mono text-[11px] ${
                                    statusLine.highlight
                                      ? 'text-[#B85D35] font-medium'
                                      : 'text-[#7A756D]'
                                  }`}
                                >
                                  {statusLine.text}
                                </span>

                                <select
                                  value={stage}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    attemptStageTransition(
                                      concept,
                                      e.target.value as ConceptStage
                                    );
                                  }}
                                  title="Переместить в этап..."
                                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 font-mono text-[10px] text-[#161615] bg-[#F8F6F2] border border-[#E5E0D8] rounded-[4px] px-1.5 py-0.5 cursor-pointer transition"
                                >
                                  {SEVEN_KANBAN_STAGES.map((st) => (
                                    <option key={st} value={st}>
                                      → {CONCEPT_STAGE_LABELS_RU[st]}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================================================================
            РЕЖИМ ГАЛЕРЕИ КАРТОЧЕК
        =================================================================== */}
        {viewMode === 'gallery' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 pt-2">
            {filteredConcepts.map((concept) => {
              const stage = normalizeConceptStageToSeven(concept.stage);
              const statusLine = getBoardCardStatusLine(concept, stage);
              return (
                <div
                  key={concept.id}
                  onClick={() => openConceptCard(concept)}
                  className="bg-white rounded-2xl border border-[#E8E8E5] hover:border-[#171717] p-4 space-y-3 cursor-pointer transition shadow-2xs"
                >
                  <div className="h-56 w-full rounded-xl bg-[#EFECE8] border border-[#E8E8E5] flex items-center justify-center p-3">
                    {concept.imageUrl ? (
                      <img
                        src={concept.imageUrl}
                        alt={concept.name}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="text-[13px] text-[#737373]">Карточка без фото</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[12px] font-bold text-[#737373]">
                      <span>{concept.code}</span>
                      <span className="text-[#D97745] uppercase">
                        {CONCEPT_STAGE_LABELS_RU[stage]}
                      </span>
                    </div>
                    <h4 className="text-[16px] font-bold text-[#171717] truncate">
                      {concept.name}
                    </h4>
                    <div className="flex items-center justify-between text-[13px] text-[#737373]">
                      <span>
                        {concept.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : 'BORNERS'} ·{' '}
                        {getUserShortName(concept.ownerId)}
                      </span>
                      <span className="font-semibold">{statusLine.text}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =====================================================================
          03 / КАРТОЧКА ИДЕИ И ЗАГРУЗКА ФОТОГРАФИЙ (СТР. 4 PDF UX SPEC V2.0)
          Большой просмотр продукта: слева галерея, справа краткий паспорт, ниже — этапы
      ===================================================================== */}
      {activeConcept && (
        <div
          onPaste={(e) => {
            const items = Array.from(e.clipboardData?.items || []);
            const urls: string[] = [];
            items.forEach((item) => {
              if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  if (typeof reader.result === 'string') {
                    appendPhotosToActiveConcept([reader.result]);
                  }
                };
                reader.readAsDataURL(file);
              }
            });
            if (urls.length > 0) {
              appendPhotosToActiveConcept(urls);
            }
          }}
          className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-[2px]"
        >
          <div className="w-full max-w-5xl bg-[#FAF8F5] h-full overflow-y-auto p-6 md:p-10 space-y-7 shadow-2xl">
            {/* ВЕРХНЯЯ СТРОКА: RD-024 / НА ТЕЛЕ / ИДЕЯ + АВТОСОХРАНЕНИЕ + УДАЛИТЬ + ЗАКРЫТЬ */}
            <div className="rounded-3xl bg-white border border-[#E8E8E5] p-6 md:p-8 space-y-6 shadow-2xs">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-[260px]">
                  <div className="flex flex-wrap items-center gap-2.5 text-[12px] font-bold uppercase tracking-wider text-[#737373]">
                    <span>
                      {activeConcept.code} /{' '}
                      {activeConcept.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : 'BORNERS'} /{' '}
                      {CONCEPT_STAGE_LABELS_RU[
                        normalizeConceptStageToSeven(activeConcept.stage)
                      ].toUpperCase()}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E8F5E9] text-[#16805D] text-[11px] font-bold normal-case">
                      <Check className="h-3 w-3" />
                      Сохранено
                    </span>
                  </div>

                  {/* Крупный редактируемый заголовок модели */}
                  <input
                    disabled={!canEditActiveConcept}
                    value={activeConcept.name}
                    onChange={(e) =>
                      updateConcept(activeConcept.id, { name: e.target.value })
                    }
                    className="w-full text-[26px] md:text-[32px] font-bold tracking-tight text-[#171717] bg-transparent border-b border-transparent hover:border-[#E8E8E5] focus:border-[#171717] outline-none pb-1"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const idToRemove = activeConcept.id;
                      setSelectedConceptId(null);
                      deleteConcept(idToRemove);
                    }}
                    className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-[#E8E8E5] text-[#737373] hover:text-[#DC2626] hover:border-[#DC2626] text-[13px] font-semibold transition cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Удалить</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedConceptId(null)}
                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[#111111] text-white text-[13px] font-bold hover:opacity-90 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                    <span>Закрыть</span>
                  </button>
                </div>
              </div>

              {/* ===============================================================
                  ПЕРВЫЙ ЭКРАН КАРТОЧКИ (СТР. 4 PDF):
                  СЛЕВА — БОЛЬШАЯ ФОТОГАЛЕРЕЯ (3 СПОСОБА ЗАГРУЗКИ),
                  СПРАВА — КРАТКИЙ ПАСПОРТ (4 БЛОКА)
              =============================================================== */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* ЛЕВАЯ КОЛОНКА (7/12): Большое главное фото + лента миниатюр + Drag&Drop/Paste/Upload */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingPhotoOverCard(true);
                  }}
                  onDragLeave={() => setIsDraggingPhotoOverCard(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingPhotoOverCard(false);
                    const files = Array.from(e.dataTransfer.files || []).filter((f) =>
                      f.type.startsWith('image/')
                    );
                    if (files.length === 0) return;
                    files.forEach((file) => {
                      const r = new FileReader();
                      r.onload = () => {
                        if (typeof r.result === 'string') {
                          appendPhotosToActiveConcept([r.result]);
                        }
                      };
                      r.readAsDataURL(file);
                    });
                  }}
                  className={`lg:col-span-7 space-y-3 rounded-2xl transition ${
                    isDraggingPhotoOverCard ? 'ring-2 ring-[#D97745] bg-[#FDF3EB]/40 p-2' : ''
                  }`}
                >
                  {/* Крупное главное фото */}
                  <div className="relative h-[340px] w-full rounded-2xl bg-[#EFECE8] border border-[#E8E8E5] overflow-hidden flex items-center justify-center group">
                    {activeGalleryPhotos[activePhotoIndex]?.url ? (
                      <>
                        <img
                          src={activeGalleryPhotos[activePhotoIndex].url}
                          alt={activeConcept.name}
                          onClick={() =>
                            setZoomPhotoUrl(
                              activeGalleryPhotos[activePhotoIndex]?.url || null
                            )
                          }
                          className="h-full w-full object-contain p-3 cursor-zoom-in"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setZoomPhotoUrl(
                              activeGalleryPhotos[activePhotoIndex]?.url || null
                            )
                          }
                          className="opacity-0 group-hover:opacity-100 absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/75 text-white text-[12px] font-semibold cursor-pointer transition"
                        >
                          <ZoomIn className="h-3.5 w-3.5" />
                          <span>Увеличить</span>
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-6 space-y-2 text-[#737373]">
                        <div className="text-[15px] font-bold text-[#171717]">
                          Перетащите сюда 1–20 фото или нажмите Cmd+V
                        </div>
                        <div className="text-[13px]">
                          Поддерживаются PNG / JPG / WEBP и скриншоты из буфера обмена
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Лента миниатюр + управление порядком / обложкой + кнопка «Добавить фото» */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {activeGalleryPhotos.map((ph, idx) => {
                      const isCurrent = idx === activePhotoIndex;
                      const isCover = idx === 0;
                      return (
                        <div
                          key={ph.id}
                          onClick={() => setActivePhotoIndex(idx)}
                          className={`group relative h-20 w-24 rounded-xl overflow-hidden border-2 bg-[#EFECE8] cursor-pointer transition ${
                            isCurrent
                              ? 'border-[#171717] shadow-xs'
                              : 'border-[#E8E8E5] opacity-85 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={ph.url}
                            alt={ph.caption || 'thumb'}
                            className="h-full w-full object-cover"
                          />
                          {isCover && (
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-white text-[9px] font-bold uppercase">
                              Обложка
                            </span>
                          )}
                          {canEditActiveConcept && (
                            <div className="opacity-0 group-hover:opacity-100 absolute inset-x-0 bottom-0 bg-black/80 p-1 flex items-center justify-between text-white transition">
                              {!isCover && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPhotoAsCover(idx);
                                  }}
                                  title="Сделать обложкой"
                                  className="p-0.5 hover:text-[#D97745] cursor-pointer"
                                >
                                  <Star className="h-3 w-3" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  movePhotoOrder(idx, -1);
                                }}
                                title="Сдвинуть влево"
                                className="p-0.5 hover:text-[#D97745] cursor-pointer"
                              >
                                <ArrowLeft className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  movePhotoOrder(idx, 1);
                                }}
                                title="Сдвинуть вправо"
                                className="p-0.5 hover:text-[#D97745] cursor-pointer"
                              >
                                <ArrowRight className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removePhotoFromGallery(idx);
                                }}
                                title="Удалить фото"
                                className="p-0.5 hover:text-[#DC2626] cursor-pointer"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Кнопка загрузки «Добавить фото» (множественная загрузка + drag-and-drop + Cmd+V) */}
                    {canEditActiveConcept && (
                      <label className="h-20 px-4 rounded-xl border-2 border-dashed border-[#D5D3CE] hover:border-[#D97745] bg-[#F7F7F5] flex flex-col items-center justify-center text-center cursor-pointer transition">
                        <Upload className="h-4 w-4 text-[#D97745] mb-1" />
                        <span className="text-[11px] font-bold text-[#171717]">
                          + Добавить фото
                        </span>
                        <span className="text-[10px] text-[#737373]">
                          или Cmd+V / Drag
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            files.forEach((f) => {
                              const r = new FileReader();
                              r.onload = () => {
                                if (typeof r.result === 'string') {
                                  appendPhotosToActiveConcept([r.result]);
                                }
                              };
                              r.readAsDataURL(f);
                            });
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* ПРАВАЯ КОЛОНКА (5/12): Краткий паспорт из 4 чистых карточек (Один в один со Стр. 4 PDF!) */}
                <div className="lg:col-span-5 space-y-3">
                  {/* 1. БРЕНД / АВТОР */}
                  <div className="rounded-2xl bg-[#F7F7F5] border border-[#E8E8E5] p-4 space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#737373]">
                      БРЕНД / АВТОР
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <select
                        disabled={!canEditActiveConcept}
                        value={activeConcept.brandId}
                        onChange={(e) =>
                          updateConcept(activeConcept.id, { brandId: e.target.value })
                        }
                        className="text-[15px] font-bold text-[#171717] bg-transparent outline-none cursor-pointer"
                      >
                        <option value="BORNERS">BORNERS</option>
                        <option value="NA_TELE">НА ТЕЛЕ</option>
                      </select>
                      <span className="text-[14px] font-semibold text-[#525252]">
                        · {getUserShortName(activeConcept.authorId || currentUser.id)}
                      </span>
                    </div>
                  </div>

                  {/* 2. ТИП РАЗРАБОТКИ */}
                  <div className="rounded-2xl bg-[#F7F7F5] border border-[#E8E8E5] p-4 space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#737373]">
                      ТИП РАЗРАБОТКИ
                    </div>
                    <select
                      disabled={!canEditActiveConcept}
                      value={activeConcept.developmentType || 'new_construction'}
                      onChange={(e) =>
                        updateConcept(activeConcept.id, {
                          developmentType: e.target.value as RnDDevelopmentType,
                        })
                      }
                      className="w-full text-[15px] font-bold text-[#171717] bg-transparent outline-none cursor-pointer"
                    >
                      {Object.entries(RND_DEVELOPMENT_TYPE_LABELS_RU).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 3. ОТВЕТСТВЕННЫЙ / СРОК */}
                  <div className="rounded-2xl bg-[#F7F7F5] border border-[#E8E8E5] p-4 space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#737373]">
                      ОТВЕТСТВЕННЫЙ / СРОК
                    </div>
                    <div className="grid grid-cols-2 gap-2 items-center">
                      <select
                        disabled={!canEditActiveConcept}
                        value={activeConcept.ownerId}
                        onChange={(e) =>
                          updateConcept(activeConcept.id, { ownerId: e.target.value })
                        }
                        className="text-[15px] font-bold text-[#171717] bg-transparent outline-none cursor-pointer truncate"
                      >
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.fullName.split(' ')[0]} ({u.fullName})
                          </option>
                        ))}
                      </select>
                      <input
                        type="date"
                        disabled={!canEditActiveConcept}
                        value={activeConcept.targetLaunchDate || '2027-01-15'}
                        onChange={(e) =>
                          updateConcept(activeConcept.id, {
                            targetLaunchDate: e.target.value,
                          })
                        }
                        className="text-[14px] font-bold text-[#171717] bg-transparent outline-none text-right"
                      />
                    </div>
                  </div>

                  {/* 4. СУТЬ ИДЕИ (тёплая карточка как на Стр. 4 PDF) */}
                  <div className="rounded-2xl bg-[#FDF5EF] border border-[#F3DFD1] p-4 space-y-1.5">
                    <div className="text-[13px] font-bold text-[#171717]">
                      Суть идеи
                    </div>
                    <textarea
                      rows={3}
                      disabled={!canEditActiveConcept}
                      value={
                        activeConcept.whatAttracted ??
                        activeConcept.ideaDescription ??
                        ''
                      }
                      onChange={(e) =>
                        updateConcept(activeConcept.id, {
                          whatAttracted: e.target.value,
                          ideaDescription: e.target.value,
                        })
                      }
                      placeholder="Тонкий материал, мягкая посадка, почти незаметные края..."
                      className="w-full bg-transparent text-[14px] text-[#525252] leading-relaxed outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* ===============================================================
                  ПОЛОСА 7 ЭТАПОВ НИЖЕ ПАСПОРТА (СТР. 4 PDF):
                  ИДЕЯ · АНАЛИЗ · ОБРАЗЕЦ · ТЕСТ · РЕШЕНИЕ · ПРОИЗВОДСТВО · ЗАПУСК
              =============================================================== */}
              <div className="pt-4 border-t border-[#E8E8E5] flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {RND_CARD_TABS.map((t) => {
                    const isTabActive = activeCardTab === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setActiveCardTab(t.id)}
                        className={`px-3.5 py-2 rounded-xl text-[12px] font-extrabold uppercase tracking-wider transition cursor-pointer ${
                          isTabActive
                            ? 'bg-[#111111] text-white shadow-2xs'
                            : 'bg-[#F7F7F5] text-[#737373] hover:text-[#171717]'
                        }`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ЭКРАН ВЫБРАННОГО ЭТАПА (01 ИДЕЯ ... 07 ЗАПУСК) */}
            <ProductLabCardBody
              concept={activeConcept}
              activeTab={activeCardTab}
              canEdit={canEditActiveConcept}
              isStrategyMode={false}
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
          МОДАЛЬНОЕ ОКНО БЫСТРОГО СОЗДАНИЯ НОВОЙ ИДЕИ ЗА 30–60 СЕКУНД (СТР. 2, 4, 5 PDF)
          Перетащить 1–20 фото сразу, вставить Cmd+V, минимум полей
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
                      notify('success', 'Скриншот из буфера добавлен в галерею');
                    }
                  };
                  reader.readAsDataURL(file);
                }
              });
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const files = Array.from(e.dataTransfer.files || []).filter((f) =>
                f.type.startsWith('image/')
              );
              files.forEach((file) => {
                const reader = new FileReader();
                reader.onload = () => {
                  if (typeof reader.result === 'string') {
                    setQuickIdeaForm((prev) => ({
                      ...prev,
                      images: [...prev.images, reader.result as string],
                    }));
                  }
                };
                reader.readAsDataURL(file);
              });
            }}
            className="w-full max-w-2xl bg-white rounded-3xl border border-[#E8E8E5] p-7 md:p-8 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-[#E8E8E5] pb-4">
              <div>
                <h3 className="text-[24px] font-bold text-[#171717]">
                  Новая идея продукта
                </h3>
                <p className="text-[13px] text-[#737373]">
                  Минимум полей: бренд, название, ответственный, короткая суть и фотографии
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleQuickCreateIdea}
                  className="h-10 px-5 rounded-full bg-[#D97745] hover:bg-[#C26535] text-white text-[13px] font-bold uppercase tracking-wider cursor-pointer"
                >
                  Сохранить идею
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-[#737373] mb-1">
                    Бренд
                  </label>
                  <select
                    value={quickIdeaForm.brandId}
                    onChange={(e) =>
                      setQuickIdeaForm({ ...quickIdeaForm, brandId: e.target.value })
                    }
                    className="w-full h-11 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] px-3 font-bold"
                  >
                    <option value="BORNERS">BORNERS</option>
                    <option value="NA_TELE">НА ТЕЛЕ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-[#737373] mb-1">
                    Ответственный
                  </label>
                  <select
                    value={quickIdeaForm.ownerId}
                    onChange={(e) =>
                      setQuickIdeaForm({ ...quickIdeaForm, ownerId: e.target.value })
                    }
                    className="w-full h-11 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] px-3 font-semibold"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-[#737373] mb-1">
                    Плановая дата запуска
                  </label>
                  <input
                    type="date"
                    value={quickIdeaForm.targetLaunchDate}
                    onChange={(e) =>
                      setQuickIdeaForm({
                        ...quickIdeaForm,
                        targetLaunchDate: e.target.value,
                      })
                    }
                    className="w-full h-11 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] px-3 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-[#737373] mb-1">
                    Название модели
                  </label>
                  <input
                    value={quickIdeaForm.name}
                    onChange={(e) =>
                      setQuickIdeaForm({ ...quickIdeaForm, name: e.target.value })
                    }
                    placeholder="Напр.: Бесшовная база 2.0"
                    className="w-full h-11 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] px-3.5 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-[#737373] mb-1">
                    Тип разработки
                  </label>
                  <select
                    value={quickIdeaForm.developmentType}
                    onChange={(e) =>
                      setQuickIdeaForm({
                        ...quickIdeaForm,
                        developmentType: e.target.value as RnDDevelopmentType,
                      })
                    }
                    className="w-full h-11 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] px-3 font-semibold"
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
                  Короткая суть идеи
                </label>
                <textarea
                  rows={2}
                  value={quickIdeaForm.comment}
                  onChange={(e) =>
                    setQuickIdeaForm({ ...quickIdeaForm, comment: e.target.value })
                  }
                  placeholder="Тонкий материал, мягкая посадка, почти незаметные края..."
                  className="w-full rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] p-3.5"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#737373] mb-1">
                  Ссылка на референс / карточку конкурента (опционально)
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
                  className="w-full h-10 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] px-3.5"
                />
              </div>

              {/* Зона загрузки 1–20 фото (ПЕРЕТАЩИТЬ / ВСТАВИТЬ Cmd+V / ВЫБРАТЬ, Стр. 4 и Сценарий №1 PDF) */}
              <div className="rounded-2xl border-2 border-dashed border-[#D5D3CE] hover:border-[#D97745] bg-[#F7F7F5]/70 p-5 space-y-3 text-center transition">
                <label className="block cursor-pointer">
                  <div className="inline-flex items-center gap-2 text-[14px] font-bold text-[#171717]">
                    <Upload className="h-4 w-4 text-[#D97745]" />
                    <span>
                      Перетащите 1–20 фото сюда, нажмите Cmd+V или выберите файлы
                    </span>
                  </div>
                  <div className="text-[12px] text-[#737373] mt-0.5">
                    Можно сразу выбрать обложку и поменять порядок миниатюр
                  </div>
                  <input
                    type="file"
                    accept="image/*"
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

                {quickIdeaForm.images.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2.5 pt-2">
                    {quickIdeaForm.images.map((img, i) => (
                      <div
                        key={i}
                        className={`relative h-20 w-20 rounded-xl overflow-hidden border-2 bg-white ${
                          i === 0 ? 'border-[#D97745]' : 'border-[#E8E8E5]'
                        }`}
                      >
                        <img
                          src={img}
                          alt="preview"
                          className="h-full w-full object-cover"
                        />
                        {i === 0 ? (
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-[#D97745] text-white text-[9px] font-bold">
                            Обложка
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setQuickIdeaForm((prev) => {
                                const list = [...prev.images];
                                const [picked] = list.splice(i, 1);
                                return { ...prev, images: [picked, ...list] };
                              })
                            }
                            className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-white text-[9px] font-bold cursor-pointer"
                          >
                            Сделать обложкой
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setQuickIdeaForm((prev) => ({
                              ...prev,
                              images: prev.images.filter((_, idx) => idx !== i),
                            }))
                          }
                          className="absolute top-1 right-1 h-4 w-4 rounded-full bg-black/75 text-white flex items-center justify-center text-[10px] cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          КОРОТКАЯ ПРОВЕРКА ПЕРЕД СМЕНОЙ ЭТАПА (СТР. 3 И СЦЕНАРИЙ №3 PDF)
          Если данных не хватает — показать перечень недостающего с возможностью заполнить или вернуться
      ===================================================================== */}
      {stageGateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-[#E8E8E5] p-7 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-[#E8E8E5] pb-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#D97745]">
                  Короткая проверка перед сменой этапа
                </div>
                <h3 className="text-[20px] font-bold text-[#171717] mt-0.5">
                  Перевод в этап «{CONCEPT_STAGE_LABELS_RU[stageGateModal.targetStage]}»
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

            <div className="rounded-2xl bg-[#FDF3EB] border border-[#D97745]/30 p-4 space-y-1.5 text-[13px]">
              <div className="font-bold text-[#171717]">
                Чтобы перевести карточку вперёд, укажите недостающие данные:
              </div>
              {stageGateModal.missingFields.map((mf, i) => (
                <div key={i} className="text-[#171717]">
                  • {mf}
                </div>
              ))}
            </div>

            <div className="space-y-3 text-[14px]">
              {normalizeConceptStageToSeven(stageGateModal.targetStage) ===
                'ANALYSIS' && (
                <>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#737373] mb-1">
                      Ответственный
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
                    <label className="block text-[12px] font-semibold text-[#737373] mb-1">
                      Короткая суть идеи
                    </label>
                    <input
                      value={gateFillForm.whatAttracted}
                      onChange={(e) =>
                        setGateFillForm({
                          ...gateFillForm,
                          whatAttracted: e.target.value,
                        })
                      }
                      className="w-full h-10 rounded-xl border border-[#E8E8E5] px-3"
                    />
                  </div>
                </>
              )}

              {normalizeConceptStageToSeven(stageGateModal.targetStage) ===
                'SAMPLE' && (
                <>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#737373] mb-1">
                      Что берём за основу и чем лучше?
                    </label>
                    <input
                      value={gateFillForm.hypothesis}
                      onChange={(e) =>
                        setGateFillForm({ ...gateFillForm, hypothesis: e.target.value })
                      }
                      className="w-full h-10 rounded-xl border border-[#E8E8E5] px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#737373] mb-1">
                      Какой риск проверяем на образце?
                    </label>
                    <input
                      value={gateFillForm.risks}
                      onChange={(e) =>
                        setGateFillForm({ ...gateFillForm, risks: e.target.value })
                      }
                      className="w-full h-10 rounded-xl border border-[#E8E8E5] px-3"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#E8E8E5]">
              <button
                type="button"
                onClick={() => setStageGateModal(null)}
                className="h-10 px-4 rounded-xl border border-[#E8E8E5] text-[13px] font-semibold cursor-pointer"
              >
                Вернуться в карточку
              </button>
              <button
                type="button"
                onClick={handleConfirmStageGateModal}
                className="h-10 px-5 rounded-xl bg-[#111111] text-white text-[13px] font-bold cursor-pointer"
              >
                Заполнить и перевести →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ЗУМ-ЛАЙТБОКС ДЛЯ УВЕЛИЧЕНИЯ ЛЮБОЙ ФОТОГРАФИИ (СТР. 4 И 9 PDF) */}
      {zoomPhotoUrl && (
        <div
          onClick={() => setZoomPhotoUrl(null)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-6 cursor-zoom-out"
        >
          <img
            src={zoomPhotoUrl}
            alt="Увеличенное фото"
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain bg-white p-4"
          />
        </div>
      )}
    </div>
  );
}
