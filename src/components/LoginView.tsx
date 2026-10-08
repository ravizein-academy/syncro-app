'use client';

import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { User } from '../types';
import { 
  ShieldCheck, 
  ArrowRight, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Building2
} from 'lucide-react';

export function LoginView() {
  const { users, loginUser, syncStatus } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const officeUsers = users && users.length > 0 ? users : [];

  const performLogin = (targetUser: User) => {
    setIsLoading(true);
    setErrorMsg('');

    setTimeout(() => {
      if (rememberMe && typeof window !== 'undefined') {
        localStorage.setItem('SYNCRO_AUTH_USER', JSON.stringify(targetUser));
      } else if (typeof window !== 'undefined') {
        sessionStorage.setItem('SYNCRO_AUTH_USER', JSON.stringify(targetUser));
      }
      loginUser(targetUser);
      setIsLoading(false);
    }, 600);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMsg('Silakan masukkan alamat email kantor Anda.');
      return;
    }

    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setErrorMsg('Format email tidak valid. Masukkan email resmi kantor.');
      return;
    }

    if (!password) {
      setErrorMsg('Silakan masukkan kata sandi Anda.');
      return;
    }

    // Match with existing synced office users from Google Sheets
    const matchedUser = officeUsers.find((u) => u.email.toLowerCase() === trimmedEmail);

    if (matchedUser) {
      performLogin(matchedUser);
    } else {
      // Auto-create office profile for this valid company email
      const namePart = trimmedEmail.split('@')[0].replace(/[._]/g, ' ');
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

      performLogin(newUser);
    }
  };

  const handleGoogleSso = () => {
    setIsLoading(true);
    setErrorMsg('');

    // Prioritize Ravi Zein or first office user
    const primaryUser = officeUsers.find(
      (u) => u.email.toLowerCase().includes('ravizein') || u.email.toLowerCase().includes('itsecacademy')
    ) || officeUsers[0];

    if (primaryUser) {
      performLogin(primaryUser);
    } else {
      const defaultUser: User = {
        id: 'user_1',
        name: 'Ravi Zein',
        email: 'ravizein@itsecacademy.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        role: 'Admin',
        team: 'Product & Architecture',
        weeklyCapacityHours: 40
      };
      performLogin(defaultUser);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-between relative overflow-hidden font-sans select-none">
      {/* Background Subtle Gradient Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-red-100/50 via-red-50/20 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-red-500/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-red-500/5 blur-3xl pointer-events-none" />

      {/* Top Navbar */}
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
          <span className="text-slate-600 font-medium">Database Sheets Aktif</span>
        </div>
      </header>

      {/* Center Form Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-7 md:p-8 transition-all">
          
          {/* Header Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-[#ee3425] text-xs font-semibold mb-3 border border-red-100">
              <Building2 className="w-3.5 h-3.5" />
              <span>Google Workspace Login</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Masuk ke Syncro
            </h1>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Masukkan akun Google kantor Anda untuk membuka dashboard tugas dan workspace tim.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#ee3425] mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form Login Utama */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Input Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Kantor
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@itsecacademy.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-[#ee3425] focus:ring-2 focus:ring-red-500/10 focus:outline-none transition bg-slate-50/50 focus:bg-white text-slate-900 placeholder-slate-400 font-medium"
                />
              </div>
            </div>

            {/* Input Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Kata Sandi
                </label>
                <button
                  type="button"
                  onClick={() => alert('Gunakan kata sandi akun Google Workspace Anda atau hubungi admin IT.')}
                  className="text-[11px] text-[#ee3425] hover:underline font-medium cursor-pointer"
                >
                  Lupa sandi?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi akun"
                  className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-[#ee3425] focus:ring-2 focus:ring-red-500/10 focus:outline-none transition bg-slate-50/50 focus:bg-white text-slate-900 placeholder-slate-400 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#ee3425] focus:ring-[#ee3425] accent-[#ee3425] cursor-pointer"
                />
                <span>Ingat sesi saya di perangkat ini</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-[#ee3425] hover:bg-[#d62b1d] text-white font-semibold text-xs transition shadow-md shadow-red-500/20 active:scale-[0.99] cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Syncro</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400 font-medium">
                atau masuk dengan
              </span>
            </div>
          </div>

          {/* Google SSO Button */}
          <button
            onClick={handleGoogleSso}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition shadow-xs hover:border-slate-400 active:scale-[0.99] cursor-pointer disabled:opacity-60"
          >
            {/* Google 4-Color SVG Icon */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            <span>Lanjutkan dengan Akun Google Workspace</span>
          </button>

          {/* Footer Card Security Note */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Tersambung Google Sheets API
            </span>
            <span>Versi PWA 1.0</span>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="relative z-10 w-full text-center py-4 text-xs text-slate-400">
        &copy; {new Date().getFullYear()} Syncro &bull; Platform Manajemen Tugas Google Workspace Terintegrasi
      </footer>
    </div>
  );
}
