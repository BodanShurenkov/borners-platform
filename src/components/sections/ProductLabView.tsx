'use client';

import React, { useState, useMemo } from 'react';
import {
  CalendarPlus,
  CheckCircle2,
  Edit3,
  FileDown,
  GripVertical,
  ImagePlus,
  Plus,
  Printer,
  Save,
  X,
} from 'lucide-react';
import { usePlatform } from '@/context/PlatformContext';
import { ConceptStage, TechPackTranslation, ProductConcept } from '@/types/platform';
import {
  CONCEPT_STAGE_LABELS_RU,
  ROLE_LABELS_RU,
  canUserEditBrand,
  canUserViewCostPrice,
  formatCurrencyRub,
} from '@/lib/finance';

const KANBAN_MAIN_STAGES: ConceptStage[] = [
  'IDEA',
  'RESEARCH',
  'DESIGN',
  'PROTOTYPE',
  'TESTING',
  'APPROVED',
  'PRODUCTION',
  'READY TO LAUNCH',
];

const EXTRA_STAGES: ConceptStage[] = ['ON HOLD', 'REJECTED', 'CANCELLED'];

export function ProductLabView() {
  const {
    concepts,
    currentUser,
    brandFilter,
    platformMode,
    selectedConceptId,
    setSelectedConceptId,
    createConcept,
    updateConcept,
    updateConceptStage,
    createProductFromConcept,
    createLaunch,
    navigateTo,
    notify,
  } = usePlatform();

  const isStrategyMode = platformMode === 'strategy';
  const [viewMode, setViewMode] = useState<'grid' | 'kanban'>('grid');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [draggedConceptId, setDraggedConceptId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<ConceptStage | null>(null);

  const [drawerTab, setDrawerTab] = useState<'overview' | 'techpack' | 'comments'>(
    'overview'
  );
  const [techPackLang, setTechPackLang] = useState<'zh' | 'en' | 'ru'>('zh');
  const [isEditingTechPack, setIsEditingTechPack] = useState(false);
  const [techPackDraft, setTechPackDraft] = useState<TechPackTranslation | null>(null);
  const [commentText, setCommentText] = useState('');
  const [newVersionSummary, setNewVersionSummary] = useState('');

  const [newConceptForm, setNewConceptForm] = useState({
    code: 'LAB-27-07',
    name: '',
    brandId: brandFilter === 'NA_TELE' ? 'NA_TELE' : 'BORNERS',
    collectionName: 'CORE 2027',
    stage: 'PROTOTYPE' as ConceptStage,
    ideaDescription: '',
    plannedUnitCost: '460',
    plannedRetailPrice: '2390',
    targetLaunchDate: '2027-04-15',
    imageUrl: '',
  });

  const hasCostAccess = canUserViewCostPrice(currentUser);

  const filteredConcepts = useMemo(() => {
    return concepts.filter((c) => {
      if (c.isArchived) return false;
      if (brandFilter !== 'ALL' && c.brandId !== brandFilter) return false;
      if (stageFilter !== 'ALL' && c.stage !== stageFilter) return false;
      return true;
    });
  }, [concepts, brandFilter, stageFilter]);

  const activeConcept: ProductConcept | null = useMemo(
    () => concepts.find((c) => c.id === selectedConceptId) || null,
    [concepts, selectedConceptId]
  );

  const canEditActiveConcept =
    !isStrategyMode &&
    activeConcept !== null &&
    canUserEditBrand(currentUser, activeConcept.brandId);

  const handleDragStart = (e: React.DragEvent, conceptId: string) => {
    if (isStrategyMode) return;
    setDraggedConceptId(conceptId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', conceptId);
  };

  const handleDragOver = (e: React.DragEvent, stage: ConceptStage) => {
    if (isStrategyMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stage) {
      setDragOverStage(stage);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStage: ConceptStage) => {
    if (isStrategyMode) return;
    e.preventDefault();
    const conceptId = e.dataTransfer.getData('text/plain') || draggedConceptId;
    if (conceptId) {
      const item = concepts.find((c) => c.id === conceptId);
      if (item && item.stage !== targetStage) {
        updateConceptStage(conceptId, targetStage);
      }
    }
    setDraggedConceptId(null);
    setDragOverStage(null);
  };

  const handleCreateConcept = () => {
    if (!newConceptForm.name.trim()) return;
    createConcept({
      code: newConceptForm.code.trim() || 'LAB-27-NEW',
      name: newConceptForm.name.trim(),
      brandId: newConceptForm.brandId,
      collectionName: newConceptForm.collectionName,
      stage: newConceptForm.stage,
      ideaDescription:
        newConceptForm.ideaDescription ||
        'Улучшение посадки и износостойкости для повышения повторных покупок.',
      plannedUnitCost: Number(newConceptForm.plannedUnitCost) || 450,
      plannedRetailPrice: Number(newConceptForm.plannedRetailPrice) || 2290,
      targetLaunchDate: newConceptForm.targetLaunchDate,
      imageUrl: newConceptForm.imageUrl || undefined,
    });
    setCreateModalOpen(false);
  };

  const handleUploadDesignVersion = (
    e: React.ChangeEvent<HTMLInputElement>,
    concept: ProductConcept
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) return;
      const nextVersionNum = concept.designVersions.length + 1;
      const newVer = {
        version: nextVersionNum,
        title: `Версия v${nextVersionNum} (${file.name})`,
        notes:
          newVersionSummary.trim() ||
          `Загружен рендер / эскиз (${file.name})`,
        authorName: currentUser.fullName,
        createdAt: new Date().toISOString().slice(0, 10),
        status: 'approved' as const,
        imageUrl: dataUrl,
      };
      updateConcept(concept.id, {
        imageUrl: dataUrl,
        selectedDesignVersion: nextVersionNum,
        designVersions: [...concept.designVersions, newVer],
      });
      setNewVersionSummary('');
      notify('success', `Версия дизайна v${nextVersionNum} загружена и выбрана финальной`);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectFinalVersion = (concept: ProductConcept, versionNum: number, imgUrl: string) => {
    updateConcept(concept.id, {
      selectedDesignVersion: versionNum,
      imageUrl: imgUrl || concept.imageUrl,
    });
    notify('success', `Версия v${versionNum} утверждена как финальный дизайн`);
  };

  const startEditTechPack = (concept: ProductConcept, lang: 'zh' | 'en' | 'ru') => {
    setTechPackDraft({ ...concept.techPack[lang] });
    setIsEditingTechPack(true);
  };

  const saveTechPack = (concept: ProductConcept) => {
    if (!techPackDraft) return;
    updateConcept(concept.id, {
      techPack: {
        ...concept.techPack,
        [techPackLang]: techPackDraft,
      },
    });
    setIsEditingTechPack(false);
    setTechPackDraft(null);
    notify('success', `ТЗ для фабрики (${techPackLang.toUpperCase()}) сохранено`);
  };

  const handleExportFactorySheet = (concept: ProductConcept) => {
    const tp = concept.techPack;
    const lines = [
      `BORNERS GROUP — FACTORY TECH PACK (ZH / EN / RU)`,
      `====================================================================`,
      `CODE: ${concept.code} | BRAND: ${concept.brandId} | TARGET DATE: ${concept.targetLaunchDate}`,
      `SELECTED DESIGN VERSION: ${concept.selectedDesignVersion}`,
      ``,
      `[1. 中文生产制造单 / CHINESE FACTORY SPECIFICATION]`,
      `款式名称: ${tp.zh.modelName}`,
      `结构工艺: ${tp.zh.construction}`,
      `面料与成分: ${tp.zh.material} (${tp.zh.compositionAndDensity})`,
      `颜色与潘通: ${tp.zh.colorAndPantone}`,
      `尺码放码: ${tp.zh.sizeGrading}`,
      `腰带与缝线: ${tp.zh.waistbandSpec} / ${tp.zh.seamsSpec}`,
      `包装与质检: ${tp.zh.packagingSpec} / ${tp.zh.qualityRequirements}`,
      `参考备注: ${tp.zh.referencesNote}`,
      ``,
      `[2. ENGLISH FACTORY SPECIFICATION]`,
      `Style Name: ${tp.en.modelName}`,
      `Construction: ${tp.en.construction}`,
      `Fabric & GSM: ${tp.en.material} (${tp.en.compositionAndDensity})`,
      `Color & Pantone: ${tp.en.colorAndPantone}`,
      `Size Grading: ${tp.en.sizeGrading}`,
      `Waistband & Seams: ${tp.en.waistbandSpec} / ${tp.en.seamsSpec}`,
      `Packaging & QC: ${tp.en.packagingSpec} / ${tp.en.qualityRequirements}`,
      `Reference Note: ${tp.en.referencesNote}`,
      ``,
      `[3. РУССКАЯ СПЕЦИФИКАЦИЯ R&D]`,
      `Модель: ${tp.ru.modelName}`,
      `Конструкция: ${tp.ru.construction}`,
      `Полотно и плотность: ${tp.ru.material} (${tp.ru.compositionAndDensity})`,
      `Цвет и Pantone: ${tp.ru.colorAndPantone}`,
      `Размерная сетка: ${tp.ru.sizeGrading}`,
      `Швы и пояс: ${tp.ru.waistbandSpec} / ${tp.ru.seamsSpec}`,
      `Упаковка и ОТК: ${tp.ru.packagingSpec} / ${tp.ru.qualityRequirements}`,
      `Примечания технолога: ${tp.ru.referencesNote}`,
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TechPack_${concept.code}_${concept.brandId}_ZH_EN_RU.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintPdfTechPack = (concept: ProductConcept) => {
    const tp = concept.techPack;
    const win = window.open('', '_blank', 'width=960,height=800');
    if (!win) {
      window.print();
      return;
    }
    win.document.write(`
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="utf-8" />
        <title>Factory Tech Pack — ${concept.code} (${concept.name})</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #171717; padding: 32px; line-height: 1.5; }
          h1 { font-size: 24px; margin: 0 0 6px 0; }
          h2 { font-size: 16px; margin: 24px 0 8px 0; padding-bottom: 6px; border-bottom: 2px solid #171717; text-transform: uppercase; }
          .meta { font-size: 13px; color: #555; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px; }
          th, td { border: 1px solid #d4d4d0; padding: 8px 12px; text-align: left; vertical-align: top; }
          th { width: 28%; background: #f7f7f5; font-weight: 600; }
        </style>
      </head>
      <body>
        <h1>BORNERS GROUP — FACTORY TECH PACK (ZH / EN / RU)</h1>
        <div class="meta">
          Код R&D: <b>${concept.code}</b> · Бренд: <b>${concept.brandId}</b> · Коллекция: <b>${concept.collectionName}</b> · Финальный дизайн: <b>${concept.selectedDesignVersion}</b> · Плановый запуск: <b>${concept.targetLaunchDate}</b>
        </div>

        <h2>1. 中文生产制造单 (Chinese Factory Specification)</h2>
        <table>
          <tr><th>款式名称 / Style</th><td>${tp.zh.modelName}</td></tr>
          <tr><th>结构工艺 / Construction</th><td>${tp.zh.construction}</td></tr>
          <tr><th>面料与克重 / Fabric & GSM</th><td>${tp.zh.material} (${tp.zh.compositionAndDensity})</td></tr>
          <tr><th>颜色与潘通 / Color & Pantone</th><td>${tp.zh.colorAndPantone}</td></tr>
          <tr><th>尺码放码 / Size Grading</th><td>${tp.zh.sizeGrading}</td></tr>
          <tr><th>腰带与缝线 / Waistband & Seams</th><td>${tp.zh.waistbandSpec} · ${tp.zh.seamsSpec}</td></tr>
          <tr><th>包装与质检 / Packaging & QC</th><td>${tp.zh.packagingSpec} · ${tp.zh.qualityRequirements}</td></tr>
          <tr><th>参考备注 / Notes</th><td>${tp.zh.referencesNote}</td></tr>
        </table>

        <h2>2. English Factory Specification</h2>
        <table>
          <tr><th>Style Name</th><td>${tp.en.modelName}</td></tr>
          <tr><th>Construction</th><td>${tp.en.construction}</td></tr>
          <tr><th>Fabric & Density</th><td>${tp.en.material} (${tp.en.compositionAndDensity})</td></tr>
          <tr><th>Color & Pantone</th><td>${tp.en.colorAndPantone}</td></tr>
          <tr><th>Size Grading</th><td>${tp.en.sizeGrading}</td></tr>
          <tr><th>Waistband & Seams</th><td>${tp.en.waistbandSpec} · ${tp.en.seamsSpec}</td></tr>
          <tr><th>Packaging & QC</th><td>${tp.en.packagingSpec} · ${tp.en.qualityRequirements}</td></tr>
          <tr><th>Reference Note</th><td>${tp.en.referencesNote}</td></tr>
        </table>

        <h2>3. Русская технологическая спецификация R&D</h2>
        <table>
          <tr><th>Наименование модели</th><td>${tp.ru.modelName}</td></tr>
          <tr><th>Конструкция и лекала</th><td>${tp.ru.construction}</td></tr>
          <tr><th>Полотно и плотность</th><td>${tp.ru.material} (${tp.ru.compositionAndDensity})</td></tr>
          <tr><th>Цвет и Pantone</th><td>${tp.ru.colorAndPantone}</td></tr>
          <tr><th>Размерная сетка</th><td>${tp.ru.sizeGrading}</td></tr>
          <tr><th>Пояс и швы</th><td>${tp.ru.waistbandSpec} · ${tp.ru.seamsSpec}</td></tr>
          <tr><th>Упаковка и ОТК</th><td>${tp.ru.packagingSpec} · ${tp.ru.qualityRequirements}</td></tr>
          <tr><th>Примечания</th><td>${tp.ru.referencesNote}</td></tr>
        </table>
        <script>window.onload = () => { window.print(); };</script>
      </body>
      </html>
    `);
    win.document.close();
  };

  const handleCreateLaunchFromConcept = (concept: ProductConcept) => {
    const created = createLaunch({
      name: `Запуск R&D: ${concept.name}`,
      brandId: concept.brandId,
      collectionName: concept.collectionName,
      conceptId: concept.id,
      startDate: concept.targetLaunchDate || '2027-05-01',
      marketingBudgetRub: 850000,
      salesPlanUnits: 3500,
      salesPlanRub: 3500 * concept.plannedRetailPrice,
      ownerId: concept.ownerId || currentUser.id,
    });
    setSelectedConceptId(null);
    navigateTo('launch-calendar', { launchId: created.id });
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Заголовок страницы (32–40px по ТЗ) */}
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-[#E8E8E5] pb-6">
        <div>
          <div className="text-[13px] font-medium uppercase tracking-widest text-[#737373] mb-1.5">
            Разработка прототипов, сэмплов и ТЗ для фабрик · {filteredConcepts.length} проектов
          </div>
          <h1 className="text-[34px] md:text-[40px] font-bold tracking-[-0.03em] text-[#171717] dark:text-white">
            Лаборатория продукта (R&D)
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-[#F7F7F5] p-1 rounded-xl border border-[#E8E8E5]">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg text-[14px] font-semibold transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#171717] shadow-2xs'
                  : 'text-[#737373] hover:text-[#171717]'
              }`}
            >
              Карточки R&D
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-4 py-2 rounded-lg text-[14px] font-semibold transition cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white text-[#171717] shadow-2xs'
                  : 'text-[#737373] hover:text-[#171717]'
              }`}
            >
              Доска этапов
            </button>
          </div>

          {!isStrategyMode && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-2 h-11 rounded-xl bg-[#111111] text-white px-5 text-[15px] font-semibold hover:bg-neutral-800 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Новая разработка</span>
            </button>
          )}
        </div>
      </div>

      {/* Фильтр по этапам R&D */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setStageFilter('ALL')}
          className={`px-4 py-2 rounded-xl text-[14px] font-semibold border transition cursor-pointer ${
            stageFilter === 'ALL'
              ? 'bg-[#111111] text-white border-[#111111]'
              : 'bg-white text-[#171717] border-[#E8E8E5] hover:border-[#171717]'
          }`}
        >
          Все этапы ({concepts.filter((c) => !c.isArchived).length})
        </button>
        {KANBAN_MAIN_STAGES.map((st) => (
          <button
            key={st}
            onClick={() => setStageFilter(st)}
            className={`px-4 py-2 rounded-xl text-[14px] font-semibold border transition cursor-pointer ${
              stageFilter === st
                ? 'bg-[#111111] text-white border-[#111111]'
                : 'bg-white text-[#171717] border-[#E8E8E5] hover:border-[#171717]'
            }`}
          >
            {CONCEPT_STAGE_LABELS_RU[st]}
          </button>
        ))}
      </div>

      {/* РЕЖИМ 1: КРУПНЫЕ КАРТОЧКИ R&D С ЧИСТЫМИ ПРЕДМЕТНЫМИ ЭСКИЗАМИ */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredConcepts.map((concept) => {
            const isBorners = concept.brandId === 'BORNERS';
            const estMargin =
              concept.plannedRetailPrice > 0
                ? Math.round(
                    ((concept.plannedRetailPrice - concept.plannedUnitCost) /
                      concept.plannedRetailPrice) *
                      100
                  )
                : 0;

            return (
              <div
                key={concept.id}
                onClick={() => {
                  setSelectedConceptId(concept.id);
                  setDrawerTab('overview');
                  setIsEditingTechPack(false);
                }}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-[#E8E8E5] hover:border-[#171717] p-6 flex flex-col justify-between transition cursor-pointer group space-y-5"
              >
                <div className="space-y-4">
                  {/* Предметный эскиз в чистой рамке */}
                  <div className="h-44 w-full rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] flex items-center justify-center p-4">
                    <img
                      src={concept.imageUrl}
                      alt={concept.name}
                      className="h-full w-full object-contain group-hover:scale-[1.03] transition-transform"
                    />
                  </div>

                  {/* Код и этап */}
                  <div className="flex items-center justify-between gap-2 text-[13px]">
                    <div className="flex items-center gap-2 font-semibold">
                      <span style={{ color: isBorners ? '#D97745' : '#8B8078' }}>
                        {isBorners ? 'BORNERS' : 'НА ТЕЛЕ'}
                      </span>
                      <span className="text-[#737373]">· {concept.code}</span>
                      {concept.isDemo && (
                        <span className="px-1.5 py-0.5 rounded bg-[#F7F7F5] border border-[#E8E8E5] text-[10px] font-semibold text-[#737373]">
                          DEMO
                        </span>
                      )}
                    </div>

                    <span className="px-2.5 py-1 rounded-lg bg-[#F7F7F5] border border-[#E8E8E5] font-semibold text-[#171717]">
                      {CONCEPT_STAGE_LABELS_RU[concept.stage]}
                    </span>
                  </div>

                  {/* Название и идея */}
                  <div>
                    <h3 className="text-[20px] font-bold text-[#171717] dark:text-white leading-snug">
                      {concept.name}
                    </h3>
                    <p className="text-[14px] text-[#737373] mt-1.5 leading-relaxed line-clamp-2">
                      {concept.ideaDescription}
                    </p>
                  </div>

                  {/* Спецификация ткани */}
                  <div className="pt-3 border-t border-[#E8E8E5] text-[14px]">
                    <span className="font-semibold text-[#171717]">Сырьё: </span>
                    <span className="text-[#737373]">
                      {concept.techPack.ru.material} ({concept.techPack.ru.compositionAndDensity})
                    </span>
                  </div>
                </div>

                {/* Нижний блок экономики и сэмплов */}
                <div className="pt-4 border-t border-[#E8E8E5] space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-[12px] text-[#737373]">План с/с</div>
                      <div className="text-[18px] font-bold text-[#171717] mt-0.5">
                        {hasCostAccess
                          ? formatCurrencyRub(concept.plannedUnitCost)
                          : 'Скрыто'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[12px] text-[#737373]">План РРЦ</div>
                      <div className="text-[18px] font-bold text-[#171717] mt-0.5">
                        {formatCurrencyRub(concept.plannedRetailPrice)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[12px] text-[#737373]">Валовая маржа</div>
                      <div className="text-[18px] font-bold text-[#16805D] mt-0.5">
                        {estMargin}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[13px] text-[#737373] pt-2 border-t border-[#E8E8E5]">
                    <span>
                      Дизайн: <b className="text-[#171717]">{concept.selectedDesignVersion}</b> ({concept.designVersions.length})
                    </span>
                    <span className="font-semibold text-[#171717]">
                      Запуск: {concept.targetLaunchDate}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* РЕЖИМ 2: КАНБАН-ДОСКА ЭТАПОВ С DRAG & DROP */}
      {viewMode === 'kanban' && (
        <div className="flex gap-5 overflow-x-auto pb-6">
          {KANBAN_MAIN_STAGES.map((stage) => {
            const stageItems = filteredConcepts.filter((c) => c.stage === stage);
            const isDropTarget = dragOverStage === stage;

            return (
              <div
                key={stage}
                onDragOver={(e) => handleDragOver(e, stage)}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={(e) => handleDrop(e, stage)}
                className={`w-80 shrink-0 rounded-2xl p-4 min-h-[520px] flex flex-col border transition-all ${
                  isDropTarget
                    ? 'bg-white border-2 border-[#D97745] shadow-lg'
                    : 'bg-white/70 dark:bg-zinc-900 border-[#E8E8E5]'
                }`}
              >
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E8E8E5]">
                  <span className="text-[14px] font-bold text-[#171717]">
                    {CONCEPT_STAGE_LABELS_RU[stage]}
                  </span>
                  <span className="text-[13px] font-semibold text-[#737373] bg-[#F7F7F5] px-2.5 py-0.5 rounded-lg border border-[#E8E8E5]">
                    {stageItems.length}
                  </span>
                </div>

                <div className="space-y-3.5 flex-1">
                  {stageItems.map((concept) => {
                    const isDragged = draggedConceptId === concept.id;
                    return (
                      <div
                        key={concept.id}
                        draggable={!isStrategyMode}
                        onDragStart={(e) => handleDragStart(e, concept.id)}
                        onDragEnd={() => {
                          setDraggedConceptId(null);
                          setDragOverStage(null);
                        }}
                        onClick={() => {
                          setSelectedConceptId(concept.id);
                          setDrawerTab('overview');
                          setIsEditingTechPack(false);
                        }}
                        className={`bg-white rounded-xl border border-[#E8E8E5] hover:border-[#171717] p-4 space-y-3 cursor-grab active:cursor-grabbing transition ${
                          isDragged ? 'opacity-40 scale-95' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between text-[13px] font-semibold">
                          <span className="inline-flex items-center gap-1.5 text-[#171717]">
                            <GripVertical className="h-4 w-4 text-[#737373]" />
                            {concept.code}
                          </span>
                          <span className="text-[#737373]">
                            {concept.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : 'BORNERS'}
                          </span>
                        </div>

                        <div className="text-[16px] font-bold text-[#171717] leading-snug">
                          {concept.name}
                        </div>

                        <div className="text-[14px] text-[#737373] line-clamp-2">
                          {concept.sampleStatus}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-[#E8E8E5] text-[13px]">
                          <span className="text-[#737373]">
                            РРЦ: {formatCurrencyRub(concept.plannedRetailPrice)}
                          </span>
                          <span className="font-semibold text-[#171717]">
                            {concept.targetLaunchDate}
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

      {/* БОКОВАЯ ПАНЕЛЬ ПРОТОТИПА И ТЕХПАКЕТА ФАБРИКИ (п. 7 и 25 ТЗ) */}
      {activeConcept && (
        <div
          onClick={() => setSelectedConceptId(null)}
          className="fixed inset-0 z-50 flex justify-end bg-black/40"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl bg-white dark:bg-zinc-900 h-full overflow-y-auto p-8 md:p-10 space-y-8 shadow-2xl border-l border-[#E8E8E5]"
          >
            {/* Шапка */}
            <div className="flex items-start justify-between gap-4 border-b border-[#E8E8E5] pb-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 text-[13px] font-semibold">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#111111] text-white">
                    {activeConcept.code}
                  </span>
                  <span className="text-[#737373]">
                    {activeConcept.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : 'BORNERS'} ·{' '}
                    {activeConcept.collectionName}
                  </span>
                  {activeConcept.isDemo && (
                    <span className="px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E8E8E5] text-[11px] text-[#737373]">
                      DEMO
                    </span>
                  )}
                </div>
                <h2 className="text-[28px] font-bold text-[#171717] dark:text-white">
                  {activeConcept.name}
                </h2>
              </div>

              <button
                onClick={() => setSelectedConceptId(null)}
                className="rounded-xl border border-[#E8E8E5] p-2 text-[#171717] hover:bg-[#111111] hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Переключение этапа, выпуск в каталог и создание запуска */}
            {!isStrategyMode && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E8E5] pb-6">
                <div className="flex items-center gap-3">
                  <span className="text-[14px] font-semibold">Этап R&D:</span>
                  <select
                    value={activeConcept.stage}
                    onChange={(e) =>
                      updateConceptStage(activeConcept.id, e.target.value as ConceptStage)
                    }
                    className="h-11 rounded-xl border border-[#E8E8E5] px-3.5 text-[14px] font-semibold bg-white cursor-pointer"
                  >
                    {[...KANBAN_MAIN_STAGES, ...EXTRA_STAGES].map((st) => (
                      <option key={st} value={st}>
                        {CONCEPT_STAGE_LABELS_RU[st]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => handleCreateLaunchFromConcept(activeConcept)}
                    className="inline-flex items-center gap-2 h-11 rounded-xl border border-[#E8E8E5] bg-white px-4 text-[14px] font-semibold text-[#171717] hover:bg-[#F7F7F5] transition cursor-pointer"
                  >
                    <CalendarPlus className="h-4 w-4" />
                    <span>Создать запуск в календаре</span>
                  </button>

                  <button
                    onClick={() => createProductFromConcept(activeConcept.id)}
                    className="h-11 rounded-xl bg-[#111111] text-white px-5 text-[14px] font-semibold hover:bg-neutral-800 transition cursor-pointer"
                  >
                    Выпустить в каталог SKU →
                  </button>
                </div>
              </div>
            )}

            {/* Вкладки внутри прототипа */}
            <div className="flex bg-[#F7F7F5] p-1 rounded-xl border border-[#E8E8E5]">
              <button
                onClick={() => setDrawerTab('overview')}
                className={`flex-1 py-2.5 rounded-lg text-[14px] font-semibold transition cursor-pointer ${
                  drawerTab === 'overview'
                    ? 'bg-white text-[#171717] shadow-2xs'
                    : 'text-[#737373] hover:text-[#171717]'
                }`}
              >
                Паспорт, сэмплы и версии дизайна ({activeConcept.designVersions.length})
              </button>
              <button
                onClick={() => setDrawerTab('techpack')}
                className={`flex-1 py-2.5 rounded-lg text-[14px] font-semibold transition cursor-pointer ${
                  drawerTab === 'techpack'
                    ? 'bg-white text-[#171717] shadow-2xs'
                    : 'text-[#737373] hover:text-[#171717]'
                }`}
              >
                ТЗ для фабрики (ZH / EN / RU)
              </button>
              {!isStrategyMode && (
                <button
                  onClick={() => setDrawerTab('comments')}
                  className={`flex-1 py-2.5 rounded-lg text-[14px] font-semibold transition cursor-pointer ${
                    drawerTab === 'comments'
                      ? 'bg-white text-[#171717] shadow-2xs'
                      : 'text-[#737373] hover:text-[#171717]'
                  }`}
                >
                  Обсуждение ({activeConcept.comments.length})
                </button>
              )}
            </div>

            {/* Вкладка 1: Паспорт, сэмплы и версии дизайна */}
            {drawerTab === 'overview' && (
              <div className="space-y-8 text-[15px]">
                <div className="h-52 w-full rounded-2xl bg-[#F7F7F5] border border-[#E8E8E5] flex items-center justify-center p-5">
                  <img
                    src={activeConcept.imageUrl}
                    alt={activeConcept.name}
                    className="h-full w-full object-contain"
                  />
                </div>

                <div>
                  <div className="text-[13px] font-semibold text-[#737373] mb-1">
                    Идея и решаемая проблема клиента
                  </div>
                  <p className="font-semibold text-[#171717] leading-relaxed">
                    {activeConcept.ideaDescription}
                  </p>
                  <p className="text-[#737373] mt-2">{activeConcept.customerProblem}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-[#E8E8E5]">
                  <div>
                    <div className="text-[13px] font-semibold text-[#737373] mb-1">
                      Статус образца (Sample)
                    </div>
                    <div className="font-semibold text-[#171717]">
                      {activeConcept.sampleStatus}
                    </div>
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-[#737373] mb-1">
                      Результаты тестирования
                    </div>
                    <div className="text-[#171717]">{activeConcept.testResults}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 pt-4 border-t border-[#E8E8E5]">
                  <div>
                    <div className="text-[13px] text-[#737373]">Плановая с/с</div>
                    <div className="text-[22px] font-bold mt-1">
                      {hasCostAccess
                        ? formatCurrencyRub(activeConcept.plannedUnitCost)
                        : 'Скрыто'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[13px] text-[#737373]">Плановая РРЦ</div>
                    <div className="text-[22px] font-bold mt-1">
                      {formatCurrencyRub(activeConcept.plannedRetailPrice)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[13px] text-[#737373]">Бюджет R&D</div>
                    <div className="text-[22px] font-bold text-[#171717] mt-1">
                      {formatCurrencyRub(activeConcept.developmentBudgetRub)}
                    </div>
                  </div>
                </div>

                {/* ИСТОРИЯ ВЕРСИЙ ДИЗАЙНА И ЗАГРУЗКА РЕНДЕРА (п. 7 и 25 ТЗ) */}
                <div className="space-y-4 pt-6 border-t border-[#E8E8E5]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-[18px] font-bold text-[#171717]">
                        Версии дизайна и сэмплов
                      </h3>
                      <p className="text-[13px] text-[#737373]">
                        Утверждённая версия передаётся в техпакет фабрики и при выпуске в каталог SKU
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-lg bg-[#16805D]/10 text-[#16805D] text-[13px] font-semibold">
                      Финальный выбор: {activeConcept.selectedDesignVersion}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeConcept.designVersions.map((ver) => {
                      const isSelected =
                        activeConcept.selectedDesignVersion === ver.version;
                      return (
                        <div
                          key={ver.version}
                          className={`rounded-xl border p-4 space-y-3 transition ${
                            isSelected
                              ? 'border-[#171717] bg-[#F7F7F5]/70'
                              : 'border-[#E8E8E5] bg-white'
                          }`}
                        >
                          <div className="h-28 w-full rounded-lg bg-[#F7F7F5] border border-[#E8E8E5] flex items-center justify-center p-2">
                            <img
                              src={ver.imageUrl || activeConcept.imageUrl}
                              alt={`v${ver.version}`}
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <div className="flex items-center justify-between text-[13px]">
                            <span className="font-bold text-[#171717]">
                              v{ver.version} · {ver.title}
                            </span>
                            <span className="text-[#737373]">{ver.createdAt}</span>
                          </div>
                          <p className="text-[13px] text-[#737373] leading-snug">
                            {ver.notes}
                          </p>
                          <div className="flex items-center justify-between pt-2 border-t border-[#E8E8E5] text-[12px]">
                            <span className="text-[#737373]">{ver.authorName}</span>
                            {isSelected ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-[#16805D]">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Финальный
                              </span>
                            ) : (
                              canEditActiveConcept && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSelectFinalVersion(
                                      activeConcept,
                                      ver.version,
                                      ver.imageUrl
                                    )
                                  }
                                  className="font-semibold text-[#171717] hover:underline cursor-pointer"
                                >
                                  Выбрать финальным
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Загрузка нового эскиза / рендера */}
                  {canEditActiveConcept && (
                    <div className="rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] p-4 flex flex-wrap items-center justify-between gap-3">
                      <input
                        value={newVersionSummary}
                        onChange={(e) => setNewVersionSummary(e.target.value)}
                        placeholder="Комментарий к новой версии лекал / рендера..."
                        className="flex-1 min-w-[220px] h-10 rounded-lg bg-white border border-[#E8E8E5] px-3 text-[14px]"
                      />
                      <label className="inline-flex items-center gap-2 h-10 rounded-lg bg-[#111111] text-white px-4 text-[13px] font-semibold hover:bg-neutral-800 transition cursor-pointer">
                        <ImagePlus className="h-4 w-4" />
                        <span>Загрузить эскиз / рендер</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUploadDesignVersion(e, activeConcept)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Вкладка 2: Техпакет для фабрики (китайский первым по п. 7 ТЗ + редактирование + PDF) */}
            {drawerTab === 'techpack' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex bg-[#F7F7F5] p-1 rounded-xl border border-[#E8E8E5]">
                    <button
                      onClick={() => {
                        setTechPackLang('zh');
                        setIsEditingTechPack(false);
                      }}
                      className={`px-4 py-2 rounded-lg text-[14px] font-semibold cursor-pointer ${
                        techPackLang === 'zh'
                          ? 'bg-white text-[#171717] shadow-2xs'
                          : 'text-[#737373]'
                      }`}
                    >
                      中文 (Китайский)
                    </button>
                    <button
                      onClick={() => {
                        setTechPackLang('en');
                        setIsEditingTechPack(false);
                      }}
                      className={`px-4 py-2 rounded-lg text-[14px] font-semibold cursor-pointer ${
                        techPackLang === 'en'
                          ? 'bg-white text-[#171717] shadow-2xs'
                          : 'text-[#737373]'
                      }`}
                    >
                      EN (English)
                    </button>
                    <button
                      onClick={() => {
                        setTechPackLang('ru');
                        setIsEditingTechPack(false);
                      }}
                      className={`px-4 py-2 rounded-lg text-[14px] font-semibold cursor-pointer ${
                        techPackLang === 'ru'
                          ? 'bg-white text-[#171717] shadow-2xs'
                          : 'text-[#737373]'
                      }`}
                    >
                      RU (Русский)
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {canEditActiveConcept && !isEditingTechPack && (
                      <button
                        onClick={() => startEditTechPack(activeConcept, techPackLang)}
                        className="inline-flex items-center gap-1.5 h-10 rounded-xl border border-[#E8E8E5] bg-white px-3.5 text-[13px] font-semibold text-[#171717] hover:bg-[#F7F7F5] cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Редактировать ТЗ</span>
                      </button>
                    )}

                    <button
                      onClick={() => handlePrintPdfTechPack(activeConcept)}
                      className="inline-flex items-center gap-1.5 h-10 rounded-xl border border-[#E8E8E5] bg-white px-3.5 text-[13px] font-semibold text-[#171717] hover:bg-[#F7F7F5] cursor-pointer"
                    >
                      <Printer className="h-4 w-4" />
                      <span>Печать / PDF</span>
                    </button>

                    <button
                      onClick={() => handleExportFactorySheet(activeConcept)}
                      className="inline-flex items-center gap-1.5 h-10 rounded-xl bg-[#111111] text-white px-4 text-[13px] font-semibold cursor-pointer"
                    >
                      <FileDown className="h-4 w-4" />
                      <span>Скачать .TXT</span>
                    </button>
                  </div>
                </div>

                {isEditingTechPack && techPackDraft ? (
                  <div className="space-y-4 rounded-2xl border border-[#E8E8E5] p-6 bg-[#F7F7F5]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[14px]">
                      <div>
                        <label className="block font-semibold mb-1">Модель / Style Name</label>
                        <input
                          value={techPackDraft.modelName}
                          onChange={(e) =>
                            setTechPackDraft({ ...techPackDraft, modelName: e.target.value })
                          }
                          className="w-full h-10 rounded-lg bg-white border border-[#E8E8E5] px-3"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Конструкция / Construction</label>
                        <input
                          value={techPackDraft.construction}
                          onChange={(e) =>
                            setTechPackDraft({ ...techPackDraft, construction: e.target.value })
                          }
                          className="w-full h-10 rounded-lg bg-white border border-[#E8E8E5] px-3"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Материал / Fabric</label>
                        <input
                          value={techPackDraft.material}
                          onChange={(e) =>
                            setTechPackDraft({ ...techPackDraft, material: e.target.value })
                          }
                          className="w-full h-10 rounded-lg bg-white border border-[#E8E8E5] px-3"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Состав и плотность / GSM</label>
                        <input
                          value={techPackDraft.compositionAndDensity}
                          onChange={(e) =>
                            setTechPackDraft({
                              ...techPackDraft,
                              compositionAndDensity: e.target.value,
                            })
                          }
                          className="w-full h-10 rounded-lg bg-white border border-[#E8E8E5] px-3"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Цвет и Pantone</label>
                        <input
                          value={techPackDraft.colorAndPantone}
                          onChange={(e) =>
                            setTechPackDraft({
                              ...techPackDraft,
                              colorAndPantone: e.target.value,
                            })
                          }
                          className="w-full h-10 rounded-lg bg-white border border-[#E8E8E5] px-3"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Размерная сетка / Grading</label>
                        <input
                          value={techPackDraft.sizeGrading}
                          onChange={(e) =>
                            setTechPackDraft({ ...techPackDraft, sizeGrading: e.target.value })
                          }
                          className="w-full h-10 rounded-lg bg-white border border-[#E8E8E5] px-3"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Пояс / Waistband</label>
                        <input
                          value={techPackDraft.waistbandSpec}
                          onChange={(e) =>
                            setTechPackDraft({
                              ...techPackDraft,
                              waistbandSpec: e.target.value,
                            })
                          }
                          className="w-full h-10 rounded-lg bg-white border border-[#E8E8E5] px-3"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Швы / Seams</label>
                        <input
                          value={techPackDraft.seamsSpec}
                          onChange={(e) =>
                            setTechPackDraft({ ...techPackDraft, seamsSpec: e.target.value })
                          }
                          className="w-full h-10 rounded-lg bg-white border border-[#E8E8E5] px-3"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Упаковка / Packaging</label>
                        <input
                          value={techPackDraft.packagingSpec}
                          onChange={(e) =>
                            setTechPackDraft({
                              ...techPackDraft,
                              packagingSpec: e.target.value,
                            })
                          }
                          className="w-full h-10 rounded-lg bg-white border border-[#E8E8E5] px-3"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Требования ОТК / QC</label>
                        <input
                          value={techPackDraft.qualityRequirements}
                          onChange={(e) =>
                            setTechPackDraft({
                              ...techPackDraft,
                              qualityRequirements: e.target.value,
                            })
                          }
                          className="w-full h-10 rounded-lg bg-white border border-[#E8E8E5] px-3"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block font-semibold mb-1">Примечания / Reference Note</label>
                        <input
                          value={techPackDraft.referencesNote}
                          onChange={(e) =>
                            setTechPackDraft({
                              ...techPackDraft,
                              referencesNote: e.target.value,
                            })
                          }
                          className="w-full h-10 rounded-lg bg-white border border-[#E8E8E5] px-3"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-[#E8E8E5]">
                      <button
                        onClick={() => setIsEditingTechPack(false)}
                        className="h-10 px-4 rounded-xl border border-[#E8E8E5] bg-white text-[13px] font-semibold cursor-pointer"
                      >
                        Отмена
                      </button>
                      <button
                        onClick={() => saveTechPack(activeConcept)}
                        className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl bg-[#111111] text-white text-[13px] font-semibold cursor-pointer"
                      >
                        <Save className="h-4 w-4" />
                        <span>Сохранить спецификацию</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  (() => {
                    const spec = activeConcept.techPack[techPackLang];
                    return (
                      <div className="rounded-2xl border border-[#E8E8E5] divide-y divide-[#E8E8E5] text-[15px]">
                        <div className="p-4 grid grid-cols-3 gap-4">
                          <span className="text-[#737373] text-[14px]">Модель / Style</span>
                          <span className="col-span-2 font-semibold">{spec.modelName}</span>
                        </div>
                        <div className="p-4 grid grid-cols-3 gap-4">
                          <span className="text-[#737373] text-[14px]">Конструкция</span>
                          <span className="col-span-2">{spec.construction}</span>
                        </div>
                        <div className="p-4 grid grid-cols-3 gap-4">
                          <span className="text-[#737373] text-[14px]">
                            Материал и плотность
                          </span>
                          <span className="col-span-2">
                            {spec.material} · {spec.compositionAndDensity}
                          </span>
                        </div>
                        <div className="p-4 grid grid-cols-3 gap-4">
                          <span className="text-[#737373] text-[14px]">Цвет и Pantone</span>
                          <span className="col-span-2">{spec.colorAndPantone}</span>
                        </div>
                        <div className="p-4 grid grid-cols-3 gap-4">
                          <span className="text-[#737373] text-[14px]">Размерная сетка</span>
                          <span className="col-span-2">{spec.sizeGrading}</span>
                        </div>
                        <div className="p-4 grid grid-cols-3 gap-4">
                          <span className="text-[#737373] text-[14px]">Пояс и швы</span>
                          <span className="col-span-2">
                            {spec.waistbandSpec} · {spec.seamsSpec}
                          </span>
                        </div>
                        <div className="p-4 grid grid-cols-3 gap-4">
                          <span className="text-[#737373] text-[14px]">
                            Упаковка и ОТК
                          </span>
                          <span className="col-span-2">
                            {spec.packagingSpec} · {spec.qualityRequirements}
                          </span>
                        </div>
                        <div className="p-4 grid grid-cols-3 gap-4">
                          <span className="text-[#737373] text-[14px]">Примечания R&D</span>
                          <span className="col-span-2 text-[#737373]">{spec.referencesNote}</span>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            )}

            {/* Вкладка 3: Комментарии */}
            {drawerTab === 'comments' && !isStrategyMode && (
              <div className="space-y-6">
                <div className="space-y-3">
                  {activeConcept.comments.map((cm) => (
                    <div
                      key={cm.id}
                      className="rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] p-4 text-[15px] space-y-1"
                    >
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="font-semibold text-[#171717]">
                          {cm.authorName} ({ROLE_LABELS_RU[cm.authorRole]})
                        </span>
                        <span className="text-[#737373]">
                          {cm.createdAt}
                        </span>
                      </div>
                      <p className="text-[#171717]">{cm.text}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Заметка технолога или комментарий..."
                    className="flex-1 h-11 rounded-xl border border-[#E8E8E5] px-4 text-[15px]"
                  />
                  <button
                    onClick={() => {
                      if (!commentText.trim()) return;
                      updateConcept(activeConcept.id, {
                        comments: [
                          ...activeConcept.comments,
                          {
                            id: `cm-${Date.now()}`,
                            authorName: currentUser.fullName,
                            authorRole: currentUser.role,
                            text: commentText.trim(),
                            createdAt: new Date().toISOString().slice(0, 10),
                          },
                        ],
                      });
                      setCommentText('');
                    }}
                    className="h-11 rounded-xl bg-[#111111] text-white px-5 text-[14px] font-semibold cursor-pointer"
                  >
                    Отправить
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Модальное окно новой концепции с загрузкой фото */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl border border-[#E8E8E5] p-8 space-y-6 shadow-2xl">
            <h3 className="text-[22px] font-bold border-b border-[#E8E8E5] pb-4">
              Новая разработка в R&D
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[14px]">
              <div>
                <label className="block font-semibold mb-1.5">Код разработки</label>
                <input
                  value={newConceptForm.code}
                  onChange={(e) =>
                    setNewConceptForm({ ...newConceptForm, code: e.target.value })
                  }
                  className="w-full h-11 rounded-xl border border-[#E8E8E5] px-3.5 text-[15px]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1.5">Бренд</label>
                <select
                  value={newConceptForm.brandId}
                  onChange={(e) =>
                    setNewConceptForm({ ...newConceptForm, brandId: e.target.value })
                  }
                  className="w-full h-11 rounded-xl border border-[#E8E8E5] px-3.5 text-[15px] bg-white font-medium"
                >
                  <option value="BORNERS">BORNERS</option>
                  <option value="NA_TELE">НА ТЕЛЕ</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1.5">Рабочее название</label>
                <input
                  value={newConceptForm.name}
                  onChange={(e) =>
                    setNewConceptForm({ ...newConceptForm, name: e.target.value })
                  }
                  placeholder="Например: Футболка BORNERS Heavy Pima 240 г/м²"
                  className="w-full h-11 rounded-xl border border-[#E8E8E5] px-3.5 text-[15px]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1.5">Идея и отличия модели</label>
                <input
                  value={newConceptForm.ideaDescription}
                  onChange={(e) =>
                    setNewConceptForm({
                      ...newConceptForm,
                      ideaDescription: e.target.value,
                    })
                  }
                  className="w-full h-11 rounded-xl border border-[#E8E8E5] px-3.5 text-[15px]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1.5">Плановая себестоимость (₽)</label>
                <input
                  type="number"
                  value={newConceptForm.plannedUnitCost}
                  onChange={(e) =>
                    setNewConceptForm({
                      ...newConceptForm,
                      plannedUnitCost: e.target.value,
                    })
                  }
                  className="w-full h-11 rounded-xl border border-[#E8E8E5] px-3.5 text-[15px]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1.5">Плановая РРЦ (₽)</label>
                <input
                  type="number"
                  value={newConceptForm.plannedRetailPrice}
                  onChange={(e) =>
                    setNewConceptForm({
                      ...newConceptForm,
                      plannedRetailPrice: e.target.value,
                    })
                  }
                  className="w-full h-11 rounded-xl border border-[#E8E8E5] px-3.5 text-[15px]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1.5">Эскиз / рендер (опционально)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const r = new FileReader();
                    r.onload = () => {
                      if (typeof r.result === 'string') {
                        setNewConceptForm((prev) => ({ ...prev, imageUrl: r.result as string }));
                      }
                    };
                    r.readAsDataURL(f);
                  }}
                  className="w-full text-[13px] text-[#737373]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-[#E8E8E5]">
              <button
                onClick={() => setCreateModalOpen(false)}
                className="h-11 px-5 rounded-xl border border-[#E8E8E5] text-[14px] font-semibold cursor-pointer"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateConcept}
                className="h-11 px-6 rounded-xl bg-[#111111] text-white text-[14px] font-semibold cursor-pointer"
              >
                Создать карточку R&D
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
