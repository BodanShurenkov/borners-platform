// Сценарий №1: BORNERS-2027-S1-100M — План роста Декабрь 2027 / 100 млн ₽ в месяц
// 5 подтверждённых по фото действующих SKU BORNERS (15,04 млн ₽ в дек) + 16 новых коммерческих вариантов (85,11 млн ₽ / 41 400 компл. в дек)
// Итого Декабрь 2027: 100,15 млн ₽ (100 154 901 ₽) · Итого 12 месяцев 2027: 606,37 млн ₽ (606 372 182 ₽)

import type { ScenarioModelSpec, PalettePack } from './scenarioData';
import type { Product } from '@/types/platform';
import { ACTING_2027_SKUS } from './actingAssortment2027.ts';

export const S1_100M_SCENARIO_CODE = 'BORNERS-2027-S1-100M';
export const S1_100M_SCENARIO_ID = 1;

// 5 подтверждённых по фото действующих SKU BORNERS (включены в цель BORNERS 100 млн ₽)
export const S1_100M_CONFIRMED_WB_SKUS = [
  '244995893', // Borners2 — 6,39 млн ₽ в дек / 75,28 млн ₽ за год
  '440758616', // 1art-borners — 2,97 млн ₽ в дек / 35,01 млн ₽ за год
  '439426186', // borners4 — 2,93 млн ₽ в дек / 34,52 млн ₽ за год
  '440759654', // 2art-borners — 1,65 млн ₽ в дек / 19,46 млн ₽ за год
  '257807266', // borners3 — 1,10 млн ₽ в дек / 12,92 млн ₽ за год
] as const;

// 2 действующих SKU кабинета ИП Нерсесянц со статусом «Бренд не подтверждён — не в цели»
export const S1_100M_UNVERIFIED_WB_SKUS = [
  '86205435', // 435tru — 3,87 млн ₽ в дек (не в цели BORNERS)
  '72302360', // 4351877 — 3,82 млн ₽ в дек (на фото FUKAI — не в цели BORNERS)
] as const;

export interface S1NewVariantSpec {
  variantId: string; // например BRN-001-SC
  modelId: string; // например BRN-001
  familyCode: string; // COLOR 4 PACK | RIB CORE | FAMILY 4 PACK | DAILY | BRIEF A | WOVEN 2PACK
  title: string; // 001 · ЯРКИЕ / Sorbet Club
  paletteTitle: string;
  unitsInPack: number;
  plannedPriceRub: number;
  isPriceHypothesis: boolean;
  launchMonthIdx: number; // 0 = январь, 2 = март, 3 = апрель
  launchMonthLabel: string;
  isLaunchDateHypothesis: boolean;
  unitCostRub: number; // 0 если себестоимость не задана
  unitCostLabel: string; // '600 ₽ / комплект' | '500–550 ₽ / комплект' | 'не указана' и т.д.
  isCostConfirmed: boolean;
  priorityLabel: 'Высший' | 'Высокий' | 'Средний' | 'Не указан';
  techPdfFilename: string; // оригинальное имя файла в original_tech_pdfs/
  techPdfStaticUrl: string; // безопасный путь к PDF в public/docs/s1-100m/original_tech_pdfs/
  specSummary: string;
  imageUrl: string;
  galleryUrls: string[];
  colors: { nameRu: string; pantone: string; hex: string }[];
  monthlyBuyoutsSets: number[]; // 12 месяцев (Янв..Дек)
  monthlyRevenueMln: number[]; // 12 месяцев из PDF (млн ₽, округление до 2 знаков)
  decemberBuyoutsSets: number;
  decemberRevenueMln: number;
  annualRevenueMln: number;
}

export const S1_100M_CONTROL_TOTALS = {
  scenarioCode: S1_100M_SCENARIO_CODE,
  targetMonthLabel: 'Декабрь 2027',
  targetMonthlyRevenueMln: 100.0,
  decemberTotalRevenueMln: 100.15,
  decemberTotalRevenueRub: 100_154_901,
  decemberNewModelsRevenueMln: 85.11,
  decemberNewModelsRevenueRub: 85_114_000,
  decemberNewModelsSets: 41_400,
  decemberActingBornersRevenueMln: 15.04,
  decemberActingBornersRevenueRub: 15_040_901,
  annualTotalRevenueMln: 606.37,
  annualTotalRevenueRub: 606_372_182,
  annualNewModelsRevenueRub: 429_193_640,
  annualActingBornersRevenueRub: 177_178_542,
  newVariantsCount: 16,
  confirmedActingSkusCount: 5,
  unverifiedActingSkusCount: 2,
  monthlyTotalRevenueMln: [
    14.2, 16.6, 19.3, 26.9, 32.8, 43.2, 51.0, 60.2, 71.5, 80.7, 89.7, 100.2,
  ],
  familyDecemberSummary: [
    {
      familyCode: 'COLOR 4 PACK',
      label: '001 · ЯРКИЕ (COLOR 4 PACK)',
      launchLabel: 'Старт янв',
      decemberSets: 4800,
      decemberRevenueMln: 11.95,
      variantsCount: 2,
    },
    {
      familyCode: 'RIB CORE',
      label: '002 · RIB CORE',
      launchLabel: 'Старт мар',
      decemberSets: 3800,
      decemberRevenueMln: 6.84,
      variantsCount: 1,
    },
    {
      familyCode: 'FAMILY 4 PACK',
      label: '003 · FAMILY / однотонные',
      launchLabel: 'Старт янв',
      decemberSets: 3000,
      decemberRevenueMln: 5.97,
      variantsCount: 1,
    },
    {
      familyCode: 'DAILY',
      label: '004 · DAILY (7 палитр)',
      launchLabel: 'Старт мар *',
      decemberSets: 19100,
      decemberRevenueMln: 38.01,
      variantsCount: 7,
    },
    {
      familyCode: 'BRIEF A',
      label: '005 · BRIEF A (4 палитры)',
      launchLabel: 'Старт апр',
      decemberSets: 6400,
      decemberRevenueMln: 15.94,
      variantsCount: 4,
    },
    {
      familyCode: 'WOVEN 2PACK',
      label: '006 · Полосатые семейники / 2PACK',
      launchLabel: 'Старт апр',
      decemberSets: 4300,
      decemberRevenueMln: 6.41,
      variantsCount: 1,
    },
  ],
} as const;

