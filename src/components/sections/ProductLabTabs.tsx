'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  AppUser,
  Competitor,
  ConceptStage,
  Launch,
  Product,
  ProductConcept,
  RnDAnalysisReport,
  RnDDevelopmentType,
  RnDLaunchChecklist,
  RnDMarketEvidence,
  RnDPostLaunchCheckpoint,
  RnDProductionInternalStatus,
  RnDSampleItem,
  TaskItem,
} from '@/types/platform';
import {
  RND_DEVELOPMENT_TYPE_LABELS_RU,
  ROLE_LABELS_RU,
  canUserApproveProduction,
  canUserViewCostPrice,
  formatCurrencyRub,
} from '@/lib/finance';

export type RnDCardTabId =
  | 'overview'
  | 'analysis'
  | 'samples'
  | 'testing'
  | 'decisions'
  | 'production'
  | 'launch'
  | 'files'
  | 'history';

export const RND_CARD_TABS: { id: RnDCardTabId; label: string }[] = [
  { id: 'overview', label: '01 · Идея' },
  { id: 'analysis', label: '02 · Анализ' },
  { id: 'samples', label: '03 · Образец' },
  { id: 'testing', label: '04 · Тест' },
  { id: 'decisions', label: '05 · Решение' },
  { id: 'production', label: '06 · Производство' },
  { id: 'launch', label: '07 · Запуск' },
  { id: 'files', label: 'Комментарии' },
  { id: 'history', label: 'История' },
];

export const PRODUCTION_INTERNAL_STATUSES: {
  code: RnDProductionInternalStatus;
  label: string;
}[] = [
  { code: 'order_prep', label: 'Подготовка' },
  { code: 'order_placed', label: 'Заказ размещён' },
  { code: 'in_production', label: 'В пошиве' },
  { code: 'qc_inspection', label: 'Проверка ОТК' },
  { code: 'ready', label: 'Готово к отгрузке' },
  { code: 'in_delivery', label: 'В доставке' },
  { code: 'received', label: 'Принято на склад' },
];

export interface ProductLabCardBodyProps {
  concept: ProductConcept;
  activeTab: RnDCardTabId;
  canEdit: boolean;
  isStrategyMode: boolean;
  currentUser: AppUser;
  users: AppUser[];
  products: Product[];
  launches: Launch[];
  tasks: TaskItem[];
  competitors: Competitor[];
  onUpdateConcept: (id: string, patch: Partial<ProductConcept>) => void;
  onChangeStageWithGate: (concept: ProductConcept, targetStage: ConceptStage) => void;
  onCreateLaunchFromConcept: (concept: ProductConcept) => void;
  onCreateProductFromConcept: (conceptId: string) => void;
  onCreateTaskForConcept: (title: string, assigneeId: string, deadline: string) => void;
  onNavigateToSection: (
    section:
      | 'product-catalog'
      | 'launch-calendar'
      | 'roadmap-tasks'
      | 'market-intelligence'
      | 'brand-strategy'
      | 'documents',
    opts?: { productId?: string; launchId?: string }
  ) => void;
  notify: (type: 'success' | 'warning' | 'error', title: string, description?: string) => void;
}

