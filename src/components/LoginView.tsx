'use client';

import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { User } from '../types';
import { 
  User as UserIcon, 
  ArrowRight, 
  AlertCircle, 
  ChevronDown, 
  Globe,
  Building2,
  Lock,
  Plus,
  X,
  CheckCircle2,
  UserPlus
} from 'lucide-react';

export function LoginView() {
  const { users, loginUser, googleScriptUrl } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [lang, setLang] = useState<'ID' | 'ENG'>('ENG');

  // Google Account Chooser Modal state
  const [showAccountChooser, setShowAccountChooser] = useState(false);
  const [showAddOtherAccount, setShowAddOtherAccount] = useState(false);
  const [otherEmail, setOtherEmail] = useState('');
  const [otherName, setOtherName] = useState('');

  const officeUsers = users && users.length > 0 ? users : [];

  const performLogin = (targetUser: User) => {
    setIsLoading(true);
    setErrorMsg('');

    setTimeout(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('SYNCRO_AUTH_USER', JSON.stringify(targetUser));
      }
      loginUser(targetUser);
      setIsLoading(false);
      setShowAccountChooser(false);
    }, 400);
  };

  const handleSelectAccount = (user: User) => {
    performLogin(user);
  };

  const handleAddOtherOfficeAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedEmail = otherEmail.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMsg(lang === 'ENG' ? 'Please enter your work email.' : 'Silakan masukkan email kantor Anda.');
      return;
    }

    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setErrorMsg(lang === 'ENG' ? 'Please enter a valid work email format.' : 'Format email kantor tidak valid.');
      return;
    }

    // Check if user already exists
    const existing = officeUsers.find((u) => u.email.toLowerCase() === trimmedEmail);
    if (existing) {
      performLogin(existing);
      return;
    }

    // Auto-create new user
    const namePart = otherName.trim() || trimmedEmail.split('@')[0].replace(/[._]/g, ' ');
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
      team: 'Engineering & Operations',
      weeklyCapacityHours: 40
    };

    // Async register to Google Sheets backend if connected
    if (googleScriptUrl) {
      fetch(googleScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'registerUser', data: newUser })
      }).catch(console.error);
    }

    performLogin(newUser);
  };

  return (
    <div className="min-h-screen w-full bg-[#f1f3f6] flex items-center justify-center p-3 sm:p-6 lg:p-8 font-sans select-none antialiased relative">
      
      {/* Outer Card Container */}
      <div className="w-full max-w-[1240px] bg-white rounded-[28px] sm:rounded-[36px] shadow-2xl shadow-slate-300/50 border border-slate-200/80 overflow-hidden flex flex-col lg:flex-row min-h-[620px] lg:min-h-[680px]">
        
        {/* =========================================
            LEFT COLUMN: GOOGLE LOGIN ONLY
        ========================================== */}
        <div className="w-full lg:w-[48%] p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
          
          {/* Top Brand Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#ee3425] flex items-center justify-center text-white font-bold shadow-md shadow-red-500/25">
                <span className="text-base tracking-tighter">S</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-slate-900 tracking-tight leading-none">Syncro</span>
                <span className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">Enterprise</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>{lang === 'ENG' ? "Workspace Account" : 'Akun Workspace'}</span>
              <span className="px-2.5 py-1 rounded-full bg-red-50 text-[#ee3425] font-semibold text-[11px] border border-red-100 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                <span>Google SSO</span>
              </span>
            </div>
          </div>

          {/* Center Form Section: PURE GOOGLE LOGIN */}
          <div className="my-auto py-10 max-w-[340px] sm:max-w-[360px] w-full mx-auto text-center">
            
            {/* User Icon Capsule */}
            <div className="w-14 h-14 rounded-2xl bg-red-50/80 border border-red-100 flex items-center justify-center mx-auto mb-5 text-[#ee3425] shadow-xs">
              <UserIcon className="w-6 h-6 text-[#ee3425]" />
            </div>

            {/* Heading */}
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
              {lang === 'ENG' ? 'Welcome back!' : 'Selamat datang!'}
            </h1>
            <p className="text-xs text-slate-500 mb-8 font-normal leading-relaxed">
              {lang === 'ENG' 
                ? 'Sign in with your official Google Workspace account to access your tasks and projects.' 
                : 'Masuk dengan akun Google kantor resmi Anda untuk mengakses dashboard dan tugas tim.'}
            </p>

            {errorMsg && (
              <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#ee3425] mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Primary Google Login Button (Opens Account Chooser) */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  setErrorMsg('');
                  setShowAddOtherAccount(false);
                  setShowAccountChooser(true);
                }}
                disabled={isLoading}
                type="button"
                className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm transition shadow-sm hover:shadow hover:border-slate-400 active:scale-[0.99] cursor-pointer disabled:opacity-60 group"
              >
                {/* Official 4-color Google Icon */}
                <svg className="w-5 h-5 shrink-0 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>
                  {isLoading 
                    ? (lang === 'ENG' ? 'Connecting to Google...' : 'Menghubungkan ke Google...') 
                    : (lang === 'ENG' ? 'Login with Google' : 'Masuk dengan Akun Google')}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition" />
              </button>

              {/* Workspace Trust Badge */}
              <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
                <span>{lang === 'ENG' ? 'Verified Google Workspace Single Sign-On' : 'Otentikasi Aman Google Workspace'}</span>
              </div>
            </div>

            {/* Terms Footnote */}
            <p className="text-[10px] text-slate-400 mt-8 leading-normal">
              {lang === 'ENG' ? 'By continuing, you acknowledge Syncro ' : 'Dengan melanjutkan, Anda menyetujui '}
              <a href="#" className="underline hover:text-slate-600 transition">
                {lang === 'ENG' ? 'Privacy Policy.' : 'Kebijakan Privasi Syncro.'}
              </a>
            </p>
          </div>

          {/* Bottom Left Bar */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-4 border-t border-slate-100">
            <span>&copy; {new Date().getFullYear()} Syncro</span>

            {/* Language Selector Dropdown */}
            <div className="relative flex items-center gap-1.5 cursor-pointer hover:text-slate-600">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <button
                type="button"
                onClick={() => setLang(lang === 'ENG' ? 'ID' : 'ENG')}
                className="flex items-center gap-1 text-[11px] font-medium cursor-pointer"
              >
                <span>{lang}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* =========================================
            RIGHT COLUMN: 3D HERO BANNER (WARNA MERAH #ee3425)
        ========================================== */}
        <div className="w-full lg:w-[52%] m-3 sm:m-4 rounded-[22px] sm:rounded-[28px] bg-gradient-to-br from-[#ff4737] via-[#ee3425] to-[#c71d10] relative overflow-hidden flex flex-col justify-between p-6 sm:p-10 text-white shadow-xl shadow-red-500/20">
          
          {/* Ambient Lighting Circles */}
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-black/15 blur-3xl pointer-events-none" />

          {/* Top Hero Typography */}
          <div className="relative z-10 max-w-lg">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-[1.15] text-white mb-3 drop-shadow-sm">
              Build, Deploy & Manage <br />
              Enterprise Workflows
            </h2>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-medium max-w-md">
              Manage every team task, automated workflow, and Google Sheets sync from one intelligent platform built for modern enterprises.
            </p>
          </div>

          {/* Center 3D Isometric Illustration */}
          <div className="relative flex-1 my-4 flex items-center justify-center min-h-[260px] sm:min-h-[320px]">
            {/* Background 3D Image Card */}
            <div className="relative w-full max-w-[420px] aspect-square rounded-2xl overflow-hidden shadow-2xl border border-white/30 transition-transform duration-500 hover:scale-[1.02] bg-white/10 backdrop-blur-xs">
              <img
                src="/images/syncro_login_hero.jpg"
                alt="Syncro 3D Enterprise Workflow Illustration"
                className="w-full h-full object-cover"
              />
              {/* Soft crimson gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-red-950/40 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Bottom Floating Status Cards */}
          <div className="relative z-10 space-y-2 max-w-md w-full mx-auto sm:mx-0">
            {/* Pill 1 */}
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-white shrink-0 shadow-xs" />
                <span className="text-xs font-semibold truncate tracking-tight">
                  Identify code optimization & sprint workflow |
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 text-xs font-semibold pl-2">
                <span className="text-white">Working...</span>
                <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
              </div>
            </div>

            {/* Pill 2 */}
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-white shrink-0 shadow-xs" />
                <div className="h-2 w-28 bg-white/60 rounded-full" />
              </div>
              <div className="flex items-center gap-1.5 shrink-0 text-xs font-semibold pl-2">
                <span className="text-white">Done</span>
                <span className="w-2 h-2 rounded-full bg-emerald-300 shadow-xs" />
              </div>
            </div>

            {/* Pill 3 */}
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 text-white shadow-sm opacity-80">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-white/70 shrink-0" />
                <div className="h-2 w-20 bg-white/50 rounded-full" />
              </div>
              <div className="flex items-center gap-1.5 shrink-0 text-xs font-semibold pl-2">
                <span className="text-white/90">Done</span>
                <span className="w-2 h-2 rounded-full bg-emerald-300/90" />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================
          MODAL: GOOGLE WORKSPACE ACCOUNT CHOOSER (PEMILIH AKUN)
      ========================================================= */}
      {showAccountChooser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header (Official Google Style) */}
            <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">Pilih Akun Kantor</h3>
                  <p className="text-xs text-slate-500">untuk melanjutkan ke Syncro</p>
                </div>
              </div>
              <button
                onClick={() => setShowAccountChooser(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 pt-4 space-y-2 max-h-[360px] overflow-y-auto">
              {/* Existing Accounts List */}
              <div className="space-y-1.5">
                {officeUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleSelectAccount(u)}
                    disabled={isLoading}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200/80 hover:bg-red-50/50 hover:border-red-200 transition text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 group-hover:text-[#ee3425] truncate">
                          {u.name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold group-hover:bg-red-100 group-hover:text-[#ee3425]">
                        {u.role}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#ee3425] group-hover:translate-x-0.5 transition" />
                    </div>
                  </button>
                ))}
              </div>

              {/* Add Other Office Account Option */}
              <div className="pt-2">
                {!showAddOtherAccount ? (
                  <button
                    onClick={() => setShowAddOtherAccount(true)}
                    type="button"
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-slate-300 hover:border-[#ee3425] hover:bg-red-50/30 text-slate-700 hover:text-[#ee3425] font-semibold text-xs transition cursor-pointer text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <Plus className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">Gunakan Akun Google Kantor Lainnya</p>
                      <p className="text-[10px] text-slate-400 font-normal">Masuk dengan email rekan kerja / tim baru</p>
                    </div>
                  </button>
                ) : (
                  <form onSubmit={handleAddOtherOfficeAccount} className="p-3.5 rounded-xl border border-red-200 bg-red-50/20 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <UserPlus className="w-3.5 h-3.5 text-[#ee3425]" />
                        <span>Daftarkan Akun Kantor Baru</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAddOtherAccount(false)}
                        className="text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={otherName}
                        onChange={(e) => setOtherName(e.target.value)}
                        placeholder="Nama Lengkap (Contoh: Budi Santoso)"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:border-[#ee3425] focus:outline-none"
                      />
                    </div>

                    <div>
                      <input
                        type="email"
                        required
                        value={otherEmail}
                        onChange={(e) => setOtherEmail(e.target.value)}
                        placeholder="email@itsecacademy.com"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:border-[#ee3425] focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2 px-3 rounded-lg bg-[#ee3425] hover:bg-[#d6281a] text-white font-semibold text-xs transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      <span>Masuk & Simpan ke Sheets</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Modal Footer Note */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 text-center leading-normal">
              Untuk melanjutkan, Google akan membagikan nama, email kantor, dan preferensi akun Anda dengan database Syncro.
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
