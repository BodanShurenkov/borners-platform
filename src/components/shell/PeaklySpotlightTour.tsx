'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Layers,
  TrendingUp,
  FileText,
  Sparkles,
  Compass,
  ArrowLeft,
  ArrowRight,
  X,
} from 'lucide-react';
import { NavSectionId } from '@/types/platform';

export interface SpotlightStep {
  targetSelector: string;
  section?: NavSectionId;
  eyebrow: string;
  title: string;
  description: string;
  icon: 'brands' | 'scenarios' | 'passport' | 'studio' | 'sidebar';
  preferredPlacement?: 'bottom' | 'top' | 'right';
}

const SPOTLIGHT_STEPS: SpotlightStep[] = [
  {
    targetSelector: '[data-tour="brand-switcher"]',
    eyebrow: 'ВАШИ БРЕНДЫ',
    title: 'Все бренды — в одном переключателе',
    description:
      'Меняйте бренд здесь (BORNERS, НА ТЕЛЕ или весь портфель). Вся платформа мгновенно перестроит сценарии, модели и отчёты под выбранный бренд.',
    icon: 'brands',
    preferredPlacement: 'bottom',
  },
  {
    targetSelector: '[data-tour="growth-scenarios"]',
    section: 'dashboard',
    eyebrow: 'ГЛАВНОЕ ЧИСЛО И СЦЕНАРИИ',
    title: 'Начинайте со сценария выручки (100 / 150 / 200 млн ₽)',
    description:
      'Переключайте 3 стратегических плана развития в один клик — годовой оборот (1,2–2,4 млрд ₽), объём продаж в штуках и инвестиции пересчитываются автоматически.',
    icon: 'scenarios',
    preferredPlacement: 'top',
  },
  {
    targetSelector: '[data-tour="model-passport"]',
    section: 'dashboard',
    eyebrow: 'ПАСПОРТ МОДЕЛИ И PDF',
    title: 'Тех. спецификация, резинка BORNERS и Конструктор PDF',
    description:
      'В карточке мультипака собраны юнит-экономика, чертёж посадки, состав ткани, цвета Pantone и кнопка «Конструктор PDF» для выбора блоков перед отправкой на фабрику.',
    icon: 'passport',
    preferredPlacement: 'top',
  },
  {
    targetSelector: '[data-tour="studio-canvas"]',
    section: 'dashboard',
    eyebrow: 'СТУДИЯ ИДЕЙ · БЕСКОНЕЧНЫЙ ХОЛСТ',
    title: 'Прикрепляйте стикеры стрелочками, фото и голос',
    description:
      'Зажмите пустое место для бесконечного перемещения по холсту, тяните стрелочки от кружка ● на краю одного стикера к другому и записывайте голосовые заметки.',
    icon: 'studio',
    preferredPlacement: 'top',
  },
  {
    targetSelector: '[data-tour="sidebar-nav"]',
    eyebrow: 'НАВИГАЦИЯ ПЛАТФОРМЫ',
    title: '9 контуров: от Моделей (SKU) до Производства и Отчётов',
    description:
      'Переходите между сценариями роста, каталогом SKU, планом продаж, лабораторией производства (7 этапов R&D), закупками, финансами и отчётами.',
    icon: 'sidebar',
    preferredPlacement: 'right',
  },
];

interface PeaklySpotlightTourProps {
  open: boolean;
  stepIdx: number;
  setStepIdx: React.Dispatch<React.SetStateAction<number>>;
  onClose: () => void;
  activeSection: NavSectionId;
  onNavigateSection: (section: NavSectionId) => void;
}