export function ProductLabCardBody({
  concept,
  activeTab,
  canEdit,
  currentUser,
  users,
  products,
  onUpdateConcept,
  onChangeStageWithGate,
  onCreateProductFromConcept,
  onNavigateToSection,
  notify,
}: ProductLabCardBodyProps) {
  const hasCostAccess = canUserViewCostPrice(currentUser);
  const canApproveProd = canUserApproveProduction(currentUser, concept.brandId);

  const [newRefLink, setNewRefLink] = useState('');
  const [commentText, setCommentText] = useState('');

  // Конкурент (Этап 02 Анализ) — всего 4 удобных поля
  const [evForm, setEvForm] = useState({
    competitorBrand: '',
    articleSku: '',
    priceRub: '',
    estimatedRevenueRub: '',
    comparisonNote: '',
  });

  // Образец (Этап 03 Образец) — компактная форма
  const [sampleForm, setSampleForm] = useState({
    factoryName: '',
    country: 'Узбекистан',
    materialAndComposition: '',
    estimatedUnitProductionPrice: '',
    comments: '',
  });

  // Партия (Этап 06 Производство)
  const [poForm, setPoForm] = useState({
    factoryName: concept.supplierName || '',
    totalUnits: '3000',
    unitPrice: concept.plannedUnitCost ? String(concept.plannedUnitCost) : '',
    plannedReadyDate: concept.targetLaunchDate || '2027-02-01',
  });

  const currentAnalysis: RnDAnalysisReport = concept.analysisReport || {
    whatWeCreate: concept.ideaDescription || '',
    targetBuyer: concept.targetAudience || '',
    concreteAdvantage: concept.keyDifferentiators || '',
    whyChooseUs: '',
    demandType: 'incremental',
    marketEvidences: [],
    nicheConclusion: '',
    buyerMotives: '',
    competitorProsAndComplaints: '',
    priceBenchmarksAndObjections: '',
    potentialFactories: concept.supplierName || '',
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
  };

  const updateAnalysisField = <K extends keyof RnDAnalysisReport>(
    key: K,
    val: RnDAnalysisReport[K]
  ) => {
    onUpdateConcept(concept.id, {
      analysisReport: {
        ...currentAnalysis,
        [key]: val,
      },
    });
  };

  const parseCleanNumber = (raw: string): number | null => {
    const cleaned = raw.replace(/[^\d]/g, '');
    if (!cleaned) return null;
    return parseInt(cleaned, 10);
  };

  const linkedProduct = products.find(
    (p) => p.id === concept.linkedProductId || p.conceptId === concept.id
  );

  // ===========================================================================
  // ЭТАП 01: ИДЕЯ (Только суть, фото, бренд, ссылки — ничего лишнего!)
  // ===========================================================================
  if (activeTab === 'overview') {
    return (
      <div className="space-y-6 text-[15px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Фото */}
          <div className="lg:col-span-4 rounded-2xl bg-[#F7F7F5] border border-[#E8E8E5] p-5 flex flex-col items-center justify-center min-h-[220px]">
            <img
              src={concept.imageUrl}
              alt={concept.name}
              className="max-h-44 w-full object-contain"
            />
            {canEdit && (
              <label className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#E8E8E5] text-[13px] font-semibold text-[#171717] hover:border-[#171717] cursor-pointer transition">
                <Upload className="h-3.5 w-3.5" />
                <span>Заменить фото</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const r = new FileReader();
                    r.onload = () => {
                      if (typeof r.result === 'string') {
                        onUpdateConcept(concept.id, { imageUrl: r.result });
                      }
                    };
                    r.readAsDataURL(f);
                  }}
                />
              </label>
            )}
          </div>

          {/* Главные поля карточки */}
          <div className="lg:col-span-8 rounded-2xl border border-[#E8E8E5] bg-white p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[14px]">
              <div className="sm:col-span-2">
                <label className="block text-[12px] font-semibold text-[#737373] mb-1">
                  Название модели / идеи
                </label>
                <input
                  disabled={!canEdit}
                  value={concept.name}
                  onChange={(e) => onUpdateConcept(concept.id, { name: e.target.value })}
                  className="w-full h-11 rounded-xl border border-[#E8E8E5] px-3.5 font-bold text-[16px]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#737373] mb-1">
                  Бренд
                </label>
                <select
                  disabled={!canEdit}
                  value={concept.brandId}
                  onChange={(e) => onUpdateConcept(concept.id, { brandId: e.target.value })}
                  className="w-full h-10 rounded-xl border border-[#E8E8E5] px-3 bg-white font-semibold"
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
                  disabled={!canEdit}
                  value={concept.ownerId}
                  onChange={(e) => onUpdateConcept(concept.id, { ownerId: e.target.value })}
                  className="w-full h-10 rounded-xl border border-[#E8E8E5] px-3 bg-white font-semibold"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({ROLE_LABELS_RU[u.role]})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#737373] mb-1">
                  Тип разработки
                </label>
                <select
                  disabled={!canEdit}
                  value={concept.developmentType || 'new_construction'}
                  onChange={(e) =>
                    onUpdateConcept(concept.id, {
                      developmentType: e.target.value as RnDDevelopmentType,
                    })
                  }
                  className="w-full h-10 rounded-xl border border-[#E8E8E5] px-3 bg-white font-medium"
                >
                  {Object.entries(RND_DEVELOPMENT_TYPE_LABELS_RU).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
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
                  disabled={!canEdit}
                  value={concept.targetLaunchDate || ''}
                  onChange={(e) =>
                    onUpdateConcept(concept.id, { targetLaunchDate: e.target.value })
                  }
                  className="w-full h-10 rounded-xl border border-[#E8E8E5] px-3 bg-white font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[12px] font-semibold text-[#737373] mb-1">
                  Следующий конкретный шаг
                </label>
                <input
                  disabled={!canEdit}
                  value={concept.nextStep || ''}
                  onChange={(e) => onUpdateConcept(concept.id, { nextStep: e.target.value })}
                  placeholder="Например: заказать образец на фабрике в Узбекистане"
                  className="w-full h-10 rounded-xl border border-[#E8E8E5] px-3.5 bg-[#F7F7F5]/60 font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Суть идеи и ссылки */}
        <div className="rounded-2xl border border-[#E8E8E5] bg-white p-6 space-y-5">
          <div>
            <label className="block text-[14px] font-bold text-[#171717] mb-2">
              Суть идеи (что понравилось, какую задачу решаем)
            </label>
            <textarea
              rows={3}
              disabled={!canEdit}
              value={concept.whatAttracted ?? concept.ideaDescription ?? ''}
              onChange={(e) =>
                onUpdateConcept(concept.id, {
                  whatAttracted: e.target.value,
                  ideaDescription: e.target.value,
                })
              }
              placeholder="Опишите идею простыми словами: какая ткань, посадка, комплектность или принт..."
              className="w-full rounded-xl border border-[#E8E8E5] p-3.5 text-[14px]"
            />
          </div>

          <div className="space-y-2.5 pt-3 border-t border-[#E8E8E5]">
            <label className="block text-[14px] font-bold text-[#171717]">
              Ссылки на конкурентов / референсы (WB, Ozon, Instagram)
            </label>
            <div className="space-y-1.5">
              {(concept.referenceLinks || []).map((link, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] text-[13px]"
                >
                  <a
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#171717] font-medium underline truncate inline-flex items-center gap-1.5"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{link}</span>
                  </a>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateConcept(concept.id, {
                          referenceLinks: (concept.referenceLinks || []).filter(
                            (_, i) => i !== idx
                          ),
                        })
                      }
                      className="text-[#737373] hover:text-[#DC2626] cursor-pointer px-1"
                    >
                      Удалить
                    </button>
                  )}
                </div>
              ))}
            </div>
            {canEdit && (
              <div className="flex gap-2">
                <input
                  value={newRefLink}
                  onChange={(e) => setNewRefLink(e.target.value)}
                  placeholder="Вставьте ссылку на товар конкурента..."
                  className="flex-1 h-10 rounded-xl border border-[#E8E8E5] px-3.5 text-[13px]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newRefLink.trim()) return;
                    onUpdateConcept(concept.id, {
                      referenceLinks: [...(concept.referenceLinks || []), newRefLink.trim()],
                    });
                    setNewRefLink('');
                  }}
                  className="px-4 h-10 rounded-xl bg-[#111111] text-white text-[13px] font-semibold cursor-pointer"
                >
                  + Добавить ссылку
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // ЭТАП 02: АНАЛИЗ (Гипотеза + Простая таблица конкурентов + Целевая цена)
  // ===========================================================================
  if (activeTab === 'analysis') {
    return (
      <div className="space-y-6 text-[15px]">
        {/* Короткая гипотеза и экономика */}
        <div className="rounded-2xl border border-[#E8E8E5] bg-white p-6 space-y-4">
          <h3 className="text-[18px] font-bold text-[#171717]">
            Продуктовая гипотеза и целевая экономика
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[14px]">
            <div className="md:col-span-2">
              <label className="block text-[12px] font-semibold text-[#737373] mb-1">
                За счёт чего товар выиграет у конкурентов?
              </label>
              <input
                disabled={!canEdit}
                value={currentAnalysis.concreteAdvantage || currentAnalysis.whatWeCreate}
                onChange={(e) => {
                  updateAnalysisField('concreteAdvantage', e.target.value);
                  updateAnalysisField('whatWeCreate', e.target.value);
                }}
                placeholder="Например: плотный модал 180 г/м², не скатывается, выгодный набор 3-4 шт."
                className="w-full h-11 rounded-xl border border-[#E8E8E5] px-3.5"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#737373] mb-1">
                Плановая розничная цена на МП (₽)
              </label>
              <input
                type="text"
                inputMode="numeric"
                disabled={!canEdit}
                value={concept.plannedRetailPrice ? String(concept.plannedRetailPrice) : ''}
                onChange={(e) =>
                  onUpdateConcept(concept.id, {
                    plannedRetailPrice: parseCleanNumber(e.target.value) ?? 0,
                  })
                }
                placeholder="Например: 1890"
                className="w-full h-11 rounded-xl border border-[#E8E8E5] px-3.5 font-bold"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#737373] mb-1">
                Целевая себестоимость 1 ед. (₽)
              </label>
              <input
                type="text"
                inputMode="numeric"
                disabled={!canEdit || !hasCostAccess}
                value={
                  hasCostAccess && concept.plannedUnitCost
                    ? String(concept.plannedUnitCost)
                    : ''
                }
                onChange={(e) =>
                  onUpdateConcept(concept.id, {
                    plannedUnitCost: parseCleanNumber(e.target.value) ?? 0,
                  })
                }
                placeholder={hasCostAccess ? 'Например: 420' : 'Скрыто по правам'}
                className="w-full h-11 rounded-xl border border-[#E8E8E5] px-3.5 font-bold"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[12px] font-semibold text-[#737373] mb-1">
                Жалобы покупателей у конкурентов / на что обратить внимание на фабрике
              </label>
              <textarea
                rows={2}
                disabled={!canEdit}
                value={currentAnalysis.openQuestionsAndRisks}
                onChange={(e) =>
                  updateAnalysisField('openQuestionsAndRisks', e.target.value)
                }
                placeholder="Например: у конкурентов маломерит размер XL и тугая резинка..."
                className="w-full rounded-xl border border-[#E8E8E5] p-3"
              />
            </div>
          </div>
        </div>

        {/* Простая и удобная таблица конкурентов */}
        <div className="rounded-2xl border border-[#E8E8E5] bg-white p-6 space-y-4">
          <h3 className="text-[18px] font-bold text-[#171717]">
            Анализ конкурентов на маркетплейсах
          </h3>

          {currentAnalysis.marketEvidences.length > 0 ? (
            <div className="space-y-2.5">
              {currentAnalysis.marketEvidences.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-xl border border-[#E8E8E5] bg-[#F7F7F5]/60 p-4 flex flex-wrap items-center justify-between gap-4 text-[14px]"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-[#171717]">
                      {ev.competitorBrand}{' '}
                      {ev.articleSku ? `· Арт. ${ev.articleSku}` : ''}
                    </div>
                    {ev.comparisonNote && (
                      <div className="text-[13px] text-[#737373]">{ev.comparisonNote}</div>
                    )}
                  </div>

                  <div className="flex items-center gap-5">
                    <div>
                      <span className="text-[12px] text-[#737373] block">Цена</span>
                      <span className="font-bold text-[#171717]">
                        {formatCurrencyRub(ev.priceRub)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[12px] text-[#737373] block">Выручка / мес.</span>
                      <span className="font-bold text-[#D97745]">
                        {formatCurrencyRub(ev.estimatedRevenueRub)}
                      </span>
                    </div>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() =>
                          updateAnalysisField(
                            'marketEvidences',
                            currentAnalysis.marketEvidences.filter((x) => x.id !== ev.id)
                          )
                        }
                        className="p-2 rounded-lg text-[#737373] hover:text-[#DC2626] hover:bg-white cursor-pointer"
                        title="Удалить конкурента"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-[#F7F7F5] p-4 text-[13px] text-[#737373]">
              Конкуренты пока не добавлены. Добавьте 1–2 референса ниже:
            </div>
          )}

          {canEdit && (
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 pt-3 border-t border-[#E8E8E5] text-[13px]">
              <input
                value={evForm.competitorBrand}
                onChange={(e) =>
                  setEvForm({ ...evForm, competitorBrand: e.target.value })
                }
                placeholder="Бренд (напр. WUCHT)"
                className="h-10 rounded-xl border border-[#E8E8E5] px-3"
              />
              <input
                value={evForm.articleSku}
                onChange={(e) => setEvForm({ ...evForm, articleSku: e.target.value })}
                placeholder="Артикул МП"
                className="h-10 rounded-xl border border-[#E8E8E5] px-3"
              />
              <input
                type="text"
                inputMode="numeric"
                value={evForm.priceRub}
                onChange={(e) =>
                  setEvForm({
                    ...evForm,
                    priceRub: e.target.value.replace(/[^\d]/g, ''),
                  })
                }
                placeholder="Цена (₽)"
                className="h-10 rounded-xl border border-[#E8E8E5] px-3"
              />
              <input
                type="text"
                inputMode="numeric"
                value={evForm.estimatedRevenueRub}
                onChange={(e) =>
                  setEvForm({
                    ...evForm,
                    estimatedRevenueRub: e.target.value.replace(/[^\d]/g, ''),
                  })
                }
                placeholder="Выручка в мес. (₽)"
                className="h-10 rounded-xl border border-[#E8E8E5] px-3"
              />
              <button
                type="button"
                onClick={() => {
                  if (!evForm.competitorBrand.trim()) {
                    notify('warning', 'Укажите название бренда конкурента');
                    return;
                  }
                  const newItem: RnDMarketEvidence = {
                    id: `ev-${Date.now()}`,
                    competitorBrand: evForm.competitorBrand.trim(),
                    articleSku: evForm.articleSku.trim() || '—',
                    productTitle: concept.name,
                    priceRub: parseCleanNumber(evForm.priceRub) || 0,
                    packQty: '1 уп.',
                    estimatedRevenueRub: parseCleanNumber(evForm.estimatedRevenueRub) || 0,
                    observationPeriod: '30 дн.',
                    sourceName: 'Маркетплейс',
                    confidenceStatus: 'verified',
                    comparisonNote: evForm.comparisonNote.trim(),
                  };
                  updateAnalysisField('marketEvidences', [
                    ...currentAnalysis.marketEvidences,
                    newItem,
                  ]);
                  setEvForm({
                    competitorBrand: '',
                    articleSku: '',
                    priceRub: '',
                    estimatedRevenueRub: '',
                    comparisonNote: '',
                  });
                }}
                className="h-10 rounded-xl bg-[#111111] text-white font-semibold cursor-pointer px-4"
              >
                + Добавить
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===========================================================================
  // ЭТАП 03: ОБРАЗЕЦ (Чистый список образцов + быстрое добавление в 1 строку)
  // ===========================================================================
  if (activeTab === 'samples') {
    const samples = concept.samples || [];

    return (
      <div className="space-y-6 text-[15px]">
        <div className="rounded-2xl border border-[#E8E8E5] bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[18px] font-bold text-[#171717]">
              Физические образцы от фабрик ({samples.length})
            </h3>
          </div>

          {samples.length === 0 ? (
            <div className="rounded-xl bg-[#F7F7F5] p-5 text-[14px] text-[#737373]">
              Образцы ещё не добавлены. Заполните форму ниже, чтобы добавить первый образец.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {samples.map((s) => (
                <div
                  key={s.id}
                  className={`rounded-2xl border p-5 space-y-3 ${
                    s.isSelectedForProduction
                      ? 'border-2 border-[#16805D] bg-[#16805D]/5'
                      : 'border-[#E8E8E5] bg-[#F7F7F5]/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-[16px] text-[#171717]">
                        {s.versionCode} · {s.factoryName} ({s.country})
                      </div>
                      <div className="text-[13px] text-[#737373] mt-0.5">
                        {s.materialAndComposition}
                      </div>
                    </div>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateConcept(concept.id, {
                            samples: samples.filter((x) => x.id !== s.id),
                          })
                        }
                        className="p-1.5 rounded-lg text-[#737373] hover:text-[#DC2626] cursor-pointer"
                        title="Удалить образец"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-[13px] pt-2 border-t border-[#E8E8E5]">
                    <span>
                      Себестоимость:{' '}
                      <b>
                        {hasCostAccess && s.estimatedUnitProductionPrice
                          ? `${s.estimatedUnitProductionPrice} ₽`
                          : '—'}
                      </b>
                    </span>
                    <span>
                      Оценка: <b>{s.preliminaryScore}/5</b>
                    </span>
                  </div>

                  {s.comments && (
                    <div className="text-[13px] text-[#171717] bg-white rounded-xl p-3 border border-[#E8E8E5]">
                      {s.comments}
                    </div>
                  )}

                  {canEdit && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateConcept(concept.id, {
                            supplierName: `${s.factoryName} (${s.country})`,
                            plannedUnitCost:
                              s.estimatedUnitProductionPrice || concept.plannedUnitCost,
                            samples: samples.map((item) => ({
                              ...item,
                              isSelectedForProduction: item.id === s.id,
                            })),
                          })
                        }
                        className={`px-3 py-1.5 rounded-xl text-[12px] font-bold cursor-pointer transition ${
                          s.isSelectedForProduction
                            ? 'bg-[#16805D] text-white'
                            : 'bg-white border border-[#E8E8E5] text-[#171717] hover:border-[#171717]'
                        }`}
                      >
                        {s.isSelectedForProduction
                          ? '✓ Выбран основным образцом'
                          : 'Выбрать основным'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Простая форма добавления образца */}
          {canEdit && (
            <div className="pt-4 border-t border-[#E8E8E5] space-y-3">
              <div className="text-[14px] font-bold text-[#171717]">
                + Добавить новый образец
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-[13px]">
                <input
                  value={sampleForm.factoryName}
                  onChange={(e) =>
                    setSampleForm({ ...sampleForm, factoryName: e.target.value })
                  }
                  placeholder="Фабрика (напр. Ташкент Текстиль)"
                  className="h-10 rounded-xl border border-[#E8E8E5] px-3"
                />
                <select
                  value={sampleForm.country}
                  onChange={(e) =>
                    setSampleForm({ ...sampleForm, country: e.target.value })
                  }
                  className="h-10 rounded-xl border border-[#E8E8E5] px-3 bg-white font-medium"
                >
                  <option value="Узбекистан">Узбекистан</option>
                  <option value="Китай">Китай</option>
                  <option value="Россия">Россия</option>
                  <option value="Турция">Турция</option>
                </select>
                <input
                  value={sampleForm.materialAndComposition}
                  onChange={(e) =>
                    setSampleForm({
                      ...sampleForm,
                      materialAndComposition: e.target.value,
                    })
                  }
                  placeholder="Ткань и состав (напр. Модал 92%)"
                  className="h-10 rounded-xl border border-[#E8E8E5] px-3"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={sampleForm.estimatedUnitProductionPrice}
                  onChange={(e) =>
                    setSampleForm({
                      ...sampleForm,
                      estimatedUnitProductionPrice: e.target.value.replace(/[^\d]/g, ''),
                    })
                  }
                  placeholder="Себестоимость 1 шт. (₽)"
                  className="h-10 rounded-xl border border-[#E8E8E5] px-3"
                />
              </div>
              <div className="flex gap-2.5">
                <input
                  value={sampleForm.comments}
                  onChange={(e) =>
                    setSampleForm({ ...sampleForm, comments: e.target.value })
                  }
                  placeholder="Комментарий по качеству образца, посадке и швам..."
                  className="flex-1 h-10 rounded-xl border border-[#E8E8E5] px-3 text-[13px]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!sampleForm.factoryName.trim()) {
                      notify('warning', 'Укажите название фабрики');
                      return;
                    }
                    const newSample: RnDSampleItem = {
                      id: `smp-${Date.now()}`,
                      versionCode: `Образец №${samples.length + 1}`,
                      factoryName: sampleForm.factoryName.trim(),
                      country: sampleForm.country,
                      orderedAt: new Date().toISOString().slice(0, 10),
                      receivedAt: new Date().toISOString().slice(0, 10),
                      materialAndComposition:
                        sampleForm.materialAndComposition.trim() || 'Базовое полотно',
                      densityGsm: 160,
                      sizeTested: 'M / L',
                      color: 'Базовый',
                      measurementsNote: 'В норме',
                      sampleCostRub: 0,
                      estimatedUnitProductionPrice:
                        parseCleanNumber(sampleForm.estimatedUnitProductionPrice) || 0,
                      currency: 'RUB',
                      photos: [],
                      preliminaryScore: 5,
                      comments: sampleForm.comments.trim() || 'Образец получен',
                      status: 'testing',
                      isSelectedForProduction: samples.length === 0,
                    };
                    onUpdateConcept(concept.id, {
                      samples: [...samples, newSample],
                      supplierName: `${newSample.factoryName} (${newSample.country})`,
                    });
                    setSampleForm({
                      factoryName: '',
                      country: 'Узбекистан',
                      materialAndComposition: '',
                      estimatedUnitProductionPrice: '',
                      comments: '',
                    });
                    notify('success', 'Образец добавлен');
                  }}
                  className="h-10 px-5 rounded-xl bg-[#111111] text-white text-[13px] font-semibold cursor-pointer shrink-0"
                >
                  + Сохранить образец
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===========================================================================
  // ЭТАП 04: ТЕСТ (Быстрая проверка посадки, швов и стирки без бюрократии)
  // ===========================================================================
  if (activeTab === 'testing') {
    const protocols = concept.testProtocols || [];
    const latestProtocol = protocols[0];

    const quickSetVerdict = (verdict: 'passed' | 'passed_with_remarks' | 'rework_required') => {
      const sample = concept.samples?.[0];
      const newProt = {
        id: `tp-${Date.now()}`,
        sampleId: sample?.id || 'smp-default',
        sampleVersionLabel: sample?.versionCode || 'Образец №1',
        testDate: new Date().toISOString().slice(0, 10),
        testerName: currentUser.fullName,
        criteria: latestProtocol?.criteria || [],
        washCyclesCount: 5,
        washTempAndMode: '40°C деликатная стирка',
        measurementsBeforeAfter: latestProtocol?.measurementsBeforeAfter || 'Без усадки',
        verdict,
        summaryComment: latestProtocol?.summaryComment || '',
      };
      onUpdateConcept(concept.id, {
        testProtocols: [newProt, ...protocols.slice(1)],
      });
      notify('success', 'Результат теста сохранён');
    };

    return (
      <div className="space-y-6 text-[15px]">
        <div className="rounded-2xl border border-[#E8E8E5] bg-white p-6 space-y-5">
          <h3 className="text-[18px] font-bold text-[#171717]">
            Итог тестирования и проверки после стирки
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'passed' as const,
                title: '✅ Тест пройден успешно',
                desc: 'Посадка, швы и стирка без замечаний',
                activeClass: 'border-[#16805D] bg-[#16805D]/10 text-[#16805D]',
              },
              {
                id: 'passed_with_remarks' as const,
                title: '⚠️ Пройден с замечаниями',
                desc: 'Мелкие правки перед запуском тиража',
                activeClass: 'border-[#D97745] bg-[#D97745]/10 text-[#D97745]',
              },
              {
                id: 'rework_required' as const,
                title: '❌ Требуется перешив образца',
                desc: 'Усадка, плохая посадка или брак ткани',
                activeClass: 'border-[#DC2626] bg-[#DC2626]/10 text-[#DC2626]',
              },
            ].map((opt) => {
              const isSelected = latestProtocol?.verdict === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={!canEdit}
                  onClick={() => quickSetVerdict(opt.id)}
                  className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer ${
                    isSelected
                      ? opt.activeClass
                      : 'border-[#E8E8E5] bg-[#F7F7F5]/60 hover:border-[#171717] text-[#171717]'
                  }`}
                >
                  <div className="font-bold text-[15px]">{opt.title}</div>
                  <div className="text-[12px] opacity-80 mt-1">{opt.desc}</div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-[13px] font-semibold text-[#737373] mb-1.5">
                Как образец повёл себя в носке и на примерке (посадка, резинка, швы)
              </label>
              <textarea
                rows={3}
                disabled={!canEdit}
                value={latestProtocol?.summaryComment || ''}
                onChange={(e) => {
                  const text = e.target.value;
                  const sample = concept.samples?.[0];
                  const updated = {
                    id: latestProtocol?.id || `tp-${Date.now()}`,
                    sampleId: sample?.id || 'smp-1',
                    sampleVersionLabel: sample?.versionCode || 'Образец №1',
                    testDate: new Date().toISOString().slice(0, 10),
                    testerName: currentUser.fullName,
                    criteria: latestProtocol?.criteria || [],
                    washCyclesCount: 5,
                    washTempAndMode: '40°C',
                    measurementsBeforeAfter:
                      latestProtocol?.measurementsBeforeAfter || '',
                    verdict: latestProtocol?.verdict || 'passed',
                    summaryComment: text,
                  };
                  onUpdateConcept(concept.id, {
                    testProtocols: [updated, ...protocols.slice(1)],
                  });
                }}
                placeholder="Напишите коротко: удобно ли сидит, не скручивается ли резинка..."
                className="w-full rounded-xl border border-[#E8E8E5] p-3 text-[14px]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#737373] mb-1.5">
                Результат после стирки (усадка, катышки, цвет)
              </label>
              <textarea
                rows={3}
                disabled={!canEdit}
                value={latestProtocol?.measurementsBeforeAfter || ''}
                onChange={(e) => {
                  const text = e.target.value;
                  const sample = concept.samples?.[0];
                  const updated = {
                    id: latestProtocol?.id || `tp-${Date.now()}`,
                    sampleId: sample?.id || 'smp-1',
                    sampleVersionLabel: sample?.versionCode || 'Образец №1',
                    testDate: new Date().toISOString().slice(0, 10),
                    testerName: currentUser.fullName,
                    criteria: latestProtocol?.criteria || [],
                    washCyclesCount: 5,
                    washTempAndMode: '40°C',
                    measurementsBeforeAfter: text,
                    verdict: latestProtocol?.verdict || 'passed',
                    summaryComment: latestProtocol?.summaryComment || '',
                  };
                  onUpdateConcept(concept.id, {
                    testProtocols: [updated, ...protocols.slice(1)],
                  });
                }}
                placeholder="Например: после 5 стирок при 40°C усадка не более 1.5%, цвет сохранился..."
                className="w-full rounded-xl border border-[#E8E8E5] p-3 text-[14px]"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // ЭТАП 05: РЕШЕНИЕ (3 понятные кнопки в 1 клик)
  // ===========================================================================
  if (activeTab === 'decisions') {
    const handleQuickDecision = (outcome: 'approve' | 'rework' | 'reject') => {
      if (outcome === 'approve' && !canApproveProd) {
        notify('error', 'Утвердить в производство может только руководитель');
        return;
      }
      const nextStage: ConceptStage =
        outcome === 'approve'
          ? 'PRODUCTION'
          : outcome === 'rework'
          ? 'SAMPLE'
          : 'REJECTED';

      onUpdateConcept(concept.id, {
        stage: nextStage,
        isArchived: outcome === 'reject',
        approvalDecisions: [
          {
            id: `dec-${Date.now()}`,
            decision: outcome,
            authorName: currentUser.fullName,
            authorRole: currentUser.role,
            decidedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
            approvedSampleLabel: concept.samples?.[0]?.versionCode || 'Основной образец',
            justification:
              outcome === 'approve'
                ? 'Утверждено в производство'
                : outcome === 'rework'
                ? 'Возвращено на доработку образца'
                : 'Идея отклонена',
            conditions: '',
          },
          ...(concept.approvalDecisions || []),
        ],
      });
      onChangeStageWithGate(concept, nextStage);
    };

    return (
      <div className="space-y-6 text-[15px]">
        <div className="rounded-2xl border border-[#E8E8E5] bg-white p-6 space-y-5">
          <div>
            <h3 className="text-[18px] font-bold text-[#171717]">
              Решение по модели «{concept.name}»
            </h3>
            <p className="text-[13px] text-[#737373] mt-1">
              Выберите действие в 1 клик — карточка автоматически перейдёт на нужный этап:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => handleQuickDecision('approve')}
              className="p-5 rounded-2xl bg-[#16805D] hover:bg-[#126b4d] text-white text-left space-y-1.5 cursor-pointer transition shadow-xs"
            >
              <div className="text-[17px] font-bold">✅ Утвердить в производство</div>
              <div className="text-[13px] text-white/85">
                Образец проверен — переводим карточку на этап «06 · Производство»
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDecision('rework')}
              className="p-5 rounded-2xl bg-[#F7F7F5] hover:border-[#171717] border border-[#E8E8E5] text-[#171717] text-left space-y-1.5 cursor-pointer transition"
            >
              <div className="text-[17px] font-bold">🔄 Вернуть на доработку образца</div>
              <div className="text-[13px] text-[#737373]">
                Нужно исправить лекала или ткань на этапе «03 · Образец»
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDecision('reject')}
              className="p-5 rounded-2xl bg-[#DC2626]/10 hover:bg-[#DC2626] hover:text-white border border-[#DC2626]/30 text-[#DC2626] text-left space-y-1.5 cursor-pointer transition"
            >
              <div className="text-[17px] font-bold">❌ Отклонить и убрать в архив</div>
              <div className="text-[13px] opacity-80">
                Модель не прошла проверку или невыгодна по экономике
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // ЭТАП 06: ПРОИЗВОДСТВО (Партия, фабрика, статус пошива и передача в каталог)
  // ===========================================================================
  if (activeTab === 'production') {
    const orders = concept.productionOrders || [];
    const activeOrder = orders[0];

    return (
      <div className="space-y-6 text-[15px]">
        <div className="rounded-2xl border border-[#E8E8E5] bg-white p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-[18px] font-bold text-[#171717]">
                Заказ партии на фабрике
              </h3>
              <p className="text-[13px] text-[#737373]">
                Фабрика, объём тиража, себестоимость и текущий статус готовности
              </p>
            </div>

            {linkedProduct ? (
              <button
                type="button"
                onClick={() =>
                  onNavigateToSection('product-catalog', { productId: linkedProduct.id })
                }
                className="px-4 py-2 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] text-[13px] font-bold text-[#171717] cursor-pointer"
              >
                Открыть в каталоге ({linkedProduct.sku}) →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onCreateProductFromConcept(concept.id)}
                className="px-4 py-2 rounded-xl bg-[#111111] text-white text-[13px] font-bold cursor-pointer"
              >
                + Передать модель в Каталог SKU
              </button>
            )}
          </div>

          {/* Статус производства в 1 клик */}
          {activeOrder && (
            <div className="space-y-3 pt-2">
              <div className="text-[13px] font-semibold text-[#737373]">
                Статус партии ({activeOrder.orderNumber} · {activeOrder.factoryName} ·{' '}
                {activeOrder.totalUnits} шт.):
              </div>
              <div className="flex flex-wrap gap-2">
                {PRODUCTION_INTERNAL_STATUSES.map((st) => {
                  const isCurrent = activeOrder.internalStatus === st.code;
                  return (
                    <button
                      key={st.code}
                      type="button"
                      disabled={!canEdit}
                      onClick={() =>
                        onUpdateConcept(concept.id, {
                          productionOrders: orders.map((o, idx) =>
                            idx === 0 ? { ...o, internalStatus: st.code } : o
                          ),
                        })
                      }
                      className={`px-3.5 py-2 rounded-xl text-[13px] font-bold border transition cursor-pointer ${
                        isCurrent
                          ? 'bg-[#111111] text-white border-[#111111]'
                          : 'bg-[#F7F7F5] text-[#171717] border-[#E8E8E5] hover:border-[#D97745]'
                      }`}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Простая форма параметров партии */}
          {canEdit && (
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-4 border-t border-[#E8E8E5] text-[13px]">
              <input
                value={poForm.factoryName}
                onChange={(e) => setPoForm({ ...poForm, factoryName: e.target.value })}
                placeholder="Фабрика"
                className="h-10 rounded-xl border border-[#E8E8E5] px-3"
              />
              <input
                type="text"
                inputMode="numeric"
                value={poForm.totalUnits}
                onChange={(e) =>
                  setPoForm({
                    ...poForm,
                    totalUnits: e.target.value.replace(/[^\d]/g, ''),
                  })
                }
                placeholder="Тираж (шт.)"
                className="h-10 rounded-xl border border-[#E8E8E5] px-3"
              />
              <input
                type="text"
                inputMode="numeric"
                value={poForm.unitPrice}
                onChange={(e) =>
                  setPoForm({
                    ...poForm,
                    unitPrice: e.target.value.replace(/[^\d]/g, ''),
                  })
                }
                placeholder="Себестоимость (₽)"
                className="h-10 rounded-xl border border-[#E8E8E5] px-3"
              />
              <input
                type="date"
                value={poForm.plannedReadyDate}
                onChange={(e) =>
                  setPoForm({ ...poForm, plannedReadyDate: e.target.value })
                }
                className="h-10 rounded-xl border border-[#E8E8E5] px-3"
              />
              <button
                type="button"
                onClick={() => {
                  const units = parseCleanNumber(poForm.totalUnits) || 1000;
                  const price = parseCleanNumber(poForm.unitPrice) || 350;
                  const newOrder = {
                    id: `po-${Date.now()}`,
                    orderNumber: `PO-${new Date().getFullYear()}-${orders.length + 1}`,
                    approvedSampleVersion: concept.samples?.[0]?.versionCode || 'Образец №1',
                    factoryName:
                      poForm.factoryName.trim() || concept.supplierName || 'Фабрика',
                    contactPerson: 'Производство',
                    materialAndColors: (concept.colorCombinations || []).join(', '),
                    sizeBreakdown: {
                      S: 0,
                      M: Math.round(units / 3),
                      L: Math.round(units / 3),
                      XL: units - 2 * Math.round(units / 3),
                      XXL: 0,
                    },
                    packConfiguration: 'Стандарт',
                    totalUnits: units,
                    packagingDetails: 'Фирменный зип-пакет',
                    unitPrice: price,
                    currency: 'RUB' as const,
                    plannedReadyDate: poForm.plannedReadyDate,
                    qcNotes: 'Контроль пройден',
                    logisticsTracking: '',
                    internalStatus: 'in_production' as const,
                    hasDelayRisk: false,
                  };
                  onUpdateConcept(concept.id, {
                    supplierName: newOrder.factoryName,
                    plannedUnitCost: price,
                    productionOrders: [newOrder, ...orders],
                  });
                  notify('success', 'Партия сохранена');
                }}
                className="h-10 rounded-xl bg-[#111111] text-white font-semibold cursor-pointer px-4"
              >
                {activeOrder ? 'Обновить партию' : '+ Запустить партию'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===========================================================================
  // ЭТАП 07: ЗАПУСК (Удобная таблица 7 / 14 / 28 дней без бага ведущих нулей!)
  // ===========================================================================
  if (activeTab === 'launch') {
    const cl: RnDLaunchChecklist = concept.launchChecklist || {
      catalogCreated: false,
      photosApproved: false,
      descriptionsReady: false,
      bundlesAndPricesConfirmed: false,
      marketplaceCardsReady: false,
      warehouseDistributed: false,
      adsPrepared: false,
      salesDateAndOwnerAssigned: false,
    };

    const toggleCheck = (key: keyof RnDLaunchChecklist) => {
      if (!canEdit) return;
      onUpdateConcept(concept.id, {
        launchChecklist: { ...cl, [key]: !cl[key] },
      });
    };

    const checkpoints: RnDPostLaunchCheckpoint[] =
      concept.postLaunchCheckpoints && concept.postLaunchCheckpoints.length === 3
        ? concept.postLaunchCheckpoints
        : [
            {
              day: 7,
              ordersUnits: null,
              ordersRub: null,
              buyoutsUnits: null,
              buyoutsRub: null,
              avgActualPriceRub: null,
              adSpendRub: null,
              stockLeftUnits: null,
              reviewsSummary: '',
              comparisonWithExpectations: '',
              dataSource: 'МП',
            },
            {
              day: 14,
              ordersUnits: null,
              ordersRub: null,
              buyoutsUnits: null,
              buyoutsRub: null,
              avgActualPriceRub: null,
              adSpendRub: null,
              stockLeftUnits: null,
              reviewsSummary: '',
              comparisonWithExpectations: '',
              dataSource: 'МП',
            },
            {
              day: 28,
              ordersUnits: null,
              ordersRub: null,
              buyoutsUnits: null,
              buyoutsRub: null,
              avgActualPriceRub: null,
              adSpendRub: null,
              stockLeftUnits: null,
              reviewsSummary: '',
              comparisonWithExpectations: '',
              dataSource: 'МП',
            },
          ];

    const updateCheckpointField = (
      day: 7 | 14 | 28,
      patch: Partial<RnDPostLaunchCheckpoint>
    ) => {
      const next = checkpoints.map((cp) =>
        cp.day === day ? { ...cp, ...patch } : cp
      );
      onUpdateConcept(concept.id, { postLaunchCheckpoints: next });
    };

    return (
      <div className="space-y-6 text-[15px]">
        {/* Короткий чек-лист готовности к запуску (4 главные кнопки) */}
        <div className="rounded-2xl border border-[#E8E8E5] bg-white p-6 space-y-4">
          <h3 className="text-[18px] font-bold text-[#171717]">
            Готовность к старту продаж на маркетплейсе
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[14px]">
            {[
              { key: 'photosApproved' as const, label: 'Фото и инфографика готовы' },
              { key: 'marketplaceCardsReady' as const, label: 'Карточка на МП создана' },
              { key: 'warehouseDistributed' as const, label: 'Товар принят на склад МП' },
              { key: 'adsPrepared' as const, label: 'Цена и реклама включены' },
            ].map((item) => {
              const checked = cl[item.key];
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => toggleCheck(item.key)}
                  className={`p-3.5 rounded-xl border text-left font-semibold flex items-center gap-2.5 cursor-pointer transition ${
                    checked
                      ? 'bg-[#16805D]/10 border-[#16805D] text-[#16805D]'
                      : 'bg-[#F7F7F5] border-[#E8E8E5] text-[#171717]'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Удобная таблица первых продаж (7 / 14 / 28 дней) — всего 4 понятные колонки, без бага ведущих нулей! */}
        <div className="rounded-2xl border border-[#E8E8E5] bg-white p-6 space-y-4">
          <div>
            <h3 className="text-[18px] font-bold text-[#171717]">
              Результаты продаж после запуска (7 / 14 / 28 дней)
            </h3>
            <p className="text-[13px] text-[#737373]">
              Простая таблица для быстрой фиксации динамики продаж новинки:
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-[#E8E8E5] text-[12px] uppercase text-[#737373] bg-[#F7F7F5]">
                  <th className="py-3 px-4 rounded-l-xl">Период</th>
                  <th className="py-3 px-4">Заказы (шт.)</th>
                  <th className="py-3 px-4">Заказы (₽)</th>
                  <th className="py-3 px-4">Расход на рекламу (₽)</th>
                  <th className="py-3 px-4 rounded-r-xl">Отзывы / Комментарий</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E8E5]">
                {checkpoints.map((cp) => (
                  <tr key={cp.day}>
                    <td className="py-3.5 px-4 font-bold text-[#171717] whitespace-nowrap">
                      {cp.day} дней
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        inputMode="numeric"
                        disabled={!canEdit}
                        value={
                          cp.ordersUnits !== null && cp.ordersUnits !== undefined
                            ? String(cp.ordersUnits)
                            : ''
                        }
                        onChange={(e) =>
                          updateCheckpointField(cp.day, {
                            ordersUnits: parseCleanNumber(e.target.value),
                          })
                        }
                        placeholder="0 шт."
                        className="w-28 h-10 rounded-xl border border-[#E8E8E5] px-3 font-semibold bg-white"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        inputMode="numeric"
                        disabled={!canEdit}
                        value={
                          cp.ordersRub !== null && cp.ordersRub !== undefined
                            ? String(cp.ordersRub)
                            : ''
                        }
                        onChange={(e) =>
                          updateCheckpointField(cp.day, {
                            ordersRub: parseCleanNumber(e.target.value),
                          })
                        }
                        placeholder="0 ₽"
                        className="w-36 h-10 rounded-xl border border-[#E8E8E5] px-3 font-semibold bg-white"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        inputMode="numeric"
                        disabled={!canEdit}
                        value={
                          cp.adSpendRub !== null && cp.adSpendRub !== undefined
                            ? String(cp.adSpendRub)
                            : ''
                        }
                        onChange={(e) =>
                          updateCheckpointField(cp.day, {
                            adSpendRub: parseCleanNumber(e.target.value),
                          })
                        }
                        placeholder="0 ₽"
                        className="w-32 h-10 rounded-xl border border-[#E8E8E5] px-3 font-medium bg-white"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        disabled={!canEdit}
                        value={cp.reviewsSummary || ''}
                        onChange={(e) =>
                          updateCheckpointField(cp.day, {
                            reviewsSummary: e.target.value,
                          })
                        }
                        placeholder="Оценка 4.9, жалоб нет..."
                        className="w-full min-w-[200px] h-10 rounded-xl border border-[#E8E8E5] px-3 bg-white"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // КОММЕНТАРИИ (Быстрый чат внутри карточки)
  // ===========================================================================
  if (activeTab === 'files') {
    return (
      <div className="space-y-5 text-[15px]">
        <div className="rounded-2xl border border-[#E8E8E5] bg-white p-6 space-y-4">
          <h3 className="text-[18px] font-bold text-[#171717]">
            Комментарии команды по модели
          </h3>
          <div className="space-y-2.5">
            {(concept.comments || []).map((c) => (
              <div
                key={c.id}
                className="rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] p-3.5 text-[14px]"
              >
                <div className="flex items-center justify-between text-[12px] text-[#737373]">
                  <b className="text-[#171717]">{c.authorName}</b>
                  <span>{c.createdAt}</span>
                </div>
                <div className="mt-1 text-[#171717]">{c.text}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Написать комментарий..."
              className="flex-1 h-10 rounded-xl border border-[#E8E8E5] px-3.5 text-[14px]"
            />
            <button
              type="button"
              onClick={() => {
                if (!commentText.trim()) return;
                onUpdateConcept(concept.id, {
                  comments: [
                    ...(concept.comments || []),
                    {
                      id: `cm-${Date.now()}`,
                      authorName: currentUser.fullName,
                      authorRole: currentUser.role,
                      text: commentText.trim(),
                      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
                    },
                  ],
                });
                setCommentText('');
              }}
              className="px-4 h-10 rounded-xl bg-[#111111] text-white text-[13px] font-semibold cursor-pointer"
            >
              Отправить
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // ИСТОРИЯ ЭТАПОВ
  // ===========================================================================
  return (
    <div className="rounded-2xl border border-[#E8E8E5] bg-white p-6 space-y-3 text-[14px]">
      <h3 className="text-[18px] font-bold text-[#171717]">История движения карточки</h3>
      <div className="divide-y divide-[#E8E8E5]">
        {(concept.stageHistory || []).map((h) => (
          <div key={h.id} className="py-3 flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-[#171717]">{h.reason}</div>
              <div className="text-[12px] text-[#737373]">{h.authorName}</div>
            </div>
            <span className="text-[12px] text-[#737373] shrink-0">{h.timestamp}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
