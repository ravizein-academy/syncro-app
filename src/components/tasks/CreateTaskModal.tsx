"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  AlertCircle,
  FileImage,
  Loader2,
  Trash2,
  Cloud,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

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
  { id: "user-1", name: "Ravi Zein", email: "ravizein@itsecacademy.com" },
  { id: "user-2", name: "Sarah Chen", email: "sarah@itsecacademy.com" },
  { id: "user-3", name: "Budi Santoso", email: "budi@itsecacademy.com" },
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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(defaultProjectId || projects[0]?.id || "proj-1");
  const [status, setStatus] = useState<"TODO" | "IN_PROGRESS" | "DONE">(defaultStatus);
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [assigneeId, setAssigneeId] = useState(TEAM_MEMBERS[0].id);
  const [dueDate, setDueDate] = useState("");
  
  // Media uploads to Google Drive
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError("");
    setUploadProgressText(`Mengunggah "${file.name}" ke Google Drive via Edge API...`);

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
          title: "Berkas Berhasil Diunggah",
          description: `"${file.name}" berhasil disimpan ke Google Drive.`,
          variant: "success",
        });
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      const errMsg = err.message || "Gagal mengunggah ke Google Drive";
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
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          projectId,
          status,
          priority,
          assigneeId,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          mediaUrls,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal membuat tugas");
      }

      const created = await res.json();
      onTaskCreated(created);
      onClose();
    } catch (err: any) {
      toast({
        title: "Gagal Membuat Tugas",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-[#282828] border border-slate-200 dark:border-[#383838] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] transition-colors">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#383838] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-600/20 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-200 dark:border-brand-500/30">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                Buat Tugas Baru
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lengkapi detail tugas kantor dan lampiran Google Drive
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Judul Tugas <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Audit Keamanan Sistem Cloudflare & Neon"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#383838] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-[#181818] transition"
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
              placeholder="Jelaskan kebutuhan, checklist, atau catatan penting..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#383838] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-[#181818] transition resize-none"
            />
          </div>

          {/* Project & Assignee Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                {TEAM_MEMBERS.map((member) => (
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
                Batas Waktu
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#383838] text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Google Drive Media Upload Section */}
          <div className="pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Lampiran Media (Google Drive Edge API)
            </label>

            {/* Dropzone Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`p-4 border-2 border-dashed rounded-xl cursor-pointer transition text-center ${
                isUploading
                  ? "border-brand-500 bg-brand-50/50 dark:bg-brand-950/20"
                  : "border-slate-300 hover:border-brand-400 bg-slate-50/50 hover:bg-slate-50 dark:border-[#383838] dark:hover:border-[#484848] dark:bg-[#1c1c1c]/50 dark:hover:bg-[#1c1c1c]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isUploading}
              />
              <div className="flex flex-col items-center justify-center gap-1.5">
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
                    <span className="text-xs text-brand-600 dark:text-brand-300 font-medium">
                      {uploadProgressText}
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-slate-400" />
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                      Klik untuk mengunggah gambar/video ke Google Drive
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Disimpan via REST multipart/related tanpa dependensi Node.js
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Upload Error Banner */}
            {uploadError && (
              <div className="mt-2 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Uploaded Media Previews */}
            {mediaUrls.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {mediaUrls.map((url, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#383838] text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileImage className="w-4 h-4 text-brand-500 shrink-0" />
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-600 dark:text-brand-300 hover:underline truncate"
                      >
                        {url}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(i)}
                      className="p-1 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-[#333333] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-itsec-darkRed hover:from-brand-500 hover:to-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Simpan Tugas</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
