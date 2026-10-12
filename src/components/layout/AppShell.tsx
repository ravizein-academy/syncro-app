"use client";

import React, { Suspense, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, currentUser, logout } = useStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Auth Guard & Active User Session Validator (Strict Auto-Kick)
  React.useEffect(() => {
    if (!mounted) return;

    // 1. Jika tidak terotentikasi dan bukan di halaman login, langsung lempar ke /login
    if (!isAuthenticated && pathname !== "/login") {
      window.location.replace("/login");
      return;
    }

    // 2. Jika login namun status akun di penyimpanan lokal bukan 'active' (misal: pending, inactive, atau belum di-ACC)
    if (isAuthenticated && currentUser && currentUser.email?.toLowerCase().trim() !== "ravizein@itsecacademy.com") {
      if (currentUser.status !== "active") {
        console.warn("[AppShell Security] Status akun bukan 'active' (" + currentUser.status + "). Mengeluarkan akun otomatis.");
        logout();
        try {
          localStorage.removeItem("syncro_remembered_device_account");
        } catch (e) {}
        if (pathname !== "/login") {
          window.location.replace("/login");
        }
        return;
      }
    }

    // 3. Verifikasi real-time ke database cloud (setiap 5 detik)
    // Jika Admin mencabut akses atau menghapus user, browser user langsung auto-kick seketika!
    const verifyUserStatus = () => {
      const state = useStore.getState();
      if (
        state.isAuthenticated &&
        state.currentUser &&
        state.currentUser.email?.toLowerCase().trim() !== "ravizein@itsecacademy.com"
      ) {
        const targetEmail = state.currentUser.email.toLowerCase().trim();
        fetch("/api/users", { cache: "no-store" })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (!data) return;
            const userList = data?.users || data?.data?.users || [];
            const found = userList.find(
              (u: any) => u.email && u.email.toLowerCase().trim() === targetEmail
            );

            if (!found || found.status !== "active") {
              console.warn("[AppShell Security] Akun tidak aktif di database cloud. Logout otomatis:", targetEmail);
              state.logout();
              try {
                localStorage.removeItem("syncro_remembered_device_account");
              } catch (e) {}
              if (pathname !== "/login") {
                window.location.replace("/login");
              }
            }
          })
          .catch((err) => {
            console.warn("[AppShell] Gagal memvalidasi status pengguna:", err);
          });
      }
    };

    // Jalankan verifikasi pertama kali
    verifyUserStatus();

    // Interval cek setiap 5 detik
    const interval = setInterval(verifyUserStatus, 5000);
    return () => clearInterval(interval);
  }, [mounted, isAuthenticated, currentUser, pathname, logout]);

  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return (
      <div className="min-h-screen w-full bg-background text-foreground">
        {children}
      </div>
    );
  }

  // Jika belum login atau status belum aktif, jangan pernah tampilkan layout dashboard
  if (
    !isAuthenticated ||
    (currentUser && currentUser.email?.toLowerCase().trim() !== "ravizein@itsecacademy.com" && currentUser.status !== "active")
  ) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#EE3726] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground font-medium">Memverifikasi otorisasi akun...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground selection:bg-rose-500/30 selection:text-rose-600 transition-colors duration-200">
      <Suspense fallback={<aside className="w-64 border-r border-border shrink-0 hidden md:block bg-card" />}>
        <Sidebar />
      </Suspense>
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
