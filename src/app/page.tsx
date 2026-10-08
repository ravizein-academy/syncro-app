'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '../lib/store';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { HomeView } from '../components/HomeView';
import { PlannerView } from '../components/PlannerView';
import { TeamsView } from '../components/TeamsView';
import { AiView } from '../components/AiView';
import { SettingsView } from '../components/SettingsView';
import { ChannelsView } from '../components/ChannelsView';
import { TaskFormView } from '../components/TaskFormView';
import { LoginView } from '../components/LoginView';
import { InviteModal } from '../components/InviteModal';

function AppContent() {
  const {
    activeTab,
    selectedTaskId,
    setSelectedTaskId,
    addTask,
    setGoogleScriptUrl,
    setGeminiApiKey,
    syncWithGoogleSheets,
    isAuthenticated,
    loginUser,
  } = useAppStore();

  const [mounted, setMounted] = useState(false);

  // Register PWA Service Worker on client mount & hydrate session
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => console.log('Syncro PWA Service Worker registered'))
        .catch((err) => console.log('Service Worker registration error:', err));
    }

    // Hydrate user auth session
    const isRemembered = localStorage.getItem('SYNCRO_REMEMBER') === 'true';
    const savedAuth = isRemembered 
      ? localStorage.getItem('SYNCRO_AUTH_USER') 
      : (typeof window !== 'undefined' ? sessionStorage.getItem('SYNCRO_AUTH_USER') : null);

    if (savedAuth) {
      try {
        const user = JSON.parse(savedAuth);
        if (user && user.email) {
          loginUser(user);
        }
      } catch (err) {
        console.error('Failed to parse saved auth', err);
      }
    }

    // Hydrate settings
    const savedUrl = localStorage.getItem('SYNCRO_APPS_SCRIPT_URL') || process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || '';
    const savedKey = localStorage.getItem('SYNCRO_GEMINI_KEY') || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

    if (savedUrl) {
      setGoogleScriptUrl(savedUrl);
      syncWithGoogleSheets();
    }
    if (savedKey) setGeminiApiKey(savedKey);
  }, [setGoogleScriptUrl, setGeminiApiKey, syncWithGoogleSheets, loginUser]);

  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white text-slate-600">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ee3425] shadow-lg shadow-red-500/20 animate-pulse flex items-center justify-center text-white font-bold text-lg">
            S
          </div>
          <span className="text-xs font-mono font-semibold text-slate-700 tracking-wider">Memuat Syncro...</span>
        </div>
      </div>
    );
  }

  // Gatekeeper: Show LoginView before accessing the application
  if (!isAuthenticated) {
    return <LoginView />;
  }

  const handleOpenCreateTask = () => {
    const newTask = addTask({
      title: 'Tugas Baru',
      description: '',
      status: 'todo',
      priority: 'medium'
    });
    setSelectedTaskId(newTask.id);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-900 antialiased select-none">
      {/* ClickUp Sidebar */}
      <Sidebar onOpenCreateTask={handleOpenCreateTask} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <Header onOpenAiBrain={() => useAppStore.getState().setActiveTab('ai')} />

        {/* Dynamic View: If a task is selected, show integrated TaskFormView directly in page (NO POPUP!) */}
        <main className="flex-1 overflow-hidden relative bg-slate-50">
          {selectedTaskId ? (
            <TaskFormView
              taskId={selectedTaskId}
              onBack={() => setSelectedTaskId(null)}
            />
          ) : (
            <>
              {activeTab === 'home' && (
                <HomeView
                  onSelectTask={(id) => setSelectedTaskId(id)}
                  onOpenCreateTask={handleOpenCreateTask}
                />
              )}

              {activeTab === 'planner' && (
                <PlannerView onSelectTask={(id) => setSelectedTaskId(id)} />
              )}

              {activeTab === 'teams' && <TeamsView />}

              {activeTab === 'ai' && <AiView />}

              {(activeTab === 'channels' || activeTab === 'dm') && <ChannelsView />}

              {activeTab === 'settings' && <SettingsView />}

              {activeTab === 'inbox' && (
                <div className="p-6 h-full overflow-y-auto max-w-3xl mx-auto space-y-4">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ee3425]" />
                    Syncro Inbox & Pemberitahuan
                  </h2>
                  <div className="space-y-2">
                    {useAppStore.getState().notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          if (n.taskId) setSelectedTaskId(n.taskId);
                        }}
                        className="p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-xs cursor-pointer transition shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                          <span className="text-xs text-slate-400">{n.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Modal Undang Rekan Kerja */}
      <InviteModal />
    </div>
  );
}

export default dynamic(() => Promise.resolve(AppContent), { ssr: false });
