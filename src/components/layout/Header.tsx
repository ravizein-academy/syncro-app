"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  Kanban,
  List,
  Plus,
  Search,
  Calendar,
  BarChart3,
  Filter,
  Layers,
  Star,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Menu,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

interface HeaderProps {
  currentView: "dashboard" | "kanban" | "list";
  onViewChange: (view: "dashboard" | "kanban" | "list") => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenCreateTask?: () => void;
  activeProjectName?: string;
  totalTasks: number;
  onToggleMobileSidebar?: () => void;
}

export function Header({
  currentView,
  onViewChange,
  searchQuery,
  onSearchChange,
  activeProjectName = "Semua Tugas",
  totalTasks,
  onToggleMobileSidebar,
}: HeaderProps) {
  const { data: session } = useSession();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userName = session?.user?.name || "Ravi Zein Permana";
  const userEmail = session?.user?.email || "ravizein@itsecacademy.com";

  // ClickUp avatar initials ("RP" for Ravi Permana)
  const getInitials = (name: string, email: string) => {
    if (email.includes("ravizein") || name.toLowerCase().includes("ravi")) {
      return "RP";
    }
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || "RP";
  };
  const initials = getInitials(userName, userEmail);

  return (
    <header className="border-b border-slate-200 dark:border-[#333333] bg-white dark:bg-[#222222] flex flex-col shrink-0 z-10 font-sans transition-colors">
      {/* Top Level: Breadcrumbs & Primary Actions */}
      <div className="h-14 px-3 sm:px-4 md:px-6 flex items-center justify-between border-b border-slate-200 dark:border-[#333333] gap-2">
        {/* Left: Mobile Menu Toggle + Breadcrumbs & Star */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="p-1.5 -ml-1 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2c2c2c] lg:hidden transition cursor-pointer shrink-0"
              title="Buka Navigasi Menu"
              aria-label="Toggle navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-1 sm:gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
            <span className="hidden sm:inline hover:text-slate-900 dark:hover:text-white cursor-pointer">
              Spaces
            </span>
            <span className="hidden sm:inline">/</span>
            <div className="flex items-center gap-1 truncate">
              <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate max-w-[100px] xs:max-w-[150px] sm:max-w-none">
                {activeProjectName}
              </span>
              <button
                title="Favoritkan Space ini"
                className="p-0.5 sm:p-1 text-slate-400 hover:text-amber-400 transition shrink-0"
              >
                <Star className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#282828] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#383838] shrink-0">
              {totalTasks}
            </span>
          </div>
        </div>

        {/* Right Actions: Search + User Status */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Quick Search */}
          <div className="relative w-28 xs:w-36 sm:w-48 md:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 sm:left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari... (⌘F)"
              className="w-full pl-8 sm:pl-9 pr-2.5 sm:pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-[#2a2a2a] border border-slate-200 dark:border-[#3a3a3a] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-[#1e1e1e] transition-all"
            />
          </div>


          {/* ClickUp Style User Profile Avatar Dropdown Menu (RP Badge) */}
          <div className="relative pl-1 sm:pl-2 border-l border-slate-200 dark:border-[#333333]" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="flex items-center gap-1.5 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-[#2c2c2c] transition cursor-pointer select-none group focus:outline-none"
              title={`Akun: ${userName}`}
            >
              {/* Blue Circle Avatar with Initials RP and Green Status Indicator */}
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-600 flex items-center justify-center text-white font-extrabold text-[12px] shadow-xs select-none">
                  {initials}
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#222222] absolute -bottom-0.5 -right-0.5" />
              </div>

              {/* Subtle Chevron Down */}
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-transform ${
                  isProfileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* ClickUp Profile Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white dark:bg-[#282828] border border-slate-200 dark:border-[#383838] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* User Info Header */}
                <div className="p-2.5 flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-extrabold text-xs shadow-xs">
                      {initials}
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#282828] absolute -bottom-0.5 -right-0.5" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {userName}
                    </div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 leading-tight font-mono truncate">
                      <ShieldCheck className="w-3 h-3 shrink-0" />
                      <span className="truncate">{userEmail}</span>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="my-1 border-t border-slate-100 dark:border-[#333333]" />

                {/* Status indicator row */}
                <div className="px-2.5 py-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Status</span>
                  <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online (Active)
                  </span>
                </div>

                {/* Divider */}
                <div className="my-1 border-t border-slate-100 dark:border-[#333333]" />

                {/* Sign out button */}
                <button
                  onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar dari Akun</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Second Level: ClickUp Views Bar (Dashboard, List, Board, Calendar, Gantt, + View) */}
      <div className="h-10 px-3 md:px-6 flex items-center justify-between overflow-x-auto no-scrollbar select-none">
        {/* Left: View Tabs */}
        <div className="flex items-center gap-1 h-full shrink-0">
          {/* Dashboard View Tab */}
          <button
            onClick={() => onViewChange("dashboard")}
            className={`shrink-0 flex items-center gap-2 px-3 h-full text-xs font-semibold border-b-2 transition cursor-pointer ${
              currentView === "dashboard"
                ? "border-brand-500 text-brand-600 dark:text-brand-400 font-bold"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          {/* List View Tab */}
          <button
            onClick={() => onViewChange("list")}
            className={`shrink-0 flex items-center gap-2 px-3 h-full text-xs font-semibold border-b-2 transition ${
              currentView === "list"
                ? "border-brand-500 text-brand-600 dark:text-brand-400 font-bold"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold transition-colors ${
                currentView === "list"
                  ? "bg-brand-500/10 text-brand-600 dark:bg-white dark:text-black font-black"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-white hover:text-black dark:hover:bg-white dark:hover:text-black"
              }`}
            >
              {totalTasks}
            </span>
          </button>

          {/* Board (Kanban) View Tab */}
          <button
            onClick={() => onViewChange("kanban")}
            className={`shrink-0 flex items-center gap-2 px-3 h-full text-xs font-semibold border-b-2 transition ${
              currentView === "kanban"
                ? "border-brand-500 text-brand-600 dark:text-brand-400 font-bold"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Board</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold transition-colors ${
                currentView === "kanban"
                  ? "bg-brand-500/10 text-brand-600 dark:bg-white dark:text-black font-black"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-white hover:text-black dark:hover:bg-white dark:hover:text-black"
              }`}
            >
              {totalTasks}
            </span>
          </button>

          {/* Calendar View Tab */}
          <button
            onClick={() => alert("Fitur Kalender akan menampilkan tugas berdasar dueDate.")}
            className="hidden sm:flex items-center gap-2 px-3 h-full text-xs font-medium border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendar</span>
          </button>

          {/* Gantt View Tab */}
          <button
            onClick={() => alert("Fitur Gantt Timeline sedang dalam roadmap rilis internal.")}
            className="hidden md:flex items-center gap-2 px-3 h-full text-xs font-medium border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Gantt</span>
          </button>

          {/* "+ View" ClickUp button */}
          <button
            onClick={() => alert("Anda dapat menambahkan view Tabel, Map, atau Form.")}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Plus className="w-3 h-3" />
            <span>View</span>
          </button>
        </div>

        {/* Right: ClickUp View Controls (Filter, Group By) */}
        <div className="flex items-center gap-2">

          <button
            onClick={() => alert("Filter lanjutan berdasarkan assignee, priority, atau tag.")}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Filter className="w-3 h-3" />
            <span>Filter</span>
          </button>

          <button
            onClick={() => alert("Tugas saat ini dikelompokkan berdasarkan Status.")}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Layers className="w-3 h-3" />
            <span>Group: Status</span>
          </button>
        </div>
      </div>
    </header>
  );
}
