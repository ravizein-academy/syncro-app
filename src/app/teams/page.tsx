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

export default function TeamsPage() {
  const { users, tasks, updateUserRole, addUser } = useStore();
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
    <div className="p-8 space-y-8 max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-rose-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Team Allocation</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5 mt-1">
            <Users className="text-rose-500" />
            Teams & Workload
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manajemen peran anggota, pemantauan kapasitas beban kerja ClickUp-style, dan sub-divisi tim.
          </p>
        </div>

        <Dialog open={openInvite} onOpenChange={setOpenInvite}>
          <DialogTrigger
            render={
              <Button className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs gap-1.5 h-9 shadow-md shadow-rose-950/40 rounded-lg">
                <Plus size={14} />
                <span>Undang Anggota</span>
              </Button>
            }
          />
          <DialogContent className="bg-[#12131b] border-[#222533] text-slate-100 sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Undang Anggota Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleInviteUser} className="space-y-4 pt-2">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Nama Lengkap</label>
                <Input
                  required
                  placeholder="e.g. Budi Santoso"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-[#181a24] border-[#252837] text-sm focus-visible:ring-rose-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Alamat Email</label>
                <Input
                  required
                  type="email"
                  placeholder="budi@syncro.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#181a24] border-[#252837] text-sm focus-visible:ring-rose-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Divisi / Sub-Team</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full h-9 rounded-md bg-[#181a24] border border-[#252837] text-sm px-3 text-slate-200 focus:outline-none focus:border-rose-500"
                  >
                    <option value="Engineering">@Engineering</option>
                    <option value="Product">@Product</option>
                    <option value="Design">@Design</option>
                    <option value="IT-Support">@IT-Support</option>
                    <option value="Marketing">@Marketing</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Peran (Role)</label>
                  <select
                    value={role}
                    onChange={(e: any) => setRole(e.target.value)}
                    className="w-full h-9 rounded-md bg-[#181a24] border border-[#252837] text-sm px-3 text-slate-200 focus:outline-none focus:border-rose-500"
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="guest">Guest</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setOpenInvite(false)} className="text-xs">
                  Batal
                </Button>
                <Button type="submit" className="bg-rose-600 hover:bg-rose-500 text-xs font-semibold">
                  Kirim Undangan
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sub-Teams / User Groups Overview */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-xs font-bold text-slate-400 mr-2">Divisi & Sub-Teams:</span>
        {["@Engineering", "@Product", "@Design", "@IT-Support", "@Admin"].map((tag) => (
          <span
            key={tag}
            className="bg-[#12131b] border border-[#222533] text-rose-300 hover:border-rose-500/50 text-xs px-2.5 py-1 rounded-full cursor-pointer transition font-medium"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Workload & Capacity Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="text-rose-500" size={20} />
            Workload & Capacity Tracking
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Mencegah burnout dengan memantau jam kerja yang dialokasikan vs kapasitas maksimal per minggu.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {users.map((user) => {
            const workloadHours = getUserWorkload(user.id);
            const capacity = user.capacityHours || 40;
            const percentage = Math.round((workloadHours / capacity) * 100);
            const isOverloaded = percentage > 85;

            return (
              <Card key={user.id} className="bg-[#12131b] border-[#222533] p-4 shadow-sm hover:border-rose-500/40 transition">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-rose-500 to-red-700 flex items-center justify-center font-bold text-xs text-white shadow ring-1 ring-rose-400/30">
                      {user.avatar || user.name.substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{user.name}</h4>
                      <span className="text-[11px] text-slate-400 font-mono">@{user.department}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-white">
                      {workloadHours}h <span className="text-slate-500 font-normal">/ {capacity}h</span>
                    </span>
                    <span
                      className={`text-[10px] block font-semibold ${
                        isOverloaded ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {percentage}% Kapasitas
                    </span>
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                <div className="w-full bg-[#1e202d] h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      isOverloaded
                        ? "bg-rose-500 animate-pulse"
                        : percentage > 60
                        ? "bg-amber-400"
                        : "bg-rose-600"
                    }`}
                    style={{ width: `${Math.min(100, percentage)}%` }}
                  />
                </div>

                {isOverloaded && (
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-rose-400">
                    <AlertTriangle size={12} />
                    <span>Peringatan: Beban kerja mendekati batas maksimal (Potensi Burnout).</span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* User & Role Management Table */}
      <div className="space-y-4 pt-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="text-rose-500" size={20} />
          User & Role Management
        </h2>

        <div className="border border-[#222533] rounded-xl overflow-hidden bg-[#12131b]/80 shadow-sm">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#161722] text-slate-400 uppercase tracking-wider text-[11px] border-b border-[#222533]">
              <tr>
                <th className="p-3.5 pl-4">Pengguna</th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5">Divisi</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5 pr-4 text-right">Ubah Peran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e202d]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition">
                  <td className="p-3.5 pl-4 font-semibold text-white flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-[#181a24] border border-[#2c3044] flex items-center justify-center text-[11px] font-bold text-rose-300">
                      {u.avatar || u.name[0]}
                    </div>
                    {u.name}
                  </td>
                  <td className="p-3.5 text-slate-400">{u.email}</td>
                  <td className="p-3.5">
                    <span className="bg-[#181a24] text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono border border-[#252837]">
                      @{u.department}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.role === "admin"
                          ? "bg-rose-950/60 text-rose-300 border border-rose-800/50"
                          : u.role === "member"
                          ? "bg-red-950/60 text-red-300 border border-red-800/50"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3.5 pr-4 text-right">
                    <select
                      value={u.role}
                      onChange={(e: any) => updateUserRole(u.id, e.target.value)}
                      className="bg-[#181a24] border border-[#2c3044] text-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-rose-500"
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="guest">Guest</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
