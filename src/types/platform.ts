// =============================================================================
// BORNERS GROUP — STRATEGY & PRODUCT DEVELOPMENT PLATFORM
// Типы данных платформы (п. 14, 15, 17, 18 ТЗ)
// =============================================================================

export type UserRole = 'Owner' | 'Admin' | 'Manager' | 'Viewer' | 'Partner';

export type BrandFilter = 'ALL' | string; // 'ALL' или id/code бренда ('BORNERS', 'NA_TELE', ...)

export type PlatformMode = 'management' | 'strategy';

export type NavSectionId =
  | 'dashboard'
  | 'brand-portfolio'
  | 'brand-strategy'
  | 'market-intelligence'
  | 'product-catalog'
  | 'product-lab'
  | 'marketing-growth'
  | 'launch-calendar'
  | 'finance'
  | 'roadmap-tasks'
  | 'documents'
  | 'team'
  | 'settings';

export type PeriodFilter = '2026' | '2027' | 'Q1 2027' | 'Q2 2027' | 'ALL';

export type ApprovalStatus = 'draft' | 'in_review' | 'approved';

export type ConceptStage =
  | 'IDEA'
  | 'RESEARCH'
  | 'DESIGN'
  | 'PROTOTYPE'
  | 'TESTING'
  | 'APPROVED'
  | 'PRODUCTION'
  | 'READY TO LAUNCH'
  | 'ON HOLD'
  | 'REJECTED'
  | 'CANCELLED';

export type ProductStatus =
  | 'in_development'
  | 'sampled'
  | 'approved'
  | 'in_production'
  | 'active'
  | 'out_of_stock'
  | 'archived';

export type TaskStatus = 'To Do' | 'In Progress' | 'Review' | 'Done' | 'Blocked';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type FinancialScenario = 'Conservative' | 'Base' | 'Optimistic';
export type ExperimentStatus = 'Planned' | 'Running' | 'Completed' | 'Successful' | 'Unsuccessful';

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  jobTitle: string;
  role: UserRole;
  canViewFinance: boolean;
  canViewCostPrice: boolean;
  assignedBrandIds: string[]; // пустой массив или все id для Owner/Admin
  avatarInitials: string;
  isActive: boolean;
}

export interface Brand {
  id: string;
  code: string; // 'BORNERS' | 'NA_TELE' | 'AKUSHA' | 'LISKANI' | новые бренды
  name: string;
  tagline: string;
  segment: string;
  description: string;
  accentColor: string;
  secondaryColor: string;
  heroImage: string;
  targetMarginPct: number;
  activeModelsCount: number;
  upcomingLaunchesCount: number;
  plannedRevenue2027Rub: number;
  actualRevenueYtdRub: number;
  isStrategyInDevelopment?: boolean;
  statusNote?: string;
  isDemo: boolean;
  isArchived?: boolean;
  updatedAt: string;
}

export interface StrategyVersionEntry {
  version: number;
  authorName: string;
  updatedAt: string;
  status: ApprovalStatus;
  comment: string;
}

export interface StrategyBlock {
  id: string;
  brandId: string;
  sectionKey: string;
  sectionOrder: number;
  titleEn: string;
  titleRu: string;
  summary: string;
  content: string;
  draftContent?: string;
  kpiHighlights: { label: string; value: string }[];
  status: ApprovalStatus;
  version: number;
  authorName: string;
  updatedAt: string;
  history: StrategyVersionEntry[];
  isDemo: boolean;
}

export interface ProductVariant {
  id: string;
  productId: string;
  variantSku: string;
  colorName: string;
  colorHex: string;
  secondaryColorHex?: string;
  size: 'S' | 'M' | 'L' | 'XL' | 'XXL';
  packConfiguration: string;
  stockQty: number;
}

export interface ProductEconomics {
  currency: 'RUB' | 'USD' | 'CNY';
  plannedRetailPrice: number;
  actualRetailPrice: number;
  discountPct: number;
  vatPct: number;
  returnRatePct: number;
  unitCostPrice: number; // себестоимость (ограничено правом canViewCostPrice)
  marketplaceCommissionRub: number;
  logisticsRub: number;
  advertisingRub: number;
  otherVariableRub: number;
}

export interface ProductAsset {
  id: string;
  title: string;
  assetType: 'photo' | 'render' | 'tech_pack' | 'certificate';
  url: string;
  uploadedAt: string;
}

