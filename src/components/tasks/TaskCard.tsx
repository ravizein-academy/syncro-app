"use client";

import React from "react";
import {
  Calendar,
  Trash2,
  ExternalLink,
  FileImage,
  Flag,
} from "lucide-react";

export interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  mediaUrls: string[];
  dueDate?: string | null;
  projectId: string;
  assigneeId?: string | null;
  project?: { id: string; name: string; color?: string | null };
  assignee?: { id: string; name?: string | null; email: string; image?: string | null } | null;
  createdAt?: string;
}

interface TaskCardProps {
  task: TaskItem;
  onUpdateStatus: (taskId: string, newStatus: "TODO" | "IN_PROGRESS" | "DONE") => void;
  onDeleteTask: (taskId: string) => void;
  onOpenDetail?: (task: TaskItem) => void;
}

export function TaskCard({
  task,
  onUpdateStatus,
  onDeleteTask,
  onOpenDetail,
}: TaskCardProps) {
  // ClickUp Signature Priority Flags
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return {
          flagColor: "text-rose-500 fill-rose-500",
          textColor: "text-rose-600 dark:text-rose-400",
          label: "Urgent",
        };
      case "HIGH":
        return {
          flagColor: "text-amber-500 fill-amber-500",
          textColor: "text-amber-600 dark:text-amber-400",
          label: "Tinggi",
        };
      case "MEDIUM":
        return {
          flagColor: "text-sky-500 fill-sky-500",
          textColor: "text-sky-600 dark:text-sky-400",
          label: "Normal",
        };
      default:
        return {
          flagColor: "text-slate-400 fill-slate-400",
          textColor: "text-slate-500",
          label: "Rendah",
        };
    }
  };

  const pStyle = getPriorityStyle(task.priority);

  const handleStatusChange = async (newStatus: "TODO" | "IN_PROGRESS" | "DONE") => {
    if (newStatus === "DONE" && task.status !== "DONE") {
      try {
        const confetti = (await import("canvas-confetti")).default;
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ["#ee3726", "#10b981", "#0ea5e9", "#f59e0b"],
        });
      } catch (e) {
        // Safe fallback
      }
    }
    onUpdateStatus(task.id, newStatus);
  };

  return (
    <div
      onClick={() => onOpenDetail && onOpenDetail(task)}
      className="group relative p-3.5 rounded-2xl border border-slate-200 dark:border-[#383838] bg-white dark:bg-[#1e1e1e] hover:border-brand-500/60 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-2.5 cursor-pointer font-sans select-none"
    >
      {/* Top row: Project Space Tag & ClickUp Priority Flag */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: task.project?.color || "#ee3726" }}
          />
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[130px]">
            {task.project?.name || "General"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Priority flag */}
          <div
            className="flex items-center gap-1"
            title={`Prioritas: ${pStyle.label}`}
          >
            <Flag className={`w-3.5 h-3.5 ${pStyle.flagColor}`} />
          </div>

          {/* Quick delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteTask(task.id);
            }}
            title="Hapus Tugas"
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Task Title in Roboto */}
      <div>
        <h4 className="text-xs md:text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
          {task.title}
        </h4>
        {task.description && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* Google Drive Media Attachment Preview Pills */}
      {task.mediaUrls && task.mediaUrls.length > 0 && (
        <div className="pt-0.5">
          <div className="flex flex-wrap gap-1.5 items-center">
            {task.mediaUrls.map((url, idx) => (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/80 border border-brand-200 dark:border-brand-500/30 text-[10px] text-brand-700 dark:text-brand-300 font-medium transition"
                title="Buka lampiran di Google Drive"
              >
                <FileImage className="w-3 h-3 text-brand-500 shrink-0" />
                <span className="font-mono">Media #{idx + 1}</span>
                <ExternalLink className="w-2.5 h-2.5 text-brand-500/80 shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Footer: Due date & Assignee & Quick Status */}
      <div className="pt-2 border-t border-slate-100 dark:border-[#2e2e2e] flex items-center justify-between mt-auto">
        {/* Due date */}
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-medium">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>
            {task.dueDate
              ? new Date(task.dueDate).toLocaleDateString("id-ID", {
                  month: "short",
                  day: "numeric",
                })
              : "No date"}
          </span>
        </div>

        {/* Right: Quick status select + Assignee */}
        <div className="flex items-center gap-2">
          <select
            value={task.status}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) =>
              handleStatusChange(e.target.value as "TODO" | "IN_PROGRESS" | "DONE")
            }
            className="text-[10px] font-bold bg-slate-100 dark:bg-[#282828] hover:bg-slate-200 dark:hover:bg-[#333333] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#383838] rounded-md px-1.5 py-0.5 focus:outline-none cursor-pointer"
          >
            <option value="TODO" className="bg-white dark:bg-[#222222] text-slate-900 dark:text-white">To Do</option>
            <option value="IN_PROGRESS" className="bg-white dark:bg-[#222222] text-slate-900 dark:text-white">In Progress</option>
            <option value="DONE" className="bg-white dark:bg-[#222222] text-slate-900 dark:text-white">Complete</option>
          </select>

          {/* Assignee Avatar */}
          <div className="relative" title={task.assignee?.name || "Belum ditugaskan"}>
            <img
              src={
                task.assignee?.image ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assignee?.email || "assignee"}`
              }
              alt="Assignee"
              className="w-5 h-5 rounded-full border border-slate-200 dark:border-[#383838] object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
