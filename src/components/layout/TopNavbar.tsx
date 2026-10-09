"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/store/useStore";
import { 
  Bell, 
  Sparkles, 
  Search,
  Sun,
  Moon,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { translations } from "@/lib/i18n";
import { LogoutModal } from "@/components/layout/LogoutModal";

export function TopNavbar() {
  const { 
    notifications,
    theme,
    toggleTheme,
    language,
    setLanguage
  } = useStore();

  const t = translations[language || 'id'];
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="h-16 border-b border-border bg-card/90 backdrop-blur-md px-6 flex items-center justify-between z-20 sticky top-0 select-none transition-colors duration-200">
      {/* Search Input */}
      <div className="flex items-center gap-3 w-72">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={t.searchPlaceholder} 
            className="pl-9 h-9 bg-secondary border-border text-xs text-foreground placeholder:text-muted-foreground focus-visible:ring-[#EE3726] rounded-lg"
          />
        </div>
      </div>

      {/* Right controls: Theme Switcher, Language Switcher, Gemini AI, Notifications, Profile Logout */}
      <div className="flex items-center gap-2.5">
        {/* Language Switcher */}
        <div className="flex items-center bg-secondary border border-border rounded-lg p-0.5 text-xs font-bold">
          <button
            onClick={() => setLanguage('id')}
            className={`px-2 py-1 rounded transition text-[11px] ${
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
            className={`px-2 py-1 rounded transition text-[11px] ${
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
          className="h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-secondary text-foreground hover:bg-accent transition"
        >
          {theme === 'dark' ? (
            <Sun size={15} className="text-amber-400" />
          ) : (
            <Moon size={15} className="text-slate-600" />
          )}
        </button>

        {/* Gemini AI Shortcut */}
        <Link href="/ai">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-1.5 text-xs bg-[#EE3726]/10 border-[#EE3726]/30 text-[#EE3726] hover:bg-[#EE3726]/20 rounded-lg"
          >
            <Sparkles size={14} className="text-[#EE3726]" />
            <span className="hidden sm:inline">Gemini AI</span>
          </Button>
        </Link>

        {/* Notifications Inbox */}
        <Link href="/inbox" className="relative p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition">
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#EE3726] text-[10px] font-extrabold text-white ring-2 ring-card">
              {unreadCount}
            </span>
          )}
        </Link>

        {/* Profile Section with Logout Button (Tombol Keluar) */}
        <div className="border-l border-border pl-2.5 flex items-center">
          <button
            onClick={() => setShowLogoutModal(true)}
            title={t.logout}
            className="flex items-center gap-2 py-1 px-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-[#EE3726] transition group border border-transparent hover:border-border"
          >
            <div className="relative">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#EE3726] to-[#BA1E10] flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-[#EE3726]/30">
                RZ
              </div>
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-card" />
            </div>
            <span className="hidden sm:inline text-xs font-semibold text-foreground group-hover:text-[#EE3726]">
              {t.logout}
            </span>
            <LogOut size={13} className="text-muted-foreground group-hover:text-[#EE3726]" />
          </button>
        </div>
      </div>

      <LogoutModal
        open={showLogoutModal}
        onOpenChange={setShowLogoutModal}
      />
    </header>
  );
}
