"use client";

import { useState } from "react";
import { useStore, User } from "@/store/useStore";
import { 
  Users, 
  ShieldCheck, 
  UserCheck, 
  Activity, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Tag, 
  Mail 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

  // Calculate workload in hours per user
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
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
            <Users className="text-blue-400" />
            Teams & Workload
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manajemen peran anggota, pemantauan kapasitas beban kerja, dan sub-divisi tim.
          </p>
        </div>

        <Dialog open={openInvite} onOpenChange={setOpenInvite}>
          <DialogTrigger
            render={
              <Button className="bg-blue-600 hover:bg-blue-500 text-xs gap-1.5 h-9">
                <Plus size={14} />
                <span>Undang Anggota</span>
              </Button>
            }
          />
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Undang Anggota Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleInviteUser} className="space-y-4 pt-2">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Nama Lengkap</label>
                <Input
                  required
                  placeholder="e.g. Budi Santoso"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-sm"
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
                  className="bg-slate-950 border-slate-800 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Divisi / Sub-Team</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full h-9 rounded-md bg-slate-950 border border-slate-800 text-sm px-3 text-slate-200"
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
                    className="w-full h-9 rounded-md bg-slate-950 border border-slate-800 text-sm px-3 text-slate-200"
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
                <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-xs">
                  Kirim Undangan
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sub-Teams / User Groups Overview (PRD 4.4) */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-xs font-semibold text-slate-400 mr-2">Divisi & Sub-Teams:</span>
        {["@Engineering", "@Product", "@Design", "@IT-Support", "@Admin"].map((tag) => (
          <span
            key={tag}
            className="bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700 text-xs px-2.5 py-1 rounded-full cursor-pointer transition"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Workload & Capacity Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Activity className="text-indigo-400" size={20} />
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
              <Card key={user.id} className="bg-slate-900/90 border-slate-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                      {user.avatar || user.name.substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-100">{user.name}</h4>
                      <span className="text-[11px] text-slate-400">@{user.department}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-xs font-semibold text-slate-200">
                      {workloadHours}h <span className="text-slate-500">/ {capacity}h</span>
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
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      isOverloaded
                        ? "bg-rose-500"
                        : percentage > 60
                        ? "bg-amber-400"
                        : "bg-blue-500"
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

      {/* User & Role Management Table (PRD 4.4) */}
      <div className="space-y-4 pt-2">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <ShieldCheck className="text-emerald-400" size={20} />
          User & Role Management
        </h2>

        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60 shadow-sm">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-3.5 pl-4">Pengguna</th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5">Divisi</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5 pr-4 text-right">Ubah Peran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3.5 pl-4 font-semibold text-slate-100 flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px] font-bold">
                      {u.avatar || u.name[0]}
                    </div>
                    {u.name}
                  </td>
                  <td className="p-3.5 text-slate-400">{u.email}</td>
                  <td className="p-3.5">
                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono">
                      @{u.department}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.role === "admin"
                          ? "bg-purple-900/40 text-purple-400 border border-purple-800/50"
                          : u.role === "member"
                          ? "bg-blue-900/40 text-blue-400 border border-blue-800/50"
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
                      className="bg-slate-950 border border-slate-800 text-slate-300 rounded px-2 py-1 text-xs"
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
