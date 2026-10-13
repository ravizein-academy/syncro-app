"use client";

import { useState } from "react";
import { useStore, Space } from "@/store/useStore";
import { Briefcase, Plus, FolderKanban, ArrowRight, Pencil, Trash2, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Link from "next/link";
import { translations } from "@/lib/i18n";
import { performAutoCloudSync } from "@/lib/sync";

export default function SpacesPage() {
  const { spaces, tasks, addSpace, updateSpace, deleteSpace, currentUser, language } = useStore();
  const t = translations[language || 'id'];

  const isAdmin = currentUser?.role === 'admin' || currentUser?.email === 'ravizein@itsecacademy.com';

  // State Dialog Buat Space
  const [openDialog, setOpenDialog] = useState(false);
  const [spaceName, setSpaceName] = useState("");
  const [spaceDesc, setSpaceDesc] = useState("");
  const [selectedColor, setSelectedColor] = useState("from-[#EE3726] to-[#BA1E10]");

  // State Dialog Edit Space
  const [editSpaceTarget, setEditSpaceTarget] = useState<Space | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editColor, setEditColor] = useState("");

  // State Dialog Konfirmasi Hapus Space
  const [deleteSpaceTarget, setDeleteSpaceTarget] = useState<Space | null>(null);

  const COLOR_OPTIONS = [
    { label: "ITSEC Pomegranate", val: "from-[#EE3726] to-[#BA1E10]" },
    { label: "ITSEC Scarlet", val: "from-[#EE3726] to-[#D32717]" },
    { label: "Crimson Berry", val: "from-[#D32717] to-[#7A140A]" },
    { label: "Sunset Coral", val: "from-[#FF7060] to-[#EE3726]" },
    { label: "Dark Cherry", val: "from-[#7A140A] to-[#420A05]" },
  ];

  const handleCreateSpace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spaceName.trim()) return;

    addSpace({
      name: spaceName.trim(),
      description: spaceDesc.trim() || (language === 'en' ? "Team workspace for project collaboration" : "Ruang kerja tim untuk kolaborasi proyek"),
      color: selectedColor,
    });

    setSpaceName("");
    setSpaceDesc("");
    setOpenDialog(false);
    performAutoCloudSync().catch(() => {});
  };

  const openEditModal = (space: Space) => {
    setEditSpaceTarget(space);
    setEditName(space.name);
    setEditDesc(space.description || "");
    setEditColor(space.color || "from-[#EE3726] to-[#BA1E10]");
  };

  const handleUpdateSpace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSpaceTarget || !editName.trim()) return;

    updateSpace(editSpaceTarget.id, {
      name: editName.trim(),
      description: editDesc.trim(),
      color: editColor,
    });

    setEditSpaceTarget(null);
    performAutoCloudSync().catch(() => {});
  };

  const handleConfirmDelete = () => {
    if (!deleteSpaceTarget || !isAdmin) return;

    deleteSpace(deleteSpaceTarget.id);
    setDeleteSpaceTarget(null);
    performAutoCloudSync().catch(() => {});
  };

  return (
    <div className="p-3 sm:p-5 md:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto select-none transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-rose-500 shadow-sm" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">{t.spacesTag}</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5 mt-1">
            <Briefcase className="text-rose-500" />
            {t.spacesTitle}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {t.spacesSubtitle}
          </p>
        </div>

        {/* Modal Buat Space Baru */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger
            render={
              <Button className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs gap-1.5 h-9 shadow-md shadow-rose-950/40 rounded-lg">
                <Plus size={14} />
                <span>{t.createSpaceBtn}</span>
              </Button>
            }
          />
          <DialogContent className="bg-card border-border text-foreground sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">{t.createSpaceBtn}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSpace} className="space-y-4 pt-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t.spaceNameLabel}</label>
                <Input
                  required
                  placeholder={t.spaceNamePlaceholder}
                  value={spaceName}
                  onChange={(e) => setSpaceName(e.target.value)}
                  className="bg-secondary border-border text-sm focus-visible:ring-rose-500"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t.spaceDescLabel}</label>
                <Input
                  placeholder={t.spaceDescPlaceholder}
                  value={spaceDesc}
                  onChange={(e) => setSpaceDesc(e.target.value)}
                  className="bg-secondary border-border text-sm focus-visible:ring-rose-500"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">{t.spaceColorLabel}</label>
                <div className="grid grid-cols-5 gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.val}
                      type="button"
                      onClick={() => setSelectedColor(c.val)}
                      className={`h-8 rounded-lg bg-gradient-to-r ${c.val} transition-transform ${
                        selectedColor === c.val ? "scale-110 ring-2 ring-foreground shadow-md" : "opacity-70 hover:opacity-100"
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setOpenDialog(false)}>
                  {t.modalCancel}
                </Button>
                <Button type="submit" size="sm" className="bg-rose-600 hover:bg-rose-500 text-white font-semibold">
                  {t.saveSpaceBtn}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Modal Edit Space */}
      <Dialog open={!!editSpaceTarget} onOpenChange={(open) => !open && setEditSpaceTarget(null)}>
        <DialogContent className="bg-card border-border text-foreground sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Pencil size={18} className="text-rose-500" />
              <span>{t.editSpaceBtn}</span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSpace} className="space-y-4 pt-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t.spaceNameLabel}</label>
              <Input
                required
                placeholder={t.spaceNamePlaceholder}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-secondary border-border text-sm focus-visible:ring-rose-500"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t.spaceDescLabel}</label>
              <Input
                placeholder={t.spaceDescPlaceholder}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="bg-secondary border-border text-sm focus-visible:ring-rose-500"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">{t.spaceColorLabel}</label>
              <div className="grid grid-cols-5 gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.val}
                    type="button"
                    onClick={() => setEditColor(c.val)}
                    className={`h-8 rounded-lg bg-gradient-to-r ${c.val} transition-transform ${
                      editColor === c.val ? "scale-110 ring-2 ring-foreground shadow-md" : "opacity-70 hover:opacity-100"
                    }`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditSpaceTarget(null)}>
                {t.modalCancel}
              </Button>
              <Button type="submit" size="sm" className="bg-rose-600 hover:bg-rose-500 text-white font-semibold">
                {t.saveChangesBtn}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Konfirmasi Hapus Space (Khusus Admin) */}
      <Dialog open={!!deleteSpaceTarget} onOpenChange={(open) => !open && setDeleteSpaceTarget(null)}>
        <DialogContent className="bg-card border-border text-foreground sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <ShieldAlert size={20} className="text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{t.deleteSpaceConfirmTitle}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t.deleteSpaceConfirmDesc}
            </p>
            {deleteSpaceTarget && (
              <div className="p-3 bg-secondary/50 rounded-lg border border-border flex items-center gap-2.5">
                <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${deleteSpaceTarget.color || "from-rose-500 to-red-600"}`} />
                <span className="text-sm font-semibold text-foreground truncate">{deleteSpaceTarget.name}</span>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="ghost" size="sm" onClick={() => setDeleteSpaceTarget(null)}>
                {t.modalCancel}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-1.5"
              >
                <Trash2 size={13} />
                <span>{t.deleteSpaceBtn}</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Spaces Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {spaces.map((space) => {
          const spaceTasks = tasks.filter((t) => t.spaceId === space.id);
          const doneTasks = spaceTasks.filter((t) => t.status === "done");
          const progressPercent = spaceTasks.length ? Math.round((doneTasks.length / spaceTasks.length) * 100) : 0;

          return (
            <Card
              key={space.id}
              className="bg-card border-border transition hover:border-rose-500/50 shadow-sm flex flex-col justify-between group overflow-hidden"
            >
              <div>
                <div className={`h-2.5 w-full bg-gradient-to-r ${space.color || "from-rose-500 to-red-700"}`} />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0 pr-1">
                      <CardTitle className="text-base font-bold text-foreground group-hover:text-rose-600 dark:group-hover:text-rose-400 transition truncate">
                        {space.name}
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {space.description}
                      </CardDescription>
                    </div>

                    {/* Actions: Edit & Hapus (Hapus Khusus Admin) */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(space)}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md"
                        title={t.editSpaceBtn}
                      >
                        <Pencil size={13} />
                      </Button>

                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteSpaceTarget(space)}
                          className="h-7 w-7 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                          title={t.deleteSpaceBtn}
                        >
                          <Trash2 size={13} />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Progress Stats */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progress Proyek</span>
                      <span className="font-mono text-foreground font-semibold">{progressPercent}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 to-red-600 rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Task counts */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
                    <span>{t.totalTasksCount} <strong className="text-foreground">{spaceTasks.length}</strong></span>
                    <span>{t.completedTasksCount} <strong className="text-emerald-500">{doneTasks.length}</strong></span>
                  </div>
                </CardContent>
              </div>

              <div className="p-4 pt-0">
                <Link href="/tasks">
                  <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 border-border hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-300">
                    <span>{language === 'en' ? "Open Space Tasks" : "Buka Tugas Space"}</span>
                    <ArrowRight size={13} />
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
