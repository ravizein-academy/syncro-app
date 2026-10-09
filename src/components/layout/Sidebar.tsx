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
  Layers
} from 'lucide-react';

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

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-slate-900 text-slate-100">
      <div className="flex h-16 items-center px-6">
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
          Syncro
        </h1>
      </div>
      
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all ${
                isActive 
                  ? 'bg-blue-600/15 text-blue-400 font-semibold border-l-2 border-blue-500 pl-2.5' 
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`h-4.5 w-4.5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-semibold">
            JD
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">John Doe</span>
            <span className="text-xs text-slate-500">Free Tier</span>
          </div>
        </div>
      </div>
    </div>
  );
}
