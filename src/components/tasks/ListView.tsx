"use client";

import React, { useState } from "react";
import {
  Calendar,
  Trash2,
  CheckCircle2,
  Clock,
  CircleDot,
  Flag,
  Plus,
  ChevronDown,
  FileImage,
} from "lucide-react";
import { TaskItem } from "./TaskCard";

interface ListViewProps {
  tasks: TaskItem[];
  onUpdateStatus: (taskId: string, newStatus: "TODO" | "IN_PROGRESS" | "DONE") => void;
  onDeleteTask: (taskId: string) => void;
  onOpenTaskDetail?: (task: TaskItem) => void;
  onQuickCreateTask?: (title: string, status: "TODO" | "IN_PROGRESS" | "DONE") => void;
}

interface StatusGroupConfig {
  id: "TODO" | "IN_PROGRESS" | "DONE";
  title: string;
  icon: any;
  color: string;
  badgeBg: string;
  borderAccent: string;
}

const STATUS_GROUPS: StatusGroupConfig[] = [
  {
    id: "TODO",
    title: "TO DO",
    icon: CircleDot,
    color: "text-sky-500",
    badgeBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    borderAccent: "bg-sky-500",
  },
  {
    id: "IN_PROGRESS",
    title: "IN PROGRESS",
    icon: Clock,
    color: "text-amber-500",
    badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    borderAccent: "bg-amber-500",
  },
  {
    id: "DONE",
    title: "COMPLETE",
    icon: CheckCircle2,
    color: "text-emerald-500",
    badgeBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    borderAccent: "bg-emerald-500",
  },
];

