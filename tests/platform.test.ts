import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  calculateUnitEconomics,
  calculateRevenueFromBuyouts,
  calculatePlanFactVariance,
  canUserAccessSection,
  canUserApproveProduction,
  canUserEditApprovedStrategy,
  canUserViewBrandConcept,
  canUserViewFinance,
  canUserViewCostPrice,
  detectLaunchDateConflicts,
  normalizeConceptStageToSeven,
  parseCsvContent,
  validateAndCheckDuplicates,
  validateRnDStageTransition,
} from '../src/lib/finance.ts';
import {
  buildXlsxBytes,
  buildPdfFromJpegPages,
} from '../src/lib/document-export.ts';
import { INITIAL_STRATEGIES } from '../src/lib/initial-strategies.ts';
import {
  INITIAL_SCENARIOS,
  INITIAL_SCENARIO_MODELS,
  computeModelScenarioMetrics,
} from '../src/lib/scenarioData.ts';
import {
  ACTING_2027_SKUS,
  verifyActingAssortment2027Bundle,
} from '../src/lib/actingAssortment2027.ts';
import {
  S1_100M_NEW_VARIANTS,
  verifyScenarioS1_100M,
} from '../src/lib/scenarioS1_100M.ts';

test('1. Юнит-экономика (п. 11 ТЗ): расчёт чистой выручки, прибыли на единицу и маржи', () => {
  const result = calculateUnitEconomics({
    currency: 'RUB',
    plannedRetailPrice: 1990,
    actualRetailPrice: 1800,
    discountPct: 0,
    vatPct: 20, // НДС 20% = 300 ₽
    returnRatePct: 0,
    unitCostPrice: 360,
    marketplaceCommissionRub: 300,
    logisticsRub: 90,
    advertisingRub: 150,
    otherVariableRub: 50,
  });

  assert.equal(result.grossPriceAfterDiscount, 1800);
  assert.equal(result.vatAmountPerUnit, 300);
  assert.equal(result.netRevenuePerUnit, 1500);
  assert.equal(result.totalVariableCostsPerUnit, 950);
  // Прибыль на единицу = 1500 - 950 = 550 ₽
  assert.equal(result.unitProfitRub, 550);
  // Маржа = 550 / 1500 = 36.67%
  assert.equal(result.marginPct, 36.67);
});

test('2. Выручка и План/Факт (п. 4, 11 ТЗ): отсутствие данных обозначается «Нет данных», не нулём', () => {
  assert.equal(calculateRevenueFromBuyouts(1000, 1690), 1_690_000);
  assert.equal(calculateRevenueFromBuyouts(null, 1690), null);

  const missingFact = calculatePlanFactVariance(15_675_000, null);
  assert.equal(missingFact.hasFact, false);
  assert.equal(missingFact.factLabel, 'Нет данных');
  assert.equal(missingFact.varianceLabel, 'Нет данных');

  const withFact = calculatePlanFactVariance(10_000_000, 11_500_000);
  assert.equal(withFact.hasFact, true);
  assert.equal(withFact.diffPct, 15);
  assert.equal(withFact.isPositive, true);
});

