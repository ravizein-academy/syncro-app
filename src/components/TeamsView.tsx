'use client';

import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Activity
} from 'lucide-react';

export function TeamsView() {
  const { users, tasks, updateUserCapacity } = useAppStore();
  const [selectedDivision, setSelectedDivision] = useState<string>('all');

  const getUserWorkload = (userId: string) => {
    const activeTasks = tasks.filter((t) => t.assignedTo === userId && t.status !== 'done');
    const totalMinutes = activeTasks.reduce((acc, curr) => acc + (curr.durationMinutes || 60), 0);
    const assignedHours = Math.round((totalMinutes / 60) * 10) / 10;
    return {
      taskCount: activeTasks.length,
      assignedHours,
      activeTasks
    };
  };

  const filteredUsers = users.filter((u) => {
    if (selectedDivision === 'all') return true;
    return u.team.toLowerCase().includes(selectedDivision.toLowerCase());
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#ee3425]" />
              Syncro - Teams & Workload Management
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pantau kapasitas kerja tim, alokasi tugas, dan cegah burnout pada anggota tim.
            </p>
          </div>

          {/* Division Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Divisi:</span>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="bg-white border border-slate-200 text-xs text-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#ee3425] shadow-2xs"
            >
              <option value="all">Semua Divisi</option>
              <option value="Product">Product & Architecture</option>
              <option value="Engineering">Engineering</option>
              <option value="Cyber">Cyber Security</option>
              <option value="Design">Product Design</option>
            </select>
          </div>
        </div>

        {/* Workload Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-[#ee3425]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Anggota</p>
              <h3 className="text-xl font-bold text-slate-900">{users.length} Anggota</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Tugas Aktif Terbagi</p>
              <h3 className="text-xl font-bold text-slate-900">
                {tasks.filter((t) => t.status !== 'done').length} Tugas
              </h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Rata-rata Utilisasi</p>
              <h3 className="text-xl font-bold text-slate-900">68% Kapasitas</h3>
            </div>
          </div>
        </div>

        {/* User Workload & Capacity Cards */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Workload & Kapasitas Tim Syncro
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUsers.map((user) => {
              const { taskCount, assignedHours } = getUserWorkload(user.id);
              const maxHours = user.weeklyCapacityHours || 40;
              const loadPercentage = Math.min(100, Math.round((assignedHours / maxHours) * 100));
              const isOverloaded = assignedHours > maxHours;

              return (
                <div
                  key={user.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-11 h-11 rounded-full object-cover border border-slate-200 shadow-2xs"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          {user.name}
                          <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                            {user.role}
                          </span>
                        </h4>
                        <p className="text-xs text-slate-500">{user.team}</p>
                      </div>
                    </div>

                    {isOverloaded ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-[#ee3425] bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" /> Overload
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Optimal
                      </span>
                    )}
                  </div>

                  {/* Capacity Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Beban Kerja Mingguan</span>
                      <span className="font-mono text-slate-700 font-medium">
                        <strong className="text-slate-900">{assignedHours}h</strong> / {maxHours}h ({loadPercentage}%)
                      </span>
                    </div>

                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOverloaded
                            ? 'bg-[#ee3425]'
                            : loadPercentage > 75
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, loadPercentage)}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer details */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>{taskCount} Tugas Aktif</span>
                    <button
                      onClick={() => {
                        const newCap = prompt('Ubah kapasitas jam mingguan:', String(maxHours));
                        if (newCap && !isNaN(Number(newCap))) {
                          updateUserCapacity(user.id, Number(newCap));
                        }
                      }}
                      className="text-[11px] font-semibold text-[#ee3425] hover:underline cursor-pointer"
                    >
                      Ubah Kapasitas
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity Stream Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#ee3425]" />
              Activity Stream Tim Syncro
            </h3>
            <span className="text-[11px] text-slate-400">Real-time Stream</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <div>
                <p className="text-slate-800">
                  <strong className="text-slate-900">Ravi Zein</strong> menyelesaikan tugas{' '}
                  <span className="text-[#ee3425] font-semibold">"Deploy Google Apps Script REST API"</span>.
                </p>
                <span className="text-[10px] text-slate-400">12 menit yang lalu</span>
              </div>
            </div>

            <div className="py-2.5 flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#ee3425] mt-1.5 shrink-0" />
              <div>
                <p className="text-slate-800">
                  <strong className="text-slate-900">Alex Rivera</strong> memulai time tracking pada{' '}
                  <span className="text-[#ee3425] font-semibold">"Audit DNS Block List SOC Assessment"</span>.
                </p>
                <span className="text-[10px] text-slate-400">45 menit yang lalu</span>
              </div>
            </div>

            <div className="py-2.5 flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <div>
                <p className="text-slate-800">
                  <strong className="text-slate-900">Sarah Connor</strong> memperbarui checklist subtask di{' '}
                  <span className="text-[#ee3425] font-semibold">"SOP Konfigurasi Mac Mini Student Lab"</span>.
                </p>
                <span className="text-[10px] text-slate-400">1 jam yang lalu</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
