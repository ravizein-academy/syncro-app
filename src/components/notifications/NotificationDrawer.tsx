"use client";

import React, { useState } from "react";
import {
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
  X,
  CheckCircle2,
  Clock,
  CircleDot,
  Flame,
  AlertTriangle,
  UserCheck,
  PlusCircle,
  Layers,
  ExternalLink,
  MessageSquare,
  Send,
} from "lucide-react";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  createdAt: string;
  read: boolean;
  type:
    | "task_create"
    | "task_update"
    | "task_delete"
    | "status"
    | "priority"
    | "assign"
    | "project"
    | "comment"
    | "custom"
    | "system"
    | string;
  taskId?: string;
  projectId?: string;
  actorName?: string;
}

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onClearAllNotifications: () => void;
  onOpenTaskDetail?: (taskId: string) => void;
  onOpenSendNotification?: () => void;
}

export function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAllNotifications,
  onOpenTaskDetail,
  onOpenSendNotification,
}: NotificationDrawerProps) {
  const [filter, setFilter] = useState<"all" | "unread">("all");

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    return true;
  });

  const getNotificationIcon = (type: NotificationItem["type"], title: string) => {
    switch (type) {
      case "status":
        if (title.toLowerCase().includes("selesai") || title.toLowerCase().includes("complete")) {
          return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
        }
        if (title.toLowerCase().includes("progress")) {
          return <Clock className="w-4 h-4 text-sky-500" />;
        }
        return <CircleDot className="w-4 h-4 text-slate-400" />;
      case "priority":
        if (title.toLowerCase().includes("urgent") || title.toLowerCase().includes("high")) {
          return <Flame className="w-4 h-4 text-rose-500" />;
        }
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "assign":
        return <UserCheck className="w-4 h-4 text-violet-500" />;
      case "task_create":
        return <PlusCircle className="w-4 h-4 text-brand-500" />;
      case "task_delete":
        return <Trash2 className="w-4 h-4 text-rose-500" />;
      case "project":
        return <Layers className="w-4 h-4 text-indigo-500" />;
      case "comment":
        return <MessageSquare className="w-4 h-4 text-sky-500" />;
      default:
        return <Bell className="w-4 h-4 text-brand-500" />;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMinutes < 1) return "Baru saja";
      if (diffMinutes < 60) return `${diffMinutes} mnt lalu`;
      if (diffHours < 24) return `${diffHours} jam lalu`;
      if (diffDays === 1) return "Kemarin";
      if (diffDays < 7) return `${diffDays} hari lalu`;
      return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    } catch {
      return "Baru saja";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-[#1e1e1e] border-l border-slate-200 dark:border-[#333333] shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#2e2e2e] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold shadow-xs">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Notifikasi & Kegiatan
                  </h2>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white">
                      {unreadCount} baru
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Pantau seluruh aktivitas operasional real-time
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2c2c2c] transition cursor-pointer"
              title="Tutup Notifikasi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Toolbar & Filters */}
          <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-[#252525]/50 border-b border-slate-100 dark:border-[#2e2e2e] flex items-center justify-between gap-2">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-[#303030] p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setFilter("all")}
                className={`px-2.5 py-1 rounded-md transition ${
                  filter === "all"
                    ? "bg-white dark:bg-[#1e1e1e] text-slate-900 dark:text-white shadow-xs font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Semua ({notifications.length})
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`px-2.5 py-1 rounded-md transition ${
                  filter === "unread"
                    ? "bg-white dark:bg-[#1e1e1e] text-slate-900 dark:text-white shadow-xs font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Belum Dibaca ({unreadCount})
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5">
              {onOpenSendNotification && (
                <button
                  onClick={onOpenSendNotification}
                  className="px-2 py-1 text-[11px] font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition flex items-center gap-1 cursor-pointer shadow-xs"
                  title="Kirim pesan notifikasi ke orang tertentu"
                >
                  <Send className="w-3 h-3" />
                  <span>Kirim Pesan</span>
                </button>
              )}
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="px-2 py-1 text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition flex items-center gap-1 cursor-pointer"
                  title="Tandai semua notifikasi telah dibaca"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tandai Dibaca</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={onClearAllNotifications}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                  title="Bersihkan semua notifikasi"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
            {filteredNotifications.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#282828] flex items-center justify-center text-slate-400 dark:text-slate-500">
                  <BellOff className="w-7 h-7 opacity-60" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {filter === "unread" ? "Semua Notifikasi Telah Dibaca" : "Tidak Ada Notifikasi"}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
                    Setiap kegiatan pembuatan tugas, perubahan status, prioritas, dan pembaruan ruang kerja akan otomatis tercatat di sini.
                  </p>
                </div>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.read) onMarkAsRead(notif.id);
                    if (notif.taskId && onOpenTaskDetail) {
                      onOpenTaskDetail(notif.taskId);
                    }
                  }}
                  className={`group relative p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    notif.read
                      ? "bg-white dark:bg-[#242424] border-slate-200 dark:border-[#333333] hover:border-slate-300 dark:hover:border-[#444444]"
                      : "bg-brand-50/40 dark:bg-brand-500/10 border-brand-200 dark:border-brand-500/30 hover:border-brand-400"
                  }`}
                >
                  {/* Category Icon */}
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#2d2d2d] flex items-center justify-center shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type, notif.title)}
                  </div>

                  {/* Notification Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4
                        className={`text-xs font-bold truncate ${
                          notif.read
                            ? "text-slate-800 dark:text-slate-200"
                            : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono shrink-0">
                        {formatRelativeTime(notif.createdAt || notif.timestamp)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug line-clamp-2">
                      {notif.message}
                    </p>

                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      {notif.actorName && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-[#303030] px-1.5 py-0.5 rounded-md">
                          Dari: <strong className="text-slate-700 dark:text-slate-200">{notif.actorName}</strong>
                        </span>
                      )}
                      {notif.taskId && (
                        <div className="flex items-center gap-1 text-[10px] text-brand-600 dark:text-brand-400 font-bold group-hover:underline">
                          <span>Buka Tiket</span>
                          <ExternalLink className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions (Delete & Unread indicator) */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0 self-center">
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-brand-500" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNotification(notif.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded transition cursor-pointer"
                      title="Hapus notifikasi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

