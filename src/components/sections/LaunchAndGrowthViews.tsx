'use client';

import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  GripVertical,
  Plus,
  X,
} from 'lucide-react';
import { usePlatform } from '@/context/PlatformContext';
import {
  Launch,
  MarketingChannel,
} from '@/types/platform';
import {
  EXPERIMENT_STATUS_LABELS_RU,
  canUserViewFinance,
  detectLaunchDateConflicts,
  formatCompactRub,
  formatCurrencyRub,
} from '@/lib/finance';

const LAUNCH_STATUS_COLUMNS: Launch['status'][] = [
  'Подготовка',
  'В работе',
  'Согласование',
  'Готов к старту',
  'Запущен',
];

export function LaunchCalendarView() {
  const {
    launches,
    products,
    tasks,
    users,
    currentUser,
    brandFilter,
    selectedLaunchId,
    setSelectedLaunchId,
    createLaunch,
    updateLaunch,
    rescheduleLaunch,
    createTask,
    navigateTo,
  } = usePlatform();

  const [viewMode, setViewMode] = useState<'timeline' | 'calendar' | 'list' | 'kanban'>(
    'timeline'
  );
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [draggedLaunchId, setDraggedLaunchId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<Launch['status'] | null>(null);

  const [rescheduleModalLaunch, setRescheduleModalLaunch] = useState<Launch | null>(null);
  const [newStartDate, setNewStartDate] = useState('');
  const [shiftDependents, setShiftDependents] = useState(false);

  const [newLaunchForm, setNewLaunchForm] = useState({
    name: '',
    brandId: brandFilter === 'NA_TELE' ? 'NA_TELE' : 'BORNERS',
    collectionName: 'Капсула Весна 2027',
    startDate: '2027-03-20',
    salesPlanRub: '9500000',
    salesPlanUnits: '4000',
    marketingBudgetRub: '950000',
  });

  const hasFinance = canUserViewFinance(currentUser);

  const filteredLaunches = useMemo(
    () =>
      launches
        .filter((l) => !l.isArchived && (brandFilter === 'ALL' || l.brandId === brandFilter))
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [launches, brandFilter]
  );

  const activeLaunch: Launch | null = useMemo(
    () => launches.find((l) => l.id === selectedLaunchId) || null,
    [launches, selectedLaunchId]
  );

  const openRescheduleModal = (launch: Launch) => {
    setRescheduleModalLaunch(launch);
    setNewStartDate(launch.startDate);
    setShiftDependents(false);
  };

  const previewConflicts = useMemo(() => {
    if (!rescheduleModalLaunch || !newStartDate) return null;
    const linkedTasks = tasks.filter((t) => t.launchId === rescheduleModalLaunch.id);
    return detectLaunchDateConflicts(rescheduleModalLaunch, newStartDate, linkedTasks);
  }, [rescheduleModalLaunch, newStartDate, tasks]);

  const handleLaunchDragStart = (e: React.DragEvent, launchId: string) => {
    setDraggedLaunchId(launchId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', launchId);
  };

  const handleLaunchDrop = (e: React.DragEvent, targetStatus: Launch['status']) => {
    e.preventDefault();
    const lId = e.dataTransfer.getData('text/plain') || draggedLaunchId;
    if (lId) {
      const l = launches.find((item) => item.id === lId);
      if (l && l.status !== targetStatus) {
        updateLaunch(lId, { status: targetStatus });
      }
    }
    setDraggedLaunchId(null);
    setDragOverStatus(null);
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Заголовок страницы (32–40px по ТЗ) */}
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-[#E8E8E5] pb-6">
        <div>
          <div className="text-[13px] font-medium uppercase tracking-widest text-[#737373] mb-1.5">
            Релизы коллекций и подготовка партий · {filteredLaunches.length} запусков
          </div>
          <h1 className="text-[34px] md:text-[40px] font-bold tracking-[-0.03em] text-[#171717] dark:text-white">
            Календарь запусков
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-[#F7F7F5] p-1 rounded-xl border border-[#E8E8E5]">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-4 py-2 rounded-lg text-[14px] font-semibold transition cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-white text-[#171717] shadow-2xs'
                  : 'text-[#737373] hover:text-[#171717]'
              }`}
            >
              Дорожная карта
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-lg text-[14px] font-semibold transition cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-white text-[#171717] shadow-2xs'
                  : 'text-[#737373] hover:text-[#171717]'
              }`}
            >
              По месяцам
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg text-[14px] font-semibold transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-[#171717] shadow-2xs'
                  : 'text-[#737373] hover:text-[#171717]'
              }`}
            >
              Таблица
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-4 py-2 rounded-lg text-[14px] font-semibold transition cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white text-[#171717] shadow-2xs'
                  : 'text-[#737373] hover:text-[#171717]'
              }`}
            >
              Доска
            </button>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 h-11 rounded-xl bg-[#111111] text-white px-5 text-[15px] font-semibold hover:bg-neutral-800 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Новый запуск</span>
          </button>
        </div>
      </div>

      {/* РЕЖИМ 1: ДОРОЖНАЯ КАРТА РЕЛИЗОВ */}
      {viewMode === 'timeline' && (
        <div className="space-y-6">
          {filteredLaunches.map((launch) => {
            const isBorners = launch.brandId === 'BORNERS';
            const linkedProducts = products.filter((p) =>
              launch.productIds.includes(p.id)
            );

            return (
              <div
                key={launch.id}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-[#E8E8E5] p-7 md:p-8 space-y-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-6 border-b border-[#E8E8E5] pb-6">
                  <div className="flex items-start gap-5 max-w-2xl">
                    {/* Чистое предметное превью запуска */}
                    <div className="h-24 w-24 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] flex items-center justify-center p-2.5 shrink-0">
                      <img
                        src={launch.imageUrl}
                        alt={launch.name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 text-[13px] font-semibold">
                        <span style={{ color: isBorners ? '#D97745' : '#8B8078' }}>
                          {isBorners ? 'BORNERS' : 'НА ТЕЛЕ'}
                        </span>
                        <span className="text-[#737373]">
                          · Старт продаж: <b className="text-[#171717]">{launch.startDate}</b> ·{' '}
                          {launch.status}
                        </span>
                      </div>
                      <h3
                        onClick={() => setSelectedLaunchId(launch.id)}
                        className="text-[24px] font-bold text-[#171717] dark:text-white hover:underline cursor-pointer"
                      >
                        {launch.name} · {launch.collectionName}
                      </h3>
                      <p className="text-[15px] text-[#737373]">
                        Статус партии: {launch.productionStatus}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6">
                    <div>
                      <div className="text-[12px] text-[#737373]">План выручки</div>
                      <div className="text-[22px] font-bold text-[#171717] mt-0.5">
                        {hasFinance ? formatCompactRub(launch.salesPlanRub) : 'Скрыто'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[12px] text-[#737373]">Готовность</div>
                      <div className="text-[22px] font-bold text-[#16805D] mt-0.5">
                        {launch.readinessPct}%
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => openRescheduleModal(launch)}
                        className="h-11 rounded-xl border border-[#E8E8E5] bg-[#F7F7F5] px-4 text-[14px] font-semibold hover:border-[#171717] cursor-pointer"
                      >
                        Сдвинуть дату
                      </button>
                      <button
                        onClick={() => setSelectedLaunchId(launch.id)}
                        className="h-11 rounded-xl bg-[#111111] text-white px-4 text-[14px] font-semibold hover:bg-neutral-800 cursor-pointer"
                      >
                        Этапы запуска →
                      </button>
                    </div>
                  </div>
                </div>

                {/* Этапы подготовки (10 стадий запуска по п. 8 ТЗ) */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {launch.stages.map((st) => {
                    const isLateAfterStart =
                      !['sales', 'analysis'].includes(st.code) &&
                      st.deadline > launch.startDate;
                    return (
                      <div
                        key={st.code}
                        className={`p-3.5 rounded-xl border text-[14px] ${
                          isLateAfterStart
                            ? 'border-[#C94B4B] bg-[#C94B4B]/5'
                            : st.status === 'Done'
                            ? 'border-[#E8E8E5] bg-[#F7F7F5]'
                            : 'border-[#E8E8E5] bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[12px] mb-1.5">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              st.status === 'Done'
                                ? 'bg-[#16805D]'
                                : st.status === 'In Progress'
                                ? 'bg-[#D99527]'
                                : st.status === 'Delayed'
                                ? 'bg-[#C94B4B]'
                                : 'bg-[#737373]'
                            }`}
                          />
                          <span className="text-[#737373]">{st.deadline}</span>
                        </div>
                        <div className="font-semibold text-[13px] text-[#171717] leading-snug">
                          {st.label}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Модели релиза */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#E8E8E5] text-[14px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-[#737373]">Модели в запуске:</span>
                    {linkedProducts.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => navigateTo('product-catalog', { productId: p.id })}
                        className="rounded-lg bg-[#F7F7F5] border border-[#E8E8E5] px-3 py-1 text-[13px] font-semibold hover:border-[#171717] transition cursor-pointer"
                      >
                        {p.sku} · {p.name}
                      </button>
                    ))}
                  </div>
                  <span className="text-[13px] text-[#737373]">
                    План в штуках: <b className="text-[#171717]">{launch.salesPlanUnits.toLocaleString('ru-RU')} шт.</b>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* РЕЖИМ 2: ПО МЕСЯЦАМ */}
      {viewMode === 'calendar' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { monthKey: '2027-02', label: 'Февраль 2027' },
            { monthKey: '2027-03', label: 'Март 2027' },
            { monthKey: '2027-04', label: 'Апрель 2027' },
          ].map((m) => {
            const monthLaunches = filteredLaunches.filter((l) =>
              l.startDate.startsWith(m.monthKey)
            );
            return (
              <div
                key={m.monthKey}
                className="bg-white rounded-2xl border border-[#E8E8E5] p-6 space-y-5"
              >
                <div className="flex items-center justify-between border-b border-[#E8E8E5] pb-3">
                  <h3 className="text-[20px] font-bold">{m.label}</h3>
                  <span className="text-[13px] font-semibold text-[#737373] bg-[#F7F7F5] px-2.5 py-0.5 rounded-lg border border-[#E8E8E5]">
                    {monthLaunches.length}
                  </span>
                </div>

                <div className="space-y-4">
                  {monthLaunches.map((l) => (
                    <div
                      key={l.id}
                      onClick={() => setSelectedLaunchId(l.id)}
                      className="rounded-xl border border-[#E8E8E5] hover:border-[#171717] p-5 cursor-pointer transition space-y-2"
                    >
                      <div className="flex items-center justify-between text-[13px] font-semibold">
                        <span
                          style={{
                            color: l.brandId === 'BORNERS' ? '#D97745' : '#8B8078',
                          }}
                        >
                          {l.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : 'BORNERS'}
                        </span>
                        <span className="text-[#737373]">{l.startDate}</span>
                      </div>
                      <div className="text-[18px] font-bold text-[#171717]">{l.name}</div>
                      <div className="text-[14px] text-[#737373]">{l.collectionName}</div>
                    </div>
                  ))}
                  {monthLaunches.length === 0 && (
                    <div className="py-10 text-center text-[14px] text-[#737373] rounded-xl border border-dashed border-[#E8E8E5]">
                      Запусков не запланировано
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* РЕЖИМ 3: ТАБЛИЦА ЗАПУСКОВ */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-[#E8E8E5] overflow-x-auto">
          <table className="w-full text-left text-[15px]">
            <thead className="border-b border-[#E8E8E5] text-[13px] font-semibold uppercase tracking-wider text-[#737373] bg-[#F7F7F5]/60">
              <tr>
                <th className="py-4 px-6">Релиз и коллекция</th>
                <th className="py-4 px-4">Бренд</th>
                <th className="py-4 px-4">Старт продаж</th>
                <th className="py-4 px-4 text-right">Готовность</th>
                <th className="py-4 px-4 text-right">План выручки</th>
                <th className="py-4 px-6 text-right">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E5]">
              {filteredLaunches.map((l) => (
                <tr key={l.id} className="hover:bg-[#F7F7F5]/60 transition">
                  <td className="py-4 px-6">
                    <div className="font-semibold text-[16px] text-[#171717]">{l.name}</div>
                    <div className="text-[13px] text-[#737373]">{l.collectionName}</div>
                  </td>
                  <td className="py-4 px-4 font-semibold">
                    {l.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : 'BORNERS'}
                  </td>
                  <td className="py-4 px-4 font-semibold">{l.startDate}</td>
                  <td className="py-4 px-4 text-right font-bold text-[#16805D]">
                    {l.readinessPct}%
                  </td>
                  <td className="py-4 px-4 text-right font-semibold">
                    {hasFinance ? formatCompactRub(l.salesPlanRub) : 'Скрыто'}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => setSelectedLaunchId(l.id)}
                      className="rounded-xl border border-[#E8E8E5] px-4 py-2 text-[14px] font-semibold hover:bg-[#111111] hover:text-white cursor-pointer"
                    >
                      Открыть →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* РЕЖИМ 4: ДОСКА СТАТУСОВ С DRAG & DROP */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
          {LAUNCH_STATUS_COLUMNS.map((statusCol) => {
            const items = filteredLaunches.filter((l) => l.status === statusCol);
            const isDropTarget = dragOverStatus === statusCol;

            return (
              <div
                key={statusCol}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverStatus !== statusCol) setDragOverStatus(statusCol);
                }}
                onDragLeave={() => setDragOverStatus(null)}
                onDrop={(e) => handleLaunchDrop(e, statusCol)}
                className={`p-4 rounded-2xl min-h-[440px] border transition-all ${
                  isDropTarget
                    ? 'bg-white border-2 border-[#D97745] shadow-lg'
                    : 'bg-white/70 border-[#E8E8E5]'
                }`}
              >
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E8E8E5]">
                  <span className="text-[14px] font-bold text-[#171717]">
                    {statusCol}
                  </span>
                  <span className="text-[13px] font-semibold text-[#737373] bg-[#F7F7F5] px-2.5 py-0.5 rounded-lg border border-[#E8E8E5]">
                    {items.length}
                  </span>
                </div>

                <div className="space-y-3.5">
                  {items.map((l) => (
                    <div
                      key={l.id}
                      draggable
                      onDragStart={(e) => handleLaunchDragStart(e, l.id)}
                      onDragEnd={() => {
                        setDraggedLaunchId(null);
                        setDragOverStatus(null);
                      }}
                      onClick={() => setSelectedLaunchId(l.id)}
                      className="bg-white rounded-xl border border-[#E8E8E5] hover:border-[#171717] p-4 cursor-grab active:cursor-grabbing space-y-2.5 transition"
                    >
                      <div className="flex items-center justify-between text-[13px] font-semibold">
                        <span className="inline-flex items-center gap-1.5">
                          <GripVertical className="h-4 w-4 text-[#737373]" />
                          {l.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : 'BORNERS'}
                        </span>
                        <span className="text-[#737373]">{l.startDate}</span>
                      </div>
                      <div className="text-[16px] font-bold text-[#171717]">{l.name}</div>
                      <div className="text-[14px] text-[#737373]">{l.collectionName}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Модальное окно переноса даты с проверкой конфликтов */}
      {rescheduleModalLaunch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-[#E8E8E5] p-8 space-y-6 shadow-2xl">
            <h3 className="text-[22px] font-bold border-b border-[#E8E8E5] pb-4">
              Перенос даты: {rescheduleModalLaunch.name}
            </h3>

            <div className="space-y-4 text-[14px]">
              <div>
                <label className="block font-semibold mb-1.5">Новая дата старта продаж</label>
                <input
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="w-full h-11 rounded-xl border border-[#E8E8E5] px-3.5 text-[15px]"
                />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={shiftDependents}
                  onChange={(e) => setShiftDependents(e.target.checked)}
                  className="h-4 w-4 accent-[#111111]"
                />
                <span className="font-medium text-[#171717]">
                  Автоматически сдвинуть дедлайны этапов и связанных задач
                </span>
              </label>
            </div>

            {previewConflicts && previewConflicts.conflicts.length > 0 && (
              <div className="rounded-xl border border-[#C94B4B] bg-[#C94B4B]/5 p-4 space-y-2 text-[14px]">
                <div className="font-semibold text-[#C94B4B] flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>
                    Обнаружены затрагиваемые сроки ({previewConflicts.conflicts.length}):
                  </span>
                </div>
                <ul className="space-y-1 text-[#171717] max-h-40 overflow-y-auto">
                  {previewConflicts.conflicts.map((c, idx) => (
                    <li key={idx}>
                      • {c.title}: {c.currentDeadline} → {c.suggestedDeadline} ({c.reason})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-[#E8E8E5]">
              <button
                onClick={() => setRescheduleModalLaunch(null)}
                className="h-11 px-5 rounded-xl border border-[#E8E8E5] text-[14px] font-semibold cursor-pointer"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  rescheduleLaunch(
                    rescheduleModalLaunch.id,
                    newStartDate,
                    shiftDependents
                  );
                  setRescheduleModalLaunch(null);
                }}
                className="h-11 px-6 rounded-xl bg-[#111111] text-white text-[14px] font-semibold cursor-pointer"
              >
                Применить дату
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Боковая панель этапов релиза */}
      {activeLaunch && (
        <div
          onClick={() => setSelectedLaunchId(null)}
          className="fixed inset-0 z-50 flex justify-end bg-black/40"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white h-full overflow-y-auto p-8 md:p-10 space-y-8 shadow-2xl border-l border-[#E8E8E5]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#E8E8E5] pb-6">
              <div>
                <div className="text-[13px] font-semibold uppercase text-[#737373]">
                  {activeLaunch.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : 'BORNERS'} · Старт:{' '}
                  {activeLaunch.startDate}
                </div>
                <h2 className="text-[28px] font-bold text-[#171717] mt-1">
                  {activeLaunch.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedLaunchId(null)}
                className="rounded-xl border border-[#E8E8E5] p-2 text-[#171717] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#E8E8E5] pb-3">
                <h3 className="text-[20px] font-bold">
                  Этапы подготовки ({activeLaunch.readinessPct}%)
                </h3>
                <button
                  onClick={() => {
                    createTask({
                      title: `Подготовка к запуску ${activeLaunch.name}`,
                      description: `Операционная задача по релизу ${activeLaunch.collectionName}`,
                      brandId: activeLaunch.brandId,
                      projectId: 'proj-1',
                      priority: 'High',
                      assigneeId: users[0]?.id || 'user-owner',
                      deadline: activeLaunch.startDate,
                      launchId: activeLaunch.id,
                    });
                  }}
                  className="rounded-xl border border-[#E8E8E5] px-3.5 py-1.5 text-[13px] font-semibold hover:bg-[#111111] hover:text-white cursor-pointer"
                >
                  + Создать задачу
                </button>
              </div>

              <div className="divide-y divide-[#E8E8E5] rounded-2xl border border-[#E8E8E5] overflow-hidden">
                {activeLaunch.stages.map((st) => (
                  <label
                    key={st.code}
                    className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-[#F7F7F5]"
                  >
                    <div className="flex items-center gap-3 text-[15px]">
                      <input
                        type="checkbox"
                        checked={st.status === 'Done'}
                        onChange={(e) => {
                          const updatedStages = activeLaunch.stages.map((s) =>
                            s.code === st.code
                              ? {
                                  ...s,
                                  status: (e.target.checked ? 'Done' : 'Pending') as
                                    | 'Done'
                                    | 'In Progress'
                                    | 'Pending'
                                    | 'Delayed',
                                }
                              : s
                          );
                          const doneCount = updatedStages.filter(
                            (s) => s.status === 'Done'
                          ).length;
                          const pct = Math.round(
                            (doneCount / updatedStages.length) * 100
                          );
                          updateLaunch(activeLaunch.id, {
                            stages: updatedStages,
                            readinessPct: pct,
                          });
                        }}
                        className="h-5 w-5 accent-[#16805D]"
                      />
                      <span
                        className={
                          st.status === 'Done'
                            ? 'line-through text-[#737373]'
                            : 'font-semibold text-[#171717]'
                        }
                      >
                        {st.label}
                      </span>
                    </div>
                    <span className="text-[13px] text-[#737373]">{st.deadline}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно создания запуска */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-[#E8E8E5] p-8 space-y-5 shadow-2xl">
            <h3 className="text-[22px] font-bold border-b border-[#E8E8E5] pb-4">
              Планирование нового релиза
            </h3>
            <div className="space-y-4 text-[14px]">
              <div>
                <label className="block font-semibold mb-1.5">Название запуска</label>
                <input
                  value={newLaunchForm.name}
                  onChange={(e) =>
                    setNewLaunchForm({ ...newLaunchForm, name: e.target.value })
                  }
                  placeholder="Например: DROP 04 · SUMMER SKIN"
                  className="w-full h-11 rounded-xl border border-[#E8E8E5] px-3.5 text-[15px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1.5">Бренд</label>
                  <select
                    value={newLaunchForm.brandId}
                    onChange={(e) =>
                      setNewLaunchForm({ ...newLaunchForm, brandId: e.target.value })
                    }
                    className="w-full h-11 rounded-xl border border-[#E8E8E5] px-3.5 text-[15px] bg-white font-medium"
                  >
                    <option value="BORNERS">BORNERS</option>
                    <option value="NA_TELE">НА ТЕЛЕ</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1.5">Дата старта</label>
                  <input
                    type="date"
                    value={newLaunchForm.startDate}
                    onChange={(e) =>
                      setNewLaunchForm({ ...newLaunchForm, startDate: e.target.value })
                    }
                    className="w-full h-11 rounded-xl border border-[#E8E8E5] px-3.5 text-[15px]"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-[#E8E8E5]">
              <button
                onClick={() => setCreateModalOpen(false)}
                className="h-11 px-5 rounded-xl border border-[#E8E8E5] text-[14px] font-semibold cursor-pointer"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  if (!newLaunchForm.name.trim()) return;
                  createLaunch({
                    name: newLaunchForm.name.trim(),
                    brandId: newLaunchForm.brandId,
                    collectionName: newLaunchForm.collectionName,
                    startDate: newLaunchForm.startDate,
                    marketingBudgetRub: Number(newLaunchForm.marketingBudgetRub) || 800000,
                    salesPlanUnits: Number(newLaunchForm.salesPlanUnits) || 4000,
                    salesPlanRub: Number(newLaunchForm.salesPlanRub) || 8500000,
                    ownerId: currentUser.id,
                  });
                  setCreateModalOpen(false);
                }}
                className="h-11 px-6 rounded-xl bg-[#111111] text-white text-[14px] font-semibold cursor-pointer"
              >
                Запланировать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// МАРКЕТИНГ, КАМПАНИИ И ЭКСПЕРИМЕНТЫ РОСТА (п. 9 ТЗ)
// =============================================================================
export function MarketingGrowthView() {
  const {
    campaigns,
    experiments,
    brandFilter,
    currentUser,
    createCampaign,
    createExperiment,
  } = usePlatform();

  const [tab, setTab] = useState<'campaigns' | 'experiments'>('campaigns');
  const [expModalOpen, setExpModalOpen] = useState(false);
  const [campModalOpen, setCampModalOpen] = useState(false);

  const [expForm, setExpForm] = useState({
    hypothesis: '',
    brandId: brandFilter === 'NA_TELE' ? 'NA_TELE' : 'BORNERS',
    rationale: '',
    method: 'A/B тест карточек и видеообложек',
    successCriteria: 'Рост CTR на +1.2 п.п.',
    budgetRub: '120000',
  });

  const [campForm, setCampForm] = useState({
    name: '',
    brandId: brandFilter === 'NA_TELE' ? 'NA_TELE' : 'BORNERS',
    channel: 'Wildberries' as MarketingChannel,
    goal: 'Масштабирование выкупов базовой капсулы',
    periodLabel: 'Февраль — Март 2027',
    plannedBudgetRub: '450000',
    plannedRevenueRub: '3200000',
  });

  const hasFinance = canUserViewFinance(currentUser);

  const filteredCampaigns = useMemo(
    () =>
      campaigns.filter(
        (c) =>
          !c.isArchived &&
          (brandFilter === 'ALL' || c.brandId === 'ALL' || c.brandId === brandFilter)
      ),
    [campaigns, brandFilter]
  );

  const filteredExperiments = useMemo(
    () =>
      experiments.filter(
        (e) => brandFilter === 'ALL' || e.brandId === 'ALL' || e.brandId === brandFilter
      ),
    [experiments, brandFilter]
  );

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-[#E8E8E5] pb-6">
        <div>
          <div className="text-[13px] font-medium uppercase tracking-widest text-[#737373] mb-1.5">
            Продвижение, кампании и гипотезы роста
          </div>
          <h1 className="text-[34px] md:text-[40px] font-bold tracking-[-0.03em] text-[#171717] dark:text-white">
            Маркетинг и рост
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-[#F7F7F5] p-1 rounded-xl border border-[#E8E8E5]">
            <button
              onClick={() => setTab('campaigns')}
              className={`px-4 py-2 rounded-lg text-[14px] font-semibold transition cursor-pointer ${
                tab === 'campaigns'
                  ? 'bg-white text-[#171717] shadow-2xs'
                  : 'text-[#737373] hover:text-[#171717]'
              }`}
            >
              Кампании ({filteredCampaigns.length})
            </button>
            <button
              onClick={() => setTab('experiments')}
              className={`px-4 py-2 rounded-lg text-[14px] font-semibold transition cursor-pointer ${
                tab === 'experiments'
                  ? 'bg-white text-[#171717] shadow-2xs'
                  : 'text-[#737373] hover:text-[#171717]'
              }`}
            >
              Тесты гипотез ({filteredExperiments.length})
            </button>
          </div>

          <button
            onClick={() =>
              tab === 'campaigns' ? setCampModalOpen(true) : setExpModalOpen(true)
            }
            className="h-11 px-5 rounded-xl bg-[#111111] text-white text-[15px] font-semibold cursor-pointer"
          >
            {tab === 'campaigns' ? '+ Новая кампания' : '+ Новая гипотеза'}
          </button>
        </div>
      </div>

      {/* Вкладка 1: Таблица кампаний */}
      {tab === 'campaigns' && (
        <div className="bg-white rounded-2xl border border-[#E8E8E5] overflow-x-auto">
          <table className="w-full text-left text-[15px]">
            <thead className="border-b border-[#E8E8E5] text-[13px] font-semibold uppercase tracking-wider text-[#737373] bg-[#F7F7F5]/60">
              <tr>
                <th className="py-4 px-6">Кампания и цель</th>
                <th className="py-4 px-4">Бренд и канал</th>
                <th className="py-4 px-4">Период</th>
                <th className="py-4 px-4 text-right">План бюджета</th>
                <th className="py-4 px-4 text-right">План выручки</th>
                <th className="py-4 px-4 text-right">Факт выручки</th>
                <th className="py-4 px-6 text-right">ROAS / ДРР</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E5]">
              {filteredCampaigns.map((c) => (
                <tr key={c.id} className="hover:bg-[#F7F7F5]/60 transition">
                  <td className="py-4 px-6">
                    <div className="font-semibold text-[16px] text-[#171717]">{c.name}</div>
                    <div className="text-[13px] text-[#737373]">{c.goal}</div>
                  </td>
                  <td className="py-4 px-4 font-semibold">
                    {c.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : c.brandId} · {c.channel}
                  </td>
                  <td className="py-4 px-4 text-[#737373]">{c.periodLabel}</td>
                  <td className="py-4 px-4 text-right font-semibold">
                    {hasFinance ? formatCurrencyRub(c.plannedBudgetRub) : 'Скрыто'}
                  </td>
                  <td className="py-4 px-4 text-right">
                    {hasFinance ? formatCurrencyRub(c.plannedRevenueRub) : 'Скрыто'}
                  </td>
                  <td className="py-4 px-4 text-right font-semibold">
                    {c.actualRevenueRub !== null ? (
                      formatCurrencyRub(c.actualRevenueRub)
                    ) : (
                      <span className="text-[#737373]">Нет данных</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right font-bold">
                    {c.metrics.roas !== null && c.metrics.roas !== undefined ? (
                      <span className="text-[#16805D]">
                        {c.metrics.roas}x ({c.metrics.drrPct}% ДРР)
                      </span>
                    ) : (
                      <span className="text-[#737373]">Нет данных</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Вкладка 2: Тесты гипотез */}
      {tab === 'experiments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredExperiments.map((exp) => (
            <div
              key={exp.id}
              className="bg-white rounded-2xl border border-[#E8E8E5] p-7 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#E8E8E5] pb-3 text-[13px]">
                  <span className="font-semibold text-[#737373]">
                    {exp.brandId === 'NA_TELE' ? 'НА ТЕЛЕ' : exp.brandId} · {exp.timeframe}
                  </span>
                  <span className="font-semibold px-2.5 py-0.5 rounded-lg bg-[#F7F7F5] border border-[#E8E8E5]">
                    {EXPERIMENT_STATUS_LABELS_RU[exp.status]}
                  </span>
                </div>

                <h3 className="text-[20px] font-bold text-[#171717]">{exp.hypothesis}</h3>
                <p className="text-[15px] text-[#737373] leading-relaxed">{exp.rationale}</p>
              </div>

              <div className="pt-4 border-t border-[#E8E8E5] space-y-2 text-[14px]">
                <div className="flex justify-between">
                  <span className="text-[#737373]">Критерий успеха:</span>
                  <b className="text-[#171717]">{exp.successCriteria}</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#737373]">Итог и решение:</span>
                  <b className="text-[#16805D]">{exp.resultSummary || exp.decision}</b>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно новой кампании */}
      {campModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-[#E8E8E5] p-8 space-y-5 shadow-2xl">
            <h3 className="text-[22px] font-bold border-b border-[#E8E8E5] pb-4">
              Новая маркетинговая кампания
            </h3>
            <div className="space-y-4 text-[14px]">
              <div>
                <label className="block font-semibold mb-1.5">Название кампании</label>
                <input
                  value={campForm.name}
                  onChange={(e) => setCampForm({ ...campForm, name: e.target.value })}
                  className="w-full h-11 rounded-xl border border-[#E8E8E5] px-3.5 text-[15px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1.5">Бренд</label>
                  <select
                    value={campForm.brandId}
                    onChange={(e) => setCampForm({ ...campForm, brandId: e.target.value })}
                    className="w-full h-11 rounded-xl border border-[#E8E8E5] px-3.5 text-[15px] bg-white font-medium"
                  >
                    <option value="BORNERS">BORNERS</option>
                    <option value="NA_TELE">НА ТЕЛЕ</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1.5">План бюджета (₽)</label>
                  <input
                    type="number"
                    value={campForm.plannedBudgetRub}
                    onChange={(e) =>
                      setCampForm({ ...campForm, plannedBudgetRub: e.target.value })
                    }
                    className="w-full h-11 rounded-xl border border-[#E8E8E5] px-3.5 text-[15px]"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-[#E8E8E5]">
              <button
                onClick={() => setCampModalOpen(false)}
                className="h-11 px-5 rounded-xl border border-[#E8E8E5] text-[14px] font-semibold cursor-pointer"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  if (!campForm.name.trim()) return;
                  createCampaign({
                    name: campForm.name.trim(),
                    brandId: campForm.brandId,
                    channel: campForm.channel,
                    goal: campForm.goal,
                    productIds: [],
                    periodLabel: campForm.periodLabel,
                    plannedBudgetRub: Number(campForm.plannedBudgetRub) || 400000,
                    actualBudgetRub: null,
                    plannedRevenueRub: Number(campForm.plannedRevenueRub) || 2800000,
                    actualRevenueRub: null,
                    ownerId: currentUser.id,
                    status: 'Запланирована',
                    metrics: {},
                  });
                  setCampModalOpen(false);
                }}
                className="h-11 px-6 rounded-xl bg-[#111111] text-white text-[14px] font-semibold cursor-pointer"
              >
                Создать кампанию
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно новой гипотезы */}
      {expModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-[#E8E8E5] p-8 space-y-5 shadow-2xl">
            <h3 className="text-[22px] font-bold border-b border-[#E8E8E5] pb-4">
              Запуск маркетингового теста
            </h3>
            <div className="space-y-4 text-[14px]">
              <div>
                <label className="block font-semibold mb-1.5">Формулировка гипотезы</label>
                <input
                  value={expForm.hypothesis}
                  onChange={(e) => setExpForm({ ...expForm, hypothesis: e.target.value })}
                  className="w-full h-11 rounded-xl border border-[#E8E8E5] px-3.5 text-[15px]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1.5">Обоснование и механика</label>
                <textarea
                  rows={3}
                  value={expForm.rationale}
                  onChange={(e) => setExpForm({ ...expForm, rationale: e.target.value })}
                  className="w-full rounded-xl border border-[#E8E8E5] p-3.5 text-[15px]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-[#E8E8E5]">
              <button
                onClick={() => setExpModalOpen(false)}
                className="h-11 px-5 rounded-xl border border-[#E8E8E5] text-[14px] font-semibold cursor-pointer"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  if (!expForm.hypothesis.trim()) return;
                  createExperiment({
                    brandId: expForm.brandId,
                    hypothesis: expForm.hypothesis.trim(),
                    rationale: expForm.rationale || 'Проверка влияния визуала на CTR',
                    budgetRub: Number(expForm.budgetRub) || 100000,
                    method: expForm.method,
                    successCriteria: expForm.successCriteria,
                    timeframe: 'Март 2027',
                    resultSummary: 'В очереди на запуск',
                    decision: 'Ожидает замеров',
                    status: 'Planned',
                    ownerId: currentUser.id,
                  });
                  setExpModalOpen(false);
                }}
                className="h-11 px-6 rounded-xl bg-[#111111] text-white text-[14px] font-semibold cursor-pointer"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
