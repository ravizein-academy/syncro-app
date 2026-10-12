"use client";

import { useState, useEffect } from "react";
import { useStore, User } from "@/store/useStore";
import { 
  Inbox, 
  CheckCheck, 
  Bell,
  Clock,
  Check,
  X,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { translations } from "@/lib/i18n";

export default function InboxPage() {
  const { 
    users, 
    notifications, 
    currentUser, 
    approveUser, 
    rejectUser, 
    setUsers, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    language 
  } = useStore();
  const t = translations[language || 'id'];

  const [activeTab, setActiveTab] = useState<"requests" | "notifications">("requests");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingConfigs, setPendingConfigs] = useState<Record<string, { role: "admin" | "member" | "guest"; department: string }>>({});

  const refreshUsers = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/users", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const fetchedUsers = data?.data?.users || data?.users || [];
        if (Array.isArray(fetchedUsers) && fetchedUsers.length > 0) {
          setUsers(fetchedUsers);
        }
      }
    } catch (err) {
      console.warn("Failed to refresh users in Inbox:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshUsers();
    const timer = setInterval(() => {
      refreshUsers();
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const pendingRequests = users.filter((u) => u.status === "pending");
  const filteredNotifications = notifications.filter((n) => (filter === "unread" ? !n.read : true));

  return (
    <div className="p-3 sm:p-5 md:p-8 space-y-4 sm:space-y-6 max-w-5xl mx-auto select-none transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-rose-500 shadow-sm" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              {language === 'en' ? 'Notification & Approval Center' : 'Pusat Izin Masuk & Notifikasi'}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3 mt-1">
            <Inbox className="text-rose-500" />
            {t.inboxTitle}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {language === 'en'
              ? 'Review new user login permission requests and team activities.'
              : 'Pusat izin akses masuk pengguna baru, penugasan, dan pembaruan sistem.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentUser?.role === 'admin' && (
            <Button
              variant="outline"
              size="sm"
              onClick={refreshUsers}
              disabled={isRefreshing}
              className="h-9 text-xs gap-1.5 border-border text-foreground hover:bg-secondary rounded-lg"
            >
              <RefreshCw size={13} className={isRefreshing ? "animate-spin text-rose-500" : ""} />
              <span>{language === 'en' ? 'Refresh' : 'Segarkan Data'}</span>
            </Button>
          )}

          {activeTab === 'notifications' && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllNotificationsAsRead}
              className="h-9 text-xs gap-1.5 border-border text-foreground hover:bg-accent rounded-lg"
            >
              <CheckCheck size={14} className="text-rose-500" />
              <span>{t.markAllRead}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Admin Tab Switcher */}
      {currentUser?.role === 'admin' && (
        <div className="flex items-center border-b border-border gap-2">
          <button
            onClick={() => setActiveTab("requests")}
            className={`pb-3 px-3 text-xs font-bold transition-all relative flex items-center gap-2 ${
              activeTab === "requests"
                ? "text-rose-600 dark:text-rose-400 border-b-2 border-rose-600"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserPlus size={15} />
            <span>Permintaan Izin Masuk</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              pendingRequests.length > 0
                ? "bg-amber-500 text-slate-950 animate-pulse shadow-sm shadow-amber-500/30"
                : "bg-secondary text-muted-foreground"
            }`}>
              {pendingRequests.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("notifications")}
            className={`pb-3 px-3 text-xs font-bold transition-all relative flex items-center gap-2 ${
              activeTab === "notifications"
                ? "text-rose-600 dark:text-rose-400 border-b-2 border-rose-600"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bell size={15} />
            <span>Pemberitahuan Sistem</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-semibold bg-secondary text-muted-foreground">
              {notifications.length}
            </span>
          </button>
        </div>
      )}

      {/* TAB 1: Permintaan Izin Masuk (Khusus Admin) */}
      {currentUser?.role === 'admin' && activeTab === 'requests' && (
        <div className="space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-20 bg-card border border-border rounded-2xl shadow-sm space-y-2">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-2">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-base font-bold text-foreground">Tidak Ada Permintaan Masuk</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Semua pengguna baru yang meminta akses telah Anda setujui (ACC). Jika ada pengguna baru mencoba login, permintaan izin mereka akan langsung muncul di sini.
              </p>
            </div>
          ) : (
            <div className="grid gap-3.5">
              {pendingRequests.map((pUser) => {
                const config = pendingConfigs[pUser.id] || {
                  role: pUser.role || 'member',
                  department: pUser.department || 'Product & Tech',
                };

                return (
                  <Card
                    key={pUser.id}
                    className="bg-card border-amber-500/40 p-4 sm:p-5 shadow-sm bg-gradient-to-r from-amber-500/10 via-card to-card rounded-2xl relative overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* User Info */}
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-bold text-sm text-white shadow ring-2 ring-amber-400/40 shrink-0">
                          {pUser.avatar || pUser.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-foreground truncate">{pUser.name}</h4>
                            <span className="text-[9px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold border border-amber-500/30">
                              Minta Izin Masuk
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{pUser.email}</p>
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground/80 mt-1">
                            <Clock size={12} className="text-amber-500" />
                            <span>Waktu Permintaan: {pUser.requestedAt || 'Baru saja'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Approval Controls & Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                        {/* Role Selector */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-muted-foreground font-semibold">Role:</span>
                          <select
                            value={config.role}
                            onChange={(e) =>
                              setPendingConfigs((prev) => ({
                                ...prev,
                                [pUser.id]: { ...config, role: e.target.value as any },
                              }))
                            }
                            className="h-8 rounded-lg bg-secondary border border-border text-xs px-2.5 text-foreground focus:outline-none focus:border-amber-500 font-semibold"
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                            <option value="guest">Guest</option>
                          </select>
                        </div>

                        {/* Department Selector */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-muted-foreground font-semibold">Divisi:</span>
                          <select
                            value={config.department}
                            onChange={(e) =>
                              setPendingConfigs((prev) => ({
                                ...prev,
                                [pUser.id]: { ...config, department: e.target.value },
                              }))
                            }
                            className="h-8 rounded-lg bg-secondary border border-border text-xs px-2.5 text-foreground focus:outline-none focus:border-amber-500 font-semibold"
                          >
                            <option value="Product & Tech">Product & Tech</option>
                            <option value="Engineering">Engineering</option>
                            <option value="Design">Design</option>
                            <option value="Marketing">Marketing</option>
                            <option value="Operations">Operations</option>
                          </select>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-1 sm:pt-0">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              approveUser(pUser.id, config.role, config.department, pUser.email);
                            }}
                            className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm gap-1.5 px-3"
                          >
                            <Check size={14} />
                            <span>Setujui (ACC)</span>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Tolak dan hapus permintaan izin dari ${pUser.name}?`)) {
                                rejectUser(pUser.id, pUser.email);
                              }
                            }}
                            className="h-8 text-xs font-semibold text-red-500 border-red-500/30 hover:bg-red-500/10 rounded-lg px-2.5"
                          >
                            <X size={14} />
                            <span>Tolak</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Pemberitahuan Sistem (Umum & Non-Admin) */}
      {(currentUser?.role !== 'admin' || activeTab === 'notifications') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
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
          </div>

          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-20 bg-card border border-border rounded-2xl shadow-sm">
                <Bell size={40} className="mx-auto text-muted-foreground mb-3 opacity-60" />
                <h3 className="text-base font-bold text-foreground">{t.allCaughtUp}</h3>
                <p className="text-xs text-muted-foreground mt-1">{t.allCaughtUpSub}</p>
              </div>
            ) : (
              filteredNotifications.map((item) => (
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
      )}
    </div>
  );
}
