"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  Plus,
  Download,
  Bell,
  ChevronDown,
  FileSpreadsheet,
  Layers,
  X,
} from "lucide-react";
import { ItsecLogo } from "@/components/brand/ItsecLogo";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
  _count?: { tasks: number };
}

interface SidebarProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  statusFilter?: string | null;
  onSelectStatus?: (status: string | null) => void;
  currentView?: "dashboard" | "kanban" | "list";
  onSelectView?: (view: "dashboard" | "kanban" | "list") => void;
  onOpenCreateProject: () => void;
  onOpenCreateTask?: () => void;
  onOpenExportReport?: () => void;
  installPrompt: any;
  onInstallApp: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface SidebarInnerProps extends SidebarProps {
  isMobileView?: boolean;
}

function SidebarInner({
  projects,
  selectedProjectId,
  onSelectProject,
  onSelectStatus,
  currentView,
  onSelectView,
  onOpenCreateProject,
  onOpenCreateTask,
  onOpenExportReport,
  installPrompt,
  onInstallApp,
  onCloseMobile,
  isMobileView = false,
}: SidebarInnerProps) {
  const [spacesCollapsed, setSpacesCollapsed] = useState(false);

  const handleAction = (callback?: () => void) => {
    callback?.();
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <div className="flex flex-col h-full w-full select-none font-sans bg-white dark:bg-[#222222]">
      {/* Syncro Workspace Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-slate-200 shrink-0">
        <ItsecLogo size="sm" />
        {isMobileView && onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#303030] transition cursor-pointer"
            title="Tutup Menu"
            aria-label="Tutup navigasi"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Quick Navigation Items (Tugas Baru, Dashboard, Notifications, Laporan) */}
      <div className="px-3 py-2.5 space-y-1 border-b border-slate-100 dark:border-[#2e2e2e] shrink-0">
        {/* Tombol Tugas Baru */}
        <button
          onClick={() => handleAction(onOpenCreateTask)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 mb-1.5 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-itsec-darkRed hover:from-brand-500 hover:to-brand-600 text-white font-bold text-xs shadow-sm shadow-brand-500/25 active:scale-[0.98] transition-all duration-200 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span>Tugas Baru</span>
        </button>

        <button
          onClick={() =>
            handleAction(() => {
              onSelectView?.("dashboard");
              onSelectProject(null);
              onSelectStatus?.(null);
            })
          }
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group cursor-pointer ${
            currentView === "dashboard" && selectedProjectId === null
              ? "bg-brand-50/80 dark:bg-brand-500/15 text-brand-600 dark:text-white font-bold shadow-xs"
              : "text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2c2c2c]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <LayoutDashboard className="w-4 h-4 text-brand-500" />
            <span>Dashboard</span>
          </div>
        </button>

        <button
          onClick={() => alert("Tidak ada notifikasi baru saat ini.")}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2c2c2c] transition-all duration-200 group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-brand-500" />
            <span>Notifikasi</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-brand-500" />
        </button>

        {onOpenExportReport && (
          <button
            onClick={() => handleAction(onOpenExportReport)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2c2c2c] transition-all duration-200 group cursor-pointer"
            title="Buka Laporan & Ekspor"
          >
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-4 h-4 text-brand-500" />
              <span>Laporan & Ekspor</span>
            </div>
          </button>
        )}
      </div>

      {/* Main Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
        {/* ClickUp SPACES Header & Projects */}
        <div>
          <div className="px-2 mb-2 flex items-center justify-between">
            <button
              onClick={() => setSpacesCollapsed(!spacesCollapsed)}
              className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
            >
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-200 ${
                  spacesCollapsed ? "-rotate-90" : ""
                }`}
              />
              <span>SPACES / WORKSPACES</span>
            </button>
            <button
              onClick={() => handleAction(onOpenCreateProject)}
              title="Buat Space Baru"
              className="p-1 rounded-lg text-slate-400 hover:text-brand-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2c2c2c] transition-all duration-200 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {!spacesCollapsed && (
            <div className="space-y-1">
              <button
                onClick={() =>
                  handleAction(() => {
                    onSelectProject(null);
                    onSelectStatus?.(null);
                  })
                }
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                  selectedProjectId === null
                    ? "bg-brand-50/80 dark:bg-brand-500/15 text-brand-600 dark:text-white font-bold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2c2c2c]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-brand-500" />
                  <span>Semua Spaces</span>
                </div>
              </button>

              {projects.map((proj) => {
                const isSelected = selectedProjectId === proj.id;
                return (
                  <button
                    key={proj.id}
                    onClick={() => handleAction(() => onSelectProject(proj.id))}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 group ${
                      isSelected
                        ? "bg-brand-50/80 dark:bg-brand-500/15 text-brand-600 dark:text-white font-bold shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2c2c2c]"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-md shrink-0 shadow-xs"
                        style={{ backgroundColor: proj.color || "#ee3726" }}
                      />
                      <span className="truncate">{proj.name}</span>
                    </div>
                    {proj._count?.tasks !== undefined && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-colors ${
                          isSelected
                            ? "bg-white text-black dark:bg-white dark:text-black shadow-xs font-black"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200"
                        }`}
                      >
                        {proj._count.tasks}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* PWA Install Button if available */}
      {installPrompt && (
        <div className="p-3 mx-3 mb-3 rounded-2xl bg-brand-50 border border-brand-200 dark:bg-brand-950/70 dark:border-brand-500/40 shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-brand-500" />
              <span>Instal ClickUp PWA</span>
            </div>
          </div>
          <button
            onClick={onInstallApp}
            className="w-full py-1.5 px-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs transition-all duration-200 shadow-sm active:scale-95"
          >
            Pasang Aplikasi
          </button>
        </div>
      )}
    </div>
  );
}

export function Sidebar(props: SidebarProps) {
  const { isMobileOpen = false, onCloseMobile } = props;

  return (
    <>
      {/* 1. Desktop Layout (lg ke atas): Fixed left sidebar */}
      <aside className="hidden lg:flex w-64 bg-white dark:bg-[#222222] border-r border-slate-200 dark:border-[#333333] flex-col h-screen select-none shrink-0 font-sans z-20">
        <SidebarInner {...props} isMobileView={false} />
      </aside>

      {/* 2. Tata Letak Seluler & Tablet (di bawah lg): Shadcn Sheet (Drawer) */}
      <Sheet open={isMobileOpen} onOpenChange={(open) => !open && onCloseMobile?.()}>
        <SheetContent
          side="left"
          hideCloseButton
          className="p-0 w-72 sm:w-80 border-r border-slate-200 dark:border-[#333333] bg-white dark:bg-[#222222] flex flex-col h-full"
        >
          <SidebarInner {...props} isMobileView={true} />
        </SheetContent>
      </Sheet>
    </>
  );
}
