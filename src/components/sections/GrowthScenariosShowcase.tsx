'use client';

import React, { useState } from 'react';
import {
  Check,
  Box,
  Layers,
  Target,
  BarChart3,
  ArrowLeft,
  ChevronRight,
  Cloud,
  MoveHorizontal,
  Feather,
  CheckCircle2,
  Printer,
  LayoutGrid,
  List,
  Sparkles,
} from 'lucide-react';
import { usePlatform } from '@/context/PlatformContext';
import { PdfConstructorModal } from './PdfConstructorModal';

interface PackColor {
  nameRu: string;
  pantone: string;
  hex: string;
  bandHex: string;
  textHex: string;
}

interface ScenarioModelSpec {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  brandId: 'BORNERS' | 'NA_TELE';
  unitsInPack: number;
  baseYearlyRevenueRub: number;
  sharePct: number;
  retailPriceRub: number;
  unitCostRub: number;
  marginPct: number;
  baseYearlyUnits: number;
  baseMonthlyUnits: number;
  firstOrderUnits: number;
  firstOrderPacks: number;
  paletteTitle: string;
  colors: PackColor[];
  construction: {
    type: string;
    fit: string;
    sideSeam: string;
    frontPanel: string;
    gusset: string;
    seams: string;
  };
  fabric: {
    composition: string;
    density: string;
    knitType: string;
    swatchHex: string;
  };
  waistband: {
    width: string;
    type: string;
    colorRule: string;
    logoRepeat: string;
    elasticity: string;
    bandBgHex: string;
    bandTextHex: string;
  };
  timeline: {
    step: string;
    dates: string;
    done?: boolean;
  }[];
}

