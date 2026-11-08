"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  Send,
  Users,
  User,
  AlertTriangle,
  Info,
  CheckCircle2,
  X,
  Sparkles,
  Flame,
  MessageSquare,
} from "lucide-react";

interface UserOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface SendNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string;
  onNotificationSent?: (targetName: string, title: string) => void;
}

export function SendNotificationModal({
  isOpen,
  onClose,
  currentUserEmail,
  onNotificationSent,
}: SendNotificationModalProps) {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<string>("ALL");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"info" | "priority" | "assign" | "custom">("info");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Ambil daftar seluruh pengguna dari database
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      fetch("/api/users")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setUsers(data);
          }
        })
        .catch((err) => console.warn("Failed to fetch users for notifications:", err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!title.trim() || !message.trim()) {
      setErrorMsg("Judul dan isi pesan notifikasi wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const isBroadcast = selectedRecipient === "ALL";
      const payload: any = {
        title: title.trim(),
        message: message.trim(),
        type,
      };

      if (isBroadcast) {
        payload.sendToAll = true;
      } else {
        payload.userId = selectedRecipient;
      }

      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirim notifikasi.");
      }

      const targetUserName = isBroadcast
        ? "Semua Pengguna"
        : users.find((u) => u.id === selectedRecipient)?.name || "Pengguna";

      setSuccessMsg(
        isBroadcast
          ? "Notifikasi broadcast berhasil dikirim ke seluruh tim!"
          : `Notifikasi berhasil dikirim kepada ${targetUserName}!`
      );

      onNotificationSent?.(targetUserName, title.trim());

      setTimeout(() => {
        setTitle("");
        setMessage("");
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat mengirim notifikasi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-sans animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1e1e1e] rounded-3xl border border-slate-200 dark:border-[#333333] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#2e2e2e] flex items-center justify-between gap-3 bg-white dark:bg-[#222222]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Kirim Notifikasi Langsung
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Kirim pesan notifikasi penting ke orang tertentu atau seluruh tim
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Penerima Target */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Kirim Notifikasi Kepada <span className="text-brand-500">*</span>
            </label>
            <select
              value={selectedRecipient}
              onChange={(e) => setSelectedRecipient(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#383838] bg-white dark:bg-[#282828] text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            >
              <option value="ALL">📢 Semua Pengguna (Broadcast Tim)</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  👤 {u.name} ({u.email}) {u.role === "ADMIN" ? "— [ADMIN]" : ""}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1">
              Notifikasi akan langsung muncul di panel notifikasi orang yang dipilih saat login.
            </p>
          </div>

          {/* Kategori / Tipe Notifikasi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Kategori Notifikasi
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "info", label: "Informasi", icon: Info, color: "text-sky-500" },
                { id: "priority", label: "Penting / Urgent", icon: Flame, color: "text-rose-500" },
                { id: "assign", label: "Penugasan", icon: User, color: "text-violet-500" },
                { id: "custom", label: "Pesan Langsung", icon: MessageSquare, color: "text-amber-500" },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = type === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setType(item.id as any)}
                    className={`p-2 rounded-xl border text-left text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      isSelected
                        ? "border-brand-500 bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 shadow-xs"
                        : "border-slate-200 dark:border-[#383838] hover:bg-slate-50 dark:hover:bg-[#2b2b2b] text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Judul Notifikasi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Judul Notifikasi <span className="text-brand-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Pengingat Rapat Audit / Review Laporan Mingguan"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#383838] bg-white dark:bg-[#282828] text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>

          {/* Isi Pesan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Isi Pesan Notifikasi <span className="text-brand-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tuliskan pesan detail yang ingin disampaikan kepada orang yang dituju..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#383838] bg-white dark:bg-[#282828] text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-none"
            />
          </div>

          {/* Footer Tombol */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#2c2c2c] transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/20 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Mengirim..." : "Kirim Notifikasi"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
