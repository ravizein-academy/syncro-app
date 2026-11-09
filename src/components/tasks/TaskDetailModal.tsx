"use client";

import React, { useState, useRef } from "react";
import { useSession } from "next-auth/react";
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
  Eye,
  Download,
  AlertCircle,
  FolderOpen,
  Link as LinkIcon,
  Plus,
  Upload,
  Loader2,
  FileText,
  Sheet,
  Presentation,
} from "lucide-react";
import { TaskItem } from "./TaskCard";
import {
  identifyMediaLink,
  openMediaSafely,
  getSharedFolderAccountUrl,
  getSpaceDriveFolderUrl,
} from "@/lib/google-drive-client";

interface TaskDetailModalProps {
  task: TaskItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (taskId: string, newStatus: "TODO" | "IN_PROGRESS" | "DONE") => void;
  onDeleteTask: (taskId: string) => void;
  onCommentAdded?: (commentText: string, task: TaskItem) => void;
  onTaskUpdated?: (updatedTask: TaskItem) => void;
}

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  onUpdateStatus,
  onDeleteTask,
  onCommentAdded,
  onTaskUpdated,
}: TaskDetailModalProps) {
  const { data: session } = useSession();
  const userEmail = session?.user?.email || "";

  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<
    { id: string; user: string; text: string; time: string }[]
  >([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Attachment controls
  const [isAddingDriveLink, setIsAddingDriveLink] = useState(false);
  const [driveInputUrl, setDriveInputUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !task) return null;

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const text = commentText.trim();
    setComments((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        user: session?.user?.name || "Ravi Zein",
        text,
        time: "Baru saja",
      },
    ]);
    if (onCommentAdded) {
      onCommentAdded(text, task);
    }
    setCommentText("");
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return {
          flag: "text-rose-500 fill-rose-500",
          color: "text-rose-600 dark:text-rose-400",
          label: "Urgent",
        };
      case "HIGH":
        return {
          flag: "text-amber-500 fill-amber-500",
          color: "text-amber-600 dark:text-amber-400",
          label: "Tinggi",
        };
      case "MEDIUM":
        return {
          flag: "text-sky-500 fill-sky-500",
          color: "text-sky-600 dark:text-sky-400",
          label: "Sedang",
        };
      default:
        return {
          flag: "text-slate-400 fill-slate-400",
          color: "text-slate-500",
          label: "Rendah",
        };
    }
  };

  const pStyle = getPriorityStyle(task.priority);

  const spaceName = task.project?.name || "General";

  // Buka Folder Space spesifik di Google Drive (Syncro / Nama Space)
  const handleOpenSpaceFolder = () => {
    const targetUrl = getSpaceDriveFolderUrl(spaceName, userEmail);
    window.open(targetUrl, "_blank");
  };

  // Buka Folder Bersama Google Drive dengan akun email yang login
  const handleOpenSharedFolder = () => {
    const targetUrl = getSpaceDriveFolderUrl("Syncro", userEmail);
    window.open(targetUrl, "_blank");
  };

  // Tambah link Google Drive ke task
  const handleAddDriveLink = async () => {
    const trimmed = driveInputUrl.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      setUploadError("Tautan harus diawali dengan https:// atau http://");
      return;
    }

    const newMediaUrls = [...(task.mediaUrls || []), trimmed];
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaUrls: newMediaUrls }),
      });
      if (res.ok) {
        const updated = await res.json();
        if (onTaskUpdated) onTaskUpdated(updated);
        setDriveInputUrl("");
        setIsAddingDriveLink(false);
        setUploadError("");
      }
    } catch (err: any) {
      setUploadError(err.message || "Gagal melampirkan tautan");
    }
  };

  // Hapus lampiran dari task
  const handleRemoveMedia = async (index: number) => {
    const newMediaUrls = (task.mediaUrls || []).filter((_, i) => i !== index);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaUrls: newMediaUrls }),
      });
      if (res.ok) {
        const updated = await res.json();
        if (onTaskUpdated) onTaskUpdated(updated);
      }
    } catch (err) {
      console.error("Gagal menghapus lampiran:", err);
    }
  };

  // Upload file lokal langsung ke task
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("taskId", task.id);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengunggah file");
      }

      if (data.file?.webViewLink) {
        const newMediaUrls = [...(task.mediaUrls || []), data.file.webViewLink];
        if (onTaskUpdated) {
          onTaskUpdated({
            ...task,
            mediaUrls: newMediaUrls,
          });
        }
      }
    } catch (err: any) {
      setUploadError(err.message || "Gagal mengunggah file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[92vh] bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#2e2e2e] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
      >
        {/* Top Header / Breadcrumb */}
        <div className="px-6 py-3.5 border-b border-slate-200 dark:border-[#2e2e2e] flex items-center justify-between bg-slate-50/50 dark:bg-[#1a1a1a]">
          <div className="flex items-center gap-2 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: task.project?.color || "#ee3726" }}
            />
            <span className="font-semibold text-slate-600 dark:text-slate-400">
              {task.project?.name || "General"}
            </span>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="font-mono text-slate-400 text-[11px]">
              TASK-{task.id.slice(-5).toUpperCase()}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => window.print()}
              title="Cetak Dokumen Tiket"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-[#252525] transition"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert("Tautan tugas disalin ke papan klip!");
              }}
              title="Bagikan Tautan"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-[#252525] transition"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (confirm(`Yakin ingin menghapus tugas "${task.title}"?`)) {
                  onDeleteTask(task.id);
                  onClose();
                }
              }}
              title="Hapus Tugas"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-slate-200 dark:bg-[#2e2e2e] mx-1" />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252525] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Main Content (2-Column ClickUp Grid) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Task Title, Description, Attachments, Comments */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
                {task.title}
              </h1>
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                <span>Dibuat {new Date(task.createdAt || Date.now()).toLocaleDateString("id-ID")}</span>
              </div>
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

            {/* Media / Attachment Files & Google Drive Shared Folder */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <FolderOpen className="w-4 h-4 text-blue-500" />
                  <span>Lampiran & Google Drive ({task.mediaUrls?.length || 0})</span>
                </h3>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenSpaceFolder}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    title={`Buka Google Drive: Syncro / ${spaceName}`}
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-blue-500" />
                    <span>Drive: {spaceName}</span>
                    <ExternalLink className="w-3 h-3 opacity-80" />
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenSharedFolder}
                    className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Buka Folder Utama Syncro di Google Drive"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAddingDriveLink(!isAddingDriveLink)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#252525] dark:hover:bg-[#303030] text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Link Drive</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-2.5 py-1 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                  >
                    {isUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>Unggah</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Input Tempel Tautan Google Drive */}
              {isAddingDriveLink && (
                <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 flex items-center gap-2 animate-fade-in">
                  <div className="relative flex-1">
                    <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="url"
                      value={driveInputUrl}
                      onChange={(e) => setDriveInputUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddDriveLink();
                        }
                      }}
                      placeholder="Tempel tautan Google Drive / Folder Tim (https://drive.google.com/...)"
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#383838] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddDriveLink}
                    disabled={!driveInputUrl.trim()}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold disabled:opacity-50 transition cursor-pointer shrink-0"
                  >
                    + Lampirkan
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingDriveLink(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Upload Error Banner */}
              {uploadError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* List of Attachments */}
              {task.mediaUrls && task.mediaUrls.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {task.mediaUrls.map((url, i) => {
                    const isMock = url.includes("mock_drive_");
                    const info = identifyMediaLink(url);

                    return (
                      <div
                        key={i}
                        className={`flex items-center justify-between p-3 rounded-xl border group transition shadow-sm ${
                          isMock
                            ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40"
                            : "bg-slate-50 hover:bg-slate-100 dark:bg-[#1e1e1e] dark:hover:bg-[#252525] border-slate-200 dark:border-[#383838]"
                        }`}
                      >
                        <div
                          onClick={() => {
                            if (isMock) {
                              alert("Lampiran ini dibuat sebelum sistem penyimpanan aktif. Silakan hapus dan unggah ulang lampiran.");
                              return;
                            }
                            openMediaSafely(url, userEmail, (img) => setPreviewImage(img));
                          }}
                          className="flex items-center gap-2.5 truncate flex-1 cursor-pointer"
                        >
                          {info.type === "image" && info.isDataUrl ? (
                            <img
                              src={url}
                              alt={`Lampiran ${i + 1}`}
                              className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                          ) : info.isDrive ? (
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                              {info.type === "gfolder" && <FolderOpen className="w-4 h-4" />}
                              {info.type === "gdoc" && <FileText className="w-4 h-4" />}
                              {info.type === "gsheet" && <Sheet className="w-4 h-4" />}
                              {info.type === "gslide" && <Presentation className="w-4 h-4" />}
                              {info.type === "gdrive" && <ExternalLink className="w-4 h-4" />}
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0">
                              <FileImage className="w-4 h-4" />
                            </div>
                          )}
                          <div className="truncate">
                            <div className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center gap-1.5">
                              <span>{isMock ? `Tautan Kedaluwarsa #${i + 1}` : `${info.label} #${i + 1}`}</span>
                              {info.isDrive && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-mono">
                                  Drive
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[140px] font-mono">
                              {url.startsWith("data:") ? "Berkas Gambar" : url}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            type="button"
                            onClick={() => openMediaSafely(url, userEmail, (img) => setPreviewImage(img))}
                            className="p-1 rounded-lg text-slate-400 hover:text-blue-600 transition"
                            title="Buka lampiran"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveMedia(i)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition"
                            title="Hapus lampiran dari tugas"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 text-center rounded-xl bg-slate-50 dark:bg-[#1a1a1a] border border-dashed border-slate-200 dark:border-[#333] text-xs text-slate-400">
                  Belum ada lampiran pada tugas ini. Klik tombol di atas untuk melampirkan Google Drive atau berkas.
                </div>
              )}
            </div>

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
                  className="px-3.5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
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
                Tanggal Request
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
                    : "Tidak ada tanggal request"}
                </span>
              </div>
            </div>

            {/* ClickUp Quick Completion Button */}
            <div className="pt-2">
              {task.status !== "DONE" ? (
                <button
                  onClick={() => onUpdateStatus(task.id, "DONE")}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tandai Selesai</span>
                </button>
              ) : (
                <button
                  onClick={() => onUpdateStatus(task.id, "IN_PROGRESS")}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  <Clock className="w-4 h-4" />
                  <span>Buka Kembali Tugas</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Image Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="p-3 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between text-white text-xs font-bold">
              <span>Pratinjau Lampiran Gambar</span>
              <div className="flex items-center gap-2">
                <a
                  href={previewImage}
                  download="lampiran-syncro.png"
                  className="px-2.5 py-1 rounded-lg bg-brand-600 hover:bg-brand-500 text-white flex items-center gap-1 cursor-pointer transition text-[11px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 flex items-center justify-center overflow-auto max-h-[80vh] bg-black/40">
              <img
                src={previewImage}
                alt="Pratinjau Penuh"
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