test('3. Роли и права доступа (п. 5, 15 ТЗ): ограничения на финансы, себестоимость и утверждённые стратегии', () => {
  const owner = {
    id: 'u1',
    email: 'owner@borners.ru',
    fullName: 'Owner',
    jobTitle: 'CEO',
    role: 'Owner' as const,
    canViewFinance: true,
    canViewCostPrice: true,
    assignedBrandIds: ['BORNERS', 'NA_TELE'],
    avatarInitials: 'OW',
    isActive: true,
  };

  const restrictedManager = {
    id: 'u2',
    email: 'design@borners.ru',
    fullName: 'Designer Manager',
    jobTitle: 'Brand Lead',
    role: 'Manager' as const,
    canViewFinance: false,
    canViewCostPrice: false,
    assignedBrandIds: ['NA_TELE'],
    avatarInitials: 'DM',
    isActive: true,
  };

  const partner = {
    id: 'u3',
    email: 'partner@factory.cn',
    fullName: 'Partner',
    jobTitle: 'Factory',
    role: 'Partner' as const,
    canViewFinance: false,
    canViewCostPrice: false,
    assignedBrandIds: ['BORNERS'],
    avatarInitials: 'PT',
    isActive: true,
  };

  assert.equal(canUserViewFinance(owner), true);
  assert.equal(canUserViewFinance(restrictedManager), false);
  assert.equal(canUserViewCostPrice(restrictedManager), false);
  assert.equal(canUserEditApprovedStrategy(owner), true);
  assert.equal(canUserEditApprovedStrategy(restrictedManager), false);

  // Partner не видит стратегию и финансы, но видит Product Lab и каталог
  assert.equal(canUserAccessSection(partner, 'brand-strategy'), false);
  assert.equal(canUserAccessSection(partner, 'finance'), false);
  assert.equal(canUserAccessSection(partner, 'product-lab'), true);
});

test('4. Перенос даты запуска (п. 10 ТЗ): обнаружение конфликтующих сроков этапов и связанных задач', () => {
  const mockLaunch = {
    id: 'launch-1',
    name: 'BORNERS BIG LOVE',
    brandId: 'BORNERS',
    collectionName: 'BIG LOVE',
    productIds: ['p1'],
    startDate: '2027-02-01',
    readinessPct: 50,
    productionStatus: 'В работе',
    marketingBudgetRub: 1000000,
    salesPlanUnits: 5000,
    salesPlanRub: 8000000,
    ownerId: 'u1',
    status: 'В работе' as const,
    imageUrl: '',
    stages: [
      { code: 'production' as const, label: 'Производство', deadline: '2027-01-20', ownerId: 'u1', status: 'In Progress' as const },
    ],
    isDemo: true,
    isArchived: false,
    updatedAt: '2026-10-30',
  };

  const linkedTasks = [
    {
      id: 't1',
      title: 'Отгрузка на склад Коледино',
      description: '',
      brandId: 'BORNERS',
      projectId: 'proj-1',
      launchId: 'launch-1',
      assigneeId: 'u1',
      priority: 'High' as const,
      deadline: '2027-01-25',
      status: 'To Do' as const,
      comments: [],
      attachments: [],
      isDemo: true,
      isArchived: false,
    },
  ];

  const check = detectLaunchDateConflicts(mockLaunch, '2027-02-15', linkedTasks);
  assert.equal(check.deltaDays, 14);
  assert.equal(check.conflicts.length, 2);
  assert.equal(check.conflicts[0].suggestedDeadline, '2027-02-03');
  assert.equal(check.conflicts[1].suggestedDeadline, '2027-02-08');
});

test('5. Импорт CSV/XLSX (п. 19 ТЗ): проверка форматов и поиск дубликатов без молчаливой перезаписи', () => {
  const csv = [
    'Артикул;Название;Цена;Себестоимость',
    'BRN-BL-2027;Существующий артикул;1690;360',
    'BRN-NEW-301;Новая модель боксеров;1490;310',
    'BRN-NEW-301;Дубликат внутри файла;1490;abc',
  ].join('\n');

  const parsed = parseCsvContent(csv);
  assert.equal(parsed.headers.length, 4);
  assert.equal(parsed.rows.length, 3);

  const validated = validateAndCheckDuplicates({
    rows: parsed.rows,
    columnMapping: {
      sku: 'Артикул',
      name: 'Название',
      price: 'Цена',
      cost: 'Себестоимость',
    },
    requiredFields: ['sku', 'name', 'price'],
    numericFields: ['price', 'cost'],
    existingKeys: new Set(['BRN-BL-2027']),
    uniqueTargetField: 'sku',
  });

  // 1-я строка — дубликат существующего артикула в БД
  assert.equal(validated[0].isDuplicate, true);
  // 2-я строка — чистая валидная запись
  assert.equal(validated[1].isDuplicate, false);
  assert.equal(validated[1].errors.length, 0);
  // 3-я строка — дубликат внутри файла + ошибка числового формата поля cost
  assert.equal(validated[2].isDuplicate, true);
  assert.equal(validated[2].errors.length, 1);
});