export const S1_100M_NEW_VARIANTS: S1NewVariantSpec[] = [
  {
    variantId: 'BRN-001-SC',
    modelId: 'BRN-001',
    familyCode: 'COLOR 4 PACK',
    title: '001 · ЯРКИЕ / Sorbet Club',
    paletteTitle: 'Sorbet Club (4 шт.)',
    unitsInPack: 4,
    plannedPriceRub: 2490,
    isPriceHypothesis: false,
    launchMonthIdx: 0,
    launchMonthLabel: 'январь 2027',
    isLaunchDateHypothesis: false,
    unitCostRub: 600,
    unitCostLabel: '600 ₽ / комплект',
    isCostConfirmed: true,
    priorityLabel: 'Высокий',
    techPdfFilename: 'BORNERS_001_FACTORY_PRODUCT_CARD_v2(1).pdf',
    techPdfStaticUrl: 'docs/s1-100m/original_tech_pdfs/BRN-001-SC.pdf',
    specSummary:
      'COLOR 4 PACK · Палитра Sorbet Club · Жаккардовый пояс BORNERS тон в тон · 4 шт. в комплекте.',
    imageUrl: 'images/products/s1-100m/BRN-001-SC.jpg',
    galleryUrls: ['images/products/s1-100m/BRN-001-SC.jpg'],
    colors: [
      { nameRu: 'Персиковый сорбет', pantone: 'PANTONE 15-1520 TCX *', hex: '#E59B8C' },
      { nameRu: 'Лавандовый голубой', pantone: 'PANTONE 15-3920 TCX *', hex: '#8CA3D8' },
      { nameRu: 'Манговый жёлтый', pantone: 'PANTONE 14-0952 TCX *', hex: '#E4AC3E' },
      { nameRu: 'Мятный бирюзовый', pantone: 'PANTONE 15-5728 TCX *', hex: '#54C49F' },
    ],
    monthlyBuyoutsSets: [115, 271, 448, 640, 844, 1058, 1281, 1512, 1750, 1994, 2244, 2500],
    monthlyRevenueMln: [0.29, 0.67, 1.12, 1.59, 2.1, 2.63, 3.19, 3.76, 4.36, 4.97, 5.59, 6.22],
    decemberBuyoutsSets: 2500,
    decemberRevenueMln: 6.22,
    annualRevenueMln: 36.5,
  },
  {
    variantId: 'BRN-001-RV',
    modelId: 'BRN-001',
    familyCode: 'COLOR 4 PACK',
    title: '001 · ЯРКИЕ / Riviera',
    paletteTitle: 'Riviera (4 шт.)',
    unitsInPack: 4,
    plannedPriceRub: 2490,
    isPriceHypothesis: false,
    launchMonthIdx: 0,
    launchMonthLabel: 'январь 2027',
    isLaunchDateHypothesis: false,
    unitCostRub: 600,
    unitCostLabel: '600 ₽ / комплект',
    isCostConfirmed: true,
    priorityLabel: 'Высокий',
    techPdfFilename: 'BORNERS_001_FACTORY_PRODUCT_CARD_v2(1).pdf',
    techPdfStaticUrl: 'docs/s1-100m/original_tech_pdfs/BRN-001-RV.pdf',
    specSummary:
      'COLOR 4 PACK · Палитра Riviera · Жаккардовый пояс BORNERS тон в тон · 4 шт. в комплекте.',
    imageUrl: 'images/products/s1-100m/BRN-001-RV.jpg',
    galleryUrls: ['images/products/s1-100m/BRN-001-RV.jpg'],
    colors: [
      { nameRu: 'Терракотовый коралл', pantone: 'PANTONE 16-1348 TCX *', hex: '#E58A54' },
      { nameRu: 'Морская лагуна', pantone: 'PANTONE 16-5421 TCX *', hex: '#4AA89E' },
      { nameRu: 'Песочный солнечный', pantone: 'PANTONE 14-0848 TCX *', hex: '#E1B559' },
      { nameRu: 'Лазурный Ривьера', pantone: 'PANTONE 17-4037 TCX *', hex: '#6380BC' },
    ],
    monthlyBuyoutsSets: [106, 249, 412, 589, 777, 974, 1179, 1391, 1610, 1835, 2065, 2300],
    monthlyRevenueMln: [0.26, 0.62, 1.03, 1.47, 1.93, 2.43, 2.94, 3.46, 4.01, 4.57, 5.14, 5.73],
    decemberBuyoutsSets: 2300,
    decemberRevenueMln: 5.73,
    annualRevenueMln: 33.58,
  },
  {
    variantId: 'BRN-002',
    modelId: 'BRN-002',
    familyCode: 'RIB CORE',
    title: '002 · RIB CORE',
    paletteTitle: 'RIB CORE — Рубчик (4 шт.)',
    unitsInPack: 4,
    plannedPriceRub: 1800,
    isPriceHypothesis: false,
    launchMonthIdx: 2,
    launchMonthLabel: 'март 2027',
    isLaunchDateHypothesis: false,
    unitCostRub: 525,
    unitCostLabel: '500–550 ₽ / комплект',
    isCostConfirmed: true,
    priorityLabel: 'Не указан',
    techPdfFilename: 'BORNERS_RIB_CORE_PROTOTYPE_RU_CN.pdf',
    techPdfStaticUrl: 'docs/s1-100m/original_tech_pdfs/BRN-002.pdf',
    specSummary: 'Рубчик / жаккард BORNERS тон в тон / 4 шт. Старт продаж: март 2027.',
    imageUrl: 'images/products/s1-100m/BRN-002.jpg',
    galleryUrls: ['images/products/s1-100m/BRN-002.jpg'],
    colors: [
      { nameRu: 'Тёплый бежевый меланж', pantone: 'PANTONE 14-1107 TCX *', hex: '#BDB4A8' },
      { nameRu: 'Глубокий индиго', pantone: 'PANTONE 19-4027 TCX *', hex: '#384D6B' },
      { nameRu: 'Графитовый уголь', pantone: 'PANTONE 19-3908 TCX *', hex: '#4B4B4A' },
      { nameRu: 'Дымчатый шалфей', pantone: 'PANTONE 16-4706 TCX *', hex: '#8FA2A5' },
    ],
    monthlyBuyoutsSets: [0, 0, 219, 516, 854, 1220, 1609, 2017, 2442, 2881, 3335, 3800],
    monthlyRevenueMln: [0.0, 0.0, 0.39, 0.93, 1.54, 2.2, 2.9, 3.63, 4.4, 5.19, 6.0, 6.84],
    decemberBuyoutsSets: 3800,
    decemberRevenueMln: 6.84,
    annualRevenueMln: 34.01,
  },
  {
    variantId: 'BRN-003',
    modelId: 'BRN-003',
    familyCode: 'FAMILY 4 PACK',
    title: '003 · FAMILY / однотонные',
    paletteTitle: 'FAMILY 4 PACK — однотонные (4 шт.)',
    unitsInPack: 4,
    plannedPriceRub: 1990,
    isPriceHypothesis: false,
    launchMonthIdx: 0,
    launchMonthLabel: 'январь 2027',
    isLaunchDateHypothesis: false,
    unitCostRub: 625,
    unitCostLabel: '600–650 ₽ / комплект',
    isCostConfirmed: true,
    priorityLabel: 'Средний',
    techPdfFilename: 'BORNERS_FAMILY_CARD_RU.pdf',
    techPdfStaticUrl: 'docs/s1-100m/original_tech_pdfs/BRN-003.pdf',
    specSummary:
      'FAMILY 4 PACK · Однотонные семейники свободного кроя с центральной нашивкой BORNERS и пуговицами · 4 шт.',
    imageUrl: 'images/products/s1-100m/BRN-003.jpg',
    galleryUrls: ['images/products/s1-100m/BRN-003.jpg'],
    colors: [
      { nameRu: 'Чёрный классический', pantone: 'PANTONE 19-4007 TCX *', hex: '#1B1C1E' },
      { nameRu: 'Серо-стальной', pantone: 'PANTONE 17-3914 TCX *', hex: '#6F7685' },
      { nameRu: 'Тёмно-синий Navy', pantone: 'PANTONE 19-4024 TCX *', hex: '#262D47' },
      { nameRu: 'Деним голубой', pantone: 'PANTONE 17-4028 TCX *', hex: '#4B6B8E' },
    ],
    monthlyBuyoutsSets: [138, 325, 538, 768, 1013, 1270, 1538, 1815, 2100, 2393, 2693, 3000],
    monthlyRevenueMln: [0.27, 0.65, 1.07, 1.53, 2.02, 2.53, 3.06, 3.61, 4.18, 4.76, 5.36, 5.97],
    decemberBuyoutsSets: 3000,
    decemberRevenueMln: 5.97,
    annualRevenueMln: 35.01,
  },
  {
    variantId: 'BRN-DLY-01',
    modelId: 'BRN-004',
    familyCode: 'DAILY',
    title: '004 · DAILY / Тёмная база',
    paletteTitle: '01 · Тёмная база (4 шт.)',
    unitsInPack: 4,
    plannedPriceRub: 1990,
    isPriceHypothesis: true,
    launchMonthIdx: 2,
    launchMonthLabel: 'март * 2027',
    isLaunchDateHypothesis: true,
    unitCostRub: 0,
    unitCostLabel: 'не указана',
    isCostConfirmed: false,
    priorityLabel: 'Высший',
    techPdfFilename: '01_Тёмная_база_RU_CN.pdf',
    techPdfStaticUrl: 'docs/s1-100m/original_tech_pdfs/BRN-DLY-01.pdf',
    specSummary: 'Ткань 95/5; матовый пояс 35 мм без надписей; цвета по PDF.',
    imageUrl: 'images/products/s1-100m/BRN-DLY-01.jpg',
    galleryUrls: ['images/products/s1-100m/BRN-DLY-01.jpg'],
    colors: [
      { nameRu: 'Глубокий графит', pantone: 'По техкарте 01_Тёмная_база *', hex: '#2B2C2B' },
      { nameRu: 'Тёмно-синий Midnight', pantone: 'По техкарте 01_Тёмная_база *', hex: '#232B3A' },
      { nameRu: 'Хвойный изумруд', pantone: 'По техкарте 01_Тёмная_база *', hex: '#213B2D' },
      { nameRu: 'Горький шоколад', pantone: 'По техкарте 01_Тёмная_база *', hex: '#382E26' },
    ],
    monthlyBuyoutsSets: [0, 0, 259, 612, 1011, 1445, 1905, 2388, 2892, 3412, 3949, 4500],
    monthlyRevenueMln: [0.0, 0.0, 0.52, 1.22, 2.01, 2.88, 3.79, 4.75, 5.76, 6.79, 7.86, 8.96],
    decemberBuyoutsSets: 4500,
    decemberRevenueMln: 8.96,
    annualRevenueMln: 44.52,
  },
  {
    variantId: 'BRN-DLY-02',
    modelId: 'BRN-004',
    familyCode: 'DAILY',
    title: '004 · DAILY / Хвойный лес',
    paletteTitle: '02 · Хвойный лес (4 шт.)',
    unitsInPack: 4,
    plannedPriceRub: 1990,
    isPriceHypothesis: true,
    launchMonthIdx: 2,
    launchMonthLabel: 'март * 2027',
    isLaunchDateHypothesis: true,
    unitCostRub: 0,
    unitCostLabel: 'не указана',
    isCostConfirmed: false,
    priorityLabel: 'Высший',
    techPdfFilename: '02_Хвойный_лес_RU_CN.pdf',
    techPdfStaticUrl: 'docs/s1-100m/original_tech_pdfs/BRN-DLY-02.pdf',
    specSummary: 'Ткань 95/5; матовый пояс 35 мм без надписей; цвета по PDF.',
    imageUrl: 'images/products/s1-100m/BRN-DLY-02.jpg',
    galleryUrls: ['images/products/s1-100m/BRN-DLY-02.jpg'],
    colors: [
      { nameRu: 'Тёмная хвоя', pantone: 'По техкарте 02_Хвойный_лес *', hex: '#283930' },
      { nameRu: 'Лесной мох', pantone: 'По техкарте 02_Хвойный_лес *', hex: '#4B5343' },
      { nameRu: 'Северный кедр', pantone: 'По техкарте 02_Хвойный_лес *', hex: '#2A3F42' },
      { nameRu: 'Мокрый базальт', pantone: 'По техкарте 02_Хвойный_лес *', hex: '#333635' },
    ],
    monthlyBuyoutsSets: [0, 0, 178, 421, 697, 995, 1312, 1645, 1992, 2351, 2720, 3100],
    monthlyRevenueMln: [0.0, 0.0, 0.35, 0.84, 1.39, 1.98, 2.61, 3.27, 3.96, 4.68, 5.41, 6.17],
    decemberBuyoutsSets: 3100,
    decemberRevenueMln: 6.17,
    annualRevenueMln: 30.67,
  },
  {
    variantId: 'BRN-DLY-03',
    modelId: 'BRN-004',
    familyCode: 'DAILY',
    title: '004 · DAILY / Тёплые оттенки',
    paletteTitle: '03 · Тёплые оттенки (4 шт.)',
    unitsInPack: 4,
    plannedPriceRub: 1990,
    isPriceHypothesis: true,
    launchMonthIdx: 2,
    launchMonthLabel: 'март * 2027',
    isLaunchDateHypothesis: true,
    unitCostRub: 0,
    unitCostLabel: 'не указана',
    isCostConfirmed: false,
    priorityLabel: 'Высший',
    techPdfFilename: '03_Тёплые_оттенки_RU_CN.pdf',
    techPdfStaticUrl: 'docs/s1-100m/original_tech_pdfs/BRN-DLY-03.pdf',
    specSummary: 'Ткань 95/5; матовый пояс 35 мм без надписей; цвета по PDF.',
    imageUrl: 'images/products/s1-100m/BRN-DLY-03.jpg',
    galleryUrls: ['images/products/s1-100m/BRN-DLY-03.jpg'],
    colors: [
      { nameRu: 'Кофейный брауни', pantone: 'По техкарте 03_Тёплые_оттенки *', hex: '#3D2B27' },
      { nameRu: 'Тёмный эспрессо', pantone: 'По техкарте 03_Тёплые_оттенки *', hex: '#332C2E' },
      { nameRu: 'Тёплый тауп', pantone: 'По техкарте 03_Тёплые_оттенки *', hex: '#AFA69B' },
      { nameRu: 'Миндальное молоко', pantone: 'По техкарте 03_Тёплые_оттенки *', hex: '#D8CFC4' },
    ],
    monthlyBuyoutsSets: [0, 0, 127, 299, 494, 706, 931, 1168, 1414, 1668, 1931, 2200],
    monthlyRevenueMln: [0.0, 0.0, 0.25, 0.6, 0.98, 1.4, 1.85, 2.32, 2.81, 3.32, 3.84, 4.38],
    decemberBuyoutsSets: 2200,
    decemberRevenueMln: 4.38,
    annualRevenueMln: 21.77,
  },
  {
    variantId: 'BRN-DLY-04',
    modelId: 'BRN-004',
    familyCode: 'DAILY',
    title: '004 · DAILY / Холодные оттенки',
    paletteTitle: '04 · Холодные оттенки (4 шт.)',
    unitsInPack: 4,
    plannedPriceRub: 1990,
    isPriceHypothesis: true,
    launchMonthIdx: 2,
    launchMonthLabel: 'март * 2027',
    isLaunchDateHypothesis: true,
    unitCostRub: 0,
    unitCostLabel: 'не указана',
    isCostConfirmed: false,
    priorityLabel: 'Высший',
    techPdfFilename: '04_Холодные_оттенки_RU_CN.pdf',
    techPdfStaticUrl: 'docs/s1-100m/original_tech_pdfs/BRN-DLY-04.pdf',
    specSummary: 'Ткань 95/5; матовый пояс 35 мм без надписей; цвета по PDF.',
    imageUrl: 'images/products/s1-100m/BRN-DLY-04.jpg',
    galleryUrls: ['images/products/s1-100m/BRN-DLY-04.jpg'],
    colors: [
      { nameRu: 'Глубокий океан', pantone: 'По техкарте 04_Холодные_оттенки *', hex: '#232B3A' },
      { nameRu: 'Северный фьорд', pantone: 'По техкарте 04_Холодные_оттенки *', hex: '#263D3D' },
      { nameRu: 'Ледяной серый', pantone: 'По техкарте 04_Холодные_оттенки *', hex: '#9EA8B0' },
      { nameRu: 'Антрацит', pantone: 'По техкарте 04_Холодные_оттенки *', hex: '#2F3032' },
    ],
    monthlyBuyoutsSets: [0, 0, 184, 435, 719, 1027, 1355, 1698, 2056, 2427, 2808, 3200],
    monthlyRevenueMln: [0.0, 0.0, 0.37, 0.87, 1.43, 2.04, 2.7, 3.38, 4.09, 4.83, 5.59, 6.37],
    decemberBuyoutsSets: 3200,
    decemberRevenueMln: 6.37,
    annualRevenueMln: 31.66,
  },
  {
    variantId: 'BRN-DLY-05',
    modelId: 'BRN-004',
    familyCode: 'DAILY',
    title: '004 · DAILY / Классический микс',
    paletteTitle: '05 · Классический микс (4 шт.)',
    unitsInPack: 4,
    plannedPriceRub: 1990,
    isPriceHypothesis: true,
    launchMonthIdx: 2,
    launchMonthLabel: 'март * 2027',
    isLaunchDateHypothesis: true,
    unitCostRub: 0,
    unitCostLabel: 'не указана',
    isCostConfirmed: false,
    priorityLabel: 'Высший',
    techPdfFilename: '05_Классический_микс_RU_CN.pdf',
    techPdfStaticUrl: 'docs/s1-100m/original_tech_pdfs/BRN-DLY-05.pdf',
    specSummary: 'Ткань 95/5; матовый пояс 35 мм без надписей; цвета по PDF.',
    imageUrl: 'images/products/s1-100m/BRN-DLY-05.jpg',
    galleryUrls: ['images/products/s1-100m/BRN-DLY-05.jpg'],
    colors: [
      { nameRu: 'Чёрный оникс', pantone: 'По техкарте 05_Классический_микс *', hex: '#2A2B2A' },
      { nameRu: 'Классический синий', pantone: 'По техкарте 05_Классический_микс *', hex: '#262E3F' },
      { nameRu: 'Каменный беж', pantone: 'По техкарте 05_Классический_микс *', hex: '#ADA398' },
      { nameRu: 'Светлый айвори', pantone: 'По техкарте 05_Классический_микс *', hex: '#DCD5CA' },
    ],
    monthlyBuyoutsSets: [0, 0, 161, 381, 629, 899, 1185, 1486, 1799, 2123, 2457, 2800],
    monthlyRevenueMln: [0.0, 0.0, 0.32, 0.76, 1.25, 1.79, 2.36, 2.96, 3.58, 4.22, 4.89, 5.57],
    decemberBuyoutsSets: 2800,
    decemberRevenueMln: 5.57,
    annualRevenueMln: 27.7,
  },
  {
    variantId: 'BRN-DLY-06',
    modelId: 'BRN-004',
    familyCode: 'DAILY',
    title: '004 · DAILY / Сумерки',
    paletteTitle: '06 · Сумерки (4 шт.)',
    unitsInPack: 4,
    plannedPriceRub: 1990,
    isPriceHypothesis: true,
    launchMonthIdx: 2,
    launchMonthLabel: 'март * 2027',
    isLaunchDateHypothesis: true,
    unitCostRub: 0,
    unitCostLabel: 'не указана',
    isCostConfirmed: false,
    priorityLabel: 'Высший',
    techPdfFilename: '06_Сумерки_RU_CN.pdf',
    techPdfStaticUrl: 'docs/s1-100m/original_tech_pdfs/BRN-DLY-06.pdf',
    specSummary: 'Ткань 95/5; матовый пояс 35 мм без надписей; цвета по PDF.',
    imageUrl: 'images/products/s1-100m/BRN-DLY-06.jpg',
    galleryUrls: ['images/products/s1-100m/BRN-DLY-06.jpg'],
    colors: [
      { nameRu: 'Тёмный сливовый', pantone: 'По техкарте 06_Сумерки *', hex: '#34292E' },
      { nameRu: 'Древесный мускат', pantone: 'По техкарте 06_Сумерки *', hex: '#3D302A' },
      { nameRu: 'Ночной индиго', pantone: 'По техкарте 06_Сумерки *', hex: '#232B3A' },
      { nameRu: 'Туманный голубой', pantone: 'По техкарте 06_Сумерки *', hex: '#9DA7B0' },
    ],
    monthlyBuyoutsSets: [0, 0, 104, 245, 404, 578, 762, 955, 1157, 1365, 1580, 1800],
    monthlyRevenueMln: [0.0, 0.0, 0.21, 0.49, 0.8, 1.15, 1.52, 1.9, 2.3, 2.72, 3.14, 3.58],
    decemberBuyoutsSets: 1800,
    decemberRevenueMln: 3.58,
    annualRevenueMln: 17.81,
  },
  {
    variantId: 'BRN-DLY-07',
    modelId: 'BRN-004',
    familyCode: 'DAILY',
    title: '004 · DAILY / Светлый микс',
    paletteTitle: '07 · Светлый микс (4 шт.)',
    unitsInPack: 4,
    plannedPriceRub: 1990,
    isPriceHypothesis: true,
    launchMonthIdx: 2,
    launchMonthLabel: 'март * 2027',
    isLaunchDateHypothesis: true,
    unitCostRub: 0,
    unitCostLabel: 'не указана',
    isCostConfirmed: false,
    priorityLabel: 'Высший',
    techPdfFilename: '07_Светлый_микс_RU_CN.pdf',
    techPdfStaticUrl: 'docs/s1-100m/original_tech_pdfs/BRN-DLY-07.pdf',
    specSummary: 'Ткань 95/5; матовый пояс 35 мм без надписей; цвета по PDF.',
    imageUrl: 'images/products/s1-100m/BRN-DLY-07.jpg',
    galleryUrls: ['images/products/s1-100m/BRN-DLY-07.jpg'],
    colors: [
      { nameRu: 'Молочный крем', pantone: 'По техкарте 07_Светлый_микс *', hex: '#DDD6CA' },
      { nameRu: 'Песочный кашемир', pantone: 'По техкарте 07_Светлый_микс *', hex: '#AFA69B' },
      { nameRu: 'Светлый серо-голубой', pantone: 'По техкарте 07_Светлый_микс *', hex: '#9EA8B0' },
      { nameRu: 'Глубокий шалфей', pantone: 'По техкарте 07_Светлый_микс *', hex: '#38463B' },
    ],
    monthlyBuyoutsSets: [0, 0, 86, 204, 337, 482, 635, 796, 964, 1137, 1316, 1500],
    monthlyRevenueMln: [0.0, 0.0, 0.17, 0.41, 0.67, 0.96, 1.26, 1.58, 1.92, 2.26, 2.62, 2.98],
    decemberBuyoutsSets: 1500,
    decemberRevenueMln: 2.98,
    annualRevenueMln: 14.84,
  },
  {
    variantId: 'BRN-BRF-A-01',
    modelId: 'BRN-005',
    familyCode: 'BRIEF A',
    title: '005 · BRIEF / Чёрный × 4',
    paletteTitle: '01 · Чёрный × 4 (4 шт.)',
    unitsInPack: 4,
    plannedPriceRub: 2490,
    isPriceHypothesis: false,
    launchMonthIdx: 3,
    launchMonthLabel: 'апрель 2027',
    isLaunchDateHypothesis: false,
    unitCostRub: 620,
    unitCostLabel: '620 ₽ / комплект',
    isCostConfirmed: true,
    priorityLabel: 'Не указан',
    techPdfFilename: '01_Чёрный_4шт_RU_CN.pdf',
    techPdfStaticUrl: 'docs/s1-100m/original_tech_pdfs/BRN-BRF-A-01.pdf',
    specSummary: 'Пояс 32 мм; ровно 3 BORNERS на переднем участке. Старт продаж: апрель 2027.',
    imageUrl: 'images/products/s1-100m/BRN-BRF-A-01.jpg',
    galleryUrls: ['images/products/s1-100m/BRN-BRF-A-01.jpg'],
    colors: [
      { nameRu: 'Чёрный уголь #1', pantone: 'PANTONE 19-4007 TCX *', hex: '#1B1C1E' },
      { nameRu: 'Чёрный уголь #2', pantone: 'PANTONE 19-4007 TCX *', hex: '#1B1C1E' },
      { nameRu: 'Чёрный уголь #3', pantone: 'PANTONE 19-4007 TCX *', hex: '#1B1C1E' },
      { nameRu: 'Чёрный уголь #4', pantone: 'PANTONE 19-4007 TCX *', hex: '#1B1C1E' },
    ],
    monthlyBuyoutsSets: [0, 0, 0, 131, 310, 512, 732, 965, 1210, 1465, 1728, 2000],
    monthlyRevenueMln: [0.0, 0.0, 0.0, 0.33, 0.77, 1.27, 1.82, 2.4, 3.01, 3.65, 4.3, 4.98],
    decemberBuyoutsSets: 2000,
    decemberRevenueMln: 4.98,
    annualRevenueMln: 22.54,
  },
  {
    variantId: 'BRN-BRF-A-02',
    modelId: 'BRN-005',
    familyCode: 'BRIEF A',
    title: '005 · BRIEF / Белый × 4',
    paletteTitle: '02 · Белый × 4 (4 шт.)',
    unitsInPack: 4,
    plannedPriceRub: 2490,
    isPriceHypothesis: false,
    launchMonthIdx: 3,
    launchMonthLabel: 'апрель 2027',
    isLaunchDateHypothesis: false,
    unitCostRub: 620,
    unitCostLabel: '620 ₽ / комплект',
    isCostConfirmed: true,
    priorityLabel: 'Не указан',
    techPdfFilename: '02_Белый_4шт_RU_CN.pdf',
    techPdfStaticUrl: 'docs/s1-100m/original_tech_pdfs/BRN-BRF-A-02.pdf',
    specSummary: 'Пояс 32 мм; ровно 3 BORNERS на переднем участке. Старт продаж: апрель 2027.',
    imageUrl: 'images/products/s1-100m/BRN-BRF-A-02.jpg',
    galleryUrls: ['images/products/s1-100m/BRN-BRF-A-02.jpg'],
    colors: [
      { nameRu: 'Белый оптический #1', pantone: 'PANTONE 11-0601 TCX *', hex: '#F3F2EE' },
      { nameRu: 'Белый оптический #2', pantone: 'PANTONE 11-0601 TCX *', hex: '#F3F2EE' },
      { nameRu: 'Белый оптический #3', pantone: 'PANTONE 11-0601 TCX *', hex: '#F3F2EE' },
      { nameRu: 'Белый оптический #4', pantone: 'PANTONE 11-0601 TCX *', hex: '#F3F2EE' },
    ],
    monthlyBuyoutsSets: [0, 0, 0, 105, 248, 410, 585, 772, 968, 1172, 1383, 1600],
    monthlyRevenueMln: [0.0, 0.0, 0.0, 0.26, 0.62, 1.02, 1.46, 1.92, 2.41, 2.92, 3.44, 3.98],
    decemberBuyoutsSets: 1600,
    decemberRevenueMln: 3.98,
    annualRevenueMln: 18.04,
  },
  {
    variantId: 'BRN-BRF-A-03',
    modelId: 'BRN-005',
    familyCode: 'BRIEF A',
    title: '005 · BRIEF / Тёмный микс',
    paletteTitle: '03 · Тёмный микс (4 шт.)',
    unitsInPack: 4,
    plannedPriceRub: 2490,
    isPriceHypothesis: false,
    launchMonthIdx: 3,
    launchMonthLabel: 'апрель 2027',
    isLaunchDateHypothesis: false,
    unitCostRub: 620,
    unitCostLabel: '620 ₽ / комплект',
    isCostConfirmed: true,
    priorityLabel: 'Не указан',
    techPdfFilename: '03_Тёмный_микс_RU_CN.pdf',
    techPdfStaticUrl: 'docs/s1-100m/original_tech_pdfs/BRN-BRF-A-03.pdf',
    specSummary: 'Пояс 32 мм; ровно 3 BORNERS на переднем участке. Старт продаж: апрель 2027.',
    imageUrl: 'images/products/s1-100m/BRN-BRF-A-03.jpg',
    galleryUrls: ['images/products/s1-100m/BRN-BRF-A-03.jpg'],
    colors: [
      { nameRu: 'Чёрный уголь', pantone: 'PANTONE 19-4007 TCX *', hex: '#1B1C1E' },
      { nameRu: 'Тёмный графит', pantone: 'PANTONE 19-3908 TCX *', hex: '#3B3C3E' },
      { nameRu: 'Хвойный изумруд', pantone: 'PANTONE 19-5420 TCX *', hex: '#1E382D' },
      { nameRu: 'Глубокий Navy', pantone: 'PANTONE 19-4024 TCX *', hex: '#1E273B' },
    ],
    monthlyBuyoutsSets: [0, 0, 0, 108, 256, 423, 604, 796, 998, 1208, 1426, 1650],
    monthlyRevenueMln: [0.0, 0.0, 0.0, 0.27, 0.64, 1.05, 1.5, 1.98, 2.49, 3.01, 3.55, 4.11],
    decemberBuyoutsSets: 1650,
    decemberRevenueMln: 4.11,
    annualRevenueMln: 18.6,
  },
  {
    variantId: 'BRN-BRF-A-04',
    modelId: 'BRN-005',
    familyCode: 'BRIEF A',
    title: '005 · BRIEF / Светлый микс',
    paletteTitle: '04 · Светлый микс (4 шт.)',
    unitsInPack: 4,
    plannedPriceRub: 2490,
    isPriceHypothesis: false,
    launchMonthIdx: 3,
    launchMonthLabel: 'апрель 2027',
    isLaunchDateHypothesis: false,
    unitCostRub: 620,
    unitCostLabel: '620 ₽ / комплект',
    isCostConfirmed: true,
    priorityLabel: 'Не указан',
    techPdfFilename: '04_Светлый_микс_RU_CN.pdf',
    techPdfStaticUrl: 'docs/s1-100m/original_tech_pdfs/BRN-BRF-A-04.pdf',
    specSummary: 'Пояс 32 мм; ровно 3 BORNERS на переднем участке. Старт продаж: апрель 2027.',
    imageUrl: 'images/products/s1-100m/BRN-BRF-A-04.jpg',
    galleryUrls: ['images/products/s1-100m/BRN-BRF-A-04.jpg'],
    colors: [
      { nameRu: 'Молочно-белый', pantone: 'PANTONE 11-0602 TCX *', hex: '#ECEAE4' },
      { nameRu: 'Светло-серый жемчуг', pantone: 'PANTONE 14-4102 TCX *', hex: '#C7C9CB' },
      { nameRu: 'Небесно-голубой лёд', pantone: 'PANTONE 15-4008 TCX *', hex: '#9BB0C1' },
      { nameRu: 'Песочный беж', pantone: 'PANTONE 14-1108 TCX *', hex: '#C5B9AC' },
    ],
    monthlyBuyoutsSets: [0, 0, 0, 75, 178, 294, 421, 555, 696, 842, 994, 1150],
    monthlyRevenueMln: [0.0, 0.0, 0.0, 0.19, 0.44, 0.73, 1.05, 1.38, 1.73, 2.1, 2.48, 2.86],
    decemberBuyoutsSets: 1150,
    decemberRevenueMln: 2.86,
    annualRevenueMln: 12.96,
  },
  {
    variantId: 'BRN-WVN-01',
    modelId: 'BRN-006',
    familyCode: 'WOVEN 2PACK',
    title: '006 · Полосатые семейники / 2PACK',
    paletteTitle: 'WOVEN 2PACK — Синий + Оливковый (2 шт.)',
    unitsInPack: 2,
    plannedPriceRub: 1490,
    isPriceHypothesis: true,
    launchMonthIdx: 3,
    launchMonthLabel: 'апрель 2027',
    isLaunchDateHypothesis: false,
    unitCostRub: 0,
    unitCostLabel: 'не указана',
    isCostConfirmed: false,
    priorityLabel: 'Не указан',
    techPdfFilename: '01_Семейники_2PACK_техкарта_RU_CN.pdf',
    techPdfStaticUrl: 'docs/s1-100m/original_tech_pdfs/BRN-WVN-01.pdf',
    specSummary:
      'Поплин 100% хлопок; закрытый пояс; старт с апреля. Синий + оливковый: 2PACK; красный — только вариант котировки фабрики для 3PACK.',
    imageUrl: 'images/products/s1-100m/BRN-WVN-01.jpg',
    galleryUrls: [
      'images/products/s1-100m/BRN-WVN-01.jpg',
      'images/products/s1-100m/BRN-WVN-01-blue.jpg',
      'images/products/s1-100m/BRN-WVN-01-olive.jpg',
      'images/products/s1-100m/BRN-WVN-01-red.jpg',
    ],
    colors: [
      { nameRu: 'Синяя полоска (входит в 2PACK)', pantone: 'По техкарте WOVEN 2PACK *', hex: '#96AABF' },
      { nameRu: 'Оливковая полоска (входит в 2PACK)', pantone: 'По техкарте WOVEN 2PACK *', hex: '#9EB3A7' },
      { nameRu: 'Красная полоска (только для расчёта 3PACK)', pantone: 'Котировка фабрики 3PACK *', hex: '#C7A3A1' },
    ],
    monthlyBuyoutsSets: [0, 0, 0, 282, 666, 1101, 1573, 2075, 2601, 3149, 3716, 4300],
    monthlyRevenueMln: [0.0, 0.0, 0.0, 0.42, 0.99, 1.64, 2.34, 3.09, 3.88, 4.69, 5.54, 6.41],
    decemberBuyoutsSets: 4300,
    decemberRevenueMln: 6.41,
    annualRevenueMln: 29.0,
  },
];

