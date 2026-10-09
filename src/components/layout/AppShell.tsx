"use client";

import React, { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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
