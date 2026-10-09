"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { 
  Inbox, 
  CheckCheck, 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  UserPlus, 
  Calendar,
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
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
            <Inbox className="text-blue-400" />
            Inbox
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Pusat notifikasi penugasan, aktivitas tim, dan update sistem Syncro.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filter === "all" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Semua ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filter === "unread" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Belum Dibaca ({notifications.filter((n) => !n.read).length})
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={markAllNotificationsAsRead}
            className="h-8 text-xs gap-1.5 border-slate-800 text-slate-300 hover:bg-slate-800"
          >
            <CheckCheck size={14} />
            <span>Tandai Semua Dibaca</span>
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
            <Bell size={40} className="mx-auto text-slate-600 mb-3" />
            <h3 className="text-base font-semibold text-slate-300">Semua pemberitahuan sudah terbaca</h3>
            <p className="text-xs text-slate-500 mt-1">Tidak ada notifikasi baru untuk saat ini.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <Card
              key={item.id}
              className={`border-slate-800 transition ${
                item.read ? "bg-slate-950/60 opacity-70" : "bg-slate-900 shadow-sm border-blue-500/20"
              }`}
            >
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      item.type === "system"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                    }`}
                  >
                    {item.sender[0]}
                  </div>
                  <div>
                    <p className="text-sm text-slate-200">
                      <strong className="font-semibold text-slate-100">{item.sender}</strong>{" "}
                      <span className="text-slate-400">{item.action}</span>{" "}
                      <strong className="text-blue-400 font-medium">"{item.target}"</strong>
                    </p>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">{item.time}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link href="/tasks">
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-400 hover:text-slate-100">
                      <ExternalLink size={13} className="mr-1" />
                      Lihat Task
                    </Button>
                  </Link>
                  {!item.read && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markNotificationAsRead(item.id)}
                      className="h-8 text-xs border-slate-700 hover:bg-slate-800 text-slate-300"
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
