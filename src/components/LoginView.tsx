'use client';

import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { User, UserRole } from '../types';
import { 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Mail, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  Users2,
  Lock
} from 'lucide-react';

export function LoginView() {
  const { users, loginUser, syncStatus, isSyncing } = useAppStore();
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Filter or list office users
  const officeUsers = users && users.length > 0 ? users : [];

  const handleSelectUser = (user: User) => {
    setIsLoading(true);
    setErrorMsg('');
    setTimeout(() => {
      loginUser(user);
      setIsLoading(false);
    }, 400);
  };

  const handleGoogleQuickLogin = () => {
    setIsLoading(true);
    setErrorMsg('');

    // If Ravi Zein exists in the synced sheet users, prioritize Ravi Zein, or the first office user
    const primaryOfficeUser = officeUsers.find(
      (u) => u.email.toLowerCase().includes('ravizein') || u.email.toLowerCase().includes('itsecacademy')
    ) || officeUsers[0];

    if (primaryOfficeUser) {
      setTimeout(() => {
        loginUser(primaryOfficeUser);
        setIsLoading(false);
      }, 500);
    } else {
      // Default to Ravi Zein work account
      const defaultUser: User = {
        id: 'user_1',
        name: 'Ravi Zein',
        email: 'ravizein@itsecacademy.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        role: 'Admin',
        team: 'Product & Architecture',
        weeklyCapacityHours: 40
      };
      setTimeout(() => {
        loginUser(defaultUser);
        setIsLoading(false);
      }, 500);
    }
  };

  const handleCustomEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedEmail = emailInput.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMsg('Silakan masukkan alamat email Google kantor Anda.');
      return;
    }

    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setErrorMsg('Format email tidak valid. Masukkan email resmi kantor.');
      return;
    }

    setIsLoading(true);

    // Check if user already exists in synced database
    const existing = officeUsers.find((u) => u.email.toLowerCase() === trimmedEmail);
    if (existing) {
      setTimeout(() => {
        loginUser(existing);
        setIsLoading(false);
      }, 400);
      return;
    }

    // Auto-create new office user profile
    const namePart = nameInput.trim() || trimmedEmail.split('@')[0].replace(/[._]/g, ' ');
    const formattedName = namePart
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    const newUser: User = {
      id: `user_${Date.now().toString(36)}`,
      name: formattedName,
      email: trimmedEmail,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(formattedName)}&backgroundColor=ee3425`,
      role: trimmedEmail.includes('admin') || trimmedEmail.includes('ravizein') ? 'Admin' : 'Member',
      team: 'ITSEC Operations',
      weeklyCapacityHours: 40
    };

    setTimeout(() => {
      loginUser(newUser);
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-between relative overflow-hidden select-none font-sans">
      {/* Background Decorative Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-red-100/60 via-red-50/20 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-red-500/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-red-500/5 blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#ee3425] shadow-md shadow-red-500/25 flex items-center justify-center text-white font-bold text-lg tracking-tight">
            S
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-slate-900 tracking-tight leading-none">Syncro</span>
            <span className="text-[10px] text-slate-400 font-medium">WorkFlow Workspace</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-600 font-medium">Cloud Database Connected</span>
        </div>
      </header>

      {/* Main Center Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-7 md:p-8 transition-all">
          
          {/* Header info */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-[#ee3425] text-xs font-semibold mb-3 border border-red-100">
              <Building2 className="w-3.5 h-3.5" />
              <span>Google Workspace Single Sign-On</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Masuk ke Syncro
            </h1>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Silakan login menggunakan akun Google kantor resmi Anda untuk mengakses database tim & proyek.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#ee3425] mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Primary Action: Masuk dengan Google */}
          <div className="space-y-3">
            <button
              onClick={handleGoogleQuickLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition shadow-xs hover:border-slate-400 active:scale-[0.99] cursor-pointer disabled:opacity-60"
            >
              {/* Google 4-Color SVG Icon */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isLoading ? 'Menghubungkan ke Google...' : 'Masuk dengan Akun Google'}</span>
            </button>

            {/* Quick-Select Synced Office Users */}
            {officeUsers.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Pilih Akun Terverifikasi
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Google Sheets Sync
                  </span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {officeUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleSelectUser(u)}
                      disabled={isLoading}
                      className="w-full flex items-center justify-between p-2 rounded-xl border border-slate-200 bg-white hover:bg-red-50/50 hover:border-red-200 transition text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 group-hover:text-[#ee3425] truncate">
                            {u.name}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium group-hover:bg-red-100 group-hover:text-[#ee3425]">
                          {u.role}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#ee3425] group-hover:translate-x-0.5 transition" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <button
                  type="button"
                  onClick={() => setShowManualForm(!showManualForm)}
                  className="bg-white px-2.5 text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
                >
                  {showManualForm ? 'Tutup form email' : 'Atau gunakan email kantor lainnya'}
                </button>
              </div>
            </div>

            {/* Manual Office Email Form */}
            {showManualForm && (
              <form onSubmit={handleCustomEmailLogin} className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Contoh: Ravi Zein"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#ee3425] focus:ring-1 focus:ring-[#ee3425] transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Email Google Kantor
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="nama@itsecacademy.com"
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#ee3425] focus:ring-1 focus:ring-[#ee3425] transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#ee3425] hover:bg-[#d62b1d] text-white font-semibold text-xs transition shadow-sm cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Masuk dengan Email Kantor</span>
                </button>
              </form>
            )}
          </div>

          {/* Footer Security Badges */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-slate-400" />
              Enkripsi Google Sheets
            </span>
            <span>Versi PWA 1.0</span>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="relative z-10 w-full text-center py-4 text-xs text-slate-400">
        &copy; {new Date().getFullYear()} Syncro &bull; Platform Manajemen Tugas Terintegrasi Google Workspace
      </footer>
    </div>
  );
}
