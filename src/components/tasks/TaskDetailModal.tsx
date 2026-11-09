"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Download,
  AlertCircle,
  FolderOpen,
  Link as LinkIcon,
  Upload,
  Loader2,
  FileText,
  Sheet,
  Presentation,
  Check,
} from "lucide-react";
import { TaskItem } from "./TaskCard";
import {
  identifyMediaLink,
  openMediaSafely,
  getSpaceDriveFolderUrl,
} from "@/lib/google-drive-client";

const DEFAULT_PROJECTS = [
  { id: "proj-1", name: "IT Support Academy", color: "#ee3726" },
  { id: "proj-2", name: "Design for ITSEC Academy Event", color: "#8a2be2" },
];

const FALLBACK_TEAM_MEMBERS = [
  {
    id: "cmw76e0mm0000z30nonmudizx",
    name: "Ravi Zein",
    email: "ravizein@itsecacademy.com",
    role: "ADMIN",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=ravizein%40itsecacademy.com",
  },
  {
    id: "cmw78o82k000109kw7sz65406",
    name: "Joko Triyono",
    email: "joko@itsecacademy.com",
    role: "USER",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=joko%40itsecacademy.com",
  },
  {
    id: "cmw78ol3d000309kwevg37a3l",
    name: "Pakra",
    email: "pakra@itsecacademy.com",
    role: "USER",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=pakra%40itsecacademy.com",
  },
];

interface TaskDetailModalProps {
  task: TaskItem | null;
  projects?: { id: string; name: string; color?: string | null }[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (taskId: string, newStatus: "TODO" | "IN_PROGRESS" | "DONE") => void;
  onDeleteTask: (taskId: string) => void;
  onCommentAdded?: (commentText: string, task: TaskItem) => void;
  onTaskUpdated?: (updatedTask: TaskItem) => void;
}

export function TaskDetailModal({
  task,
  projects = DEFAULT_PROJECTS,
  isOpen,
  onClose,
  onUpdateStatus,
  onDeleteTask,
  onCommentAdded,
  onTaskUpdated,
}: TaskDetailModalProps) {
  const { data: session } = useSession();
  const userEmail = session?.user?.email || "";

  // Local state for all editable fields
  const [localTitle, setLocalTitle] = useState("");
  const [localDescription, setLocalDescription] = useState("");
  const [localStatus, setLocalStatus] = useState<"TODO" | "IN_PROGRESS" | "DONE">("TODO");
  const [localPriority, setLocalPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [localAssigneeId, setLocalAssigneeId] = useState<string | null>(null);
  const [localDueDate, setLocalDueDate] = useState<string>("");
  const [localProjectId, setLocalProjectId] = useState<string>("");
  const [localMediaUrls, setLocalMediaUrls] = useState<string[]>([]);

  // Users for assignee dropdown
  const [teamMembers, setTeamMembers] = useState<any[]>(FALLBACK_TEAM_MEMBERS);

  // Status & Feedback indicators
  const [savingField, setSavingField] = useState<string | null>(null);
  const [saveStatusMessage, setSaveStatusMessage] = useState<string | null>(null);

  // Comments & Lightbox
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<
    { id: string; user: string; text: string; time: string }[]
  >([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Attachment controls
  const [driveInputUrl, setDriveInputUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when active task changes
  useEffect(() => {
    if (task) {
      setLocalTitle(task.title || "");
      setLocalDescription(task.description || "");
      setLocalStatus(task.status || "TODO");
      setLocalPriority(task.priority || "MEDIUM");
      setLocalAssigneeId(task.assigneeId || null);
      setLocalDueDate(
        task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
      );
      setLocalProjectId(task.projectId || (projects[0]?.id || "proj-1"));
      setLocalMediaUrls(task.mediaUrls || []);
      setUploadError("");
      setDriveInputUrl("");
    }
  }, [task, projects]);

  // Load registered users from API
  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTeamMembers(data);
        }
      })
      .catch(() => {});
  }, []);

  if (!isOpen || !task) return null;

  // Active project & space helper
  const activeProject =
    projects.find((p) => p.id === localProjectId) ||
    task.project ||
    projects[0] || { id: "proj-1", name: "IT Support Academy", color: "#ee3726" };

  const spaceName = activeProject.name || "General";

  // Active Assignee helper
  const currentAssignee =
    teamMembers.find((m) => m.id === localAssigneeId) ||
    task.assignee ||
    null;

