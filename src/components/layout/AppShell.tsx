"use client";

import React, { Suspense, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (mounted && !isAuthenticated && pathname !== "/login") {
      router.push("/login");
    }
  }, [mounted, isAuthenticated, pathname, router]);

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