export function getS1NewVariantByCodeOrId(codeOrId: string): S1NewVariantSpec | undefined {
  const norm = codeOrId.trim().toUpperCase();
  return S1_100M_NEW_VARIANTS.find(
    (v) =>
      v.variantId.toUpperCase() === norm ||
      `SCEN-${v.variantId}`.toUpperCase() === norm ||
      v.title.toUpperCase() === norm
  );
}

export function isConfirmedBornersActingSku(wbSkuOrCode: string): boolean {
  const digits = wbSkuOrCode.replace(/\D/g, '');
  return (S1_100M_CONFIRMED_WB_SKUS as readonly string[]).includes(digits);
}

export function isUnverifiedActingSku(wbSkuOrCode: string): boolean {
  const digits = wbSkuOrCode.replace(/\D/g, '');
  return (S1_100M_UNVERIFIED_WB_SKUS as readonly string[]).includes(digits);
}

export function verifyScenarioS1_100M(): {
  valid: boolean;
  scenarioCode: string;
  newVariantsCount: number;
  confirmedActingSkusCount: number;
  unverifiedActingSkusCount: number;
  decemberNewSets: number;
  decemberNewRevenueRub: number;
  decemberActingBornersRevenueRub: number;
  decemberTotalRevenueRub: number;
  annualTotalRevenueRub: number;
  monthlyTotalRevenueMln: number[];
  zeroSalesBeforeLaunchValid: boolean;
} {
  const confirmedActing = ACTING_2027_SKUS.filter((s) =>
    (S1_100M_CONFIRMED_WB_SKUS as readonly string[]).includes(s.wbSku)
  );
  const unverifiedActing = ACTING_2027_SKUS.filter((s) =>
    (S1_100M_UNVERIFIED_WB_SKUS as readonly string[]).includes(s.wbSku)
  );

  const actingMonthlyRub = Array(12).fill(0);
  for (const s of confirmedActing) {
    for (let m = 0; m < 12; m++) {
      actingMonthlyRub[m] += s.monthly[m]?.revenue_rub || 0;
    }
  }

  const newMonthlyRub = Array(12).fill(0);
  const newMonthlySets = Array(12).fill(0);
  let zeroSalesBeforeLaunchValid = true;

  for (const v of S1_100M_NEW_VARIANTS) {
    for (let m = 0; m < 12; m++) {
      const sets = v.monthlyBuyoutsSets[m] || 0;
      if (m < v.launchMonthIdx && sets !== 0) {
        zeroSalesBeforeLaunchValid = false;
      }
      newMonthlySets[m] += sets;
      newMonthlyRub[m] += sets * v.plannedPriceRub;
    }
  }

  const decemberNewSets = newMonthlySets[11];
  const decemberNewRevenueRub = newMonthlyRub[11];
  const decemberActingBornersRevenueRub = actingMonthlyRub[11];
  const decemberTotalRevenueRub = decemberActingBornersRevenueRub + decemberNewRevenueRub;
  const annualTotalRevenueRub =
    actingMonthlyRub.reduce((a, b) => a + b, 0) + newMonthlyRub.reduce((a, b) => a + b, 0);

  const monthlyTotalRevenueMln = actingMonthlyRub.map(
    (actRub, idx) => Math.round(((actRub + newMonthlyRub[idx]) / 1_000_000) * 10) / 10
  );

  const valid =
    S1_100M_NEW_VARIANTS.length === 16 &&
    confirmedActing.length === 5 &&
    unverifiedActing.length === 2 &&
    decemberNewSets === S1_100M_CONTROL_TOTALS.decemberNewModelsSets &&
    decemberNewRevenueRub === S1_100M_CONTROL_TOTALS.decemberNewModelsRevenueRub &&
    decemberActingBornersRevenueRub === S1_100M_CONTROL_TOTALS.decemberActingBornersRevenueRub &&
    decemberTotalRevenueRub === S1_100M_CONTROL_TOTALS.decemberTotalRevenueRub &&
    annualTotalRevenueRub === S1_100M_CONTROL_TOTALS.annualTotalRevenueRub &&
    zeroSalesBeforeLaunchValid;

  return {
    valid,
    scenarioCode: S1_100M_SCENARIO_CODE,
    newVariantsCount: S1_100M_NEW_VARIANTS.length,
    confirmedActingSkusCount: confirmedActing.length,
    unverifiedActingSkusCount: unverifiedActing.length,
    decemberNewSets,
    decemberNewRevenueRub,
    decemberActingBornersRevenueRub,
    decemberTotalRevenueRub,
    annualTotalRevenueRub,
    monthlyTotalRevenueMln,
    zeroSalesBeforeLaunchValid,
  };
}

