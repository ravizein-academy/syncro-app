'use client';

import React from 'react';
import { useAppStore } from '../lib/store';
import {
  Inbox,
  CheckSquare,
  Calendar,
  Users,
  Sparkles,
  Settings,
  MessageSquare,
  Layers,
  Plus,
  Radio,
  ChevronDown,
  Shield,
  BookOpen,
  Terminal,
  FolderOpen,
  Home,
  LogOut
} from 'lucide-react';
import { ActiveTab } from '../types';

interface SidebarProps {
  onOpenCreateTask: () => void;
}

export function Sidebar({ onOpenCreateTask }: SidebarProps) {
  const {
    activeTab,
    setActiveTab,
    spaces,
    activeSpaceId,
    setActiveSpaceId,
    tasks,
    notifications,
    currentUser,
    activeTimer,
    syncStatus,
    setSelectedTaskId,
    logoutUser
  } = useAppStore();

  const unreadNotifs = notifications.filter((n) => !n.read).length;
  const myTasksCount = tasks.filter((t) => t.assignedTo === currentUser.id && t.status !== 'done').length;

  const navItems: { tab: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { tab: 'home', label: 'My Tasks', icon: <CheckSquare className="w-4 h-4" />, badge: myTasksCount },
    { tab: 'planner', label: 'Planner & Time', icon: <Calendar className="w-4 h-4" /> },
    { tab: 'teams', label: 'Teams & Workload', icon: <Users className="w-4 h-4" /> },
    { tab: 'ai', label: 'Syncro AI Brain', icon: <Sparkles className="w-4 h-4 text-[#ee3425]" /> },
    { tab: 'inbox', label: 'Inbox', icon: <Inbox className="w-4 h-4" />, badge: unreadNotifs },
    { tab: 'channels', label: 'Channels & Chat', icon: <MessageSquare className="w-4 h-4" /> },
    { tab: 'settings', label: 'Integrasi & Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 bg-white text-slate-700 border-r border-slate-200 flex flex-col h-screen select-none shrink-0 shadow-sm">
      {/* Workspace Brand Header - ClickUp Style */}
      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50/60 transition cursor-pointer">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#ee3425] flex items-center justify-center font-bold text-white shadow-md shadow-red-500/20 shrink-0">
            S
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-1.5 truncate">
              <span>Syncro</span>
              <span className="text-[10px] bg-red-50 text-[#ee3425] font-mono px-1.5 py-0.2 rounded border border-red-200">
                PRO
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 truncate">Workspace</p>
          </div>
        </div>

        {/* Sync Indicator */}
        <div
          title={
            syncStatus === 'success'
              ? 'Google Sheets Terhubung'
              : syncStatus === 'error'
              ? 'Koneksi Error'
              : 'Standby / Siap'
          }
          className={`w-2.5 h-2.5 rounded-full ${
            syncStatus === 'success'
              ? 'bg-emerald-500 ring-4 ring-emerald-100'
              : syncStatus === 'error'
              ? 'bg-[#ee3425] ring-4 ring-red-100'
              : 'bg-amber-400 ring-4 ring-amber-100'
          }`}
        />
      </div>

      {/* ClickUp Style Quick Add Task Button */}
      <div className="px-3 pt-3 pb-2">
        <button
          onClick={onOpenCreateTask}
          className="w-full flex items-center justify-center gap-2 bg-[#ee3425] hover:bg-[#d6281a] text-white font-semibold text-xs py-2 px-3 rounded-lg shadow-sm shadow-red-500/25 transition-all cursor-pointer active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Buat Tugas Baru</span>
        </button>
      </div>

      {/* Main Navigation Items */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 text-xs">
        <div className="px-2.5 pb-1.5 pt-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
          Menu
        </div>

        {navItems.map((item) => {
          const isActive = activeTab === item.tab;
          return (
            <button
              key={item.tab}
              onClick={() => {
                setActiveTab(item.tab);
                setSelectedTaskId(null);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg font-medium transition cursor-pointer text-left ${
                isActive
                  ? 'bg-red-50 text-[#ee3425] font-semibold border-l-3 border-[#ee3425]'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-[#ee3425]' : 'text-slate-500'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-[#ee3425] text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Spaces Section */}
        <div className="pt-4 pb-1.5 px-2.5 flex items-center justify-between text-[10px] font-bold tracking-wider text-slate-400 uppercase">
          <span>Spaces</span>
          <FolderOpen className="w-3.5 h-3.5" />
        </div>

        <div className="space-y-0.5">
          {spaces.map((space) => {
            const isSelected = activeSpaceId === space.id;
            const count =
              space.id === 'space_all'
                ? tasks.length
                : tasks.filter((t) => t.spaceId === space.id).length;

            return (
              <button
                key={space.id}
                onClick={() => {
                  setActiveSpaceId(space.id);
                  setSelectedTaskId(null);
                  if (activeTab !== 'home' && activeTab !== 'planner') {
                    setActiveTab('home');
                  }
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer text-left ${
                  isSelected
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: space.color || '#ee3425' }}
                  />
                  <span className="truncate">{space.name}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Timer Pill in Sidebar Footer (if timer active) */}
      {activeTimer && (
        <div className="mx-2.5 mb-2 p-2.5 rounded-lg bg-red-50 border border-red-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <Radio className="w-3.5 h-3.5 text-[#ee3425] animate-pulse shrink-0" />
            <div className="truncate">
              <p className="text-[10px] text-red-600 font-semibold">Live Tracking</p>
              <p className="text-slate-900 font-mono font-bold">
                {Math.floor(activeTimer.elapsedSeconds / 60)}m {activeTimer.elapsedSeconds % 60}s
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('planner')}
            className="text-[11px] font-semibold text-[#ee3425] hover:underline cursor-pointer shrink-0"
          >
            Lihat
          </button>
        </div>
      )}

      {/* Current User Card */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">{currentUser.name}</p>
            <p className="text-[10px] text-slate-500 truncate">{currentUser.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-medium">
            {currentUser.role}
          </span>
          <button
            onClick={() => {
              if (confirm(`Keluar dari akun ${currentUser.name}?`)) {
                logoutUser();
              }
            }}
            title="Keluar / Logout"
            className="p-1 rounded-md text-slate-400 hover:text-[#ee3425] hover:bg-red-50 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
