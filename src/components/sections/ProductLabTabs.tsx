'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  CalendarPlus,
  CheckCircle2,
  Download,
  Edit3,
  ExternalLink,
  FileDown,
  Lock,
  PackageCheck,
  Plus,
  Printer,
  RotateCcw,
  Save,
  ShieldAlert,
  Sparkles,
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
  RnDApprovalDecision,
  RnDAttachmentCategory,
  RnDAttachmentItem,
  RnDDecisionOutcome,
  RnDDevelopmentType,
  RnDLaunchChecklist,
  RnDLaunchOutcome,
  RnDMarketEvidence,
  RnDPostLaunchCheckpoint,
  RnDProductionInternalStatus,
  RnDProductionOrder,
  RnDSampleItem,
  RnDSampleTestProtocol,
  RnDTestCriterionScore,
  TaskItem,
  TechPackTranslation,
} from '@/types/platform';
import {
  CONCEPT_STAGE_LABELS_RU,
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
  { id: 'overview', label: 'Обзор и Идея' },
  { id: 'analysis', label: 'Анализ' },
  { id: 'samples', label: 'Образцы' },
  { id: 'testing', label: 'Тестирование' },
  { id: 'decisions', label: 'Решения' },
  { id: 'production', label: 'Производство и ТЗ' },
  { id: 'launch', label: 'Запуск (7/14/28 дн.)' },
  { id: 'files', label: 'Файлы и обсуждение' },
  { id: 'history', label: 'История изменений' },
];

export const BASE_UNDERWEAR_CRITERIA: {
  key: RnDTestCriterionScore['criterionKey'];
  label: string;
}[] = [
  { key: 'fit_movement', label: 'Посадка и комфорт при движении' },
  { key: 'support_anatomy', label: 'Поддержка и анатомия' },
  { key: 'waistband_rideup', label: 'Поведение резинки, скручивание и задирание ткани' },
  { key: 'seams_tactile', label: 'Комфорт швов и тактильные ощущения' },
  { key: 'breathability', label: 'Воздухопроницаемость' },
  { key: 'wash_shape_retention', label: 'Сохранение формы и размера после стирки' },
  { key: 'sewing_sizing', label: 'Качество пошива, соответствие размерной сетке' },
  { key: 'visual_appeal', label: 'Визуальная привлекательность' },
];

export const PRODUCTION_INTERNAL_STATUSES: {
  code: RnDProductionInternalStatus;
  label: string;
}[] = [
  { code: 'order_prep', label: 'Подготовка заказа' },
  { code: 'order_placed', label: 'Заказ размещён' },
  { code: 'in_production', label: 'В производстве' },
  { code: 'qc_inspection', label: 'Контроль качества' },
  { code: 'ready', label: 'Готово' },
  { code: 'in_delivery', label: 'В доставке' },
  { code: 'received', label: 'Принято' },
];

export const ATTACHMENT_CATEGORY_LABELS: Record<RnDAttachmentCategory, string> = {
  reference: 'Референсы',
  sample_media: 'Фотографии образцов и видео',
  analytics_reviews: 'Аналитика и отзывы',
  tech_spec: 'Технические задания, лекала и спецификации',
  production_docs: 'Производственные документы',
  launch_materials: 'Материалы запуска',
};

const ANALYSIS_TEMPLATE_HINTS: Record<
  RnDDevelopmentType,
  { title: string; focusPoints: string[] }
