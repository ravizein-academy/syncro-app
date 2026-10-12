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

  // Auth Guard & Active User Session Validator
  React.useEffect(() => {
    if (!mounted) return;

    if (!isAuthenticated && pathname !== "/login") {
      router.push("/login");
      return;
    }

    // Validasi apakah akun yang sedang login masih terdaftar & berstatus 'active' di database
    if (isAuthenticated && currentUser && currentUser.email?.toLowerCase().trim() !== "ravizein@itsecacademy.com") {
      const targetEmail = currentUser.email.toLowerCase().trim();
      fetch("/api/users", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data) return;
          const userList = data?.users || data?.data?.users || [];
          const found = userList.find(
            (u: any) => u.email && u.email.toLowerCase().trim() === targetEmail
          );

          if (!found || found.status !== "active") {
            console.warn("[AppShell] Sesi akun tidak valid atau akses telah dicabut:", targetEmail);
            logout();
            try {
              localStorage.removeItem("syncro_remembered_device_account");
            } catch (e) {}
            if (pathname !== "/login") {
              window.location.href = "/login";
            }
          }
        })
        .catch((err) => {
          console.warn("[AppShell] Gagal memvalidasi status pengguna:", err);
        });
    }
  }, [mounted, isAuthenticated, currentUser, pathname, logout]);


  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return (
      <div className="min-h-screen w-full bg-background text-foreground">
        {children}
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
