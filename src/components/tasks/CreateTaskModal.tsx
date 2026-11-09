"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  X,
  Upload,
  AlertCircle,
  FileImage,
  Loader2,
  Trash2,
  FolderOpen,
  Link as LinkIcon,
  Settings,
  Check,
  FileText,
  Sheet,
  Presentation,
  ExternalLink,
  Layers,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  identifyMediaLink,
  getSharedFolderAccountUrl,
  getSavedSharedFolderUrl,
  saveSharedFolderUrl,
  openMediaSafely,
  getSpaceDriveFolderUrl,
} from "@/lib/google-drive-client";

interface Project {
  id: string;
  name: string;
  color?: string;
}

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  defaultProjectId?: string;
  defaultStatus?: "TODO" | "IN_PROGRESS" | "DONE";
  onTaskCreated: (newTask: any) => void;
}

const TEAM_MEMBERS = [
  { id: "cmw76e0mm0000z30nonmudizx", name: "Ravi Zein", email: "ravizein@itsecacademy.com" },
];

export function CreateTaskModal({
  isOpen,
  onClose,
  projects,
  defaultProjectId,
  defaultStatus = "TODO",
  onTaskCreated,
}: CreateTaskModalProps) {
  const { toast } = useToast();
  const { data: session } = useSession();
  const userEmail = session?.user?.email || "";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(defaultProjectId || projects[0]?.id || "proj-1");
  const [status, setStatus] = useState<"TODO" | "IN_PROGRESS" | "DONE">(defaultStatus);
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [teamMembers, setTeamMembers] = useState<any[]>(TEAM_MEMBERS);
  const [assigneeId, setAssigneeId] = useState(TEAM_MEMBERS[0].id);
  const [dueDate, setDueDate] = useState("");

  // Google Drive & Media uploads
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [driveInputUrl, setDriveInputUrl] = useState("");
  const [sharedFolderUrl, setSharedFolderUrlState] = useState(getSavedSharedFolderUrl());
  const [isEditingFolder, setIsEditingFolder] = useState(false);
  const [tempFolderUrl, setTempFolderUrl] = useState(sharedFolderUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTeamMembers(data);
          setAssigneeId(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (defaultProjectId) {
      setProjectId(defaultProjectId);
    } else if (projects.length > 0 && !projects.some((p) => p.id === projectId)) {
      setProjectId(projects[0].id);
    }
  }, [defaultProjectId, projects, projectId]);

  // Bersihkan seluruh isian form
  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setStatus(defaultStatus || "TODO");
    setPriority("MEDIUM");
    setDueDate("");
    setMediaUrls([]);
    setDriveInputUrl("");
    setIsEditingFolder(false);
    setUploadError("");
    setUploadProgressText("");
    setIsUploading(false);
    setIsSubmitting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (defaultProjectId) {
      setProjectId(defaultProjectId);
    } else if (projects.length > 0) {
      setProjectId(projects[0].id);
    }
    if (teamMembers.length > 0) {
      setAssigneeId(teamMembers[0].id);
    }
  }, [defaultStatus, defaultProjectId, projects, teamMembers]);

  // Pantau status buka modal: reset seluruh isian form saat baru dibuka
  const prevIsOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      resetForm();
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, resetForm]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const selectedProject = projects.find((p) => p.id === projectId);
  const activeSpaceName = selectedProject?.name || "General";

  // Buka folder Space spesifik di Google Drive (Syncro / Nama Space)
  const handleOpenSpaceFolder = () => {
    const targetUrl = getSpaceDriveFolderUrl(activeSpaceName, userEmail);
    window.open(targetUrl, "_blank");
  };

  // Buka Folder Bersama Google Drive dengan akun email yang login
  const handleOpenSharedFolder = () => {
    const targetUrl = getSpaceDriveFolderUrl("Syncro", userEmail);
    window.open(targetUrl, "_blank");
  };

  // Simpan tautan folder bersama Google Drive
  const handleSaveSharedFolder = () => {
    saveSharedFolderUrl(tempFolderUrl);
    setSharedFolderUrlState(tempFolderUrl);
    setIsEditingFolder(false);
    toast({
      title: "Folder Bersama Tersimpan",
      description: "Tautan Folder Bersama Google Drive berhasil diperbarui.",
    });
  };

  // Tambahkan link file / folder Google Drive ke lampiran tugas
  const handleAddDriveLink = () => {
    const trimmed = driveInputUrl.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      setUploadError("Tautan harus diawali dengan https:// atau http://");
      return;
    }
    setMediaUrls((prev) => [...prev, trimmed]);
    setDriveInputUrl("");
    setUploadError("");
    toast({
      title: "Tautan Dilampirkan",
      description: "Tautan Google Drive berhasil ditambahkan ke daftar lampiran tugas.",
    });
  };

  // Upload berkas lokal
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError("");
    setUploadProgressText(`Memproses "${file.name}"...`);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengunggah file");
      }

      if (data.file?.webViewLink) {
        setMediaUrls((prev) => [...prev, data.file.webViewLink]);
        toast({
          title: "Berkas Berhasil Ditambahkan",
          description: `"${file.name}" berhasil dilampirkan ke tugas.`,
          variant: "success",
        });
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      const errMsg = err.message || "Gagal mengunggah berkas";
      setUploadError(errMsg);
      toast({
        title: "Gagal Mengunggah Berkas",
        description: errMsg,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgressText("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const payload: any = {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        projectId,
        assigneeId: assigneeId || undefined,
        mediaUrls,
      };

      if (dueDate) {
        payload.dueDate = dueDate;
      }

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal membuat tugas baru");
      }

      const created = await res.json();
      onTaskCreated(created);

      toast({
        title: "Tugas Berhasil Dibuat",
        description: `Tiket "${title}" telah berhasil disimpan ke database.`,
        variant: "success",
      });

      resetForm();
      onClose();
    } catch (err: any) {
      console.error("Create task error:", err);
      toast({
        title: "Gagal Menyimpan Tugas",
        description: err.message || "Terjadi kesalahan saat menyimpan tugas.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl max-h-[90vh] bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#2e2e2e] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-[#2e2e2e] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Buat Tugas Baru
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lengkapi detail tiket dan lampiran Google Drive tim
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252525] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Judul Tugas <span className="text-brand-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Misal: Setup email kantor atau Update Mac Mini"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#383838] text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Deskripsi
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Berikan rincian instruksi atau catatan tiket..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#383838] text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          {/* Project & Assignee Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Project / Workspace
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#383838] text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Assignee
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#383838] text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status, Priority, Due Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "TODO" | "IN_PROGRESS" | "DONE")
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#383838] text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Prioritas
              </label>
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH" | "URGENT")
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#383838] text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="LOW">Rendah</option>
                <option value="MEDIUM">Sedang</option>
                <option value="HIGH">Tinggi</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Tanggal Request
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#383838] text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Google Drive & Media Section */}
          <div className="pt-2 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Lampiran & Google Drive
              </label>
              {userEmail && (
                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Drive: <span className="font-mono text-slate-700 dark:text-slate-300">{userEmail}</span>
                </span>
              )}
            </div>

            {/* Google Drive Space Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#333333] space-y-3">
              {/* Space Folder Destination Row */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <FolderOpen className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        Syncro / {activeSpaceName}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium shrink-0">
                        Space
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      Folder Google Drive otomatis untuk space ini
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleOpenSpaceFolder}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer whitespace-nowrap"
                    title={`Buka folder ${activeSpaceName} di Google Drive`}
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
                    <Layers className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingFolder(!isEditingFolder)}
                    title="Atur URL Folder Bersama"
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-[#2c2c2c] transition cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Input setting folder bersama jika diaktifkan */}
              {isEditingFolder && (
                <div className="pt-2 border-t border-slate-200 dark:border-[#333333] flex items-center gap-2 animate-fade-in">
                  <input
                    type="url"
                    value={tempFolderUrl}
                    onChange={(e) => setTempFolderUrl(e.target.value)}
                    placeholder="URL Folder Drive Tim (https://drive.google.com/drive/folders/...)"
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#181818] border border-blue-300 dark:border-blue-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleSaveSharedFolder}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition shrink-0"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Simpan</span>
                  </button>
                </div>
              )}

              {/* Action Bar: Paste Link or Upload File */}
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
                      placeholder="Tempel tautan Google Drive / dokumen..."
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
                      <span>Unggah File</span>
                    </button>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </div>
            </div>

            {/* Upload Error Banner */}
            {uploadError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Uploaded Media Previews */}
            {mediaUrls.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Lampiran Terpilih ({mediaUrls.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {mediaUrls.map((url, i) => {
                    const info = identifyMediaLink(url);
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#383838] text-xs hover:border-slate-300 dark:hover:border-slate-600 transition"
                      >
                        <div className="flex items-center gap-2 truncate max-w-[80%]">
                          {info.type === "image" && info.isDataUrl ? (
                            <img
                              src={url}
                              alt={`Lampiran ${i + 1}`}
                              className="w-7 h-7 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                          ) : info.isDrive ? (
                            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                              {info.type === "gfolder" && <FolderOpen className="w-3.5 h-3.5" />}
                              {info.type === "gdoc" && <FileText className="w-3.5 h-3.5" />}
                              {info.type === "gsheet" && <Sheet className="w-3.5 h-3.5" />}
                              {info.type === "gslide" && <Presentation className="w-3.5 h-3.5" />}
                              {info.type === "gdrive" && <ExternalLink className="w-3.5 h-3.5" />}
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0">
                              <FileImage className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <div className="truncate">
                            <div className="font-semibold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5">
                              <span>{info.label} #{i + 1}</span>
                              {info.isDrive && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-mono">
                                  Drive
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate font-mono">
                              {url.startsWith("data:") ? "Berkas Gambar" : url}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openMediaSafely(url, userEmail)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Buka lampiran"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveMedia(i)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                            title="Hapus lampiran"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-[#2e2e2e] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#252525] transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Tugas</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