const SCENARIO_MODELS: ScenarioModelSpec[] = [
  {
    id: 'scen-model-001',
    code: '№001',
    title: 'COLOR 4 PACK',
    subtitle: 'Боксеры, 4 шт.',
    brandId: 'BORNERS',
    unitsInPack: 4,
    baseYearlyRevenueRub: 87_000_000,
    sharePct: 7.3,
    retailPriceRub: 1290,
    unitCostRub: 420,
    marginPct: 38,
    baseYearlyUnits: 67_500,
    baseMonthlyUnits: 5_625,
    firstOrderUnits: 30_000,
    firstOrderPacks: 7_500,
    paletteTitle: 'SORBET CLUB',
    colors: [
      {
        nameRu: 'Пыльная клубника',
        pantone: 'PANTONE 14-1909 TCX',
        hex: '#E6B2B8',
        bandHex: '#DE9EA6',
        textHex: '#6E3B42',
      },
      {
        nameRu: 'Лавандово-голубой',
        pantone: 'PANTONE 15-3919 TCX',
        hex: '#B9C8F0',
        bandHex: '#9FB3E8',
        textHex: '#2E437A',
      },
      {
        nameRu: 'Медовый',
        pantone: 'PANTONE 13-0939 TCX',
        hex: '#E5B85D',
        bandHex: '#D9A641',
        textHex: '#5E420E',
      },
      {
        nameRu: 'Морская мята',
        pantone: 'PANTONE 14-4809 TCX',
        hex: '#75C5C1',
        bandHex: '#58B2AE',
        textHex: '#154C49',
      },
    ],
    construction: {
      type: 'Боксеры (trunks)',
      fit: 'Средняя',
      sideSeam: '≈ 24 см (L)',
      frontPanel: 'Анатомическая передняя панель',
      gusset: 'Да, двойной слой',
      seams: 'Плоские, эластичные',
    },
    fabric: {
      composition: '95% хлопок, 5% эластан',
      density: '180–200 г/м²',
      knitType: 'Single Jersey',
      swatchHex: '#E0A8B0',
    },
    waistband: {
      width: '38 мм',
      type: 'Жаккард (тканая)',
      colorRule: 'Тон в тон с изделием',
      logoRepeat: 'BORNERS × 3 (повтор)',
      elasticity: 'Высокая, без деформации',
      bandBgHex: '#E2A8B0',
      bandTextHex: '#7A424B',
    },
    timeline: [
      { step: 'Образец', dates: 'до 10 февраля', done: true },
      { step: 'Утверждение', dates: 'до 15 февраля', done: true },
      { step: 'Производство', dates: '20 фев – 20 марта', done: false },
      { step: 'Доставка в РФ', dates: '21 – 31 марта', done: false },
      { step: 'Запуск продаж', dates: 'с 1 апреля', done: false },
    ],
  },
  {
    id: 'scen-model-002',
    code: '№002',
    title: 'BASIC 4 PACK',
    subtitle: 'Боксеры, 4 шт.',
    brandId: 'BORNERS',
    unitsInPack: 4,
    baseYearlyRevenueRub: 124_000_000,
    sharePct: 10.3,
    retailPriceRub: 1390,
    unitCostRub: 430,
    marginPct: 41,
    baseYearlyUnits: 89_200,
    baseMonthlyUnits: 7_430,
    firstOrderUnits: 40_000,
    firstOrderPacks: 10_000,
    paletteTitle: 'NORDIC SLATE',
    colors: [
      {
        nameRu: 'Глубокий деним',
        pantone: 'PANTONE 19-4027 TCX',
        hex: '#3F526D',
        bandHex: '#33445B',
        textHex: '#D8E1EE',
      },
      {
        nameRu: 'Графитовый шторм',
        pantone: 'PANTONE 18-4006 TCX',
        hex: '#5D6268',
        bandHex: '#4B5056',
        textHex: '#E5E7EB',
      },
      {
        nameRu: 'Серый меланж',
        pantone: 'PANTONE 16-3850 TCX',
        hex: '#A5A9B0',
        bandHex: '#8E939B',
        textHex: '#25282C',
      },
      {
        nameRu: 'Антрацит',
        pantone: 'PANTONE 19-3911 TCX',
        hex: '#2C2F33',
        bandHex: '#1F2225',
        textHex: '#C7CCD1',
      },
    ],
    construction: {
      type: 'Боксеры удлинённые (boxer briefs)',
      fit: 'Средняя анатомическая',
      sideSeam: '≈ 26 см (L)',
      frontPanel: 'Двухслойный 3D-гульфик',
      gusset: 'Да, с антипиллинговой ластовицей',
      seams: '4 иглы / 6 нитей (Flatlock)',
    },
    fabric: {
      composition: '92% микромодал Lenzing, 8% эластан',
      density: '185 г/м²',
      knitType: 'Interlock Silk Touch',
      swatchHex: '#4B5D78',
    },
    waistband: {
      width: '38 мм',
      type: 'Матовый жаккард с микрофиброй',
      colorRule: 'Тон в тон с матовым рельефом',
      logoRepeat: 'BORNERS × 3 (повтор)',
      elasticity: 'Сохранение упругости 60+ стирок',
      bandBgHex: '#43556E',
      bandTextHex: '#CBD5E1',
    },
    timeline: [
      { step: 'Образец', dates: 'до 5 февраля', done: true },
      { step: 'Утверждение', dates: 'до 12 февраля', done: true },
      { step: 'Производство', dates: '15 фев – 15 марта', done: true },
      { step: 'Доставка в РФ', dates: '16 – 26 марта', done: false },
      { step: 'Запуск продаж', dates: 'с 28 марта', done: false },
    ],
  },
  {
    id: 'scen-model-003',
    code: '№003',
    title: 'BLACK LINE 3 PACK',
    subtitle: 'Боксеры, 3 шт.',
    brandId: 'BORNERS',
    unitsInPack: 3,
    baseYearlyRevenueRub: 95_000_000,
    sharePct: 7.9,
    retailPriceRub: 1190,
    unitCostRub: 375,
    marginPct: 39,
    baseYearlyUnits: 79_800,
    baseMonthlyUnits: 6_650,
    firstOrderUnits: 36_000,
    firstOrderPacks: 12_000,
    paletteTitle: 'OBSIDIAN CORE',
    colors: [
      {
        nameRu: 'Угольно-чёрный',
        pantone: 'PANTONE 19-4007 TCX',
        hex: '#222326',
        bandHex: '#18191B',
        textHex: '#9CA3AF',
      },
      {
        nameRu: 'Чёрный оникс',
        pantone: 'PANTONE 19-0303 TCX',
        hex: '#2B2C30',
        bandHex: '#1F2023',
        textHex: '#A1A1AA',
      },
      {
        nameRu: 'Тёмный графит',
        pantone: 'PANTONE 19-3908 TCX',
        hex: '#35373C',
        bandHex: '#27292D',
        textHex: '#D4D4D8',
      },
    ],
    construction: {
      type: 'Боксеры классические (trunks)',
      fit: 'Средняя универсальная',
      sideSeam: '≈ 24,5 см (L)',
      frontPanel: 'Анатомическая профилированная',
      gusset: 'Да, двойной слой без заднего шва',
      seams: 'Плоские эластичные',
    },
    fabric: {
      composition: '95% гребенной хлопок Compact, 5% эластан',
      density: '190 г/м²',
      knitType: 'Single Jersey Enzyme Wash',
      swatchHex: '#26272B',
    },
    waistband: {
      width: '38 мм',
      type: 'Жаккард повышенной плотности',
      colorRule: 'Чёрный с графитовым логотипом',
      logoRepeat: 'BORNERS × 3 (повтор)',
      elasticity: 'Высокая, без скручивания',
      bandBgHex: '#232428',
      bandTextHex: '#9CA3AF',
    },
    timeline: [
      { step: 'Образец', dates: 'до 1 февраля', done: true },
      { step: 'Утверждение', dates: 'до 8 февраля', done: true },
      { step: 'Производство', dates: '10 фев – 10 марта', done: true },
      { step: 'Доставка в РФ', dates: '11 – 22 марта', done: false },
      { step: 'Запуск продаж', dates: 'с 25 марта', done: false },
    ],
  },
  {
    id: 'scen-model-004',
    code: '№004',
    title: 'WHITE LINE 3 PACK',
    subtitle: 'Боксеры, 3 шт.',
    brandId: 'BORNERS',
    unitsInPack: 3,
    baseYearlyRevenueRub: 78_000_000,
    sharePct: 6.5,
    retailPriceRub: 1190,
    unitCostRub: 370,
    marginPct: 37,
    baseYearlyUnits: 65_500,
    baseMonthlyUnits: 5_460,
    firstOrderUnits: 27_000,
    firstOrderPacks: 9_000,
    paletteTitle: 'ALABASTER PURE',
    colors: [
      {
        nameRu: 'Чистый белый',
        pantone: 'PANTONE 11-0601 TCX',
        hex: '#F4F4F6',
        bandHex: '#E6E6EA',
        textHex: '#6E6E77',
      },
      {
        nameRu: 'Тёплый алебастр',
        pantone: 'PANTONE 11-0602 TCX',
        hex: '#EFECE6',
        bandHex: '#E2DDD5',
        textHex: '#6B665E',
      },
      {
        nameRu: 'Светлый жемчуг',
        pantone: 'PANTONE 12-4301 TCX',
        hex: '#E6E7EC',
        bandHex: '#D8DAE2',
        textHex: '#5E6068',
      },
    ],
    construction: {
      type: 'Боксеры (trunks)',
      fit: 'Средняя',
      sideSeam: '≈ 24 см (L)',
      frontPanel: 'Анатомическая передняя панель',
      gusset: 'Да, двойной слой',
      seams: 'Плоские, неощутимые на коже',
    },
    fabric: {
      composition: '95% хлопок Pima, 5% эластан',
      density: '185 г/м²',
      knitType: 'Single Jersey Soft',
      swatchHex: '#ECEAE4',
    },
    waistband: {
      width: '38 мм',
      type: 'Жаккард (тканая)',
      colorRule: 'Белый с серебристо-серым тиснением',
      logoRepeat: 'BORNERS × 3 (повтор)',
      elasticity: 'Высокая, без деформации',
      bandBgHex: '#ECECEE',
      bandTextHex: '#7A7A85',
    },
    timeline: [
      { step: 'Образец', dates: 'до 12 февраля', done: true },
      { step: 'Утверждение', dates: 'до 18 февраля', done: true },
      { step: 'Производство', dates: '22 фев – 22 марта', done: false },
      { step: 'Доставка в РФ', dates: '23 мар – 2 апр', done: false },
      { step: 'Запуск продаж', dates: 'с 5 апреля', done: false },
    ],
  },
];

