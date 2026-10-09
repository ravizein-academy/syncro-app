"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon, CheckCircle2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { translations } from "@/lib/i18n";

interface LogoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogoutModal({ open, onOpenChange }: LogoutModalProps) {
  const router = useRouter();
  const { language, logout, currentUser } = useStore();
  const t = translations[language || "id"];
  const [loggedOut, setLoggedOut] = useState(false);

  const handleLogout = () => {
    setLoggedOut(true);
    setTimeout(() => {
      logout();
      setLoggedOut(false);
      onOpenChange(false);
      router.push("/login");
    }, 900);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground sm:max-w-md p-6 rounded-2xl shadow-2xl transition-colors duration-200">
        <DialogHeader className="space-y-3">
          <div className="mx-auto h-12 w-12 rounded-full bg-[#EE3726]/15 text-[#EE3726] flex items-center justify-center border border-[#EE3726]/30">
            {loggedOut ? <CheckCircle2 size={24} className="text-emerald-500" /> : <LogOut size={22} />}
          </div>
          
          <div className="text-center space-y-1">
            <DialogTitle className="text-base font-bold text-foreground">
              {loggedOut 
                ? (language === 'en' ? 'Logged Out Successfully' : 'Berhasil Keluar')
                : (language === 'en' ? 'Log Out of Syncro?' : 'Keluar dari Syncro?')}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              {loggedOut
                ? (language === 'en' ? 'Your active session has ended safely.' : 'Sesi akun Anda telah berhasil diakhiri dengan aman.')
                : (language === 'en' 
                    ? `Are you sure you want to end your current session for ${currentUser?.name || 'this account'}?` 
                    : `Apakah Anda yakin ingin mengakhiri sesi aktif untuk akun ${currentUser?.name || 'ini'}?`)}
            </p>
          </div>
        </DialogHeader>

        {!loggedOut && (
          <div className="mt-2 p-3 rounded-xl bg-secondary/50 border border-border flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#EE3726] to-[#BA1E10] flex items-center justify-center text-xs font-bold text-white shadow-sm ring-1 ring-[#EE3726]/30">
              {currentUser?.avatar || currentUser?.name?.slice(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-foreground block truncate">{currentUser?.name || 'User'}</span>
              <span className="text-[11px] text-muted-foreground block truncate">{currentUser?.email || 'user@syncro.io'} • {currentUser?.role || 'Member'}</span>
            </div>
          </div>
        )}

        {!loggedOut ? (
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border mt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              {t.modalCancel}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleLogout}
              className="bg-[#EE3726] hover:bg-[#D32717] text-white text-xs font-bold px-4 rounded-xl shadow-md shadow-[#EE3726]/20 transition"
            >
              {language === 'en' ? 'Log out' : 'Keluar'}
            </Button>
          </div>
        ) : (
          <div className="pt-2 text-center text-xs font-semibold text-emerald-500">
            {language === 'en' ? 'Redirecting...' : 'Menutup sesi...'}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
