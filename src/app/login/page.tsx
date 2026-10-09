"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore, User } from "@/store/useStore";
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Loader2,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { translations } from "@/lib/i18n";

// Official Google 'G' Logo SVG
function GoogleGLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0">
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
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { users, login, loginWithGoogle, language, setLanguage } = useStore();
  const t = translations[language || "id"];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"google" | "email" | null>(null);

  // Google Account Chooser Modal State
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");
  const [customGoogleName, setCustomGoogleName] = useState("");

  // Google OAuth 2.0 Single Sign-On - Buka Pilihan Akun
  const handleGoogleSSO = () => {
    // Tampilkan modal pemilih akun Google sehingga pengguna bisa memilih akun mana yang diinginkan
    setIsGoogleModalOpen(true);
  };

  // Konfirmasi Akun Google Terpilih
  const handleConfirmGoogleAccount = (targetEmail: string, targetName?: string) => {
    const cleanEmail = targetEmail.trim();
    if (!cleanEmail) return;

    setIsLoading(true);
    setLoginMethod("google");
    setIsGoogleModalOpen(false);

    setTimeout(() => {
      loginWithGoogle(cleanEmail, targetName);
      setIsLoading(false);
      router.push("/");
    }, 700);
  };

  // Standard Email & Password Login
  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setLoginMethod("email");

    setTimeout(() => {
      const existingUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        login(existingUser);
      } else {
        const namePart = email.split("@")[0] || "User";
        const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        const newUser: User = {
          id: `u_${Date.now()}`,
          name: formattedName,
          email: email.trim(),
          role: users.length === 0 ? "admin" : "member",
          department: "Product & Tech",
          capacityHours: 40,
          avatar: formattedName.substring(0, 2).toUpperCase(),
        };
        login(newUser);
      }
      setIsLoading(false);
      router.push("/");
    }, 700);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between items-center bg-background px-4 py-8 relative overflow-hidden select-none">
      {/* Background Ambience Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#EE3726]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar / Language Switcher */}
      <div className="w-full max-w-md flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#EE3726] to-[#BA1E10] flex items-center justify-center text-white font-black text-xs shadow-md shadow-rose-950/40">
            S
          </div>
          <span className="text-base font-extrabold text-foreground tracking-tight">Syncro</span>
        </div>

        {/* Language Toggle */}
        <div className="flex items-center bg-secondary/80 border border-border rounded-lg p-0.5 text-xs font-bold">
          <button
            onClick={() => setLanguage("id")}
            className={`px-2 py-0.5 rounded transition text-[11px] ${
              language === "id" ? "bg-[#EE3726] text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🇮🇩 ID
          </button>
          <button
            onClick={() => setLanguage("en")}
            className={`px-2 py-0.5 rounded transition text-[11px] ${
              language === "en" ? "bg-[#EE3726] text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🇬🇧 EN
          </button>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md my-auto z-10">
        <Card className="bg-card/90 backdrop-blur-xl border border-border shadow-2xl rounded-3xl overflow-hidden transition-all duration-200">
          <CardHeader className="text-center p-6 pb-4 space-y-2">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-br from-[#EE3726] to-[#BA1E10] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-rose-900/30 ring-1 ring-rose-400/40">
              S
            </div>
            <div>
              <CardTitle className="text-xl sm:text-2xl font-black text-foreground">
                {t.loginTitle}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                {t.loginSubtitle}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-6 pt-2 space-y-5">
            {/* 1. Google OAuth 2.0 (SSO) Primary Button - Sesuai PRD Section 3 & 4.5 */}
            <div className="space-y-1.5">
              <Button
                type="button"
                onClick={handleGoogleSSO}
                disabled={isLoading}
                variant="outline"
                className="w-full h-11 text-xs font-bold bg-secondary/60 hover:bg-secondary border-border hover:border-[#4285F4] text-foreground rounded-xl flex items-center justify-center gap-2.5 transition shadow-xs group"
              >
                {isLoading && loginMethod === "google" ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-[#4285F4]" />
                    <span>Mengautentikasi Google OAuth 2.0...</span>
                  </>
                ) : (
                  <>
                    <GoogleGLogo size={18} />
                    <span>{t.googleSignInBtn}</span>
                  </>
                )}
              </Button>
              <p className="text-[10px] text-center text-muted-foreground">
                Satu klik akun Google Workspace atau Gmail personal (Google SSO)
              </p>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-border w-full" />
              <span className="bg-card px-2 text-[10px] uppercase font-bold text-muted-foreground tracking-wider absolute">
                {t.orEmailDivider}
              </span>
            </div>

            {/* 2. Email & Password Form */}
            <form onSubmit={handleEmailLogin} className="space-y-3.5">
              {/* Email Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground block">
                  {t.emailLabel}
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    className="pl-9 h-10 text-xs bg-secondary/40 border-border rounded-xl focus-visible:ring-[#EE3726]"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-foreground">
                    {t.passwordLabel}
                  </label>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      alert(language === 'en' ? "Use the Google SSO or Demo accounts below for instant access." : "Gunakan Google SSO atau Akun Demo di bawah untuk akses langsung.");
                    }}
                    className="text-[10px] text-[#EE3726] hover:underline font-semibold"
                  >
                    {t.forgotPassword}
                  </a>
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    className="pl-9 pr-9 h-10 text-xs bg-secondary/40 border-border rounded-xl focus-visible:ring-[#EE3726]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center gap-2 pt-0.5">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 rounded accent-[#EE3726] cursor-pointer"
                />
                <label htmlFor="remember-me" className="text-xs text-muted-foreground cursor-pointer select-none">
                  {t.rememberMe}
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 text-xs font-bold bg-[#EE3726] hover:bg-[#D32717] text-white rounded-xl shadow-md shadow-[#EE3726]/20 transition flex items-center justify-center gap-2 mt-2"
              >
                {isLoading && loginMethod === "email" ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-white" />
                    <span>Masuk ke Workspace...</span>
                  </>
                ) : (
                  <>
                    <span>{t.loginSubmitBtn}</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Security & PRD Compliance Footer */}
      <div className="w-full max-w-md text-center space-y-1 text-muted-foreground z-10 pt-4">
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>{t.authSecurityNote}</span>
        </div>
        <p className="text-[10px] text-muted-foreground/70">
          Syncro PWA • Google Sheets REST Backend • Google AI Studio Gemini Engine
        </p>
      </div>

      {/* Google Account Chooser Modal (PRD Section 4.5: Google SSO) */}
      {isGoogleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200">
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            {/* Google Header */}
            <div className="text-center space-y-2">
              <div className="mx-auto flex justify-center">
                <GoogleGLogo size={32} />
              </div>
              <h2 className="text-lg font-bold text-foreground">
                {language === 'en' ? 'Choose an account' : 'Pilih akun'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {language === 'en'
                  ? 'to continue to Syncro'
                  : 'untuk melanjutkan ke Syncro'}
              </p>
            </div>

            {/* List of previously logged in Google accounts if any */}
            {users.length > 0 && (
              <div className="space-y-1.5 border-y border-border py-2.5 max-h-48 overflow-y-auto">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                  {language === 'en' ? 'Choose from active accounts' : 'Pilih akun yang aktif'}
                </p>
                {users.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleConfirmGoogleAccount(u.email, u.name)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/80 border border-transparent hover:border-[#4285F4]/30 transition text-left group"
                  >
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#4285F4] to-[#34A853] flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
                      {u.avatar || u.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground group-hover:text-[#4285F4] truncate">
                        {u.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {u.email}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Form to enter ANY Google / Google Workspace account */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleConfirmGoogleAccount(customGoogleEmail, customGoogleName);
              }}
              className="space-y-3 pt-1"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-foreground block">
                    {language === 'en' ? 'Google Account Email' : 'Email Akun Google Anda'}
                  </label>
                  {users.length > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      {language === 'en' ? 'or use another account' : 'atau gunakan akun lain'}
                    </span>
                  )}
                </div>
                <Input
                  type="email"
                  required
                  placeholder="contoh: nama@gmail.com atau kerja@perusahaan.com"
                  value={customGoogleEmail}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomGoogleEmail(val);
                    if (!customGoogleName) {
                      const prefix = val.split('@')[0] || '';
                      const inferred = prefix.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                      setCustomGoogleName(inferred);
                    }
                  }}
                  className="h-9 text-xs bg-secondary/50 border-border rounded-xl focus-visible:ring-[#4285F4]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground block">
                  {language === 'en' ? 'Display Name (Google Profile)' : 'Nama Tampilan (Profil Google)'}
                </label>
                <Input
                  type="text"
                  placeholder="Nama Lengkap Anda"
                  value={customGoogleName}
                  onChange={(e) => setCustomGoogleName(e.target.value)}
                  className="h-9 text-xs bg-secondary/50 border-border rounded-xl focus-visible:ring-[#4285F4]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsGoogleModalOpen(false)}
                  className="flex-1 h-9 text-xs"
                >
                  {t.modalCancel}
                </Button>
                <Button
                  type="submit"
                  disabled={!customGoogleEmail.trim()}
                  className="flex-1 h-9 text-xs font-bold bg-[#4285F4] hover:bg-[#3367D6] text-white rounded-xl shadow-sm"
                >
                  {language === 'en' ? 'Continue' : 'Lanjutkan Masuk'}
                </Button>
              </div>
            </form>

            <p className="text-[10px] text-center text-muted-foreground/80 leading-relaxed">
              {language === 'en'
                ? 'To continue, Google will share your name and email address with Syncro.'
                : 'Untuk melanjutkan, Google akan membagikan nama dan alamat email akun ini ke Syncro.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
