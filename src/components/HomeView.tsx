'use client';

import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { Task, TaskPriority, TaskStatus, MyTasksFilter } from '../types';
import {
  Plus,
  CheckCircle2,
  Clock,
  Calendar,
  LayoutGrid,
  List as ListIcon,
  Check,
  Flag,
  Paperclip,
  MessageSquare
} from 'lucide-react';
import { formatMinutes } from '../lib/utils';
import confetti from 'canvas-confetti';

interface HomeViewProps {
  onSelectTask: (taskId: string) => void;
  onOpenCreateTask: () => void;
}

export function HomeView({ onSelectTask, onOpenCreateTask }: HomeViewProps) {
  const {
    tasks,
    currentUser,
    users,
    spaces,
    activeSpaceId,
    myTasksFilter,
    setMyTasksFilter,
    searchQuery,
    moveTaskStatus,
    startTimer,
    activeTimer,
    addTask
  } = useAppStore();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [inlineTitle, setInlineTitle] = useState('');
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  const [todayStr, setTodayStr] = useState<string>('');

  React.useEffect(() => {
    setTodayStr(new Date().toISOString().substring(0, 10));
  }, []);

  // Filter tasks based on Space, Search, and My Tasks subfilters
  const filteredTasks = tasks.filter((task) => {
    if (activeSpaceId !== 'space_all' && task.spaceId !== activeSpaceId) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchTag = task.tags?.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTag) return false;
    }

    if (myTasksFilter === 'assigned_to_me') {
      return task.assignedTo === currentUser.id;
    }
    if (myTasksFilter === 'today_overdue') {
      return task.dueDate && todayStr && task.dueDate <= todayStr && task.status !== 'done';
    }
    if (myTasksFilter === 'personal') {
      return task.assignedTo === currentUser.id && task.spaceId === 'space_all';
    }

    return true;
  });

  const columns: { status: TaskStatus; label: string; headerBg: string; textCol: string; borderCol: string }[] = [
    { status: 'todo', label: 'TO DO', headerBg: 'bg-slate-100', textCol: 'text-slate-700', borderCol: 'border-slate-300' },
    { status: 'in_progress', label: 'IN PROGRESS', headerBg: 'bg-blue-50', textCol: 'text-blue-700', borderCol: 'border-blue-300' },
    { status: 'review', label: 'IN REVIEW', headerBg: 'bg-amber-50', textCol: 'text-amber-700', borderCol: 'border-amber-300' },
    { status: 'done', label: 'COMPLETE', headerBg: 'bg-emerald-50', textCol: 'text-emerald-700', borderCol: 'border-emerald-300' }
  ];

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggingTaskId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    if (taskId) {
      moveTaskStatus(taskId, status);
      if (status === 'done') {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 }
        });
      }
    }
    setDraggingTaskId(null);
  };

  const handleInlineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineTitle.trim()) return;
    addTask({
      title: inlineTitle.trim(),
      status: 'todo',
      priority: 'medium',
      assignedTo: currentUser.id
    });
    setInlineTitle('');
  };

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'urgent':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-[#ee3425] bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
            <Flag className="w-3 h-3 text-[#ee3425] fill-[#ee3425]" /> Urgent
          </span>
        );
      case 'high':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
            <Flag className="w-3 h-3 text-amber-600 fill-amber-600" /> High
          </span>
        );
      case 'medium':
        return (
          <span className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
            <Flag className="w-3 h-3 text-blue-600 fill-blue-600" /> Normal
          </span>
        );
      case 'low':
        return (
          <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
            <Flag className="w-3 h-3 text-slate-400" /> Low
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* ClickUp Control Bar */}
      <div className="px-6 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white">
        {/* ClickUp View Mode Tabs */}
        <div className="flex items-center gap-6 text-xs font-semibold">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-1.5 py-2 border-b-2 transition cursor-pointer ${
              viewMode === 'kanban'
                ? 'border-[#ee3425] text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Board</span>
          </button>

          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 py-2 border-b-2 transition cursor-pointer ${
              viewMode === 'list'
                ? 'border-[#ee3425] text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ListIcon className="w-3.5 h-3.5" />
            <span>List</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs">
          {(
            [
              { key: 'all', label: 'Semua Tugas' },
              { key: 'assigned_to_me', label: 'Assigned to me' },
              { key: 'today_overdue', label: 'Today & Overdue' },
              { key: 'personal', label: 'Personal List' }
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMyTasksFilter(tab.key)}
              className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                myTasksFilter === tab.key
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={onOpenCreateTask}
          className="flex items-center gap-1 bg-[#ee3425] hover:bg-[#d6281a] text-white font-semibold text-xs px-3 py-1.5 rounded-lg shadow-xs shadow-red-500/20 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Tugas</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-x-auto overflow-y-auto p-6">
        {viewMode === 'kanban' ? (
          /* ClickUp Kanban Board View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start min-w-[960px] h-full">
            {columns.map((col) => {
              const colTasks = filteredTasks.filter((t) => t.status === col.status);

              return (
                <div
                  key={col.status}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.status)}
                  className="flex flex-col bg-slate-100/90 rounded-xl border border-slate-200/90 max-h-full shadow-2xs"
                >
                  {/* Column Header */}
                  <div className="p-3 border-b border-slate-200/70 flex items-center justify-between bg-white/70 rounded-t-xl">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${col.headerBg} ${col.textCol} border ${col.borderCol}`}>
                        {col.label}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold font-mono">
                        {colTasks.length}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        addTask({ status: col.status, assignedTo: currentUser.id });
                      }}
                      className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Tasks List in Column */}
                  <div className="p-2 space-y-2.5 overflow-y-auto flex-1 min-h-[300px]">
                    {colTasks.length === 0 ? (
                      <div className="border border-dashed border-slate-300 rounded-lg p-6 text-center text-slate-400 text-xs">
                        Tarik tugas ke sini
                      </div>
                    ) : (
                      colTasks.map((task) => {
                        const assignee = users.find((u) => u.id === task.assignedTo);
                        const space = spaces.find((s) => s.id === task.spaceId);
                        const completedSubtasks = (task.subtasks || []).filter((s) => s.completed).length;
                        const totalSubtasks = (task.subtasks || []).length;
                        const isTimerActive = activeTimer?.taskId === task.id;

                        return (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            onClick={() => onSelectTask(task.id)}
                            className="bg-white hover:bg-slate-50/50 border border-slate-200/90 hover:border-[#ee3425]/50 p-3.5 rounded-lg shadow-xs hover:shadow-md cursor-grab active:cursor-grabbing transition group select-none relative"
                          >
                            {/* Space label & Priority */}
                            <div className="flex items-center justify-between gap-2 mb-2">
                              {space && (
                                <span
                                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded truncate max-w-[140px]"
                                  style={{
                                    backgroundColor: `${space.color || '#ee3425'}15`,
                                    color: space.color || '#ee3425',
                                    border: `1px solid ${space.color || '#ee3425'}30`
                                  }}
                                >
                                  {space.name}
                                </span>
                              )}
                              {getPriorityBadge(task.priority)}
                            </div>

                            {/* Title */}
                            <h4
                              className={`text-xs font-semibold text-slate-800 group-hover:text-[#ee3425] transition line-clamp-2 ${
                                task.status === 'done' ? 'line-through text-slate-400' : ''
                              }`}
                            >
                              {task.title}
                            </h4>

                            {/* Subtasks Progress */}
                            {totalSubtasks > 0 && (
                              <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-slate-500">
                                <CheckCircle2 className="w-3 h-3 text-[#ee3425]" />
                                <span>
                                  {completedSubtasks}/{totalSubtasks} Subtask
                                </span>
                                <div className="flex-1 bg-slate-100 h-1 rounded-full overflow-hidden">
                                  <div
                                    className="bg-[#ee3425] h-full rounded-full"
                                    style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Card Footer: Due Date, Time, Assignee */}
                            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                              <div className="flex items-center gap-2">
                                {task.dueDate && (
                                  <span className="flex items-center gap-1 text-[10px] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                    <Calendar className="w-3 h-3 text-slate-400" />
                                    {task.dueDate.substring(5)}
                                  </span>
                                )}

                                {(task.attachments?.length || 0) > 0 && (
                                  <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                    <Paperclip className="w-3 h-3 text-slate-400" />
                                    {task.attachments?.length}
                                  </span>
                                )}

                                {(task.comments?.length || 0) > 0 && (
                                  <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                    <MessageSquare className="w-3 h-3 text-slate-400" />
                                    {task.comments?.length}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5">
                                {assignee && (
                                  <img
                                    src={assignee.avatar}
                                    alt={assignee.name}
                                    title={assignee.name}
                                    className="w-5 h-5 rounded-full object-cover border border-slate-200"
                                  />
                                )}
                              </div>
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
        ) : (
          /* ClickUp List View */
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-3 px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <div className="col-span-5">Nama Tugas</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Prioritas</div>
              <div className="col-span-2">Jatuh Tempo</div>
              <div className="col-span-1 text-right">Assignee</div>
            </div>

            {/* Inline Quick Add Row */}
            <form onSubmit={handleInlineSubmit} className="flex items-center border-b border-slate-200 px-4 py-2 bg-slate-50/50">
              <Plus className="w-4 h-4 text-[#ee3425] mr-2 shrink-0" />
              <input
                type="text"
                value={inlineTitle}
                onChange={(e) => setInlineTitle(e.target.value)}
                placeholder="+ Tambah tugas baru cepat (tekan Enter)..."
                className="w-full bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
              />
            </form>

            {/* List Rows */}
            <div className="divide-y divide-slate-100">
              {filteredTasks.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Tidak ada tugas yang sesuai filter.
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const assignee = users.find((u) => u.id === task.assignedTo);
                  const space = spaces.find((s) => s.id === task.spaceId);

                  return (
                    <div
                      key={task.id}
                      onClick={() => onSelectTask(task.id)}
                      className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-slate-50 cursor-pointer transition group"
                    >
                      <div className="col-span-5 flex items-center gap-2.5 min-w-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const newStatus = task.status === 'done' ? 'todo' : 'done';
                            moveTaskStatus(task.id, newStatus);
                            if (newStatus === 'done') {
                              confetti({ particleCount: 50, spread: 50 });
                            }
                          }}
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition ${
                            task.status === 'done'
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : 'border-slate-300 hover:border-[#ee3425]'
                          }`}
                        >
                          {task.status === 'done' && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>

                        <div className="min-w-0 truncate">
                          <p
                            className={`text-xs font-semibold text-slate-800 truncate group-hover:text-[#ee3425] ${
                              task.status === 'done' ? 'line-through text-slate-400' : ''
                            }`}
                          >
                            {task.title}
                          </p>
                          {space && (
                            <span className="text-[10px] text-slate-400 truncate">
                              {space.name}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="col-span-2">
                        <span className="text-[11px] capitalize px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-medium">
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="col-span-2">{getPriorityBadge(task.priority)}</div>

                      <div className="col-span-2 text-xs text-slate-600 flex items-center gap-2">
                        {task.dueDate && <span>{task.dueDate}</span>}
                      </div>

                      <div className="col-span-1 flex justify-end">
                        {assignee ? (
                          <img
                            src={assignee.avatar}
                            alt={assignee.name}
                            title={assignee.name}
                            className="w-6 h-6 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