export function PeaklySpotlightTour({
  open,
  stepIdx,
  setStepIdx,
  onClose,
  activeSection,
  onNavigateSection,
}: PeaklySpotlightTourProps) {
  const [rect, setRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const currentStep = SPOTLIGHT_STEPS[stepIdx] || SPOTLIGHT_STEPS[0];
  const totalSteps = SPOTLIGHT_STEPS.length;

  const measureTarget = useCallback(() => {
    if (!open) return;
    const el = document.querySelector(currentStep.targetSelector) as HTMLElement | null;
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({
      top: Math.round(r.top),
      left: Math.round(r.left),
      width: Math.round(r.width),
      height: Math.round(r.height),
    });
  }, [open, currentStep.targetSelector]);

  // При смене шага: при необходимости переключаем раздел и плавно скроллим к подсвечиваемому блоку
  useEffect(() => {
    if (!open) return;
    if (currentStep.section && activeSection !== currentStep.section) {
      onNavigateSection(currentStep.section);
    }

    const timer1 = window.setTimeout(() => {
      const el = document.querySelector(currentStep.targetSelector) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }
      measureTarget();
    }, 80);

    const timer2 = window.setTimeout(() => {
      measureTarget();
    }, 420);

    return () => {
      window.clearTimeout(timer1);
      window.clearTimeout(timer2);
    };
  }, [open, stepIdx, currentStep, activeSection, onNavigateSection, measureTarget]);

  // Живое обновление координат рамки при скролле или ресайзе окна
  useEffect(() => {
    if (!open) return;
    const handleUpdate = () => {
      measureTarget();
    };
    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);
    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [open, measureTarget]);

  // Клавиатурная навигация (Escape, Стрелки Влево/Вправо)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') {
        if (stepIdx < totalSteps - 1) setStepIdx((i) => i + 1);
        else onClose();
      }
      if (e.key === 'ArrowLeft' && stepIdx > 0) {
        setStepIdx((i) => i - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, stepIdx, totalSteps, setStepIdx, onClose]);

  if (!open) return null;

  // Отступ вокруг подсвечиваемого блока
  const pad = 8;
  const boxTop = rect ? Math.max(6, rect.top - pad) : 120;
  const boxLeft = rect ? Math.max(6, rect.left - pad) : 120;
  const boxWidth = rect ? rect.width + pad * 2 : 340;
  const boxHeight = rect ? Math.min(window.innerHeight - 32, rect.height + pad * 2) : 90;

  // Вычисляем позицию всплывающей карточки Peakly рядом с подсвеченным элементом
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const cardWidth = Math.min(376, vw - 28);
  const cardHeightEst = 248;

  let cardTop = boxTop + boxHeight + 16;
  let cardLeft = boxLeft;

  if (currentStep.preferredPlacement === 'right' && boxLeft + boxWidth + cardWidth + 24 < vw) {
    cardLeft = boxLeft + boxWidth + 18;
    cardTop = Math.max(20, Math.min(vh - cardHeightEst - 20, boxTop + 12));
  } else if (
    currentStep.preferredPlacement === 'top' ||
    boxTop + boxHeight + cardHeightEst + 24 > vh
  ) {
    if (boxTop - cardHeightEst - 16 > 12) {
      cardTop = boxTop - cardHeightEst - 16;
    } else {
      cardTop = Math.max(16, Math.min(vh - cardHeightEst - 16, boxTop + 16));
    }
    cardLeft = Math.max(
      16,
      Math.min(vw - cardWidth - 16, boxLeft + boxWidth / 2 - cardWidth / 2)
    );
  } else {
    cardLeft = Math.max(16, Math.min(vw - cardWidth - 16, boxLeft));
  }

  const StepIcon =
    currentStep.icon === 'brands'
      ? Layers
      : currentStep.icon === 'scenarios'
      ? TrendingUp
      : currentStep.icon === 'passport'
      ? FileText
      : currentStep.icon === 'studio'
      ? Sparkles
      : Compass;

  return (
    <div className="fixed inset-0 z-[95] pointer-events-auto">
      {/* Кликабельный затемнённый фон вокруг подсвеченной области (клик в пустое место закрывает тур) */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-transparent cursor-pointer"
        aria-label="Закрыть обучение"
      />

      {/* ПОДСВЕЧЕННОЕ ОКНО-ВЫРЕЗ ПОВЕРХ РЕАЛЬНОГО ЭЛЕМЕНТА СТРАНИЦЫ (ТОЧНО КАК В PEAKLY) */}
      <div
        style={{
          top: `${boxTop}px`,
          left: `${boxLeft}px`,
          width: `${boxWidth}px`,
          height: `${boxHeight}px`,
          boxShadow:
            '0 0 0 9999px rgba(8, 10, 18, 0.78), 0 0 32px rgba(59, 130, 246, 0.65), inset 0 0 14px rgba(59, 130, 246, 0.25)',
        }}
        className="fixed rounded-[18px] border-2 border-[#3B82F6] pointer-events-none transition-all duration-300 ease-out"
      >
        {/* Светящаяся синяя точка в правом верхнем углу рамки */}
        <span className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full bg-[#3B82F6] shadow-[0_0_12px_#3B82F6] ring-2 ring-[#0F172A]" />
      </div>

      {/* ВСПЛЫВАЮЩАЯ КАРТОЧКА ОБУЧЕНИЯ PEAKLY РЯДОМ С ПОДСВЕЧЕННЫМ ЭЛЕМЕНТОМ */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          top: `${cardTop}px`,
          left: `${cardLeft}px`,
          width: `${cardWidth}px`,
        }}
        className="fixed z-[100] rounded-[22px] bg-[#141824] border border-white/12 p-5 text-white shadow-[0_24px_64px_rgba(0,0,0,0.7),0_0_42px_rgba(59,130,246,0.22)] transition-all duration-300 ease-out space-y-4"
      >
        {/* Верхняя часть: Иконка в кружке + Синий бейдж + Заголовок + Кнопка закрытия */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-[#1B253B] border border-[#3B82F6]/35 flex items-center justify-center text-[#60A5FA] shrink-0 mt-0.5">
              <StepIcon className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#3B82F6]">
                <span>✦</span>
                <span>{currentStep.eyebrow}</span>
              </div>
              <h3 className="text-[16.5px] font-bold text-white leading-snug mt-0.5">
                {currentStep.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 rounded-lg text-[#64748B] hover:text-white hover:bg-white/10 flex items-center justify-center transition cursor-pointer shrink-0"
            title="Закрыть обучение"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Текст описания шага */}
        <p className="text-[13.5px] text-[#94A3B8] leading-relaxed">
          {currentStep.description}
        </p>

        {/* Сегментированная синяя полоса прогресса (как на скриншоте Peakly) */}
        <div className="flex items-center gap-1.5 pt-0.5">
          {SPOTLIGHT_STEPS.map((_, idx) => {
            const isActive = idx === stepIdx;
            const isPassed = idx < stepIdx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setStepIdx(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  isActive
                    ? 'w-11 bg-[#3B82F6] shadow-[0_0_10px_rgba(59,130,246,0.7)]'
                    : isPassed
                    ? 'w-8 bg-[#3B82F6]/55'
                    : 'w-8 bg-white/12 hover:bg-white/25'
                }`}
                aria-label={`Шаг ${idx + 1}`}
              />
            );
          })}
        </div>

        {/* Нижняя строка: Счётчик «1 из 5» + Кнопки «Назад» и «Далее →» */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[12.5px] font-medium text-[#94A3B8]">
            {stepIdx + 1} из {totalSteps}
          </span>

          <div className="flex items-center gap-2">
            {stepIdx > 0 && (
              <button
                type="button"
                onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-[#1E2536] hover:bg-[#283147] border border-white/10 text-white text-[13px] font-semibold transition cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Назад</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (stepIdx < totalSteps - 1) {
                  setStepIdx((i) => i + 1);
                } else {
                  onClose();
                }
              }}
              className="inline-flex items-center gap-1.5 h-9 px-5 rounded-full bg-white hover:bg-[#F8FAFC] text-[#0F172A] text-[13px] font-bold ring-2 ring-[#3B82F6] shadow-[0_0_18px_rgba(59,130,246,0.55)] transition cursor-pointer"
            >
              <span>{stepIdx < totalSteps - 1 ? 'Далее' : 'Готово'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