export function ListView({
  tasks,
  onUpdateStatus,
  onDeleteTask,
  onOpenTaskDetail,
  onQuickCreateTask,
}: ListViewProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [quickInputText, setQuickInputText] = useState<Record<string, string>>({});

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return { color: "text-rose-500", label: "Urgent", flag: "text-rose-500" };
      case "HIGH":
        return { color: "text-amber-500", label: "Tinggi", flag: "text-amber-500" };
      case "MEDIUM":
        return { color: "text-sky-500", label: "Normal", flag: "text-sky-500" };
      default:
        return { color: "text-slate-400", label: "Rendah", flag: "text-slate-400" };
    }
  };

  const handleStatusChange = async (
    taskId: string,
    currentStatus: string,
    newStatus: "TODO" | "IN_PROGRESS" | "DONE"
  ) => {
    if (newStatus === "DONE" && currentStatus !== "DONE") {
      try {
        const confetti = (await import("canvas-confetti")).default;
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#ee3726", "#10b981", "#0ea5e9"],
        });
      } catch (e) {
        // Safe fallback
      }
    }
    onUpdateStatus(taskId, newStatus);
  };

  const handleQuickAdd = (status: "TODO" | "IN_PROGRESS" | "DONE") => {
    const text = quickInputText[status]?.trim();
    if (!text) return;
    if (onQuickCreateTask) {
      onQuickCreateTask(text, status);
    }
    setQuickInputText((prev) => ({ ...prev, [status]: "" }));
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-[#f8fafc] dark:bg-[#222222] font-sans transition-colors">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {STATUS_GROUPS.map((group) => {
          const groupTasks = tasks.filter((t) => t.status === group.id);
          const isCollapsed = collapsedGroups[group.id];

          return (
            <div
              key={group.id}
              className="rounded-2xl border border-slate-200 dark:border-[#383838] bg-white dark:bg-[#282828] overflow-hidden shadow-xs"
            >
              {/* ClickUp Status Group Header Bar */}
              <div
                onClick={() => toggleGroup(group.id)}
                className="px-4 py-3 flex items-center justify-between bg-slate-50/80 dark:bg-[#242424] border-b border-slate-200/80 dark:border-[#333333] cursor-pointer select-none group"
              >
                <div className="flex items-center gap-2.5">
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform ${
                      isCollapsed ? "-rotate-90" : ""
                    }`}
                  />
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-sm ${group.borderAccent}`}
                    />
                    <h3 className="text-xs font-black tracking-wider uppercase text-slate-900 dark:text-white">
                      {group.title}
                    </h3>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.2 rounded-full border ${group.badgeBg}`}
                    >
                      {groupTasks.length}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
                  {isCollapsed ? "Klik untuk memperluas" : "Klik untuk menciutkan"}
                </div>
              </div>

              {/* Group Tasks Table */}
              {!isCollapsed && (
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-[#333333] text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-400 bg-slate-50/30 dark:bg-[#222222]">
                        <th className="py-2.5 px-4 w-8"></th>
                        <th className="py-2.5 px-4">Nama Tugas</th>
                        <th className="py-2.5 px-4">Space / Project</th>
                        <th className="py-2.5 px-4">Assignee</th>
                        <th className="py-2.5 px-4">Batas Waktu</th>
                        <th className="py-2.5 px-4">Prioritas</th>
                        <th className="py-2.5 px-4">Drive Media</th>
                        <th className="py-2.5 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#333333]">
                      {groupTasks.map((task) => {
                        const priorityInfo = getPriorityStyle(task.priority);
                        const isDone = task.status === "DONE";

                        return (
                          <tr
                            key={task.id}
                            onClick={() => onOpenTaskDetail && onOpenTaskDetail(task)}
                            className="hover:bg-slate-50/90 dark:hover:bg-[#202020] transition-colors group cursor-pointer"
                          >
                            {/* Checkbox toggle */}
                            <td
                              className="py-3 px-4 w-8"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() =>
                                  handleStatusChange(
                                    task.id,
                                    task.status,
                                    isDone ? "TODO" : "DONE"
                                  )
                                }
                                title={
                                  isDone
                                    ? "Tandai belum selesai"
                                    : "Tandai selesai (Confetti)"
                                }
                                className={`w-4 h-4 rounded-md border flex items-center justify-center transition ${
                                  isDone
                                    ? "bg-emerald-500 border-emerald-500 text-white"
                                    : "border-slate-300 dark:border-[#444444] hover:border-brand-500"
                                }`}
                              >
                                {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                              </button>
                            </td>

                            {/* Title & Description */}
                            <td className="py-3 px-4 max-w-sm">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-semibold text-slate-900 dark:text-white transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-400 ${
                                    isDone
                                      ? "line-through text-slate-400 dark:text-slate-500"
                                      : ""
                                  }`}
                                >
                                  {task.title}
                                </span>
                              </div>
                              {task.description && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 max-w-xs">
                                  {task.description}
                                </p>
                              )}
                            </td>

                            {/* Project Space */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#383838] text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{
                                    backgroundColor: task.project?.color || "#ee3726",
                                  }}
                                />
                                <span>{task.project?.name || "General"}</span>
                              </span>
                            </td>

                            {/* Assignee */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <img
                                  src={
                                    task.assignee?.image ||
                                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assignee?.email || "user"}`
                                  }
                                  alt="Avatar"
                                  className="w-5 h-5 rounded-full border border-slate-200 dark:border-[#383838] object-cover"
                                />
                                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                                  {task.assignee?.name || "Unassigned"}
                                </span>
                              </div>
                            </td>

                            {/* Due Date */}
                            <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400 font-medium">
                              {task.dueDate ? (
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  <span>
                                    {new Date(task.dueDate).toLocaleDateString("id-ID", {
                                      day: "numeric",
                                      month: "short",
                                    })}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-300 dark:text-slate-700">-</span>
                              )}
                            </td>

                            {/* Priority Flag (ClickUp Style) */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 font-bold text-xs">
                                <Flag
                                  className={`w-3.5 h-3.5 ${priorityInfo.flag} fill-current`}
                                />
                                <span className={priorityInfo.color}>
                                  {priorityInfo.label}
                                </span>
                              </div>
                            </td>

                            {/* Google Drive Media */}
                            <td
                              className="py-3 px-4 whitespace-nowrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {task.mediaUrls && task.mediaUrls.length > 0 ? (
                                <div className="flex items-center gap-1.5">
                                  {task.mediaUrls.map((url, i) => (
                                    <a
                                      key={i}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1 rounded-md bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/70 dark:hover:bg-brand-900 text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-500/30 transition"
                                      title="Buka di Google Drive"
                                    >
                                      <FileImage className="w-3.5 h-3.5 text-brand-500" />
                                    </a>
                                  ))}
                                  <span className="text-[11px] text-slate-500 font-medium">
                                    {task.mediaUrls.length} berkas
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-300 dark:text-slate-700">-</span>
                              )}
                            </td>

                            {/* Actions */}
                            <td
                              className="py-3 px-4 whitespace-nowrap text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => onDeleteTask(task.id)}
                                title="Hapus Tugas"
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {/* Empty Status Row */}
                      {groupTasks.length === 0 && (
                        <tr>
                          <td
                            colSpan={8}
                            className="py-6 text-center text-xs text-slate-400 dark:text-slate-600"
                          >
                            Tidak ada tugas di grup {group.title}.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* ClickUp Inline Quick Task Input Row */}
                  <div className="p-2.5 px-4 bg-slate-50/50 dark:bg-[#252525] border-t border-slate-100 dark:border-[#333333] flex items-center gap-2">
                    <Plus className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={quickInputText[group.id] || ""}
                      onChange={(e) =>
                        setQuickInputText((prev) => ({
                          ...prev,
                          [group.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleQuickAdd(group.id);
                      }}
                      placeholder={`+ Tambah tugas baru di ${group.title}... (Tekan Enter)`}
                      className="w-full bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                    />
                    {quickInputText[group.id]?.trim() && (
                      <button
                        onClick={() => handleQuickAdd(group.id)}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition shrink-0"
                      >
                        Simpan
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