const SCENARIOS_META = [
  {
    id: 1 as const,
    badge: 'Сценарий №1',
    monthlyLabel: '100 млн ₽ / мес',
    subtitle: 'Базовый рост BORNERS',
    annualLabel: '1,2 млрд ₽',
    multiplier: 1,
    modelsCount: 24,
    totalUnitsLabel: '1,37 млн шт.',
    avgMarginPct: 38,
    capexLabel: '412 млн ₽',
    bornersSharePct: 92,
    nateleSharePct: 8,
  },
  {
    id: 2 as const,
    badge: 'Сценарий №2',
    monthlyLabel: '150 млн ₽ / мес',
    subtitle: 'Расширение ассортимента',
    annualLabel: '1,8 млрд ₽',
    multiplier: 1.5,
    modelsCount: 36,
    totalUnitsLabel: '2,05 млн шт.',
    avgMarginPct: 40,
    capexLabel: '590 млн ₽',
    bornersSharePct: 86,
    nateleSharePct: 14,
  },
  {
    id: 3 as const,
    badge: 'Сценарий №3',
    monthlyLabel: '200 млн ₽ / мес',
    subtitle: 'Масштабирование группы',
    annualLabel: '2,4 млрд ₽',
    multiplier: 2,
    modelsCount: 48,
    totalUnitsLabel: '2,74 млн шт.',
    avgMarginPct: 42,
    capexLabel: '780 млн ₽',
    bornersSharePct: 80,
    nateleSharePct: 20,
  },
];

const MONTHS_RU = [
  { m: 'Янв', b: 22, n: 4 },
  { m: 'Фев', b: 28, n: 5 },
  { m: 'Мар', b: 35, n: 6 },
  { m: 'Апр', b: 42, n: 7 },
  { m: 'Май', b: 48, n: 7 },
  { m: 'Июн', b: 54, n: 8 },
  { m: 'Июл', b: 60, n: 8 },
  { m: 'Авг', b: 66, n: 9 },
  { m: 'Сен', b: 72, n: 9 },
  { m: 'Окт', b: 78, n: 10 },
  { m: 'Ноя', b: 84, n: 11 },
  { m: 'Дек', b: 90, n: 10 },
];

// Векторная иллюстрация стопки боксеров BORNERS (4-pack / 3-pack) в стиле референса Apple
function MultipackStackIllustration({
  colors,
  large = false,
}: {
  colors: PackColor[];
  large?: boolean;
}) {
  const count = colors.length;
  return (
    <div
      className={`relative w-full flex items-center justify-center select-none ${
        large ? 'h-[245px]' : 'h-[155px]'
      }`}
    >
      <svg
        viewBox="0 0 320 230"
        className="w-full h-full drop-shadow-[0_10px_18px_rgba(24,23,21,0.10)]"
      >
        {colors
          .slice()
          .reverse()
          .map((col, revIdx) => {
            const idx = count - 1 - revIdx;
            const offsetY = idx * (count === 4 ? 22 : 27);
            const offsetX = (count - 1 - idx) * 6;
            const rot = -3.5 + idx * 1.1;
            return (
              <g
                key={col.nameRu}
                transform={`translate(${18 + offsetX}, ${14 + offsetY}) rotate(${rot}, 135, 70)`}
              >
                {/* Основной силуэт боксеров */}
                <path
                  d="M 22 24 L 248 24 L 264 128 C 240 133, 195 132, 172 126 L 154 96 C 145 106, 125 106, 116 96 L 98 126 C 75 132, 30 133, 6 128 Z"
                  fill={col.hex}
                  stroke="rgba(0,0,0,0.08)"
                  strokeWidth="1.2"
                />
                {/* Анатомический рельеф гульфика (только на передней паре) */}
                {idx === count - 1 && (
                  <>
                    <path
                      d="M 106 26 C 102 68, 112 96, 135 102 C 158 96, 168 68, 164 26"
                      fill="none"
                      stroke="rgba(0,0,0,0.13)"
                      strokeWidth="1.6"
                    />
                    <path
                      d="M 135 26 L 135 100"
                      fill="none"
                      stroke="rgba(0,0,0,0.07)"
                      strokeWidth="1.2"
                    />
                  </>
                )}
                {/* Жаккардовая резинка BORNERS */}
                <rect
                  x="22"
                  y="6"
                  width="226"
                  height="21"
                  rx="3"
                  fill={col.bandHex}
                  stroke="rgba(0,0,0,0.10)"
                  strokeWidth="1"
                />
                <text
                  x="56"
                  y="20"
                  fill={col.textHex}
                  fontSize="9.5"
                  fontWeight="700"
                  letterSpacing="1.2"
                >
                  BORNERS
                </text>
                <text
                  x="135"
                  y="20"
                  textAnchor="middle"
                  fill={col.textHex}
                  fontSize="9.5"
                  fontWeight="700"
                  letterSpacing="1.2"
                >
                  BORNERS
                </text>
                <text
                  x="214"
                  y="20"
                  textAnchor="end"
                  fill={col.textHex}
                  fontSize="9.5"
                  fontWeight="700"
                  letterSpacing="1.2"
                >
                  BORNERS
                </text>
              </g>
            );
          })}
      </svg>
    </div>
  );
}