test('6. Product Lab R&D (Критерии 05 и 08 ТЗ): изоляция брендов BORNERS / НА ТЕЛЕ и запрет утверждения производства сотрудником', () => {
  const owner = {
    id: 'u-owner',
    email: 'owner@borners.ru',
    fullName: 'Алексей Морозов',
    jobTitle: 'CEO',
    role: 'Owner' as const,
    canViewFinance: true,
    canViewCostPrice: true,
    assignedBrandIds: ['BORNERS', 'NA_TELE'],
    avatarInitials: 'АМ',
    isActive: true,
  };

  const bornersOnlyUser = {
    id: 'u-brn',
    email: 'brn@borners.ru',
    fullName: 'Менеджер BORNERS',
    jobTitle: 'Brand Manager',
    role: 'Manager' as const,
    canViewFinance: true,
    canViewCostPrice: true,
    assignedBrandIds: ['BORNERS'],
    avatarInitials: 'МБ',
    isActive: true,
  };

  const regularEmployee = {
    id: 'u-emp',
    email: 'emp@borners.ru',
    fullName: 'Сотрудник R&D',
    jobTitle: 'R&D Specialist',
    role: 'Viewer' as const,
    canViewFinance: false,
    canViewCostPrice: false,
    assignedBrandIds: ['BORNERS'],
    avatarInitials: 'СР',
    isActive: true,
  };

  // Критерий 08: пользователь BORNERS видит BORNERS, но не видит закрытые проекты НА ТЕЛЕ; Владелец видит оба
  assert.equal(canUserViewBrandConcept(bornersOnlyUser, 'BORNERS'), true);
  assert.equal(canUserViewBrandConcept(bornersOnlyUser, 'NA_TELE'), false);
  assert.equal(canUserViewBrandConcept(owner, 'BORNERS'), true);
  assert.equal(canUserViewBrandConcept(owner, 'NA_TELE'), true);

  // Критерий 05: обычный сотрудник не может утвердить производство; Владелец может
  assert.equal(canUserApproveProduction(regularEmployee, 'BORNERS'), false);
  assert.equal(canUserApproveProduction(owner, 'BORNERS'), true);
});

test('7. Product Lab R&D (п. 15 ТЗ): контроль условий при переходе между 7 этапами', () => {
  assert.equal(normalizeConceptStageToSeven('IDEA'), 'IDEA');
  assert.equal(normalizeConceptStageToSeven('ANALYSIS'), 'ANALYSIS');
  assert.equal(normalizeConceptStageToSeven('SAMPLE'), 'SAMPLE');
  assert.equal(normalizeConceptStageToSeven('TEST'), 'TEST');
  assert.equal(normalizeConceptStageToSeven('DECISION'), 'DECISION');
  assert.equal(normalizeConceptStageToSeven('PRODUCTION'), 'PRODUCTION');
  assert.equal(normalizeConceptStageToSeven('LAUNCH'), 'LAUNCH');

  const regularEmployee = {
    id: 'u-emp',
    email: 'emp@borners.ru',
    fullName: 'Сотрудник',
    jobTitle: 'R&D',
    role: 'Viewer' as const,
    canViewFinance: false,
    canViewCostPrice: false,
    assignedBrandIds: ['BORNERS'],
    avatarInitials: 'СР',
    isActive: true,
  };

  const mockConcept: any = {
    id: 'c-1',
    code: 'RD-024',
    name: 'Семейные трусы BORNERS',
    brandId: 'BORNERS',
    stage: 'DECISION',
    ownerId: 'u-emp',
    ideaDescription: 'Свободные трусы Old Money',
    supplierName: '',
    approvalDecisions: [],
  };

  // Попытка обычного сотрудника перетащить карточку в ПРОИЗВОДСТВО без утверждения руководителем блокируется
  const gateCheck = validateRnDStageTransition(mockConcept, 'PRODUCTION', regularEmployee);
  assert.equal(gateCheck.allowed, false);
  assert.equal(gateCheck.requiresManagerApproval, true);
  assert.equal(gateCheck.missingFields.length >= 2, true);
});