export const S1_100M_SCENARIO_MODELS: ScenarioModelSpec[] = S1_100M_NEW_VARIANTS.map((v) => {
  const scalePlan = (scenarioId: number, multiplier: number) => {
    const packs = v.monthlyBuyoutsSets.map((p, idx) =>
      idx < v.launchMonthIdx ? 0 : Math.round(p * multiplier)
    );
    return {
      scenarioId,
      monthlyPacks: packs,
      monthlyPricesRub: Array(12).fill(v.plannedPriceRub),
      monthlyReceiptsPacks: [...packs],
      initialStockPacks: 0,
      firstOrderPacks: 0, // Правило 08: до ввода сроков фабрики, MOQ и остатков не выставлять автоматические заказы
      nextOrderDateLabel: 'Не выставляется до ввода MOQ, сроков фабрики и остатков',
      salesStartMonthIdx: v.launchMonthIdx,
      warehouseArrivalMonthIdx: v.launchMonthIdx,
      warehouseArrivalDateLabel: `Старт: ${v.launchMonthLabel}`,
    };
  };

  const palette: PalettePack = {
    id: `pal-${v.variantId.toLowerCase()}`,
    title: `${v.variantId} — ${v.paletteTitle}`,
    subtitle: `${v.unitsInPack} шт. в комплекте · Старт: ${v.launchMonthLabel} · Приоритет: ${v.priorityLabel}`,
    statusLabel:
      v.isPriceHypothesis || v.isLaunchDateHypothesis
        ? 'ПРОГНОЗ · ГИПОТЕЗА (цена/старт)'
        : 'ПРОГНОЗ · ГИПОТЕЗА (объёмы)',
    imageUrl: v.imageUrl,
    colors: v.colors.map((c) => ({
      nameRu: c.nameRu,
      pantone: c.pantone,
      hex: c.hex,
      bandHex: c.hex,
      textHex: '#F9FAFB',
    })),
  };

  return {
    id: `scen-${v.variantId.toLowerCase()}`,
    code: v.variantId,
    title: v.title,
    subtitle: `${v.familyCode} · ${v.unitsInPack} шт. · Старт: ${v.launchMonthLabel} · Себестоимость: ${v.unitCostLabel}`,
    brandId: 'BORNERS',
    launchStatus: 'В разработке',
    unitsInPack: v.unitsInPack,
    retailPriceRub: v.plannedPriceRub,
    unitCostRub: v.unitCostRub,
    marketplaceFeePct: 0,
    logisticsRub: 0,
    adsPct: 0,
    responsiblePerson: `Приоритет: ${v.priorityLabel} · ${
      v.isPriceHypothesis || v.isLaunchDateHypothesis
        ? 'ГИПОТЕЗА (цена/дата запуска и объём)'
        : 'ГИПОТЕЗА (объём выкупов)'
    }`,
    hasActualSalesOrPurchases: false,
    palettes: [palette],
    gallery: v.galleryUrls.map((url, idx) => ({
      id: `gal-${v.variantId.toLowerCase()}-${idx + 1}`,
      category: 'pack',
      label: idx === 0 ? `Оригинальное фото ${v.variantId}` : `Фото ${v.variantId} #${idx + 1}`,
      url,
      isMain: idx === 0,
    })),
    attachedPdfs: [
      {
        id: `pdf-tech-${v.variantId.toLowerCase()}`,
        name: `original_tech_pdfs/${v.techPdfFilename}`,
        sizeBytes: 185400,
        uploadedAt: '02.11.2026',
        staticUrl: v.techPdfStaticUrl,
      },
      {
        id: `pdf-plan-s1-${v.variantId.toLowerCase()}`,
        name: 'BORNERS-2027-S1-100M — План роста 100 млн ₽ в месяц (28 стр.).pdf',
        sizeBytes: 2969931,
        uploadedAt: '02.11.2026',
        staticUrl: 'docs/s1-100m/BORNERS_2027_S1_100M_Plan.pdf',
      },
    ],
    construction: {
      type:
        v.familyCode === 'BRIEF A'
          ? 'Брифы мужские (4 шт. в комплекте)'
          : v.familyCode === 'WOVEN 2PACK'
          ? 'Семейники тканые поплин (2PACK)'
          : v.familyCode === 'FAMILY 4 PACK'
          ? 'Семейники трикотажные однотонные (4 шт.)'
          : 'Боксеры мужские (4 шт. в комплекте)',
      fit: `Модель ${v.modelId} · Вариант ${v.variantId}`,
      sideSeam: v.specSummary,
      frontPanel:
        v.familyCode === 'BRIEF A'
          ? 'Пояс 32 мм; ровно 3 логотипа BORNERS на переднем участке'
          : v.familyCode === 'DAILY'
          ? 'Анатомический гульфик, матовый пояс 35 мм без надписей'
          : 'Анатомический крой по производственной техкарте',
      gusset: 'Комфортная ластовица по заводской спецификации',
      seams: 'Плоские эластичные швы',
    },
    fabric: {
      composition:
        v.familyCode === 'WOVEN 2PACK'
          ? 'Поплин 100% хлопок'
          : v.familyCode === 'DAILY'
          ? '95% хлопок / 5% эластан'
          : '93–95% хлопок компакт-пенье / 5–7% эластан (по техкарте)',
      density: v.familyCode === 'WOVEN 2PACK' ? 'Поплин сорочечный' : '180–190 г/м²',
      knitType:
        v.familyCode === 'RIB CORE'
          ? 'Рубчик (Rib 1x1 / 2x2)'
          : v.familyCode === 'WOVEN 2PACK'
          ? 'Тканый поплин в полоску'
          : 'Кулирная гладь с эластаном',
      touchFeel: v.specSummary,
      swatchHex: v.colors[0]?.hex || '#1F242D',
    },
    waistband: {
      width:
        v.familyCode === 'BRIEF A'
          ? '32 мм'
          : v.familyCode === 'DAILY'
          ? '35 мм'
          : '35–38 мм',
      type:
        v.familyCode === 'DAILY'
          ? 'Матовый пояс 35 мм без надписей'
          : v.familyCode === 'BRIEF A'
          ? 'Жаккардовый пояс 32 мм (ровно 3 BORNERS спереди)'
          : v.familyCode === 'WOVEN 2PACK'
          ? 'Закрытый пояс в ткани изделия'
          : 'Жаккардовый пояс BORNERS тон в тон',
      colorRule: 'По техкарте original_tech_pdfs/' + v.techPdfFilename,
      logoRepeat:
        v.familyCode === 'DAILY'
          ? 'Без надписей (чистый матовый пояс)'
          : v.familyCode === 'BRIEF A'
          ? 'Ровно 3 BORNERS на переднем участке'
          : 'По заводской техкарте',
      elasticity: `Старт продаж: ${v.launchMonthLabel} · Приоритет: ${v.priorityLabel}`,
      bandBgHex: v.colors[0]?.hex || '#1F242D',
      bandTextHex: '#F9FAFB',
    },
    productionSteps: [
      {
        id: `ps-${v.variantId.toLowerCase()}-1`,
        stepNum: 1,
        title: `Техкарта: ${v.techPdfFilename}`,
        datesLabel: `Старт: ${v.launchMonthLabel}`,
        monthIndex: v.launchMonthIdx,
        dayOfMonth: 1,
        status: 'in_progress',
        confirmation:
          v.isPriceHypothesis || v.isLaunchDateHypothesis
            ? 'needs_confirmation'
            : 'factory_confirmed',
      },
      {
        id: `ps-${v.variantId.toLowerCase()}-2`,
        stepNum: 2,
        title: 'Ввод MOQ, сроков фабрики, размерной сетки и остатков',
        datesLabel: 'Правило 08: авто-заказы отключены до ввода',
        monthIndex: v.launchMonthIdx,
        dayOfMonth: 10,
        status: 'planned',
        confirmation: 'needs_confirmation',
      },
    ],
    plansByScenario: {
      1: scalePlan(1, 1),
      2: scalePlan(2, 1.45),
      3: scalePlan(3, 1.9),
    },
  };
});

