'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import {
  AppUser,
  AuditLogEntry,
  Brand,
  BrandFilter,
  Campaign,
  Competitor,
  ConceptStage,
  DocumentItem,
  FinancialPlanRow,
  FinancialScenario,
  GrowthExperiment,
  Launch,
  MarketOpportunity,
  NavSectionId,
  PeriodFilter,
  PlatformMode,
  Product,
  ProductConcept,
  Project,
  ResearchItem,
  StrategicGoal,
  StrategyBlock,
  TaskItem,
  TaskStatus,
} from '@/types/platform';
import {
  INITIAL_AUDIT_LOG,
  INITIAL_BRANDS,
  INITIAL_CAMPAIGNS,
  INITIAL_COMPETITORS,
  INITIAL_CONCEPTS,
  INITIAL_DOCUMENTS,
  INITIAL_EXPERIMENTS,
  INITIAL_FINANCIAL_PLANS,
  INITIAL_LAUNCHES,
  INITIAL_OPPORTUNITIES,
  INITIAL_PRODUCTS,
  INITIAL_PROJECTS,
  INITIAL_RESEARCH,
  INITIAL_STRATEGIC_GOALS,
  INITIAL_TASKS,
  INITIAL_USERS,
} from '@/lib/initial-data';
import { INITIAL_STRATEGIES } from '@/lib/initial-strategies';
import {
  CONCEPT_STAGE_LABELS_RU,
  ROLE_LABELS_RU,
  TASK_STATUS_LABELS_RU,
  shiftDateString,
} from '@/lib/finance';

const STORAGE_KEY = 'borners_group_platform_state_ru_v9_editorial';
const AUTH_STORAGE_KEY = 'borners_group_auth_session_ru_v4';

interface PersistedState {
  users: AppUser[];
  brands: Brand[];
  strategies: StrategyBlock[];
  concepts: ProductConcept[];
  products: Product[];
  launches: Launch[];
  financialPlans: FinancialPlanRow[];
  campaigns: Campaign[];
  experiments: GrowthExperiment[];
  competitors: Competitor[];
  opportunities: MarketOpportunity[];
  research: ResearchItem[];
  strategicGoals: StrategicGoal[];
  projects: Project[];
  tasks: TaskItem[];
  documents: DocumentItem[];
  auditLog: AuditLogEntry[];
}

interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error';
  title: string;
  description?: string;
}

interface PlatformContextValue extends PersistedState {
  // Авторизация и пользователь
  isAuthenticated: boolean;
  currentUser: AppUser;
  loginAs: (userId: string) => void;
  logout: () => void;
  updateUserRoleOrPermissions: (userId: string, patch: Partial<AppUser>) => void;

  // Глобальные переключатели и навигация
  activeSection: NavSectionId;
  navHistory: NavSectionId[];
  navigateTo: (
    section: NavSectionId,
    opts?: {
      productId?: string;
      conceptId?: string;
      launchId?: string;
      brandId?: BrandFilter;
    }
  ) => void;
  goBack: () => void;
  brandFilter: BrandFilter;
  setBrandFilter: (brand: BrandFilter) => void;
  periodFilter: PeriodFilter;
  setPeriodFilter: (period: PeriodFilter) => void;
  platformMode: PlatformMode;
  setPlatformMode: (mode: PlatformMode) => void;
  simpleMode: boolean;
  setSimpleMode: (simple: boolean) => void;
  financialScenario: FinancialScenario;
  setFinancialScenario: (scenario: FinancialScenario) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;

  // Выбранные связанные объекты (единая синхронизация во всех разделах, п. 18, 25 ТЗ)
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;
  selectedConceptId: string | null;
  setSelectedConceptId: (id: string | null) => void;
  selectedLaunchId: string | null;
  setSelectedLaunchId: (id: string | null) => void;

  // Уведомления и ошибки сохранения
  toasts: ToastMessage[];
  notify: (type: ToastMessage['type'], title: string, description?: string) => void;
  dismissToast: (id: string) => void;

  // Мутации данных
  createConcept: (input: Partial<ProductConcept> & { name: string; brandId: string }) => ProductConcept;
  updateConcept: (id: string, patch: Partial<ProductConcept>) => void;
  updateConceptStage: (id: string, stage: ConceptStage, reason?: string) => void;
  deleteConcept: (id: string) => void;
  createProductFromConcept: (conceptId: string) => Product | null;
  createProduct: (input: Partial<Product> & { name: string; sku: string; brandId: string }) => Product;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  archiveEntity: (type: 'product' | 'concept' | 'launch' | 'task' | 'document', id: string) => void;
  createLaunch: (input: {
    name: string;
    brandId: string;
    collectionName: string;
    productId?: string;
    conceptId?: string;
    startDate: string;
    marketingBudgetRub: number;
    salesPlanUnits: number;
    salesPlanRub: number;
    ownerId: string;
  }) => Launch;
  updateLaunch: (id: string, patch: Partial<Launch>) => void;
  rescheduleLaunch: (launchId: string, newStartDate: string, shiftDependentDates: boolean) => void;
  createTask: (input: {
    title: string;
    description?: string;
    brandId: string;
    projectId?: string;
    productId?: string;
    conceptId?: string;
    launchId?: string;
    assigneeId: string;
    priority: TaskItem['priority'];
    deadline: string;
  }) => TaskItem;
  updateTask: (id: string, patch: Partial<TaskItem>) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  updateStrategyBlock: (id: string, patch: Partial<StrategyBlock>, comment?: string) => void;
  updateFinancialPlanRow: (id: string, patch: Partial<FinancialPlanRow>) => void;
  addFinancialPlanRow: (row: Omit<FinancialPlanRow, 'id' | 'updatedAt' | 'updatedBy'>) => void;
  createCampaign: (input: Omit<Campaign, 'id' | 'isDemo' | 'isArchived'>) => void;
  updateCampaign: (id: string, patch: Partial<Campaign>) => void;
  createExperiment: (input: Omit<GrowthExperiment, 'id' | 'isDemo'>) => void;
  updateExperiment: (id: string, patch: Partial<GrowthExperiment>) => void;
  createCompetitor: (input: Omit<Competitor, 'id' | 'isDemo'>) => void;
  createResearch: (input: Omit<ResearchItem, 'id' | 'isDemo'>) => void;
  createDocument: (input: Omit<DocumentItem, 'id' | 'uploadedAt' | 'uploadedBy' | 'isArchived'>) => void;
  updateBrandPalette: (brandId: string, accentColor: string, secondaryColor: string) => void;
  createBrand: (input: { code: string; name: string; tagline: string; segment: string; accentColor: string }) => void;
  resetToDemoDefaults: () => void;
}

