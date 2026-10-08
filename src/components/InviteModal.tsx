'use client';

import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { UserRole } from '../types';
import { 
  UserPlus, 
  X, 
  Copy, 
  Check, 
  Mail, 
  User, 
  Building2, 
  ShieldCheck, 
  Sparkles,
  Link2,
  Users
} from 'lucide-react';

export function InviteModal() {
  const { isInviteModalOpen, setInviteModalOpen, inviteUser, users } = useAppStore();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('Member');
  const [team, setTeam] = useState('Engineering');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isInviteModalOpen) return null;

  const inviteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://syncro-app.vercel.app';

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setErrorMessage('Masukkan alamat email kantor yang valid.');
      return;
    }

    setIsSubmitting(true);

    try {
      const finalName = name.trim() || trimmedEmail.split('@')[0].replace(/[._]/g, ' ')
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      await inviteUser({
        name: finalName,
        email: trimmedEmail,
        role,
        team
      });

      setSuccessMessage(`Undangan untuk ${finalName} (${trimmedEmail}) berhasil dikirim dan dicatat ke database Google Sheets!`);
      setEmail('');
      setName('');
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengirim undangan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-[#ee3425] shrink-0 shadow-xs">
              <UserPlus className="w-5 h-5 text-[#ee3425]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">Undang Rekan Kerja</h2>
              <p className="text-xs text-slate-500">Tambahkan anggota tim kantor ke workspace Syncro</p>
            </div>
          </div>
          <button
            onClick={() => setInviteModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
              <X className="w-4 h-4 text-[#ee3425] shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form Direct Invite */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Kantor Rekan Kerja <span className="text-[#ee3425]">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rekan@itsecacademy.com"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#ee3425] focus:outline-none transition bg-slate-50/50 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap (Opsional)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Budi Pratama"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#ee3425] focus:outline-none transition bg-slate-50/50 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Peran (Role)
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:border-[#ee3425] focus:outline-none"
                >
                  <option value="Member">Member (Kelola Tugas)</option>
                  <option value="Admin">Admin (Akses Penuh)</option>
                  <option value="Guest">Guest (Tamu / Viewer)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Divisi / Tim
                </label>
                <select
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:border-[#ee3425] focus:outline-none"
                >
                  <option value="Product & Architecture">Product & Architecture</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Cyber Security Operations">Cyber Security</option>
                  <option value="Product Design">Product Design</option>
                  <option value="Operations & IT">Operations & IT</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-[#ee3425] hover:bg-[#d6281a] text-white font-semibold text-xs transition shadow-sm cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
            >
              {isSubmitting ? (
                <span>Menyimpan ke Sheets...</span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Kirim Undangan & Daftarkan ke Tim</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[11px]">
              <span className="bg-white px-2.5 text-slate-400 font-medium">
                ATAU BAGIKAN LINK WORKSPACE
              </span>
            </div>
          </div>

          {/* Shareable Link Box */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Link2 className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-600 truncate font-mono">{inviteUrl}</span>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                copiedLink 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
              }`}
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Link</span>
                </>
              )}
            </button>
          </div>

          {/* Current Members Preview */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                Anggota Tim Saat Ini ({users.length})
              </span>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 border border-slate-100"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{u.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-medium">
                      {u.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Security Note */}
        <div className="p-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Tersinkronisasi ke Google Sheets
          </span>
          <span>Google Workspace Enterprise</span>
        </div>

      </div>
    </div>
  );
}
