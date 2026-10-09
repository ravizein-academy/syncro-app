"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { 
  Inbox, 
  CheckCheck, 
  Bell 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { translations } from "@/lib/i18n";

export default function InboxPage() {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, language } = useStore();
  const t = translations[language || 'id'];

  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filtered = notifications.filter((n) => (filter === "unread" ? !n.read : true));

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto select-none transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-rose-500 shadow-sm" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">{t.inboxTag}</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3 mt-1">
            <Inbox className="text-rose-500" />
            {t.inboxTitle}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {t.inboxSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-secondary border border-border p-1 rounded-xl flex shadow-inner">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === "all" ? "bg-rose-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.allNotifications} ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === "unread" ? "bg-rose-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.unreadNotifications} ({notifications.filter((n) => !n.read).length})
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={markAllNotificationsAsRead}
            className="h-8 text-xs gap-1.5 border-border text-foreground hover:bg-accent rounded-lg"
          >
            <CheckCheck size={14} className="text-rose-500" />
            <span>{t.markAllRead}</span>
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-card border border-border rounded-2xl shadow-sm">
            <Bell size={40} className="mx-auto text-muted-foreground mb-3 opacity-60" />
            <h3 className="text-base font-bold text-foreground">{t.allCaughtUp}</h3>
            <p className="text-xs text-muted-foreground mt-1">{t.allCaughtUpSub}</p>
          </div>
        ) : (
          filtered.map((item) => (
            <Card
              key={item.id}
              className={`border-border transition ${
                item.read ? "bg-card/60 opacity-70" : "bg-card shadow-sm border-rose-500/30"
              }`}
            >
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      item.type === "system"
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-300 border border-rose-500/20"
                        : "bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30"
                    }`}
                  >
                    {item.sender[0]}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-foreground">
                      <strong className="font-bold">{item.sender}</strong>{" "}
                      <span className="text-muted-foreground">{item.action}</span>{" "}
                      <span className="font-semibold text-rose-600 dark:text-rose-300">"{item.target}"</span>
                    </p>
                    <span className="text-[11px] text-muted-foreground mt-0.5 block">{item.time}</span>
                  </div>
                </div>

                {!item.read && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => markNotificationAsRead(item.id)}
                    className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-500 hover:bg-rose-500/10"
                  >
                    Tandai Dibaca
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
