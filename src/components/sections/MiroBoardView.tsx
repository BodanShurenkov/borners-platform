'use client';

import React, { useState, useRef } from 'react';
import {
  Plus,
  Image as ImageIcon,
  Mic,
  Square,
  Trash2,
  Move,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Volume2,
  Upload,
} from 'lucide-react';
import { usePlatform } from '@/context/PlatformContext';
import { MiroBoardItem } from '@/types/platform';
import { compressImageFileToDataUrl } from '@/lib/document-export';

const STICKY_COLORS = [
  { hex: '#FFF8D6', label: 'Тёплый жёлтый' },
  { hex: '#FCE8DF', label: 'Терракота' },
  { hex: '#E6F4EE', label: 'Мятный зелёный' },
  { hex: '#EBF2FA', label: 'Небесный' },
  { hex: '#FAF8F5', label: 'Слоновая кость' },
];

// Компактный WAV-сигнал для демо-голосового сообщения, если микрофон недоступен
function createDemoVoiceWavDataUrl(): string {
  const sampleRate = 8000;
  const durationSec = 2;
  const numSamples = sampleRate * durationSec;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const freq = t < 0.6 ? 440 : t < 1.2 ? 523.25 : 659.25;
    const env = Math.sin((Math.PI * (i % (sampleRate * 0.6))) / (sampleRate * 0.6));
    const sample = Math.sin(2 * Math.PI * freq * t) * env * 0.25;
    view.setInt16(44 + i * 2, sample * 32767, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

export function MiroBoardView() {
  const {
    miroItems,
    createMiroItem,
    updateMiroItem,
    deleteMiroItem,
    concepts,
    brandFilter,
    navigateTo,
    notify,
  } = usePlatform();

  const [zoom, setZoom] = useState<number>(1);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const [selectedConceptToPin, setSelectedConceptToPin] = useState<string>('');

  // Запись голосового сообщения (MediaRecorder)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSec, setRecordingSec] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);

  const visibleItems = (miroItems || []).filter(
    (item) =>
      brandFilter === 'ALL' || item.brandId === 'ALL' || item.brandId === brandFilter
  );

  const getNextCoordinates = () => {
    const count = visibleItems.length;
    const col = count % 3;
    const row = Math.floor(count / 3);
    return {
      x: 40 + col * 330 + ((count * 17) % 30),
      y: 40 + row * 250 + ((count * 13) % 25),
    };
  };

  const handleAddSticky = (color = '#FFF8D6') => {
    const pos = getNextCoordinates();
    createMiroItem({
      type: 'sticky',
      title: 'Новая заметка на доске',
      content: 'Запишите идею, комментарий по образцу или задачу для команды...',
      brandId: brandFilter === 'ALL' ? 'ALL' : brandFilter,
      color,
      x: pos.x,
      y: pos.y,
      width: 290,
    });
    notify('success', 'Стикер добавлен на свободную доску Miro');
  };

  const handleUploadPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const compressedUrls: string[] = [];
    for (const file of files) {
      const url = await compressImageFileToDataUrl(file, 680, 0.78);
      if (url) compressedUrls.push(url);
    }

    if (compressedUrls.length > 0) {
      const pos = getNextCoordinates();
      createMiroItem({
        type: 'photo',
        title:
          files.length === 1
            ? files[0].name.replace(/\.[^/.]+$/, '')
            : `Подборка фото (${files.length} шт.)`,
        content: 'Визуальный референс / фотография образца на доске',
        brandId: brandFilter === 'ALL' ? 'ALL' : brandFilter,
        color: '#FAF8F5',
        x: pos.x,
        y: pos.y,
        width: 310,
        imageUrl: compressedUrls[0],
        galleryUrls: compressedUrls,
      });
      notify(
        'success',
        `Добавлено на доску фотографий: ${compressedUrls.length}`
      );
    }
    e.target.value = '';
  };

  const startVoiceRecording = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        audioChunksRef.current = [];

        recorder.ondataavailable = (ev) => {
          if (ev.data.size > 0) audioChunksRef.current.push(ev.data);
        };

        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = typeof reader.result === 'string' ? reader.result : '';
            const pos = getNextCoordinates();
            createMiroItem({
              type: 'voice',
              title: `Голосовая заметка (${recordingSec || 3} сек.)`,
              content: 'Аудиокомментарий по продукту / правкам лекала и образца',
              brandId: brandFilter === 'ALL' ? 'ALL' : brandFilter,
              color: '#EBF2FA',
              x: pos.x,
              y: pos.y,
              width: 300,
              audioDataUrl: dataUrl || createDemoVoiceWavDataUrl(),
              audioDurationSec: recordingSec || 3,
            });
            notify('success', 'Голосовое сообщение сохранено на доске Miro');
          };
          reader.readAsDataURL(blob);
        };

        mediaRecorderRef.current = recorder;
        recorder.start();
        setIsRecording(true);
        setRecordingSec(0);
        timerRef.current = window.setInterval(() => {
          setRecordingSec((s) => s + 1);
        }, 1000);
        return;
      }
    } catch {
      // Fallback: если доступ к микрофону запрещён в браузере, создаём демо-голосовое
    }

    const pos = getNextCoordinates();
    createMiroItem({
      type: 'voice',
      title: 'Голосовое сообщение (Демо-запись 00:02)',
      content: 'Комментарий руководителя по посадке пояса и отбору фабрики',
      brandId: brandFilter === 'ALL' ? 'ALL' : brandFilter,
      color: '#EBF2FA',
      x: pos.x,
      y: pos.y,
      width: 300,
      audioDataUrl: createDemoVoiceWavDataUrl(),
      audioDurationSec: 2,
    });
    notify(
      'success',
      'Голосовая карточка добавлена на доску',
      'Можно прослушать прямо на холсте или загрузить аудиофайл'
    );
  };

  const stopVoiceRecording = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleUploadAudioFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) return;
      const pos = getNextCoordinates();
      createMiroItem({
        type: 'voice',
        title: `Аудио: ${file.name.replace(/\.[^/.]+$/, '')}`,
        content: 'Прикреплённое голосовое сообщение / аудиозапись обсуждения',
        brandId: brandFilter === 'ALL' ? 'ALL' : brandFilter,
        color: '#EBF2FA',
        x: pos.x,
        y: pos.y,
        width: 300,
        audioDataUrl: dataUrl,
      });
      notify('success', `Голосовой файл «${file.name}» добавлен на доску`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePinConcept = (conceptId: string) => {
    const c = concepts.find((x) => x.id === conceptId);
    if (!c) return;
    const pos = getNextCoordinates();
    createMiroItem({
      type: 'concept_link',
      title: `${c.code} · ${c.name}`,
      content: c.whatAttracted || c.ideaDescription || 'Карточка разработки R&D',
      brandId: c.brandId,
      color: '#E6F4EE',
      x: pos.x,
      y: pos.y,
      width: 300,
      imageUrl: c.imageUrl,
      linkedConceptId: c.id,
    });
    setSelectedConceptToPin('');
    notify('success', `Карточка ${c.code} закреплена на доске Miro`);
  };

  const handleMouseDownCard = (
    e: React.MouseEvent,
    item: MiroBoardItem
  ) => {
    if (
      (e.target as HTMLElement).tagName === 'INPUT' ||
      (e.target as HTMLElement).tagName === 'TEXTAREA' ||
      (e.target as HTMLElement).tagName === 'BUTTON' ||
      (e.target as HTMLElement).tagName === 'AUDIO' ||
      (e.target as HTMLElement).closest('button')
    ) {
      return;
    }
    const boardRect = boardRef.current?.getBoundingClientRect();
    if (!boardRect) return;
    const mouseX = (e.clientX - boardRect.left) / zoom;
    const mouseY = (e.clientY - boardRect.top) / zoom;
    setDraggingId(item.id);
    setDragOffset({ dx: mouseX - item.x, dy: mouseY - item.y });
  };

  const handleMouseMoveBoard = (e: React.MouseEvent) => {
    if (!draggingId || !boardRef.current) return;
    const boardRect = boardRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - boardRect.left) / zoom;
    const mouseY = (e.clientY - boardRect.top) / zoom;
    const nextX = Math.max(12, Math.min(1320, Math.round(mouseX - dragOffset.dx)));
    const nextY = Math.max(12, Math.min(920, Math.round(mouseY - dragOffset.dy)));
    updateMiroItem(draggingId, { x: nextX, y: nextY });
  };

  const handleMouseUpBoard = () => {
    if (draggingId) setDraggingId(null);
  };

  return (
    <div className="rounded-[16px] bg-white border-2 border-[#181715] overflow-hidden shadow-xs">
      {/* ПАНЕЛЬ ИНСТРУМЕНТОВ ДОСКИ MIRO */}
      <div className="px-5 py-4 bg-[#FAF8F5] border-b-2 border-[#181715] flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-[#B85D35] font-semibold">
            <span>СВОБОДНАЯ ДОСКА MIRO · ВИЗУАЛЬНЫЙ ХОЛСТ КОМАНДЫ</span>
          </div>
          <h2 className="font-serif-editorial text-[24px] font-semibold text-[#181715] leading-tight">
            Свободная доска: стикеры, фотографии и голосовые заметки
          </h2>
        </div>

        {/* Кнопки добавления на доску */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleAddSticky('#FFF8D6')}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[8px] bg-[#181715] hover:bg-[#2C2B29] text-white text-[12.5px] font-semibold transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ Стикер</span>
          </button>

          <label className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[8px] bg-white hover:bg-[#F3EFE8] text-[#181715] border-[1.5px] border-[#181715] text-[12.5px] font-semibold transition cursor-pointer">
            <ImageIcon className="h-3.5 w-3.5 text-[#B85D35]" />
            <span>+ Добавить фото (1–10)</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleUploadPhotos}
              className="hidden"
            />
          </label>

          {/* Кнопка записи голосового сообщения */}
          {!isRecording ? (
            <button
              type="button"
              onClick={startVoiceRecording}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[8px] bg-[#B85D35] hover:bg-[#9E4B27] text-white text-[12.5px] font-semibold transition cursor-pointer"
            >
              <Mic className="h-3.5 w-3.5" />
              <span>+ Записать голосовое</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopVoiceRecording}
              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-[8px] bg-[#C94B4B] text-white text-[12.5px] font-bold animate-pulse cursor-pointer"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              <span>Стоп ({recordingSec} сек.) — сохранить</span>
            </button>
          )}

          {/* Загрузка готового голосового файла (.ogg / .mp3 / .wav) */}
          <label
            title="Загрузить голосовое из Telegram / телефона (.ogg, .mp3, .wav, .m4a)"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[8px] bg-white hover:bg-[#F3EFE8] text-[#181715] border-[1.5px] border-[#CFC8BC] hover:border-[#181715] text-[12px] font-medium transition cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5 text-[#5C5852]" />
            <span>Аудиофайл</span>
            <input
              type="file"
              accept="audio/*"
              onChange={handleUploadAudioFile}
              className="hidden"
            />
          </label>

          {/* Закрепить карточку R&D */}
          <select
            value={selectedConceptToPin}
            onChange={(e) => {
              if (e.target.value) handlePinConcept(e.target.value);
            }}
            className="h-9 rounded-[8px] bg-white border-[1.5px] border-[#CFC8BC] hover:border-[#181715] px-2.5 text-[12px] font-medium text-[#181715] cursor-pointer max-w-[200px]"
          >
            <option value="">+ Закрепить карточку R&amp;D...</option>
            {concepts
              .filter((c) => !c.isArchived)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} · {c.name}
                </option>
              ))}
          </select>

          {/* Масштаб холста */}
          <div className="inline-flex items-center rounded-[8px] border border-[#D4CDC2] bg-white p-0.5">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.75, Number((z - 0.1).toFixed(2))))}
              className="p-1.5 text-[#5C5852] hover:text-[#181715] cursor-pointer"
              title="Отдалить"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] font-semibold text-[#181715]">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.25, Number((z + 0.1).toFixed(2))))}
              className="p-1.5 text-[#5C5852] hover:text-[#181715] cursor-pointer"
              title="Приблизить"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* СВОБОДНЫЙ ХОЛСТ MIRO С ТОЧЕЧНОЙ СЕТКОЙ И СВОБОДНЫМ ПЕРЕТАСКИВАНИЕМ */}
      <div className="relative w-full overflow-auto bg-[#F4F1EA]">
        <div
          ref={boardRef}
          onMouseMove={handleMouseMoveBoard}
          onMouseUp={handleMouseUpBoard}
          onMouseLeave={handleMouseUpBoard}
          style={{
            minHeight: '640px',
            minWidth: '1200px',
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            backgroundImage:
              'radial-gradient(circle, #C5BEB2 1.25px, transparent 1.25px)',
            backgroundSize: '24px 24px',
          }}
          className="relative w-full h-[660px] select-none"
        >
          {visibleItems.map((item) => (
            <div
              key={item.id}
              onMouseDown={(e) => handleMouseDownCard(e, item)}
              style={{
                left: `${item.x}px`,
                top: `${item.y}px`,
                width: `${item.width || 290}px`,
                backgroundColor: item.color || '#FFF8D6',
              }}
              className={`absolute rounded-[14px] border-2 p-4 space-y-2.5 transition-shadow ${
                draggingId === item.id
                  ? 'border-[#181715] shadow-2xl z-30 cursor-grabbing'
                  : 'border-[#181715]/80 hover:border-[#181715] shadow-md z-10 cursor-grab'
              }`}
            >
              {/* Верхняя полоска карточки на доске */}
              <div className="flex items-center justify-between gap-2 border-b border-black/10 pb-2">
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider font-bold text-[#4A4742]">
                  <Move className="h-3 w-3" />
                  <span>
                    {item.type === 'sticky'
                      ? 'СТИКЕР'
                      : item.type === 'photo'
                      ? 'ФОТО / МУДБОРД'
                      : item.type === 'voice'
                      ? 'ГОЛОСОВОЕ'
                      : 'КАРТОЧКА R&D'}
                  </span>
                </span>

                <div className="flex items-center gap-1">
                  {item.type === 'sticky' &&
                    STICKY_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => updateMiroItem(item.id, { color: c.hex })}
                        style={{ backgroundColor: c.hex }}
                        className="h-3.5 w-3.5 rounded-full border border-black/30 cursor-pointer"
                        title={c.label}
                      />
                    ))}
                  <button
                    type="button"
                    onClick={() => deleteMiroItem(item.id)}
                    className="p-1 text-[#6E6A63] hover:text-[#B93829] cursor-pointer ml-1"
                    title="Убрать с доски"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Заголовок карточки (редактируемый) */}
              <input
                value={item.title}
                onChange={(e) => updateMiroItem(item.id, { title: e.target.value })}
                className="w-full bg-transparent text-[14.5px] font-bold text-[#181715] outline-none border-b border-transparent focus:border-black/25 pb-0.5"
              />

              {/* Фотография или галерея, если это фото-карточка */}
              {item.imageUrl && (
                <div className="rounded-[10px] bg-white border border-black/15 p-2 space-y-2">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-36 object-contain rounded-[6px] bg-[#FAF8F5]"
                  />
                  {item.galleryUrls && item.galleryUrls.length > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
                      {item.galleryUrls.map((u, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => updateMiroItem(item.id, { imageUrl: u })}
                          className={`h-9 w-9 rounded border overflow-hidden shrink-0 cursor-pointer ${
                            item.imageUrl === u ? 'border-[#B85D35] border-2' : 'border-black/15'
                          }`}
                        >
                          <img src={u} alt="" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Плеер голосового сообщения, если это голосовая карточка */}
              {item.type === 'voice' && (
                <div className="rounded-[10px] bg-white border-[1.5px] border-[#181715]/20 p-2.5 space-y-2">
                  <div className="flex items-center gap-2 text-[11.5px] font-semibold text-[#B85D35]">
                    <Volume2 className="h-4 w-4 shrink-0" />
                    <span>Голосовая заметка · Прослушать</span>
                  </div>
                  <audio
                    controls
                    src={item.audioDataUrl || createDemoVoiceWavDataUrl()}
                    className="w-full h-8"
                  />
                </div>
              )}

              {/* Текст / описание */}
              <textarea
                rows={item.imageUrl || item.type === 'voice' ? 2 : 4}
                value={item.content}
                onChange={(e) => updateMiroItem(item.id, { content: e.target.value })}
                className="w-full bg-transparent text-[12.5px] text-[#3D3A36] leading-snug outline-none resize-none"
              />

              {/* Переход в привязанную карточку R&D */}
              {item.linkedConceptId && (
                <button
                  type="button"
                  onClick={() =>
                    navigateTo('product-lab', { conceptId: item.linkedConceptId })
                  }
                  className="w-full rounded-[8px] bg-[#181715] hover:bg-[#B85D35] text-white py-1.5 px-3 text-[11.5px] font-semibold transition cursor-pointer flex items-center justify-between"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" />
                    <span>Открыть карточку R&amp;D</span>
                  </span>
                  <span>→</span>
                </button>
              )}

              <div className="flex items-center justify-between text-[10.5px] text-[#6E6A63] pt-1 border-t border-black/10">
                <span>{item.authorName}</span>
                <span>{item.createdAt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