// Технический чертёж конструкции и посадки (Вид спереди + Вид сзади)
function TechnicalFlatDrawingSvg() {
  return (
    <svg viewBox="0 0 420 155" className="w-full h-[145px]">
      {/* Вид спереди */}
      <g transform="translate(12, 10)">
        <path
          d="M 18 18 L 166 18 L 178 116 L 114 122 L 99 96 L 85 96 L 70 122 L 6 116 Z"
          fill="#FFFFFF"
          stroke="#2C2C2E"
          strokeWidth="1.6"
        />
        {/* Пояс */}
        <line x1="17" y1="33" x2="167" y2="33" stroke="#2C2C2E" strokeWidth="1.4" />
        {/* Анатомический гульфик */}
        <path
          d="M 68 33 C 66 68, 74 92, 92 96 C 110 92, 118 68, 116 33"
          fill="none"
          stroke="#2C2C2E"
          strokeWidth="1.3"
        />
        <line
          x1="92"
          y1="33"
          x2="92"
          y2="96"
          stroke="#8E8E93"
          strokeWidth="1"
          strokeDasharray="3 2"
        />
        {/* Подгибка низа */}
        <line
          x1="8"
          y1="109"
          x2="71"
          y2="115"
          stroke="#8E8E93"
          strokeWidth="1"
          strokeDasharray="3 2"
        />
        <line
          x1="113"
          y1="115"
          x2="176"
          y2="109"
          stroke="#8E8E93"
          strokeWidth="1"
          strokeDasharray="3 2"
        />
        <text x="92" y="138" textAnchor="middle" fontSize="10" fill="#6E6E73">
          Вид спереди (3D панель)
        </text>
      </g>

      {/* Вид сзади */}
      <g transform="translate(222, 10)">
        <path
          d="M 18 18 L 166 18 L 178 116 L 114 122 L 99 96 L 85 96 L 70 122 L 6 116 Z"
          fill="#FFFFFF"
          stroke="#2C2C2E"
          strokeWidth="1.6"
        />
        <line x1="17" y1="33" x2="167" y2="33" stroke="#2C2C2E" strokeWidth="1.4" />
        {/* Ластовица */}
        <path
          d="M 74 96 Q 92 84 110 96"
          fill="none"
          stroke="#2C2C2E"
          strokeWidth="1.2"
        />
        <line
          x1="8"
          y1="109"
          x2="71"
          y2="115"
          stroke="#8E8E93"
          strokeWidth="1"
          strokeDasharray="3 2"
        />
        <line
          x1="113"
          y1="115"
          x2="176"
          y2="109"
          stroke="#8E8E93"
          strokeWidth="1"
          strokeDasharray="3 2"
        />
        <text x="92" y="138" textAnchor="middle" fontSize="10" fill="#6E6E73">
          Вид сзади (без среднего шва)
        </text>
      </g>
    </svg>
  );
}

