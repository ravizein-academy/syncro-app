'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import {
  Search,
  Bell,
  RefreshCw,
  Sparkles,
  Play,
  Pause,
  Square,
  Clock,
  DownloadCloud
} from 'lucide-react';
import { formatSeconds } from '../lib/utils';

interface HeaderProps {
  onOpenAiBrain: () => void;
}

export function Header({ onOpenAiBrain }: HeaderProps) {
  const {
    activeTab,
    spaces,
    activeSpaceId,
    searchQuery,
    setSearchQuery,
    activeTimer,
    pauseTimer,
    startTimer,
    stopTimer,
    tickTimer,
    tasks,
    syncWithGoogleSheets,
    isSyncing,
    syncStatus,
    syncMessage,
    notifications,
    markNotificationRead
  } = useAppStore();

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Interval for ticking active timer
  useEffect(() => {
    if (!activeTimer || !activeTimer.isRunning) return;
    const interval = setInterval(() => {
      tickTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTimer, tickTimer]);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const activeSpace = spaces.find((s) => s.id === activeSpaceId);
  const activeTask = activeTimer ? tasks.find((t) => t.id === activeTimer.taskId) : null;
  const unreadNotifs = notifications.filter((n) => !n.read);

  return (
    <header className="h-14 border-b border-slate-200 bg-white px-5 flex items-center justify-between gap-4 z-20 shrink-0 shadow-xs">
      {/* Breadcrumb / Space Title - ClickUp Style */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs font-semibold text-slate-800 tracking-tight">Syncro</span>
        <span className="text-slate-300">/</span>
        <span className="text-xs text-slate-500 capitalize">{activeTab}</span>
        {activeSpace && activeSpaceId !== 'space_all' && (
          <>
            <span className="text-slate-300">/</span>
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: activeSpace.color || '#ee3425' }}
              />
              <h2 className="text-xs font-semibold text-slate-700 truncate">
                {activeSpace.name}
              </h2>
            </div>
          </>
        )}
      </div>

      {/* Center Search Bar - ClickUp Style */}
      <div className="flex-1 max-w-md relative hidden md:block">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari tugas di Syncro..."
          className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#ee3425] focus:ring-1 focus:ring-[#ee3425] transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-700"
          >
            ✕
          </button>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Active Time Tracker Pill */}
        {activeTimer ? (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 shadow-xs">
            <Clock className="w-3.5 h-3.5 text-[#ee3425] animate-pulse shrink-0" />
            <span className="font-mono font-bold text-[#ee3425]">
              {formatSeconds(activeTimer.elapsedSeconds)}
            </span>
            <span className="text-[11px] text-slate-600 max-w-[90px] truncate hidden sm:inline">
              {activeTask?.title || 'Tugas'}
            </span>

            <div className="flex items-center gap-1 ml-1 border-l border-red-200 pl-1.5">
              {activeTimer.isRunning ? (
                <button
                  onClick={pauseTimer}
                  title="Pause Timer"
                  className="p-1 hover:bg-red-100 rounded text-amber-600 cursor-pointer"
                >
                  <Pause className="w-3 h-3" />
                </button>
              ) : (
                <button
                  onClick={() => startTimer(activeTimer.taskId)}
                  title="Lanjutkan Timer"
                  className="p-1 hover:bg-red-100 rounded text-emerald-600 cursor-pointer"
                >
                  <Play className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={stopTimer}
                title="Hentikan dan Catat Waktu (Log)"
                className="p-1 hover:bg-red-100 rounded text-[#ee3425] cursor-pointer"
              >
                <Square className="w-3 h-3 fill-[#ee3425]" />
              </button>
            </div>
          </div>
        ) : null}

        {/* Sync Google Sheets Button */}
        <button
          onClick={syncWithGoogleSheets}
          disabled={isSyncing}
          title={syncMessage || 'Sinkronkan dengan Google Sheets'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
            isSyncing
              ? 'bg-slate-50 border-[#ee3425] text-[#ee3425]'
              : syncStatus === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
              : syncStatus === 'error'
              ? 'bg-red-50 border-red-200 text-[#ee3425] hover:bg-red-100'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#ee3425]' : ''}`} />
          <span className="hidden sm:inline">
            {isSyncing ? 'Syncing...' : syncStatus === 'success' ? 'Sheets Aktif' : 'Sheets Sync'}
          </span>
        </button>

        {/* Syncro AI Brain Button */}
        <button
          onClick={onOpenAiBrain}
          className="flex items-center gap-1.5 bg-[#ee3425] hover:bg-[#d6281a] text-white font-semibold text-xs px-3 py-1.5 rounded-lg shadow-sm shadow-red-500/20 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span className="hidden sm:inline">Syncro AI</span>
        </button>

        {/* PWA Install Button (if prompt ready) */}
        {installPrompt && (
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 transition cursor-pointer"
          >
            <DownloadCloud className="w-3.5 h-3.5 text-[#ee3425]" />
            <span className="hidden sm:inline">Install PWA</span>
          </button>
        )}

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifs.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ee3425] ring-2 ring-white" />
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50">
              <div className="flex items-center justify-between p-2 border-b border-slate-100 text-xs font-semibold text-slate-800">
                <span>Notifikasi ({unreadNotifs.length} baru)</span>
                <button
                  onClick={() => {
                    unreadNotifs.forEach((n) => markNotificationRead(n.id));
                    setShowNotifMenu(false);
                  }}
                  className="text-[11px] text-[#ee3425] hover:underline cursor-pointer"
                >
                  Tandai semua dibaca
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 py-1">
                {notifications.length === 0 ? (
                  <p className="p-3 text-xs text-slate-400 text-center">Tidak ada notifikasi</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-2.5 hover:bg-slate-50 rounded-lg cursor-pointer transition ${
                        !n.read ? 'bg-red-50/50' : 'opacity-70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                        <span className="text-[10px] text-slate-400 shrink-0">{n.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
