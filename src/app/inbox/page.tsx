"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { 
  Inbox, 
  CheckCheck, 
  Bell, 
  ExternalLink 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function InboxPage() {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useStore();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filtered = notifications.filter((n) => (filter === "unread" ? !n.read : true));

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-rose-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Notifications Center</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3 mt-1">
            <Inbox className="text-rose-500" />
            Inbox
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Pusat notifikasi penugasan, aktivitas tim, dan update sistem ClickUp-style.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-[#12131b] border border-[#222533] p-1 rounded-xl flex shadow-inner">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === "all" ? "bg-rose-600 text-white shadow-md shadow-rose-950/40" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Semua ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === "unread" ? "bg-rose-600 text-white shadow-md shadow-rose-950/40" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Belum Dibaca ({notifications.filter((n) => !n.read).length})
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={markAllNotificationsAsRead}
            className="h-8 text-xs gap-1.5 border-[#2c3044] text-slate-300 hover:bg-white/[0.04] rounded-lg"
          >
            <CheckCheck size={14} className="text-rose-400" />
            <span>Tandai Semua Dibaca</span>
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-[#12131b]/60 border border-[#222533] rounded-2xl">
            <Bell size={40} className="mx-auto text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-slate-200">Semua pemberitahuan sudah terbaca</h3>
            <p className="text-xs text-slate-500 mt-1">Tidak ada notifikasi baru untuk saat ini.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <Card
              key={item.id}
              className={`border-[#222533] transition ${
                item.read ? "bg-[#0f1017]/80 opacity-70" : "bg-[#12131b] shadow-sm border-rose-500/30"
              }`}
            >
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      item.type === "system"
                        ? "bg-rose-950/40 text-rose-300 border border-rose-800/40"
                        : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                    }`}
                  >
                    {item.sender[0]}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-slate-200">
                      <strong className="font-bold text-white">{item.sender}</strong>{" "}
                      <span className="text-slate-400">{item.action}</span>{" "}
                      <strong className="text-rose-400 font-semibold">"{item.target}"</strong>
                    </p>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">{item.time}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link href="/tasks">
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-rose-400 hover:text-rose-300">
                      <ExternalLink size={13} className="mr-1" />
                      Lihat Task
                    </Button>
                  </Link>
                  {!item.read && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markNotificationAsRead(item.id)}
                      className="h-8 text-xs border-[#2c3044] hover:bg-rose-500/10 text-slate-300 rounded-lg"
                    >
                      Tandai Dibaca
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
