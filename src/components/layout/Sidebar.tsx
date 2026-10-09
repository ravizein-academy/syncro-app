"use client";

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
  FolderKanban
} from 'lucide-react';
import { useStore } from '@/store/useStore';

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Inbox', href: '/inbox', icon: Inbox },
  { name: 'My Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Planner', href: '/planner', icon: Calendar },
  { name: 'Spaces', href: '/spaces', icon: Briefcase },
  { name: 'Teams & Workload', href: '/teams', icon: Users },
  { name: 'Channels', href: '/channels', icon: Hash },
  { name: 'Direct Messages', href: '/dm', icon: MessageSquare },
  { name: 'Gemini AI Brain', href: '/ai', icon: Sparkles, badge: 'AI' },
  { name: 'Google Ecosystem', href: '/integrations', icon: Layers },
];

export function Sidebar() {
  const pathname = usePathname();
  const { spaces } = useStore();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-[#1e2029] bg-[#0c0d12] text-slate-200 select-none shrink-0">
      {/* Workspace Switcher ClickUp-Style */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-[#1e2029]/80 bg-[#0e0f15]">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-rose-500 to-red-700 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-rose-900/30 ring-1 ring-rose-400/40">
            S
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold tracking-tight text-white">Syncro</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                PRO
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block -mt-0.5">ClickUp Red Edition</span>
          </div>
        </div>
        <ChevronDown size={14} className="text-slate-500" />
      </div>
      
      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 pb-1.5">
          Navigasi Utama
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-all ${
                isActive 
                  ? 'bg-rose-500/15 text-rose-300 font-semibold border-l-2 border-rose-500 shadow-sm shadow-rose-950/40 pl-2.5' 
                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <item.icon className={`h-4 w-4 ${isActive ? 'text-rose-400' : 'text-slate-400'}`} />
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
          <div className="flex items-center justify-between px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <span>Spaces Proyek</span>
            <Link href="/spaces" className="text-rose-400 hover:text-rose-300 text-[10px] lowercase font-normal">
              + baru
            </Link>
          </div>
          <div className="space-y-1">
            {spaces.slice(0, 4).map((space) => (
              <Link
                key={space.id}
                href="/tasks"
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] transition"
              >
                <div className="h-2 w-2 rounded-full bg-rose-500 ring-1 ring-rose-400/50" />
                <span className="truncate">{space.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>
      
      {/* User Footer */}
      <div className="border-t border-[#1e2029] p-3.5 bg-[#0a0b10]">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-rose-500 to-red-700 flex items-center justify-center text-xs font-bold text-white shadow ring-1 ring-rose-400/40">
              RZ
            </div>
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-[#0a0b10]" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-slate-200 truncate">Ravi Zein</span>
            <span className="text-[10px] text-slate-500">Workspace Owner</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
