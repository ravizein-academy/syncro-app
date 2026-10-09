"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Inbox, 
  CheckSquare, 
  Hash, 
  MessageSquare, 
  Briefcase, 
  Calendar, 
  LayoutDashboard,
  Users,
  Sparkles,
  Layers,
  ChevronDown,
  LogOut
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { translations } from '@/lib/i18n';
import { LogoutModal } from '@/components/layout/LogoutModal';

export function Sidebar() {
  const pathname = usePathname();
  const { spaces, language } = useStore();
  const t = translations[language || 'id'];
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const NAV_ITEMS = [
    { name: t.navDashboard, href: '/', icon: LayoutDashboard },
    { name: t.navInbox, href: '/inbox', icon: Inbox },
    { name: t.navMyTasks, href: '/tasks', icon: CheckSquare },
    { name: t.navPlanner, href: '/planner', icon: Calendar },
    { name: t.navSpaces, href: '/spaces', icon: Briefcase },
    { name: t.navTeams, href: '/teams', icon: Users },
    { name: t.navChannels, href: '/channels', icon: Hash },
    { name: t.navDM, href: '/dm', icon: MessageSquare },
    { name: t.navAI, href: '/ai', icon: Sparkles, badge: 'AI' },
    { name: t.navIntegrations, href: '/integrations', icon: Layers },
  ];

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card text-card-foreground select-none shrink-0 transition-colors duration-200">
      {/* Workspace Switcher ClickUp-Style */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border bg-card">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-rose-500 to-red-700 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-rose-900/30 ring-1 ring-rose-400/40">
            S
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold tracking-tight text-foreground">{t.brandName}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                PRO
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground block -mt-0.5">{t.brandTagline}</span>
          </div>
        </div>
        <ChevronDown size={14} className="text-muted-foreground" />
      </div>
      
      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 pb-1.5">
          {t.navMain}
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-all ${
                isActive 
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300 font-semibold border-l-2 border-rose-500 shadow-sm pl-2.5' 
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <item.icon className={`h-4 w-4 ${isActive ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="rounded-full bg-gradient-to-r from-rose-600 to-red-600 px-1.5 py-0.5 text-[10px] font-extrabold text-white shadow-sm shadow-rose-900/50">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Quick Spaces List in Sidebar */}
        <div className="pt-5">
          <div className="flex items-center justify-between px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <span>{t.spacesProject}</span>
            <Link href="/spaces" className="text-rose-600 dark:text-rose-400 hover:text-rose-500 text-[10px] lowercase font-normal">
              {t.newSpace}
            </Link>
          </div>
          <div className="space-y-1">
            {spaces.slice(0, 4).map((space) => (
              <Link
                key={space.id}
                href="/tasks"
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition"
              >
                <div className="h-2 w-2 rounded-full bg-rose-500 ring-1 ring-rose-400/50" />
                <span className="truncate">{space.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>
      
      {/* User Footer Profile Section with Logout Button */}
      <div className="border-t border-border p-3 bg-card">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#EE3726] to-[#BA1E10] flex items-center justify-center text-xs font-bold text-white shadow ring-1 ring-[#EE3726]/40">
                RZ
              </div>
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-card" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-foreground truncate">Ravi Zein</span>
              <span className="text-[10px] text-muted-foreground truncate">{t.workspaceOwner}</span>
            </div>
          </div>

          {/* Tombol Keluar */}
          <button
            onClick={() => setShowLogoutModal(true)}
            title={t.logout}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-muted-foreground hover:text-[#EE3726] hover:bg-secondary transition shrink-0"
          >
            <LogOut size={13} />
            <span>{t.logout}</span>
          </button>
        </div>
      </div>

      <LogoutModal
        open={showLogoutModal}
        onOpenChange={setShowLogoutModal}
      />
    </aside>
  );
}
