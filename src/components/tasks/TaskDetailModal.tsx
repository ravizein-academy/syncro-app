"use client";

import React, { useState } from "react";
import {
  X,
  Calendar,
  CheckCircle2,
  Clock,
  Flag,
  FileImage,
  ExternalLink,
  Trash2,
  Share2,
  MessageSquare,
  Printer,
} from "lucide-react";
import { TaskItem } from "./TaskCard";

interface TaskDetailModalProps {
  task: TaskItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (taskId: string, newStatus: "TODO" | "IN_PROGRESS" | "DONE") => void;
  onDeleteTask: (taskId: string) => void;
}

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  onUpdateStatus,
  onDeleteTask,
}: TaskDetailModalProps) {
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<
    { id: string; user: string; text: string; time: string }[]
  >([
    {
      id: "c-1",
      user: "Ravi Zein",
      text: "Tugas telah sinkron dengan Cloudflare Pages Edge dan Google Drive.",
      time: "10 menit lalu",
    },
  ]);

  if (!isOpen || !task) return null;

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setComments((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        user: "Ravi Zein",
        text: commentText,
        time: "Baru saja",
      },
    ]);
    setCommentText("");
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

  const pStyle = getPriorityStyle(task.priority);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in font-sans">
      <div className="w-full max-w-3xl bg-white dark:bg-[#282828] border border-slate-200 dark:border-[#383838] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        {/* ClickUp Task Header Bar */}
        <div className="p-3.5 sm:p-4 px-4 sm:px-6 border-b border-slate-200 dark:border-[#383838] flex items-center justify-between bg-slate-50/70 dark:bg-[#222222]">
          {/* Breadcrumb path */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium overflow-hidden">
            <span className="font-bold text-brand-600 dark:text-brand-400">ITSEC</span>
            <span>/</span>
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-semibold text-slate-700 dark:text-slate-300 bg-slate-200/80 dark:bg-slate-800/80 text-[11px]"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: task.project?.color || "#ee3726" }}
              />
              <span className="truncate max-w-[100px] sm:max-w-none">{task.project?.name || "General"}</span>
            </span>
            <span>/</span>
            <span className="font-mono text-slate-400 dark:text-slate-500 text-[11px]">
              {task.id.toUpperCase()}
            </span>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert("Tautan tugas berhasil disalin ke clipboard!");
              }}
              title="Salin Tautan Tugas"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:text-white dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.print()}
              title="Cetak Tugas Ini"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:text-white dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                onDeleteTask(task.id);
                onClose();
              }}
              title="Hapus Tugas"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/20 transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 mx-0.5 sm:mx-1" />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:text-white dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column: Title, Description, Attachments, Comments */}
          <div className="md:col-span-2 space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                {task.title}
              </h1>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Deskripsi
              </h3>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#383838] text-sm text-slate-700 dark:text-slate-300 leading-relaxed min-h-[90px] whitespace-pre-wrap">
                {task.description || "Tidak ada deskripsi yang ditambahkan untuk tugas ini."}
              </div>
            </div>

            {/* Google Drive Media Attachments */}
            {task.mediaUrls && task.mediaUrls.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1.5">
                  <FileImage className="w-3.5 h-3.5 text-brand-500" />
                  <span>Lampiran Google Drive ({task.mediaUrls.length})</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {task.mediaUrls.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#1e1e1e] dark:hover:bg-[#252525] border border-slate-200 dark:border-[#383838] group transition shadow-sm"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0">
                          <FileImage className="w-4 h-4" />
                        </div>
                        <div className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-brand-500">
                          Berkas Media #{i + 1}
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-500 shrink-0 ml-2" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Activity & Comment Section (ClickUp style) */}
            <div className="pt-4 border-t border-slate-200 dark:border-[#333333]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Aktivitas & Diskusi</span>
              </h3>

              {/* Comments list */}
              <div className="space-y-3 mb-4">
                {comments.map((c) => (
                  <div key={c.id} className="flex items-start gap-2.5 text-xs">
                    <div className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      {c.user.charAt(0)}
                    </div>
                    <div className="flex-1 bg-slate-50 dark:bg-[#1e1e1e] p-3 rounded-xl border border-slate-200 dark:border-[#383838]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {c.user}
                        </span>
                        <span className="text-[10px] text-slate-400">{c.time}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add comment input */}
              <form onSubmit={handleAddComment} className="flex items-center gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Tulis update atau catatan tim..."
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#383838] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Kirim
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Metadata Sidebar (Status, Assignee, Priority, Due Date) */}
          <div className="space-y-5 p-4 rounded-xl bg-slate-50/70 dark:bg-[#202020] border border-slate-200 dark:border-[#383838]">
            {/* Status Select */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Status
              </label>
              <select
                value={task.status}
                onChange={(e) =>
                  onUpdateStatus(
                    task.id,
                    e.target.value as "TODO" | "IN_PROGRESS" | "DONE"
                  )
                }
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-[#383838] bg-white dark:bg-[#1e1e1e] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer shadow-sm"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Completed</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Prioritas
              </label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#383838] text-xs font-bold">
                <Flag className={`w-4 h-4 ${pStyle.flag} fill-current`} />
                <span className={pStyle.color}>{pStyle.label}</span>
              </div>
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Penanggung Jawab (Assignee)
              </label>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#383838]">
                <img
                  src={
                    task.assignee?.image ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assignee?.email || "assignee"}`
                  }
                  alt="Assignee"
                  className="w-6 h-6 rounded-full border border-slate-200 dark:border-[#383838] object-cover"
                />
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {task.assignee?.name || "Unassigned"}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate font-mono">
                    {task.assignee?.email || "Belum ditugaskan"}
                  </div>
                </div>
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Batas Waktu (Due Date)
              </label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#383838] text-xs font-medium text-slate-700 dark:text-slate-300">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString("id-ID", {
                        weekday: "short",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "Tidak ada tenggat waktu"}
                </span>
              </div>
            </div>

            {/* ClickUp Quick Completion Button */}
            <div className="pt-2">
              {task.status !== "DONE" ? (
                <button
                  onClick={() => onUpdateStatus(task.id, "DONE")}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md shadow-emerald-600/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tandai Selesai</span>
                </button>
              ) : (
                <button
                  onClick={() => onUpdateStatus(task.id, "IN_PROGRESS")}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
                >
                  <Clock className="w-4 h-4" />
                  <span>Buka Kembali Tugas</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
