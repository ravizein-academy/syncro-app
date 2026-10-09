"use client";

import { useState } from "react";
import { useStore, User } from "@/store/useStore";
import { 
  Users, 
  ShieldCheck, 
  Activity, 
  AlertTriangle, 
  Plus 
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { translations } from "@/lib/i18n";

export default function TeamsPage() {
  const { users, tasks, updateUserRole, addUser, language } = useStore();
  const t = translations[language || 'id'];

  const [openInvite, setOpenInvite] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [role, setRole] = useState<"admin" | "member" | "guest">("member");

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
      </div>

      {/* Member Cards Grid */}
      {users.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border rounded-2xl bg-card/50 flex flex-col items-center justify-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground">
            <Users size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Belum Ada Anggota Tim</h3>
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
          {users.map((user) => {
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

                <select
                  value={user.role}
                  onChange={(e: any) => updateUserRole(user.id, e.target.value)}
                  className="bg-secondary border border-border text-[11px] rounded-lg px-2 py-1 text-foreground focus:outline-none focus:border-rose-500"
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="guest">Guest</option>
                </select>
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
            </Card>
          );
        })}
      </div>
      )}
    </div>
  );
}