const DEFAULT_STATE: PersistedState = {
  users: INITIAL_USERS,
  brands: INITIAL_BRANDS,
  strategies: INITIAL_STRATEGIES,
  concepts: INITIAL_CONCEPTS,
  products: INITIAL_PRODUCTS,
  launches: INITIAL_LAUNCHES,
  financialPlans: INITIAL_FINANCIAL_PLANS,
  campaigns: INITIAL_CAMPAIGNS,
  experiments: INITIAL_EXPERIMENTS,
  competitors: INITIAL_COMPETITORS,
  opportunities: INITIAL_OPPORTUNITIES,
  research: INITIAL_RESEARCH,
  strategicGoals: INITIAL_STRATEGIC_GOALS,
  projects: INITIAL_PROJECTS,
  tasks: INITIAL_TASKS,
  documents: INITIAL_DOCUMENTS,
  auditLog: INITIAL_AUDIT_LOG,
};

const PlatformContext = createContext<PlatformContextValue | null>(null);

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [currentUserId, setCurrentUserId] = useState<string>('user-owner');

  const [activeSection, setActiveSection] = useState<NavSectionId>('product-lab');
  const [navHistory, setNavHistory] = useState<NavSectionId[]>(['product-lab']);
  const [brandFilter, setBrandFilter] = useState<BrandFilter>('ALL');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('2027');
  const [platformMode, setPlatformMode] = useState<PlatformMode>('management');
  const [simpleMode, setSimpleMode] = useState<boolean>(true);
  const [financialScenario, setFinancialScenario] = useState<FinancialScenario>('Base');
  const [darkMode, setDarkMode] = useState<boolean>(false);

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [selectedLaunchId, setSelectedLaunchId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Восстановление состояния из localStorage без потери данных при перезагрузке и выходе/входе
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const normalized = saved.replaceAll('"/images/products/', '"images/products/');
        const parsed = JSON.parse(normalized) as Partial<PersistedState>;
        setState((prev) => ({
          ...prev,
          ...parsed,
        }));
      }
      const savedAuth = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (savedAuth) {
        const parsedAuth = JSON.parse(savedAuth) as {
          isAuthenticated: boolean;
          currentUserId: string;
        };
        setIsAuthenticated(parsedAuth.isAuthenticated);
        if (parsedAuth.currentUserId) setCurrentUserId(parsedAuth.currentUserId);
      }
      setDarkMode(false);
    } catch (err) {
      console.error('Failed to hydrate state from localStorage:', err);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error('Failed to persist state:', err);
    }
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ isAuthenticated, currentUserId, darkMode })
      );
    } catch (err) {
      console.error('Failed to persist auth session:', err);
    }
  }, [isAuthenticated, currentUserId, darkMode, hydrated]);

  const notify = useCallback(
    (type: ToastMessage['type'], title: string, description?: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, type, title, description }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const currentUser = useMemo(() => {
    return state.users.find((u) => u.id === currentUserId) || state.users[0];
  }, [state.users, currentUserId]);

  const appendAudit = useCallback(
    (
      entityType: AuditLogEntry['entityType'],
      entityId: string,
      action: string,
      summary: string
    ): AuditLogEntry => ({
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      entityType,
      entityId,
      action,
      summary,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    }),
    [currentUser]
  );

  const loginAs = useCallback(
    (userId: string) => {
      const targetUser = state.users.find((u) => u.id === userId);
      if (!targetUser) return;
      setCurrentUserId(targetUser.id);
      setIsAuthenticated(true);
      notify(
        'success',
        `Вы вошли как ${targetUser.fullName}`,
        `Роль: ${ROLE_LABELS_RU[targetUser.role]}`
      );
    },
    [state.users, notify]
  );

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    notify('warning', 'Сессия завершена', 'Все данные сохранены в хранилище. Войдите снова для продолжения работы.');
  }, [notify]);

  const updateUserRoleOrPermissions = useCallback(
    (userId: string, patch: Partial<AppUser>) => {
      setState((prev) => ({
        ...prev,
        users: prev.users.map((u) => (u.id === userId ? { ...u, ...patch } : u)),
        auditLog: [
          appendAudit('user', userId, 'updated', `Обновлены права пользователя (${Object.keys(patch).join(', ')})`),
          ...prev.auditLog,
        ],
      }));
      notify('success', 'Права пользователя обновлены');
    },
    [appendAudit, notify]
  );

  const navigateTo = useCallback(
    (
      section: NavSectionId,
      opts?: {
        productId?: string;
        conceptId?: string;
        launchId?: string;
        brandId?: BrandFilter;
      }
    ) => {
      setPlatformMode('management');
      setActiveSection(section);
      setNavHistory((prev) => [...prev.slice(-15), section]);
      if (opts?.brandId !== undefined) setBrandFilter(opts.brandId);
      if (opts?.productId !== undefined) setSelectedProductId(opts.productId);
      if (opts?.conceptId !== undefined) setSelectedConceptId(opts.conceptId);
      if (opts?.launchId !== undefined) setSelectedLaunchId(opts.launchId);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    []
  );

  const goBack = useCallback(() => {
    setPlatformMode('management');
    setNavHistory((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.slice(0, -1);
      setActiveSection(next[next.length - 1]);
      return next;
    });
  }, []);

  // 1. Создание концепции в Product Lab (п. 4, 6, 21 ТЗ Product Lab R&D)
  const createConcept = useCallback(
    (input: Partial<ProductConcept> & { name: string; brandId: string }): ProductConcept => {
      const id = `concept-${Date.now()}`;
      const nextNum = state.concepts.length + 21;
      const code = input.code || `RD-0${nextNum}`;
      const now = new Date().toISOString().slice(0, 10);
      const nowTime = new Date().toISOString().slice(0, 16).replace('T', ' ');
      const defaultImage =
        input.imageUrl ||
        (input.brandId === 'NA_TELE'
          ? 'images/products/natele-skin-tone.svg'
          : 'images/products/borners-core-modal.svg');

      const newConcept: ProductConcept = {
        id,
        code,
        name: input.name,
        brandId: input.brandId,
        collectionName: input.collectionName || 'Разработка R&D',
        stage: input.stage || 'IDEA',
        developmentType: input.developmentType || 'new_construction',
        priority: input.priority || 'Medium',
        tags: input.tags || [],
        nextStep: input.nextStep || 'Назначить ответственного и сформулировать суть идеи для анализа',
        isBlocked: Boolean(input.isBlocked),
        blockReason: input.blockReason || '',
        whatAttracted: input.whatAttracted || input.ideaDescription || '',
        similarInAssortment: input.similarInAssortment || '',
        expectedOutcome: input.expectedOutcome || '',
        referenceLinks: input.referenceLinks || [],
        ideaDescription: input.ideaDescription || '',
        customerProblem: input.customerProblem || '',
        targetAudience: input.targetAudience || '',
        keyDifferentiators: input.keyDifferentiators || '',
        referencesNotes: input.referencesNotes || '',
        imageUrl: defaultImage,
        colorCombinations: input.colorCombinations?.length ? input.colorCombinations : [],
        // На этапе Идеи запрещено подставлять вымышленные коммерческие показатели (п. 4.1, 6, 21 ТЗ)
        plannedRetailPrice: Number(input.plannedRetailPrice ?? 0),
        plannedUnitCost: Number(input.plannedUnitCost ?? 0),
        currency: 'RUB',
        targetLaunchDate: input.targetLaunchDate || '',
        ownerId: input.ownerId || currentUser.id,
        authorId: currentUser.id,
        supplierName: input.supplierName || '',
        sampleStatus: input.sampleStatus || 'Нет данных (этап Идеи)',
        testResults: input.testResults || 'Нет данных',
        developmentBudgetRub: Number(input.developmentBudgetRub ?? 0),
        selectedDesignVersion: 1,
        designVersions: [
          {
            version: 1,
            title: 'Первичный референс v1',
            imageUrl: defaultImage,
            authorName: currentUser.fullName,
            createdAt: now,
            status: 'draft',
            notes: input.ideaDescription || 'Сохранённая идея',
          },
        ],
        samples: input.samples || [],
        testProtocols: input.testProtocols || [],
        approvalDecisions: input.approvalDecisions || [],
        productionOrders: input.productionOrders || [],
        attachments: input.attachments || [],
        stageHistory: [
          {
            id: `sh-${Date.now()}`,
            timestamp: nowTime,
            authorName: currentUser.fullName,
            authorRole: currentUser.role,
            actionType: 'created',
            toStage: input.stage || 'IDEA',
            reason: 'Быстрое создание продуктовой идеи в Лаборатории R&D',
          },
        ],
        comments: [],
        techPack: input.techPack || {
          zh: {
            modelName: `${input.name} (${code})`,
            construction: input.keyDifferentiators || '待定 (Определяется)',
            material: '待定 (Определяется)',
            compositionAndDensity: '待定',
            colorAndPantone: (input.colorCombinations || []).join(' / ') || '待定',
            sizeGrading: 'S, M, L, XL, XXL',
            waistbandSpec: '待定',
            seamsSpec: '待定',
            packagingSpec: '待定',
            qualityRequirements: 'AQL 1.5',
            referencesNote: input.referencesNotes || '',
          },
          en: {
            modelName: `${input.name} (${code})`,
            construction: input.keyDifferentiators || 'TBD',
            material: 'TBD',
            compositionAndDensity: 'TBD',
            colorAndPantone: (input.colorCombinations || []).join(' / ') || 'TBD',
            sizeGrading: 'S, M, L, XL, XXL',
            waistbandSpec: 'TBD',
            seamsSpec: 'TBD',
            packagingSpec: 'TBD',
            qualityRequirements: 'AQL 1.5',
            referencesNote: input.referencesNotes || '',
          },
          ru: {
            modelName: `${input.name} (${code})`,
            construction: input.keyDifferentiators || 'Уточняется после анализа',
            material: 'Уточняется на этапе образца',
            compositionAndDensity: 'Нет данных',
            colorAndPantone: (input.colorCombinations || []).join(' / ') || 'Нет данных',
            sizeGrading: 'S, M, L, XL, XXL',
            waistbandSpec: 'Уточняется',
            seamsSpec: 'Плоские швы',
            packagingSpec: 'Уточняется',
            qualityRequirements: 'AQL 1.5',
            referencesNote: input.referencesNotes || '',
          },
        },
        isDemo: false,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      };

      setState((prev) => ({
        ...prev,
        concepts: [newConcept, ...prev.concepts],
        auditLog: [
          appendAudit('concept', id, 'created', `Создана разработка «${newConcept.code} · ${newConcept.name}» в Product Lab R&D`),
          ...prev.auditLog,
        ],
      }));
      setSelectedConceptId(id);
      notify('success', 'Идея сохранена в Лаборатории R&D', `${newConcept.code} · ${newConcept.name}`);
      return newConcept;
    },
    [appendAudit, currentUser, notify, state.concepts.length]
  );

  const updateConcept = useCallback(
    (id: string, patch: Partial<ProductConcept>) => {
      const now = new Date().toISOString().slice(0, 10);
      setState((prev) => {
        const target = prev.concepts.find((c) => c.id === id);
        if (!target) return prev;
        const updatedConcept = { ...target, ...patch, updatedAt: now };

        // Синхронизация со связанным Product, если он уже создан (п. 13 ТЗ: один объект синхронен во всех разделах!)
        const updatedProducts = prev.products.map((p) => {
          if (p.conceptId === id || p.id === updatedConcept.linkedProductId) {
            return {
              ...p,
              name: patch.name ?? p.name,
              imageUrl: patch.imageUrl ?? p.imageUrl,
              colorCombinations: patch.colorCombinations ?? p.colorCombinations,
              economics: {
                ...p.economics,
                plannedRetailPrice: patch.plannedRetailPrice ?? p.economics.plannedRetailPrice,
                unitCostPrice: patch.plannedUnitCost ?? p.economics.unitCostPrice,
              },
              updatedAt: now,
            };
          }
          return p;
        });

        return {
          ...prev,
          concepts: prev.concepts.map((c) => (c.id === id ? updatedConcept : c)),
          products: updatedProducts,
          auditLog: [
            appendAudit('concept', id, 'updated', `Обновлена разработка «${updatedConcept.code} · ${updatedConcept.name}»`),
            ...prev.auditLog,
          ],
        };
      });
    },
    [appendAudit]
  );

  const deleteConcept = useCallback(
    (id: string) => {
      const target = state.concepts.find((c) => c.id === id);
      setState((prev) => ({
        ...prev,
        concepts: prev.concepts.filter((c) => c.id !== id),
        auditLog: [
          appendAudit('concept', id, 'deleted', `Удалена карточка «${target?.code || id} · ${target?.name || ''}»`),
          ...prev.auditLog,
        ],
      }));
      if (selectedConceptId === id) {
        setSelectedConceptId(null);
      }
      notify('warning', `Карточка «${target?.name || id}» удалена`);
    },
    [appendAudit, notify, selectedConceptId, state.concepts]
  );

  const updateConceptStage = useCallback(
    (id: string, stage: ConceptStage, reason?: string) => {
      const nowTime = new Date().toISOString().slice(0, 16).replace('T', ' ');
      const target = state.concepts.find((c) => c.id === id);
      const historyEntry = {
        id: `sh-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        timestamp: nowTime,
        authorName: currentUser.fullName,
        authorRole: currentUser.role,
        actionType: 'stage_change' as const,
        fromStage: target?.stage,
        toStage: stage,
        reason: reason || `Переход на этап «${CONCEPT_STAGE_LABELS_RU[stage]}»`,
      };
      updateConcept(id, {
        stage,
        stageHistory: [historyEntry, ...(target?.stageHistory || [])],
      });
      notify('success', `Этап изменён на «${CONCEPT_STAGE_LABELS_RU[stage]}»`);
    },
    [currentUser.fullName, currentUser.role, notify, state.concepts, updateConcept]
  );

  // 2. Создание Product в каталоге напрямую из Concept (п. 18, 25 ТЗ: без дублирования независимых копий!)
  const createProductFromConcept = useCallback(
    (conceptId: string): Product | null => {
      const concept = state.concepts.find((c) => c.id === conceptId);
      if (!concept) return null;

      if (concept.linkedProductId) {
        const existing = state.products.find((p) => p.id === concept.linkedProductId);
        if (existing) {
          setSelectedProductId(existing.id);
          notify('warning', 'Продукт уже связан с концепцией', `Открыта карточка ${existing.sku}`);
          return existing;
        }
      }

      const now = new Date().toISOString().slice(0, 10);
      const productId = `prod-${Date.now()}`;
      const sku = concept.code.replace('-LAB-', '-PRD-');

      const newProduct: Product = {
        id: productId,
        sku,
        name: concept.name,
        brandId: concept.brandId,
        conceptId: concept.id,
        category: 'Боксеры',
        productType: 'Лимитированная коллекция',
        collection: concept.collectionName,
        priceSegment: concept.brandId === 'NA_TELE' ? 'Premium' : 'Middle+',
        status: concept.stage === 'APPROVED' || concept.stage === 'PRODUCTION' ? 'approved' : 'in_development',
        description: concept.ideaDescription,
        ownerId: concept.ownerId,
        imageUrl: concept.imageUrl,
        galleryUrls: [concept.imageUrl],
        colorCombinations: concept.colorCombinations,
        materials: concept.techPack.ru.material,
        fabricComposition: concept.techPack.ru.compositionAndDensity,
        fabricDensityGsm: 180,
        waistbandType: concept.techPack.ru.waistbandSpec,
        fitType: 'Анатомическая 3D-посадка',
        constructionDetails: concept.techPack.ru.construction,
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        supplierName: concept.supplierName || 'Guangdong Apex Intimate Apparel Co., Ltd.',
        supplierCountry: 'Китай',
        moq: 2000,
        productionLeadDays: 32,
        deliveryLeadDays: 16,
        techFiles: [
          {
            id: `asset-${Date.now()}`,
            title: `Техническое задание ${sku} (Китайский/Англ/Рус).pdf`,
            assetType: 'tech_pack',
            url: concept.imageUrl,
            uploadedAt: now,
          },
        ],
        economics: {
          currency: 'RUB',
          plannedRetailPrice: concept.plannedRetailPrice,
          actualRetailPrice: concept.plannedRetailPrice,
          discountPct: 0,
          vatPct: 20,
          returnRatePct: 3.5,
          unitCostPrice: concept.plannedUnitCost,
          marketplaceCommissionRub: Math.round(concept.plannedRetailPrice * 0.19),
          logisticsRub: 95,
          advertisingRub: Math.round(concept.plannedRetailPrice * 0.1),
          otherVariableRub: 30,
        },
        unitsSold: 0,
        revenueRub: 0,
        operatingProfitRub: 0,
        monthlyDynamicsPct: 0,
        salesChannels:
          concept.brandId === 'NA_TELE'
            ? ['Собственный магазин', 'Ozon']
            : ['Wildberries', 'Ozon', 'Собственный магазин'],
        variants: [
          {
            id: `var-${Date.now()}-1`,
            productId,
            variantSku: `${sku}-M`,
            colorName: concept.colorCombinations[0] || 'Чёрный + Тёмно-синий',
            colorHex: concept.brandId === 'NA_TELE' ? '#8B8078' : '#D97745',
            secondaryColorHex: '#171717',
            size: 'M',
            packConfiguration: '1 шт.',
            stockQty: 0,
          },
          {
            id: `var-${Date.now()}-2`,
            productId,
            variantSku: `${sku}-L`,
            colorName: concept.colorCombinations[0] || 'Чёрный + Тёмно-синий',
            colorHex: concept.brandId === 'NA_TELE' ? '#8B8078' : '#D97745',
            secondaryColorHex: '#171717',
            size: 'L',
            packConfiguration: '1 шт.',
            stockQty: 0,
          },
        ],
        isDemo: false,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      };

      setState((prev) => ({
        ...prev,
        products: [newProduct, ...prev.products],
        concepts: prev.concepts.map((c) =>
          c.id === conceptId ? { ...c, linkedProductId: productId, updatedAt: now } : c
        ),
        auditLog: [
          appendAudit(
            'product',
            productId,
            'created_from_concept',
            `Из концепции «${concept.name}» создана карточка продукта ${sku} в каталоге`
          ),
          ...prev.auditLog,
        ],
      }));

      setSelectedProductId(productId);
      notify('success', 'Модель создана в Каталоге продуктов', `Артикул ${sku} связан с концепцией ${concept.code}`);
      return newProduct;
    },
    [state.concepts, state.products, appendAudit, notify]
  );

  const createProduct = useCallback(
    (input: Partial<Product> & { name: string; sku: string; brandId: string }): Product => {
      const now = new Date().toISOString().slice(0, 10);
      const id = `prod-${Date.now()}`;
      const newProduct: Product = {
        id,
        sku: input.sku,
        name: input.name,
        brandId: input.brandId,
        conceptId: input.conceptId,
        category: input.category || 'Боксеры',
        productType: input.productType || 'Базовая коллекция',
        collection: input.collection || 'Базовая линия 2027',
        priceSegment: input.priceSegment || 'Middle+',
        status: input.status || 'active',
        description: input.description || '',
        ownerId: input.ownerId || currentUser.id,
        imageUrl:
          input.imageUrl ||
          (input.brandId === 'NA_TELE'
            ? 'images/products/natele-milky-black.svg'
            : 'images/products/borners-core-modal.svg'),
        galleryUrls: [
          input.imageUrl ||
            (input.brandId === 'NA_TELE'
              ? 'images/products/natele-milky-black.svg'
              : 'images/products/borners-core-modal.svg'),
        ],
        colorCombinations: input.colorCombinations || ['чёрный + тёмно-синий'],
        materials: input.materials || 'Микромодал + Эластан',
        fabricComposition: input.fabricComposition || '92% модал / 8% эластан',
        fabricDensityGsm: input.fabricDensityGsm || 180,
        waistbandType: input.waistbandType || 'Жаккардовая резинка 38 мм',
        fitType: input.fitType || 'Анатомическая посадка',
        constructionDetails: input.constructionDetails || 'Плоские швы (4 иглы, 6 нитей)',
        sizes: input.sizes || ['S', 'M', 'L', 'XL', 'XXL'],
        supplierName: input.supplierName || 'Guangdong Apex Intimate Apparel Co., Ltd.',
        supplierCountry: input.supplierCountry || 'Китай',
        moq: input.moq || 2000,
        productionLeadDays: input.productionLeadDays || 30,
        deliveryLeadDays: input.deliveryLeadDays || 16,
        techFiles: input.techFiles || [],
        economics: input.economics || {
          currency: 'RUB',
          plannedRetailPrice: 1590,
          actualRetailPrice: 1490,
          discountPct: 0,
          vatPct: 20,
          returnRatePct: 3.5,
          unitCostPrice: 320,
          marketplaceCommissionRub: 280,
          logisticsRub: 85,
          advertisingRub: 140,
          otherVariableRub: 30,
        },
        unitsSold: input.unitsSold || 0,
        revenueRub: input.revenueRub || 0,
        operatingProfitRub: input.operatingProfitRub || 0,
        monthlyDynamicsPct: 0,
        salesChannels: input.salesChannels || ['Wildberries', 'Ozon'],
        variants: input.variants || [],
        isDemo: false,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      };

      setState((prev) => ({
        ...prev,
        products: [newProduct, ...prev.products],
        auditLog: [
          appendAudit('product', id, 'created', `Добавлена модель «${newProduct.name}» (${newProduct.sku})`),
          ...prev.auditLog,
        ],
      }));
      notify('success', 'Модель добавлена в каталог', `${newProduct.sku} · ${newProduct.name}`);
      return newProduct;
    },
    [appendAudit, currentUser.id, notify]
  );

  const updateProduct = useCallback(
    (id: string, patch: Partial<Product>) => {
      const now = new Date().toISOString().slice(0, 10);
      setState((prev) => {
        const target = prev.products.find((p) => p.id === id);
        if (!target) return prev;
        const updatedProduct = { ...target, ...patch, updatedAt: now };

        // Синхронизация со связанной концепцией и запусками (п. 18, 25 ТЗ)
        const updatedConcepts = prev.concepts.map((c) => {
          if (c.linkedProductId === id || c.id === updatedProduct.conceptId) {
            return {
              ...c,
              name: patch.name ?? c.name,
              imageUrl: patch.imageUrl ?? c.imageUrl,
              colorCombinations: patch.colorCombinations ?? c.colorCombinations,
              plannedRetailPrice:
                patch.economics?.plannedRetailPrice ?? c.plannedRetailPrice,
              plannedUnitCost: patch.economics?.unitCostPrice ?? c.plannedUnitCost,
              updatedAt: now,
            };
          }
          return c;
        });

        return {
          ...prev,
          products: prev.products.map((p) => (p.id === id ? updatedProduct : p)),
          concepts: updatedConcepts,
          auditLog: [
            appendAudit('product', id, 'updated', `Обновлена карточка модели «${updatedProduct.name}»`),
            ...prev.auditLog,
          ],
        };
      });
      notify('success', 'Карточка модели сохранена');
    },
    [appendAudit, notify]
  );

  // Мягкое архивирование без разрушения связей (п. 17, 25 ТЗ: «архивирование не ломает связи»)
  const archiveEntity = useCallback(
    (type: 'product' | 'concept' | 'launch' | 'task' | 'document', id: string) => {
      setState((prev) => {
        const next = { ...prev };
        if (type === 'product') {
          next.products = prev.products.map((p) =>
            p.id === id ? { ...p, isArchived: !p.isArchived, status: !p.isArchived ? 'archived' : 'active' } : p
          );
        } else if (type === 'concept') {
          next.concepts = prev.concepts.map((c) =>
            c.id === id ? { ...c, isArchived: !c.isArchived } : c
          );
        } else if (type === 'launch') {
          next.launches = prev.launches.map((l) =>
            l.id === id ? { ...l, isArchived: !l.isArchived } : l
          );
        } else if (type === 'task') {
          next.tasks = prev.tasks.map((t) =>
            t.id === id ? { ...t, isArchived: !t.isArchived } : t
          );
        } else if (type === 'document') {
          next.documents = prev.documents.map((d) =>
            d.id === id ? { ...d, isArchived: !d.isArchived } : d
          );
        }
        next.auditLog = [
          appendAudit(type, id, 'archived', `Изменён статус архивирования объекта (${type}: ${id}) с сохранением всех связей`),
          ...prev.auditLog,
        ];
        return next;
      });
      notify('warning', 'Статус архива обновлён', 'Все связанные объекты и история сохранены.');
    },
    [appendAudit, notify]
  );

  // 3. Создание коммерческого запуска (Launch) с 10 этапами и синхронизацией с продуктом, концепцией и финпланом (п. 10, 18, 25 ТЗ)
  const createLaunch = useCallback(
    (input: {
      name: string;
      brandId: string;
      collectionName: string;
      productId?: string;
      conceptId?: string;
      startDate: string;
      marketingBudgetRub: number;
      salesPlanUnits: number;
      salesPlanRub: number;
      ownerId: string;
    }): Launch => {
      const id = `launch-${Date.now()}`;
      const now = new Date().toISOString().slice(0, 10);
      const linkedProduct = state.products.find((p) => p.id === input.productId);
      const linkedConcept = state.concepts.find((c) => c.id === input.conceptId);

      // 10 обязательных этапов запуска (п. 10 ТЗ)
      const sDate = input.startDate;
      const stages: Launch['stages'] = [
        { code: 'concept', label: 'Концепция', deadline: shiftDateString(sDate, -75), ownerId: input.ownerId, status: 'Done' },
        { code: 'design', label: 'Дизайн', deadline: shiftDateString(sDate, -60), ownerId: input.ownerId, status: 'Done' },
        { code: 'sample', label: 'Образец', deadline: shiftDateString(sDate, -45), ownerId: 'user-partner', status: 'In Progress' },
        { code: 'testing', label: 'Тест', deadline: shiftDateString(sDate, -35), ownerId: input.ownerId, status: 'Pending' },
        { code: 'production', label: 'Производство', deadline: shiftDateString(sDate, -18), ownerId: 'user-partner', status: 'Pending' },
        { code: 'logistics', label: 'Логистика', deadline: shiftDateString(sDate, -8), ownerId: 'user-admin', status: 'Pending' },
        { code: 'cards', label: 'Карточки', deadline: shiftDateString(sDate, -5), ownerId: input.ownerId, status: 'Pending' },
        { code: 'marketing', label: 'Маркетинг', deadline: shiftDateString(sDate, -2), ownerId: input.ownerId, status: 'Pending' },
        { code: 'sales', label: 'Продажи', deadline: sDate, ownerId: input.ownerId, status: 'Pending' },
        { code: 'analysis', label: 'Анализ', deadline: shiftDateString(sDate, 21), ownerId: 'user-viewer', status: 'Pending' },
      ];

      const newLaunch: Launch = {
        id,
        name: input.name,
        brandId: input.brandId,
        collectionName: input.collectionName || 'Выпуск 2027',
        productIds: input.productId ? [input.productId] : [],
        conceptId: input.conceptId || linkedProduct?.conceptId,
        startDate: input.startDate,
        readinessPct: 35,
        productionStatus: 'Запуск сформирован, подготовка партии',
        marketingBudgetRub: Number(input.marketingBudgetRub || 0),
        salesPlanUnits: Number(input.salesPlanUnits || 0),
        salesPlanRub: Number(input.salesPlanRub || 0),
        ownerId: input.ownerId || currentUser.id,
        status: 'В работе',
        imageUrl:
          linkedProduct?.imageUrl ||
          linkedConcept?.imageUrl ||
          (input.brandId === 'NA_TELE'
            ? 'images/products/natele-skin-tone.svg'
            : 'images/products/borners-big-love.svg'),
        stages,
        isDemo: false,
        isArchived: false,
        updatedAt: now,
      };

      setState((prev) => ({
        ...prev,
        launches: [newLaunch, ...prev.launches],
        concepts: prev.concepts.map((c) =>
          c.id === newLaunch.conceptId || (input.productId && c.linkedProductId === input.productId)
            ? { ...c, linkedLaunchId: id, targetLaunchDate: input.startDate }
            : c
        ),
        auditLog: [
          appendAudit('launch', id, 'created', `Создан запуск «${newLaunch.name}» на дату ${newLaunch.startDate}`),
          ...prev.auditLog,
        ],
      }));

      setSelectedLaunchId(id);
      notify('success', 'Запуск добавлен в Календарь запусков и на Дашборд', `${newLaunch.name} · ${newLaunch.startDate}`);
      return newLaunch;
    },
    [state.products, state.concepts, currentUser.id, appendAudit, notify]
  );

  const updateLaunch = useCallback(
    (id: string, patch: Partial<Launch>) => {
      const now = new Date().toISOString().slice(0, 10);
      setState((prev) => ({
        ...prev,
        launches: prev.launches.map((l) => (l.id === id ? { ...l, ...patch, updatedAt: now } : l)),
        auditLog: [
          appendAudit('launch', id, 'updated', `Обновлён запуск (${Object.keys(patch).join(', ')})`),
          ...prev.auditLog,
        ],
      }));
      notify('success', 'Параметры запуска сохранены');
    },
    [appendAudit, notify]
  );

  // Перенос даты запуска с явным выбором: сдвигать или НЕ сдвигать зависимые дедлайны этапов и задач (п. 10 ТЗ)
  const rescheduleLaunch = useCallback(
    (launchId: string, newStartDate: string, shiftDependentDates: boolean) => {
      const now = new Date().toISOString().slice(0, 10);
      setState((prev) => {
        const launch = prev.launches.find((l) => l.id === launchId);
        if (!launch) return prev;
        const deltaDays = Math.round(
          (new Date(newStartDate).getTime() - new Date(launch.startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        );

        const nextStages = shiftDependentDates
          ? launch.stages.map((st) => ({
              ...st,
              deadline: shiftDateString(st.deadline, deltaDays),
            }))
          : launch.stages;

        const nextTasks = shiftDependentDates
          ? prev.tasks.map((t) =>
              t.launchId === launchId && t.status !== 'Done'
                ? { ...t, deadline: shiftDateString(t.deadline, deltaDays) }
                : t
            )
          : prev.tasks;

        return {
          ...prev,
          launches: prev.launches.map((l) =>
            l.id === launchId
              ? { ...l, startDate: newStartDate, stages: nextStages, updatedAt: now }
              : l
          ),
          tasks: nextTasks,
          auditLog: [
            appendAudit(
              'launch',
              launchId,
              'rescheduled',
              `Дата запуска «${launch.name}» перенесена на ${newStartDate} (${
                shiftDependentDates ? 'зависимые сроки сдвинуты' : 'зависимые сроки оставлены без изменений'
              })`
            ),
            ...prev.auditLog,
          ],
        };
      });

      notify(
        'success',
        `Дата запуска перенесена на ${newStartDate}`,
        shiftDependentDates
          ? 'Дедлайны этапов и связанных задач синхронно сдвинуты по вашему подтверждению.'
          : 'Зависимые даты этапов и задач сохранены без изменений.'
      );
    },
    [appendAudit, notify]
  );

  const createTask = useCallback(
    (input: {
      title: string;
      description?: string;
      brandId: string;
      projectId?: string;
      productId?: string;
      conceptId?: string;
      launchId?: string;
      assigneeId: string;
      priority: TaskItem['priority'];
      deadline: string;
    }): TaskItem => {
      const id = `task-${Date.now()}`;
      const newTask: TaskItem = {
        id,
        title: input.title,
        description: input.description || '',
        brandId: input.brandId,
        projectId: input.projectId || state.projects[0]?.id || 'proj-big-love',
        productId: input.productId,
        conceptId: input.conceptId,
        launchId: input.launchId,
        assigneeId: input.assigneeId || currentUser.id,
        priority: input.priority || 'High',
        deadline: input.deadline || '2027-01-20',
        status: 'To Do',
        comments: [],
        attachments: [],
        isDemo: false,
        isArchived: false,
      };

      setState((prev) => ({
        ...prev,
        tasks: [newTask, ...prev.tasks],
        auditLog: [
          appendAudit('task', id, 'created', `Создана задача «${newTask.title}»`),
          ...prev.auditLog,
        ],
      }));
      notify('success', 'Задача создана и назначена ответственному', newTask.title);
      return newTask;
    },
    [state.projects, currentUser.id, appendAudit, notify]
  );

  const updateTask = useCallback(
    (id: string, patch: Partial<TaskItem>) => {
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      }));
      notify('success', 'Задача обновлена');
    },
    [notify]
  );

  const updateTaskStatus = useCallback(
    (id: string, status: TaskStatus) => {
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
        auditLog: [
          appendAudit('task', id, 'status_changed', `Статус задачи изменён на «${TASK_STATUS_LABELS_RU[status]}»`),
          ...prev.auditLog,
        ],
      }));
      notify('success', `Статус задачи: ${TASK_STATUS_LABELS_RU[status]}`);
    },
    [appendAudit, notify]
  );

  const updateStrategyBlock = useCallback(
    (id: string, patch: Partial<StrategyBlock>, comment?: string) => {
      const now = new Date().toISOString().slice(0, 10);
      setState((prev) => {
        const block = prev.strategies.find((s) => s.id === id);
        if (!block) return prev;
        const nextVersion = block.version + 1;
        const nextStatus = patch.status ?? block.status;
        const historyEntry = {
          version: nextVersion,
          authorName: `${currentUser.fullName} (${ROLE_LABELS_RU[currentUser.role]})`,
          updatedAt: now,
          status: nextStatus,
          comment: comment || 'Обновление стратегического блока',
        };
        return {
          ...prev,
          strategies: prev.strategies.map((s) =>
            s.id === id
              ? {
                  ...s,
                  ...patch,
                  version: nextVersion,
                  authorName: `${currentUser.fullName} (${ROLE_LABELS_RU[currentUser.role]})`,
                  updatedAt: now,
                  history: [historyEntry, ...s.history],
                }
              : s
          ),
          auditLog: [
            appendAudit('strategy', id, 'updated', `Обновлён блок стратегии «${block.titleRu}» (v${nextVersion})`),
            ...prev.auditLog,
          ],
        };
      });
      notify('success', 'Стратегический блок сохранён в истории версий');
    },
    [currentUser, appendAudit, notify]
  );

  const updateFinancialPlanRow = useCallback(
    (id: string, patch: Partial<FinancialPlanRow>) => {
      const now = new Date().toISOString().slice(0, 10);
      setState((prev) => ({
        ...prev,
        financialPlans: prev.financialPlans.map((r) =>
          r.id === id
            ? { ...r, ...patch, updatedAt: now, updatedBy: currentUser.fullName }
            : r
        ),
        auditLog: [
          appendAudit('finance', id, 'updated', `Обновлена строка финансового плана (${id})`),
          ...prev.auditLog,
        ],
      }));
      notify('success', 'Финансовые показатели обновлены');
    },
    [currentUser.fullName, appendAudit, notify]
  );

  const addFinancialPlanRow = useCallback(
    (row: Omit<FinancialPlanRow, 'id' | 'updatedAt' | 'updatedBy'>) => {
      const id = `fin-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
      const now = new Date().toISOString().slice(0, 10);
      setState((prev) => ({
        ...prev,
        financialPlans: [
          ...prev.financialPlans,
          {
            ...row,
            id,
            updatedAt: now,
            updatedBy: currentUser.fullName,
          },
        ],
      }));
    },
    [currentUser.fullName]
  );

  const createCampaign = useCallback(
    (input: Omit<Campaign, 'id' | 'isDemo' | 'isArchived'>) => {
      const id = `camp-${Date.now()}`;
      setState((prev) => ({
        ...prev,
        campaigns: [{ ...input, id, isDemo: false, isArchived: false }, ...prev.campaigns],
      }));
      notify('success', 'Маркетинговая кампания создана', input.name);
    },
    [notify]
  );

  const createExperiment = useCallback(
    (input: Omit<GrowthExperiment, 'id' | 'isDemo'>) => {
      const id = `exp-${Date.now()}`;
      setState((prev) => ({
        ...prev,
        experiments: [{ ...input, id, isDemo: false }, ...prev.experiments],
      }));
      notify('success', 'Эксперимент роста запущен', input.hypothesis);
    },
    [notify]
  );

  const updateCampaign = useCallback(
    (id: string, patch: Partial<Campaign>) => {
      setState((prev) => ({
        ...prev,
        campaigns: prev.campaigns.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      }));
      notify('success', 'Метрики маркетинговой кампании обновлены');
    },
    [notify]
  );

  const updateExperiment = useCallback(
    (id: string, patch: Partial<GrowthExperiment>) => {
      setState((prev) => ({
        ...prev,
        experiments: prev.experiments.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      }));
      notify('success', 'Статус и результаты гипотезы обновлены');
    },
    [notify]
  );

  const createCompetitor = useCallback(
    (input: Omit<Competitor, 'id' | 'isDemo'>) => {
      const id = `comp-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
      setState((prev) => ({
        ...prev,
        competitors: [{ ...input, id, isDemo: false }, ...prev.competitors],
      }));
      notify('success', 'Конкурент добавлен в базу Аналитики рынка', input.brandName);
    },
    [notify]
  );

  const createResearch = useCallback(
    (input: Omit<ResearchItem, 'id' | 'isDemo'>) => {
      const id = `res-${Date.now()}`;
      setState((prev) => ({
        ...prev,
        research: [{ ...input, id, isDemo: false }, ...prev.research],
      }));
      notify('success', 'Исследование сохранено в библиотеке исследований', input.title);
    },
    [notify]
  );

  const createDocument = useCallback(
    (input: Omit<DocumentItem, 'id' | 'uploadedAt' | 'uploadedBy' | 'isArchived'>) => {
      const id = `doc-${Date.now()}`;
      const now = new Date().toISOString().slice(0, 10);
      setState((prev) => ({
        ...prev,
        documents: [
          {
            ...input,
            id,
            uploadedAt: now,
            uploadedBy: currentUser.fullName,
            isArchived: false,
          },
          ...prev.documents,
        ],
        auditLog: [
          appendAudit('document', id, 'created', `Загружен документ «${input.title}» (${input.fileName})`),
          ...prev.auditLog,
        ],
      }));
      notify('success', 'Файл проверен и загружен в приватное хранилище', input.fileName);
    },
    [currentUser.fullName, appendAudit, notify]
  );

  const updateBrandPalette = useCallback(
    (brandId: string, accentColor: string, secondaryColor: string) => {
      const now = new Date().toISOString().slice(0, 10);
      setState((prev) => ({
        ...prev,
        brands: prev.brands.map((b) =>
          b.id === brandId ? { ...b, accentColor, secondaryColor, updatedAt: now } : b
        ),
        auditLog: [
          appendAudit('brand', brandId, 'updated', `Обновлена цветовая палитра бренда ${brandId} (${accentColor})`),
          ...prev.auditLog,
        ],
      }));
      notify('success', `Палитра бренда ${brandId} обновлена`);
    },
    [appendAudit, notify]
  );

  const createBrand = useCallback(
    (input: { code: string; name: string; tagline: string; segment: string; accentColor: string }) => {
      const code = input.code.toUpperCase().replace(/\s+/g, '_');
      const now = new Date().toISOString().slice(0, 10);
      const newBrand: Brand = {
        id: code,
        code,
        name: input.name,
        tagline: input.tagline,
        segment: input.segment,
        description: input.tagline,
        accentColor: input.accentColor || '#2563EB',
        secondaryColor: '#111111',
        heroImage: 'images/products/borners-core-modal.svg',
        targetMarginPct: 50,
        activeModelsCount: 0,
        upcomingLaunchesCount: 0,
        plannedRevenue2027Rub: 25_000_000,
        actualRevenueYtdRub: 0,
        isDemo: false,
        updatedAt: now,
      };
      setState((prev) => ({
        ...prev,
        brands: [...prev.brands, newBrand],
        auditLog: [
          appendAudit('brand', code, 'created', `Добавлен новый бренд в портфель: ${input.name}`),
          ...prev.auditLog,
        ],
      }));
      notify('success', `Бренд «${input.name}» добавлен в портфель BORNERS GROUP`);
    },
    [appendAudit, notify]
  );

  const resetToDemoDefaults = useCallback(() => {
    setState(DEFAULT_STATE);
    window.localStorage.removeItem(STORAGE_KEY);
    notify('success', 'Демо-данные восстановлены по умолчанию');
  }, [notify]);

  const value = useMemo<PlatformContextValue>(
    () => ({
      ...state,
      isAuthenticated,
      currentUser,
      loginAs,
      logout,
      updateUserRoleOrPermissions,
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
      financialScenario,
      setFinancialScenario,
      darkMode,
      setDarkMode,
      selectedProductId,
      setSelectedProductId,
      selectedConceptId,
      setSelectedConceptId,
      selectedLaunchId,
      setSelectedLaunchId,
      toasts,
      notify,
      dismissToast,
      createConcept,
      updateConcept,
      updateConceptStage,
      deleteConcept,
      createProductFromConcept,
      createProduct,
      updateProduct,
      archiveEntity,
      createLaunch,
      updateLaunch,
      rescheduleLaunch,
      createTask,
      updateTask,
      updateTaskStatus,
      updateStrategyBlock,
      updateFinancialPlanRow,
      addFinancialPlanRow,
      createCampaign,
      updateCampaign,
      createExperiment,
      updateExperiment,
      createCompetitor,
      createResearch,
      createDocument,
      updateBrandPalette,
      createBrand,
      resetToDemoDefaults,
    }),
    [
      state,
      isAuthenticated,
      currentUser,
      loginAs,
      logout,
      updateUserRoleOrPermissions,
      activeSection,
      navHistory,
      navigateTo,
      goBack,
      brandFilter,
      periodFilter,
      platformMode,
      simpleMode,
      financialScenario,
      darkMode,
      selectedProductId,
      selectedConceptId,
      selectedLaunchId,
      toasts,
      notify,
      dismissToast,
      createConcept,
      updateConcept,
      updateConceptStage,
      deleteConcept,
      createProductFromConcept,
      createProduct,
      updateProduct,
      archiveEntity,
      createLaunch,
      updateLaunch,
      rescheduleLaunch,
      createTask,
      updateTask,
      updateTaskStatus,
      updateStrategyBlock,
      updateFinancialPlanRow,
      addFinancialPlanRow,
      createCampaign,
      updateCampaign,
      createExperiment,
      updateExperiment,
      createCompetitor,
      createResearch,
      createDocument,
      updateBrandPalette,
      createBrand,
      resetToDemoDefaults,
    ]
  );

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform() {
  const ctx = useContext(PlatformContext);
  if (!ctx) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  return ctx;
}