> = {
  new_construction: {
    title: 'Шаблон анализа: Новая конструкция (п. 7.6 ТЗ)',
    focusPoints: [
      'Конкуренты и их артикулы на WB / Ozon',
      'Анатомия, лекала и удобство посадки',
      'Материалы, плотность г/м² и воздухопроницаемость',
      'Производственная осуществимость и риски усадки',
    ],
  },
  model_improvement: {
    title: 'Шаблон анализа: Улучшение действующего товара (п. 7.6 ТЗ)',
    focusPoints: [
      'Собственные продажи и динамика выкупов модели',
      'Повторяющиеся жалобы в отзывах и причины возвратов',
      'Влияние доработки на себестоимость',
      'Ожидаемый эффект изменения на рейтинг карточки и LTV',
    ],
  },
  new_variant: {
    title: 'Шаблон анализа: Цвет / комплектность (п. 7.6 ТЗ)',
    focusPoints: [
      'Спрос на новый цвет или мультипак (3-pack / 6-pack)',
      'Конкурентные наборы, РРЦ и экономия на логистике ФБО',
      'Текущие остатки базовой модели',
      'Риск каннибализации собственных продаж действующих наборов',
    ],
  },
  seasonal_capsule: {
    title: 'Шаблон анализа: Сезонная / лимитированная коллекция (п. 7.6 ТЗ)',
    focusPoints: [
      'Инфоповод и жёсткое окно продаж (напр. 14 февраля / Новый год)',
      'Целевая аудитория (покупка в подарок vs для себя)',
      'Визуальная идея и подарочная упаковка',
      'Крайний срок отгрузки на склад, MOQ фабрики и быстрый тест интереса',
    ],
  },
  other: {
    title: 'Шаблон анализа: Свободная продуктовая гипотеза',
    focusPoints: [
      'Суть продуктовой гипотезы и целевой сегмент',
      'Доказательства спроса и ориентиры рынка',
      'Оценка производства и ключевые риски',
    ],
  },
};

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
  isStrategyMode,
  currentUser,
  users,
  products,
  launches,
  tasks,
  onUpdateConcept,
  onChangeStageWithGate,
  onCreateLaunchFromConcept,
  onCreateProductFromConcept,
  onCreateTaskForConcept,
  onNavigateToSection,
  notify,
}: ProductLabCardBodyProps) {
  const hasCostAccess = canUserViewCostPrice(currentUser);
  const canApproveProd = canUserApproveProduction(currentUser, concept.brandId);

  // Локальные состояния для форм внутри вкладок
  const [newTagText, setNewTagText] = useState('');
  const [newRefLink, setNewRefLink] = useState('');

  // Вкладка Анализ: добавление конкурента (п. 7.2 ТЗ)
  const [evForm, setEvForm] = useState({
    competitorBrand: '',
    articleSku: '',
    productTitle: '',
    url: '',
    priceRub: '',
    packQty: '4 шт.',
    estimatedRevenueRub: '',
    observationPeriod: '21.09–25.10.2026',
    sourceName: 'Аналитический сервис (данные приблизительные)',
    confidenceStatus: 'estimated' as 'estimated' | 'verified',
    comparisonNote: '',
  });

  // Вкладка Образцы: добавление физического образца (п. 8 ТЗ)
  const [sampleForm, setSampleForm] = useState({
    versionCode: `Образец №${(concept.samples?.length || 0) + 1}`,
    factoryName: '',
    country: 'Узбекистан',
    orderedAt: new Date().toISOString().slice(0, 10),
    receivedAt: new Date().toISOString().slice(0, 10),
    materialAndComposition: '100% гребенной хлопок поплин',
    densityGsm: '120',
    sizeTested: 'L (48–50)',
    color: '',
    measurementsNote: '',
    sampleCostRub: '',
    estimatedUnitProductionPrice: '',
    preliminaryScore: '4',
    comments: '',
    photoUrl: '',
  });

  // Вкладка Тестирование: протокол испытаний (п. 9 ТЗ)
  const [selectedSampleForTest, setSelectedSampleForTest] = useState<string>(
    concept.samples?.[0]?.id || ''
  );
  const [washCycles, setWashCycles] = useState('5');
  const [washMode, setWashMode] = useState('40°C, деликатный режим 800 об/мин');
  const [washMeasurements, setWashMeasurements] = useState('');
  const [testVerdict, setTestVerdict] =
    useState<RnDSampleTestProtocol['verdict']>('passed');
  const [testSummary, setTestSummary] = useState('');
  const [criteriaScores, setCriteriaScores] = useState<RnDTestCriterionScore[]>(() =>
    BASE_UNDERWEAR_CRITERIA.map((c) => ({
      criterionKey: c.key,
      label: c.label,
      isRequired: true,
      score: 5,
      result: 'passed',
      comment: '',
    }))
  );

  // Вкладка Решения: точка принятия управленческого решения (п. 10 ТЗ)
  const [decisionSampleId, setDecisionSampleId] = useState<string>(
    concept.samples?.find((s) => s.isSelectedForProduction)?.id ||
      concept.samples?.[0]?.id ||
      ''
  );
  const [decisionJustification, setDecisionJustification] = useState('');
  const [decisionConditions, setDecisionConditions] = useState('');

  // Вкладка Производство: заказ и ТЗ (п. 11 ТЗ)
  const [techPackLang, setTechPackLang] = useState<'zh' | 'en' | 'ru'>('zh');
  const [isEditingTechPack, setIsEditingTechPack] = useState(false);
  const [techPackDraft, setTechPackDraft] = useState<TechPackTranslation | null>(null);
  const [poForm, setPoForm] = useState({
    orderNumber: `PO-2026-${Math.floor(110 + Math.random() * 80)}`,
    factoryName: concept.supplierName || '',
    contactPerson: 'Менеджер производства',
    materialAndColors: (concept.colorCombinations || []).join(', '),
    packConfiguration: 'Комплект 3 шт.',
    packagingDetails: 'Матовый слайдер-пакет + маркировка Честный ЗНАК',
    unitPrice: String(concept.plannedUnitCost || 360),
    plannedReadyDate: concept.targetLaunchDate || '2027-01-20',
    sizeS: '400',
    sizeM: '1000',
    sizeL: '1200',
    sizeXL: '800',
    sizeXXL: '300',
  });

  // Вкладка Файлы и обсуждение (п. 14, 18 ТЗ)
  const [attachCategory, setAttachCategory] =
    useState<RnDAttachmentCategory>('reference');
  const [commentText, setCommentText] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('2026-11-15');

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

  const appendHistory = (
    actionType: NonNullable<ProductConcept['stageHistory']>[number]['actionType'],
    reason: string,
    toStage?: string
  ) => {
    const nowTime = new Date().toISOString().slice(0, 16).replace('T', ' ');
    return [
      {
        id: `sh-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        timestamp: nowTime,
        authorName: currentUser.fullName,
        authorRole: currentUser.role,
        actionType,
        fromStage: concept.stage,
        toStage: toStage || concept.stage,
        reason,
      },
      ...(concept.stageHistory || []),
    ];
  };

  const linkedProduct = products.find(
    (p) => p.id === concept.linkedProductId || p.conceptId === concept.id
  );
  const linkedLaunch = launches.find(
    (l) => l.id === concept.linkedLaunchId || l.conceptId === concept.id
  );
  const linkedTasks = tasks.filter(
    (t) =>
      t.conceptId === concept.id ||
      (linkedLaunch && t.launchId === linkedLaunch.id) ||
      (linkedProduct && t.productId === linkedProduct.id)
  );

  // ===========================================================================
  // ВКЛАДКА 1: ОБЗОР И ЭТАП 1 «ИДЕЯ» (П. 5.1, 6, 13 ТЗ)
  // ===========================================================================
  if (activeTab === 'overview') {
    return (
      <div className="space-y-8 text-[15px]">
        {/* Крупный предпросмотр изображения и блокировка */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 rounded-2xl bg-[#F7F7F5] border border-[#E8E8E5] p-6 flex flex-col items-center justify-center min-h-[260px] relative">
            <img
              src={concept.imageUrl}
              alt={concept.name}
              className="max-h-56 w-full object-contain"
            />
            {canEdit && (
              <label className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#E8E8E5] text-[13px] font-semibold text-[#171717] hover:border-[#171717] cursor-pointer transition">
                <Upload className="h-3.5 w-3.5" />
                <span>Заменить главное фото</span>
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

          {/* Общий паспорт разработки (п. 5.1 ТЗ) */}
          <div className="lg:col-span-7 rounded-2xl border border-[#E8E8E5] bg-white p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E8E5] pb-3">
              <h3 className="text-[17px] font-bold text-[#171717]">
                Паспорт разработки · {concept.code}
              </h3>
              <span className="text-[12px] text-[#737373]">
                Создано: {concept.createdAt} · Обновлено: {concept.updatedAt}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[14px]">
              <div>
                <label className="block text-[12px] font-semibold text-[#737373] mb-1">
                  Тип разработки (п. 2.1 ТЗ)
                </label>
                <select
                  disabled={!canEdit}
                  value={concept.developmentType || 'new_construction'}
                  onChange={(e) =>
                    onUpdateConcept(concept.id, {
                      developmentType: e.target.value as RnDDevelopmentType,
                    })
                  }
                  className="w-full h-10 rounded-xl border border-[#E8E8E5] px-3 bg-white font-semibold"
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
                  Ответственный (основной)
                </label>
                <select
                  disabled={!canEdit}
                  value={concept.ownerId}
                  onChange={(e) =>
                    onUpdateConcept(concept.id, { ownerId: e.target.value })
                  }
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
                  Приоритет
                </label>
                <select
                  disabled={!canEdit}
                  value={concept.priority || 'Medium'}
                  onChange={(e) =>
                    onUpdateConcept(concept.id, {
                      priority: e.target.value as ProductConcept['priority'],
                    })
                  }
                  className="w-full h-10 rounded-xl border border-[#E8E8E5] px-3 bg-white font-semibold"
                >
                  <option value="Critical">Критический</option>
                  <option value="High">Высокий</option>
                  <option value="Medium">Средний</option>
                  <option value="Low">Низкий</option>
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
                  className="w-full h-10 rounded-xl border border-[#E8E8E5] px-3 bg-white font-semibold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[12px] font-semibold text-[#737373] mb-1">
                  Один следующий конкретный шаг (отображается на карточке доски)
                </label>
                <input
                  disabled={!canEdit}
                  value={concept.nextStep || ''}
                  onChange={(e) =>
                    onUpdateConcept(concept.id, { nextStep: e.target.value })
                  }
                  placeholder="Напр.: Проверить образец из Узбекистана и размерную сетку"
                  className="w-full h-10 rounded-xl border border-[#E8E8E5] px-3 bg-[#F7F7F5]/60 font-medium"
                />
              </div>
            </div>

            {/* Блокировка / Пауза проекта (п. 3.4, 5.1, 15 ТЗ) */}
            <div className="pt-3 border-t border-[#E8E8E5] flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 text-[13px] font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!canEdit}
                  checked={Boolean(concept.isBlocked)}
                  onChange={(e) =>
                    onUpdateConcept(concept.id, { isBlocked: e.target.checked })
                  }
                  className="h-4 w-4 accent-[#DC2626]"
                />
                <span className={concept.isBlocked ? 'text-[#DC2626]' : 'text-[#737373]'}>
                  Проект остановлен / есть блокирующий вопрос
                </span>
              </label>
              {concept.isBlocked && (
                <input
                  disabled={!canEdit}
                  value={concept.blockReason || ''}
                  onChange={(e) =>
                    onUpdateConcept(concept.id, { blockReason: e.target.value })
                  }
                  placeholder="Укажите причину блокировки..."
                  className="flex-1 min-w-[220px] h-9 rounded-lg border border-[#DC2626]/40 bg-[#DC2626]/5 px-3 text-[13px] text-[#DC2626]"
                />
              )}
            </div>
          </div>
        </div>

        {/* Блок «06. Этап 1 — ИДЕЯ» (п. 6 ТЗ: 5 ключевых полей идеи без обязательной коммерции) */}
        <div className="rounded-2xl border border-[#E8E8E5] bg-white p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E8E5] pb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#D97745]">
                Этап 01 · ИДЕЯ (п. 6 ТЗ)
              </span>
              <h3 className="text-[18px] font-bold text-[#171717]">
                Суть продуктовой идеи и первичный захват
              </h3>
            </div>
            <span className="px-3 py-1 rounded-lg bg-[#F7F7F5] border border-[#E8E8E5] text-[12px] text-[#737373]">
              На этапе идеи коммерческие показатели необязательны
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-[14px]">
            <div>
              <label className="block font-semibold text-[#171717] mb-1.5">
                1. Что привлекло внимание?
              </label>
              <textarea
                rows={3}
                disabled={!canEdit}
                value={concept.whatAttracted ?? concept.ideaDescription}
                onChange={(e) =>
                  onUpdateConcept(concept.id, {
                    whatAttracted: e.target.value,
                    ideaDescription: e.target.value,
                  })
                }
                placeholder="Какой тренд, референс конкурента или запрос покупателей заметили..."
                className="w-full rounded-xl border border-[#E8E8E5] p-3"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#171717] mb-1.5">
                2. Какую проблему покупателя решает продукт?
              </label>
              <textarea
                rows={3}
                disabled={!canEdit}
                value={concept.customerProblem || ''}
                onChange={(e) =>
                  onUpdateConcept(concept.id, { customerProblem: e.target.value })
                }
                placeholder="Например: обычные трусы собираются складками, натирают или просвечивают..."
                className="w-full rounded-xl border border-[#E8E8E5] p-3"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#171717] mb-1.5">
                3. Есть ли похожий товар в собственном ассортименте?
              </label>
              <input
                disabled={!canEdit}
                value={concept.similarInAssortment || ''}
                onChange={(e) =>
                  onUpdateConcept(concept.id, { similarInAssortment: e.target.value })
                }
                placeholder="Укажите близкую модель или напишите «Новая свободная ниша»..."
                className="w-full h-11 rounded-xl border border-[#E8E8E5] px-3.5"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#171717] mb-1.5">
                4. Какой ожидается результат?
              </label>
              <input
                disabled={!canEdit}
                value={concept.expectedOutcome || ''}
                onChange={(e) =>
                  onUpdateConcept(concept.id, { expectedOutcome: e.target.value })
                }
                placeholder="Рост повторных покупок, выход в новый сегмент, подарочный спрос..."
                className="w-full h-11 rounded-xl border border-[#E8E8E5] px-3.5"
              />
            </div>
          </div>

          {/* Ссылки на WB / Ozon / соцсети и теги */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-[#E8E8E5]">
            <div className="space-y-2">
              <label className="block text-[13px] font-semibold text-[#171717]">
                Ссылки-референсы (Wildberries / Ozon / зарубежные бренды / соцсети)
              </label>
              <div className="space-y-1.5">
                {(concept.referenceLinks || []).map((link, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#F7F7F5] border border-[#E8E8E5] text-[13px]"
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
                  </div>
                ))}
              </div>
              {canEdit && (
                <div className="flex gap-2">
                  <input
                    value={newRefLink}
                    onChange={(e) => setNewRefLink(e.target.value)}
                    placeholder="Вставьте ссылку на WB / Ozon / Instagram..."
                    className="flex-1 h-9 rounded-lg border border-[#E8E8E5] px-3 text-[13px]"
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
                    className="px-3 h-9 rounded-lg bg-[#111111] text-white text-[12px] font-semibold cursor-pointer"
                  >
                    + Ссылка
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-[13px] font-semibold text-[#171717]">
                Теги разработки (для быстрого поиска)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(concept.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F7F7F5] border border-[#E8E8E5] text-[12px] font-semibold text-[#171717]"
                  >
                    #{tag}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateConcept(concept.id, {
                            tags: (concept.tags || []).filter((t) => t !== tag),
                          })
                        }
                        className="text-[#737373] hover:text-[#DC2626] cursor-pointer"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {canEdit && (
                <div className="flex gap-2">
                  <input
                    value={newTagText}
                    onChange={(e) => setNewTagText(e.target.value)}
                    placeholder="Добавить тег (напр. Узбекистан, 6-pack)..."
                    className="flex-1 h-9 rounded-lg border border-[#E8E8E5] px-3 text-[13px]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newTagText.trim()) return;
                      onUpdateConcept(concept.id, {
                        tags: [...(concept.tags || []), newTagText.trim()],
                      });
                      setNewTagText('');
                    }}
                    className="px-3 h-9 rounded-lg bg-[#111111] text-white text-[12px] font-semibold cursor-pointer"
                  >
                    + Тег
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Блок «13. Связь с существующими разделами платформы» (единая база без дублей!) */}
        <div className="rounded-2xl border border-[#E8E8E5] bg-[#F7F7F5]/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[17px] font-bold text-[#171717]">
                Сквозная связь с модулями платформы (п. 13 ТЗ)
              </h3>
              <p className="text-[13px] text-[#737373]">
                Единые данные без дублирующих баз: переходите в связанные разделы в 1 клик
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[13px]">
            <div className="rounded-xl bg-white border border-[#E8E8E5] p-4 flex flex-col justify-between gap-2">
              <div>
                <div className="text-[11px] font-bold uppercase text-[#737373]">
                  Каталог моделей
                </div>
                <div className="font-bold text-[#171717] mt-1">
                  {linkedProduct
                    ? `${linkedProduct.sku} · ${linkedProduct.name}`
                    : 'Модель ещё не в каталоге'}
                </div>
              </div>
              {linkedProduct ? (
                <button
                  type="button"
                  onClick={() =>
                    onNavigateToSection('product-catalog', { productId: linkedProduct.id })
                  }
                  className="text-left font-semibold text-[#D97745] hover:underline cursor-pointer"
                >
                  Открыть паспорт модели →
                </button>
              ) : (
                !isStrategyMode && (
                  <button
                    type="button"
                    onClick={() => onCreateProductFromConcept(concept.id)}
                    className="text-left font-semibold text-[#171717] hover:underline cursor-pointer"
                  >
                    + Создать модель в каталоге
                  </button>
                )
              )}
            </div>

            <div className="rounded-xl bg-white border border-[#E8E8E5] p-4 flex flex-col justify-between gap-2">
              <div>
                <div className="text-[11px] font-bold uppercase text-[#737373]">
                  Календарь запусков
                </div>
                <div className="font-bold text-[#171717] mt-1">
                  {linkedLaunch
                    ? `${linkedLaunch.name} (${linkedLaunch.startDate})`
                    : 'Запуск не назначен'}
                </div>
              </div>
              {linkedLaunch ? (
                <button
                  type="button"
                  onClick={() =>
                    onNavigateToSection('launch-calendar', { launchId: linkedLaunch.id })
                  }
                  className="text-left font-semibold text-[#D97745] hover:underline cursor-pointer"
                >
                  Открыть в календаре →
                </button>
              ) : (
                !isStrategyMode && (
                  <button
                    type="button"
                    onClick={() => onCreateLaunchFromConcept(concept)}
                    className="text-left font-semibold text-[#171717] hover:underline cursor-pointer"
                  >
                    + Создать запись запуска
                  </button>
                )
              )}
            </div>

            <div className="rounded-xl bg-white border border-[#E8E8E5] p-4 flex flex-col justify-between gap-2">
              <div>
                <div className="text-[11px] font-bold uppercase text-[#737373]">
                  Задачи команды
                </div>
                <div className="font-bold text-[#171717] mt-1">
                  Связанных задач: {linkedTasks.length}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToSection('roadmap-tasks')}
                className="text-left font-semibold text-[#D97745] hover:underline cursor-pointer"
              >
                Перейти к задачам →
              </button>
            </div>

            <div className="rounded-xl bg-white border border-[#E8E8E5] p-4 flex flex-col justify-between gap-2">
              <div>
                <div className="text-[11px] font-bold uppercase text-[#737373]">
                  Рынок и конкуренты
                </div>
                <div className="font-bold text-[#171717] mt-1">
                  Доказательств в анализе: {currentAnalysis.marketEvidences.length}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToSection('market-intelligence')}
                className="text-left font-semibold text-[#D97745] hover:underline cursor-pointer"
              >
                Открыть базу конкурентов →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // ВКЛАДКА 2: ЭТАП 2 — АНАЛИЗ (П. 7.1–7.6 ТЗ + СХЕМА 4)
  // ===========================================================================
  if (activeTab === 'analysis') {
    const devType = concept.developmentType || 'new_construction';
    const templateInfo = ANALYSIS_TEMPLATE_HINTS[devType];

    return (
      <div className="space-y-8 text-[15px]">
        {/* Схема 4 из ТЗ: Карточка сводки исследования */}
        <div className="rounded-2xl border-2 border-[#171717] bg-white p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E8E5] pb-3">
            <div className="font-bold text-[18px] text-[#171717]">
              {concept.code} / {concept.name}
            </div>
            <span className="px-3 py-1 rounded-lg bg-[#D97745]/15 text-[#D97745] text-[12px] font-bold uppercase">
              {CONCEPT_STAGE_LABELS_RU[concept.stage]}
            </span>
          </div>

          <div className="divide-y divide-[#E8E8E5] text-[14px]">
            <div className="py-2.5 grid grid-cols-1 sm:grid-cols-4 gap-2">
              <span className="text-[#737373] font-medium">Гипотеза</span>
              <span className="sm:col-span-3 font-semibold text-[#171717]">
                {currentAnalysis.whatWeCreate || 'Не заполнено'}
              </span>
            </div>
            <div className="py-2.5 grid grid-cols-1 sm:grid-cols-4 gap-2">
              <span className="text-[#737373] font-medium">Рынок</span>
              <span className="sm:col-span-3 font-semibold text-[#171717]">
                {currentAnalysis.marketEvidences.length > 0
                  ? currentAnalysis.marketEvidences
                      .map(
                        (ev) =>
                          `${ev.competitorBrand} ${ev.articleSku} • ≈ ${(
                            ev.estimatedRevenueRub / 1_000_000
                          )
                            .toFixed(2)
                            .replace('.', ',')} млн ₽ (${ev.observationPeriod})`
                      )
                      .join(' | ')
                  : currentAnalysis.nicheConclusion || 'Нет прикреплённых замеров'}
              </span>
            </div>
            <div className="py-2.5 grid grid-cols-1 sm:grid-cols-4 gap-2">
              <span className="text-[#737373] font-medium">Доказательство</span>
              <span className="sm:col-span-3 text-[#171717]">
                {currentAnalysis.marketEvidences[0]
                  ? `${currentAnalysis.marketEvidences[0].sourceName} • период ${currentAnalysis.marketEvidences[0].observationPeriod}`
                  : 'Ожидается прикрепление источника и периода наблюдения'}
              </span>
            </div>
            <div className="py-2.5 grid grid-cols-1 sm:grid-cols-4 gap-2">
              <span className="text-[#737373] font-medium">Производство</span>
              <span className="sm:col-span-3 text-[#171717]">
                {currentAnalysis.potentialFactories || concept.supplierName || 'Условия уточняются'}
              </span>
            </div>
            <div className="py-2.5 grid grid-cols-1 sm:grid-cols-4 gap-2">
              <span className="text-[#737373] font-medium">Риск</span>
              <span className="sm:col-span-3 text-[#DC2626] font-medium">
                {currentAnalysis.openQuestionsAndRisks ||
                  currentAnalysis.productionRisks ||
                  'Не указаны'}
              </span>
            </div>
            <div className="py-2.5 grid grid-cols-1 sm:grid-cols-4 gap-2">
              <span className="text-[#737373] font-medium">Следующее действие</span>
              <span className="sm:col-span-3 font-semibold text-[#171717]">
                {concept.nextStep || currentAnalysis.whatToVerifyOnSample || 'Перейти к проверке образцов'}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-[#16805D]/10 border border-[#16805D]/25 px-4 py-2.5 text-center text-[14px] font-bold text-[#16805D]">
            Предварительный вывод:{' '}
            {currentAnalysis.recommendation === 'continue'
              ? 'перейти к проверке образцов'
              : currentAnalysis.recommendation === 'supplement'
              ? 'дополнить исследование'
              : currentAnalysis.recommendation === 'postpone'
              ? 'отложить разработку'
              : 'отклонить гипотезу'}
          </div>
        </div>

        {/* Подсказка шаблона по типу разработки (п. 7.6 ТЗ) */}
        <div className="rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] p-4">
          <div className="text-[13px] font-bold text-[#171717] mb-2">
            {templateInfo.title}
          </div>
          <div className="flex flex-wrap gap-2">
            {templateInfo.focusPoints.map((pt, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg bg-white border border-[#E8E8E5] text-[12px] text-[#171717]"
              >
                • {pt}
              </span>
            ))}
          </div>
        </div>

        {/* 7.1 Продуктовая гипотеза */}
        <div className="rounded-2xl border border-[#E8E8E5] bg-white p-6 space-y-4">
          <h4 className="text-[17px] font-bold text-[#171717]">
            7.1. Продуктовая гипотеза
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[14px]">
            <div>
              <label className="block font-semibold mb-1">Что именно создаём или меняем?</label>
              <input
                disabled={!canEdit}
                value={currentAnalysis.whatWeCreate}
                onChange={(e) => updateAnalysisField('whatWeCreate', e.target.value)}
                className="w-full h-10 rounded-xl border border-[#E8E8E5] px-3"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Для какого покупателя?</label>
              <input
                disabled={!canEdit}
                value={currentAnalysis.targetBuyer}
                onChange={(e) => updateAnalysisField('targetBuyer', e.target.value)}
                className="w-full h-10 rounded-xl border border-[#E8E8E5] px-3"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Какое конкретное преимущество?</label>
              <input
                disabled={!canEdit}
                value={currentAnalysis.concreteAdvantage}
                onChange={(e) => updateAnalysisField('concreteAdvantage', e.target.value)}
                className="w-full h-10 rounded-xl border border-[#E8E8E5] px-3"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">
                Это дополнительный спрос или риск замены своих продаж?
              </label>
              <select
                disabled={!canEdit}
                value={currentAnalysis.demandType}
                onChange={(e) =>
                  updateAnalysisField(
                    'demandType',
                    e.target.value as RnDAnalysisReport['demandType']
                  )
                }
                className="w-full h-10 rounded-xl border border-[#E8E8E5] px-3 bg-white font-semibold"
              >
                <option value="incremental">Дополнительный спрос (новая ниша / аудитория)</option>
                <option value="cannibalization_risk">
                  Риск каннибализации (переток с собственных SKU)
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* 7.2 Анализ рынка и доказательства с достоверностью (WUCHT и др.) */}
        <div className="rounded-2xl border border-[#E8E8E5] bg-white p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-[17px] font-bold text-[#171717]">
                7.2. Анализ рынка и прикреплённые конкуренты
              </h4>
              <p className="text-[13px] text-[#737373]">
                Любая цифра обязана иметь источник, период наблюдения и статус достоверности (п. 7.2 и Критерий 02 ТЗ)
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {currentAnalysis.marketEvidences.map((ev) => (
              <div
                key={ev.id}
                className="rounded-xl border border-[#E8E8E5] bg-[#F7F7F5]/60 p-4 space-y-2 text-[14px]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-bold text-[#171717]">
                    {ev.competitorBrand} · Арт. {ev.articleSku} · {ev.productTitle} ({ev.packQty})
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[12px] font-semibold ${
                      ev.confidenceStatus === 'verified'
                        ? 'bg-[#16805D]/15 text-[#16805D]'
                        : 'bg-[#D97745]/15 text-[#D97745]'
                    }`}
                  >
                    {ev.confidenceStatus === 'verified'
                      ? 'Подтверждённый факт'
                      : 'Оценка стороннего сервиса — данные приблизительные'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[13px]">
                  <div>
                    Цена: <b>{formatCurrencyRub(ev.priceRub)}</b>
                  </div>
                  <div>
                    Оценка выручки: <b>{formatCurrencyRub(ev.estimatedRevenueRub)}</b>
                  </div>
                  <div>
                    Период: <b>{ev.observationPeriod}</b>
                  </div>
                </div>
                <div className="text-[12px] text-[#737373]">
                  Источник: <b className="text-[#171717]">{ev.sourceName}</b> · Вывод:{' '}
                  {ev.comparisonNote}
                </div>
              </div>
            ))}
          </div>

          {canEdit && (
            <div className="rounded-xl border border-[#E8E8E5] bg-[#F7F7F5] p-4 space-y-3 text-[13px]">
              <div className="font-bold text-[#171717]">
                + Прикрепить замер по конкуренту (с источником и пометкой достоверности)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  value={evForm.competitorBrand}
                  onChange={(e) => setEvForm({ ...evForm, competitorBrand: e.target.value })}
                  placeholder="Бренд (напр. WUCHT)"
                  className="h-9 rounded-lg bg-white border border-[#E8E8E5] px-3"
                />
                <input
                  value={evForm.articleSku}
                  onChange={(e) => setEvForm({ ...evForm, articleSku: e.target.value })}
                  placeholder="Артикул WB/Ozon (напр. 504147655)"
                  className="h-9 rounded-lg bg-white border border-[#E8E8E5] px-3"
                />
                <input
                  value={evForm.productTitle}
                  onChange={(e) => setEvForm({ ...evForm, productTitle: e.target.value })}
                  placeholder="Товар (напр. семейные трусы 4 шт.)"
                  className="h-9 rounded-lg bg-white border border-[#E8E8E5] px-3"
                />
                <input
                  type="number"
                  value={evForm.priceRub}
                  onChange={(e) => setEvForm({ ...evForm, priceRub: e.target.value })}
                  placeholder="Цена, ₽ (напр. 1790)"
                  className="h-9 rounded-lg bg-white border border-[#E8E8E5] px-3"
                />
                <input
                  type="number"
                  value={evForm.estimatedRevenueRub}
                  onChange={(e) => setEvForm({ ...evForm, estimatedRevenueRub: e.target.value })}
                  placeholder="Оценка выручки, ₽ (напр. 17280000)"
                  className="h-9 rounded-lg bg-white border border-[#E8E8E5] px-3"
                />
                <input
                  value={evForm.observationPeriod}
                  onChange={(e) => setEvForm({ ...evForm, observationPeriod: e.target.value })}
                  placeholder="Период (21.09–25.10.2026)"
                  className="h-9 rounded-lg bg-white border border-[#E8E8E5] px-3"
                />
                <input
                  value={evForm.sourceName}
                  onChange={(e) => setEvForm({ ...evForm, sourceName: e.target.value })}
                  placeholder="Источник (Аналитический сервис)"
                  className="h-9 rounded-lg bg-white border border-[#E8E8E5] px-3"
                />
                <select
                  value={evForm.confidenceStatus}
                  onChange={(e) =>
                    setEvForm({
                      ...evForm,
                      confidenceStatus: e.target.value as 'estimated' | 'verified',
                    })
                  }
                  className="h-9 rounded-lg bg-white border border-[#E8E8E5] px-3 font-semibold"
                >
                  <option value="estimated">Данные приблизительные (оценка сервиса)</option>
                  <option value="verified">Подтверждённый факт</option>
                </select>
                <input
                  value={evForm.comparisonNote}
                  onChange={(e) => setEvForm({ ...evForm, comparisonNote: e.target.value })}
                  placeholder="Вывод и отличие от нашей модели"
                  className="h-9 rounded-lg bg-white border border-[#E8E8E5] px-3"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!evForm.competitorBrand.trim()) return;
                  const nextEv: RnDMarketEvidence = {
                    id: `ev-${Date.now()}`,
                    competitorBrand: evForm.competitorBrand.trim(),
                    articleSku: evForm.articleSku.trim() || 'Б/Н',
                    productTitle: evForm.productTitle.trim() || 'Модель конкурента',
                    priceRub: Number(evForm.priceRub) || 0,
                    packQty: evForm.packQty,
                    estimatedRevenueRub: Number(evForm.estimatedRevenueRub) || 0,
                    observationPeriod: evForm.observationPeriod,
                    sourceName: evForm.sourceName,
                    confidenceStatus: evForm.confidenceStatus,
                    comparisonNote: evForm.comparisonNote,
                  };
                  updateAnalysisField('marketEvidences', [
                    ...currentAnalysis.marketEvidences,
                    nextEv,
                  ]);
                  setEvForm({
                    ...evForm,
                    competitorBrand: '',
                    articleSku: '',
                    productTitle: '',
                    priceRub: '',
                    estimatedRevenueRub: '',
                    comparisonNote: '',
                  });
                  notify('success', 'Конкурентное доказательство сохранено с пометкой достоверности');
                }}
                className="px-4 h-9 rounded-lg bg-[#111111] text-white font-semibold cursor-pointer"
              >
                Сохранить запись конкурентного анализа
              </button>
            </div>
          )}
        </div>

        {/* 7.3 Покупательский спрос + 7.4 Производственная возможность (раздельно пошив / логистика / полная с/с) + 7.5 Заключение */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-[#E8E8E5] bg-white p-6 space-y-4 text-[14px]">
            <h4 className="text-[17px] font-bold text-[#171717]">
              7.3. Покупательский спрос и отзывы
            </h4>
            <div>
              <label className="block font-semibold mb-1">Мотивы покупки и ЦА</label>
              <textarea
                rows={2}
                disabled={!canEdit}
                value={currentAnalysis.buyerMotives}
                onChange={(e) => updateAnalysisField('buyerMotives', e.target.value)}
                className="w-full rounded-xl border border-[#E8E8E5] p-2.5"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">
                Повторяющиеся жалобы на конкурентов
              </label>
              <textarea
                rows={2}
                disabled={!canEdit}
                value={currentAnalysis.competitorProsAndComplaints}
                onChange={(e) =>
                  updateAnalysisField('competitorProsAndComplaints', e.target.value)
                }
                className="w-full rounded-xl border border-[#E8E8E5] p-2.5"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Ориентиры цен и возражения</label>
              <input
                disabled={!canEdit}
                value={currentAnalysis.priceBenchmarksAndObjections}
                onChange={(e) =>
                  updateAnalysisField('priceBenchmarksAndObjections', e.target.value)
                }
                className="w-full h-10 rounded-xl border border-[#E8E8E5] px-3"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[#E8E8E5] bg-white p-6 space-y-4 text-[14px]">
            <h4 className="text-[17px] font-bold text-[#171717]">
              7.4. Производственная возможность (п. 7.4 ТЗ)
            </h4>
            <p className="text-[12px] text-[#737373]">
              Стоимость производства на фабрике, логистика и полная себестоимость ввезённого товара — разные показатели:
            </p>
            <div>
              <label className="block font-semibold mb-1">Потенциальные фабрики и страны</label>
              <input
                disabled={!canEdit}
                value={currentAnalysis.potentialFactories}
                onChange={(e) => updateAnalysisField('potentialFactories', e.target.value)}
                className="w-full h-10 rounded-xl border border-[#E8E8E5] px-3"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">
                1) Оценка стоимости пошива (EXW фабрика)
              </label>
              <input
                disabled={!canEdit}
                value={currentAnalysis.estimatedProductionCostNote}
                onChange={(e) =>
                  updateAnalysisField('estimatedProductionCostNote', e.target.value)
                }
                placeholder="Напр.: $4.2–4.8 за комплект (оценка)"
                className="w-full h-10 rounded-xl border border-[#E8E8E5] px-3"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">
                2) Логистика, таможня и маркировка
              </label>
              <input
                disabled={!canEdit}
                value={currentAnalysis.estimatedLogisticsNote}
                onChange={(e) => updateAnalysisField('estimatedLogisticsNote', e.target.value)}
                className="w-full h-10 rounded-xl border border-[#E8E8E5] px-3"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">
                3) Полная себестоимость на складе РФ (Landed Cost)
              </label>
              <input
                disabled={!canEdit}
                value={currentAnalysis.estimatedLandedCostNote}
                onChange={(e) => updateAnalysisField('estimatedLandedCostNote', e.target.value)}
                className="w-full h-10 rounded-xl border border-[#E8E8E5] px-3"
              />
            </div>
          </div>
        </div>

        {/* 7.5 Заключение анализа */}
        <div className="rounded-2xl border border-[#E8E8E5] bg-white p-6 space-y-4 text-[14px]">
          <h4 className="text-[17px] font-bold text-[#171717]">7.5. Заключение анализа</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">
                Ключевые риски и невыясненные вопросы (обязательно для перехода к образцу)
              </label>
              <input
                disabled={!canEdit}
                value={currentAnalysis.openQuestionsAndRisks}
                onChange={(e) => updateAnalysisField('openQuestionsAndRisks', e.target.value)}
                className="w-full h-10 rounded-xl border border-[#E8E8E5] px-3"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Что проверить на образце?</label>
              <input
                disabled={!canEdit}
                value={currentAnalysis.whatToVerifyOnSample}
                onChange={(e) => updateAnalysisField('whatToVerifyOnSample', e.target.value)}
                className="w-full h-10 rounded-xl border border-[#E8E8E5] px-3"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Уровень уверенности</label>
              <select
                disabled={!canEdit}
                value={currentAnalysis.confidenceLevel}
                onChange={(e) =>
                  updateAnalysisField(
                    'confidenceLevel',
                    e.target.value as RnDAnalysisReport['confidenceLevel']
                  )
                }
                className="w-full h-10 rounded-xl border border-[#E8E8E5] px-3 bg-white font-semibold"
              >
                <option value="high">Высокая уверенность</option>
                <option value="medium">Средняя уверенность</option>
                <option value="low">Низкая уверенность</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Рекомендация по итогам анализа</label>
              <select
                disabled={!canEdit}
                value={currentAnalysis.recommendation}
                onChange={(e) =>
                  updateAnalysisField(
                    'recommendation',
                    e.target.value as RnDAnalysisReport['recommendation']
                  )
                }
                className="w-full h-10 rounded-xl border border-[#E8E8E5] px-3 bg-white font-semibold"
              >
                <option value="continue">Продолжить (заказать и проверить образец)</option>
                <option value="supplement">Дополнить анализ</option>
                <option value="postpone">Отложить</option>
                <option value="reject">Отклонить</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // ===========================================================================
  // ВКЛАДКА 3: ЭТАП 3 — ОБРАЗЕЦ И СРАВНЕНИЕ ВЕРСИЙ (П. 8 ТЗ, КРИТЕРИЙ 03)
  // ===========================================================================
  if (activeTab === 'samples') {
    const samples = concept.samples || [];

    return (
      <div className="space-y-8 text-[15px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#D97745]">
              Этап 03 · ОБРАЗЕЦ (п. 8 ТЗ)
            </span>
            <h3 className="text-[20px] font-bold text-[#171717]">
              Паспорта физических образцов и матрица сравнения ({samples.length})
            </h3>
            <p className="text-[13px] text-[#737373]">
              В одной разработке могут существовать несколько физических образцов разных фабрик — они сравниваются бок-о-бок без перезаписи
            </p>
          </div>
        </div>

        {/* Обязательная таблица сравнения нескольких образцов по одинаковым критериям (п. 8 ТЗ) */}
        {samples.length > 0 ? (
          <div className="rounded-2xl border border-[#E8E8E5] bg-white overflow-x-auto">
            <table className="w-full text-left border-collapse text-[14px]">
              <thead>
                <tr className="bg-[#F7F7F5] border-b border-[#E8E8E5]">
                  <th className="p-4 font-bold text-[#737373] w-48">Критерий сравнения</th>
                  {samples.map((smp) => (
                    <th key={smp.id} className="p-4 min-w-[250px] border-l border-[#E8E8E5]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[#171717] text-[15px]">
                          {smp.versionCode}
                        </span>
                        {smp.isSelectedForProduction && (
                          <span className="px-2 py-0.5 rounded bg-[#16805D] text-white text-[11px] font-bold">
                            Эталон
                          </span>
                        )}
                      </div>
                      <div className="text-[12px] text-[#737373] font-normal mt-0.5">
                        {smp.factoryName}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E8E5]">
                <tr>
                  <td className="p-3.5 font-semibold text-[#737373]">Фото образца</td>
                  {samples.map((smp) => (
                    <td key={smp.id} className="p-3.5 border-l border-[#E8E8E5]">
                      <div className="h-28 w-full rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] flex items-center justify-center p-2">
                        <img
                          src={smp.photos?.[0] || concept.imageUrl}
                          alt={smp.versionCode}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3.5 font-semibold text-[#737373]">Страна и даты</td>
                  {samples.map((smp) => (
                    <td key={smp.id} className="p-3.5 border-l border-[#E8E8E5]">
                      <div className="font-semibold text-[#171717]">{smp.country}</div>
                      <div className="text-[12px] text-[#737373]">
                        Заказ: {smp.orderedAt} · Получен: {smp.receivedAt}
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3.5 font-semibold text-[#737373]">Материал и состав</td>
                  {samples.map((smp) => (
                    <td key={smp.id} className="p-3.5 border-l border-[#E8E8E5] font-medium">
                      {smp.materialAndComposition} ({smp.densityGsm} г/м²)
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3.5 font-semibold text-[#737373]">Размер, цвет и замеры</td>
                  {samples.map((smp) => (
                    <td key={smp.id} className="p-3.5 border-l border-[#E8E8E5]">
                      <div className="font-semibold">
                        Размер {smp.sizeTested} · {smp.color}
                      </div>
                      <div className="text-[13px] text-[#737373] mt-0.5">
                        {smp.measurementsNote}
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3.5 font-semibold text-[#737373]">
                    Стоимость образца / Оценка тиража
                  </td>
                  {samples.map((smp) => (
                    <td key={smp.id} className="p-3.5 border-l border-[#E8E8E5]">
                      <div>
                        Образец:{' '}
                        <b>
                          {hasCostAccess ? formatCurrencyRub(smp.sampleCostRub) : 'Скрыто'}
                        </b>
                      </div>
                      <div className="text-[13px] text-[#737373]">
                        В партии:{' '}
                        <b className="text-[#171717]">
                          {hasCostAccess
                            ? formatCurrencyRub(smp.estimatedUnitProductionPrice)
                            : 'Скрыто'}
                        </b>{' '}
                        / ед.
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3.5 font-semibold text-[#737373]">
                    Предварительная оценка и вывод
                  </td>
                  {samples.map((smp) => (
                    <td key={smp.id} className="p-3.5 border-l border-[#E8E8E5] space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#F7F7F5] border border-[#E8E8E5] font-bold">
                        Оценка: {smp.preliminaryScore} / 5
                      </div>
                      <p className="text-[13px] text-[#737373]">{smp.comments}</p>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = samples.map((s) => ({
                              ...s,
                              isSelectedForProduction: s.id === smp.id,
                            }));
                            onUpdateConcept(concept.id, {
                              samples: updated,
                              sampleStatus: `Выбран образец: ${smp.versionCode} (${smp.factoryName})`,
                              supplierName: smp.factoryName,
                            });
                            notify('success', `Образец «${smp.versionCode}» отмечен как основной кандидат`);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer transition ${
                            smp.isSelectedForProduction
                              ? 'bg-[#16805D] text-white'
                              : 'bg-[#111111] text-white hover:bg-neutral-800'
                          }`}
                        >
                          {smp.isSelectedForProduction
                            ? '✓ Выбран основным'
                            : 'Выбрать для проверки / тиража'}
                        </button>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#E8E8E5] p-8 text-center text-[#737373]">
            Физические образцы ещё не добавлены. Заполните форму ниже, чтобы добавить первый образец (его можно загрузить заранее на любом этапе).
          </div>
        )}

        {/* Форма добавления нового образца (без перезаписи предыдущих!) */}
        {canEdit && (
          <div className="rounded-2xl border border-[#E8E8E5] bg-[#F7F7F5] p-6 space-y-4 text-[14px]">
            <h4 className="text-[17px] font-bold text-[#171717]">
              + Добавить физический образец (например: Китай, ф-ка A — №1 или Узбекистан, ф-ка C — №2)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[12px] font-semibold mb-1">Код и версия образца</label>
                <input
                  value={sampleForm.versionCode}
                  onChange={(e) => setSampleForm({ ...sampleForm, versionCode: e.target.value })}
                  placeholder="Напр.: Узбекистан, фабрика C — №3"
                  className="w-full h-10 rounded-xl bg-white border border-[#E8E8E5] px-3"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1">Фабрика</label>
                <input
                  value={sampleForm.factoryName}
                  onChange={(e) => setSampleForm({ ...sampleForm, factoryName: e.target.value })}
                  placeholder="Напр.: Ташкент Текстиль №3"
                  className="w-full h-10 rounded-xl bg-white border border-[#E8E8E5] px-3"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1">Страна</label>
                <select
                  value={sampleForm.country}
                  onChange={(e) => setSampleForm({ ...sampleForm, country: e.target.value })}
                  className="w-full h-10 rounded-xl bg-white border border-[#E8E8E5] px-3 font-semibold"
                >
                  <option value="Узбекистан">Узбекистан</option>
                  <option value="Китай">Китай</option>
                  <option value="Россия">Россия</option>
                  <option value="Турция">Турция</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1">Материал и заявленный состав</label>
                <input
                  value={sampleForm.materialAndComposition}
                  onChange={(e) =>
                    setSampleForm({ ...sampleForm, materialAndComposition: e.target.value })
                  }
                  className="w-full h-10 rounded-xl bg-white border border-[#E8E8E5] px-3"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1">Плотность (г/м²)</label>
                <input
                  type="number"
                  value={sampleForm.densityGsm}
                  onChange={(e) => setSampleForm({ ...sampleForm, densityGsm: e.target.value })}
                  className="w-full h-10 rounded-xl bg-white border border-[#E8E8E5] px-3"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1">Размер и цвет</label>
                <input
                  value={sampleForm.color}
                  onChange={(e) => setSampleForm({ ...sampleForm, color: e.target.value })}
                  placeholder="L · Голубая полоска"
                  className="w-full h-10 rounded-xl bg-white border border-[#E8E8E5] px-3"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1">Замеры изделия (см)</label>
                <input
                  value={sampleForm.measurementsNote}
                  onChange={(e) =>
                    setSampleForm({ ...sampleForm, measurementsNote: e.target.value })
                  }
                  placeholder="Талия 39 см, боковой шов 37 см..."
                  className="w-full h-10 rounded-xl bg-white border border-[#E8E8E5] px-3"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1">Стоимость образца (₽)</label>
                <input
                  type="number"
                  value={sampleForm.sampleCostRub}
                  onChange={(e) => setSampleForm({ ...sampleForm, sampleCostRub: e.target.value })}
                  placeholder="4500"
                  className="w-full h-10 rounded-xl bg-white border border-[#E8E8E5] px-3"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1">Оценка с/с в тираже (₽/ед.)</label>
                <input
                  type="number"
                  value={sampleForm.estimatedUnitProductionPrice}
                  onChange={(e) =>
                    setSampleForm({
                      ...sampleForm,
                      estimatedUnitProductionPrice: e.target.value,
                    })
                  }
                  placeholder="430"
                  className="w-full h-10 rounded-xl bg-white border border-[#E8E8E5] px-3"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[12px] font-semibold mb-1">Комментарий по качеству и деталям конструкции</label>
                <input
                  value={sampleForm.comments}
                  onChange={(e) => setSampleForm({ ...sampleForm, comments: e.target.value })}
                  placeholder="Тактильные ощущения, качество швов и резинки..."
                  className="w-full h-10 rounded-xl bg-white border border-[#E8E8E5] px-3"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1">Предварительная оценка (1–5)</label>
                <select
                  value={sampleForm.preliminaryScore}
                  onChange={(e) =>
                    setSampleForm({ ...sampleForm, preliminaryScore: e.target.value })
                  }
                  className="w-full h-10 rounded-xl bg-white border border-[#E8E8E5] px-3 font-bold"
                >
                  <option value="5">5 — Отлично</option>
                  <option value="4">4 — Хорошо</option>
                  <option value="3">3 — Удовлетворительно</option>
                  <option value="2">2 — Слабо (нужна доработка)</option>
                  <option value="1">1 — Брак</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (!sampleForm.factoryName.trim()) {
                    notify('warning', 'Укажите название фабрики для паспорта образца');
                    return;
                  }
                  const newSample: RnDSampleItem = {
                    id: `smp-${Date.now()}`,
                    versionCode:
                      sampleForm.versionCode.trim() || `Образец №${samples.length + 1}`,
                    factoryName: sampleForm.factoryName.trim(),
                    country: sampleForm.country,
                    orderedAt: sampleForm.orderedAt,
                    receivedAt: sampleForm.receivedAt,
                    status: 'received',
                    photos: [sampleForm.photoUrl || concept.imageUrl],
                    materialAndComposition: sampleForm.materialAndComposition,
                    densityGsm: Number(sampleForm.densityGsm) || 160,
                    sizeTested: sampleForm.sizeTested,
                    color: sampleForm.color || 'Базовый',
                    measurementsNote: sampleForm.measurementsNote || 'Замеры проведены',
                    sampleCostRub: Number(sampleForm.sampleCostRub) || 0,
                    estimatedUnitProductionPrice:
                      Number(sampleForm.estimatedUnitProductionPrice) || 0,
                    currency: 'RUB',
                    preliminaryScore: Number(sampleForm.preliminaryScore) || 4,
                    comments: sampleForm.comments,
                    isSelectedForProduction: samples.length === 0,
                  };
                  onUpdateConcept(concept.id, {
                    samples: [...samples, newSample],
                    sampleStatus: `Добавлен ${newSample.versionCode} (${newSample.factoryName})`,
                    stageHistory: appendHistory(
                      'sample_added',
                      `Добавлен физический образец «${newSample.versionCode}» (${newSample.factoryName})`
                    ),
                  });
                  setSampleForm({
                    ...sampleForm,
                    versionCode: `Образец №${samples.length + 2}`,
                    factoryName: '',
                    comments: '',
                  });
                  notify('success', `Образец «${newSample.versionCode}» добавлен к сравнению`);
                }}
                className="h-10 px-5 rounded-xl bg-[#111111] text-white font-semibold cursor-pointer"
              >
                Сохранить паспорт образца
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===========================================================================
  // ВКЛАДКА 4: ЭТАП 4 — ТЕСТ (П. 9.1–9.3 ТЗ, КРИТЕРИЙ 04 «ПРОВАЛЕННЫЙ ТЕСТ»)
  // ===========================================================================
  if (activeTab === 'testing') {
    const protocols = concept.testProtocols || [];
    const samples = concept.samples || [];

    const VERDICT_LABELS: Record<RnDSampleTestProtocol['verdict'], { text: string; cls: string }> = {
      passed: { text: 'Пройдено', cls: 'bg-[#16805D]/15 text-[#16805D]' },
      passed_with_remarks: {
        text: 'Пройдено с замечаниями',
        cls: 'bg-[#D97745]/15 text-[#D97745]',
      },
      rework_required: {
        text: 'Требуется доработка',
        cls: 'bg-[#DC2626]/15 text-[#DC2626]',
      },
      failed: { text: 'Не пройдено', cls: 'bg-[#DC2626] text-white' },
    };

    return (
      <div className="space-y-8 text-[15px]">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#D97745]">
            Этап 04 · ТЕСТ (п. 9 ТЗ)
          </span>
          <h3 className="text-[20px] font-bold text-[#171717]">
            Протоколы тестирования качества, посадки и стирки ({protocols.length})
          </h3>
          <p className="text-[13px] text-[#737373]">
            Итог тестирования выбирается вручную проверяющим (запрещено автоматическое утверждение по средней оценке, п. 9.3 ТЗ)
          </p>
        </div>

        {/* Список сохранённых протоколов */}
        {protocols.map((pr) => (
          <div
            key={pr.id}
            className="rounded-2xl border border-[#E8E8E5] bg-white p-6 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E8E5] pb-3">
              <div>
                <div className="font-bold text-[17px] text-[#171717]">
                  Протокол по образцу: {pr.sampleVersionLabel}
                </div>
                <div className="text-[12px] text-[#737373]">
                  Проверяющий: {pr.testerName} · Дата: {pr.testDate} · Стирок: {pr.washCyclesCount}{' '}
                  ({pr.washTempAndMode})
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-lg text-[13px] font-bold ${
                  VERDICT_LABELS[pr.verdict].cls
                }`}
              >
                Итог: {VERDICT_LABELS[pr.verdict].text}
              </span>
            </div>

            <div className="rounded-xl bg-[#F7F7F5] p-3.5 text-[13px]">
              <b>Замеры до и после стирки:</b> {pr.measurementsBeforeAfter}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[13px]">
              {pr.criteria.map((c) => (
                <div
                  key={c.criterionKey}
                  className="rounded-lg border border-[#E8E8E5] p-2.5 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-semibold text-[#171717]">{c.label}</div>
                    {c.comment && <div className="text-[12px] text-[#737373]">{c.comment}</div>}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded font-bold shrink-0 ${
                      c.result === 'passed'
                        ? 'bg-[#16805D]/15 text-[#16805D]'
                        : 'bg-[#DC2626]/15 text-[#DC2626]'
                    }`}
                  >
                    {c.score}/5
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E8E8E5] text-[14px]">
              <div>
                <b>Заключение протокола:</b> {pr.summaryComment}
              </div>
              {canEdit &&
                (pr.verdict === 'rework_required' || pr.verdict === 'failed') && (
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateConcept(concept.id, {
                        stage: 'SAMPLE',
                        nextStep: `Доработать образец (${pr.sampleVersionLabel}): ${pr.summaryComment}`,
                        stageHistory: appendHistory(
                          'rollback',
                          `Проваленный тест (${pr.sampleVersionLabel}): ${pr.summaryComment}. Возвращено на доработку без потери данных.`,
                          'SAMPLE'
                        ),
                      });
                      notify(
                        'warning',
                        'Карточка возвращена на этап «03 · Образец» на доработку',
                        'Все данные и протокол сохранены в истории'
                      );
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#DC2626] text-white text-[13px] font-semibold cursor-pointer"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Вернуть карточку на доработку (Этап Образец)</span>
                  </button>
                )}
            </div>
          </div>
        ))}

        {/* Форма нового протокола тестирования (8 базовых тестов нижнего белья, п. 9.1–9.2 ТЗ) */}
        {canEdit && (
          <div className="rounded-2xl border border-[#E8E8E5] bg-[#F7F7F5] p-6 space-y-5 text-[14px]">
            <h4 className="text-[17px] font-bold text-[#171717]">
              + Заполнить протокол тестирования (8 базовых критериев нижнего белья)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[12px] font-semibold mb-1">Версия образца</label>
                <select
                  value={selectedSampleForTest}
                  onChange={(e) => setSelectedSampleForTest(e.target.value)}
                  className="w-full h-10 rounded-xl bg-white border border-[#E8E8E5] px-3 font-semibold"
                >
                  {samples.length > 0 ? (
                    samples.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.versionCode} ({s.factoryName})
                      </option>
                    ))
                  ) : (
                    <option value="default">Первичный образец</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1">Количество циклов стирки</label>
                <input
                  type="number"
                  value={washCycles}
                  onChange={(e) => setWashCycles(e.target.value)}
                  className="w-full h-10 rounded-xl bg-white border border-[#E8E8E5] px-3"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1">Режим стирки и температура</label>
                <input
                  value={washMode}
                  onChange={(e) => setWashMode(e.target.value)}
                  className="w-full h-10 rounded-xl bg-white border border-[#E8E8E5] px-3"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-[12px] font-semibold mb-1">
                  Замеры до и после стирки (усадка, перекос швов, поведение резинки)
                </label>
                <input
                  value={washMeasurements}
                  onChange={(e) => setWashMeasurements(e.target.value)}
                  placeholder="Напр.: Пояс до стирки 39,0 см → после 5 циклов 38,4 см (-1,5%)."
                  className="w-full h-10 rounded-xl bg-white border border-[#E8E8E5] px-3"
                />
              </div>
            </div>

            {/* Чек-лист 8 критериев */}
            <div className="space-y-2">
              {criteriaScores.map((crit, idx) => (
                <div
                  key={crit.criterionKey}
                  className="rounded-xl bg-white border border-[#E8E8E5] p-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
                >
                  <div className="md:col-span-4 font-semibold text-[#171717]">
                    {idx + 1}. {crit.label}
                  </div>
                  <div className="md:col-span-2">
                    <select
                      value={crit.score}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setCriteriaScores((prev) =>
                          prev.map((item, i) =>
                            i === idx
                              ? {
                                  ...item,
                                  score: val,
                                  result: val >= 4 ? 'passed' : val === 3 ? 'rework' : 'failed',
                                }
                              : item
                          )
                        );
                      }}
                      className="w-full h-9 rounded-lg border border-[#E8E8E5] px-2 font-bold"
                    >
                      <option value={5}>Оценка 5 / 5</option>
                      <option value={4}>Оценка 4 / 5</option>
                      <option value={3}>Оценка 3 / 5</option>
                      <option value={2}>Оценка 2 / 5 (Проблема)</option>
                      <option value={1}>Оценка 1 / 5 (Провал)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <select
                      value={crit.result}
                      onChange={(e) => {
                        const res = e.target.value as RnDTestCriterionScore['result'];
                        setCriteriaScores((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, result: res } : item))
                        );
                      }}
                      className="w-full h-9 rounded-lg border border-[#E8E8E5] px-2 font-semibold"
                    >
                      <option value="passed">Прошёл</option>
                      <option value="rework">Требуется доработка</option>
                      <option value="failed">Не прошёл</option>
                    </select>
                  </div>
                  <div className="md:col-span-4">
                    <input
                      value={crit.comment}
                      onChange={(e) => {
                        const txt = e.target.value;
                        setCriteriaScores((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, comment: txt } : item))
                        );
                      }}
                      placeholder="Замечание проверяющего..."
                      className="w-full h-9 rounded-lg border border-[#E8E8E5] px-2.5 text-[13px]"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[12px] font-semibold mb-1">
                  Ручной итог тестирования (п. 9.3 ТЗ)
                </label>
                <select
                  value={testVerdict}
                  onChange={(e) =>
                    setTestVerdict(e.target.value as RnDSampleTestProtocol['verdict'])
                  }
                  className="w-full h-10 rounded-xl bg-white border border-[#E8E8E5] px-3 font-bold"
                >
                  <option value="passed">Пройдено</option>
                  <option value="passed_with_remarks">Пройдено с замечаниями</option>
                  <option value="rework_required">Требуется доработка (возврат на Образец)</option>
                  <option value="failed">Не пройдено</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1">
                  Итоговый вывод по испытанию
                </label>
                <input
                  value={testSummary}
                  onChange={(e) => setTestSummary(e.target.value)}
                  placeholder="Резюме проверки качества и посадки..."
                  className="w-full h-10 rounded-xl bg-white border border-[#E8E8E5] px-3"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  const targetSmp = samples.find((s) => s.id === selectedSampleForTest);
                  const smpLabel = targetSmp
                    ? `${targetSmp.versionCode} (${targetSmp.factoryName})`
                    : 'Образец №1';
                  const newProt: RnDSampleTestProtocol = {
                    id: `tp-${Date.now()}`,
                    sampleId: selectedSampleForTest || 'default',
                    sampleVersionLabel: smpLabel,
                    testerName: currentUser.fullName,
                    testDate: new Date().toISOString().slice(0, 10),
                    washCyclesCount: Number(washCycles) || 5,
                    washTempAndMode: washMode,
                    measurementsBeforeAfter:
                      washMeasurements || 'Замеры проведены, усадка в пределах нормы.',
                    criteria: criteriaScores,
                    verdict: testVerdict,
                    summaryComment:
                      testSummary || `Протокол завершён (${VERDICT_LABELS[testVerdict].text}).`,
                  };
                  const isRework =
                    testVerdict === 'rework_required' || testVerdict === 'failed';
                  onUpdateConcept(concept.id, {
                    testProtocols: [newProt, ...protocols],
                    testResults: `${VERDICT_LABELS[testVerdict].text}: ${newProt.summaryComment}`,
                    stage: isRework ? 'SAMPLE' : concept.stage,
                    stageHistory: appendHistory(
                      isRework ? 'rollback' : 'test_completed',
                      `Протокол теста (${smpLabel}): ${VERDICT_LABELS[testVerdict].text} — ${newProt.summaryComment}`,
                      isRework ? 'SAMPLE' : concept.stage
                    ),
                  });
                  setTestSummary('');
                  notify(
                    isRework ? 'warning' : 'success',
                    isRework
                      ? 'Проблема зафиксирована в протоколе — карточка возвращена на доработку (Образец)'
                      : 'Протокол тестирования сохранён'
                  );
                }}
                className="h-10 px-5 rounded-xl bg-[#111111] text-white font-semibold cursor-pointer"
              >
                Сохранить протокол тестирования
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===========================================================================
  // ВКЛАДКА 5: ЭТАП 5 — РЕШЕНИЕ (П. 10 ТЗ, СХЕМА 5, КРИТЕРИЙ 05)
  // ===========================================================================
  if (activeTab === 'decisions') {
    const decisions = concept.approvalDecisions || [];
    const samples = concept.samples || [];

    const handleRecordDecision = (outcome: RnDDecisionOutcome) => {
      if (outcome === 'approve' && !canApproveProd) {
        notify(
          'error',
          'Ограничение прав доступа (Критерий 05 ТЗ)',
          'Обычный сотрудник не может утвердить производство. Требуется роль Владельца или уполномоченного руководителя.'
        );
        return;
      }
      if (!decisionJustification.trim()) {
        notify('warning', 'Укажите аргументы и обоснование управленческого решения');
        return;
      }

      const chosenSample = samples.find((s) => s.id === decisionSampleId) || samples[0];
      const newDec: RnDApprovalDecision = {
        id: `dec-${Date.now()}`,
        decision: outcome,
        authorName: currentUser.fullName,
        authorRole: currentUser.role,
        decidedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        approvedSampleId: chosenSample?.id,
        approvedSampleLabel: chosenSample
          ? `${chosenSample.versionCode} (${chosenSample.factoryName})`
          : 'Базовый образец',
        justification: decisionJustification.trim(),
        conditions: decisionConditions.trim() || 'Без дополнительных условий',
      };

      let nextStage: ConceptStage = concept.stage;
      let updatedSamples = samples;
      let isArchived = concept.isArchived;

      if (outcome === 'approve') {
        nextStage = 'PRODUCTION';
        updatedSamples = samples.map((s) => ({
          ...s,
          isSelectedForProduction: chosenSample ? s.id === chosenSample.id : s.isSelectedForProduction,
          status: chosenSample && s.id === chosenSample.id ? 'approved' : s.status,
        }));
      } else if (outcome === 'rework') {
        nextStage = 'SAMPLE';
        // При доработке сохранять историю и создавать новую версию образца (п. 10 ТЗ)
        const nextIdx = samples.length + 1;
        const reworkSample: RnDSampleItem = {
          id: `smp-rework-${Date.now()}`,
          versionCode: `Доработка №${nextIdx} (после решения)`,
          factoryName: chosenSample?.factoryName || concept.supplierName || 'Фабрика уточняется',
          country: chosenSample?.country || 'Китай',
          orderedAt: new Date().toISOString().slice(0, 10),
          receivedAt: 'В работе',
          status: 'ordered',
          photos: [concept.imageUrl],
          materialAndComposition: chosenSample?.materialAndComposition || 'По ТЗ доработки',
          densityGsm: chosenSample?.densityGsm || 180,
          sizeTested: chosenSample?.sizeTested || 'L',
          color: chosenSample?.color || 'По ТЗ',
          measurementsNote: `Задание на доработку: ${decisionJustification.trim()}`,
          sampleCostRub: 0,
          estimatedUnitProductionPrice: chosenSample?.estimatedUnitProductionPrice || 0,
          currency: 'RUB',
          preliminaryScore: 4,
          comments: `Создана новая версия образца при возврате на доработку: ${decisionConditions.trim() || decisionJustification.trim()}`,
          isSelectedForProduction: false,
        };
        updatedSamples = [...samples, reworkSample];
      } else if (outcome === 'postpone') {
        nextStage = 'POSTPONED';
      } else if (outcome === 'reject') {
        nextStage = 'REJECTED';
        isArchived = true;
      }

      onUpdateConcept(concept.id, {
        stage: nextStage,
        isArchived,
        samples: updatedSamples,
        supplierName: chosenSample?.factoryName || concept.supplierName,
        approvalDecisions: [newDec, ...decisions],
        stageHistory: appendHistory(
          'decision',
          `Управленческое решение «${
            outcome === 'approve'
              ? 'УТВЕРДИТЬ ДЛЯ ПРОИЗВОДСТВА'
              : outcome === 'rework'
              ? 'ВЕРНУТЬ НА ДОРАБОТКУ'
              : outcome === 'postpone'
              ? 'ОТЛОЖИТЬ'
              : 'ОТКЛОНИТЬ'
          }» (${newDec.approvedSampleLabel}): ${newDec.justification}`,
          nextStage
        ),
      });

      setDecisionJustification('');
      setDecisionConditions('');
      notify(
        outcome === 'approve' ? 'success' : 'warning',
        `Решение зафиксировано: ${
          outcome === 'approve'
            ? 'Утверждено в производство'
            : outcome === 'rework'
            ? 'Возвращено на доработку (создана новая версия образца)'
            : outcome === 'postpone'
            ? 'Разработка отложена'
            : 'Разработка отклонена и перенесена в архив'
        }`
      );
    };

    return (
      <div className="space-y-8 text-[15px]">
        {/* Схема 5 из ТЗ: Точка принятия управленческого решения */}
        <div className="rounded-2xl border border-[#E8E8E5] bg-white p-6 space-y-6">
          <div className="text-center rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] p-4">
            <div className="text-[16px] font-bold text-[#171717]">
              Тест завершён → решение уполномоченного руководителя (Схема 5 ТЗ)
            </div>
            <div className="text-[13px] text-[#737373] mt-1">
              Утверждённая версия образца + аргументы + автор + дата
            </div>
          </div>

          {!canApproveProd && (
            <div className="rounded-xl bg-[#D97745]/10 border border-[#D97745]/30 p-4 flex items-center gap-3 text-[13px] text-[#171717]">
              <Lock className="h-5 w-5 text-[#D97745] shrink-0" />
              <div>
                <b>Контроль полномочий (Критерий 05 ТЗ):</b> Ваша текущая роль —{' '}
                <b>{ROLE_LABELS_RU[currentUser.role]}</b>. Обычный сотрудник не может утвердить запуск в производство (кнопка «УТВЕРДИТЬ» доступна только Владельцу или уполномоченному руководителю).
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[14px]">
            <div>
              <label className="block font-semibold mb-1.5">
                Утверждаемая версия образца
              </label>
              <select
                value={decisionSampleId}
                onChange={(e) => setDecisionSampleId(e.target.value)}
                className="w-full h-11 rounded-xl border border-[#E8E8E5] px-3 bg-white font-semibold"
              >
                {samples.length > 0 ? (
                  samples.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.versionCode} · {s.factoryName}
                    </option>
                  ))
                ) : (
                  <option value="">Базовый образец разработки</option>
                )}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1.5">
                Обоснование и аргументы решения (обязательно)
              </label>
              <input
                value={decisionJustification}
                onChange={(e) => setDecisionJustification(e.target.value)}
                placeholder="Почему утверждаем / возвращаем / откладываем..."
                className="w-full h-11 rounded-xl border border-[#E8E8E5] px-3.5"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1.5">
                Условия утверждения / замечания к партии
              </label>
              <input
                value={decisionConditions}
                onChange={(e) => setDecisionConditions(e.target.value)}
                placeholder="Напр.: Контроль AQL 1.5 перед отгрузкой..."
                className="w-full h-11 rounded-xl border border-[#E8E8E5] px-3.5"
              />
            </div>
          </div>

          {/* Четыре кнопки управленческого решения строго по Схеме 5 ТЗ */}
          {!isStrategyMode && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleRecordDecision('approve')}
                className={`h-12 rounded-xl font-bold text-[14px] tracking-wide uppercase transition cursor-pointer ${
                  canApproveProd
                    ? 'bg-[#2E7D5B] hover:bg-[#25664A] text-white shadow-xs'
                    : 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                }`}
              >
                УТВЕРДИТЬ
              </button>
              <button
                type="button"
                onClick={() => handleRecordDecision('rework')}
                className="h-12 rounded-xl bg-[#D9822B] hover:bg-[#B86B1F] text-white font-bold text-[14px] tracking-wide uppercase transition cursor-pointer"
              >
                ДОРАБОТАТЬ
              </button>
              <button
                type="button"
                onClick={() => handleRecordDecision('postpone')}
                className="h-12 rounded-xl bg-[#2C4C66] hover:bg-[#223B4F] text-white font-bold text-[14px] tracking-wide uppercase transition cursor-pointer"
              >
                ОТЛОЖИТЬ
              </button>
              <button
                type="button"
                onClick={() => handleRecordDecision('reject')}
                className="h-12 rounded-xl bg-[#B83B3B] hover:bg-[#962F2F] text-white font-bold text-[14px] tracking-wide uppercase transition cursor-pointer"
              >
                ОТКЛОНИТЬ
              </button>
            </div>
          )}
        </div>

        {/* Журнал принятых управленческих решений */}
        <div className="space-y-3">
          <h4 className="text-[17px] font-bold text-[#171717]">
            Зафиксированные решения по карточке ({decisions.length})
          </h4>
          {decisions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#E8E8E5] p-6 text-center text-[#737373] text-[14px]">
              Официальное решение по этой карточке ещё не принято.
            </div>
          ) : (
            decisions.map((d) => (
              <div
                key={d.id}
                className="rounded-xl border border-[#E8E8E5] bg-white p-4 space-y-2 text-[14px]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-md text-[12px] font-bold uppercase ${
                      d.decision === 'approve'
                        ? 'bg-[#16805D]/15 text-[#16805D]'
                        : d.decision === 'rework'
                        ? 'bg-[#D97745]/15 text-[#D97745]'
                        : 'bg-[#DC2626]/15 text-[#DC2626]'
                    }`}
                  >
                    {d.decision === 'approve'
                      ? 'Утверждено для производства'
                      : d.decision === 'rework'
                      ? 'Возвращено на доработку'
                      : d.decision === 'postpone'
                      ? 'Отложено'
                      : 'Отклонено'}
                  </span>
                  <span className="text-[12px] text-[#737373]">
                    Автор: <b className="text-[#171717]">{d.authorName}</b> (
                    {ROLE_LABELS_RU[d.authorRole]}) · {d.decidedAt}
                  </span>
                </div>
                {d.approvedSampleLabel && (
                  <div className="text-[13px]">
                    Выбранный образец: <b>{d.approvedSampleLabel}</b>
                  </div>
                )}
                <div className="text-[14px] text-[#171717]">
                  <b>Обоснование:</b> {d.justification}
                </div>
                <div className="text-[13px] text-[#737373]">
                  <b>Условия:</b> {d.conditions}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }
  // ===========================================================================
  // ВКЛАДКА 6: ЭТАП 6 — ПРОИЗВОДСТВО И ТЗ ФАБРИКИ (П. 11, 11.1 ТЗ, КРИТЕРИЙ 06)
  // ===========================================================================
  if (activeTab === 'production') {
    const orders = concept.productionOrders || [];
    const approvedSample =
      concept.samples?.find((s) => s.isSelectedForProduction) || concept.samples?.[0];

    const handleExportFactorySheet = () => {
      const tp = concept.techPack;
      const lines = [
        `BORNERS GROUP — FACTORY TECH PACK (ZH / EN / RU)`,
        `====================================================================`,
        `CODE: ${concept.code} | BRAND: ${concept.brandId} | TARGET DATE: ${concept.targetLaunchDate}`,
        `APPROVED SAMPLE: ${approvedSample ? approvedSample.versionCode : concept.selectedDesignVersion}`,
        ``,
        `[1. 中文生产制造单 / CHINESE FACTORY SPECIFICATION]`,
        `款式名称: ${tp.zh.modelName}`,
        `结构工艺: ${tp.zh.construction}`,
        `面料与成分: ${tp.zh.material} (${tp.zh.compositionAndDensity})`,
        `颜色与潘通: ${tp.zh.colorAndPantone}`,
        `尺码放码: ${tp.zh.sizeGrading}`,
        `腰带与缝线: ${tp.zh.waistbandSpec} / ${tp.zh.seamsSpec}`,
        `包装与质检: ${tp.zh.packagingSpec} / ${tp.zh.qualityRequirements}`,
        ``,
        `[2. ENGLISH FACTORY SPECIFICATION]`,
        `Style Name: ${tp.en.modelName}`,
        `Construction: ${tp.en.construction}`,
        `Fabric & GSM: ${tp.en.material} (${tp.en.compositionAndDensity})`,
        `Color & Pantone: ${tp.en.colorAndPantone}`,
        `Size Grading: ${tp.en.sizeGrading}`,
        `Waistband & Seams: ${tp.en.waistbandSpec} / ${tp.en.seamsSpec}`,
        `Packaging & QC: ${tp.en.packagingSpec} / ${tp.en.qualityRequirements}`,
        ``,
        `[3. РУССКАЯ СПЕЦИФИКАЦИЯ R&D]`,
        `Модель: ${tp.ru.modelName}`,
        `Конструкция: ${tp.ru.construction}`,
        `Полотно и плотность: ${tp.ru.material} (${tp.ru.compositionAndDensity})`,
        `Цвет и Pantone: ${tp.ru.colorAndPantone}`,
        `Размерная сетка: ${tp.ru.sizeGrading}`,
        `Швы и пояс: ${tp.ru.waistbandSpec} / ${tp.ru.seamsSpec}`,
        `Упаковка и ОТК: ${tp.ru.packagingSpec} / ${tp.ru.qualityRequirements}`,
      ];
      const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TechPack_${concept.code}_${concept.brandId}_ZH_EN_RU.txt`;
      a.click();
      URL.revokeObjectURL(url);
    };

    const handlePrintPdfTechPack = () => {
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
            Код R&D: <b>${concept.code}</b> · Бренд: <b>${concept.brandId}</b> · Образец: <b>${approvedSample?.versionCode || 'v' + concept.selectedDesignVersion}</b>
          </div>
          <h2>1. 中文生产制造单 (Chinese Factory Specification)</h2>
          <table>
            <tr><th>款式名称</th><td>${tp.zh.modelName}</td></tr>
            <tr><th>结构工艺</th><td>${tp.zh.construction}</td></tr>
            <tr><th>面料与克重</th><td>${tp.zh.material} (${tp.zh.compositionAndDensity})</td></tr>
            <tr><th>颜色与潘通</th><td>${tp.zh.colorAndPantone}</td></tr>
            <tr><th>尺码放码</th><td>${tp.zh.sizeGrading}</td></tr>
            <tr><th>腰带与缝线</th><td>${tp.zh.waistbandSpec} · ${tp.zh.seamsSpec}</td></tr>
            <tr><th>包装与质检</th><td>${tp.zh.packagingSpec} · ${tp.zh.qualityRequirements}</td></tr>
          </table>
          <h2>2. Русская технологическая спецификация R&D</h2>
          <table>
            <tr><th>Наименование модели</th><td>${tp.ru.modelName}</td></tr>
            <tr><th>Конструкция и лекала</th><td>${tp.ru.construction}</td></tr>
            <tr><th>Полотно и плотность</th><td>${tp.ru.material} (${tp.ru.compositionAndDensity})</td></tr>
            <tr><th>Цвет и Pantone</th><td>${tp.ru.colorAndPantone}</td></tr>
            <tr><th>Размерная сетка</th><td>${tp.ru.sizeGrading}</td></tr>
            <tr><th>Пояс и швы</th><td>${tp.ru.waistbandSpec} · ${tp.ru.seamsSpec}</td></tr>
            <tr><th>Упаковка и ОТК</th><td>${tp.ru.packagingSpec} · ${tp.ru.qualityRequirements}</td></tr>
          </table>
          <script>window.onload = () => { window.print(); };</script>
        </body>
        </html>
      `);
      win.document.close();
    };

    return (
      <div className="space-y-8 text-[15px]">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#D97745]">
            Этап 06 · ПРОИЗВОДСТВО (п. 11 ТЗ)
          </span>
          <h3 className="text-[20px] font-bold text-[#171717]">
            Производственные заказы ({orders.length}) и Финальное ТЗ для фабрики
          </h3>
          <p className="text-[13px] text-[#737373]">
            7 внутренних статусов производства внутри заказа не создают лишних колонок на доске R&D (п. 11.1 ТЗ)
          </p>
        </div>

        {/* Карточки производственных заказов */}
        {orders.map((po) => (
          <div
            key={po.id}
            className="rounded-2xl border border-[#E8E8E5] bg-white p-6 space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E8E5] pb-3">
              <div>
                <div className="text-[18px] font-bold text-[#171717]">
                  Заказ {po.orderNumber} · {po.factoryName}
                </div>
                <div className="text-[13px] text-[#737373]">
                  Контакт: {po.contactPerson} · Утверждённый образец: <b>{po.approvedSampleVersion}</b>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canEdit && (
                  <label className="inline-flex items-center gap-1.5 text-[12px] font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(po.hasDelayRisk)}
                      onChange={(e) => {
                        const updated = orders.map((o) =>
                          o.id === po.id ? { ...o, hasDelayRisk: e.target.checked } : o
                        );
                        onUpdateConcept(concept.id, { productionOrders: updated });
                      }}
                      className="accent-[#DC2626]"
                    />
                    <span className={po.hasDelayRisk ? 'text-[#DC2626]' : 'text-[#737373]'}>
                      Риск задержки
                    </span>
                  </label>
                )}
              </div>
            </div>

            {/* 7 внутренних статусов производства (п. 11.1 ТЗ) */}
            <div className="space-y-2">
              <div className="text-[12px] font-bold uppercase text-[#737373]">
                Внутренний статус производства (п. 11.1 ТЗ):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PRODUCTION_INTERNAL_STATUSES.map((st, idx) => {
                  const isActive = po.internalStatus === st.code;
                  return (
                    <button
                      key={st.code}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => {
                        const updated = orders.map((o) =>
                          o.id === po.id ? { ...o, internalStatus: st.code } : o
                        );
                        onUpdateConcept(concept.id, { productionOrders: updated });
                        notify('success', `Статус заказа ${po.orderNumber}: «${st.label}»`);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition cursor-pointer ${
                        isActive
                          ? 'bg-[#111111] text-white border-[#111111]'
                          : 'bg-[#F7F7F5] text-[#737373] border-[#E8E8E5] hover:text-[#171717]'
                      }`}
                    >
                      {idx + 1}. {st.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Размерная сетка и параметры партии */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[14px]">
              <div className="rounded-xl bg-[#F7F7F5] p-3.5">
                <div className="text-[12px] text-[#737373]">Общий тираж и комплектность</div>
                <div className="text-[18px] font-bold text-[#171717] mt-0.5">
                  {po.totalUnits.toLocaleString('ru-RU')} ед. ({po.packConfiguration})
                </div>
                <div className="text-[12px] text-[#737373] mt-1">
                  S: {po.sizeBreakdown.S} · M: {po.sizeBreakdown.M} · L: {po.sizeBreakdown.L} · XL:{' '}
                  {po.sizeBreakdown.XL} · XXL: {po.sizeBreakdown.XXL}
                </div>
              </div>
              <div className="rounded-xl bg-[#F7F7F5] p-3.5">
                <div className="text-[12px] text-[#737373]">Цена производства и бюджет</div>
                <div className="text-[18px] font-bold text-[#171717] mt-0.5">
                  {hasCostAccess
                    ? `${formatCurrencyRub(po.unitPrice, po.currency)} / ед.`
                    : 'Скрыто по роли'}
                </div>
                <div className="text-[12px] text-[#737373] mt-1">
                  Плановая дата готовности: <b>{po.plannedReadyDate}</b>
                </div>
              </div>
              <div className="rounded-xl bg-[#F7F7F5] p-3.5">
                <div className="text-[12px] text-[#737373]">Контроль качества и логистика</div>
                <div className="text-[13px] font-medium text-[#171717] mt-0.5">
                  {po.qcNotes}
                </div>
                <div className="text-[12px] text-[#737373] mt-1">{po.logisticsTracking}</div>
              </div>
            </div>
          </div>
        ))}

        {/* Создание связанного производственного заказа (Критерий 06 ТЗ) */}
        {canEdit && (
          <div className="rounded-2xl border border-[#E8E8E5] bg-[#F7F7F5] p-6 space-y-4 text-[14px]">
            <h4 className="text-[17px] font-bold text-[#171717]">
              + Создать связанный производственный заказ (п. 11 ТЗ)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                value={poForm.orderNumber}
                onChange={(e) => setPoForm({ ...poForm, orderNumber: e.target.value })}
                placeholder="Номер заказа (PO-2026-...)"
                className="h-10 rounded-xl bg-white border border-[#E8E8E5] px-3"
              />
              <input
                value={poForm.factoryName}
                onChange={(e) => setPoForm({ ...poForm, factoryName: e.target.value })}
                placeholder="Фабрика"
                className="h-10 rounded-xl bg-white border border-[#E8E8E5] px-3"
              />
              <input
                value={poForm.contactPerson}
                onChange={(e) => setPoForm({ ...poForm, contactPerson: e.target.value })}
                placeholder="Контактное лицо"
                className="h-10 rounded-xl bg-white border border-[#E8E8E5] px-3"
              />
              <input
                value={poForm.materialAndColors}
                onChange={(e) => setPoForm({ ...poForm, materialAndColors: e.target.value })}
                placeholder="Материал и цвета"
                className="h-10 rounded-xl bg-white border border-[#E8E8E5] px-3"
              />
              <input
                type="number"
                value={poForm.unitPrice}
                onChange={(e) => setPoForm({ ...poForm, unitPrice: e.target.value })}
                placeholder="Цена производства (₽/ед.)"
                className="h-10 rounded-xl bg-white border border-[#E8E8E5] px-3"
              />
              <input
                type="date"
                value={poForm.plannedReadyDate}
                onChange={(e) => setPoForm({ ...poForm, plannedReadyDate: e.target.value })}
                className="h-10 rounded-xl bg-white border border-[#E8E8E5] px-3"
              />
            </div>
            <div className="grid grid-cols-5 gap-2 text-[12px]">
              {(['S', 'M', 'L', 'XL', 'XXL'] as const).map((sz) => {
                const key = `size${sz}` as 'sizeS' | 'sizeM' | 'sizeL' | 'sizeXL' | 'sizeXXL';
                return (
                  <div key={sz}>
                    <label className="block font-bold mb-1">Размер {sz}</label>
                    <input
                      type="number"
                      value={poForm[key]}
                      onChange={(e) => setPoForm({ ...poForm, [key]: e.target.value })}
                      className="w-full h-9 rounded-lg bg-white border border-[#E8E8E5] px-2"
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  const sb = {
                    S: Number(poForm.sizeS) || 0,
                    M: Number(poForm.sizeM) || 0,
                    L: Number(poForm.sizeL) || 0,
                    XL: Number(poForm.sizeXL) || 0,
                    XXL: Number(poForm.sizeXXL) || 0,
                  };
                  const totalUnits = sb.S + sb.M + sb.L + sb.XL + sb.XXL;
                  const newOrder: RnDProductionOrder = {
                    id: `po-${Date.now()}`,
                    orderNumber: poForm.orderNumber,
                    factoryName: poForm.factoryName || concept.supplierName || 'Фабрика-партнёр',
                    contactPerson: poForm.contactPerson,
                    approvedSampleVersion:
                      approvedSample?.versionCode || `v${concept.selectedDesignVersion}`,
                    internalStatus: 'order_placed',
                    materialAndColors: poForm.materialAndColors || 'По спецификации ТЗ',
                    sizeBreakdown: sb,
                    totalUnits,
                    packConfiguration: poForm.packConfiguration,
                    packagingDetails: poForm.packagingDetails,
                    unitPrice: Number(poForm.unitPrice) || 350,
                    currency: 'RUB',
                    plannedReadyDate: poForm.plannedReadyDate,
                    qcNotes: 'Контроль AQL 1.5 по утверждённому образцу',
                    logisticsTracking: 'Ожидается отгрузка с фабрики',
                    hasDelayRisk: false,
                  };
                  onUpdateConcept(concept.id, {
                    productionOrders: [newOrder, ...orders],
                    plannedUnitCost: newOrder.unitPrice,
                    supplierName: newOrder.factoryName,
                    stageHistory: appendHistory(
                      'production_order',
                      `Создан производственный заказ ${newOrder.orderNumber} (${newOrder.totalUnits} ед.) по образцу ${newOrder.approvedSampleVersion}`
                    ),
                  });
                  notify('success', `Производственный заказ ${newOrder.orderNumber} создан`);
                }}
                className="h-10 px-5 rounded-xl bg-[#111111] text-white font-semibold cursor-pointer"
              >
                Создать производственный заказ
              </button>
            </div>
          </div>
        )}

        {/* Финальное ТЗ для фабрики на 3 языках (中文 / EN / RU) */}
        <div className="rounded-2xl border border-[#E8E8E5] bg-white p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-[17px] font-bold text-[#171717]">
                Финальное техническое задание для фабрики (ZH / EN / RU)
              </h4>
              <p className="text-[12px] text-[#737373]">
                Китайский язык первым для прямой отправки на фабрики КНР + русская версия для Узбекистана и РФ
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex bg-[#F7F7F5] p-1 rounded-xl border border-[#E8E8E5]">
                {(['zh', 'en', 'ru'] as const).map((lng) => (
                  <button
                    key={lng}
                    type="button"
                    onClick={() => {
                      setTechPackLang(lng);
                      setIsEditingTechPack(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold cursor-pointer ${
                      techPackLang === lng ? 'bg-white text-[#171717] shadow-2xs' : 'text-[#737373]'
                    }`}
                  >
                    {lng === 'zh' ? '中文' : lng === 'en' ? 'EN' : 'RU'}
                  </button>
                ))}
              </div>
              {canEdit && !isEditingTechPack && (
                <button
                  type="button"
                  onClick={() => {
                    setTechPackDraft({ ...concept.techPack[techPackLang] });
                    setIsEditingTechPack(true);
                  }}
                  className="inline-flex items-center gap-1.5 h-9 rounded-xl border border-[#E8E8E5] px-3 text-[13px] font-semibold cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Редактировать</span>
                </button>
              )}
              <button
                type="button"
                onClick={handlePrintPdfTechPack}
                className="inline-flex items-center gap-1.5 h-9 rounded-xl border border-[#E8E8E5] px-3 text-[13px] font-semibold cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Печать / PDF</span>
              </button>
              <button
                type="button"
                onClick={handleExportFactorySheet}
                className="inline-flex items-center gap-1.5 h-9 rounded-xl bg-[#111111] text-white px-3.5 text-[13px] font-semibold cursor-pointer"
              >
                <FileDown className="h-3.5 w-3.5" />
                <span>Скачать .TXT</span>
              </button>
            </div>
          </div>

          {isEditingTechPack && techPackDraft ? (
            <div className="space-y-4 rounded-xl bg-[#F7F7F5] p-4 text-[14px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(
                  [
                    ['modelName', 'Модель / Style Name'],
                    ['construction', 'Конструкция / Construction'],
                    ['material', 'Материал / Fabric'],
                    ['compositionAndDensity', 'Состав и плотность / GSM'],
                    ['colorAndPantone', 'Цвет и Pantone'],
                    ['sizeGrading', 'Размерная сетка'],
                    ['waistbandSpec', 'Пояс / Резинка'],
                    ['seamsSpec', 'Швы'],
                    ['packagingSpec', 'Упаковка'],
                    ['qualityRequirements', 'Требования качества (AQL)'],
                  ] as const
                ).map(([field, label]) => (
                  <div key={field}>
                    <label className="block text-[12px] font-semibold mb-1">{label}</label>
                    <input
                      value={techPackDraft[field]}
                      onChange={(e) =>
                        setTechPackDraft({ ...techPackDraft, [field]: e.target.value })
                      }
                      className="w-full h-9 rounded-lg bg-white border border-[#E8E8E5] px-3"
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingTechPack(false)}
                  className="px-4 h-9 rounded-lg border border-[#E8E8E5] bg-white text-[13px] font-semibold cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateConcept(concept.id, {
                      techPack: {
                        ...concept.techPack,
                        [techPackLang]: techPackDraft,
                      },
                    });
                    setIsEditingTechPack(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[#111111] text-white text-[13px] font-semibold cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Сохранить ТЗ</span>
                </button>
              </div>
            </div>
          ) : (
            (() => {
              const spec = concept.techPack[techPackLang];
              return (
                <div className="rounded-xl border border-[#E8E8E5] divide-y divide-[#E8E8E5] text-[14px]">
                  <div className="p-3.5 grid grid-cols-3 gap-4">
                    <span className="text-[#737373]">Модель / Style</span>
                    <span className="col-span-2 font-semibold">{spec.modelName}</span>
                  </div>
                  <div className="p-3.5 grid grid-cols-3 gap-4">
                    <span className="text-[#737373]">Конструкция</span>
                    <span className="col-span-2">{spec.construction}</span>
                  </div>
                  <div className="p-3.5 grid grid-cols-3 gap-4">
                    <span className="text-[#737373]">Материал и плотность</span>
                    <span className="col-span-2">
                      {spec.material} · {spec.compositionAndDensity}
                    </span>
                  </div>
                  <div className="p-3.5 grid grid-cols-3 gap-4">
                    <span className="text-[#737373]">Цвет и Pantone</span>
                    <span className="col-span-2">{spec.colorAndPantone}</span>
                  </div>
                  <div className="p-3.5 grid grid-cols-3 gap-4">
                    <span className="text-[#737373]">Пояс и швы</span>
                    <span className="col-span-2">
                      {spec.waistbandSpec} · {spec.seamsSpec}
                    </span>
                  </div>
                  <div className="p-3.5 grid grid-cols-3 gap-4">
                    <span className="text-[#737373]">Упаковка и ОТК</span>
                    <span className="col-span-2">
                      {spec.packagingSpec} · {spec.qualityRequirements}
                    </span>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      </div>
    );
  }

  // ===========================================================================
  // ВКЛАДКА 7: ЭТАП 7 — ЗАПУСК И ПЕРВЫЕ РЕЗУЛЬТАТЫ 7/14/28 ДНЕЙ (П. 12 ТЗ)
  // ===========================================================================
  if (activeTab === 'launch') {
    const checklist: RnDLaunchChecklist = concept.launchChecklist || {
      catalogCreated: Boolean(linkedProduct),
      photosApproved: false,
      descriptionsReady: false,
      bundlesAndPricesConfirmed: false,
      marketplaceCardsReady: false,
      warehouseDistributed: false,
      adsPrepared: false,
      salesDateAndOwnerAssigned: Boolean(linkedLaunch),
    };

    const checkpoints: RnDPostLaunchCheckpoint[] = concept.postLaunchMetrics || [
      {
        day: 7,
        ordersRub: null,
        ordersUnits: null,
        buyoutsRub: null,
        buyoutsUnits: null,
        avgActualPriceRub: null,
        adSpendRub: null,
        stockLeftUnits: null,
        reviewsSummary: 'Нет данных',
        comparisonWithExpectations: 'Нет данных',
        dataSource: 'Ручной ввод / Отчёт маркетплейса',
      },
      {
        day: 14,
        ordersRub: null,
        ordersUnits: null,
        buyoutsRub: null,
        buyoutsUnits: null,
        avgActualPriceRub: null,
        adSpendRub: null,
        stockLeftUnits: null,
        reviewsSummary: 'Нет данных',
        comparisonWithExpectations: 'Нет данных',
        dataSource: 'Ручной ввод / Отчёт маркетплейса',
      },
      {
        day: 28,
        ordersRub: null,
        ordersUnits: null,
        buyoutsRub: null,
        buyoutsUnits: null,
        avgActualPriceRub: null,
        adSpendRub: null,
        stockLeftUnits: null,
        reviewsSummary: 'Нет данных',
        comparisonWithExpectations: 'Нет данных',
        dataSource: 'Ручной ввод / Отчёт маркетплейса',
      },
    ];

    const CHECKLIST_ITEMS: { key: keyof RnDLaunchChecklist; label: string }[] = [
      { key: 'catalogCreated', label: '1. Товар создан в каталоге моделей' },
      { key: 'photosApproved', label: '2. Фотографии и инфографика утверждены' },
      { key: 'descriptionsReady', label: '3. Описания и характеристики подготовлены' },
      { key: 'bundlesAndPricesConfirmed', label: '4. Комплекты, варианты и цены подтверждены' },
      { key: 'marketplaceCardsReady', label: '5. Карточки маркетплейсов (WB / Ozon) готовы' },
      { key: 'warehouseDistributed', label: '6. Товар распределён по складам ФБО' },
      { key: 'adsPrepared', label: '7. Реклама подготовлена' },
      { key: 'salesDateAndOwnerAssigned', label: '8. Дата продаж и ответственный назначены' },
    ];

    const updateCheckpointField = (
      day: 7 | 14 | 28,
      field: keyof RnDPostLaunchCheckpoint,
      rawVal: string
    ) => {
      const updated = checkpoints.map((cp) => {
        if (cp.day !== day) return cp;
        if (
          [
            'ordersRub',
            'ordersUnits',
            'buyoutsRub',
            'buyoutsUnits',
            'avgActualPriceRub',
            'adSpendRub',
            'stockLeftUnits',
          ].includes(field)
        ) {
          const numVal = rawVal.trim() === '' ? null : Number(rawVal);
          return { ...cp, [field]: Number.isNaN(numVal) ? null : numVal };
        }
        return { ...cp, [field]: rawVal };
      });
      onUpdateConcept(concept.id, { postLaunchMetrics: updated });
    };

    return (
      <div className="space-y-8 text-[15px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#D97745]">
              Этап 07 · ЗАПУСК (п. 12 ТЗ)
            </span>
            <h3 className="text-[20px] font-bold text-[#171717]">
              Чек-лист готовности к продажам и замер 7 / 14 / 28 дней
            </h3>
          </div>
          {!isStrategyMode && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onCreateLaunchFromConcept(concept)}
                className="inline-flex items-center gap-1.5 h-10 rounded-xl border border-[#E8E8E5] bg-white px-4 text-[13px] font-semibold cursor-pointer"
              >
                <CalendarPlus className="h-4 w-4" />
                <span>Связать с Календарём запусков</span>
              </button>
              <button
                type="button"
                onClick={() => onCreateProductFromConcept(concept.id)}
                className="inline-flex items-center gap-1.5 h-10 rounded-xl bg-[#111111] text-white px-4 text-[13px] font-semibold cursor-pointer"
              >
                <PackageCheck className="h-4 w-4" />
                <span>Передать в Каталог моделей SKU</span>
              </button>
            </div>
          )}
        </div>

        {/* 12.1 Чек-лист запуска из 8 пунктов */}
        <div className="rounded-2xl border border-[#E8E8E5] bg-white p-6 space-y-4">
          <h4 className="text-[17px] font-bold text-[#171717]">
            12.1. Чек-лист готовности запуска (8 контрольных точек)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[14px]">
            {CHECKLIST_ITEMS.map((item) => (
              <label
                key={item.key}
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                  checklist[item.key]
                    ? 'bg-[#16805D]/5 border-[#16805D]/40 text-[#171717]'
                    : 'bg-[#F7F7F5]/60 border-[#E8E8E5] text-[#737373]'
                }`}
              >
                <input
                  type="checkbox"
                  disabled={!canEdit}
                  checked={checklist[item.key]}
                  onChange={(e) =>
                    onUpdateConcept(concept.id, {
                      launchChecklist: {
                        ...checklist,
                        [item.key]: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4 accent-[#16805D]"
                />
                <span className="font-semibold">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 12.2 Анализ первых результатов на 7-й, 14-й и 28-й день после старта */}
        <div className="rounded-2xl border border-[#E8E8E5] bg-white p-6 space-y-4">
          <div>
            <h4 className="text-[17px] font-bold text-[#171717]">
              12.2. Анализ первых результатов продаж (7-й, 14-й и 28-й день после старта)
            </h4>
            <p className="text-[12px] text-[#737373]">
              Формула выручки: Выкупленные шт. × Средняя фактическая цена реализации. Отсутствие данных отображается как «Нет данных», а не 0 (п. 12.2 и Критерий 10 ТЗ).
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {checkpoints.map((cp) => (
              <div
                key={cp.day}
                className="rounded-xl border border-[#E8E8E5] bg-[#F7F7F5]/50 p-4 space-y-3 text-[13px]"
              >
                <div className="flex items-center justify-between border-b border-[#E8E8E5] pb-2">
                  <span className="text-[16px] font-bold text-[#171717]">
                    День {cp.day} после старта
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white border border-[#E8E8E5] text-[11px] font-semibold text-[#737373]">
                    {cp.buyoutsRub !== null ? formatCurrencyRub(cp.buyoutsRub) : 'Нет данных'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-[#737373] mb-0.5">Заказы (шт.)</label>
                    <input
                      type="number"
                      disabled={!canEdit}
                      value={cp.ordersUnits ?? ''}
                      placeholder="Нет данных"
                      onChange={(e) =>
                        updateCheckpointField(cp.day, 'ordersUnits', e.target.value)
                      }
                      className="w-full h-8 rounded-lg bg-white border border-[#E8E8E5] px-2 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#737373] mb-0.5">Заказы (₽)</label>
                    <input
                      type="number"
                      disabled={!canEdit}
                      value={cp.ordersRub ?? ''}
                      placeholder="Нет данных"
                      onChange={(e) =>
                        updateCheckpointField(cp.day, 'ordersRub', e.target.value)
                      }
                      className="w-full h-8 rounded-lg bg-white border border-[#E8E8E5] px-2 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#737373] mb-0.5">Выкупы (шт.)</label>
                    <input
                      type="number"
                      disabled={!canEdit}
                      value={cp.buyoutsUnits ?? ''}
                      placeholder="Нет данных"
                      onChange={(e) =>
                        updateCheckpointField(cp.day, 'buyoutsUnits', e.target.value)
                      }
                      className="w-full h-8 rounded-lg bg-white border border-[#E8E8E5] px-2 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#737373] mb-0.5">Выкупы (₽)</label>
                    <input
                      type="number"
                      disabled={!canEdit}
                      value={cp.buyoutsRub ?? ''}
                      placeholder="Нет данных"
                      onChange={(e) =>
                        updateCheckpointField(cp.day, 'buyoutsRub', e.target.value)
                      }
                      className="w-full h-8 rounded-lg bg-white border border-[#E8E8E5] px-2 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#737373] mb-0.5">Средняя цена (₽)</label>
                    <input
                      type="number"
                      disabled={!canEdit}
                      value={cp.avgActualPriceRub ?? ''}
                      placeholder="Нет данных"
                      onChange={(e) =>
                        updateCheckpointField(cp.day, 'avgActualPriceRub', e.target.value)
                      }
                      className="w-full h-8 rounded-lg bg-white border border-[#E8E8E5] px-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#737373] mb-0.5">Реклама (₽)</label>
                    <input
                      type="number"
                      disabled={!canEdit}
                      value={cp.adSpendRub ?? ''}
                      placeholder="Нет данных"
                      onChange={(e) =>
                        updateCheckpointField(cp.day, 'adSpendRub', e.target.value)
                      }
                      className="w-full h-8 rounded-lg bg-white border border-[#E8E8E5] px-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-[#737373] mb-0.5">
                    Отзывы, остатки и сравнение с ожиданиями
                  </label>
                  <textarea
                    rows={2}
                    disabled={!canEdit}
                    value={cp.reviewsSummary}
                    onChange={(e) =>
                      updateCheckpointField(cp.day, 'reviewsSummary', e.target.value)
                    }
                    className="w-full rounded-lg bg-white border border-[#E8E8E5] p-2 text-[12px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#737373] mb-0.5">Источник данных</label>
                  <input
                    disabled={!canEdit}
                    value={cp.dataSource}
                    onChange={(e) =>
                      updateCheckpointField(cp.day, 'dataSource', e.target.value)
                    }
                    className="w-full h-8 rounded-lg bg-white border border-[#E8E8E5] px-2 text-[12px]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 12.3 Итог запуска */}
        <div className="rounded-2xl border border-[#E8E8E5] bg-white p-6 space-y-4">
          <h4 className="text-[17px] font-bold text-[#171717]">
            12.3. Итоговое управленческое решение по запуску
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[13px]">
            {(
              [
                ['scale', 'Масштабировать (увеличить заказ)'],
                ['optimize', 'Оптимизировать (карточку / цену / РК)'],
                ['repeat_test', 'Повторить тест'],
                ['stop_purchases', 'Остановить дальнейшие закупки'],
              ] as const
            ).map(([code, label]) => (
              <button
                key={code}
                type="button"
                disabled={!canEdit}
                onClick={() => {
                  onUpdateConcept(concept.id, {
                    launchOutcome: code as RnDLaunchOutcome,
                  });
                  notify('success', `Итог запуска зафиксирован: «${label}»`);
                }}
                className={`p-3.5 rounded-xl border font-bold text-center cursor-pointer transition ${
                  concept.launchOutcome === code
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'bg-[#F7F7F5] text-[#171717] border-[#E8E8E5] hover:border-[#171717]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // ВКЛАДКА 8: ФАЙЛЫ, ЗАДАЧИ И КОММЕНТАРИИ (П. 14, 18 ТЗ)
  // ===========================================================================
  if (activeTab === 'files') {
    const attachments = concept.attachments || [];

    return (
      <div className="space-y-8 text-[15px]">
        {/* Категоризированные вложения (6 категорий по п. 18 ТЗ) */}
        <div className="rounded-2xl border border-[#E8E8E5] bg-white p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-[18px] font-bold text-[#171717]">
                18. Файлы и доказательства по этапам ({attachments.length})
              </h3>
              <p className="text-[12px] text-[#737373]">
                Удаление вложения, являющегося историческим доказательством уже принятого решения, заблокировано (п. 18 ТЗ)
              </p>
            </div>

            {canEdit && (
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={attachCategory}
                  onChange={(e) =>
                    setAttachCategory(e.target.value as RnDAttachmentCategory)
                  }
                  className="h-10 rounded-xl border border-[#E8E8E5] px-3 text-[13px] font-semibold bg-white"
                >
                  {Object.entries(ATTACHMENT_CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
                <label className="inline-flex items-center gap-2 h-10 rounded-xl bg-[#111111] text-white px-4 text-[13px] font-semibold cursor-pointer">
                  <Upload className="h-4 w-4" />
                  <span>Загрузить файлы</span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length === 0) return;
                      files.forEach((f) => {
                        const r = new FileReader();
                        r.onload = () => {
                          const dataUrl = typeof r.result === 'string' ? r.result : '';
                          const newAtt: RnDAttachmentItem = {
                            id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
                            title: f.name,
                            category: attachCategory,
                            stage: concept.stage,
                            fileType: f.name.split('.').pop()?.toUpperCase() || 'FILE',
                            fileSizeLabel: `${Math.max(1, Math.round(f.size / 1024))} КБ`,
                            url: dataUrl,
                            authorName: currentUser.fullName,
                            uploadedAt: new Date().toISOString().slice(0, 10),
                            isDecisionEvidence: concept.stage === 'DECISION' || concept.stage === 'PRODUCTION',
                          };
                          onUpdateConcept(concept.id, {
                            attachments: [newAtt, ...(concept.attachments || [])],
                          });
                        };
                        r.readAsDataURL(f);
                      });
                      notify('success', `Загружено файлов: ${files.length}`);
                    }}
                  />
                </label>
              </div>
            )}
          </div>

          {attachments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#E8E8E5] p-6 text-center text-[#737373] text-[14px]">
              Вложения пока не загружены. Выберите категорию и прикрепите референсы, фото образцов, скриншоты аналитики или лекала.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[13px]">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="rounded-xl border border-[#E8E8E5] bg-[#F7F7F5]/60 p-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold uppercase text-[#D97745]">
                      {ATTACHMENT_CATEGORY_LABELS[att.category]} · {CONCEPT_STAGE_LABELS_RU[att.stage]}
                    </div>
                    <div className="font-bold text-[#171717] truncate mt-0.5">
                      {att.title}
                    </div>
                    <div className="text-[11px] text-[#737373]">
                      {att.fileType} · {att.fileSizeLabel} · {att.authorName} ({att.uploadedAt})
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={att.url}
                      download={att.title}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#E8E8E5] font-semibold text-[#171717] hover:border-[#171717]"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Скачать</span>
                    </a>
                    {att.isDecisionEvidence && (
                      <span
                        title="Историческое доказательство управленческого решения — защищено от удаления (п. 18 ТЗ)"
                        className="px-2 py-1 rounded bg-[#16805D]/15 text-[#16805D] text-[10px] font-bold"
                      >
                        Защищено
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Связанные задачи разработки */}
        <div className="rounded-2xl border border-[#E8E8E5] bg-white p-6 space-y-4">
          <h4 className="text-[17px] font-bold text-[#171717]">
            Связанные задачи по разработке ({linkedTasks.length})
          </h4>
          <div className="space-y-2 text-[14px]">
            {linkedTasks.map((t) => (
              <div
                key={t.id}
                className="rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] p-3 flex items-center justify-between gap-2"
              >
                <div>
                  <span className="font-semibold text-[#171717]">{t.title}</span>
                  <span className="text-[12px] text-[#737373] ml-2">
                    Срок: {t.deadline}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded bg-white border border-[#E8E8E5] text-[12px] font-semibold">
                  {t.status}
                </span>
              </div>
            ))}
          </div>
          {canEdit && (
            <div className="flex flex-wrap gap-2 pt-2">
              <input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Поставить задачу по этой разработке (напр. Заказать образец ткани)..."
                className="flex-1 min-w-[240px] h-10 rounded-xl border border-[#E8E8E5] px-3 text-[14px]"
              />
              <input
                type="date"
                value={newTaskDeadline}
                onChange={(e) => setNewTaskDeadline(e.target.value)}
                className="h-10 rounded-xl border border-[#E8E8E5] px-3 text-[14px]"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newTaskTitle.trim()) return;
                  onCreateTaskForConcept(
                    `${concept.code}: ${newTaskTitle.trim()}`,
                    concept.ownerId || currentUser.id,
                    newTaskDeadline
                  );
                  setNewTaskTitle('');
                }}
                className="h-10 px-4 rounded-xl bg-[#111111] text-white text-[13px] font-semibold cursor-pointer"
              >
                + Создать задачу
              </button>
            </div>
          )}
        </div>

        {/* Обсуждение команды и @упоминания */}
        <div className="rounded-2xl border border-[#E8E8E5] bg-white p-6 space-y-4">
          <h4 className="text-[17px] font-bold text-[#171717]">
            Командное обсуждение ({concept.comments.length})
          </h4>
          <div className="space-y-3">
            {concept.comments.map((cm) => (
              <div
                key={cm.id}
                className="rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] p-4 space-y-1 text-[14px]"
              >
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-bold text-[#171717]">
                    {cm.authorName} ({ROLE_LABELS_RU[cm.authorRole]})
                  </span>
                  <span className="text-[#737373]">{cm.createdAt}</span>
                </div>
                <p className="text-[#171717]">{cm.text}</p>
              </div>
            ))}
          </div>
          {!isStrategyMode && (
            <div className="flex gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Написать комментарий или @упомянуть коллегу..."
                className="flex-1 h-11 rounded-xl border border-[#E8E8E5] px-4 text-[14px]"
              />
              <button
                type="button"
                onClick={() => {
                  if (!commentText.trim()) return;
                  onUpdateConcept(concept.id, {
                    comments: [
                      ...concept.comments,
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
                className="h-11 px-5 rounded-xl bg-[#111111] text-white text-[14px] font-semibold cursor-pointer"
              >
                Отправить
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===========================================================================
  // ВКЛАДКА 9: ИСТОРИЯ ИЗМЕНЕНИЙ И АУДИТ (П. 5.2, 15, КРИТЕРИЙ 09 ТЗ)
  // ===========================================================================
  const history = concept.stageHistory || [];
  return (
    <div className="space-y-6 text-[15px]">
      <div className="rounded-2xl border border-[#E8E8E5] bg-[#F7F7F5] p-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-[18px] font-bold text-[#171717]">
            Неизменяемый журнал истории карточки ({history.length} записей)
          </h3>
          <p className="text-[13px] text-[#737373]">
            ВАЖНО (п. 5.2 и Критерий 09 ТЗ): Историю утверждений, возвратов на доработку и ключевых переходов нельзя переписывать задним числом. У каждого события зафиксированы автор, время и причина.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {history.map((entry) => (
          <div
            key={entry.id}
            className="rounded-xl border border-[#E8E8E5] bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[14px]"
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-[#111111] text-white text-[11px] font-bold uppercase">
                  {entry.actionType === 'created'
                    ? 'Создание'
                    : entry.actionType === 'decision'
                    ? 'Решение руководителя'
                    : entry.actionType === 'rollback'
                    ? 'Возврат на доработку'
                    : entry.actionType === 'sample_added'
                    ? 'Образец'
                    : entry.actionType === 'test_completed'
                    ? 'Протокол теста'
                    : entry.actionType === 'production_order'
                    ? 'Заказ фабрике'
                    : entry.actionType === 'exception_override'
                    ? 'Исключение руководителя'
                    : 'Смена этапа'}
                </span>
                {entry.fromStage && entry.toStage && entry.fromStage !== entry.toStage && (
                  <span className="text-[12px] font-semibold text-[#D97745]">
                    {CONCEPT_STAGE_LABELS_RU[entry.fromStage as ConceptStage] || entry.fromStage} →{' '}
                    {CONCEPT_STAGE_LABELS_RU[entry.toStage as ConceptStage] || entry.toStage}
                  </span>
                )}
              </div>
              <div className="font-medium text-[#171717]">{entry.reason}</div>
            </div>
            <div className="text-right text-[12px] text-[#737373] shrink-0">
              <div className="font-bold text-[#171717]">{entry.authorName}</div>
              <div>
                {ROLE_LABELS_RU[entry.authorRole]} · {entry.timestamp}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
