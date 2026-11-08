"use client";

import React, { useState, useEffect } from "react";
import { X, FolderCog, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: string;
    name: string;
    description?: string | null;
    color?: string | null;
  } | null;
  onProjectUpdated: (project: any) => void;
  onProjectDeleted: (projectId: string) => void;
}

const COLOR_PALETTES = [
  "#ee3726", // ITSEC Primary Red
  "#0ea5e9", // Cyber Blue
  "#6366f1", // Indigo
  "#10b981", // Emerald
  "#ec4899", // Pink
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
];

export function EditProjectModal({
  isOpen,
  onClose,
  project,
  onProjectUpdated,
  onProjectDeleted,
}: EditProjectModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLOR_PALETTES[0]);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name || "");
      setDescription(project.description || "");
      setColor(project.color || COLOR_PALETTES[0]);
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim(), color }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Gagal memperbarui space");
      }

      const updated = await res.json();
      onProjectUpdated(updated);
      toast({
        title: "Space Diperbarui",
        description: `Space "${updated.name}" berhasil diperbarui.`,
        variant: "success",
      });
      onClose();
    } catch (err: any) {
      toast({
        title: "Gagal Memperbarui Space",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus Space "${project.name}"?\nSemua tugas di dalam space ini juga akan dihapus secara permanen.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Gagal menghapus space");
      }

      onProjectDeleted(project.id);
      toast({
        title: "Space Dihapus",
        description: `Space "${project.name}" telah dihapus.`,
        variant: "default",
      });
      onClose();
    } catch (err: any) {
      toast({
        title: "Gagal Menghapus Space",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-[#282828] border border-slate-200 dark:border-[#383838] rounded-2xl shadow-2xl overflow-hidden transition-colors max-h-[92vh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#383838] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-600/20 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-200 dark:border-brand-500/30">
              <FolderCog className="w-4 h-4" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              Edit Space / Project
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#333333] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Nama Space <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Cloud Architecture"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#383838] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Deskripsi
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan tujuan atau ruang lingkup space ini..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#383838] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Warna Identitas Space
            </label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {COLOR_PALETTES.map((palette) => (
                <button
                  type="button"
                  key={palette}
                  onClick={() => setColor(palette)}
                  className={`w-7 h-7 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                    color === palette
                      ? "ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-[#282828] scale-110"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: palette }}
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-[#333333]">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || loading}
              className="px-3.5 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              Hapus Space
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#383838] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#333333] text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Simpan Perubahan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