export const S1_100M_CATALOG_PRODUCTS: Product[] = S1_100M_NEW_VARIANTS.map((v) => {
  const annualSets = v.monthlyBuyoutsSets.reduce((a, b) => a + b, 0);
  const annualRevRub = annualSets * v.plannedPriceRub;
  return {
    id: `prod-${v.variantId.toLowerCase()}`,
    sku: v.variantId,
    name: v.title,
    brandId: 'BORNERS',
    category:
      v.familyCode === 'BRIEF A'
        ? 'Брифы'
        : v.familyCode === 'WOVEN 2PACK' || v.familyCode === 'FAMILY 4 PACK'
        ? 'Мультипак'
        : 'Боксеры',
    productType: 'Базовая коллекция',
    collection: `Сценарий №1 (BORNERS-2027-S1-100M) · ${v.familyCode}`,
    priceSegment: 'Premium',
    status: 'active',
    description: `${v.title} (${v.variantId}, линейка ${v.familyCode}). Старт продаж: ${
      v.launchMonthLabel
    }. Плановая цена: ${v.plannedPriceRub.toLocaleString('ru-RU')} ₽${
      v.isPriceHypothesis ? ' (ГИПОТЕЗА)' : ''
    }. Себестоимость под ключ: ${v.unitCostLabel}. Выкупы в декабре 2027: ${v.decemberBuyoutsSets.toLocaleString(
      'ru-RU'
    )} компл. (${v.decemberRevenueMln.toFixed(2).replace('.', ',')} млн ₽). Годовой план 2027: ${annualSets.toLocaleString(
      'ru-RU'
    )} компл. (${v.annualRevenueMln.toFixed(2).replace('.', ',')} млн ₽). Техкарта: original_tech_pdfs/${
      v.techPdfFilename
    }. ${v.specSummary}`,
    ownerId: 'user-owner',
    imageUrl: v.imageUrl,
    galleryUrls: v.galleryUrls,
    colorCombinations: v.colors.map((c) => c.nameRu),
    materials:
      v.familyCode === 'WOVEN 2PACK'
        ? 'Поплин 100% хлопок'
        : v.familyCode === 'DAILY'
        ? '95% хлопок, 5% эластан'
        : '93% хлопок компакт-пенье, 7% эластан',
    fabricComposition:
      v.familyCode === 'WOVEN 2PACK'
        ? 'Поплин 100% хлопок'
        : v.familyCode === 'DAILY'
        ? '95% хлопок, 5% эластан'
        : '93% хлопок компакт-пенье, 7% эластан',
    fabricDensityGsm: v.familyCode === 'WOVEN 2PACK' ? 125 : 185,
    waistbandType:
      v.familyCode === 'DAILY'
        ? 'Матовый пояс 35 мм без надписей'
        : v.familyCode === 'BRIEF A'
        ? 'Пояс 32 мм · ровно 3 BORNERS спереди'
        : v.familyCode === 'WOVEN 2PACK'
        ? 'Закрытый пояс поплин 100% хлопок'
        : 'Жаккардовый пояс BORNERS тон в тон',
    fitType: `${v.unitsInPack} шт. в комплекте · Старт: ${v.launchMonthLabel}`,
    constructionDetails: v.specSummary,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    supplierName: `По техкарте ${v.techPdfFilename}`,
    supplierCountry: 'Китай',
    moq: 0,
    productionLeadDays: 0,
    deliveryLeadDays: 0,
    techFiles: [
      {
        id: `tf-${v.variantId.toLowerCase()}`,
        title: `original_tech_pdfs/${v.techPdfFilename}`,
        assetType: 'tech_pack',
        url: v.techPdfStaticUrl,
        uploadedAt: '2026-11-02',
      },
      {
        id: `tf-plan-${v.variantId.toLowerCase()}`,
        title: 'План роста Декабрь 2027 / 100 млн ₽ (BORNERS-2027-S1-100M).pdf',
        assetType: 'tech_pack',
        url: 'docs/s1-100m/BORNERS_2027_S1_100M_Plan.pdf',
        uploadedAt: '2026-11-02',
      },
    ],
    economics: {
      currency: 'RUB',
      plannedRetailPrice: v.plannedPriceRub,
      actualRetailPrice: v.plannedPriceRub,
      discountPct: 0,
      vatPct: 0,
      returnRatePct: 15,
      unitCostPrice: v.unitCostRub,
      marketplaceCommissionRub: 0,
      logisticsRub: 0,
      advertisingRub: 0,
      otherVariableRub: 0,
    },
    unitsSold: annualSets,
    revenueRub: annualRevRub,
    operatingProfitRub: 0,
    monthlyDynamicsPct: 15,
    salesChannels: ['Wildberries', 'Ozon'],
    variants: [
      {
        id: `var-${v.variantId.toLowerCase()}`,
        productId: `prod-${v.variantId.toLowerCase()}`,
        variantSku: v.variantId,
        colorName: v.paletteTitle,
        colorHex: v.colors[0]?.hex || '#1F242D',
        size: 'L',
        packConfiguration: `${v.unitsInPack} шт.`,
        stockQty: v.decemberBuyoutsSets,
      },
    ],
    isDemo: false,
    isArchived: false,
    createdAt: '2026-11-02',
    updatedAt: '2026-11-02',
  };
});
