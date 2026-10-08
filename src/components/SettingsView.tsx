'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import {
  Settings,
  Database,
  Sparkles,
  Globe,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FolderSync,
  ExternalLink,
  Shield,
  Calendar,
  Video,
  HardDrive
} from 'lucide-react';

export function SettingsView() {
  const {
    googleScriptUrl,
    setGoogleScriptUrl,
    geminiApiKey,
    setGeminiApiKey,
    syncWithGoogleSheets,
    seedDemoDataAction,
    isSyncing,
    syncStatus,
    syncMessage
  } = useAppStore();

  const [scriptInput, setScriptInput] = useState(googleScriptUrl);
  const [keyInput, setKeyInput] = useState(geminiApiKey);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const savedUrl = localStorage.getItem('SYNCRO_APPS_SCRIPT_URL') || '';
    const savedKey = localStorage.getItem('SYNCRO_GEMINI_KEY') || '';
    if (savedUrl) {
      setScriptInput(savedUrl);
      setGoogleScriptUrl(savedUrl);
    }
    if (savedKey) {
      setKeyInput(savedKey);
      setGeminiApiKey(savedKey);
    }
  }, [setGoogleScriptUrl, setGeminiApiKey]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleScriptUrl(scriptInput.trim());
    setGeminiApiKey(keyInput.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Title */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#ee3425]" />
            Syncro - Pengaturan & Ekosistem Integrasi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi koneksi Google Sheets (Apps Script), Gemini AI, dan layanan Google Workspace.
          </p>
        </div>

        {/* Section 1: Google Apps Script Backend Database */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-[#ee3425]">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Google Apps Script REST API</h3>
                <p className="text-xs text-slate-500">
                  Database spreadsheet 100% Free Tier dengan endpoint doGet dan doPost.
                </p>
              </div>
            </div>

            <span className="text-[10px] bg-red-50 text-[#ee3425] border border-red-200 px-2 py-0.5 rounded-full font-mono font-bold">
              Free Tier
            </span>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Web App URL (Deployment Google Apps Script):
              </label>
              <input
                type="url"
                value={scriptInput}
                onChange={(e) => setScriptInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 font-mono focus:bg-white focus:outline-none focus:border-[#ee3425]"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Panduan deploy dan skema database tersedia di{' '}
                <code className="text-[#ee3425] font-mono font-semibold">google-apps-script/Code.gs</code>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="submit"
                className="bg-[#ee3425] hover:bg-[#d6281a] text-white text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer shadow-xs shadow-red-500/20"
              >
                Simpan Konfigurasi
              </button>

              <button
                type="button"
                onClick={syncWithGoogleSheets}
                disabled={isSyncing || !scriptInput}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 transition cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#ee3425]' : ''}`} />
                <span>Test Koneksi & Ambil Data</span>
              </button>

              <button
                type="button"
                onClick={seedDemoDataAction}
                disabled={isSyncing || !scriptInput}
                className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-[#ee3425] text-xs font-bold px-3 py-2 rounded-lg border border-red-200 transition cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                <FolderSync className="w-3.5 h-3.5 text-[#ee3425]" />
                <span>Seed Demo Data ke Sheet</span>
              </button>

              {savedSuccess && (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Tersimpan!
                </span>
              )}
            </div>

            {/* Sync status alert */}
            {syncMessage && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                  syncStatus === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : syncStatus === 'error'
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                {syncStatus === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : syncStatus === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#ee3425]" />
                ) : (
                  <RefreshCw className="w-4 h-4 shrink-0 animate-spin text-[#ee3425]" />
                )}
                <span className="font-medium">{syncMessage}</span>
              </div>
            )}
          </form>
        </div>

        {/* Section 2: Gemini API Key */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-[#ee3425]">
                <Sparkles className="w-4 h-4 text-[#ee3425]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Gemini API Key (Google AI Studio)</h3>
                <p className="text-xs text-slate-500">
                  Digunakan untuk Standup generator, Task breakdown otomatis, dan Knowledge Q&A Syncro.
                </p>
              </div>
            </div>

            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-[#ee3425] hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Dapatkan Key</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                API Key (Disimpan di Client LocalStorage / Vercel Env):
              </label>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 font-mono focus:bg-white focus:outline-none focus:border-[#ee3425]"
              />
            </div>
            <button
              onClick={handleSaveSettings}
              className="bg-[#ee3425] hover:bg-[#d6281a] text-white text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer shadow-xs shadow-red-500/20"
            >
              Simpan API Key
            </button>
          </div>
        </div>

        {/* Section 3: Google Workspace Ecosystem Integrations */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#ee3425]" />
            Ekosistem Integrasi Google Workspace
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-[#ee3425]" />
                <div>
                  <p className="font-bold text-slate-900">Google SSO</p>
                  <p className="text-[10px] text-slate-500">Login 1-klik akun @itsecacademy.com</p>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                Aktif
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="font-bold text-slate-900">Google Calendar</p>
                  <p className="text-[10px] text-slate-500">Sinkronisasi 2 arah jadwal Planner</p>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                Siap
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <HardDrive className="w-4 h-4 text-amber-600" />
                <div>
                  <p className="font-bold text-slate-900">Google Drive</p>
                  <p className="text-[10px] text-slate-500">Akses lampiran file SOP & assessment</p>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                Terhubung
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Video className="w-4 h-4 text-[#ee3425]" />
                <div>
                  <p className="font-bold text-slate-900">Google Meet</p>
                  <p className="text-[10px] text-slate-500">Generate link meeting dari agenda</p>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                Aktif
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
