"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  UserPlus,
  Users,
  KeyRound,
  Trash2,
  X,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Lock,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  image?: string;
  createdAt?: string;
}

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string;
  onUserAddedOrUpdated?: (action: string, userName: string) => void;
}

export function UserManagementModal({
  isOpen,
  onClose,
  currentUserEmail = "ravizein@itsecacademy.com",
  onUserAddedOrUpdated,
}: UserManagementModalProps) {
  const [activeTab, setActiveTab] = useState<"list" | "create">("list");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form state: Create user
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"USER" | "ADMIN">("USER");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State: Reset password modal
  const [selectedUserForReset, setSelectedUserForReset] = useState<UserItem | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setUsers(data);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch users:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Helper generate password acak
  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!newEmail.trim() || !newPassword.trim()) {
      setErrorMsg("Email dan kata sandi wajib diisi.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg("Kata sandi minimal harus 6 karakter.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim().toLowerCase(),
          password: newPassword,
          role: newRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Gagal menambahkan pengguna.");
      } else {
        setSuccessMsg(data.message || "Pengguna berhasil ditambahkan!");
        onUserAddedOrUpdated?.(
          `menambahkan pengguna baru ${data.user?.name || newEmail} (${data.user?.role})`,
          data.user?.name || newEmail
        );
        setNewName("");
        setNewEmail("");
        setNewPassword("");
        setNewRole("USER");
        fetchUsers();
        setActiveTab("list");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat menghubungi server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForReset) return;
    if (resetPasswordValue.length < 6) {
      setErrorMsg("Kata sandi baru minimal harus 6 karakter.");
      return;
    }

    setIsResetting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/users/${selectedUserForReset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPassword: resetPasswordValue,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Gagal mereset kata sandi.");
      } else {
        setSuccessMsg(data.message || "Kata sandi berhasil direset!");
        onUserAddedOrUpdated?.(
          `mereset kata sandi untuk pengguna ${selectedUserForReset.name}`,
          selectedUserForReset.name
        );
        setSelectedUserForReset(null);
        setResetPasswordValue("");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat mereset kata sandi.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteUser = async (user: UserItem) => {
    if (user.email.toLowerCase() === currentUserEmail.toLowerCase()) {
      alert("Anda tidak dapat menghapus akun administrator Anda sendiri.");
      return;
    }

    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus akun ${user.name} (${user.email})? Tindakan ini tidak dapat dibatalkan.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal menghapus pengguna.");
      } else {
        setSuccessMsg(data.message || "Pengguna berhasil dihapus.");
        onUserAddedOrUpdated?.(
          `menghapus pengguna ${user.name} (${user.email})`,
          user.name
        );
        fetchUsers();
      }
    } catch (err: any) {
      alert(err.message || "Gagal menghapus pengguna.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-sans animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#1e1e1e] rounded-3xl border border-slate-200 dark:border-[#333333] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#2e2e2e] flex items-center justify-between gap-3 bg-white dark:bg-[#222222]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Manajemen Pengguna & Akses
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white">
                  Admin Panel
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Kelola akun anggota tim, reset kata sandi, dan buat akun baru
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2c2c2c] transition cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-100 dark:border-[#2e2e2e] bg-slate-50/60 dark:bg-[#252525]/40 px-4 pt-2 gap-2">
          <button
            onClick={() => {
              setActiveTab("list");
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === "list"
                ? "border-brand-500 text-brand-600 dark:text-white"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Daftar Pengguna ({users.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("create");
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === "create"
                ? "border-brand-500 text-brand-600 dark:text-white"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Undang / Tambah Pengguna</span>
          </button>
        </div>

        {/* Global Feedback Alert */}
        {errorMsg && (
          <div className="m-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="m-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === "list" ? (
            <div className="space-y-3">
              {isLoading ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-500" />
                  <p className="text-xs">Memuat daftar anggota tim...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Users className="w-8 h-8 opacity-40 mx-auto" />
                  <p className="text-xs font-semibold">Belum ada pengguna terdaftar.</p>
                </div>
              ) : (
                users.map((u) => {
                  const isCurrent =
                    u.email.toLowerCase() === currentUserEmail.toLowerCase();
                  return (
                    <div
                      key={u.id}
                      className="p-3.5 rounded-2xl bg-white dark:bg-[#252525] border border-slate-200 dark:border-[#353535] hover:border-slate-300 dark:hover:border-[#454545] transition flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                          {u.name ? u.name.slice(0, 2).toUpperCase() : "US"}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {u.name}
                            </h4>
                            {isCurrent && (
                              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300">
                                Anda
                              </span>
                            )}
                            <span
                              className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                                u.role === "ADMIN"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                              }`}
                            >
                              {u.role}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                            {u.email}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            setSelectedUserForReset(u);
                            setResetPasswordValue(generateRandomPassword());
                            setErrorMsg(null);
                            setSuccessMsg(null);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-[#303030] hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 transition cursor-pointer"
                          title="Reset Kata Sandi"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Reset Password</span>
                        </button>

                        {!isCurrent && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition cursor-pointer"
                            title="Hapus Pengguna"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Tab 2: Create / Invite User */
            <form onSubmit={handleCreateUser} className="space-y-4 max-w-lg mx-auto">
              <div className="p-3 rounded-2xl bg-brand-50/50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 text-xs text-brand-900 dark:text-brand-200 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 shrink-0 text-brand-500 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Akses Khusus Admin:</strong> Anda dapat mengundang dan menambahkan akun dengan email apa pun, termasuk email domain umum (seperti <code>@gmail.com</code>, <code>@yahoo.com</code>) atau email mitra. Akun yang dibuat akan langsung dapat login menggunakan kata sandi yang Anda tentukan.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Contoh: Sarah Chen"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#252525] border border-slate-200 dark:border-[#383838] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Alamat Email (Domain Apa Saja)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Contoh: sarah@gmail.com atau analis@itsecasia.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#252525] border border-slate-200 dark:border-[#383838] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Kata Sandi Awal
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewPassword(generateRandomPassword())}
                    className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Buat Otomatis</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#252525] border border-slate-200 dark:border-[#383838] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Peran Pengguna (Role)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setNewRole("USER")}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-center gap-2.5 ${
                      newRole === "USER"
                        ? "border-brand-500 bg-brand-50/40 dark:bg-brand-500/10 font-bold text-brand-700 dark:text-brand-300"
                        : "border-slate-200 dark:border-[#353535] text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <Users className="w-4 h-4 text-brand-500" />
                    <div>
                      <div className="text-xs">User (Anggota)</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Dapat mengelola tugas
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setNewRole("ADMIN")}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-center gap-2.5 ${
                      newRole === "ADMIN"
                        ? "border-amber-500 bg-amber-50/40 dark:bg-amber-500/10 font-bold text-amber-700 dark:text-amber-300"
                        : "border-slate-200 dark:border-[#353535] text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-500" />
                    <div>
                      <div className="text-xs">Administrator</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Akses penuh & manajemen user
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50 transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menambahkan Pengguna...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Buat Akun & Berikan Akses</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Sub-Modal / Popover: Reset Password */}
        {selectedUserForReset && (
          <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#222222] rounded-2xl border border-slate-200 dark:border-[#333333] p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-black uppercase text-slate-900 dark:text-white">
                    Reset Kata Sandi
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedUserForReset(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Atur kata sandi baru untuk <strong>{selectedUserForReset.name}</strong> (
                <code>{selectedUserForReset.email}</code>).
              </p>

              <form onSubmit={handleResetPassword} className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Kata Sandi Baru
                    </span>
                    <button
                      type="button"
                      onClick={() => setResetPasswordValue(generateRandomPassword())}
                      className="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Acak Baru</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={resetPasswordValue}
                      onChange={(e) => setResetPasswordValue(e.target.value)}
                      placeholder="Kata sandi baru (min. 6 karakter)"
                      className="w-full pl-3 pr-8 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#383838] text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(resetPasswordValue)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-brand-500"
                      title="Salin kata sandi"
                    >
                      {copiedPassword ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUserForReset(null)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#303030] cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 transition cursor-pointer flex items-center gap-1.5"
                  >
                    {isResetting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Simpan Kata Sandi</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