  // Helper untuk menyimpan perubahan field ke server & sinkronkan state
  const handleUpdateField = async (field: string, value: any) => {
    if (!task) return;
    setSavingField(field);
    setSaveStatusMessage("Menyimpan...");

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      if (!res.ok) {
        throw new Error("Gagal menyimpan perubahan ke server");
      }

      const updated = await res.json();
      if (onTaskUpdated) {
        onTaskUpdated(updated);
      }
      setSaveStatusMessage("Tersimpan");
      setTimeout(() => setSaveStatusMessage(null), 2500);
    } catch (err: any) {
      console.error("Gagal update task field:", err);
      setSaveStatusMessage("Gagal menyimpan");
      setTimeout(() => setSaveStatusMessage(null), 3000);
    } finally {
      setSavingField(null);
    }
  };

  // Status prioritas & styling bendera
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

  const pStyle = getPriorityStyle(localPriority);

  // Buka Folder Space spesifik di Google Drive
  const handleOpenSpaceFolder = () => {
    const targetUrl = getSpaceDriveFolderUrl(spaceName, userEmail);
    window.open(targetUrl, "_blank");
  };

  // Buka Folder Utama Syncro di Google Drive
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

    const newMediaUrls = [...localMediaUrls, trimmed];
    setLocalMediaUrls(newMediaUrls);
    setDriveInputUrl("");
    setUploadError("");

    await handleUpdateField("mediaUrls", newMediaUrls);
  };

  // Hapus lampiran dari task
  const handleRemoveMedia = async (index: number) => {
    const newMediaUrls = localMediaUrls.filter((_, i) => i !== index);
    setLocalMediaUrls(newMediaUrls);
    await handleUpdateField("mediaUrls", newMediaUrls);
  };

  // Upload file lokal langsung ke Google Drive Edge & Task
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
        const newMediaUrls = [...localMediaUrls, data.file.webViewLink];
        setLocalMediaUrls(newMediaUrls);
        await handleUpdateField("mediaUrls", newMediaUrls);
      }
    } catch (err: any) {
      setUploadError(err.message || "Gagal mengunggah file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Tambah komentar
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
        <div className="px-6 py-3.5 border-b border-slate-200 dark:border-[#2e2e2e] flex items-center justify-between bg-slate-50/70 dark:bg-[#1a1a1a]">
          {/* Breadcrumb Info */}
          <div className="flex items-center gap-2.5 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: activeProject.color || "#ee3726" }}
            />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {spaceName}
            </span>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="font-mono text-slate-400 text-[11px]">
              TASK-{task.id.slice(-5).toUpperCase()}
            </span>

            {/* Save indicator pill */}
            {saveStatusMessage && (
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 transition ${
                  saveStatusMessage === "Tersimpan"
                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40"
                    : saveStatusMessage === "Menyimpan..."
                    ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40"
                    : "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300"
                }`}
              >
                {saveStatusMessage === "Tersimpan" ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : saveStatusMessage === "Menyimpan..." ? (
                  <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                ) : null}
                <span>{saveStatusMessage}</span>
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => window.print()}
              title="Cetak Dokumen Tiket"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-[#252525] transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert("Tautan tugas disalin ke papan klip!");
              }}
              title="Bagikan Tautan"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-[#252525] transition cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (confirm(`Yakin ingin menghapus tugas "${localTitle || task.title}"?`)) {
                  onDeleteTask(task.id);
                  onClose();
                }
              }}
              title="Hapus Tugas"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-slate-200 dark:bg-[#2e2e2e] mx-1" />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252525] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Main Content (2-Column ClickUp Grid) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Task Title, Description, Attachments, Comments */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title (Directly Editable) */}
            <div>
              <div className="relative group">
                <input
                  type="text"
                  value={localTitle}
                  onChange={(e) => setLocalTitle(e.target.value)}
                  onBlur={() => {
                    const trimmed = localTitle.trim();
                    if (trimmed && trimmed !== task.title) {
                      handleUpdateField("title", trimmed);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.currentTarget.blur();
                    }
                  }}
                  placeholder="Judul Tugas..."
                  className="w-full text-xl sm:text-2xl font-bold text-slate-900 dark:text-white bg-transparent border-b-2 border-transparent hover:border-slate-300 dark:hover:border-[#383838] focus:border-brand-500 dark:focus:border-brand-500 rounded-none px-0 py-1 transition outline-none leading-snug"
                />
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                <span>Dibuat {new Date(task.createdAt || Date.now()).toLocaleDateString("id-ID")}</span>
                <span>•</span>
                <span className="text-[11px] text-slate-400">Klik judul untuk mengedit</span>
              </div>
            </div>

            {/* Description (Directly Editable) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Deskripsi
                </h3>
                {savingField === "description" && (
                  <span className="text-[11px] text-blue-500 flex items-center gap-1 font-medium">
                    <Loader2 className="w-3 h-3 animate-spin" /> Menyimpan...
                  </span>
                )}
              </div>
              <textarea
                rows={4}
                value={localDescription}
                onChange={(e) => setLocalDescription(e.target.value)}
                onBlur={() => {
                  if (localDescription !== (task.description || "")) {
                    handleUpdateField("description", localDescription);
                  }
                }}
                placeholder="Berikan instruksi, catatan penting, atau rincian tiket di sini..."
                className="w-full p-4 rounded-xl bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#383838] focus:border-brand-500 dark:focus:border-brand-500 focus:bg-white dark:focus:bg-[#181818] text-sm text-slate-800 dark:text-slate-200 leading-relaxed transition outline-none resize-y min-h-[100px]"
              />
            </div>

            {/* Media / Attachment Files & Google Drive Shared Folder */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <FolderOpen className="w-4 h-4 text-blue-500" />
                  <span>Lampiran & Google Drive ({localMediaUrls.length})</span>
                </h3>

                {userEmail && (
                  <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Drive: <span className="font-mono text-slate-700 dark:text-slate-300">{userEmail}</span>
                  </span>
                )}
              </div>

              {/* Card Folder Google Drive Space (Unified & Clean Design) */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#333333] space-y-3">
                {/* Space Folder Info Row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <FolderOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          Syncro / {spaceName}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium shrink-0">
                          Space
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        Folder Google Drive otomatis untuk space {spaceName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleOpenSpaceFolder}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer whitespace-nowrap"
                      title={`Buka folder ${spaceName} di Google Drive`}
                    >
                      <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                      <span>Buka Folder</span>
                      <ExternalLink className="w-3 h-3 opacity-80 shrink-0" />
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenSharedFolder}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-slate-200/60 dark:hover:bg-[#2c2c2c] transition cursor-pointer"
                      title="Buka Folder Utama Syncro di Google Drive"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Single Clean Action Bar: Paste Drive Link or Upload File */}
                <div className="pt-2 border-t border-slate-200 dark:border-[#333333]">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1 min-w-0">
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
                        placeholder="Tempel tautan Google Drive / dokumen (https://drive.google.com/...)"
                        className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#383838] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={handleAddDriveLink}
                        disabled={!driveInputUrl.trim()}
                        className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer whitespace-nowrap shadow-xs"
                      >
                        + Lampirkan
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-[#282828] dark:hover:bg-[#303030] border border-slate-200 dark:border-[#383838] text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap shadow-xs"
                      >
                        {isUploading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                        ) : (
                          <Upload className="w-3.5 h-3.5 text-slate-500" />
                        )}
                        <span>{isUploading ? "Mengunggah..." : "Unggah Berkas"}</span>
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
                </div>
              </div>

              {/* Upload Error Banner */}
              {uploadError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* List of Attachments */}
              {localMediaUrls.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {localMediaUrls.map((url, i) => {
                    const isMock = url.includes("mock_drive_");
                    const info = identifyMediaLink(url);

                    return (
                      <div
                        key={i}
                        className={`flex items-center justify-between p-3 rounded-xl border group transition shadow-xs ${
                          isMock
                            ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40"
                            : "bg-slate-50 hover:bg-slate-100 dark:bg-[#1e1e1e] dark:hover:bg-[#252525] border-slate-200 dark:border-[#383838]"
                        }`}
                      >
                        <div
                          onClick={() => {
                            if (isMock) {
                              alert(
                                "Lampiran ini dibuat sebelum sistem penyimpanan aktif. Silakan hapus dan unggah ulang berkas."
                              );
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
                              <span>
                                {isMock ? `Tautan Kedaluwarsa #${i + 1}` : `${info.label} #${i + 1}`}
                              </span>
                              {info.isDrive && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-mono">
                                  Drive
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[150px] font-mono">
                              {url.startsWith("data:") ? "Berkas Gambar" : url}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            type="button"
                            onClick={() =>
                              openMediaSafely(url, userEmail, (img) => setPreviewImage(img))
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Buka lampiran"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveMedia(i)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
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
                <div className="p-4 text-center rounded-xl bg-slate-50/60 dark:bg-[#1a1a1a] border border-slate-200/80 dark:border-[#2e2e2e] text-xs text-slate-400">
                  Belum ada lampiran pada tugas ini. Tempel link Google Drive atau unggah berkas melalui form di atas.
                </div>
              )}
            </div>

            {/* Activity & Comment Section */}
            <div className="pt-4 border-t border-slate-200 dark:border-[#333333]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
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

          {/* Right Column: Metadata Sidebar (ALL MENUS EDITABLE) */}
          <div className="space-y-4 p-4 rounded-xl bg-slate-50/80 dark:bg-[#202020] border border-slate-200 dark:border-[#383838]">
            {/* 1. Status Select */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Status
              </label>
              <select
                value={localStatus}
                onChange={(e) => {
                  const newStatus = e.target.value as "TODO" | "IN_PROGRESS" | "DONE";
                  setLocalStatus(newStatus);
                  onUpdateStatus(task.id, newStatus);
                }}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-[#383838] bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer shadow-xs"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Completed</option>
              </select>
            </div>

            {/* 2. Project / Space Select (Editable) */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Project / Space
              </label>
              <select
                value={localProjectId}
                onChange={(e) => {
                  const val = e.target.value;
                  setLocalProjectId(val);
                  handleUpdateField("projectId", val);
                }}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-[#383838] bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer shadow-xs"
              >
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Priority Select (Editable) */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Prioritas
              </label>
              <div className="relative">
                <select
                  value={localPriority}
                  onChange={(e) => {
                    const val = e.target.value as "LOW" | "MEDIUM" | "HIGH" | "URGENT";
                    setLocalPriority(val);
                    handleUpdateField("priority", val);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-[#383838] bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer shadow-xs"
                >
                  <option value="LOW">Rendah</option>
                  <option value="MEDIUM">Sedang</option>
                  <option value="HIGH">Tinggi</option>
                  <option value="URGENT">Urgent</option>
                </select>
                <Flag
                  className={`w-4 h-4 ${pStyle.flag} fill-current absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none`}
                />
              </div>
            </div>

            {/* 4. Assignee Select (Editable) */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Penanggung Jawab (Assignee)
              </label>
              <select
                value={localAssigneeId || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setLocalAssigneeId(val || null);
                  handleUpdateField("assigneeId", val || null);
                }}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-[#383838] bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer shadow-xs"
              >
                <option value="">Belum ditugaskan (Unassigned)</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name || member.email} ({member.email})
                  </option>
                ))}
              </select>

              {/* Assignee Card Preview */}
              {currentAssignee && (
                <div className="flex items-center gap-2.5 mt-2 p-2.5 rounded-xl bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#333333]">
                  <img
                    src={
                      currentAssignee.image ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentAssignee.email}`
                    }
                    alt={currentAssignee.name || "Assignee"}
                    className="w-6 h-6 rounded-full border border-slate-200 dark:border-[#383838] object-cover shrink-0"
                  />
                  <div className="min-w-0 truncate">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {currentAssignee.name || "User"}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate font-mono">
                      {currentAssignee.email}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Tanggal Request (Editable Datepicker) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Tanggal Request
                </label>
                {localDueDate && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocalDueDate("");
                      handleUpdateField("dueDate", null);
                    }}
                    className="text-[10px] font-semibold text-rose-500 hover:text-rose-600 transition cursor-pointer"
                  >
                    Hapus Tanggal
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="date"
                  value={localDueDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLocalDueDate(val);
                    handleUpdateField("dueDate", val || null);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-[#383838] bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer shadow-xs"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Quick Completion / Status Toggle Button */}
            <div className="pt-2">
              {localStatus !== "DONE" ? (
                <button
                  type="button"
                  onClick={() => {
                    setLocalStatus("DONE");
                    onUpdateStatus(task.id, "DONE");
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tandai Selesai</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setLocalStatus("IN_PROGRESS");
                    onUpdateStatus(task.id, "IN_PROGRESS");
                  }}
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
