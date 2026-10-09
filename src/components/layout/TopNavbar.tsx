"use client";

import Link from "next/link";
import { useStore } from "@/store/useStore";
import { 
  Bell, 
  Sparkles, 
  Search, 
  Sun, 
  Moon, 
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { translations } from "@/lib/i18n";

export function TopNavbar() {
  const { 
    notifications,
    theme,
    toggleTheme,
    language,
    setLanguage,
    toggleMobileSidebar
  } = useStore();

  const t = translations[language || 'id'];
  const unreadCount = notifications.filter((n) => !n.read).length;

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

      {/* Right controls: Language Switcher, Theme Switcher, Gemini AI, Notifications, Profile Logout */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
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
