"use client";

import React, { useState } from "react";
import { CircleDot, Clock, CheckCircle2, Plus, MoreHorizontal, Layers } from "lucide-react";
import { TaskCard, TaskItem } from "./TaskCard";

interface KanbanBoardProps {
  tasks: TaskItem[];
  onUpdateStatus: (taskId: string, newStatus: "TODO" | "IN_PROGRESS" | "DONE") => void;
  onDeleteTask: (taskId: string) => void;
  onOpenCreateTaskWithStatus: (status: "TODO" | "IN_PROGRESS" | "DONE") => void;
  onOpenTaskDetail?: (task: TaskItem) => void;
}

const COLUMNS: {
  id: "TODO" | "IN_PROGRESS" | "DONE";
  title: string;
  icon: any;
  color: string;
  badgeBg: string;
}[] = [
  {
    id: "TODO",
    title: "TO DO",
    icon: CircleDot,
    color: "text-sky-500",
    badgeBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  },
  {
    id: "IN_PROGRESS",
    title: "IN PROGRESS",
    icon: Clock,
    color: "text-amber-500",
    badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  {
    id: "DONE",
    title: "COMPLETE",
    icon: CheckCircle2,
    color: "text-emerald-500",
    badgeBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
];

export function KanbanBoard({
  tasks,
  onUpdateStatus,
  onDeleteTask,
  onOpenCreateTaskWithStatus,
  onOpenTaskDetail,
}: KanbanBoardProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [activeDropColumn, setActiveDropColumn] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"ALL" | "TODO" | "IN_PROGRESS" | "DONE">("ALL");

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    setDraggedTaskId(id);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (activeDropColumn !== columnId) {
      setActiveDropColumn(columnId);
    }
  };

  const handleDragLeave = () => {
    setActiveDropColumn(null);
  };

  const handleDrop = (e: React.DragEvent, columnId: "TODO" | "IN_PROGRESS" | "DONE") => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    setActiveDropColumn(null);
    setDraggedTaskId(null);

    if (taskId) {
      onUpdateStatus(taskId, columnId);
    }
  };

  // Filter columns for mobile tab selection
  const visibleColumns = COLUMNS.filter((col) => {
    if (mobileTab === "ALL") return true;
    return col.id === mobileTab;
  });

  return (
    <div className="flex-1 overflow-x-auto p-3 sm:p-4 md:p-6 bg-[#f8fafc] dark:bg-[#222222] font-sans transition-colors flex flex-col">
      {/* Mobile & Tablet Tab Status Switcher (di bawah lg) */}
      <div className="flex lg:hidden items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-[#282828] border border-slate-200 dark:border-[#383838] mb-3 overflow-x-auto no-scrollbar shadow-xs shrink-0">
        <button
          onClick={() => setMobileTab("ALL")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 ${
            mobileTab === "ALL"
              ? "bg-slate-900 text-white dark:bg-white dark:text-black shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Semua Status ({tasks.length})</span>
        </button>

        {COLUMNS.map((col) => {
          const count = tasks.filter((t) => t.status === col.id).length;
          const isActive = mobileTab === col.id;
          return (
            <button
              key={col.id}
              onClick={() => setMobileTab(col.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 ${
                isActive
                  ? "bg-brand-500 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  col.id === "TODO"
                    ? "bg-sky-400"
                    : col.id === "IN_PROGRESS"
                    ? "bg-amber-400"
                    : "bg-emerald-400"
                }`}
              />
              <span>{col.title} ({count})</span>
            </button>
          );
        })}
      </div>

      {/* Kanban Columns Grid / Swipeable Carousel */}
      <div
        className={`flex-1 ${
          mobileTab === "ALL"
            ? "flex lg:grid lg:grid-cols-3 gap-3.5 sm:gap-5 min-w-full lg:min-w-0 pb-4 snap-x snap-mandatory overflow-x-auto no-scrollbar"
            : "grid grid-cols-1 gap-3.5 pb-4"
        }`}
      >
        {visibleColumns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          const isDragOver = activeDropColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`w-[85vw] sm:w-[340px] lg:w-auto shrink-0 snap-center flex flex-col rounded-2xl bg-white dark:bg-[#282828] border border-slate-200 dark:border-[#383838] overflow-hidden transition-all duration-200 min-h-[500px] md:min-h-[550px] shadow-xs ${
                isDragOver ? "ring-2 ring-brand-500/60 bg-brand-50/30 dark:bg-[#303030]" : ""
              }`}
            >
              {/* ClickUp Column Header */}
              <div className="p-3.5 px-4 flex items-center justify-between border-b border-slate-100 dark:border-[#333333]">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-sm ${
                      col.id === "TODO"
                        ? "bg-sky-500"
                        : col.id === "IN_PROGRESS"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                  />
                  <h3 className="text-xs font-black text-slate-800 dark:text-white tracking-wider uppercase">
                    {col.title}
                  </h3>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${col.badgeBg}`}
                  >
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onOpenCreateTaskWithStatus(col.id)}
                    title={`Tambah tugas ke ${col.title}`}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#333333] transition-all duration-200 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => alert(`Opsi kolom ${col.title}`)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#333333] transition-all duration-200 cursor-pointer"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Task list container */}
              <div className="flex-1 p-3 space-y-2.5 overflow-y-auto max-h-[calc(100vh-230px)]">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className="cursor-grab active:cursor-grabbing transition-transform active:scale-[0.99]"
                  >
                    <TaskCard
                      task={task}
                      onUpdateStatus={onUpdateStatus}
                      onDeleteTask={onDeleteTask}
                      onOpenDetail={onOpenTaskDetail}
                    />
                  </div>
                ))}

                {/* Empty State */}
                {colTasks.length === 0 && (
                  <div className="py-12 px-4 text-center border-2 border-dashed border-slate-200 dark:border-[#383838] rounded-2xl">
                    <p className="text-xs text-slate-400 font-medium">
                      Belum ada tugas di kolom {col.title}
                    </p>
                  </div>
                )}
              </div>

              {/* ClickUp Quick Add Button at bottom of column */}
              <div className="p-3 pt-1.5 bg-white dark:bg-[#282828] border-t border-slate-100 dark:border-[#303030]">
                <button
                  onClick={() => onOpenCreateTaskWithStatus(col.id)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-white border border-dashed border-slate-200 dark:border-[#3a3a3a] hover:border-brand-500/70 dark:hover:border-brand-500/70 hover:bg-brand-50/50 dark:hover:bg-brand-500/10 transition-all duration-200 cursor-pointer group shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 group-hover:text-brand-500 transition-colors" />
                  <span>Tambah Tugas Baru</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
