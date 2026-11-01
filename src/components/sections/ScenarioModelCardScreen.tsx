'use client';

import React, { useState, useEffect } from 'react';
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
  Plus,
  X,
  Image as ImageIcon,
  Palette,
  ExternalLink,
  Download,
  Eye,
} from 'lucide-react';
import {
  AttachedModelPdf,
  GrowthScenarioDef,
  MONTHS_SHORT_RU,
  PackColor,
  PalettePack,
  ScenarioModelSpec,
  computeModelScenarioMetrics,
} from '@/lib/scenarioData';
import {
  BoxerPackStackSvg,
  TechnicalFlatDrawingSvg,
} from '@/components/sections/ScenarioVisualParts';
import { compressImageFileToDataUrl } from '@/lib/document-export';
import {
  savePdfBlobToIdb,
  loadPdfBlobUrlFromIdb,
  deletePdfBlobFromIdb,
} from '@/lib/safeStorage';

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
  const [editingGalleryId, setEditingGalleryId] = useState<string | null>(null);
  const [pdfUrlsById, setPdfUrlsById] = useState<Record<string, string>>({});
  const [previewPdfId, setPreviewPdfId] = useState<string | null>(null);

  const attachedPdfs = model.attachedPdfs || [];

  useEffect(() => {
    let cancelled = false;
    async function hydratePdfs() {
      const list = model.attachedPdfs || [];
      const nextMap: Record<string, string> = {};
      for (const item of list) {
        if (item.staticUrl) {
          nextMap[item.id] = item.staticUrl;
        } else {
          const blobUrl = await loadPdfBlobUrlFromIdb(item.id);
          if (blobUrl) nextMap[item.id] = blobUrl;
        }
      }
      if (!cancelled) {
        setPdfUrlsById(nextMap);
        if (list.length > 0 && !previewPdfId) {
          setPreviewPdfId(list[0].id);
        }
      }
    }
    hydratePdfs();
    return () => {
      cancelled = true;
    };
  }, [model.id, model.attachedPdfs]);

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

  const handleRenameGalleryItem = (galleryId: string, newLabel: string) => {
    const nextGallery = model.gallery.map((g) =>
      g.id === galleryId ? { ...g, label: newLabel } : g
    );
    onUpdateModel({
      ...model,
      gallery: nextGallery,
    });
  };

  const handleDeleteGalleryItem = (galleryId: string) => {
    const filtered = model.gallery.filter((g) => g.id !== galleryId);
    const nextGallery: ScenarioModelSpec['gallery'] =
      filtered.length > 0
        ? filtered.map((g, idx) => ({
            ...g,
            isMain: filtered.some((item) => item.isMain) ? g.isMain : idx === 0,
          }))
        : [
            {
              id: `g-main-${Date.now()}`,
              category: 'pack',
              label: 'Главное фото',
              isMain: true,
            },
          ];
    onUpdateModel({
      ...model,
      gallery: nextGallery,
    });
    if (selectedGalleryId === galleryId || !nextGallery.some((g) => g.id === selectedGalleryId)) {
      const nextActive = nextGallery.find((g) => g.isMain) || nextGallery[0];
      if (nextActive) setSelectedGalleryId(nextActive.id);
    }
    notify('warning', 'Строка галереи удалена');
  };

  const handleAddGalleryItem = () => {
    const newId = `g-custom-${Date.now()}`;
    const newItem: ScenarioModelSpec['gallery'][number] = {
      id: newId,
      category: 'pack',
      label: `Фото ${model.gallery.length + 1}`,
      isMain: model.gallery.length === 0,
    };
    const nextGallery = [...model.gallery, newItem];
    onUpdateModel({
      ...model,
      gallery: nextGallery,
    });
    setSelectedGalleryId(newId);
    setEditingGalleryId(newId);
  };

  const handleClearTemplateGalleryItems = () => {
    const withPhotos = model.gallery.filter((g) => Boolean(g.url));
    const nextGallery: ScenarioModelSpec['gallery'] =
      withPhotos.length > 0
        ? withPhotos.map((g, idx) => ({
            ...g,
            isMain: withPhotos.some((item) => item.isMain) ? g.isMain : idx === 0,
          }))
        : [
            {
              id: `g-main-${Date.now()}`,
              category: 'pack',
              label: 'Главное фото',
              isMain: true,
            },
          ];
    onUpdateModel({
      ...model,
      gallery: nextGallery,
    });
    const nextActive = nextGallery.find((g) => g.isMain) || nextGallery[0];
    if (nextActive) setSelectedGalleryId(nextActive.id);
    notify('success', 'Шаблонные вкладки очищены');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Если выбрана пустая вкладка без фото и загружается 1 файл — подставляем фото прямо в неё
    if (files.length === 1 && activeGalleryItem && !activeGalleryItem.url) {
      try {
        const dataUrl = await compressImageFileToDataUrl(files[0], 680, 0.78);
        if (dataUrl) {
          const hasAnyUploadedMain = model.gallery.some((g) => g.url && g.isMain);
          const nextGallery = model.gallery.map((g) =>
            g.id === activeGalleryItem.id
              ? {
                  ...g,
                  url: dataUrl,
                  isMain: !hasAnyUploadedMain ? true : g.isMain,
                }
              : !hasAnyUploadedMain
                ? { ...g, isMain: false }
                : g
          );
          onUpdateModel({
            ...model,
            gallery: nextGallery,
          });
          setSelectedGalleryId(activeGalleryItem.id);
          notify('success', `Фото загружено в «${activeGalleryItem.label}»`);
        }
      } catch {
        // ignore broken image
      }
      e.target.value = '';
      return;
    }

    const uploadedItems: ScenarioModelSpec['gallery'] = [];
    const existingUploadedCount = model.gallery.filter((g) => Boolean(g.url)).length;
    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx];
      try {
        const dataUrl = await compressImageFileToDataUrl(file, 680, 0.78);
        if (!dataUrl) continue;
        uploadedItems.push({
          id: `g-upload-${Date.now()}-${idx}`,
          category: 'pack' as const,
          label: `Фото ${existingUploadedCount + idx + 1}`,
          url: dataUrl,
          isMain: existingUploadedCount === 0 && idx === 0,
        });
      } catch {
        // ignore broken image
      }
    }
    if (uploadedItems.length > 0) {
      const promoteFirstUploaded = existingUploadedCount === 0;
      const baseGallery = promoteFirstUploaded
        ? model.gallery.map((g) => ({ ...g, isMain: false }))
        : model.gallery;
      const nextGallery = [...baseGallery, ...uploadedItems];
      onUpdateModel({
        ...model,
        gallery: nextGallery,
      });
      setSelectedGalleryId(uploadedItems[uploadedItems.length - 1].id);
      notify('success', `Загружено и сохранено фото: ${uploadedItems.length} шт.`);
    }
    e.target.value = '';
  };

  const handleExplicitSave = () => {
    onUpdateModel({ ...model });
    setIsEditing(false);
    notify(
      'success',
      '✓ Карточка модели сохранена',
      `${model.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : 'BORNERS'} ${model.code} / ${model.title}`
    );
  };

  const togglePaletteExpand = (id: string) => {
    setExpandedPaletteIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  /* --- УПРАВЛЕНИЕ ПАЛИТРАМИ И ЦВЕТАМИ / ФОТО ПАЛИТРЫ --- */
  const handleAddPalette = () => {
    const newPalId = `pal-${Date.now()}`;
    const newPal: PalettePack = {
      id: newPalId,
      title: `ПАЛИТРА №${model.palettes.length + 1} — НОВЫЙ НАБОР`,
      subtitle: `${model.unitsInPack} шт. в комплекте`,
      statusLabel: 'В работе',
      colors: [
        {
          nameRu: 'Цвет 1',
          pantone: 'PANTONE 11-0601 TCX',
          hex: '#F3F3F1',
          bandHex: '#DCDCD8',
          textHex: '#1D1D1F',
        },
      ],
    };
    const nextPalettes = [...model.palettes, newPal];
    onUpdateModel({ ...model, palettes: nextPalettes });
    setExpandedPaletteIds((prev) => [...prev, newPalId]);
    notify('success', 'Добавлена новая палитра');
  };

  const handleDeletePalette = (palId: string) => {
    const nextPalettes = model.palettes.filter((p) => p.id !== palId);
    onUpdateModel({ ...model, palettes: nextPalettes });
    notify('warning', 'Палитра удалена');
  };

  const handleUpdatePalette = (palId: string, patch: Partial<PalettePack>) => {
    const nextPalettes = model.palettes.map((p) =>
      p.id === palId ? { ...p, ...patch } : p
    );
    onUpdateModel({ ...model, palettes: nextPalettes });
  };

  const handlePalettePhotoUpload = async (
    palId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFileToDataUrl(file, 760, 0.8);
      if (dataUrl) {
        handleUpdatePalette(palId, { imageUrl: dataUrl });
        if (!expandedPaletteIds.includes(palId)) {
          setExpandedPaletteIds((prev) => [...prev, palId]);
        }
        notify('success', 'Фото раскладки палитры загружено и сохранено');
      }
    } catch {
      // ignore
    }
    e.target.value = '';
  };

  const handleAddColorToPalette = (palId: string) => {
    const nextPalettes = model.palettes.map((p) => {
      if (p.id !== palId) return p;
      const idx = p.colors.length + 1;
      const newColor: PackColor = {
        nameRu: `Цвет ${idx}`,
        pantone: 'PANTONE TCX',
        hex: '#C7BEB2',
        bandHex: '#B2A89B',
        textHex: '#1D1D1F',
      };
      return { ...p, colors: [...p.colors, newColor] };
    });
    onUpdateModel({ ...model, palettes: nextPalettes });
    if (!expandedPaletteIds.includes(palId)) {
      setExpandedPaletteIds((prev) => [...prev, palId]);
    }
  };

  const handleUpdatePaletteColor = (
    palId: string,
    colorIdx: number,
    patch: Partial<PackColor>
  ) => {
    const nextPalettes = model.palettes.map((p) => {
      if (p.id !== palId) return p;
      const nextColors = p.colors.map((c, idx) =>
        idx === colorIdx
          ? {
              ...c,
              ...patch,
              bandHex: patch.hex ? patch.hex : c.bandHex,
            }
          : c
      );
      return { ...p, colors: nextColors };
    });
    onUpdateModel({ ...model, palettes: nextPalettes });
  };

  const handleDeletePaletteColor = (palId: string, colorIdx: number) => {
    const nextPalettes = model.palettes.map((p) => {
      if (p.id !== palId) return p;
      return { ...p, colors: p.colors.filter((_, idx) => idx !== colorIdx) };
    });
    onUpdateModel({ ...model, palettes: nextPalettes });
  };

  /* --- ЗАГРУЗКА И ПРОСМОТР PDF-ФАЙЛОВ В КАРТОЧКЕ МОДЕЛИ --- */
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const addedMeta: AttachedModelPdf[] = [];
    const addedUrls: Record<string, string> = {};

    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx];
      const pdfId = `pdf-${model.id}-${Date.now()}-${idx}`;
      await savePdfBlobToIdb(pdfId, file);
      const blobUrl = URL.createObjectURL(file);
      addedUrls[pdfId] = blobUrl;
      addedMeta.push({
        id: pdfId,
        name: file.name,
        sizeBytes: file.size,
        uploadedAt: new Date().toLocaleDateString('ru-RU'),
      });
    }

    if (addedMeta.length > 0) {
      const nextPdfs = [...(model.attachedPdfs || []), ...addedMeta];
      setPdfUrlsById((prev) => ({ ...prev, ...addedUrls }));
      setPreviewPdfId(addedMeta[addedMeta.length - 1].id);
      onUpdateModel({
        ...model,
        attachedPdfs: nextPdfs,
      });
      notify(
        'success',
        `✓ PDF загружен в карточку: ${addedMeta.map((p) => p.name).join(', ')}`,
        'Документ сохранён в карточке модели и доступен для просмотра и скачивания.'
      );
    }
    e.target.value = '';
  };

  const handleDeleteAttachedPdf = async (pdfId: string) => {
    await deletePdfBlobFromIdb(pdfId);
    const nextPdfs = (model.attachedPdfs || []).filter((p) => p.id !== pdfId);
    onUpdateModel({
      ...model,
      attachedPdfs: nextPdfs,
    });
    if (previewPdfId === pdfId) {
      setPreviewPdfId(nextPdfs[0]?.id || null);
    }
    notify('warning', 'PDF-файл удалён из карточки');
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
          <div className="flex flex-wrap items-center gap-2.5">
            {isEditing ? (
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={model.brandId}
                  onChange={(e) =>
                    onUpdateModel({
                      ...model,
                      brandId: e.target.value as 'BORNERS' | 'NA_TELE',
                    })
                  }
                  className="h-9 px-2.5 rounded-[10px] bg-white border border-[#C8A97E] text-[14px] font-bold text-[#1D1D1F] cursor-pointer"
                >
                  <option value="BORNERS">BORNERS</option>
                  <option value="NA_TELE">НА ТЕЛЕ</option>
                </select>
                <input
                  type="text"
                  value={model.code}
                  onChange={(e) => onUpdateModel({ ...model, code: e.target.value })}
                  placeholder="№003"
                  className="h-9 w-24 px-2.5 rounded-[10px] bg-white border border-[#C8A97E] text-[15px] font-bold text-[#1D1D1F]"
                  title="Артикул / номер модели"
                />
                <span className="text-[18px] font-bold text-[#8A857C]">/</span>
                <input
                  type="text"
                  value={model.title}
                  onChange={(e) => onUpdateModel({ ...model, title: e.target.value })}
                  placeholder="Название модели"
                  className="h-9 w-48 sm:w-64 px-2.5 rounded-[10px] bg-white border border-[#C8A97E] text-[15px] font-bold text-[#1D1D1F]"
                  title="Название модели"
                />
                <input
                  type="text"
                  value={model.subtitle}
                  onChange={(e) => onUpdateModel({ ...model, subtitle: e.target.value })}
                  placeholder="Боксеры (trunks) · 4 шт. в комплекте"
                  className="h-9 w-64 sm:w-80 px-3 rounded-full bg-[#EFECE4] border border-[#C8A97E] text-[#1D1D1F] text-[12px] font-semibold"
                  title="Подзаголовок / тип и комплектация"
                />
              </div>
            ) : (
              <>
                <h2
                  onClick={() => setIsEditing(true)}
                  title="Нажмите, чтобы редактировать бренд, номер и название модели"
                  className="text-[22px] md:text-[26px] font-bold tracking-[-0.02em] text-[#1D1D1F] hover:text-[#8B6F47] transition cursor-pointer inline-flex items-center gap-2 group"
                >
                  <span>
                    {model.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : 'BORNERS'} {model.code} /{' '}
                    {model.title}
                  </span>
                  <Edit3 className="h-4 w-4 text-[#8B6F47] opacity-60 group-hover:opacity-100 transition" />
                </h2>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  title="Нажмите, чтобы изменить описание комплектации и типа изделия"
                  className="px-2.5 py-1 rounded-full bg-[#EFECE4] hover:bg-[#E5DFD3] text-[#5A564F] text-[11.5px] font-semibold inline-flex items-center gap-1.5 cursor-pointer transition"
                >
                  <span>{model.subtitle}</span>
                  <Edit3 className="h-3 w-3 text-[#8B6F47]" />
                </button>
              </>
            )}
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
                ? 'bg-[#FAF4EC] text-[#8B6F47] border-[#C8A97E]'
                : 'bg-white hover:bg-[#F3F0E8] text-[#1D1D1F] border-[#DED8CC]'
            }`}
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>{isEditing ? 'Режим правки' : 'Редактировать'}</span>
          </button>

          <button
            type="button"
            onClick={handleExplicitSave}
            className="h-9 px-4 rounded-[10px] bg-[#2E6B4E] hover:bg-[#24563E] text-white text-[12.5px] font-semibold inline-flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Сохранить карточку</span>
          </button>

          <button
            type="button"
            onClick={() => onDeleteOrArchiveModel(model)}
            title="Удалить карточку модели"
            className="h-9 px-3 rounded-[10px] bg-white hover:bg-[#FFF4F2] border border-[#DED8CC] hover:border-[#F0C7C2] text-[#C93B2B] text-[12.5px] font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Удалить</span>
          </button>

          {/* Меню «⋯» (Дублировать, Экспортировать ТЗ в PDF, Удалить) */}
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
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Удалить модель</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Быстрая панель редактирования основных параметров, если включён режим «Редактировать» */}
      {isEditing && (
        <div className="rounded-[16px] bg-white border border-[#C8A97E] p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 shadow-xs">
          <div>
            <label className="text-[11px] font-semibold text-[#6E6E73]">
              Бренд
            </label>
            <select
              value={model.brandId}
              onChange={(e) =>
                onUpdateModel({
                  ...model,
                  brandId: e.target.value as 'BORNERS' | 'NA_TELE',
                })
              }
              className="w-full h-8 px-2 mt-1 rounded-[8px] border border-[#D4CDC2] text-[12.5px] font-semibold bg-white"
            >
              <option value="BORNERS">BORNERS</option>
              <option value="NA_TELE">НА ТЕЛЕ</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#6E6E73]">
              Код / № модели
            </label>
            <input
              type="text"
              value={model.code}
              onChange={(e) => onUpdateModel({ ...model, code: e.target.value })}
              placeholder="№003"
              className="w-full h-8 px-2.5 mt-1 rounded-[8px] border border-[#D4CDC2] text-[12.5px] font-semibold"
            />
          </div>
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
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="text-[11px] font-semibold text-[#6E6E73]">
              Подзаголовок в шапке
            </label>
            <input
              type="text"
              value={model.subtitle}
              onChange={(e) => onUpdateModel({ ...model, subtitle: e.target.value })}
              placeholder="Боксеры (trunks) · 4 шт."
              className="w-full h-8 px-2.5 mt-1 rounded-[8px] border border-[#D4CDC2] text-[12.5px] font-semibold"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#6E6E73]">
              Комплектация (шт.)
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
              Розничная цена (₽)
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
              Себестоимость (₽)
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
          {/* Вертикальная галерея миниатюр (с возможностью переименования и удаления любой строки) */}
          <div className="sm:w-[162px] flex sm:flex-col gap-1.5 overflow-x-auto sm:overflow-visible shrink-0">
            {model.gallery.map((item) => {
              const isSelected = item.id === activeGalleryItem?.id;
              const isRenaming = editingGalleryId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedGalleryId(item.id)}
                  onDoubleClick={() => setEditingGalleryId(item.id)}
                  className={`group px-2 py-1.5 rounded-[10px] border text-left transition cursor-pointer flex items-center justify-between gap-1 shrink-0 ${
                    isSelected
                      ? 'bg-[#1D1D1F] text-white border-[#1D1D1F] shadow-2xs'
                      : 'bg-[#FAF8F4] hover:bg-[#F2EFE8] text-[#4A4740] border-[#E6E0D4]'
                  }`}
                >
                  {isRenaming ? (
                    <input
                      type="text"
                      autoFocus
                      value={item.label}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleRenameGalleryItem(item.id, e.target.value)}
                      onBlur={() => setEditingGalleryId(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Escape') {
                          setEditingGalleryId(null);
                        }
                      }}
                      className={`w-full h-6 px-1.5 rounded-[6px] text-[11px] font-semibold outline-none ${
                        isSelected
                          ? 'bg-white/15 text-white border border-white/30'
                          : 'bg-white text-[#1D1D1F] border border-[#C8A97E]'
                      }`}
                    />
                  ) : (
                    <span
                      className="text-[11.5px] font-semibold truncate flex-1"
                      title={`${item.label} (двойной клик или ✎ — переименовать)`}
                    >
                      {item.label}
                    </span>
                  )}

                  <div className="flex items-center gap-0.5 shrink-0">
                    {item.isMain && (
                      <Star
                        className={`h-3 w-3 shrink-0 ${
                          isSelected
                            ? 'text-[#E5B869] fill-[#E5B869]'
                            : 'text-[#C89D54] fill-[#C89D54]'
                        }`}
                      />
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedGalleryId(item.id);
                        setEditingGalleryId(
                          editingGalleryId === item.id ? null : item.id
                        );
                      }}
                      title="Переименовать эту строку"
                      className={`p-0.5 rounded hover:bg-black/10 transition cursor-pointer ${
                        isSelected
                          ? 'text-white/75 hover:text-white'
                          : 'text-[#8A857C] hover:text-[#1D1D1F]'
                      }`}
                    >
                      <Edit3 className="h-2.5 w-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGalleryItem(item.id);
                      }}
                      title="Удалить эту строку"
                      className={`p-0.5 rounded transition cursor-pointer ${
                        isSelected
                          ? 'text-white/75 hover:text-[#FF8A80] hover:bg-white/10'
                          : 'text-[#8A857C] hover:text-[#C93B2B] hover:bg-[#FFF0EE]'
                      }`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={handleAddGalleryItem}
              className="px-2.5 py-1.5 rounded-[10px] border border-[#E6E0D4] bg-white hover:bg-[#FAF8F4] text-[#4A4740] text-[11px] font-semibold inline-flex items-center justify-center gap-1 cursor-pointer transition shrink-0"
            >
              <Plus className="h-3 w-3" />
              <span>Добавить строку</span>
            </button>

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

            {model.gallery.some((g) => !g.url) && model.gallery.length > 1 && (
              <button
                type="button"
                onClick={handleClearTemplateGalleryItems}
                title="Удалить все пустые шаблонные вкладки без загруженных фото"
                className="px-2 py-1 rounded-[8px] text-[10px] font-semibold text-[#C93B2B] hover:bg-[#FFF4F2] transition cursor-pointer text-center shrink-0"
              >
                Очистить пустые вкладки
              </button>
            )}
          </div>

          {/* Крупное главное изображение товара + прямое редактирование названия вкладки + кнопка «Назначить главным» */}
          <div className="flex-1 rounded-[16px] bg-gradient-to-b from-[#FAF7F0] to-[#F2ECE1] border border-[#EAE3D5] p-4 flex flex-col justify-between relative">
            <div className="flex flex-wrap items-center justify-between gap-2 z-10">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 border border-[#E5DEC9] shadow-2xs">
                <Edit3 className="h-3 w-3 text-[#8B6F47] shrink-0" />
                <input
                  type="text"
                  value={activeGalleryItem?.label || ''}
                  onChange={(e) => {
                    if (activeGalleryItem) {
                      handleRenameGalleryItem(activeGalleryItem.id, e.target.value);
                    }
                  }}
                  placeholder="Название вкладки..."
                  title="Нажмите и введите своё название для этого фото/вкладки"
                  className="text-[11.5px] font-semibold text-[#1D1D1F] bg-transparent outline-none w-32 sm:w-40"
                />
              </div>

              <div className="flex items-center gap-1.5">
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

                {activeGalleryItem && (
                  <button
                    type="button"
                    onClick={() => handleDeleteGalleryItem(activeGalleryItem.id)}
                    title="Удалить это фото / вкладку"
                    className="h-7 w-7 rounded-full bg-white/90 hover:bg-[#FFF0EE] border border-[#E5DEC9] hover:border-[#F0C7C2] text-[#C93B2B] flex items-center justify-center cursor-pointer transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
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

        <div className="flex flex-wrap items-center gap-2">
          <label className="h-8 px-3.5 rounded-[9px] bg-[#1D1D1F] hover:bg-[#323236] text-white text-[12px] font-semibold inline-flex items-center gap-1.5 cursor-pointer transition shadow-2xs">
            <Upload className="h-3.5 w-3.5 text-[#E5B869]" />
            <span>+ Загрузить PDF в карточку</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              multiple
              onChange={handlePdfUpload}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={onOpenPdfModal}
            className="h-8 px-3.5 rounded-[9px] bg-white hover:bg-[#F3F0E8] border border-[#DED8CC] text-[12px] font-semibold text-[#1D1D1F] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 text-[#8B6F47]" />
            <span>Скачать техническое задание PDF</span>
          </button>
        </div>
      </div>

      {/* СОДЕРЖИМОЕ ВЫБРАННОЙ ВКЛАДКИ (ВСЕГДА ТОЛЬКО ОДНА АКТИВНАЯ ВКЛАДКА) */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* Верхняя сводка обзора + 3 технических блока (Характеристики, Состав, Резинка) — кликабельно и редактируемо */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-[18px] bg-white border border-[#E6E0D4] p-4 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[13.5px] font-bold text-[#1D1D1F]">Характеристики</div>
                <button
                  type="button"
                  onClick={() => setIsEditing((v) => !v)}
                  className="text-[11px] font-semibold text-[#8B6F47] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="h-3 w-3" />
                  <span>{isEditing ? 'Готово' : 'Изменить'}</span>
                </button>
              </div>
              <div className="space-y-1.5 text-[12px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#6E6E73]">Тип изделия:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={model.construction.type}
                      onChange={(e) =>
                        onUpdateModel({
                          ...model,
                          construction: { ...model.construction, type: e.target.value },
                        })
                      }
                      className="h-7 w-44 px-2 rounded-[6px] border border-[#D4CDC2] text-right font-semibold text-[#1D1D1F]"
                    />
                  ) : (
                    <span className="font-semibold text-[#1D1D1F] text-right">
                      {model.construction.type}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#6E6E73]">Комплектация:</span>
                  <span className="font-semibold text-[#1D1D1F] text-right">
                    1 комплект = {model.unitsInPack} шт.
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#6E6E73]">Посадка:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={model.construction.fit}
                      onChange={(e) =>
                        onUpdateModel({
                          ...model,
                          construction: { ...model.construction, fit: e.target.value },
                        })
                      }
                      className="h-7 w-44 px-2 rounded-[6px] border border-[#D4CDC2] text-right font-semibold text-[#1D1D1F]"
                    />
                  ) : (
                    <span className="font-semibold text-[#1D1D1F] text-right">
                      {model.construction.fit}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#6E6E73]">Передняя панель:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={model.construction.frontPanel}
                      onChange={(e) =>
                        onUpdateModel({
                          ...model,
                          construction: { ...model.construction, frontPanel: e.target.value },
                        })
                      }
                      className="h-7 w-44 px-2 rounded-[6px] border border-[#D4CDC2] text-right font-semibold text-[#1D1D1F]"
                    />
                  ) : (
                    <span className="font-semibold text-[#1D1D1F] text-right">
                      {model.construction.frontPanel}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#6E6E73]">Ластовица:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={model.construction.gusset}
                      onChange={(e) =>
                        onUpdateModel({
                          ...model,
                          construction: { ...model.construction, gusset: e.target.value },
                        })
                      }
                      className="h-7 w-44 px-2 rounded-[6px] border border-[#D4CDC2] text-right font-semibold text-[#1D1D1F]"
                    />
                  ) : (
                    <span className="font-semibold text-[#1D1D1F] text-right">
                      {model.construction.gusset}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[18px] bg-white border border-[#E6E0D4] p-4 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[13.5px] font-bold text-[#1D1D1F]">
                  Состав и материалы
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing((v) => !v)}
                  className="text-[11px] font-semibold text-[#8B6F47] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="h-3 w-3" />
                  <span>{isEditing ? 'Готово' : 'Изменить'}</span>
                </button>
              </div>
              <div className="space-y-1.5 text-[12px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#6E6E73]">Основное полотно:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={model.fabric.composition}
                      onChange={(e) =>
                        onUpdateModel({
                          ...model,
                          fabric: { ...model.fabric, composition: e.target.value },
                        })
                      }
                      className="h-7 w-44 px-2 rounded-[6px] border border-[#D4CDC2] text-right font-semibold text-[#1D1D1F]"
                    />
                  ) : (
                    <span className="font-semibold text-[#1D1D1F] text-right">
                      {model.fabric.composition}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#6E6E73]">Плотность:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={model.fabric.density}
                      onChange={(e) =>
                        onUpdateModel({
                          ...model,
                          fabric: { ...model.fabric, density: e.target.value },
                        })
                      }
                      className="h-7 w-44 px-2 rounded-[6px] border border-[#D4CDC2] text-right font-semibold text-[#1D1D1F]"
                    />
                  ) : (
                    <span className="font-semibold text-[#1D1D1F] text-right">
                      {model.fabric.density}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#6E6E73]">Переплетение:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={model.fabric.knitType}
                      onChange={(e) =>
                        onUpdateModel({
                          ...model,
                          fabric: { ...model.fabric, knitType: e.target.value },
                        })
                      }
                      className="h-7 w-44 px-2 rounded-[6px] border border-[#D4CDC2] text-right font-semibold text-[#1D1D1F]"
                    />
                  ) : (
                    <span className="font-semibold text-[#1D1D1F] text-right">
                      {model.fabric.knitType}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#6E6E73]">Тактильность:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={model.fabric.touchFeel}
                      onChange={(e) =>
                        onUpdateModel({
                          ...model,
                          fabric: { ...model.fabric, touchFeel: e.target.value },
                        })
                      }
                      className="h-7 w-44 px-2 rounded-[6px] border border-[#D4CDC2] text-right font-semibold text-[#1D1D1F]"
                    />
                  ) : (
                    <span className="font-semibold text-[#1D1D1F] text-right">
                      {model.fabric.touchFeel}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#6E6E73]">Старт продаж:</span>
                  <span className="font-bold text-[#2E6B4E] text-right">
                    {MONTHS_SHORT_RU[metrics.plan.salesStartMonthIdx]} {scenario.year}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-[18px] bg-white border border-[#E6E0D4] p-4 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[13.5px] font-bold text-[#1D1D1F]">
                  Резинка {model.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : 'BORNERS'}
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing((v) => !v)}
                  className="text-[11px] font-semibold text-[#8B6F47] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="h-3 w-3" />
                  <span>{isEditing ? 'Готово' : 'Изменить'}</span>
                </button>
              </div>
              <div className="space-y-1.5 text-[12px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#6E6E73]">Ширина:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={model.waistband.width}
                      onChange={(e) =>
                        onUpdateModel({
                          ...model,
                          waistband: { ...model.waistband, width: e.target.value },
                        })
                      }
                      className="h-7 w-44 px-2 rounded-[6px] border border-[#D4CDC2] text-right font-semibold text-[#1D1D1F]"
                    />
                  ) : (
                    <span className="font-semibold text-[#1D1D1F] text-right">
                      {model.waistband.width}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#6E6E73]">Цвет резинки:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={model.waistband.colorRule}
                      onChange={(e) =>
                        onUpdateModel({
                          ...model,
                          waistband: { ...model.waistband, colorRule: e.target.value },
                        })
                      }
                      className="h-7 w-44 px-2 rounded-[6px] border border-[#D4CDC2] text-right font-semibold text-[#1D1D1F]"
                    />
                  ) : (
                    <span className="font-semibold text-[#1D1D1F] text-right">
                      {model.waistband.colorRule}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#6E6E73]">Логотип:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={model.waistband.logoRepeat}
                      onChange={(e) =>
                        onUpdateModel({
                          ...model,
                          waistband: { ...model.waistband, logoRepeat: e.target.value },
                        })
                      }
                      className="h-7 w-44 px-2 rounded-[6px] border border-[#D4CDC2] text-right font-semibold text-[#1D1D1F]"
                    />
                  ) : (
                    <span className="font-semibold text-[#1D1D1F] text-right">
                      {model.waistband.logoRepeat}
                    </span>
                  )}
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

          {/* Цветовые палитры и наборы: загрузка фото палитры + добавление/редактирование/удаление цветов и палитр */}
          <div className="rounded-[20px] bg-white border border-[#E6E0D4] p-5 space-y-4 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-[15px] font-bold text-[#1D1D1F]">
                  Цветовые палитры и наборы ({model.palettes.length})
                </h3>
                <p className="text-[11.5px] text-[#6E6E73]">
                  Вы можете загрузить фото раскладки комплекта или добавить/изменить цвета и коды Pantone в каждой палитре
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddPalette}
                className="h-8 px-3.5 rounded-[10px] bg-[#1D1D1F] hover:bg-[#323236] text-white text-[12px] font-semibold inline-flex items-center gap-1.5 cursor-pointer transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Добавить палитру / набор</span>
              </button>
            </div>

            {model.palettes.length === 0 ? (
              <div className="rounded-[16px] bg-[#FAF8F4] border border-dashed border-[#D6CEC0] p-6 text-center space-y-2">
                <div className="text-[13px] font-semibold text-[#4A4740]">
                  В этой модели пока нет цветовых палитр
                </div>
                <button
                  type="button"
                  onClick={handleAddPalette}
                  className="h-8 px-4 rounded-[10px] bg-[#1D1D1F] text-white text-[12px] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Создать первую палитру</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {model.palettes.map((pal) => {
                  const isExpanded = expandedPaletteIds.includes(pal.id);
                  return (
                    <div
                      key={pal.id}
                      className="rounded-[16px] bg-[#FAF8F4] border border-[#E6E0D4] p-4 space-y-3"
                    >
                      {/* Шапка палитры: редактируемое название + кнопки Загрузить фото / Добавить цвет / Удалить */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                          <input
                            type="text"
                            value={pal.title}
                            onChange={(e) =>
                              handleUpdatePalette(pal.id, { title: e.target.value })
                            }
                            placeholder="Название палитры..."
                            title="Нажмите, чтобы переименовать палитру"
                            className="text-[12.5px] font-bold text-[#1D1D1F] bg-white px-2.5 py-1 rounded-[8px] border border-[#E2DBD0] focus:border-[#8B6F47] outline-none flex-1"
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <label className="h-7 px-2.5 rounded-[8px] bg-white hover:bg-[#F3ECE0] border border-[#D4CDC2] text-[#7A5C38] text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition">
                            <ImageIcon className="h-3 w-3" />
                            <span>{pal.imageUrl ? 'Заменить фото' : '+ Фото'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handlePalettePhotoUpload(pal.id, e)}
                              className="hidden"
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() => handleAddColorToPalette(pal.id)}
                            className="h-7 px-2.5 rounded-[8px] bg-white hover:bg-[#F3F0E8] border border-[#D4CDC2] text-[#1D1D1F] text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition"
                          >
                            <Plus className="h-3 w-3" />
                            <span>+ Цвет</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => togglePaletteExpand(pal.id)}
                            className="h-7 px-2 rounded-[8px] bg-white border border-[#E2DBD0] text-[11px] font-semibold text-[#8B6F47] cursor-pointer"
                          >
                            {isExpanded ? 'Свернуть' : 'Развернуть'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeletePalette(pal.id)}
                            title="Удалить эту палитру"
                            className="h-7 w-7 rounded-[8px] bg-white hover:bg-[#FFF0EE] border border-[#E2DBD0] hover:border-[#F0C7C2] text-[#C93B2B] flex items-center justify-center cursor-pointer transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Если загружено фото палитры / раскладки комплекта — показываем его */}
                      {pal.imageUrl && (
                        <div className="relative rounded-[12px] overflow-hidden bg-white border border-[#E5DEC9] p-2">
                          <img
                            src={pal.imageUrl}
                            alt={pal.title}
                            className="w-full max-h-56 object-contain rounded-[8px] mx-auto"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdatePalette(pal.id, { imageUrl: undefined })
                            }
                            title="Убрать фото палитры"
                            className="absolute top-3 right-3 h-7 px-2 rounded-full bg-black/70 hover:bg-black text-white text-[10.5px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                            <span>Убрать фото</span>
                          </button>
                        </div>
                      )}

                      {/* Карточки цветов палитры (редактируемые цвет HEX, название и Pantone) */}
                      {isExpanded && pal.colors.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                          {pal.colors.map((c, colorIdx) => (
                            <div
                              key={`${pal.id}-c-${colorIdx}`}
                              className="rounded-[12px] bg-white border border-[#E5DEC9] p-2.5 space-y-1.5 relative group"
                            >
                              <button
                                type="button"
                                onClick={() => handleDeletePaletteColor(pal.id, colorIdx)}
                                title="Удалить этот цвет"
                                className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-white/90 hover:bg-[#FFF0EE] border border-[#E2DBD0] text-[#C93B2B] flex items-center justify-center opacity-80 group-hover:opacity-100 cursor-pointer z-10"
                              >
                                <X className="h-3 w-3" />
                              </button>

                              <label
                                title="Нажмите, чтобы выбрать оттенок"
                                className="block h-10 rounded-[8px] border border-black/10 cursor-pointer relative overflow-hidden"
                                style={{ backgroundColor: c.hex }}
                              >
                                <input
                                  type="color"
                                  value={c.hex.startsWith('#') && c.hex.length === 7 ? c.hex : '#C7BEB2'}
                                  onChange={(e) =>
                                    handleUpdatePaletteColor(pal.id, colorIdx, {
                                      hex: e.target.value.toUpperCase(),
                                    })
                                  }
                                  className="opacity-0 inset-0 w-full h-full cursor-pointer"
                                />
                              </label>

                              <input
                                type="text"
                                value={c.nameRu}
                                onChange={(e) =>
                                  handleUpdatePaletteColor(pal.id, colorIdx, {
                                    nameRu: e.target.value,
                                  })
                                }
                                placeholder="Название цвета"
                                className="w-full text-[11px] font-bold text-[#1D1D1F] bg-transparent border-b border-transparent focus:border-[#C8A97E] outline-none leading-tight"
                              />
                              <input
                                type="text"
                                value={c.pantone}
                                onChange={(e) =>
                                  handleUpdatePaletteColor(pal.id, colorIdx, {
                                    pantone: e.target.value,
                                  })
                                }
                                placeholder="PANTONE / HEX"
                                className="w-full text-[10px] font-mono text-[#6E6E73] bg-transparent border-b border-transparent focus:border-[#C8A97E] outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* БЛОК ЗАГРУЗКИ И ПРОСМОТРА PDF-ФАЙЛОВ ПРЯМО В КАРТОЧКЕ МОДЕЛИ */}
          <div className="rounded-[20px] bg-white border border-[#E6E0D4] p-5 space-y-4 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-[12px] bg-[#FAF6EE] border border-[#E5DEC9] flex items-center justify-center text-[#8B6F47]">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#1D1D1F]">
                    Прикреплённые PDF-файлы и техзадания ({attachedPdfs.length})
                  </h3>
                  <p className="text-[11.5px] text-[#6E6E73]">
                    Загрузите готовый PDF-паспорт или техзадание для фабрики — файл сохранится прямо в карточке модели
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="h-9 px-4 rounded-[10px] bg-[#1D1D1F] hover:bg-[#323236] text-white text-[12.5px] font-semibold inline-flex items-center gap-1.5 cursor-pointer transition shadow-2xs">
                  <Upload className="h-3.5 w-3.5 text-[#E5B869]" />
                  <span>+ Загрузить PDF файл</span>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    multiple
                    onChange={handlePdfUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {attachedPdfs.length > 0 ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {attachedPdfs.map((pdf) => {
                    const url = pdfUrlsById[pdf.id];
                    const isPreviewing = previewPdfId === pdf.id;
                    return (
                      <div
                        key={pdf.id}
                        className={`rounded-[12px] border px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3 flex-1 min-w-[260px] ${
                          isPreviewing
                            ? 'bg-[#FAF6EE] border-[#C8A97E]'
                            : 'bg-[#FAF8F4] border-[#E6E0D4]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="h-4 w-4 text-[#8B6F47] shrink-0" />
                          <div className="min-w-0">
                            <div className="text-[12.5px] font-bold text-[#1D1D1F] truncate">
                              {pdf.name}
                            </div>
                            <div className="text-[10.5px] text-[#6E6E73]">
                              {(pdf.sizeBytes / 1024 / 1024).toFixed(2)} МБ · Загружен {pdf.uploadedAt}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewPdfId(isPreviewing ? null : pdf.id)
                            }
                            className="h-7 px-2.5 rounded-[8px] bg-white hover:bg-[#F3ECE0] border border-[#D4CDC2] text-[11px] font-semibold text-[#1D1D1F] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="h-3 w-3 text-[#8B6F47]" />
                            <span>{isPreviewing ? 'Скрыть превью' : 'Смотреть в карточке'}</span>
                          </button>

                          {url && (
                            <>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Открыть PDF в новой вкладке"
                                className="h-7 px-2.5 rounded-[8px] bg-white hover:bg-[#F3F0E8] border border-[#D4CDC2] text-[11px] font-semibold text-[#1D1D1F] inline-flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                <span>Открыть</span>
                              </a>
                              <a
                                href={url}
                                download={pdf.name}
                                title="Скачать PDF"
                                className="h-7 px-2.5 rounded-[8px] bg-white hover:bg-[#F3F0E8] border border-[#D4CDC2] text-[11px] font-semibold text-[#1D1D1F] inline-flex items-center gap-1"
                              >
                                <Download className="h-3 w-3" />
                              </a>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteAttachedPdf(pdf.id)}
                            title="Удалить PDF из карточки"
                            className="h-7 w-7 rounded-[8px] bg-white hover:bg-[#FFF0EE] border border-[#D4CDC2] hover:border-[#F0C7C2] text-[#C93B2B] flex items-center justify-center cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {previewPdfId && pdfUrlsById[previewPdfId] && (
                  <div className="rounded-[14px] overflow-hidden border border-[#DED8CC] bg-[#323639]">
                    <iframe
                      src={pdfUrlsById[previewPdfId]}
                      title="PDF Preview"
                      className="w-full h-[680px]"
                    />
                  </div>
                )}
              </div>
            ) : (
              <label className="rounded-[14px] border border-dashed border-[#C8A97E] bg-[#FAF8F4] hover:bg-[#FAF4EC] p-5 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition text-center">
                <Upload className="h-5 w-5 text-[#8B6F47]" />
                <span className="text-[13px] font-bold text-[#1D1D1F]">
                  Нажмите, чтобы загрузить PDF-файл в карточку модели
                </span>
                <span className="text-[11.5px] text-[#6E6E73]">
                  Поддерживаются многостраничные PDF со схемами, фотографиями и китайско-русской спецификацией
                </span>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  multiple
                  onChange={handlePdfUpload}
                  className="hidden"
                />
              </label>
            )}
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

            <div className="flex flex-wrap items-center gap-2.5">
              <label className="h-10 px-4 rounded-[11px] bg-white hover:bg-[#F3ECE0] border border-[#C8A97E] text-[#7A5C38] text-[12.5px] font-bold inline-flex items-center gap-2 transition cursor-pointer">
                <Upload className="h-4 w-4" />
                <span>+ Загрузить PDF файл</span>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  multiple
                  onChange={handlePdfUpload}
                  className="hidden"
                />
              </label>

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
        </div>
      )}

      {/* Нижняя панель действий карточки модели */}
      <div className="pt-4 border-t border-[#E6E0D4] flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onDeleteOrArchiveModel(model)}
          className="h-10 px-4 rounded-[11px] bg-white hover:bg-[#FFF4F2] border border-[#DED8CC] hover:border-[#F0C7C2] text-[#C93B2B] text-[12.5px] font-semibold inline-flex items-center gap-2 transition cursor-pointer"
        >
          <Trash2 className="h-4 w-4" />
          <span>Удалить карточку модели</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onBackToScenarios}
            className="h-10 px-4 rounded-[11px] bg-white hover:bg-[#F3F0E8] border border-[#DED8CC] text-[#1D1D1F] text-[12.5px] font-semibold transition cursor-pointer"
          >
            К списку моделей
          </button>
          <button
            type="button"
            onClick={handleExplicitSave}
            className="h-10 px-5 rounded-[11px] bg-[#2E6B4E] hover:bg-[#24563E] text-white text-[13px] font-bold inline-flex items-center gap-2 transition cursor-pointer shadow-xs"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Сохранить карточку</span>
          </button>
        </div>
      </div>
    </div>
  );
}
