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
  Sparkles,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';

export function LoginView() {
  const { users, loginUser } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [lang, setLang] = useState<'ID' | 'ENG'>('ENG');

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
    }, 600);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMsg(lang === 'ENG' ? 'Please enter your work email.' : 'Silakan masukkan email kantor Anda.');
      return;
    }

    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setErrorMsg(lang === 'ENG' ? 'Please enter a valid email format.' : 'Format email tidak valid.');
      return;
    }

    // If password field is not shown yet, prompt for password
    if (!showPasswordField) {
      setShowPasswordField(true);
      return;
    }

    if (!password) {
      setErrorMsg(lang === 'ENG' ? 'Please enter your password.' : 'Silakan masukkan kata sandi Anda.');
      return;
    }

    // Check matched office user
    const matchedUser = officeUsers.find((u) => u.email.toLowerCase() === trimmedEmail);
    if (matchedUser) {
      performLogin(matchedUser);
    } else {
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
        team: 'Product & Tech',
        weeklyCapacityHours: 40
      };

      performLogin(newUser);
    }
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setErrorMsg('');

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
    <div className="min-h-screen w-full bg-[#f1f3f6] flex items-center justify-center p-3 sm:p-6 lg:p-8 font-sans select-none antialiased">
      {/* Outer Card Container (Matches Reference Screenshot) */}
      <div className="w-full max-w-[1240px] bg-white rounded-[28px] sm:rounded-[36px] shadow-2xl shadow-slate-300/50 border border-slate-200/80 overflow-hidden flex flex-col lg:flex-row min-h-[640px] lg:min-h-[700px]">
        
        {/* =========================================
            LEFT COLUMN: LOGIN FORM
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
              <span>{lang === 'ENG' ? "Don't have an account?" : 'Belum punya akun?'}</span>
              <button 
                type="button"
                onClick={() => alert('Hubungi administrator IT Workspace untuk pendaftaran akun kantor baru.')}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs shadow-2xs hover:border-slate-300 transition cursor-pointer"
              >
                {lang === 'ENG' ? 'Sign up' : 'Daftar'}
              </button>
            </div>
          </div>

          {/* Center Form Section */}
          <div className="my-auto py-8 max-w-[340px] sm:max-w-[360px] w-full mx-auto text-center">
            
            {/* User Icon Capsule */}
            <div className="w-12 h-12 rounded-2xl bg-slate-100/90 border border-slate-200/60 flex items-center justify-center mx-auto mb-4 text-slate-600 shadow-2xs">
              <UserIcon className="w-5 h-5 text-slate-500" />
            </div>

            {/* Heading */}
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-1.5">
              {lang === 'ENG' ? 'Welcome back!' : 'Selamat datang!'}
            </h1>
            <p className="text-xs text-slate-500 mb-6 font-normal">
              {lang === 'ENG' ? 'Sign in to continue where you left off.' : 'Masuk untuk melanjutkan pekerjaan Anda.'}
            </p>

            {errorMsg && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#ee3425] mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Social Login Buttons */}
            <div className="space-y-2.5 mb-5">
              {/* Login with Google */}
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                type="button"
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-slate-200/90 bg-[#f8fafc] hover:bg-slate-100 text-slate-800 font-semibold text-xs transition cursor-pointer active:scale-[0.99] disabled:opacity-60"
              >
                {/* Official 4-color Google Icon */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{lang === 'ENG' ? 'Login with Google' : 'Masuk dengan Google'}</span>
              </button>

              {/* Login with Workspace SSO (Apple / Enterprise Icon style) */}
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                type="button"
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-slate-200/90 bg-[#f8fafc] hover:bg-slate-100 text-slate-800 font-semibold text-xs transition cursor-pointer active:scale-[0.99] disabled:opacity-60"
              >
                {/* Clean Apple / Enterprise SVG */}
                <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.6-7.79-11.74-14.24-6.26-9.76-11.22-20.91-14.88-33.45-3.66-12.54-5.49-24.32-5.49-35.34 0-14.35 3.66-26.24 10.98-35.66 7.32-9.42 16.51-14.28 27.57-14.58 4.8.12 10.05 1.34 15.74 3.66 5.69 2.33 9.49 3.53 11.4 3.62 1.54 0 5.34-1.28 11.4-3.84 6.06-2.56 11.39-3.72 15.99-3.48 11.95.72 21.64 5.3 29.08 13.72-10.45 6.32-15.54 15.22-15.26 26.7.35 9.07 3.82 16.71 10.41 22.92 6.59 6.21 14.35 9.77 23.28 10.68-2.31 7.23-5.3 14.46-8.99 21.68zM119.22 33.15c0-7.23 2.65-13.97 7.95-20.22 5.3-6.25 11.75-10.41 19.35-12.48.53 2.33.79 4.67.79 7.02 0 7.34-2.77 14.22-8.31 20.64-5.54 6.42-12.13 10.49-19.78 12.21-.26-2.38-.39-4.7-.39-7.17z" />
                </svg>
                <span>{lang === 'ENG' ? 'Login with Apple' : 'Masuk dengan Apple'}</span>
              </button>
            </div>

            {/* Divider 'Or' */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200/80" />
              </div>
              <div className="relative flex justify-center text-[11px]">
                <span className="bg-white px-3 text-slate-400 font-medium">
                  {lang === 'ENG' ? 'Or' : 'Atau'}
                </span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-2.5 text-left">
              <div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={lang === 'ENG' ? 'Email address' : 'Alamat email kantor'}
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-[#f8fafc] focus:bg-white focus:border-[#ee3425] focus:ring-2 focus:ring-red-500/10 focus:outline-none transition text-slate-900 placeholder-slate-400 font-medium"
                />
              </div>

              {showPasswordField && (
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={lang === 'ENG' ? 'Enter password' : 'Kata sandi'}
                    className="w-full pl-4 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 bg-[#f8fafc] focus:bg-white focus:border-[#ee3425] focus:ring-2 focus:ring-red-500/10 focus:outline-none transition text-slate-900 placeholder-slate-400 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              )}

              {/* Black / Dark Solid Submit Button (Exactly like screenshot) */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-black hover:bg-slate-800 text-white font-semibold text-xs transition shadow-sm active:scale-[0.99] cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
              >
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{lang === 'ENG' ? 'Signing in...' : 'Memverifikasi...'}</span>
                  </>
                ) : (
                  <span>{lang === 'ENG' ? 'Login with Email' : 'Masuk dengan Email'}</span>
                )}
              </button>
            </form>

            {/* Terms Footnote */}
            <p className="text-[10px] text-slate-400 mt-5 leading-normal">
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
            RIGHT COLUMN: 3D HERO BANNER SHOWCASE
        ========================================== */}
        <div className="w-full lg:w-[52%] m-3 sm:m-4 rounded-[22px] sm:rounded-[28px] bg-gradient-to-br from-[#8faefa] via-[#658df6] to-[#3a6be8] relative overflow-hidden flex flex-col justify-between p-6 sm:p-10 text-white shadow-inner">
          
          {/* Top Hero Typography (Matches Reference) */}
          <div className="relative z-10 max-w-lg">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-[1.15] text-slate-900 mb-3 drop-shadow-xs">
              Build, Deploy & Manage <br />
              Enterprise Workflows
            </h2>
            <p className="text-xs sm:text-sm text-slate-700/90 leading-relaxed font-medium max-w-md">
              Manage every team task, workflow, and business automation from one intelligent platform built for modern enterprises.
            </p>
          </div>

          {/* Center 3D Isometric Illustration */}
          <div className="relative flex-1 my-4 flex items-center justify-center min-h-[260px] sm:min-h-[320px]">
            {/* Background 3D Image */}
            <div className="relative w-full max-w-[420px] aspect-square rounded-2xl overflow-hidden shadow-2xl border border-white/20 transition-transform duration-500 hover:scale-[1.02]">
              <img
                src="/images/syncro_login_hero.jpg"
                alt="Syncro 3D Enterprise Workflow Illustration"
                className="w-full h-full object-cover"
              />
              {/* Soft overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Bottom Floating Status Cards (Matches Reference Bottom Pills) */}
          <div className="relative z-10 space-y-2 max-w-md w-full mx-auto sm:mx-0">
            {/* Pill 1 */}
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 text-white shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-white/80 shrink-0" />
                <span className="text-xs font-medium truncate">
                  Identify code optimization & sprint workflow |
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 text-xs font-semibold pl-2">
                <span className="text-white/90">Working...</span>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              </div>
            </div>

            {/* Pill 2 */}
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 text-white shadow-sm opacity-90">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-white/80 shrink-0" />
                <div className="h-2 w-28 bg-white/40 rounded-full" />
              </div>
              <div className="flex items-center gap-1.5 shrink-0 text-xs font-semibold pl-2">
                <span className="text-white/90">Done</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
            </div>

            {/* Pill 3 */}
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-sm opacity-70">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-white/60 shrink-0" />
                <div className="h-2 w-20 bg-white/30 rounded-full" />
              </div>
              <div className="flex items-center gap-1.5 shrink-0 text-xs font-semibold pl-2">
                <span className="text-white/80">Done</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400/80" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
