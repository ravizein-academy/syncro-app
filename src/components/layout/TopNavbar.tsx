"use client";

import Link from "next/link";
import { useStore } from "@/store/useStore";
import { 
  Bell, 
  Sparkles, 
  Search, 
  Sun, 
  Moon, 
  Menu,
  Cloud,
  RefreshCw,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { translations } from "@/lib/i18n";
import { useState, useRef, useEffect } from "react";
import { performAutoCloudSync } from "@/lib/sync";

export function TopNavbar() {
  const { 
    notifications,
    theme,
    toggleTheme,
    language,
    setLanguage,
    toggleMobileSidebar,
    cloudSyncStatus,
    lastCloudSync,
    lastCloudSyncMessage,
    isAutoSyncEnabled,
    toggleAutoSync,
    tasks
  } = useStore();

  const t = translations[language || 'id'];
  const unreadCount = notifications.filter((n) => !n.read).length;
  const [isSyncPopoverOpen, setIsSyncPopoverOpen] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsSyncPopoverOpen(false);
      }
    }
    if (isSyncPopoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSyncPopoverOpen]);

  const handleManualSync = async () => {
    if (cloudSyncStatus === 'syncing' || isManualSyncing) return;
    setIsManualSyncing(true);
    try {
      await performAutoCloudSync({ force: true });
    } finally {
      setIsManualSyncing(false);
    }
  };

  const isCurrentlySyncing = cloudSyncStatus === 'syncing' || isManualSyncing;

  return (
    <header className="h-16 border-b border-border bg-card/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between z-20 sticky top-0 select-none transition-colors duration-200">
      {/* Left Section: Mobile Menu Toggle & Brand / Desktop Search */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={toggleMobileSidebar}
          className="lg:hidden p-2 -ml-1 rounded-xl text-foreground hover:bg-secondary border border-border/60 transition flex items-center justify-center"
          aria-label="Buka Menu Navigasi"
        >
          <Menu size={19} className="text-foreground" />
        </button>

        {/* Mobile Brand Title */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#EE3726] to-[#BA1E10] flex items-center justify-center text-white font-black text-xs shadow-sm">
            S
          </div>
          <span className="text-sm font-extrabold text-foreground tracking-tight">Syncro</span>
        </div>

        {/* Desktop Search Input */}
        <div className="hidden md:flex items-center w-60 lg:w-72">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder={t.searchPlaceholder} 
              className="pl-9 h-9 bg-secondary border-border text-xs text-foreground placeholder:text-muted-foreground focus-visible:ring-[#EE3726] rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Right controls: Cloud Sync, Language Switcher, Theme Switcher, Gemini AI, Notifications */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Google Sheets Automatic Cloud Sync Controller */}
        <div className="relative" ref={popoverRef}>
          <button
            onClick={() => setIsSyncPopoverOpen((prev) => !prev)}
            title="Google Sheets Auto-Sync: Tersinkron otomatis secara real-time"
            className={`h-8 px-2 sm:px-2.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition shrink-0 ${
              isCurrentlySyncing
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                : cloudSyncStatus === 'error'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            {isCurrentlySyncing ? (
              <>
                <RefreshCw size={13} className="animate-spin text-amber-500" />
                <span className="hidden md:inline">{t.autoSyncSyncing}</span>
              </>
            ) : cloudSyncStatus === 'error' ? (
              <>
                <Cloud size={13} className="text-rose-500" />
                <span className="hidden md:inline">Offline Cache</span>
              </>
            ) : (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Cloud size={13} className="text-emerald-500" />
                <span className="hidden md:inline">{t.autoSyncActive}</span>
                {lastCloudSync && (
                  <span className="hidden lg:inline text-[10px] opacity-75 font-mono">
                    ({lastCloudSync})
                  </span>
                )}
              </>
            )}
          </button>

          {/* Auto-Sync Details & Control Dropdown */}
          {isSyncPopoverOpen && (
            <div className="absolute right-0 top-10 w-80 rounded-xl bg-card border border-border shadow-2xl p-3.5 z-50 text-foreground animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between pb-2.5 border-b border-border/80">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <Cloud size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      {t.autoSyncTitle}
                    </h4>
                    <span className="text-[10px] text-muted-foreground block">
                      Google Sheets REST Backend
                    </span>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isAutoSyncEnabled
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-secondary border-border text-muted-foreground'
                }`}>
                  {isAutoSyncEnabled ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>

              {/* Status Info */}
              <div className="py-2.5 space-y-2 text-xs">
                <div className="p-2 rounded-lg bg-secondary/60 border border-border text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>{t.autoSyncLastSynced}:</span>
                    <span className="font-mono font-medium text-foreground">
                      {lastCloudSync || 'Baru saja'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>{t.autoSyncTasksSaved}:</span>
                    <span className="font-semibold text-foreground">
                      {tasks.length} tasks
                    </span>
                  </div>
                  {lastCloudSyncMessage && (
                    <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/60 truncate">
                      {lastCloudSyncMessage}
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {t.autoSyncSubtitle}
                </p>
              </div>

              {/* Action Controls */}
              <div className="pt-2 border-t border-border/80 flex items-center justify-between gap-2">
                {/* Toggle Auto Sync */}
                <button
                  onClick={toggleAutoSync}
                  className="text-[11px] font-semibold text-muted-foreground hover:text-foreground transition underline underline-offset-2"
                >
                  {isAutoSyncEnabled ? 'Matikan Auto-Sync' : 'Aktifkan Auto-Sync'}
                </button>

                {/* Force Manual Sync Button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleManualSync}
                  disabled={isCurrentlySyncing}
                  className="h-7 text-xs px-2.5 gap-1.5 bg-[#EE3726] hover:bg-[#EE3726]/90 text-white border-transparent shadow-sm"
                >
                  <RefreshCw size={11} className={isCurrentlySyncing ? "animate-spin" : ""} />
                  <span>{t.autoSyncNowBtn}</span>
                </Button>
              </div>
            </div>
          )}
        </div>
        {/* Language Switcher */}
        <div className="flex items-center bg-secondary border border-border rounded-lg p-0.5 text-xs font-bold">
          <button
            onClick={() => setLanguage('id')}
            className={`px-1.5 sm:px-2 py-1 rounded transition text-[10px] sm:text-[11px] ${
              language === 'id' 
                ? 'bg-[#EE3726] text-white shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Bahasa Indonesia"
          >
            🇮🇩 ID
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-1.5 sm:px-2 py-1 rounded transition text-[10px] sm:text-[11px] ${
              language === 'en' 
                ? 'bg-[#EE3726] text-white shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="English"
          >
            🇬🇧 EN
          </button>
        </div>

        {/* Dark / Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? t.lightMode : t.darkMode}
          className="h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-secondary text-foreground hover:bg-accent transition shrink-0"
        >
          {theme === 'dark' ? (
            <Sun size={15} className="text-amber-400" />
          ) : (
            <Moon size={15} className="text-slate-600" />
          )}
        </button>

        {/* Gemini AI Shortcut */}
        <Link href="/ai" className="shrink-0">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-2 sm:px-3 gap-1 sm:gap-1.5 text-xs bg-[#EE3726]/10 border-[#EE3726]/30 text-[#EE3726] hover:bg-[#EE3726]/20 rounded-lg"
          >
            <Sparkles size={13} className="text-[#EE3726]" />
            <span className="hidden sm:inline">Gemini AI</span>
          </Button>
        </Link>

        {/* Notifications Inbox */}
        <Link href="/inbox" className="relative p-1.5 sm:p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition shrink-0">
          <Bell size={17} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#EE3726] text-[9px] font-extrabold text-white ring-2 ring-card">
              {unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
