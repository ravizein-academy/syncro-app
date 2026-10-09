"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Briefcase, Plus, FolderKanban, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Link from "next/link";
import { translations } from "@/lib/i18n";

export default function SpacesPage() {
  const { spaces, tasks, addSpace, language } = useStore();
  const t = translations[language || 'id'];

  const [openDialog, setOpenDialog] = useState(false);
  const [spaceName, setSpaceName] = useState("");
  const [spaceDesc, setSpaceDesc] = useState("");
  const [selectedColor, setSelectedColor] = useState("from-rose-500 to-red-700");

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
      name: spaceName,
      description: spaceDesc || (language === 'en' ? "Team workspace for project collaboration" : "Ruang kerja tim untuk kolaborasi proyek"),
      color: selectedColor,
    });

    setSpaceName("");
    setSpaceDesc("");
    setOpenDialog(false);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto select-none transition-colors duration-200">
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

      {/* Spaces Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {spaces.map((space) => {
          const spaceTasks = tasks.filter((t) => t.spaceId === space.id);
          const doneTasks = spaceTasks.filter((t) => t.status === "done");
          const progressPercent = spaceTasks.length ? Math.round((doneTasks.length / spaceTasks.length) * 100) : 0;

          return (
            <Card
              key={space.id}
              className="bg-card border-border transition hover:border-rose-500/50 shadow-sm flex flex-col justify-between group"
            >
              <div>
                <div className={`h-3 w-full rounded-t-xl bg-gradient-to-r ${space.color || "from-rose-500 to-red-700"}`} />
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-bold text-foreground group-hover:text-rose-600 dark:group-hover:text-rose-400 transition">
                      {space.name}
                    </CardTitle>
                    <FolderKanban size={16} className="text-muted-foreground" />
                  </div>
                  <CardDescription className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {space.description}
                  </CardDescription>
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
