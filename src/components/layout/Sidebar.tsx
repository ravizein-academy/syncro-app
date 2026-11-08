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
  Settings2,
  X,
  ShieldCheck,
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
  onEditProject?: (project: Project) => void;
  onOpenCreateTask?: () => void;
  onOpenExportReport?: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
  isAdmin?: boolean;
  onOpenUserManagement?: () => void;
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
  onEditProject,
  onOpenCreateTask,
  onOpenExportReport,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  isAdmin = false,
  onOpenUserManagement,
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
          onClick={() => {
            if (onOpenNotifications) {
              handleAction(onOpenNotifications);
            }
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2c2c2c] transition-all duration-200 group cursor-pointer"
          title="Buka Pusat Notifikasi & Kegiatan"
        >
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Bell className="w-4 h-4 text-brand-500" />
              {unreadNotificationsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 absolute -top-0.5 -right-0.5 animate-pulse" />
              )}
            </div>
            <span>Notifikasi</span>
          </div>
          {unreadNotificationsCount > 0 ? (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-rose-500 text-white shrink-0 shadow-xs">
              {unreadNotificationsCount}
            </span>
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
          )}
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

        {isAdmin && onOpenUserManagement && (
          <button
            onClick={() => handleAction(onOpenUserManagement)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 transition-all duration-200 group cursor-pointer"
            title="Manajemen Pengguna & Akses (Khusus Admin)"
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span>Kelola Pengguna</span>
            </div>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400">
              Admin
            </span>
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
                  <div
                    key={proj.id}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 group ${
                      isSelected
                        ? "bg-brand-50/80 dark:bg-brand-500/15 text-brand-600 dark:text-white font-bold shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2c2c2c]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleAction(() => onSelectProject(proj.id))}
                      className="flex items-center gap-2 truncate flex-1 text-left cursor-pointer focus:outline-none"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-md shrink-0 shadow-xs"
                        style={{ backgroundColor: proj.color || "#ee3726" }}
                      />
                      <span className="truncate">{proj.name}</span>
                    </button>

                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      {proj._count?.tasks !== undefined && proj._count.tasks > 0 && (
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

                      {onEditProject && (
                        <button
                          type="button"
                          title="Pengaturan Space"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditProject(proj);
                          }}
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#383838] transition cursor-pointer"
                        >
                          <Settings2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
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