export interface Product {
  id: string; // UUID
  sku: string;
  name: string;
  brandId: string;
  conceptId?: string;
  category: 'Боксеры' | 'Транки' | 'Брифы' | 'Мультипак' | 'Лимитированная капсула';
  productType: 'Базовая коллекция' | 'Лимитированная коллекция' | 'Капсула оттенков кожи' | 'Мультипак';
  collection: string;
  priceSegment: 'Mass-Market+' | 'Middle+' | 'Premium';
  status: ProductStatus;
  description: string;
  ownerId: string;
  // Дизайн
  imageUrl: string;
  galleryUrls: string[];
  colorCombinations: string[];
  materials: string;
  fabricComposition: string;
  fabricDensityGsm: number;
  waistbandType: string;
  fitType: string;
  constructionDetails: string;
  sizes: ('S' | 'M' | 'L' | 'XL' | 'XXL')[];
  // Производство
  supplierName: string;
  supplierCountry: string;
  moq: number;
  productionLeadDays: number;
  deliveryLeadDays: number;
  techFiles: ProductAsset[];
  // Экономика
  economics: ProductEconomics;
  // Продажи
  unitsSold: number;
  revenueRub: number;
  operatingProfitRub: number;
  monthlyDynamicsPct: number;
  salesChannels: string[];
  // Варианты
  variants: ProductVariant[];
  isDemo: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TechPackTranslation {
  modelName: string;
  construction: string;
  material: string;
  compositionAndDensity: string;
  colorAndPantone: string;
  sizeGrading: string;
  waistbandSpec: string;
  seamsSpec: string;
  packagingSpec: string;
  qualityRequirements: string;
  referencesNote: string;
}

export interface DesignVersion {
  version: number;
  title: string;
  imageUrl: string;
  authorName: string;
  createdAt: string;
  status: ApprovalStatus;
  notes: string;
}

export interface ConceptComment {
  id: string;
  authorName: string;
  authorRole: UserRole;
  text: string;
  createdAt: string;
}

export interface ProductConcept {
  id: string;
  code: string;
  name: string;
  brandId: string;
  collectionName: string;
  stage: ConceptStage;
  ideaDescription: string;
  customerProblem: string;
  targetAudience: string;
  keyDifferentiators: string;
  referencesNotes: string;
  imageUrl: string;
  colorCombinations: string[];
  plannedRetailPrice: number;
  plannedUnitCost: number;
  currency: 'RUB' | 'USD' | 'CNY';
  targetLaunchDate: string;
  ownerId: string;
  supplierName: string;
  sampleStatus: string;
  testResults: string;
  developmentBudgetRub: number;
  selectedDesignVersion: number;
  designVersions: DesignVersion[];
  comments: ConceptComment[];
  // ТЗ для фабрики на 3 языках: 中文 / ENGLISH / РУССКИЙ (китайский первым, п. 7 ТЗ)
  techPack: {
    zh: TechPackTranslation;
    en: TechPackTranslation;
    ru: TechPackTranslation;
  };
  linkedProductId?: string;
  linkedLaunchId?: string;
  isDemo: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type LaunchStageCode =
  | 'concept'
  | 'design'
  | 'sample'
  | 'testing'
  | 'production'
  | 'logistics'
  | 'cards'
  | 'marketing'
  | 'sales'
  | 'analysis';

export interface LaunchStage {
  code: LaunchStageCode;
  label: string;
  deadline: string;
  ownerId: string;
  status: 'Done' | 'In Progress' | 'Pending' | 'Delayed';
}

export interface Launch {
  id: string;
  name: string;
  brandId: string;
  collectionName: string;
  productIds: string[];
  conceptId?: string;
  startDate: string; // YYYY-MM-DD
  readinessPct: number;
  productionStatus: string;
  marketingBudgetRub: number;
  salesPlanUnits: number;
  salesPlanRub: number;
  ownerId: string;
  status: 'Подготовка' | 'В работе' | 'Согласование' | 'Готов к старту' | 'Запущен' | 'Завершён';
  imageUrl: string;
  stages: LaunchStage[];
  isDemo: boolean;
  isArchived: boolean;
  updatedAt: string;
}

export type MarketingChannel =
  | 'Wildberries'
  | 'Ozon'
  | 'Яндекс Маркет'
  | 'Собственный магазин'
  | 'Instagram/Reels'
  | 'Telegram'
  | 'Блогеры'
  | 'Прочие';

export interface CampaignMetrics {
  impressions?: number | null;
  reach?: number | null;
  clicks?: number | null;
  ctrPct?: number | null;
  cpcRub?: number | null;
  cpmRub?: number | null;
  orders?: number | null;
  buyouts?: number | null;
  revenueRub?: number | null;
  spendRub?: number | null;
  drrPct?: number | null;
  roas?: number | null;
  cacRub?: number | null;
  repeatPurchasePct?: number | null;
}

export interface Campaign {
  id: string;
  name: string;
  brandId: string;
  channel: MarketingChannel;
  goal: string;
  productIds: string[];
  launchId?: string;
  periodLabel: string;
  plannedBudgetRub: number;
  actualBudgetRub: number | null;
  plannedRevenueRub: number;
  actualRevenueRub: number | null;
  ownerId: string;
  status: 'Запланирована' | 'Активна' | 'Завершена' | 'На паузе';
  metrics: CampaignMetrics;
  isDemo: boolean;
  isArchived: boolean;
}

export interface GrowthExperiment {
  id: string;
  brandId: string;
  hypothesis: string;
  rationale: string;
  budgetRub: number;
  method: string;
  successCriteria: string;
  timeframe: string;
  resultSummary: string;
  decision: string;
  status: ExperimentStatus;
  ownerId: string;
  isDemo: boolean;
}

export interface FinancialPlanRow {
  id: string;
  brandId: string;
  scenario: FinancialScenario;
  periodMonth: string; // '2026-09', '2026-10', '2026-11', '2026-12', '2027-01', '2027-02', '2027-03'
  periodLabel: string;
  currency: 'RUB';
  plannedBuyoutUnits: number;
  actualBuyoutUnits: number | null; // null = «Нет данных» (не путать с 0, п. 4 ТЗ)
  avgSellingPriceRub: number;
  plannedRevenueRub: number;
  actualRevenueRub: number | null; // null = «Нет данных»
  plannedOperatingProfitRub: number;
  actualOperatingProfitRub: number | null; // null = «Нет данных»
  fixedCostsRub: number;
  marketingBudgetRub: number;
  launchInvestmentRub: number;
  sourceLabel: string;
  updatedAt: string;
  updatedBy: string;
  isDemo: boolean;
}

export interface StrategicGoal {
  id: string;
  brandId: string | 'ALL';
  title: string;
  description: string;
  periodYear: number;
  periodQuarter: string;
  targetMetric: string;
  progressPct: number;
  status: 'В графике' | 'Внимание' | 'Под угрозой' | 'Выполнено';
  ownerId: string;
  isDemo: boolean;
}

export interface Project {
  id: string;
  brandId: string;
  strategicGoalId: string;
  conceptId?: string;
  launchId?: string;
  name: string;
  description: string;
  quarter: string;
  month: string;
  startDate: string;
  endDate: string;
  status: 'Планирование' | 'В работе' | 'На ревью' | 'Завершён';
  ownerId: string;
  isDemo: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  brandId: string;
  projectId: string;
  productId?: string;
  conceptId?: string;
  launchId?: string;
  assigneeId: string;
  priority: TaskPriority;
  deadline: string; // YYYY-MM-DD
  status: TaskStatus;
  comments: { id: string; authorName: string; text: string; createdAt: string }[];
  attachments: string[];
  isDemo: boolean;
  isArchived: boolean;
}

export interface Competitor {
  id: string;
  brandName: string;
  websiteUrl: string;
  marketplaces: string[];
  positioning: string;
  priceRangeRub: string;
  keyProducts: string;
  strengths: string;
  weaknesses: string;
  photoUrl: string;
  sources: string;
  researchedAt: string;
  isDemo: boolean;
}

export interface MarketOpportunity {
  id: string;
  brandId: string;
  title: string;
  audience: string;
  competitionLevel: 'Низкая' | 'Средняя' | 'Высокая';
  potentialDemand: string;
  economicsNote: string;
  complexity: 'Низкая' | 'Средняя' | 'Высокая';
  priority: TaskPriority;
  linkedConceptIds: string[];
  isDemo: boolean;
}

export interface ResearchItem {
  id: string;
  brandId: string | 'ALL';
  title: string;
  category: 'Тренды рынка' | 'Потребительские инсайты' | 'Материалы и фабрики' | 'Аналитика маркетплейсов';
  conclusions: string;
  sourceLinks: string[];
  researchDate: string;
  isDemo: boolean;
}

export type DocumentCategory =
  | 'производство'
  | 'поставщики'
  | 'каталоги'
  | 'дизайн'
  | 'аналитика'
  | 'маркетинг'
  | 'финансы'
  | 'стратегия'
  | 'прочее';

export interface DocumentItem {
  id: string;
  title: string;
  category: DocumentCategory;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  dataUrl?: string; // для загруженных пользователем файлов
  brandId: string | 'ALL';
  productId?: string;
  projectId?: string;
  conceptId?: string;
  launchId?: string;
  tags: string[];
  isFinancialRestricted: boolean;
  minRole: UserRole;
  uploadedBy: string;
  uploadedAt: string;
  isDemo: boolean;
  isArchived: boolean;
}

export interface AuditLogEntry {
  id: string;
  actorName: string;
  actorRole: UserRole;
  entityType: 'concept' | 'product' | 'launch' | 'strategy' | 'finance' | 'task' | 'document' | 'user' | 'brand';
  entityId: string;
  action: string;
  summary: string;
  createdAt: string;
}