export function GrowthScenariosShowcase() {
  const { concepts, navigateTo, notify } = usePlatform();

  const [selectedScenarioId, setSelectedScenarioId] = useState<1 | 2 | 3>(1);
  const [selectedModelId, setSelectedModelId] = useState<string>('scen-model-001');
  const [activeSpecTab, setActiveSpecTab] = useState<
    'sales' | 'production' | 'tech' | 'pantone' | 'files'
  >('tech');
  const [brandFilterLocal, setBrandFilterLocal] = useState<'ALL' | 'BORNERS' | 'NA_TELE'>('ALL');
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  const currentScenario =
    SCENARIOS_META.find((s) => s.id === selectedScenarioId) || SCENARIOS_META[0];
  const mult = currentScenario.multiplier;

  const activeModel =
    SCENARIO_MODELS.find((m) => m.id === selectedModelId) || SCENARIO_MODELS[0];

  const scaledYearlyRev = Math.round(activeModel.baseYearlyRevenueRub * mult);
  const scaledYearlyUnits = Math.round(activeModel.baseYearlyUnits * mult);
  const scaledMonthlyUnits = Math.round(activeModel.baseMonthlyUnits * mult);
  const scaledFirstOrderUnits = Math.round(activeModel.firstOrderUnits * mult);
  const scaledFirstOrderPacks = Math.round(activeModel.firstOrderPacks * mult);

  const conceptForPdf = concepts[0];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* =====================================================================
          ЛЕВАЯ ПОЛОВИНА: СЦЕНАРИИ РАЗВИТИЯ (100 / 150 / 200 МЛН ₽/МЕС) + МОДЕЛИ + ГРАФИКИ
         ===================================================================== */}
      <div className="xl:col-span-6 space-y-5">
        {/* Заголовок секции */}
        <div>
          <h1 className="text-[26px] font-bold text-[#1D1D1F] tracking-tight leading-tight">
            Сценарии развития
          </h1>
          <p className="text-[13.5px] text-[#6E6E73] mt-0.5">
            Стратегические планы по выручке компании и матрице ключевых моделей
          </p>
        </div>

        {/* 3 КАРТОЧКИ СЦЕНАРИЕВ (100 / 150 / 200 млн ₽ / мес) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {SCENARIOS_META.map((scen) => {
            const isSelected = scen.id === selectedScenarioId;
            return (
              <button
                key={scen.id}
                type="button"
                onClick={() => setSelectedScenarioId(scen.id)}
                className={`text-left rounded-[20px] p-4 transition-all cursor-pointer flex flex-col justify-between min-h-[168px] ${
                  isSelected
                    ? 'bg-[#FDFBF7] border-2 border-[#C8A97E] shadow-[0_8px_24px_rgba(200,169,126,0.16)]'
                    : 'bg-white border border-[#E8E2D5] hover:border-[#C8A97E]/60 shadow-[0_2px_10px_rgba(0,0,0,0.03)]'
                }`}
              >
                <div className="space-y-3 w-full">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11.5px] font-semibold ${
                        isSelected
                          ? 'bg-[#EFE6D5] text-[#5C4D38]'
                          : 'bg-[#F4F2ED] text-[#6E6E73]'
                      }`}
                    >
                      {scen.badge}
                    </span>
                    <span
                      className={`h-6 w-6 rounded-full flex items-center justify-center transition ${
                        isSelected
                          ? 'bg-[#1E3A5F] text-white'
                          : 'border border-[#D5CFC4] bg-white'
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                    </span>
                  </div>

                  <div>
                    <div className="text-[21px] font-bold text-[#1D1D1F] tracking-tight leading-snug">
                      {scen.monthlyLabel}
                    </div>
                    <div className="text-[12.5px] text-[#6E6E73] mt-0.5">
                      {scen.subtitle}
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-[#EFECE6] w-full">
                  <div className="text-[11px] text-[#8E8E93]">Годовая выручка</div>
                  <div className="text-[17px] font-bold text-[#1D1D1F] mt-0.5">
                    {scen.annualLabel}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ПОЛОСА 4 КЛЮЧЕВЫХ ПОКАЗАТЕЛЕЙ СЦЕНАРИЯ */}
        <div className="rounded-[20px] bg-white border border-[#E8E2D5] p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-[#F5EFE4] text-[#8B6F47] flex items-center justify-center shrink-0">
              <Box className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[11px] text-[#6E6E73] leading-tight">Моделей в плане</div>
              <div className="text-[16px] font-bold text-[#1D1D1F]">
                {currentScenario.modelsCount}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-[#F5EFE4] text-[#8B6F47] flex items-center justify-center shrink-0">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[11px] text-[#6E6E73] leading-tight">Общий объём продаж</div>
              <div className="text-[16px] font-bold text-[#1D1D1F]">
                {currentScenario.totalUnitsLabel}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-[#F5EFE4] text-[#8B6F47] flex items-center justify-center shrink-0">
              <Target className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[11px] text-[#6E6E73] leading-tight">Средняя маржа</div>
              <div className="text-[16px] font-bold text-[#1D1D1F]">
                {currentScenario.avgMarginPct}%
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-[#F5EFE4] text-[#8B6F47] flex items-center justify-center shrink-0">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[11px] text-[#6E6E73] leading-tight">Инвестиции в закупку</div>
              <div className="text-[16px] font-bold text-[#1D1D1F]">
                {currentScenario.capexLabel}
              </div>
            </div>
          </div>
        </div>

        {/* БЛОК МОДЕЛЕЙ В ВЫБРАННОМ СЦЕНАРИИ */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[18px] font-bold text-[#1D1D1F] tracking-tight">
              Модели в сценарии №{currentScenario.id} ({currentScenario.monthlyLabel})
            </h2>

            <div className="flex items-center gap-2">
              <select
                value={brandFilterLocal}
                onChange={(e) =>
                  setBrandFilterLocal(e.target.value as 'ALL' | 'BORNERS' | 'NA_TELE')
                }
                className="h-8 rounded-full border border-[#E5E0D5] bg-white px-3 text-[12px] font-medium text-[#1D1D1F] cursor-pointer"
              >
                <option value="ALL">Все модели</option>
                <option value="BORNERS">BORNERS</option>
                <option value="NA_TELE">НА ТЕЛЕ</option>
              </select>

              <div className="inline-flex rounded-lg border border-[#E5E0D5] bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setViewLayout('grid')}
                  className={`p-1 rounded-md cursor-pointer ${
                    viewLayout === 'grid'
                      ? 'bg-[#EFE6D5] text-[#1D1D1F]'
                      : 'text-[#8E8E93]'
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewLayout('list')}
                  className={`p-1 rounded-md cursor-pointer ${
                    viewLayout === 'list'
                      ? 'bg-[#EFE6D5] text-[#1D1D1F]'
                      : 'text-[#8E8E93]'
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div
            className={
              viewLayout === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-4 gap-3'
                : 'grid grid-cols-1 gap-2.5'
            }
          >
            {SCENARIO_MODELS.filter(
              (m) => brandFilterLocal === 'ALL' || m.brandId === brandFilterLocal
            ).map((model) => {
              const isSelected = model.id === activeModel.id;
              const modelRevMln = Math.round((model.baseYearlyRevenueRub * mult) / 1_000_000);
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => setSelectedModelId(model.id)}
                  className={`text-left rounded-[20px] p-3.5 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#FDFBF7] border-2 border-[#C8A97E] shadow-[0_8px_22px_rgba(200,169,126,0.18)]'
                      : 'bg-white border border-[#E8E2D5] hover:border-[#C8A97E]/60 shadow-[0_2px_10px_rgba(0,0,0,0.02)]'
                  }`}
                >
                  <div>
                    <MultipackStackIllustration colors={model.colors} />
                    <div className="mt-2">
                      <div className="text-[11px] font-medium text-[#8E8E93]">
                        {model.code}
                      </div>
                      <div className="text-[14px] font-bold text-[#1D1D1F] leading-snug mt-0.5">
                        {model.title}
                      </div>
                      <div className="text-[12px] text-[#6E6E73]">{model.subtitle}</div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#F2EFE9] space-y-2">
                    <div className="text-[16px] font-bold text-[#1D1D1F]">
                      {modelRevMln} млн ₽{' '}
                      <span className="text-[12px] font-normal text-[#6E6E73]">/ год</span>
                    </div>

                    {/* Прогресс-бар доли от цели */}
                    <div className="space-y-1">
                      <div className="h-1.5 w-full rounded-full bg-[#EFECE6] overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, model.sharePct * 6.5)}%` }}
                          className="h-full rounded-full bg-[#34A853]"
                        />
                      </div>
                      <div className="text-[11px] text-[#6E6E73] text-center">
                        {model.sharePct.toString().replace('.', ',')}% от цели
                      </div>
                    </div>

                    <div className="pt-0.5 flex justify-center">
                      <span className="inline-block rounded-full bg-[#F3ECE0] text-[#5C4E3A] px-3 py-0.5 text-[11px] font-semibold">
                        В плане
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* НИЖНИЙ РЯД ГРАФИКОВ: ПЛАН ВЫРУЧКИ ПО МЕСЯЦАМ + СТРУКТУРА ВЫРУЧКИ */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          {/* План выручки по месяцам */}
          <div className="md:col-span-8 rounded-[20px] bg-white border border-[#E8E2D5] p-5 space-y-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-[15.5px] font-bold text-[#1D1D1F]">
                  План выручки по месяцам (сценарий №{currentScenario.id})
                </h3>
                <div className="flex items-center gap-4 text-[11.5px] text-[#6E6E73] mt-1">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#1E3A5F]" />
                    <span>BORNERS (основа)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#E5D4BC]" />
                    <span>НА ТЕЛЕ</span>
                  </span>
                </div>
              </div>

              <span className="px-3 py-1 rounded-lg bg-[#1E3A5F] text-white text-[12px] font-bold">
                {currentScenario.monthlyLabel.replace(' / мес', '')}
              </span>
            </div>

            <div className="h-[165px] flex items-end gap-2 pt-4">
              {MONTHS_RU.map((row, idx) => {
                const bVal = Math.round(row.b * mult);
                const nVal = Math.round(row.n * mult);
                const maxScale = Math.round(115 * mult);
                const bPct = Math.round((bVal / maxScale) * 100);
                const nPct = Math.round((nVal / maxScale) * 100);
                return (
                  <div
                    key={row.m}
                    className="flex-1 flex flex-col items-center justify-end h-full group"
                  >
                    <div className="w-full flex flex-col justify-end h-[132px] rounded-t-md overflow-hidden">
                      <div
                        style={{ height: `${nPct}%` }}
                        className="w-full bg-[#E5D4BC] transition-all"
                        title={`НА ТЕЛЕ: ${nVal} млн ₽`}
                      />
                      <div
                        style={{ height: `${bPct}%` }}
                        className={`w-full transition-all ${
                          idx === 11 ? 'bg-[#162C49]' : 'bg-[#1E3A5F]'
                        }`}
                        title={`BORNERS: ${bVal} млн ₽`}
                      />
                    </div>
                    <span className="text-[10.5px] text-[#6E6E73] mt-1.5 font-medium">
                      {row.m}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Структура выручки (Донат) */}
          <div className="md:col-span-4 rounded-[20px] bg-white border border-[#E8E2D5] p-5 flex flex-col justify-between shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <h3 className="text-[15.5px] font-bold text-[#1D1D1F]">Структура выручки</h3>

            <div className="relative mx-auto my-2 h-[132px] w-[132px] flex items-center justify-center">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle
                  cx="60"
                  cy="60"
                  r="46"
                  fill="none"
                  stroke="#E5D4BC"
                  strokeWidth="14"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="46"
                  fill="none"
                  stroke="#1E3A5F"
                  strokeWidth="14"
                  strokeDasharray={`${(currentScenario.bornersSharePct / 100) * 289} 289`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <div className="text-[16px] font-bold text-[#1D1D1F] leading-tight">
                  {currentScenario.annualLabel.replace(' ₽', '')}
                </div>
                <div className="text-[10.5px] text-[#6E6E73]">₽ в год</div>
              </div>
            </div>

            <div className="space-y-1.5 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[#1D1D1F] font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#1E3A5F]" />
                  <span>BORNERS</span>
                </span>
                <span className="font-bold text-[#1D1D1F]">
                  {currentScenario.bornersSharePct}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[#6E6E73] font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#E5D4BC]" />
                  <span>НА ТЕЛЕ</span>
                </span>
                <span className="font-bold text-[#1D1D1F]">
                  {currentScenario.nateleSharePct}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          ПРАВАЯ ПОЛОВИНА: КАРТОЧКА МОДЕЛИ И ТЕХНИЧЕСКАЯ СПЕЦИФИКАЦИЯ (APPLE INSPECTOR)
         ===================================================================== */}
      <div className="xl:col-span-6 rounded-[24px] bg-white border border-[#E8E2D5] p-6 space-y-6 shadow-[0_6px_28px_rgba(20,20,24,0.05)]">
        {/* Хлебные крошки и статус */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[12.5px] text-[#6E6E73]">
          <div className="flex items-center gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Сценарий №{currentScenario.id}</span>
            <span>/</span>
            <span>Модели</span>
            <span>/</span>
            <span className="font-semibold text-[#1D1D1F]">
              BORNERS {activeModel.code}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#E3F5EC] text-[#1D7A4C] text-[12px] font-semibold">
              В плане запуска
            </span>
            <button
              type="button"
              onClick={() => setPdfModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E3A5F] hover:bg-[#162C49] text-white text-[12px] font-semibold transition cursor-pointer"
              title="Открыть конструктор PDF перед скачиванием"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Конструктор PDF</span>
            </button>
          </div>
        </div>

        {/* Заголовок модели */}
        <div>
          <h2 className="text-[28px] font-bold text-[#1D1D1F] tracking-tight leading-none">
            BORNERS {activeModel.code}
          </h2>
          <div className="text-[15px] font-medium text-[#4A4A4F] mt-1">
            {activeModel.title}
          </div>
        </div>

        {/* ГЕРОЙ-БЛОК: СЛЕВА ИЛЛЮСТРАЦИЯ МУЛЬТИПАКА, СПРАВА 6 КАРТОЧЕК ЭКОНОМИКИ */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          <div className="md:col-span-5 rounded-[20px] bg-[#FAF8F5] border border-[#EFECE6] p-3">
            <MultipackStackIllustration colors={activeModel.colors} large />
          </div>

          <div className="md:col-span-7 rounded-[20px] border border-[#E8E2D5] bg-[#FDFCFA] divide-y divide-[#EFECE6] overflow-hidden">
            {/* Ряд 1 */}
            <div className="grid grid-cols-12 divide-x divide-[#EFECE6]">
              <div className="col-span-8 p-3.5">
                <div className="text-[11.5px] text-[#6E6E73]">Плановая выручка за год</div>
                <div className="text-[22px] font-bold text-[#1D1D1F] mt-0.5">
                  {scaledYearlyRev.toLocaleString('ru-RU')} ₽
                </div>
              </div>
              <div className="col-span-4 p-3.5">
                <div className="text-[11.5px] text-[#6E6E73]">Доля в сценарии</div>
                <div className="text-[18px] font-bold text-[#1D1D1F] mt-1">
                  {activeModel.sharePct.toString().replace('.', ',')}%
                </div>
              </div>
            </div>

            {/* Ряд 2 */}
            <div className="grid grid-cols-12 divide-x divide-[#EFECE6]">
              <div className="col-span-4 p-3.5">
                <div className="text-[11px] text-[#6E6E73]">Цена реализации (сред.)</div>
                <div className="text-[15.5px] font-bold text-[#1D1D1F] mt-0.5">
                  {activeModel.retailPriceRub.toLocaleString('ru-RU')} ₽
                </div>
              </div>
              <div className="col-span-5 p-3.5">
                <div className="text-[11px] text-[#6E6E73]">Себестоимость (под ключ)</div>
                <div className="text-[15.5px] font-bold text-[#1D1D1F] mt-0.5">
                  {activeModel.unitCostRub.toLocaleString('ru-RU')} ₽
                </div>
              </div>
              <div className="col-span-3 p-3.5">
                <div className="text-[11px] text-[#6E6E73]">Маржа</div>
                <div className="text-[15.5px] font-bold text-[#1D7A4C] mt-0.5">
                  {activeModel.marginPct}%
                </div>
              </div>
            </div>

            {/* Ряд 3 */}
            <div className="grid grid-cols-12 divide-x divide-[#EFECE6]">
              <div className="col-span-7 p-3.5">
                <div className="text-[11.5px] text-[#6E6E73]">План продаж</div>
                <div className="text-[16.5px] font-bold text-[#1D1D1F] mt-0.5">
                  {scaledYearlyUnits.toLocaleString('ru-RU')} шт. / год
                </div>
              </div>
              <div className="col-span-5 p-3.5">
                <div className="text-[11.5px] text-[#6E6E73]">Среднемесячно</div>
                <div className="text-[16.5px] font-bold text-[#1D1D1F] mt-0.5">
                  {scaledMonthlyUnits.toLocaleString('ru-RU')} шт.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ВКЛАДКИ ПАСПОРТА МОДЕЛИ */}
        <div className="flex items-center gap-6 border-b border-[#E8E2D5] text-[13.5px] overflow-x-auto">
          {[
            { id: 'sales' as const, label: 'План продаж' },
            { id: 'production' as const, label: 'Производство' },
            { id: 'tech' as const, label: 'Тех. спецификация' },
            { id: 'pantone' as const, label: 'Цвета и Pantone' },
            { id: 'files' as const, label: 'Файлы и PDF' },
          ].map((tab) => {
            const active = activeSpecTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSpecTab(tab.id)}
                className={`pb-2.5 font-semibold whitespace-nowrap border-b-2 transition cursor-pointer ${
                  active
                    ? 'border-[#1D1D1F] text-[#1D1D1F]'
                    : 'border-transparent text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* СОДЕРЖИМОЕ ВКЛАДОК ПАСПОРТА */}
        <div className="space-y-4">
          {/* 1. КОНСТРУКЦИЯ И ПОСАДКА */}
          {(activeSpecTab === 'tech' || activeSpecTab === 'production') && (
            <div className="rounded-[18px] border border-[#E8E2D5] bg-[#FDFCFA] p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-6">
                <h4 className="text-[14.5px] font-bold text-[#1D1D1F] mb-2">
                  Конструкция и посадка
                </h4>
                <TechnicalFlatDrawingSvg />
              </div>

              <div className="md:col-span-6 text-[12.5px] divide-y divide-[#EFECE6]">
                {[
                  { k: 'Тип', v: activeModel.construction.type },
                  { k: 'Посадка', v: activeModel.construction.fit },
                  { k: 'Длина бокового шва', v: activeModel.construction.sideSeam },
                  { k: 'Конструкция', v: activeModel.construction.frontPanel },
                  { k: 'Ластовица', v: activeModel.construction.gusset },
                  { k: 'Швы', v: activeModel.construction.seams },
                ].map((row) => (
                  <div
                    key={row.k}
                    className="py-1.5 flex items-center justify-between gap-3"
                  >
                    <span className="text-[#6E6E73]">{row.k}</span>
                    <span className="font-semibold text-[#1D1D1F] text-right">
                      {row.v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. СОСТАВ И МАТЕРИАЛЫ + РЕЗИНКА BORNERS */}
          {(activeSpecTab === 'tech' || activeSpecTab === 'production') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Состав и материалы */}
              <div className="rounded-[18px] border border-[#E8E2D5] bg-[#FDFCFA] p-4 space-y-3">
                <h4 className="text-[14.5px] font-bold text-[#1D1D1F]">
                  Состав и материалы
                </h4>

                <div className="grid grid-cols-12 gap-3 items-center">
                  <div
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${activeModel.fabric.swatchHex}, #B8848C)`,
                    }}
                    className="col-span-5 h-24 rounded-[12px] border border-black/10 shadow-inner relative overflow-hidden flex items-end p-2"
                  >
                    <span className="text-[10px] font-semibold text-white/90 bg-black/25 backdrop-blur-xs px-2 py-0.5 rounded">
                      180–200 GSM
                    </span>
                  </div>

                  <div className="col-span-7 space-y-1.5 text-[12px]">
                    <div>
                      <div className="text-[#6E6E73] text-[11px]">Основная ткань</div>
                      <div className="font-bold text-[#1D1D1F]">
                        {activeModel.fabric.composition}
                      </div>
                    </div>
                    <div>
                      <div className="text-[#6E6E73] text-[11px]">Плотность</div>
                      <div className="font-bold text-[#1D1D1F]">
                        {activeModel.fabric.density}
                      </div>
                    </div>
                    <div>
                      <div className="text-[#6E6E73] text-[11px]">Тип трикотажа</div>
                      <div className="font-bold text-[#1D1D1F]">
                        {activeModel.fabric.knitType}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-[#EFECE6] text-center text-[10.5px] text-[#4A4A4F]">
                  <div className="flex flex-col items-center gap-1">
                    <Cloud className="h-4 w-4 text-[#6E6E73]" />
                    <span className="leading-tight">Дышащая ткань</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <MoveHorizontal className="h-4 w-4 text-[#6E6E73]" />
                    <span className="leading-tight">Эластичность и комфорт</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Layers className="h-4 w-4 text-[#6E6E73]" />
                    <span className="leading-tight">Держит форму</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Feather className="h-4 w-4 text-[#6E6E73]" />
                    <span className="leading-tight">Мягкая на ощупь</span>
                  </div>
                </div>
              </div>

              {/* Резинка BORNERS */}
              <div className="rounded-[18px] border border-[#E8E2D5] bg-[#FDFCFA] p-4 space-y-3">
                <h4 className="text-[14.5px] font-bold text-[#1D1D1F]">Резинка BORNERS</h4>

                {/* Визуальная полоса жаккардовой резинки */}
                <div
                  style={{
                    backgroundColor: activeModel.waistband.bandBgHex,
                    color: activeModel.waistband.bandTextHex,
                  }}
                  className="h-12 rounded-[10px] border border-black/10 px-3 flex items-center justify-between text-[13px] font-bold tracking-[0.14em] shadow-inner select-none"
                >
                  <span>BORNERS</span>
                  <span className="opacity-50">•</span>
                  <span>BORNERS</span>
                  <span className="opacity-50">•</span>
                  <span>BORNERS</span>
                </div>

                <div className="text-[12px] divide-y divide-[#EFECE6]">
                  {[
                    { k: 'Ширина', v: activeModel.waistband.width },
                    { k: 'Тип', v: activeModel.waistband.type },
                    { k: 'Цвет', v: activeModel.waistband.colorRule },
                    { k: 'Логотип', v: activeModel.waistband.logoRepeat },
                    { k: 'Эластичность', v: activeModel.waistband.elasticity },
                  ].map((row) => (
                    <div
                      key={row.k}
                      className="py-1.5 flex items-center justify-between gap-2"
                    >
                      <span className="text-[#6E6E73]">{row.k}</span>
                      <span className="font-semibold text-[#1D1D1F] text-right">
                        {row.v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. ЦВЕТА И PANTONE */}
          {(activeSpecTab === 'tech' || activeSpecTab === 'pantone') && (
            <div className="rounded-[18px] border border-[#E8E2D5] bg-[#FDFCFA] p-4 space-y-3">
              <h4 className="text-[14.5px] font-bold text-[#1D1D1F]">
                Цвета и Pantone (палитра {activeModel.paletteTitle})
              </h4>

              <div
                className={`grid gap-3 ${
                  activeModel.colors.length === 4
                    ? 'grid-cols-2 sm:grid-cols-4'
                    : 'grid-cols-1 sm:grid-cols-3'
                }`}
              >
                {activeModel.colors.map((c) => (
                  <div key={c.pantone} className="text-center space-y-1.5">
                    <div
                      style={{ backgroundColor: c.hex }}
                      className="h-11 w-full rounded-[10px] border border-black/10 shadow-2xs"
                    />
                    <div className="text-[12px] font-semibold text-[#1D1D1F] leading-tight">
                      {c.nameRu}
                    </div>
                    <div className="text-[10.5px] text-[#6E6E73] leading-tight">
                      {c.pantone}
                    </div>
                    <div className="text-[10.5px] text-[#8E8E93] font-medium">
                      {c.hex}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. ПРОИЗВОДСТВЕННЫЙ ПЛАН И ПЛАН ЗАКУПКИ (1-Й ЗАКАЗ) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
            <div className="md:col-span-8 rounded-[18px] border border-[#E8E2D5] bg-[#FDFCFA] p-4 space-y-3">
              <h4 className="text-[14px] font-bold text-[#1D1D1F]">
                Производственный план
              </h4>

              <div className="grid grid-cols-5 gap-2 pt-1">
                {activeModel.timeline.map((step) => (
                  <div key={step.step} className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2
                        className={`h-4 w-4 shrink-0 ${
                          step.done ? 'text-[#34A853]' : 'text-[#C8A97E]'
                        }`}
                      />
                      <div className="h-[2px] flex-1 bg-[#E5E0D5]" />
                    </div>
                    <div className="text-[11.5px] font-bold text-[#1D1D1F] leading-tight">
                      {step.step}
                    </div>
                    <div className="text-[10.5px] text-[#6E6E73] leading-tight">
                      {step.dates}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigateTo('product-lab')}
              className="md:col-span-4 rounded-[18px] border border-[#E8E2D5] hover:border-[#C8A97E] bg-[#FAF6EE] p-4 text-left flex flex-col justify-between transition cursor-pointer group"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[12px] font-bold text-[#1D1D1F]">
                  План закупки (1-й заказ)
                </span>
                <ChevronRight className="h-4 w-4 text-[#6E6E73] group-hover:translate-x-0.5 transition" />
              </div>

              <div className="flex items-center gap-2.5 mt-2">
                <div className="h-9 w-9 rounded-full bg-white border border-[#E5E0D5] flex items-center justify-center text-[#8B6F47] shrink-0">
                  <Box className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[16.5px] font-bold text-[#1D1D1F] leading-tight">
                    {scaledFirstOrderUnits.toLocaleString('ru-RU')} шт.
                  </div>
                  <div className="text-[11px] text-[#6E6E73]">
                    ({scaledFirstOrderPacks.toLocaleString('ru-RU')} комплектов)
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* МОДАЛЬНЫЙ КОНСТРУКТОР PDF С ВЫБОРОМ БЛОКОВ ПЕРЕД СКАЧИВАНИЕМ */}
      {pdfModalOpen && conceptForPdf && (
        <PdfConstructorModal
          concept={{
            ...conceptForPdf,
            code: `BRN-${activeModel.code.replace('№', '')}`,
            name: `BORNERS ${activeModel.code} · ${activeModel.title}`,
            plannedUnitCost: activeModel.unitCostRub,
            plannedRetailPrice: activeModel.retailPriceRub,
            packUnitsCount: activeModel.unitsInPack,
          }}
          onClose={() => setPdfModalOpen(false)}
          onSaveToConcept={() => {
            notify('success', `PDF для BORNERS ${activeModel.code} настроен и выгружен`);
          }}
        />
      )}
    </div>
  );
}