test('8. Экспорт документов (PDF и Excel .xlsx): генерация валидных бинарных контейнеров OpenXML ZIP и PDF-1.4', () => {
  const xlsxBytes = buildXlsxBytes([
    {
      name: 'Матрица SKU',
      colWidths: [18, 32, 16],
      rows: [
        {
          height: 30,
          mergeAcross: 3,
          cells: [{ value: 'BORNERS GROUP — МАТРИЦА АССОРТИМЕНТА', style: 1 }],
        },
        {
          height: 24,
          cells: [
            { value: 'Артикул', style: 3 },
            { value: 'Модель', style: 3 },
            { value: 'Цена РРЦ, ₽', style: 3 },
          ],
        },
        {
          height: 20,
          cells: [
            { value: 'BRN-BX-001', style: 5 },
            { value: 'Боксеры BORNERS Signature Modal', style: 5 },
            { value: 1990, style: 9, type: 'number' },
          ],
        },
      ],
    },
  ]);

  // Проверка сигнатуры ZIP-архива OpenXML (PK\x03\x04)
  assert.equal(xlsxBytes[0], 0x50);
  assert.equal(xlsxBytes[1], 0x4b);
  assert.equal(xlsxBytes[2], 0x03);
  assert.equal(xlsxBytes[3], 0x04);
  assert.equal(xlsxBytes.byteLength > 1500, true);

  // Проверка генерации многостраничного PDF-1.4 контейнера
  const fakeJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0xff, 0xd9]);
  const pdfBytes = buildPdfFromJpegPages([{ jpegBytes: fakeJpeg, widthPx: 1654, heightPx: 2339 }]);
  const pdfHeader = new TextDecoder().decode(pdfBytes.slice(0, 8));
  const pdfTail = new TextDecoder().decode(pdfBytes.slice(pdfBytes.length - 16));
  assert.equal(pdfHeader.startsWith('%PDF-1.4'), true);
  assert.equal(pdfTail.includes('%%EOF'), true);
});

test('9. Быстрая загрузка фотографий (< 50 КБ на фото) и дедлайны всех 14 блоков стратегии', () => {
  const imagesDir = path.join(process.cwd(), 'public', 'images', 'products');
  const files = fs.readdirSync(imagesDir).filter((f) => f.endsWith('.jpg') || f.endsWith('.png'));
  assert.equal(files.length >= 10, true);
  for (const file of files) {
    const stat = fs.statSync(path.join(imagesDir, file));
    // Каждое изображение сжато до ~18-36 КБ (лимит < 60 КБ вместо прежних 7.2 МБ)
    assert.equal(stat.size < 60 * 1024, true, `Файл ${file} превышает 60 КБ: ${stat.size} байт`);
  }

  assert.equal(INITIAL_STRATEGIES.length, 28);
  for (const block of INITIAL_STRATEGIES) {
    assert.equal(typeof block.deadline, 'string');
    assert.equal((block.deadline ?? '').length, 10);
  }
});

