"use client";

import React, { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  X,
  ShieldCheck,
} from "lucide-react";
import { isAllowedCompanyEmail } from "@/lib/domain-auth";

function SignInContent() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const modeParam = searchParams.get("mode");

  const [authMode, setAuthMode] = useState<"signin" | "register">(
    modeParam === "register" ? "register" : "signin"
  );

  // Sign In fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Register fields
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Status & modal states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);

  // Handle Sign In Submit
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const cleanEmail = email.trim().toLowerCase();

    // Check company domain
    if (!isAllowedCompanyEmail(cleanEmail)) {
      setErrorMessage("Domain email tidak diizinkan. Gunakan @itsecacademy.com atau @itsecasia.com.");
      return;
    }

    setLoading(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: cleanEmail,
        password: password,
        callbackUrl: "/",
      });

      if (res?.error) {
        if (res.error === "CredentialsSignin") {
          setErrorMessage("Email atau kata sandi tidak sesuai. Jika belum memiliki akun, silakan klik tab Daftar di atas.");
        } else {
          setErrorMessage(res.error);
        }
      } else if (res?.ok) {
        window.location.href = "/";
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal masuk ke sistem.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const cleanEmail = registerEmail.trim().toLowerCase();

    // Strict domain check: only @itsecacademy.com & @itsecasia.com
    if (!isAllowedCompanyEmail(cleanEmail)) {
      setErrorMessage("Domain email tidak diizinkan. Gunakan @itsecacademy.com atau @itsecasia.com.");
      return;
    }

    if (registerPassword.length < 6) {
      setErrorMessage("Kata sandi minimal 6 karakter.");
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setErrorMessage("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerName,
          email: cleanEmail,
          password: registerPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || "Gagal melakukan pendaftaran.");
      }

      setSuccessMessage(
        "Pendaftaran berhasil! Akun resmi Anda telah aktif. Silakan masuk menggunakan kredensial Anda."
      );
      setEmail(cleanEmail);
      setPassword(registerPassword);
      setAuthMode("signin");
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal melakukan pendaftaran.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Main Responsive Card Container */}
      <div className="w-full max-w-[420px] sm:max-w-[450px] bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/70 border border-slate-200/90 p-6 sm:p-9 relative z-20 text-left transition-all">
        {/* Official Syncro Title Logo centered in the middle of the form */}
        <div className="flex justify-center items-center mb-5">
          <img
            src="/icons/syncro-icon.png"
            alt="Syncro"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shadow-md shadow-brand-500/20 object-contain hover:scale-105 transition-transform"
          />
        </div>

        {/* Heading & Subtitle centered */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight leading-tight">
            {authMode === "signin" ? "Welcome Back!" : "Create an Account"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
            {authMode === "signin"
              ? "Please enter your email and password to access Syncro Workspace Dashboard"
              : "Please enter your details to register your official Syncro Workspace account"}
          </p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {(errorParam || errorMessage) && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">
                {errorMessage === "Domain email tidak diizinkan. Gunakan @itsecacademy.com atau @itsecasia.com."
                  ? "Domain email tidak diizinkan"
                  : "Gagal Autentikasi"}
              </div>
              <div className="text-[11px] mt-0.5 leading-normal">
                {errorMessage ||
                  "Akses ditolak: Hanya email resmi perusahaan (@itsecacademy.com atau @itsecasia.com) yang diizinkan."}
              </div>
            </div>
          </div>
        )}

        {/* SIGN IN FORM */}
        {authMode === "signin" ? (
          <form onSubmit={handleSignInSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Email <span className="text-brand-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="eg. nama@itsecacademy.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Password <span className="text-brand-500">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-600 transition p-1 cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Forgot Password Link right-aligned in Syncro Red */}
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline cursor-pointer transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            {/* Solid Vibrant Syncro Red Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-3 px-4 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-brand-500/25 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            {/* Bottom Account Switcher */}
            <div className="mt-6 text-center text-xs text-slate-600">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setAuthMode("register");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className="font-semibold text-brand-600 hover:text-brand-700 hover:underline cursor-pointer transition-colors"
              >
                Sign Up
              </button>
            </div>
          </form>
        ) : (
          /* REGISTRATION FORM (Sign Up) */
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Full Name <span className="text-brand-500">*</span>
              </label>
              <input
                type="text"
                required
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                placeholder="eg. Ravi Zein"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
              />
            </div>

            {/* Email Field with domain instruction */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Email (@itsecacademy.com / @itsecasia.com){" "}
                <span className="text-brand-500">*</span>
              </label>
              <input
                type="email"
                required
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                placeholder="eg. nama@itsecacademy.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Password <span className="text-brand-500">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type={showRegisterPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="Create a password (min. 6 characters)"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-600 transition p-1 cursor-pointer"
                >
                  {showRegisterPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Confirm Password <span className="text-brand-500">*</span>
              </label>
              <input
                type={showRegisterPassword ? "text" : "password"}
                required
                minLength={6}
                value={registerConfirmPassword}
                onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
              />
            </div>

            {/* Register Submit Button in Syncro Red */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-3 px-4 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-brand-500/25 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "Registering..." : "Sign Up"}
            </button>

            {/* Bottom Account Switcher */}
            <div className="mt-6 text-center text-xs text-slate-600">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signin");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className="font-semibold text-brand-600 hover:text-brand-700 hover:underline cursor-pointer transition-colors"
              >
                Login
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Forgot Password Modal in Syncro Red Theme */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-left relative animate-scale-up">
            <button
              type="button"
              onClick={() => setShowResetModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 border border-brand-200 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Forgot Password
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
              Untuk menjaga integritas dan keamanan sistem internal, permintaan pengaturan ulang kata sandi diverifikasi melalui Administrator ITSEC. Silakan hubungi helpdesk kami di <strong>admin@itsecacademy.com</strong>.
            </p>
            <button
              type="button"
              onClick={() => setShowResetModal(false)}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition cursor-pointer"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-slate-900 relative flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden font-sans select-none">
      {/* Subtle Ambient Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-100 pointer-events-none" />

      {/* Soft Center Red Glow ala Syncro */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/6 blur-[120px] rounded-full pointer-events-none" />

      <Suspense
        fallback={
          <div className="text-slate-700 text-sm font-semibold">
            Memuat Syncro Workspace...
          </div>
        }
      >
        <SignInContent />
      </Suspense>
    </div>
  );
}
