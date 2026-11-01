'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Upload, FileText, Plus, Trash2, Check } from 'lucide-react';
import { ProductConcept } from '@/types/platform';
import {
  compressImageFileToDataUrl,
  downloadEditorialPdfDocument,
} from '@/lib/document-export';

interface PdfConstructorModalProps {
  concept: ProductConcept;
  onClose: () => void;
  onSaveToConcept?: (patch: Partial<ProductConcept>) => void;
}

const SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'] as const;

export function PdfConstructorModal({
  concept,
  onClose,
  onSaveToConcept,
}: PdfConstructorModalProps) {
  const existingOrder = concept.productionOrders?.[0];

  const [docTitle, setDocTitle] = useState(
    `Спецификация и заказ на производство: ${concept.name} (${concept.code})`
  );
  const [factoryName, setFactoryName] = useState(
    existingOrder?.factoryName ||
      concept.samples?.[0]?.factoryName ||
      concept.supplierName ||
      'Guangdong Apex Intimate Apparel Co., Ltd.'
  );
  const [plannedReadyDate, setPlannedReadyDate] = useState(
    existingOrder?.plannedReadyDate || concept.targetLaunchDate || '2027-02-15'
  );
  const [paymentTerms, setPaymentTerms] = useState(
    existingOrder?.paymentTerms || '30% депозит / 70% перед отгрузкой после QC'
  );

  // Фотографии товара: Лицевая (вид спереди) + Вторая (вид сзади / детали)
  const [frontPhotoUrl, setFrontPhotoUrl] = useState<string>(
    concept.imageUrl || 'images/products/rnd-soft-boxers.jpg'
  );
  const [backPhotoUrl, setBackPhotoUrl] = useState<string>(
    concept.galleryPhotos?.[1]?.url ||
      concept.samples?.[0]?.photos?.[0] ||
      concept.imageUrl ||
      'images/products/rnd-seamless-base.jpg'
  );
  const [frontCaption, setFrontCaption] = useState(
    `Лицевая фотография товара · ${concept.name} (${concept.code})`
  );
  const [backCaption, setBackCaption] = useState(
    'Вид сзади, поясная резинка и обработка плоских швов'
  );

  // Валюты: CNY (¥), USD ($), RUB (₽) + живой курс конвертации
  const [primaryCurrency, setPrimaryCurrency] = useState<'CNY' | 'USD' | 'RUB'>(
    existingOrder?.currency || 'CNY'
  );
  const [rateCnyToRub, setRateCnyToRub] = useState<number>(13.2);
  const [rateUsdToRub, setRateUsdToRub] = useState<number>(93.5);
  const [unitPriceInPrimary, setUnitPriceInPrimary] = useState<number>(() => {
    if (existingOrder?.unitPrice) return existingOrder.unitPrice;
    if (concept.plannedUnitCost > 0) {
      // Пересчёт из рублей в CNY по умолчанию
      return Number((concept.plannedUnitCost / 13.2).toFixed(2));
    }
    return 18.5;
  });

  // Комплектация и размерная сетка
  const [unitsPerPack, setUnitsPerPack] = useState<number>(
    existingOrder?.unitsPerPack || concept.packUnitsCount || 3
  );
  const [packsBySize, setPacksBySize] = useState<Record<string, number>>(
    existingOrder?.packsBySize || {
      S: 100,
      M: 300,
      L: 500,
      XL: 400,
      '2XL': 250,
      '3XL': 150,
      '4XL': 100,
    }
  );

  // Двуязычные строки: Крупный китайский (中文) сверху + мелкий русский снизу
  const [bilingualRows, setBilingualRows] = useState<
    {
      id: string;
      labelZh: string;
      labelRu: string;
      zhLarge: string;
      ruSmall: string;
      highlight?: boolean;
    }[]
  >([
    {
      id: 'row-1',
      labelZh: '款式名称与版型工艺',
      labelRu: 'Модель и конструкция',
      zhLarge:
        concept.techPack?.zh?.construction && concept.techPack.zh.construction !== '待定'
          ? concept.techPack.zh.construction
          : '3D立体囊袋平角内裤 · 四针六线无骨平缝 · 后档无中缝',
      ruSmall: `${concept.name} (${concept.code}) · ${
        concept.techPack?.ru?.construction ||
        'Анатомический 3D-гульфик, плоские швы 4 иглы / 6 нитей, без заднего шва'
      }`,
      highlight: true,
    },
    {
      id: 'row-2',
      labelZh: '面料成分与克重标准',
      labelRu: 'Состав ткани и плотность',
      zhLarge:
        concept.techPack?.zh?.compositionAndDensity &&
        concept.techPack.zh.compositionAndDensity !== '待定'
          ? concept.techPack.zh.compositionAndDensity
          : '92% 兰精超细莫代尔 + 8% 氨纶 · 克重 180g/m²',
      ruSmall:
        existingOrder?.materialAndColors ||
        concept.techPack?.ru?.compositionAndDensity ||
        '92% микромодал Lenzing + 8% эластан · Плотность 180 г/м²',
      highlight: true,
    },
    {
      id: 'row-3',
      labelZh: '腰头橡筋与包装配比',
      labelRu: 'Резинка пояса и комплектация',
      zhLarge: `38mm 超柔提花腰头（内侧微纤维）· 每盒 ${
        existingOrder?.unitsPerPack || concept.packUnitsCount || 3
      } 条装`,
      ruSmall: `${
        concept.techPack?.ru?.waistbandSpec || 'Мягкая жаккардовая резинка 38 мм'
      } · В наборе ${existingOrder?.unitsPerPack || concept.packUnitsCount || 3} шт. (${
        existingOrder?.packColorComposition ||
        concept.colorCombinations?.join(', ') ||
        'чёрный, графит, тёмно-синий'
      })`,
      highlight: false,
    },
    {
      id: 'row-4',
      labelZh: '品控标准与水洗测试',
      labelRu: 'Контроль качества и стирка',
      zhLarge: '执行 AQL 1.5 验货标准 · 40°C 水洗5次缩水率 ≤ 2.5%',
      ruSmall:
        'Инспекция AQL 1.5 перед отгрузкой · Усадка после 5 стирок при 40°C не более 2,5% · Маркировка Честный ЗНАК',
      highlight: false,
    },
  ]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // Вычисление мультивалютных цен (за 1 шт. и за всю партию в CNY, USD, RUB)
  const currencyMetrics = useMemo(() => {
    const safeCnyRate = rateCnyToRub > 0 ? rateCnyToRub : 13.2;
    const safeUsdRate = rateUsdToRub > 0 ? rateUsdToRub : 93.5;

    let unitRub = 0;
    if (primaryCurrency === 'RUB') {
      unitRub = unitPriceInPrimary;
    } else if (primaryCurrency === 'CNY') {
      unitRub = unitPriceInPrimary * safeCnyRate;
    } else {
      unitRub = unitPriceInPrimary * safeUsdRate;
    }

    const unitCny = unitRub / safeCnyRate;
    const unitUsd = unitRub / safeUsdRate;

    const totalPacks = SIZES.reduce((acc, sz) => acc + (packsBySize[sz] || 0), 0);
    const totalUnits = totalPacks * Math.max(1, unitsPerPack);

    const totalRub = Math.round(unitRub * totalUnits);
    const totalCny = Math.round(unitCny * totalUnits);
    const totalUsd = Math.round(unitUsd * totalUnits);

    return {
      unitRub: Math.round(unitRub),
      unitCny: Number(unitCny.toFixed(2)),
      unitUsd: Number(unitUsd.toFixed(2)),
      totalPacks,
      totalUnits,
      totalRub,
      totalCny,
      totalUsd,
    };
  }, [primaryCurrency, rateCnyToRub, rateUsdToRub, unitPriceInPrimary, packsBySize, unitsPerPack]);

  const handleCurrencySwitch = (nextCur: 'CNY' | 'USD' | 'RUB') => {
    if (nextCur === primaryCurrency) return;
    if (nextCur === 'RUB') setUnitPriceInPrimary(currencyMetrics.unitRub);
    if (nextCur === 'CNY') setUnitPriceInPrimary(currencyMetrics.unitCny);
    if (nextCur === 'USD') setUnitPriceInPrimary(currencyMetrics.unitUsd);
    setPrimaryCurrency(nextCur);
  };

  const handleUploadPhoto = async (
    target: 'front' | 'back',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressedUrl = await compressImageFileToDataUrl(file, 720, 0.8);
    if (compressedUrl) {
      if (target === 'front') setFrontPhotoUrl(compressedUrl);
      else setBackPhotoUrl(compressedUrl);
    }
    e.target.value = '';
  };

  const handleDownloadPdf = () => {
    const brandLabel = concept.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : 'BORNERS';
    const curSymbol =
      primaryCurrency === 'CNY' ? '¥' : primaryCurrency === 'USD' ? '$' : '₽';

    const sizeRows = SIZES.map((sz) => {
      const packs = packsBySize[sz] || 0;
      const pcs = packs * unitsPerPack;
      const sumPrimary = Number((pcs * unitPriceInPrimary).toFixed(0));
      const sumRub = Math.round(pcs * currencyMetrics.unitRub);
      return [
        sz,
        `${packs.toLocaleString('ru-RU')} наб.`,
        `${pcs.toLocaleString('ru-RU')} шт.`,
        `${unitPriceInPrimary} ${curSymbol} (${currencyMetrics.unitCny} ¥ / ${currencyMetrics.unitUsd} $ / ${currencyMetrics.unitRub} ₽)`,
        `${sumPrimary.toLocaleString('ru-RU')} ${curSymbol} (${sumRub.toLocaleString('ru-RU')} ₽)`,
      ];
    });

    const totalPrimary =
      primaryCurrency === 'CNY'
        ? `${currencyMetrics.totalCny.toLocaleString('ru-RU')} ¥`
        : primaryCurrency === 'USD'
        ? `${currencyMetrics.totalUsd.toLocaleString('ru-RU')} $`
        : `${currencyMetrics.totalRub.toLocaleString('ru-RU')} ₽`;

    downloadEditorialPdfDocument({
      fileName: `PDF_Спецификация_${concept.code}_${primaryCurrency}.pdf`,
      docCode: `${concept.code} · ${primaryCurrency}`,
      categoryLabel: 'ПРОИЗВОДСТВЕННЫЙ ЛИСТ (中文 + РУС)',
      brandLabel,
      title: docTitle,
      subtitle: `Фабрика: ${factoryName} · Валюта контракта: ${primaryCurrency} (¥ ${currencyMetrics.totalCny.toLocaleString(
        'ru-RU'
      )} / $ ${currencyMetrics.totalUsd.toLocaleString(
        'ru-RU'
      )} / ₽ ${currencyMetrics.totalRub.toLocaleString('ru-RU')})`,
      metaGrid: [
        { label: 'Артикул / 款号', value: concept.code },
        { label: 'Фабрика / 生产工厂', value: factoryName },
        {
          label: 'Цена 1 шт. (CNY / USD / RUB)',
          value: `¥${currencyMetrics.unitCny} · $${currencyMetrics.unitUsd} · ${currencyMetrics.unitRub}₽`,
        },
        {
          label: 'Сумма партии (3 валюты)',
          value: `¥${currencyMetrics.totalCny.toLocaleString('ru-RU')} / $${currencyMetrics.totalUsd.toLocaleString('ru-RU')}`,
        },
      ],
      frontPhotoUrl,
      backPhotoUrl,
      frontPhotoCaption: frontCaption,
      backPhotoCaption: backCaption,
      sections: [
        {
          badge: '中文 + РУС · BILINGUAL SPEC',
          title: 'Спецификация изделия: Крупный китайский (中文) + перевод на русский',
          subtitle: `Готовность: ${plannedReadyDate}`,
          bilingualSpecs: bilingualRows.map((r) => ({
            labelZh: r.labelZh,
            labelRu: r.labelRu,
            zhLarge: r.zhLarge,
            ruSmall: r.ruSmall,
            highlight: r.highlight,
          })),
        },
        {
          badge: 'MULTI-CURRENCY & SIZES',
          title: `Размерная сетка партии (S–4XL) и расчёт в ${primaryCurrency} / CNY / USD / RUB`,
          subtitle: `Курс: 1¥ = ${rateCnyToRub}₽ · 1$ = ${rateUsdToRub}₽`,
          table: {
            headers: [
              'Размер (尺码)',
              'Наборов (盒数)',
              `Штук (×${unitsPerPack} шт.)`,
              'Цена 1 шт. (CNY / USD / RUB)',
              `Сумма (${primaryCurrency} / RUB)`,
            ],
            rows: sizeRows,
            footer: [
              'ИТОГО ПАРТИЯ (合计)',
              `${currencyMetrics.totalPacks.toLocaleString('ru-RU')} наб.`,
              `${currencyMetrics.totalUnits.toLocaleString('ru-RU')} шт.`,
              `¥${currencyMetrics.unitCny} / $${currencyMetrics.unitUsd} / ${currencyMetrics.unitRub}₽`,
              `${totalPrimary} (${currencyMetrics.totalRub.toLocaleString('ru-RU')} ₽)`,
            ],
          },
          note: `Условия оплаты: ${paymentTerms}. Итого по контракту: ${currencyMetrics.totalCny.toLocaleString(
            'ru-RU'
          )} CNY (¥)  |  ${currencyMetrics.totalUsd.toLocaleString(
            'ru-RU'
          )} USD ($)  |  ${currencyMetrics.totalRub.toLocaleString('ru-RU')} RUB (₽).`,
        },
      ],
      footerRight: `${concept.code} · ¥${currencyMetrics.totalCny.toLocaleString('ru-RU')} / $${currencyMetrics.totalUsd.toLocaleString('ru-RU')}`,
    });

    if (onSaveToConcept) {
      onSaveToConcept({
        imageUrl: frontPhotoUrl,
        plannedUnitCost: currencyMetrics.unitRub,
        currency: primaryCurrency,
        techPack: {
          ...concept.techPack,
          zh: {
            ...concept.techPack.zh,
            construction: bilingualRows[0]?.zhLarge || concept.techPack.zh.construction,
            compositionAndDensity:
              bilingualRows[1]?.zhLarge || concept.techPack.zh.compositionAndDensity,
          },
          ru: {
            ...concept.techPack.ru,
            construction: bilingualRows[0]?.ruSmall || concept.techPack.ru.construction,
            compositionAndDensity:
              bilingualRows[1]?.ruSmall || concept.techPack.ru.compositionAndDensity,
          },
        },
      });
    }
  };

  const allCardPhotos = useMemo(() => {
    const urls = new Set<string>();
    if (concept.imageUrl) urls.add(concept.imageUrl);
    concept.galleryPhotos?.forEach((g) => {
      if (g.url) urls.add(g.url);
    });
    concept.samples?.forEach((s) => {
      s.photos?.forEach((p) => {
        if (p) urls.add(p);
      });
    });
    urls.add('images/products/rnd-soft-boxers.jpg');
    urls.add('images/products/rnd-seamless-base.jpg');
    urls.add('images/products/rnd-print-family.jpg');
    urls.add('images/products/borners-editorial-hero.jpg');
    urls.add('images/products/natele-editorial-hero.jpg');
    return Array.from(urls);
  }, [concept]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[70] bg-black/55 backdrop-blur-[2px] flex items-center justify-center p-3 md:p-6 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[1440px] max-h-[92vh] bg-[#FAF8F5] rounded-[18px] border-2 border-[#181715] shadow-2xl flex flex-col overflow-hidden"
      >
        {/* ШАПКА КОНСТРУКТОРА PDF */}
        <div className="px-6 py-4 bg-white border-b-2 border-[#181715] flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 text-[11.5px] font-mono uppercase tracking-wider text-[#B85D35] font-semibold">
              <span>КОНСТРУКТОР PDF ПЕРЕД ОТПРАВКОЙ НА ФАБРИКУ</span>
              <span>·</span>
              <span>中文 КРУПНО + РУССКИЙ МЕЛКО</span>
              <span>·</span>
              <span>CNY ¥ / USD $ / RUB ₽</span>
            </div>
            <h2 className="font-serif-editorial text-[24px] font-semibold text-[#181715] leading-tight mt-0.5">
              Настройка и выгрузка карточки «{concept.name}» в PDF (А4)
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-2 rounded-[10px] bg-[#181715] hover:bg-[#B85D35] text-white px-5 py-2.5 text-[13.5px] font-semibold transition cursor-pointer shadow-xs"
            >
              <FileText className="h-4 w-4" />
              <span>Скачать готовый PDF (А4)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Закрыть (или кликните на пустое место вокруг окна)"
              className="h-10 w-10 rounded-[10px] border-[1.5px] border-[#D4CDC2] hover:border-[#181715] bg-white flex items-center justify-center text-[#181715] cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ОСНОВНАЯ ЧАСТЬ: СЛЕВА КОНСТРУКТОР, СПРАВА ЖИВОЙ ПРЕДПРОСМОТР ЛИСТА PDF */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x-2 divide-[#D4CDC2]">
          {/* ЛЕВАЯ КОЛОНКА: НАСТРОЙКИ КОНСТРУКТОРА (7 колонок) */}
          <div className="lg:col-span-7 p-6 space-y-6 overflow-y-auto">
            {/* БЛОК 1: ФОТОГРАФИИ ТОВАРА (ЛИЦЕВАЯ + ВИД СЗАДИ/ДЕТАЛИ) */}
            <div className="rounded-[14px] bg-white border-[1.5px] border-[#CFC8BC] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-3">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#B85D35] font-semibold">
                    ШАГ 01 · ФОТОГРАФИИ В PDF
                  </span>
                  <h3 className="text-[16px] font-semibold text-[#181715]">
                    Лицевая фотография товара и вид сзади / детали
                  </h3>
                </div>
                <span className="text-[12px] text-[#1F6E50] font-medium bg-[#E6F4EE] px-2.5 py-1 rounded-[6px]">
                  ✓ Встраиваются прямо в PDF
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Лицевая фотография */}
                <div className="rounded-[12px] border-[1.5px] border-[#D4CDC2] bg-[#FAF8F5] p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] font-semibold text-[#181715]">
                      1. Лицевая фотография (正面图)
                    </span>
                    <label className="inline-flex items-center gap-1.5 rounded-[7px] bg-[#181715] text-white px-2.5 py-1 text-[11.5px] font-medium cursor-pointer hover:bg-[#B85D35] transition">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Загрузить фото</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUploadPhoto('front', e)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="h-40 rounded-[8px] bg-white border border-[#E5E0D8] flex items-center justify-center overflow-hidden p-2">
                    <img
                      src={frontPhotoUrl}
                      alt="Лицевая фотография"
                      decoding="async"
                      className="max-h-full max-w-full object-contain rounded-[6px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#7A756D] mb-1">
                      Подпись к лицевой фотографии:
                    </label>
                    <input
                      value={frontCaption}
                      onChange={(e) => setFrontCaption(e.target.value)}
                      className="w-full rounded-[7px] border border-[#D4CDC2] bg-white px-2.5 py-1.5 text-[12.5px] text-[#181715]"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {allCardPhotos.map((u, idx) => (
                      <button
                        key={`f-${idx}`}
                        type="button"
                        onClick={() => setFrontPhotoUrl(u)}
                        className={`h-10 w-10 rounded-[6px] border-2 overflow-hidden shrink-0 cursor-pointer ${
                          frontPhotoUrl === u ? 'border-[#B85D35]' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={u} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Вторая фотография (вид сзади / детали) */}
                <div className="rounded-[12px] border-[1.5px] border-[#D4CDC2] bg-[#FAF8F5] p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] font-semibold text-[#181715]">
                      2. Вид сзади / детали (背面图)
                    </span>
                    <label className="inline-flex items-center gap-1.5 rounded-[7px] bg-[#181715] text-white px-2.5 py-1 text-[11.5px] font-medium cursor-pointer hover:bg-[#B85D35] transition">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Загрузить фото</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUploadPhoto('back', e)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="h-40 rounded-[8px] bg-white border border-[#E5E0D8] flex items-center justify-center overflow-hidden p-2">
                    <img
                      src={backPhotoUrl}
                      alt="Вид сзади"
                      decoding="async"
                      className="max-h-full max-w-full object-contain rounded-[6px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#7A756D] mb-1">
                      Подпись ко второй фотографии:
                    </label>
                    <input
                      value={backCaption}
                      onChange={(e) => setBackCaption(e.target.value)}
                      className="w-full rounded-[7px] border border-[#D4CDC2] bg-white px-2.5 py-1.5 text-[12.5px] text-[#181715]"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {allCardPhotos.map((u, idx) => (
                      <button
                        key={`b-${idx}`}
                        type="button"
                        onClick={() => setBackPhotoUrl(u)}
                        className={`h-10 w-10 rounded-[6px] border-2 overflow-hidden shrink-0 cursor-pointer ${
                          backPhotoUrl === u ? 'border-[#B85D35]' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={u} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* БЛОК 2: МУЛЬТИВАЛЮТНЫЙ КАЛЬКУЛЯТОР (CNY ¥ / USD $ / RUB ₽) */}
            <div className="rounded-[14px] bg-white border-[1.5px] border-[#CFC8BC] p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAE6DF] pb-3">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#B85D35] font-semibold">
                    ШАГ 02 · УЧЁТ ВАЛЮТ (ЮАНИ / ДОЛЛАРЫ / РУБЛИ)
                  </span>
                  <h3 className="text-[16px] font-semibold text-[#181715]">
                    Валюта контракта и автоматический пересчёт CNY ¥ · USD $ · RUB ₽
                  </h3>
                </div>

                <div className="inline-flex rounded-[8px] bg-[#F2EFE9] p-1 border border-[#D4CDC2]">
                  {(
                    [
                      { code: 'CNY', label: '¥ Юани (CNY)' },
                      { code: 'USD', label: '$ Доллары (USD)' },
                      { code: 'RUB', label: '₽ Рубли (RUB)' },
                    ] as const
                  ).map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleCurrencySwitch(c.code)}
                      className={`px-3 py-1.5 rounded-[6px] text-[12.5px] font-semibold transition cursor-pointer ${
                        primaryCurrency === c.code
                          ? 'bg-[#181715] text-white shadow-2xs'
                          : 'text-[#5C5852] hover:text-[#181715]'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[#5C5852] mb-1">
                    Цена за 1 шт. в {primaryCurrency}:
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={unitPriceInPrimary}
                    onChange={(e) => setUnitPriceInPrimary(Number(e.target.value) || 0)}
                    className="w-full rounded-[8px] border-[1.5px] border-[#181715] bg-[#FAF8F5] px-3 py-2 text-[15px] font-semibold text-[#181715]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[#5C5852] mb-1">
                    Курс юаня (1 CNY ¥ = ₽):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={rateCnyToRub}
                    onChange={(e) => setRateCnyToRub(Number(e.target.value) || 1)}
                    className="w-full rounded-[8px] border border-[#D4CDC2] bg-white px-3 py-2 text-[14px] text-[#181715]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[#5C5852] mb-1">
                    Курс доллара (1 USD $ = ₽):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={rateUsdToRub}
                    onChange={(e) => setRateUsdToRub(Number(e.target.value) || 1)}
                    className="w-full rounded-[8px] border border-[#D4CDC2] bg-white px-3 py-2 text-[14px] text-[#181715]"
                  />
                </div>
              </div>

              {/* Сводная плашка в 3 валютах */}
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div
                  className={`rounded-[10px] p-3 border-[1.5px] ${
                    primaryCurrency === 'CNY'
                      ? 'bg-[#FBF3EE] border-[#B85D35]'
                      : 'bg-[#FAF8F5] border-[#E5E0D8]'
                  }`}
                >
                  <div className="text-[11px] font-mono uppercase text-[#7A756D]">
                    ЮАНИ · CNY (¥)
                  </div>
                  <div className="text-[18px] font-bold text-[#181715] mt-0.5">
                    ¥ {currencyMetrics.unitCny} <span className="text-[12px] font-normal">/ шт.</span>
                  </div>
                  <div className="text-[12px] text-[#B85D35] font-semibold mt-0.5">
                    Партия: ¥ {currencyMetrics.totalCny.toLocaleString('ru-RU')}
                  </div>
                </div>

                <div
                  className={`rounded-[10px] p-3 border-[1.5px] ${
                    primaryCurrency === 'USD'
                      ? 'bg-[#FBF3EE] border-[#B85D35]'
                      : 'bg-[#FAF8F5] border-[#E5E0D8]'
                  }`}
                >
                  <div className="text-[11px] font-mono uppercase text-[#7A756D]">
                    ДОЛЛАРЫ · USD ($)
                  </div>
                  <div className="text-[18px] font-bold text-[#181715] mt-0.5">
                    $ {currencyMetrics.unitUsd} <span className="text-[12px] font-normal">/ шт.</span>
                  </div>
                  <div className="text-[12px] text-[#B85D35] font-semibold mt-0.5">
                    Партия: $ {currencyMetrics.totalUsd.toLocaleString('ru-RU')}
                  </div>
                </div>

                <div
                  className={`rounded-[10px] p-3 border-[1.5px] ${
                    primaryCurrency === 'RUB'
                      ? 'bg-[#FBF3EE] border-[#B85D35]'
                      : 'bg-[#FAF8F5] border-[#E5E0D8]'
                  }`}
                >
                  <div className="text-[11px] font-mono uppercase text-[#7A756D]">
                    РУБЛИ · RUB (₽)
                  </div>
                  <div className="text-[18px] font-bold text-[#181715] mt-0.5">
                    {currencyMetrics.unitRub} ₽ <span className="text-[12px] font-normal">/ шт.</span>
                  </div>
                  <div className="text-[12px] text-[#B85D35] font-semibold mt-0.5">
                    Партия: {currencyMetrics.totalRub.toLocaleString('ru-RU')} ₽
                  </div>
                </div>
              </div>
            </div>

            {/* БЛОК 3: КРУПНЫЙ КИТАЙСКИЙ + МАЛЕНЬКИЙ РУССКИЙ (РЕДАКТОР СТРОК) */}
            <div className="rounded-[14px] bg-white border-[1.5px] border-[#CFC8BC] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-3">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#B85D35] font-semibold">
                    ШАГ 03 · КИТАЙСКИЙ КРУПНО + РУССКИЙ ПОДСТРОЧНО
                  </span>
                  <h3 className="text-[16px] font-semibold text-[#181715]">
                    Техническое описание для фабрики (редактируемые блоки)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setBilingualRows((prev) => [
                      ...prev,
                      {
                        id: `row-${Date.now()}`,
                        labelZh: '补充工艺要求',
                        labelRu: 'Дополнительное требование',
                        zhLarge: '请严格按照确认样衣尺寸及色卡生产',
                        ruSmall: 'Строго соблюдать табель мер и утверждённый выкрас образца',
                        highlight: false,
                      },
                    ])
                  }
                  className="inline-flex items-center gap-1.5 rounded-[8px] border-[1.5px] border-[#181715] bg-[#FAF8F5] hover:bg-[#181715] hover:text-white px-3 py-1.5 text-[12px] font-semibold transition cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Добавить блок</span>
                </button>
              </div>

              <div className="space-y-3">
                {bilingualRows.map((row, idx) => (
                  <div
                    key={row.id}
                    className="rounded-[10px] border border-[#D4CDC2] bg-[#FAF8F5] p-3.5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-[#181715] text-white">
                          0{idx + 1}
                        </span>
                        <input
                          value={row.labelZh}
                          onChange={(e) =>
                            setBilingualRows((prev) =>
                              prev.map((r) =>
                                r.id === row.id ? { ...r, labelZh: e.target.value } : r
                              )
                            )
                          }
                          className="rounded border border-[#D4CDC2] bg-white px-2 py-1 text-[12px] font-semibold text-[#181715] w-40"
                          placeholder="Заголовок ZH"
                        />
                        <input
                          value={row.labelRu}
                          onChange={(e) =>
                            setBilingualRows((prev) =>
                              prev.map((r) =>
                                r.id === row.id ? { ...r, labelRu: e.target.value } : r
                              )
                            )
                          }
                          className="rounded border border-[#D4CDC2] bg-white px-2 py-1 text-[12px] text-[#5C5852] flex-1"
                          placeholder="Заголовок RU"
                        />
                      </div>
                      {bilingualRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setBilingualRows((prev) => prev.filter((r) => r.id !== row.id))
                          }
                          className="text-[#8C867E] hover:text-[#B93829] p-1 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#B85D35] mb-0.5">
                        КРУПНЫЙ КИТАЙСКИЙ ТЕКСТ (大号中文 — главный для фабрики):
                      </label>
                      <input
                        value={row.zhLarge}
                        onChange={(e) =>
                          setBilingualRows((prev) =>
                            prev.map((r) =>
                              r.id === row.id ? { ...r, zhLarge: e.target.value } : r
                            )
                          )
                        }
                        className="w-full rounded-[7px] border-[1.5px] border-[#CFC8BC] bg-white px-3 py-2 text-[17px] font-bold text-[#181715]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#6E6A63] mb-0.5">
                        Подстрочный русский текст (мелким шрифтом под китайским):
                      </label>
                      <input
                        value={row.ruSmall}
                        onChange={(e) =>
                          setBilingualRows((prev) =>
                            prev.map((r) =>
                              r.id === row.id ? { ...r, ruSmall: e.target.value } : r
                            )
                          )
                        }
                        className="w-full rounded-[7px] border border-[#D4CDC2] bg-white px-3 py-1.5 text-[12.5px] text-[#4A4742]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* БЛОК 4: РАЗМЕРНАЯ СЕТКА И РЕКВИЗИТЫ КОНТРАКТА */}
            <div className="rounded-[14px] bg-white border-[1.5px] border-[#CFC8BC] p-5 space-y-4">
              <div className="border-b border-[#EAE6DF] pb-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#B85D35] font-semibold">
                  ШАГ 04 · РАЗМЕРНАЯ СЕТКА И УСЛОВИЯ
                </span>
                <h3 className="text-[16px] font-semibold text-[#181715]">
                  Количество наборов по размерам (S – 4XL) и фабрика
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11.5px] text-[#5C5852] mb-1">Фабрика:</label>
                  <input
                    value={factoryName}
                    onChange={(e) => setFactoryName(e.target.value)}
                    className="w-full rounded-[8px] border border-[#D4CDC2] px-3 py-1.5 text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] text-[#5C5852] mb-1">Дата готовности:</label>
                  <input
                    type="date"
                    value={plannedReadyDate}
                    onChange={(e) => setPlannedReadyDate(e.target.value)}
                    className="w-full rounded-[8px] border border-[#D4CDC2] px-3 py-1.5 text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] text-[#5C5852] mb-1">Штук в 1 наборе:</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={unitsPerPack}
                    onChange={(e) => setUnitsPerPack(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full rounded-[8px] border border-[#D4CDC2] px-3 py-1.5 text-[13px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 pt-1">
                {SIZES.map((sz) => (
                  <div
                    key={sz}
                    className="rounded-[8px] border border-[#D4CDC2] bg-[#FAF8F5] p-2 text-center"
                  >
                    <div className="font-mono text-[12px] font-bold text-[#181715]">{sz}</div>
                    <input
                      type="number"
                      min={0}
                      value={packsBySize[sz] || 0}
                      onChange={(e) =>
                        setPacksBySize((prev) => ({
                          ...prev,
                          [sz]: Math.max(0, Number(e.target.value) || 0),
                        }))
                      }
                      className="mt-1 w-full rounded border border-[#D4CDC2] bg-white px-1.5 py-1 text-center text-[13px] font-semibold"
                    />
                    <div className="text-[10px] text-[#7A756D] mt-0.5">
                      {((packsBySize[sz] || 0) * unitsPerPack).toLocaleString('ru-RU')} шт.
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ПРАВАЯ КОЛОНКА: ЖИВОЙ ПРЕДПРОСМОТР ЛИСТА PDF (5 колонок) */}
          <div className="lg:col-span-5 bg-[#EFECE6] p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-mono uppercase tracking-wider font-semibold text-[#5C5852]">
                  Живой макет листа А4 (Предпросмотр PDF)
                </span>
                <span className="text-[11.5px] font-medium text-[#1F6E50] bg-[#E6F4EE] px-2.5 py-0.5 rounded">
                  Готов к выгрузке
                </span>
              </div>

              {/* ВИЗУАЛЬНЫЙ ЛИСТ A4 */}
              <div className="bg-[#FAF8F5] rounded-[12px] border-2 border-[#181715] shadow-lg p-5 space-y-4">
                <div className="border-b-2 border-[#181715] pb-3 flex items-start justify-between gap-2">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-[#7A756D]">
                      BORNERS GROUP · PRODUCTION ORDER · {concept.code}
                    </div>
                    <div className="font-serif-editorial text-[19px] font-bold text-[#181715] leading-snug mt-0.5">
                      {docTitle}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-[#181715] text-white font-mono text-[10.5px] font-semibold shrink-0">
                    {concept.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : 'BORNERS'}
                  </span>
                </div>

                {/* Превью 2 фотографий: Лицевая + Вид сзади */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[8px] bg-white border-[1.5px] border-[#CFC8BC] p-2.5 flex items-center gap-2.5">
                    <img
                      src={frontPhotoUrl}
                      alt="Лицевая"
                      className="h-16 w-16 rounded object-contain bg-[#F3EFE8] shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-mono text-[9.5px] font-bold text-[#B85D35]">
                        01 · 正面实物图
                      </div>
                      <div className="text-[13px] font-bold text-[#181715] truncate">
                        请按正面图生产
                      </div>
                      <div className="text-[10.5px] text-[#6E6A63] line-clamp-2 leading-tight">
                        {frontCaption}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[8px] bg-white border-[1.5px] border-[#CFC8BC] p-2.5 flex items-center gap-2.5">
                    <img
                      src={backPhotoUrl}
                      alt="Вид сзади"
                      className="h-16 w-16 rounded object-contain bg-[#F3EFE8] shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-mono text-[9.5px] font-bold text-[#B85D35]">
                        02 · 背面及细节
                      </div>
                      <div className="text-[13px] font-bold text-[#181715] truncate">
                        腰头与平缝细节
                      </div>
                      <div className="text-[10.5px] text-[#6E6A63] line-clamp-2 leading-tight">
                        {backCaption}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Превью: Крупный китайский + маленький русский */}
                <div className="space-y-2">
                  <div className="text-[10.5px] font-mono uppercase tracking-wider text-[#B85D35] font-bold">
                    中文大字 + 俄文小字 · Спецификация для фабрики КНР
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {bilingualRows.map((r) => (
                      <div
                        key={r.id}
                        className="rounded-[8px] bg-white border-[1.5px] border-[#D4CDC2] px-3 py-2"
                      >
                        <div className="text-[10px] font-mono text-[#8C867E]">
                          {r.labelZh} · {r.labelRu}
                        </div>
                        <div className="text-[17px] font-bold text-[#181715] leading-snug mt-0.5">
                          {r.zhLarge}
                        </div>
                        <div className="text-[11.5px] text-[#5C5852] leading-snug mt-0.5">
                          {r.ruSmall}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Превью мультивалютного итога */}
                <div className="rounded-[8px] bg-[#181715] text-white p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#D4CDC2]">
                    <span>ИТОГО ПАРТИЯ ({currencyMetrics.totalUnits.toLocaleString('ru-RU')} ШТ.)</span>
                    <span>ВАЛЮТА: {primaryCurrency}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/15 text-center">
                    <div>
                      <div className="text-[10px] text-[#D4CDC2]">ЮАНИ (CNY)</div>
                      <div className="text-[14px] font-bold text-[#F5B895]">
                        ¥ {currencyMetrics.totalCny.toLocaleString('ru-RU')}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#D4CDC2]">ДОЛЛАРЫ (USD)</div>
                      <div className="text-[14px] font-bold text-white">
                        $ {currencyMetrics.totalUsd.toLocaleString('ru-RU')}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#D4CDC2]">РУБЛИ (RUB)</div>
                      <div className="text-[14px] font-bold text-white">
                        {currencyMetrics.totalRub.toLocaleString('ru-RU')} ₽
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="w-full inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#181715] hover:bg-[#B85D35] text-white py-3.5 px-5 text-[14.5px] font-semibold transition cursor-pointer shadow-md"
              >
                <Check className="h-4 w-4" />
                <span>Сформировать и скачать PDF-спецификацию (А4)</span>
              </button>
              <div className="text-center text-[11.5px] text-[#6E6A63]">
                Кликните в любое пустое место за пределами окна, чтобы закрыть конструктор
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