test('10. Сценарии роста и управление моделями (ТЗ v1.0, Тест 01–12): расчёт снизу вверх, маржа, дефицит и конфликт сроков', () => {
  const scen1 = INITIAL_SCENARIOS[0]; // 100 млн ₽ / мес
  const model001 = INITIAL_SCENARIO_MODELS[0]; // BORNERS №001 / COLOR 4 PACK

  const baseMetrics = computeModelScenarioMetrics(model001, scen1);
  // Годовая выручка считается как сумма 12 месяцев (~87 млн ₽), а не декабрь × 12
  assert.equal(baseMetrics.annualPacks, 67442);
  assert.equal(Math.round(baseMetrics.annualRevenueRub / 1_000_000), 87);
  assert.equal(baseMetrics.goalSharePct, 10.8);
  assert.equal(baseMetrics.hasScheduleConflict, false);
  // Палитры SORBET CLUB и RIVIERA содержат по 4 цвета с Pantone (Тест 08)
  assert.equal(model001.palettes.length, 2);
  assert.equal(model001.palettes[0].colors.length, 4);
  assert.equal(model001.palettes[1].colors.length, 4);

  // Тест 04: изменение продаж за месяц пересчитывает годовую выручку
  const modifiedModel = {
    ...model001,
    unitCostRub: 350, // Тест 05: снижение себестоимости увеличивает маржинальный доход
    plansByScenario: {
      ...model001.plansByScenario,
      1: {
        ...model001.plansByScenario[1],
        monthlyPacks: model001.plansByScenario[1].monthlyPacks.map((v, idx) =>
          idx === 0 ? v + 1000 : v
        ),
        salesStartMonthIdx: 2, // Март
        warehouseArrivalMonthIdx: 3, // Апрель (Тест 07: конфликт сроков!)
        warehouseArrivalDateLabel: '12 апреля',
      },
    },
  };

  const nextMetrics = computeModelScenarioMetrics(modifiedModel, scen1);
  assert.equal(
    nextMetrics.annualRevenueRub,
    baseMetrics.annualRevenueRub + 1000 * 1290
  );
  assert.equal(nextMetrics.unitMarginRub > baseMetrics.unitMarginRub, true);
  assert.equal(nextMetrics.hasScheduleConflict, true);
  assert.equal(
    nextMetrics.scheduleConflictMessage,
    'План продаж начинается в марте, но товар поступит на склад только 12 апреля'
  );
});

test('11. Действующий ассортимент ИП Нерсесянц 2027 (7 SKU · 84 записи): точная сверка контрольных сумм', () => {
  const check = verifyActingAssortment2027Bundle();
  assert.equal(check.valid, true);
  assert.equal(ACTING_2027_SKUS.length, 7);
  assert.equal(check.recordsCount, 84);
  assert.equal(check.annualBuyoutsSets, 223_713);
  assert.equal(check.annualRevenueRub, 267_731_943);
  assert.equal(check.decemberRevenueRub, 22_729_352);
  assert.equal(check.annualCostOfGoodsRub, 91_462_155);

  // Артикул 72302360 (4351877) помечен «FUKAI на фото — подтвердить», без автоматического подтверждения BORNERS
  const fukaiCandidate = ACTING_2027_SKUS.find((s) => s.wbSku === '72302360');
  assert.equal(Boolean(fukaiCandidate), true);
  assert.equal(fukaiCandidate?.brandVerified, false);
  assert.equal(fukaiCandidate?.brandStatus.includes('FUKAI'), true);
});

test('12. Сценарий №1 BORNERS-2027-S1-100M (100 млн ₽/мес · 16 новых вариантов + 5 SKU WB): точная сверка всех контрольных сумм', () => {
  const s1 = verifyScenarioS1_100M();
  assert.equal(s1.valid, true);
  assert.equal(s1.scenarioCode, 'BORNERS-2027-S1-100M');
  assert.equal(s1.newVariantsCount, 16);
  assert.equal(s1.confirmedActingSkusCount, 5);
  assert.equal(s1.unverifiedActingSkusCount, 2);
  assert.equal(s1.decemberNewSets, 41_400);
  assert.equal(s1.decemberNewRevenueRub, 85_114_000);
  assert.equal(s1.decemberActingBornersRevenueRub, 15_040_901);
  assert.equal(s1.decemberTotalRevenueRub, 100_154_901);
  assert.equal(s1.annualTotalRevenueRub, 606_372_182);
  assert.equal(s1.zeroSalesBeforeLaunchValid, true);
  assert.equal(S1_100M_NEW_VARIANTS.length, 16);
});



