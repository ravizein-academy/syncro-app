"use client";

import { useState, useEffect } from "react";
import { useStore, User } from "@/store/useStore";
import Link from "next/link";
import { 
  Users, 
  ShieldCheck, 
  Activity, 
  AlertTriangle, 
  Plus,
  MessageSquare,
  Clock,
  Check,
  X,
  RefreshCw,
  UserCheck
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { translations } from "@/lib/i18n";

export default function TeamsPage() {
  const { users, tasks, currentUser, updateUserRole, addUser, approveUser, rejectUser, setUsers, language } = useStore();
  const t = translations[language || 'id'];

  const [openInvite, setOpenInvite] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [role, setRole] = useState<"admin" | "member" | "guest">("member");

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
      console.warn("Failed to refresh users:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  const pendingUsers = users.filter((u) => u.status === "pending");
  const activeUsers = users.filter((u) => u.status !== "pending");

  const getUserWorkload = (userId: string) => {
    const userTasks = tasks.filter((t) => t.assigneeId === userId && t.status !== "done");
    const totalMinutes = userTasks.reduce((acc, t) => acc + (t.timeEstimate || 60), 0);
    return Math.round((totalMinutes / 60) * 10) / 10;
  };

  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    addUser({
      name,
      email,
      department,
      role,
      capacityHours: 40,
      avatar: name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2),
      status: "active",
    });

    setName("");
    setEmail("");
    setOpenInvite(false);
  };

  return (
    <div className="p-3 sm:p-5 md:p-8 space-y-6 max-w-7xl mx-auto select-none transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-rose-500 shadow-sm" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">{t.teamTag}</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5 mt-1">
            <Users className="text-rose-500" />
            {t.teamTitle}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {t.teamSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentUser?.role === 'admin' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={refreshUsers}
              disabled={isRefreshing}
              className="h-9 text-xs gap-1.5 border-border hover:bg-secondary text-foreground"
            >
              <RefreshCw size={13} className={isRefreshing ? "animate-spin text-rose-500" : ""} />
              <span>{language === 'en' ? 'Refresh' : 'Segarkan Data'}</span>
            </Button>
          )}

          {currentUser?.role === 'admin' && (
            <Dialog open={openInvite} onOpenChange={setOpenInvite}>
              <DialogTrigger
                render={
                  <Button className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs gap-1.5 h-9 shadow-md shadow-rose-950/40 rounded-lg">
                    <Plus size={14} />
                    <span>{t.inviteMemberBtn}</span>
                  </Button>
                }
              />
              <DialogContent className="bg-card border-border text-foreground sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold">{t.inviteMemberBtn}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleInviteUser} className="space-y-4 pt-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{t.inviteNameLabel}</label>
                    <Input
                      required
                      placeholder="e.g. Budi Santoso"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-secondary border-border text-sm focus-visible:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{t.inviteEmailLabel}</label>
                    <Input
                      required
                      type="email"
                      placeholder="budi@syncro.io"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-secondary border-border text-sm focus-visible:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{t.inviteDeptLabel}</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full h-9 rounded-md bg-secondary border border-border text-sm px-3 text-foreground focus:outline-none focus:border-rose-500"
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Product">Product</option>
                      <option value="Design">Design</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Operations">Operations</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{t.inviteRoleLabel}</label>
                    <select
                      value={role}
                      onChange={(e: any) => setRole(e.target.value)}
                      className="w-full h-9 rounded-md bg-secondary border border-border text-sm px-3 text-foreground focus:outline-none focus:border-rose-500"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                      <option value="guest">Guest</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setOpenInvite(false)}>
                      {t.modalCancel}
                    </Button>
                    <Button type="submit" size="sm" className="bg-rose-600 hover:bg-rose-500 text-white font-semibold">
                      {t.inviteSubmitBtn}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Admin Approval Section: Menunggu Persetujuan Admin */}
      {currentUser?.role === 'admin' && (
        <div className="space-y-3 p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="text-amber-500" size={18} />
              <div>
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span>{language === 'en' ? 'Pending Admin Approvals' : 'Menunggu Persetujuan Admin (ACC)'}</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    pendingUsers.length > 0
                      ? 'bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/40'
                      : 'bg-secondary text-muted-foreground'
                  }`}>
                    {pendingUsers.length}
                  </span>
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  {language === 'en'
                    ? 'Review login requests, assign roles, and approve new users before they can access the workspace.'
                    : 'Pengguna baru yang login pertama kali. Tentukan Role & Departemen lalu klik Setujui (ACC).'}
                </p>
              </div>
            </div>
          </div>

          {pendingUsers.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-2">
              {pendingUsers.map((pUser) => {
                const config = pendingConfigs[pUser.id] || {
                  role: pUser.role || 'member',
                  department: pUser.department || 'Product & Tech',
                };

                return (
                  <Card
                    key={pUser.id}
                    className="bg-card border-amber-500/40 p-4 space-y-3 shadow-sm bg-gradient-to-b from-amber-500/10 to-card relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-bold text-xs text-white shadow ring-2 ring-amber-400/30 shrink-0">
                          {pUser.avatar || pUser.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-foreground truncate">{pUser.name}</h4>
                            <span className="text-[9px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.2 rounded font-semibold border border-amber-500/30 shrink-0">
                              Pending
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">{pUser.email}</p>
                          {pUser.requestedAt && (
                            <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                              {pUser.requestedAt}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Role and Department Selectors */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
                      <div>
                        <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                          Role
                        </label>
                        <select
                          value={config.role}
                          onChange={(e) =>
                            setPendingConfigs((prev) => ({
                              ...prev,
                              [pUser.id]: { ...config, role: e.target.value as any },
                            }))
                          }
                          className="w-full h-8 rounded-lg bg-secondary border border-border text-[11px] px-2 text-foreground focus:outline-none focus:border-amber-500"
                        >
                          <option value="member">Member</option>
                          <option value="guest">Guest</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                          Departemen
                        </label>
                        <select
                          value={config.department}
                          onChange={(e) =>
                            setPendingConfigs((prev) => ({
                              ...prev,
                              [pUser.id]: { ...config, department: e.target.value },
                            }))
                          }
                          className="w-full h-8 rounded-lg bg-secondary border border-border text-[11px] px-2 text-foreground focus:outline-none focus:border-amber-500"
                        >
                          <option value="Product & Tech">Product & Tech</option>
                          <option value="Engineering">Engineering</option>
                          <option value="Design">Design</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Operations">Operations</option>
                        </select>
                      </div>
                    </div>

                    {/* Action Buttons: Setujui (ACC) & Tolak */}
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          approveUser(pUser.id, config.role, config.department);
                        }}
                        className="flex-1 h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm gap-1"
                      >
                        <Check size={13} />
                        <span>Setujui (ACC)</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Tolak dan hapus permintaan dari ${pUser.name}?`)) {
                            rejectUser(pUser.id);
                          }
                        }}
                        className="h-8 text-xs font-semibold text-red-500 border-red-500/30 hover:bg-red-500/10 rounded-lg px-2.5"
                      >
                        <X size={13} />
                        <span>Tolak</span>
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="p-3 bg-secondary/30 border border-border/50 rounded-xl text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <UserCheck size={14} className="text-emerald-500" />
              <span>
                {language === 'en'
                  ? 'No pending access requests. All registered users are approved and active.'
                  : 'Tidak ada permintaan akses yang menunggu. Semua akun telah disetujui (ACC) dan aktif.'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Member Cards Grid */}
      {activeUsers.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border rounded-2xl bg-card/50 flex flex-col items-center justify-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground">
            <Users size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Belum Ada Anggota Tim Aktif</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              Daftarkan akun atau undang anggota tim pertama Anda untuk mulai berkolaborasi.
            </p>
          </div>
          <Button onClick={() => setOpenInvite(true)} size="sm" className="bg-[#EE3726] hover:bg-[#D32717] text-white">
            <Plus size={14} className="mr-1.5" />
            {t.inviteMemberBtn}
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activeUsers.map((user) => {
            const workloadHours = getUserWorkload(user.id);
            const percentLoad = Math.min(100, Math.round((workloadHours / (user.capacityHours || 40)) * 100));
            const isOverloaded = percentLoad > 85;

          return (
            <Card
              key={user.id}
              className={`bg-card border-border p-5 space-y-4 hover:border-rose-500/50 transition shadow-sm ${
                isOverloaded ? "border-rose-500/50" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-gradient-to-br from-rose-500 to-red-700 flex items-center justify-center font-bold text-sm text-white shadow ring-2 ring-rose-400/30">
                    {user.avatar || user.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{user.name}</h3>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <span className="inline-block mt-1 bg-secondary text-rose-600 dark:text-rose-300 border border-border text-[10px] px-2 py-0.5 rounded font-semibold">
                      @{user.department}
                    </span>
                  </div>
                </div>

                {currentUser?.role === 'admin' ? (
                  <select
                    value={user.role}
                    onChange={(e: any) => updateUserRole(user.id, e.target.value)}
                    className="bg-secondary border border-border text-[11px] rounded-lg px-2 py-1 text-foreground focus:outline-none focus:border-rose-500 capitalize"
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="guest">Guest</option>
                  </select>
                ) : (
                  <span className="bg-secondary border border-border text-[10px] font-semibold rounded-md px-2 py-0.5 text-muted-foreground uppercase">
                    {user.role}
                  </span>
                )}
              </div>

              {/* Capacity & Workload Bar */}
              <div className="space-y-1.5 pt-2 border-t border-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t.workloadLabel} <strong className="text-foreground">{workloadHours}j</strong></span>
                  <span className="text-muted-foreground">{t.capacityLabel} <strong className="text-foreground">{user.capacityHours || 40}j/mgg</strong></span>
                </div>

                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isOverloaded ? "bg-rose-600" : percentLoad > 50 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${percentLoad}%` }}
                  />
                </div>

                {isOverloaded && (
                  <div className="flex items-center gap-1.5 text-[10px] text-rose-600 dark:text-rose-400 font-semibold pt-1">
                    <AlertTriangle size={12} />
                    <span>{t.burnoutWarning}</span>
                  </div>
                )}
              </div>

              {/* Quick Communication Action */}
              <div className="pt-2 flex justify-end">
                <Link
                  href={`/dm?userId=${user.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#EE3726] hover:text-white bg-[#EE3726]/10 hover:bg-[#EE3726] px-3 py-1.5 rounded-lg border border-[#EE3726]/20 transition-all shadow-2xs"
                >
                  <MessageSquare size={13} />
                  <span>Kirim Pesan (DM)</span>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
      )}
    </div>
  );
}
