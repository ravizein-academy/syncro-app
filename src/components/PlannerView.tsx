'use client';

import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  CheckCircle2,
  X
} from 'lucide-react';
import { formatMinutes } from '../lib/utils';

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

interface PlannerViewProps {
  onSelectTask: (taskId: string) => void;
}

export function PlannerView({ onSelectTask }: PlannerViewProps) {
  const {
    tasks,
    selectedDate,
    setSelectedDate,
    calendarView,
    setCalendarView,
    scheduleTask,
    unscheduleTask,
    users
  } = useAppStore();

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const unscheduledTasks = tasks.filter((t) => !t.scheduledTime && t.status !== 'done');
  const scheduledTasks = tasks.filter((t) => t.scheduledTime && (t.dueDate === selectedDate || !t.dueDate));

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedTaskId(id);
  };

  const handleDropSlot = (e: React.DragEvent, timeSlot: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      scheduleTask(taskId, timeSlot, selectedDate);
    }
    setDraggedTaskId(null);
  };

  const handleUnschedule = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    unscheduleTask(taskId);
  };

  const changeDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().substring(0, 10));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Planner Top Controls */}
      <div className="px-6 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white">
        {/* Date Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5">
            <button
              onClick={() => changeDate(-1)}
              className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-white cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800 font-mono">
              {new Date(selectedDate).toLocaleDateString('id-ID', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </span>
            <button
              onClick={() => changeDate(1)}
              className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-white cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setSelectedDate(new Date().toISOString().substring(0, 10))}
            className="text-xs bg-white hover:bg-slate-50 text-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-200 font-medium transition cursor-pointer"
          >
            Hari Ini
          </button>
        </div>

        {/* View Mode Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            {(['day', 'week', 'month'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setCalendarView(v)}
                className={`px-3 py-1 rounded-md capitalize transition cursor-pointer ${
                  calendarView === v
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {v === 'day' ? 'Harian' : v === 'week' ? 'Mingguan' : 'Bulanan'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Unscheduled Left Panel + Calendar Timeline Right */}
      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        {/* Left Panel: Unscheduled Tasks Panel */}
        <div className="w-80 border border-slate-200 bg-white flex flex-col h-full shrink-0 shadow-sm rounded-xl overflow-hidden">
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#ee3425]" />
                Unscheduled Tasks
              </h3>
              <p className="text-[10px] text-slate-400">
                Tarik tugas ke slot jam kalender
              </p>
            </div>
            <span className="text-xs bg-red-50 text-[#ee3425] font-bold font-mono px-2 py-0.5 rounded-full border border-red-200">
              {unscheduledTasks.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {unscheduledTasks.length === 0 ? (
              <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">Semua tugas terjadwal!</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Seluruh tugas telah memiliki jadwal time blocking.
                </p>
              </div>
            ) : (
              unscheduledTasks.map((task) => {
                const assignee = users.find((u) => u.id === task.assignedTo);
                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => onSelectTask(task.id)}
                    className="p-3 bg-white hover:bg-slate-50/70 border border-slate-200 hover:border-[#ee3425]/50 rounded-lg shadow-2xs hover:shadow-sm cursor-grab active:cursor-grabbing transition group"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-4 h-4 text-slate-400 group-hover:text-[#ee3425] mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-slate-800 group-hover:text-[#ee3425] line-clamp-2">
                          {task.title}
                        </h4>

                        <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                            {formatMinutes(task.durationMinutes || 60)}
                          </span>

                          {assignee && (
                            <div className="flex items-center gap-1">
                              <img
                                src={assignee.avatar}
                                alt={assignee.name}
                                className="w-4 h-4 rounded-full object-cover"
                              />
                              <span className="truncate max-w-[80px]">{assignee.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Calendar Time Blocking Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="max-w-4xl mx-auto space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-bold text-slate-800">Agenda Waktu Kerja Syncro (08:00 - 18:00)</span>
              <span>Tarik tugas ke slot jam yang diinginkan</span>
            </div>

            {TIME_SLOTS.map((slot) => {
              const matchedTasks = scheduledTasks.filter((t) => t.scheduledTime === slot);

              return (
                <div
                  key={slot}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropSlot(e, slot)}
                  className="flex items-start gap-4 p-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition min-h-[72px] shadow-2xs"
                >
                  {/* Time label */}
                  <div className="w-16 shrink-0 pt-1 text-right">
                    <span className="font-mono text-xs font-bold text-[#ee3425]">{slot}</span>
                  </div>

                  {/* Drop zone / Matched Tasks */}
                  <div className="flex-1 flex flex-wrap gap-2 items-center">
                    {matchedTasks.length === 0 ? (
                      <div className="h-10 w-full border border-dashed border-slate-200 rounded-lg flex items-center justify-center text-[11px] text-slate-400 hover:border-[#ee3425]/40 transition">
                        Slot Kosong (Tarik tugas ke sini)
                      </div>
                    ) : (
                      matchedTasks.map((t) => {
                        return (
                          <div
                            key={t.id}
                            onClick={() => onSelectTask(t.id)}
                            className="flex-1 min-w-[280px] bg-red-50/60 border border-red-200 hover:border-[#ee3425] p-2.5 rounded-lg flex items-center justify-between gap-3 shadow-xs transition cursor-pointer group"
                          >
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-slate-900 group-hover:text-[#ee3425] truncate">
                                {t.title}
                              </h5>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                                <span className="bg-red-100 text-[#ee3425] px-1.5 py-0.5 rounded font-mono font-bold">
                                  {formatMinutes(t.durationMinutes)}
                                </span>
                                <span className="capitalize">{t.priority} priority</span>
                              </div>
                            </div>

                            {/* Action: Remove Schedule only */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={(e) => handleUnschedule(e, t.id)}
                                title="Hapus dari jadwal (Unschedule)"
                                className="p-1.5 rounded-md text-slate-400 hover:text-[#ee3425] hover:bg-red-100 transition cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
