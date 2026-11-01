'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  MoreHorizontal,
  Edit3,
  Printer,
  Copy,
  Archive,
  Trash2,
  Upload,
  Star,
  CheckCircle2,
  Info,
  FileText,
  Sparkles,
} from 'lucide-react';
import {
  GrowthScenarioDef,
  MONTHS_SHORT_RU,
  ScenarioModelSpec,
  computeModelScenarioMetrics,
} from '@/lib/scenarioData';
import {
  BoxerPackStackSvg,
  TechnicalFlatDrawingSvg,
} from '@/components/sections/ScenarioVisualParts';

interface ScenarioModelCardScreenProps {
  model: ScenarioModelSpec;
  scenario: GrowthScenarioDef;
  onBackToScenarios: () => void;
  onOpenSalesPlan: () => void;
  onUpdateModel: (updated: ScenarioModelSpec) => void;
  onDuplicateModel: (model: ScenarioModelSpec) => void;
  onDeleteOrArchiveModel: (model: ScenarioModelSpec) => void;
  onOpenPdfModal: () => void;
  notify: (type: 'success' | 'warning' | 'error', title: string, desc?: string) => void;
}

export function ScenarioModelCardScreen({
  model,
  scenario,
  onBackToScenarios,
  onOpenSalesPlan,
  onUpdateModel,
  onDuplicateModel,
  onDeleteOrArchiveModel,
  onOpenPdfModal,
  notify,
}: ScenarioModelCardScreenProps) {
  // По умолчанию всегда открыта вкладка «Обзор» (п. 4.3 ТЗ)
  const [activeTab, setActiveTab] = useState<
    'overview' | 'production' | 'economics' | 'spec'
  >('overview');
  const [selectedGalleryId, setSelectedGalleryId] = useState<string>(
    () => model.gallery.find((g) => g.isMain)?.id || model.gallery[0]?.id || 'g-1'
  );
  const [expandedPaletteIds, setExpandedPaletteIds] = useState<string[]>([
    model.palettes[0]?.id || 'pal-sorbet',
    model.palettes[1]?.id || 'pal-riviera',
  ]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const metrics = computeModelScenarioMetrics(model, scenario);
  const activeGalleryItem =
    model.gallery.find((g) => g.id === selectedGalleryId) ||
    model.gallery.find((g) => g.isMain) ||
    model.gallery[0];

  const primaryColors = model.palettes[0]?.colors || [];

  const handleSetMainGallery = (galleryId: string) => {
    const nextGallery = model.gallery.map((g) => ({
      ...g,
      isMain: g.id === galleryId,
    }));
    onUpdateModel({
      ...model,
      gallery: nextGallery,
    });
    notify('success', 'Главное фото карточки модели обновлено и сохранено');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    files.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : '';
        if (!dataUrl) return;
        const newItemId = `g-upload-${Date.now()}-${idx}`;
        const nextGallery = [
          ...model.gallery,
          {
            id: newItemId,
            category: 'pack' as const,
            label: file.name.slice(0, 18),
            url: dataUrl,
            isMain: false,
          },
        ];
        onUpdateModel({
          ...model,
          gallery: nextGallery,
        });
        setSelectedGalleryId(newItemId);
      };
      reader.readAsDataURL(file);
    });
    notify('success', `Загружено фото: ${files.length} шт.`);
  };

  const togglePaletteExpand = (id: string) => {
    setExpandedPaletteIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  return (
    <div
      data-tour="model-passport"
      className="rounded-[24px] bg-[#FAF8F4] border border-[#E6E0D4] p-5 md:p-7 space-y-6 shadow-[0_12px_36px_rgba(24,23,21,0.05)]"
    >
      {/* 4.1. ВЕРХНЯЯ ПАНЕЛЬ КАРТОЧКИ МОДЕЛИ (Стр. 5 и Стр. 14 макета) */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E6E0D4]">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-[#6E6E73]">
            <button
              type="button"
              onClick={onBackToScenarios}
              className="inline-flex items-center gap-1.5 font-semibold text-[#1D1D1F] hover:text-[#8B6F47] transition cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Стратегия роста</span>
            </button>
            <span>/</span>
            <span>{scenario.title}</span>
            <span>/</span>
            <span>Модели</span>
            <span>/</span>
            <span className="font-bold text-[#1D1D1F]">
              {model.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : 'BORNERS'} {model.code}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-[22px] md:text-[26px] font-bold tracking-[-0.02em] text-[#1D1D1F]">
              {model.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : 'BORNERS'} {model.code} /{' '}
              {model.title}
            </h2>
            <span className="px-2.5 py-1 rounded-full bg-[#EFECE4] text-[#5A564F] text-[11.5px] font-semibold">
              {model.subtitle}
            </span>
          </div>
        </div>

        {/* Справа: статус, Редактировать, меню «⋯» */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={model.launchStatus}
            onChange={(e) =>
              onUpdateModel({
                ...model,
                launchStatus: e.target.value as ScenarioModelSpec['launchStatus'],
              })
            }
            className="h-9 px-3 rounded-[10px] bg-white border border-[#DED8CC] text-[12.5px] font-semibold text-[#1D1D1F] cursor-pointer"
          >
            <option value="В плане">Статус: В плане</option>
            <option value="В разработке">Статус: В разработке</option>
            <option value="Утверждено">Статус: Утверждено</option>
            <option value="В архиве">Статус: В архиве</option>
          </select>

          <button
            type="button"
            onClick={() => setIsEditing((v) => !v)}
            className={`h-9 px-3.5 rounded-[10px] border text-[12.5px] font-semibold inline-flex items-center gap-1.5 transition cursor-pointer ${
              isEditing
                ? 'bg-[#2E6B4E] text-white border-[#2E6B4E]'
                : 'bg-white hover:bg-[#F3F0E8] text-[#1D1D1F] border-[#DED8CC]'
            }`}
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>{isEditing ? 'Сохранить' : 'Редактировать'}</span>
          </button>

          {/* Меню «⋯» (Дублировать, Экспортировать ТЗ в PDF, Архивировать/Удалить) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="h-9 w-9 rounded-[10px] bg-white hover:bg-[#F3F0E8] border border-[#DED8CC] flex items-center justify-center text-[#1D1D1F] cursor-pointer"
              title="Действия с моделью"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-1.5 w-60 rounded-[14px] bg-white border border-[#DED8CC] shadow-xl py-1.5 z-30 text-[12.5px]">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDuplicateModel(model);
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-[#FAF8F4] flex items-center gap-2.5 text-[#1D1D1F] cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5 text-[#6E6E73]" />
                  <span>Дублировать модель</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenPdfModal();
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-[#FAF8F4] flex items-center gap-2.5 text-[#1D1D1F] cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5 text-[#6E6E73]" />
                  <span>Экспортировать ТЗ в PDF</span>
                </button>
                <div className="my-1 border-t border-[#EFECE4]" />
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDeleteOrArchiveModel(model);
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-[#FFF4F2] flex items-center gap-2.5 text-[#C93B2B] cursor-pointer"
                >
                  {model.hasActualSalesOrPurchases ? (
                    <>
                      <Archive className="h-3.5 w-3.5" />
                      <span>Перенести в архив</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Удалить модель</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Быстрая панель редактирования основных параметров, если включён режим «Редактировать» */}
      {isEditing && (
        <div className="rounded-[16px] bg-white border border-[#C8A97E] p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 shadow-xs">
          <div>
            <label className="text-[11px] font-semibold text-[#6E6E73]">
              Название модели
            </label>
            <input
              type="text"
              value={model.title}
              onChange={(e) => onUpdateModel({ ...model, title: e.target.value })}
              className="w-full h-8 px-2.5 mt-1 rounded-[8px] border border-[#D4CDC2] text-[12.5px] font-semibold"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#6E6E73]">
              Комплектация (шт. в наборе)
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={model.unitsInPack}
              onChange={(e) =>
                onUpdateModel({
                  ...model,
                  unitsInPack: Math.max(1, Number(e.target.value) || 1),
                })
              }
              className="w-full h-8 px-2.5 mt-1 rounded-[8px] border border-[#D4CDC2] text-[12.5px] font-semibold"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#6E6E73]">
              Розничная цена (₽ / компл.)
            </label>
            <input
              type="number"
              value={model.retailPriceRub}
              onChange={(e) => {
                const nextPrice = Math.max(100, Number(e.target.value) || 0);
                const plan = model.plansByScenario[scenario.id];
                onUpdateModel({
                  ...model,
                  retailPriceRub: nextPrice,
                  plansByScenario: plan
                    ? {
                        ...model.plansByScenario,
                        [scenario.id]: {
                          ...plan,
                          monthlyPricesRub: Array(12).fill(nextPrice),
                        },
                      }
                    : model.plansByScenario,
                });
              }}
              className="w-full h-8 px-2.5 mt-1 rounded-[8px] border border-[#D4CDC2] text-[12.5px] font-semibold"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#6E6E73]">
              Закупочная себестоимость (₽ / компл.)
            </label>
            <input
              type="number"
              value={model.unitCostRub}
              onChange={(e) =>
                onUpdateModel({
                  ...model,
                  unitCostRub: Math.max(50, Number(e.target.value) || 0),
                })
              }
              className="w-full h-8 px-2.5 mt-1 rounded-[8px] border border-[#D4CDC2] text-[12.5px] font-semibold"
            />
          </div>
        </div>
      )}

      {/* 4.2. ГЛАВНЫЙ БЛОК — ДВЕ КОЛОНКИ: СЛЕВА ГАЛЕРЕЯ + ФОТО, СПРАВА 6 ФИНАНСОВЫХ ПОКАЗАТЕЛЕЙ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Левая половина (6 колонок): Вертикальная галерея миниатюр + Крупное главное фото */}
        <div className="lg:col-span-6 rounded-[20px] bg-white border border-[#E6E0D4] p-4 flex flex-col sm:flex-row gap-3.5 shadow-2xs">
          {/* Вертикальная галерея миниатюр (Весь комплект, Отдельное изделие, Резинка, Ткань, Посадка, Видео + Загрузка) */}
          <div className="sm:w-[135px] flex sm:flex-col gap-1.5 overflow-x-auto sm:overflow-visible shrink-0">
            {model.gallery.map((item) => {
              const isSelected = item.id === activeGalleryItem?.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedGalleryId(item.id)}
                  className={`px-2.5 py-2 rounded-[10px] border text-left transition cursor-pointer flex items-center justify-between gap-1.5 shrink-0 ${
                    isSelected
                      ? 'bg-[#1D1D1F] text-white border-[#1D1D1F] shadow-2xs'
                      : 'bg-[#FAF8F4] hover:bg-[#F2EFE8] text-[#4A4740] border-[#E6E0D4]'
                  }`}
                >
                  <span className="text-[11.5px] font-semibold truncate">
                    {item.label}
                  </span>
                  {item.isMain && (
                    <Star
                      className={`h-3 w-3 shrink-0 ${
                        isSelected
                          ? 'text-[#E5B869] fill-[#E5B869]'
                          : 'text-[#C89D54] fill-[#C89D54]'
                      }`}
                    />
                  )}
                </button>
              );
            })}

            <label className="px-2.5 py-2 rounded-[10px] border border-dashed border-[#C8A97E] bg-[#FAF6EE] hover:bg-[#F3ECE0] text-[#7A5C38] text-[11px] font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition shrink-0">
              <Upload className="h-3.5 w-3.5" />
              <span>+ Загрузить фото</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Крупное главное изображение товара + кнопка «Назначить главным» (Тест 09) */}
          <div className="flex-1 rounded-[16px] bg-gradient-to-b from-[#FAF7F0] to-[#F2ECE1] border border-[#EAE3D5] p-4 flex flex-col justify-between relative">
            <div className="flex items-center justify-between gap-2 z-10">
              <span className="px-2.5 py-1 rounded-full bg-white/90 border border-[#E5DEC9] text-[11px] font-semibold text-[#1D1D1F]">
                {activeGalleryItem?.label || 'Весь комплект'}
              </span>

              {activeGalleryItem && !activeGalleryItem.isMain ? (
                <button
                  type="button"
                  onClick={() => handleSetMainGallery(activeGalleryItem.id)}
                  className="h-7 px-2.5 rounded-full bg-[#1D1D1F] text-white text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Star className="h-3 w-3 text-[#E5B869]" />
                  <span>Назначить главным</span>
                </button>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-[#2E6B4E]/12 text-[#2E6B4E] text-[11px] font-bold inline-flex items-center gap-1">
                  <Star className="h-3 w-3 fill-[#2E6B4E]" />
                  Главное фото
                </span>
              )}
            </div>

            <div className="my-auto py-2">
              <BoxerPackStackSvg
                colors={primaryColors}
                large
                brandLabel={model.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : 'BORNERS'}
                category={activeGalleryItem?.category || 'pack'}
                customPhotoUrl={activeGalleryItem?.url}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#6E6E73] pt-1 border-t border-[#E6DFD1]">
              <span>
                1 комплект = {model.unitsInPack} шт. · {model.palettes.length} палитры
              </span>
              <span className="font-semibold text-[#1D1D1F]">
                {model.fabric.composition.split(',')[0]}
              </span>
            </div>
          </div>
        </div>

        {/* Правая половина (6 колонок): Финансовая сводка — РОВНО 6 АВТОМАТИЧЕСКИХ ПОКАЗАТЕЛЕЙ (п. 4.2 ТЗ) */}
        <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-3 content-between">
          {/* 1. Прогноз выручки за год */}
          <div className="rounded-[18px] bg-white border border-[#E6E0D4] p-4 flex flex-col justify-between shadow-2xs">
            <div className="text-[11.5px] text-[#6E6E73]">Прогноз выручки за год</div>
            <div className="my-2">
              <div className="text-[23px] font-bold tracking-[-0.02em] text-[#1D1D1F]">
                {(metrics.annualRevenueRub / 1_000_000).toFixed(1).replace('.', ',')} млн ₽
              </div>
              <div className="text-[11px] text-[#8B6F47] font-semibold mt-0.5">
                Сумма 12 месяцев {scenario.year}
              </div>
            </div>
          </div>

          {/* 2. Выручка в целевом месяце */}
          <div className="rounded-[18px] bg-white border border-[#E6E0D4] p-4 flex flex-col justify-between shadow-2xs">
            <div className="text-[11.5px] text-[#6E6E73]">
              Выручка в целевом месяце
            </div>
            <div className="my-2">
              <div className="text-[23px] font-bold tracking-[-0.02em] text-[#1D1D1F]">
                {(metrics.targetMonthRevenueRub / 1_000_000)
                  .toFixed(1)
                  .replace('.', ',')}{' '}
                млн ₽
              </div>
              <div className="text-[11px] font-semibold text-[#2E6B4E] mt-0.5">
                Вклад в цель: {metrics.goalSharePct.toFixed(1).replace('.', ',')}% (
                {scenario.targetMonthLabel})
              </div>
            </div>
          </div>

          {/* 3. Средняя цена реализации */}
          <div className="rounded-[18px] bg-white border border-[#E6E0D4] p-4 flex flex-col justify-between shadow-2xs">
            <div className="text-[11.5px] text-[#6E6E73]">Средняя цена реализации</div>
            <div className="my-2">
              <div className="text-[23px] font-bold tracking-[-0.02em] text-[#1D1D1F]">
                {metrics.avgRetailPriceRub.toLocaleString('ru-RU')} ₽
              </div>
              <div className="text-[11px] text-[#6E6E73] mt-0.5">
                за комплект ({model.unitsInPack} шт.)
              </div>
            </div>
          </div>

          {/* 4. Закупочная себестоимость под ключ */}
          <div className="rounded-[18px] bg-white border border-[#E6E0D4] p-4 flex flex-col justify-between shadow-2xs">
            <div className="text-[11.5px] text-[#6E6E73]">
              Закупочная себестоимость
            </div>
            <div className="my-2">
              <div className="text-[23px] font-bold tracking-[-0.02em] text-[#1D1D1F]">
                {model.unitCostRub.toLocaleString('ru-RU')} ₽
              </div>
              <div className="text-[11px] text-[#6E6E73] mt-0.5">
                под ключ в РФ ({Math.round(model.unitCostRub / model.unitsInPack)} ₽ / шт.)
              </div>
            </div>
          </div>

          {/* 5. Маржинальность (с формулой по наведению) */}
          <div
            title={`Формула: (Цена ${metrics.avgRetailPriceRub} ₽ − Себестоимость ${model.unitCostRub} ₽ − Комиссия ${metrics.feeRub} ₽ − Логистика ${model.logisticsRub} ₽ − Реклама ${metrics.adsRub} ₽) ÷ Цена = ${metrics.unitMarginRub} ₽ (${metrics.unitMarginPct}%)`}
            className="rounded-[18px] bg-white border border-[#E6E0D4] p-4 flex flex-col justify-between shadow-2xs cursor-help"
          >
            <div className="flex items-center justify-between text-[11.5px] text-[#6E6E73]">
              <span>Маржинальность</span>
              <Info className="h-3.5 w-3.5 text-[#8B6F47]" />
            </div>
            <div className="my-2">
              <div className="text-[23px] font-bold tracking-[-0.02em] text-[#2E6B4E]">
                {metrics.unitMarginPct}%
              </div>
              <div className="text-[11px] text-[#2E6B4E] font-semibold mt-0.5">
                +{metrics.unitMarginRub} ₽ чистыми с комплекта
              </div>
            </div>
          </div>

          {/* 6. План продаж за год (в комплектах) */}
          <div className="rounded-[18px] bg-white border border-[#E6E0D4] p-4 flex flex-col justify-between shadow-2xs">
            <div className="text-[11.5px] text-[#6E6E73]">План продаж за год</div>
            <div className="my-2">
              <div className="text-[23px] font-bold tracking-[-0.02em] text-[#1D1D1F]">
                {metrics.annualPacks.toLocaleString('ru-RU')}
              </div>
              <div className="text-[11px] text-[#6E6E73] mt-0.5">
                компл. (~{metrics.avgMonthlyPacks.toLocaleString('ru-RU')} компл./мес)
              </div>
            </div>
          </div>

          {/* Кнопка быстрого перехода на Экран №3 (План продаж и производства) */}
          <div className="col-span-2 sm:col-span-3 rounded-[16px] bg-[#1D1D1F] text-white p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[13px] font-bold">
                Детальный помесячный план продаж, поставок и остатков ({scenario.year})
              </div>
              <div className="text-[11.5px] text-white/70">
                1-й заказ: {(metrics.plan.firstOrderPacks * model.unitsInPack).toLocaleString('ru-RU')}{' '}
                шт. ({metrics.plan.firstOrderPacks.toLocaleString('ru-RU')} комплектов) · старт
                продаж: {MONTHS_SHORT_RU[metrics.plan.salesStartMonthIdx]} {scenario.year}
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenSalesPlan}
              className="h-9 px-4 rounded-[10px] bg-white text-[#1D1D1F] hover:bg-[#F5F2EB] text-[12.5px] font-bold inline-flex items-center gap-1.5 transition cursor-pointer shrink-0"
            >
              <span>Открыть План продаж (Экран №3)</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4.3. ПЯТЬ ВКЛАДОК КАРТОЧКИ МОДЕЛИ (открыта всегда только одна, по умолчанию — «Обзор») */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-b border-[#E6E0D4] pb-3">
        <div className="inline-flex flex-wrap gap-1.5 rounded-[12px] bg-[#EFECE4] p-1 border border-[#E2DDD2]">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`h-8 px-3.5 rounded-[9px] text-[12.5px] font-semibold transition cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#1D1D1F] text-white shadow-2xs'
                : 'text-[#5A564F] hover:text-[#1D1D1F]'
            }`}
          >
            Обзор
          </button>
          <button
            type="button"
            onClick={onOpenSalesPlan}
            className="h-8 px-3.5 rounded-[9px] text-[12.5px] font-semibold text-[#5A564F] hover:text-[#1D1D1F] hover:bg-white/60 transition cursor-pointer inline-flex items-center gap-1"
          >
            <span>План продаж</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('production')}
            className={`h-8 px-3.5 rounded-[9px] text-[12.5px] font-semibold transition cursor-pointer ${
              activeTab === 'production'
                ? 'bg-[#1D1D1F] text-white shadow-2xs'
                : 'text-[#5A564F] hover:text-[#1D1D1F]'
            }`}
          >
            Производство
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('economics')}
            className={`h-8 px-3.5 rounded-[9px] text-[12.5px] font-semibold transition cursor-pointer ${
              activeTab === 'economics'
                ? 'bg-[#1D1D1F] text-white shadow-2xs'
                : 'text-[#5A564F] hover:text-[#1D1D1F]'
            }`}
          >
            Экономика
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('spec')}
            className={`h-8 px-3.5 rounded-[9px] text-[12.5px] font-semibold transition cursor-pointer ${
              activeTab === 'spec'
                ? 'bg-[#1D1D1F] text-white shadow-2xs'
                : 'text-[#5A564F] hover:text-[#1D1D1F]'
            }`}
          >
            Спецификация
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenPdfModal}
          className="h-8 px-3.5 rounded-[9px] bg-white hover:bg-[#F3F0E8] border border-[#DED8CC] text-[12px] font-semibold text-[#1D1D1F] inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Printer className="h-3.5 w-3.5 text-[#8B6F47]" />
          <span>Скачать техническое задание PDF</span>
        </button>
      </div>

      {/* СОДЕРЖИМОЕ ВЫБРАННОЙ ВКЛАДКИ (ВСЕГДА ТОЛЬКО ОДНА АКТИВНАЯ ВКЛАДКА) */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* Верхняя сводка обзора + 3 технических блока (Характеристики, Состав, Резинка) как на макете Стр. 14 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-[18px] bg-white border border-[#E6E0D4] p-4 space-y-2.5 shadow-2xs">
              <div className="text-[13.5px] font-bold text-[#1D1D1F]">Характеристики</div>
              <div className="space-y-1.5 text-[12px]">
                <div className="flex justify-between gap-2">
                  <span className="text-[#6E6E73]">Тип изделия:</span>
                  <span className="font-semibold text-[#1D1D1F] text-right">
                    {model.construction.type}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#6E6E73]">Комплектация:</span>
                  <span className="font-semibold text-[#1D1D1F] text-right">
                    1 комплект = {model.unitsInPack} шт.
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#6E6E73]">Посадка:</span>
                  <span className="font-semibold text-[#1D1D1F] text-right">
                    {model.construction.fit}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#6E6E73]">Передняя панель:</span>
                  <span className="font-semibold text-[#1D1D1F] text-right">
                    {model.construction.frontPanel}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#6E6E73]">Ластовица:</span>
                  <span className="font-semibold text-[#1D1D1F] text-right">
                    {model.construction.gusset}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-[18px] bg-white border border-[#E6E0D4] p-4 space-y-2.5 shadow-2xs">
              <div className="text-[13.5px] font-bold text-[#1D1D1F]">
                Состав и материалы
              </div>
              <div className="space-y-1.5 text-[12px]">
                <div className="flex justify-between gap-2">
                  <span className="text-[#6E6E73]">Основное полотно:</span>
                  <span className="font-semibold text-[#1D1D1F] text-right">
                    {model.fabric.composition}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#6E6E73]">Плотность:</span>
                  <span className="font-semibold text-[#1D1D1F] text-right">
                    {model.fabric.density}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#6E6E73]">Переплетение:</span>
                  <span className="font-semibold text-[#1D1D1F] text-right">
                    {model.fabric.knitType}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#6E6E73]">Тактильность:</span>
                  <span className="font-semibold text-[#1D1D1F] text-right">
                    {model.fabric.touchFeel}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#6E6E73]">Старт продаж:</span>
                  <span className="font-bold text-[#2E6B4E] text-right">
                    {MONTHS_SHORT_RU[metrics.plan.salesStartMonthIdx]} {scenario.year}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-[18px] bg-white border border-[#E6E0D4] p-4 space-y-2.5 shadow-2xs">
              <div className="text-[13.5px] font-bold text-[#1D1D1F]">
                Резинка {model.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : 'BORNERS'}
              </div>
              <div className="space-y-1.5 text-[12px]">
                <div className="flex justify-between gap-2">
                  <span className="text-[#6E6E73]">Ширина:</span>
                  <span className="font-semibold text-[#1D1D1F] text-right">
                    {model.waistband.width}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#6E6E73]">Цвет резинки:</span>
                  <span className="font-semibold text-[#1D1D1F] text-right">
                    {model.waistband.colorRule}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#6E6E73]">Логотип:</span>
                  <span className="font-semibold text-[#1D1D1F] text-right">
                    {model.waistband.logoRepeat}
                  </span>
                </div>
              </div>
              <div
                className="h-8 rounded-[8px] flex items-center justify-around px-3 text-[10.5px] font-extrabold tracking-[0.2em]"
                style={{
                  backgroundColor: model.waistband.bandBgHex,
                  color: model.waistband.bandTextHex,
                }}
              >
                <span>{model.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : 'BORNERS'}</span>
                <span>{model.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : 'BORNERS'}</span>
                <span>{model.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : 'BORNERS'}</span>
              </div>
            </div>
          </div>

          {/* Цветовые палитры SORBET CLUB и RIVIERA (Тест 08: сворачивание/разворачивание с Pantone) */}
          <div className="rounded-[20px] bg-white border border-[#E6E0D4] p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-bold text-[#1D1D1F]">
                  Цветовые палитры и наборы ({model.palettes.length} палитры)
                </h3>
                <p className="text-[11.5px] text-[#6E6E73]">
                  Кликните на палитру, чтобы свернуть или развернуть коды Pantone
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {model.palettes.map((pal) => {
                const isExpanded = expandedPaletteIds.includes(pal.id);
                return (
                  <div
                    key={pal.id}
                    className="rounded-[16px] bg-[#FAF8F4] border border-[#E6E0D4] p-4 space-y-3"
                  >
                    <button
                      type="button"
                      onClick={() => togglePaletteExpand(pal.id)}
                      className="w-full flex items-center justify-between gap-2 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-[12.5px] font-bold text-[#1D1D1F]">
                          {pal.title}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#2E6B4E]/12 text-[#2E6B4E] text-[10px] font-bold">
                          {pal.statusLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {pal.colors.map((c) => (
                          <span
                            key={c.nameRu}
                            className="h-4 w-4 rounded-full border border-black/15"
                            style={{ backgroundColor: c.hex }}
                          />
                        ))}
                        <span className="text-[11px] font-semibold text-[#8B6F47] ml-1">
                          {isExpanded ? 'Свернуть' : 'Pantone ↓'}
                        </span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                        {pal.colors.map((c) => (
                          <div
                            key={c.nameRu}
                            className="rounded-[12px] bg-white border border-[#E5DEC9] p-2.5 space-y-1.5"
                          >
                            <div
                              className="h-10 rounded-[8px] border border-black/10"
                              style={{ backgroundColor: c.hex }}
                            />
                            <div className="text-[11px] font-bold text-[#1D1D1F] leading-tight">
                              {c.nameRu}
                            </div>
                            <div className="text-[10px] font-mono text-[#6E6E73]">
                              {c.pantone}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'production' && (
        <div className="rounded-[20px] bg-white border border-[#E6E0D4] p-5 space-y-5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-[16px] font-bold text-[#1D1D1F]">
                Производственный статус и график партии
              </h3>
              <p className="text-[12px] text-[#6E6E73]">
                Ответственный: <span className="font-semibold text-[#1D1D1F]">{model.responsiblePerson}</span> · Объём 1-го заказа:{' '}
                <span className="font-semibold text-[#1D1D1F]">
                  {metrics.plan.firstOrderPacks.toLocaleString('ru-RU')} комплектов ={' '}
                  {(metrics.plan.firstOrderPacks * model.unitsInPack).toLocaleString('ru-RU')} отдельных штук
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="px-2.5 py-1 rounded-full bg-[#2E6B4E]/12 text-[#2E6B4E] font-bold">
                ● Подтверждено фабрикой
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#D97706]/15 text-[#B45309] font-bold">
                ● Плановое / Требует подтверждения
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {model.productionSteps.map((step) => (
              <div
                key={step.id}
                className={`rounded-[14px] border p-3.5 flex flex-col justify-between space-y-3 ${
                  step.status === 'done'
                    ? 'bg-[#F4FAF6] border-[#CBE5D6]'
                    : step.status === 'in_progress'
                    ? 'bg-[#FDF8EE] border-[#EAD4B0]'
                    : 'bg-[#FAF8F4] border-[#E6E0D4]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#6E6E73]">
                    Этап 0{step.stepNum}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold ${
                      step.confirmation === 'factory_confirmed'
                        ? 'bg-[#2E6B4E]/15 text-[#2E6B4E]'
                        : step.confirmation === 'needs_confirmation'
                        ? 'bg-[#D97706]/15 text-[#B45309]'
                        : 'bg-[#E5DEC9] text-[#5A564F]'
                    }`}
                  >
                    {step.confirmation === 'factory_confirmed'
                      ? 'Подтверждено'
                      : step.confirmation === 'needs_confirmation'
                      ? 'Ждёт ответа'
                      : 'Плановое'}
                  </span>
                </div>
                <div>
                  <div className="text-[13px] font-bold text-[#1D1D1F] leading-snug">
                    {step.title}
                  </div>
                  <div className="text-[11.5px] text-[#6E6E73] mt-1">
                    {step.datesLabel}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'economics' && (
        /* ВКЛАДКА «ЭКОНОМИКА» (Тест 05: изменение себестоимости пересчитывает маржинальный доход) */
        <div className="rounded-[20px] bg-white border border-[#E6E0D4] p-5 space-y-5 shadow-2xs">
          <div>
            <h3 className="text-[16px] font-bold text-[#1D1D1F]">
              Юнит-экономика 1 комплекта ({model.unitsInPack} шт.)
            </h3>
            <p className="text-[12px] text-[#6E6E73]">
              Измените закупочную себестоимость или розничную цену — маржинальный доход в ₽ и % пересчитается автоматически
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
            <div className="rounded-[14px] bg-[#FAF8F4] border border-[#E6E0D4] p-3.5 space-y-1.5">
              <label className="text-[11px] text-[#6E6E73] font-semibold">
                Розничная цена (₽)
              </label>
              <input
                type="number"
                value={model.retailPriceRub}
                onChange={(e) => {
                  const val = Math.max(100, Number(e.target.value) || 0);
                  const plan = model.plansByScenario[scenario.id];
                  onUpdateModel({
                    ...model,
                    retailPriceRub: val,
                    plansByScenario: plan
                      ? {
                          ...model.plansByScenario,
                          [scenario.id]: {
                            ...plan,
                            monthlyPricesRub: Array(12).fill(val),
                          },
                        }
                      : model.plansByScenario,
                  });
                }}
                className="w-full h-9 px-2.5 rounded-[8px] border border-[#D4CDC2] bg-white text-[15px] font-bold text-[#1D1D1F]"
              />
            </div>

            <div className="rounded-[14px] bg-[#FAF8F4] border border-[#E6E0D4] p-3.5 space-y-1.5">
              <label className="text-[11px] text-[#6E6E73] font-semibold">
                Себестоимость в РФ (₽)
              </label>
              <input
                type="number"
                value={model.unitCostRub}
                onChange={(e) =>
                  onUpdateModel({
                    ...model,
                    unitCostRub: Math.max(50, Number(e.target.value) || 0),
                  })
                }
                className="w-full h-9 px-2.5 rounded-[8px] border border-[#D4CDC2] bg-white text-[15px] font-bold text-[#1D1D1F]"
              />
            </div>

            <div className="rounded-[14px] bg-[#FAF8F4] border border-[#E6E0D4] p-3.5 space-y-1.5">
              <label className="text-[11px] text-[#6E6E73] font-semibold">
                Комиссия площадки (%)
              </label>
              <input
                type="number"
                value={model.marketplaceFeePct}
                onChange={(e) =>
                  onUpdateModel({
                    ...model,
                    marketplaceFeePct: Math.max(0, Number(e.target.value) || 0),
                  })
                }
                className="w-full h-9 px-2.5 rounded-[8px] border border-[#D4CDC2] bg-white text-[15px] font-bold text-[#1D1D1F]"
              />
              <div className="text-[11px] text-[#6E6E73]">= {metrics.feeRub} ₽ / компл.</div>
            </div>

            <div className="rounded-[14px] bg-[#FAF8F4] border border-[#E6E0D4] p-3.5 space-y-1.5">
              <label className="text-[11px] text-[#6E6E73] font-semibold">
                Логистика и хранение (₽)
              </label>
              <input
                type="number"
                value={model.logisticsRub}
                onChange={(e) =>
                  onUpdateModel({
                    ...model,
                    logisticsRub: Math.max(0, Number(e.target.value) || 0),
                  })
                }
                className="w-full h-9 px-2.5 rounded-[8px] border border-[#D4CDC2] bg-white text-[15px] font-bold text-[#1D1D1F]"
              />
            </div>

            <div className="rounded-[14px] bg-[#FAF8F4] border border-[#E6E0D4] p-3.5 space-y-1.5">
              <label className="text-[11px] text-[#6E6E73] font-semibold">
                Реклама DRR (%)
              </label>
              <input
                type="number"
                value={model.adsPct}
                onChange={(e) =>
                  onUpdateModel({
                    ...model,
                    adsPct: Math.max(0, Number(e.target.value) || 0),
                  })
                }
                className="w-full h-9 px-2.5 rounded-[8px] border border-[#D4CDC2] bg-white text-[15px] font-bold text-[#1D1D1F]"
              />
              <div className="text-[11px] text-[#6E6E73]">= {metrics.adsRub} ₽ / компл.</div>
            </div>

            <div className="rounded-[14px] bg-[#F3FAF6] border border-[#CBE5D6] p-3.5 flex flex-col justify-between">
              <div className="text-[11px] font-bold text-[#2E6B4E]">
                Маржинальный доход
              </div>
              <div>
                <div className="text-[22px] font-bold text-[#2E6B4E]">
                  {metrics.unitMarginRub} ₽
                </div>
                <div className="text-[12px] font-bold text-[#2E6B4E]">
                  Маржинальность: {metrics.unitMarginPct}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'spec' && (
        /* ВКЛАДКА «СПЕЦИФИКАЦИЯ» (Производственный паспорт из 6 секций A–F + кнопка PDF) */
        <div className="rounded-[20px] bg-white border border-[#E6E0D4] p-5 space-y-5 shadow-2xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* A. Конструкция */}
            <div className="rounded-[16px] bg-[#FAF8F4] border border-[#E6E0D4] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13.5px] font-bold text-[#1D1D1F]">
                  A. Конструкция и технический чертёж
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#2E6B4E]/12 text-[#2E6B4E] text-[10px] font-bold">
                  Заполнено
                </span>
              </div>
              <TechnicalFlatDrawingSvg />
              <div className="grid grid-cols-2 gap-2 text-[11.5px] pt-1">
                <div>
                  <span className="text-[#6E6E73]">Длина бокового шва:</span>{' '}
                  <span className="font-semibold text-[#1D1D1F]">
                    {model.construction.sideSeam}
                  </span>
                </div>
                <div>
                  <span className="text-[#6E6E73]">Тип швов:</span>{' '}
                  <span className="font-semibold text-[#1D1D1F]">
                    {model.construction.seams}
                  </span>
                </div>
              </div>
            </div>

            {/* B. Материалы + C. Резинка */}
            <div className="space-y-4">
              <div className="rounded-[16px] bg-[#FAF8F4] border border-[#E6E0D4] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[13.5px] font-bold text-[#1D1D1F]">
                    B. Материалы и полотно
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#2E6B4E]/12 text-[#2E6B4E] text-[10px] font-bold">
                    Заполнено
                  </span>
                </div>
                <p className="text-[12px] text-[#4A4740]">
                  {model.fabric.composition} · Плотность {model.fabric.density} ·{' '}
                  {model.fabric.knitType} · Усадка после стирки ≤ 3%.
                </p>
              </div>

              <div className="rounded-[16px] bg-[#FAF8F4] border border-[#E6E0D4] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[13.5px] font-bold text-[#1D1D1F]">
                    C. Резинка и брендирование
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#2E6B4E]/12 text-[#2E6B4E] text-[10px] font-bold">
                    Заполнено
                  </span>
                </div>
                <p className="text-[12px] text-[#4A4740]">
                  Ширина {model.waistband.width} · {model.waistband.type} ·{' '}
                  {model.waistband.colorRule} · {model.waistband.logoRepeat}.
                </p>
              </div>

              {/* E. Размеры S–4XL */}
              <div className="rounded-[16px] bg-[#FAF8F4] border border-[#E6E0D4] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[13.5px] font-bold text-[#1D1D1F]">
                    E. Размерная сетка S–4XL и допуски (±0,5 см)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#2E6B4E]/12 text-[#2E6B4E] text-[10px] font-bold">
                    Заполнено
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-1.5 text-center text-[11px]">
                  {['S (46)', 'M (48)', 'L (50)', 'XL (52)', '2XL (54)', '3XL (56)'].map(
                    (sz) => (
                      <div
                        key={sz}
                        className="rounded-[7px] bg-white border border-[#E5DEC9] py-1 font-semibold text-[#1D1D1F]"
                      >
                        {sz}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* F. Файлы + Кнопка Скачать ТЗ в PDF (Тест 10) */}
          <div className="rounded-[16px] bg-[#FAF6EE] border border-[#E5DEC9] p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-white border border-[#DED8CC] flex items-center justify-center text-[#8B6F47]">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[13.5px] font-bold text-[#1D1D1F]">
                  F. Производственный пакет файлов и ТЗ для фабрики (PDF)
                </div>
                <div className="text-[11.5px] text-[#6E6E73]">
                  Лекала DXF/PDF · Таблица градации S–4XL · Карта цветов Pantone TCX
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenPdfModal}
              className="h-10 px-5 rounded-[11px] bg-[#1D1D1F] hover:bg-[#323236] text-white text-[13px] font-bold inline-flex items-center gap-2 transition cursor-pointer shadow-xs"
            >
              <Printer className="h-4 w-4" />
              <span>Скачать техническое задание PDF</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
