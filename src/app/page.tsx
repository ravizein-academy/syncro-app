"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { ListView } from "@/components/tasks/ListView";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";
import { CreateProjectModal } from "@/components/tasks/CreateProjectModal";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { ExportReportModal } from "@/components/tasks/ExportReportModal";
import { TicketingDashboardView } from "@/components/dashboard/TicketingDashboardView";
import { TaskItem } from "@/components/tasks/TaskCard";
import { mockTasks } from "@/lib/mock-data";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const DEFAULT_PROJECTS = [
  {
    id: "proj-1",
    name: "ITSEC Security Core",
    description: "Cloudflare Pages and Neon Database systems",
    color: "#ee3726",
    _count: { tasks: 4 },
  },
  {
    id: "proj-2",
    name: "Client Mobile Experience",
    description: "PWA serwist offline caching and install prompts",
    color: "#0ea5e9",
    _count: { tasks: 1 },
  },
  {
    id: "proj-3",
    name: "Product Design & UX",
    description: "ClickUp inspired Kanban & List views with micro-animations",
    color: "#10b981",
    _count: { tasks: 1 },
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();

  // Otomatis arahkan ke form login jika pengguna belum login
  useEffect(() => {
    if (status === "unauthenticated" || (!session && status !== "loading")) {
      router.replace("/auth/signin");
    }
  }, [status, session, router]);

  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<"dashboard" | "kanban" | "list">("dashboard");
  // Initialize with mockTasks so the dashboard is ALWAYS populated immediately
  const [tasks, setTasks] = useState<TaskItem[]>(mockTasks as TaskItem[]);
  const [projects, setProjects] = useState<any[]>(DEFAULT_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Mobile Responsive Drawer state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals state
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [createTaskDefaultStatus, setCreateTaskDefaultStatus] = useState<
    "TODO" | "IN_PROGRESS" | "DONE"
  >("TODO");
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // ClickUp Task Detail Modal state
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<TaskItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // PWA Install Prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Capture PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      alert("Untuk menginstal, buka menu browser Anda dan pilih 'Install Syncro' atau 'Add to Home Screen'.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  // Silently refresh latest tasks & projects in the background
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/projects"),
      ]);

      if (tasksRes.ok) {
        const taskData = await tasksRes.json();
        if (Array.isArray(taskData) && taskData.length > 0) {
          setTasks(taskData);
        }
      }
      if (projectsRes.ok) {
        const projData = await projectsRes.json();
        if (Array.isArray(projData) && projData.length > 0) {
          setProjects(projData);
        }
      }
    } catch (err) {
      console.warn("Background data sync notice (using local cache):", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (
    taskId: string,
    newStatus: "TODO" | "IN_PROGRESS" | "DONE"
  ) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    if (selectedTaskForDetail && selectedTaskForDetail.id === taskId) {
      setSelectedTaskForDetail((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    const statusLabel =
      newStatus === "DONE" ? "Complete (Selesai)" : newStatus === "IN_PROGRESS" ? "In Progress" : "To Do";

    toast({
      title: "Status Tugas Diperbarui",
      description: `Status tiket diubah menjadi ${statusLabel}.`,
      variant: "success",
    });

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error("Failed to update task status:", err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus tugas ini?")) return;

    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTaskForDetail && selectedTaskForDetail.id === taskId) {
      setIsDetailModalOpen(false);
      setSelectedTaskForDetail(null);
    }

    toast({
      title: "Tugas Berhasil Dihapus",
      description: "Tugas telah dihapus dari sistem.",
      variant: "default",
    });

    try {
      await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const handleUpdatePriority = async (
    taskId: string,
    newPriority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  ) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, priority: newPriority } : t))
    );
    if (selectedTaskForDetail && selectedTaskForDetail.id === taskId) {
      setSelectedTaskForDetail((prev) => (prev ? { ...prev, priority: newPriority } : null));
    }

    toast({
      title: "Prioritas Diperbarui",
      description: `Prioritas tugas telah diatur ke "${newPriority}".`,
      variant: "success",
    });

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      });
    } catch (err) {
      console.error("Failed to update task priority:", err);
    }
  };

  const handleUpdateAssignee = async (
    taskId: string,
    assignee: { id: string; name: string; email: string } | null
  ) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              assignee: assignee
                ? {
                    id: assignee.id,
                    name: assignee.name,
                    email: assignee.email,
                    image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                      assignee.name
                    )}`,
                  }
                : undefined,
            }
          : t
      )
    );
    if (selectedTaskForDetail && selectedTaskForDetail.id === taskId) {
      setSelectedTaskForDetail((prev) =>
        prev
          ? {
              ...prev,
              assignee: assignee
                ? {
                    id: assignee.id,
                    name: assignee.name,
                    email: assignee.email,
                    image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                      assignee.name
                    )}`,
                  }
                : undefined,
            }
          : null
      );
    }

    toast({
      title: "Penanggung Jawab Diperbarui",
      description: assignee ? `Tugas ditugaskan kepada ${assignee.name}.` : "Penugasan tugas dibatalkan.",
      variant: "success",
    });

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId: assignee ? assignee.id : null }),
      });
    } catch (err) {
      console.error("Failed to update task assignee:", err);
    }
  };

  const handleTaskCreated = (newTask: any) => {
    setTasks((prev) => [newTask, ...prev]);
    toast({
      title: "Tugas Berhasil Dibuat",
      description: `Tugas "${newTask.title}" telah ditambahkan.`,
      variant: "success",
    });
  };

  const handleProjectCreated = (newProject: any) => {
    setProjects((prev) => [...prev, newProject]);
    toast({
      title: "Space Berhasil Dibuat",
      description: `Space "${newProject.name}" siap digunakan.`,
      variant: "success",
    });
  };

  // ClickUp Inline Quick Task Creator
  const handleQuickCreateTask = async (
    title: string,
    status: "TODO" | "IN_PROGRESS" | "DONE"
  ) => {
    const targetProjectId = selectedProjectId || projects[0]?.id || "proj-1";
    const projObj = projects.find((p) => p.id === targetProjectId);

    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title,
      description: "",
      projectId: targetProjectId,
      status,
      priority: "MEDIUM",
      mediaUrls: [],
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
      project: projObj,
      assignee: {
        id: "user-1",
        name: "Ravi Zein",
        email: "ravizein@itsecacademy.com",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ravi",
      },
      createdAt: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);
    toast({
      title: "Tugas Berhasil Dibuat",
      description: `Tugas "${title}" berhasil ditambahkan.`,
      variant: "success",
    });

    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          projectId: targetProjectId,
          status,
          priority: "MEDIUM",
          assigneeId: "user-1",
          dueDate: newTask.dueDate,
          mediaUrls: [],
        }),
      });
    } catch (e) {
      console.error("Failed to sync quick task:", e);
    }
  };

  // Filter tasks based on search, project selection, and status filter
  const filteredTasks = tasks.filter((task) => {
    if (selectedProjectId && task.projectId !== selectedProjectId) return false;
    if (statusFilter && task.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q) || false;
      const matchProject = task.project?.name.toLowerCase().includes(q) || false;
      if (!matchTitle && !matchDesc && !matchProject) return false;
    }
    return true;
  });

  const activeProject = projects.find((p) => p.id === selectedProjectId);

  const openTaskDetail = (task: TaskItem) => {
    setSelectedTaskForDetail(task);
    setIsDetailModalOpen(true);
  };

  // Jika sedang memeriksa sesi atau belum login, jangan pernah tampilkan dashboard
  if (status === "loading" || status === "unauthenticated" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Mengarahkan ke halaman login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans">
      {/* ClickUp Sidebar Navigation */}
      <Sidebar
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        statusFilter={statusFilter}
        onSelectStatus={setStatusFilter}
        currentView={currentView}
        onSelectView={setCurrentView}
        onOpenCreateProject={() => setIsCreateProjectOpen(true)}
        onOpenCreateTask={() => {
          setCreateTaskDefaultStatus("TODO");
          setIsCreateTaskOpen(true);
        }}
        onOpenExportReport={() => setIsExportModalOpen(true)}
        installPrompt={deferredPrompt}
        onInstallApp={handleInstallApp}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ClickUp Header & Views Bar */}
        <Header
          currentView={currentView}
          onViewChange={setCurrentView}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenCreateTask={() => {
            setCreateTaskDefaultStatus("TODO");
            setIsCreateTaskOpen(true);
          }}
          activeProjectName={activeProject?.name || "Semua Tugas"}
          totalTasks={filteredTasks.length}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        {/* View Component (Ticketing Dashboard, Kanban, or ClickUp Grouped List) */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="flex-1 p-3.5 sm:p-5 md:p-6 space-y-4 sm:space-y-6 overflow-y-auto font-sans bg-[#f8fafc] dark:bg-[#1a1a1a]">
              {/* Banner Skeleton */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#333333] bg-white dark:bg-[#242424]">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48 sm:w-64" />
                  <Skeleton className="h-4 w-64 sm:w-80" />
                </div>
                <Skeleton className="h-9 w-32 rounded-xl" />
              </div>

              {/* 4 Metric Cards Skeleton */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-[#333333] bg-white dark:bg-[#242424] space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3.5 w-20" />
                      <Skeleton className="h-6 w-6 rounded-lg" />
                    </div>
                    <Skeleton className="h-8 w-12" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                ))}
              </div>

              {/* Table / List Container Skeleton */}
              <div className="rounded-2xl border border-slate-200 dark:border-[#333333] bg-white dark:bg-[#242424] p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#303030]">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-8 w-28 rounded-xl" />
                </div>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-[#2a2a2a] last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-4 w-16 rounded-md" />
                      <Skeleton className="h-4 w-36 sm:w-56" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-6 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : currentView === "dashboard" ? (
            <TicketingDashboardView
              tasks={filteredTasks}
              onUpdateStatus={handleUpdateStatus}
              onUpdatePriority={handleUpdatePriority}
              onUpdateAssignee={handleUpdateAssignee}
              onDeleteTask={handleDeleteTask}
              onOpenTaskDetail={openTaskDetail}
              onOpenCreateTask={() => {
                setCreateTaskDefaultStatus("TODO");
                setIsCreateTaskOpen(true);
              }}
              currentUserName={session?.user?.name || "Ravi Zein"}
              currentUserEmail={session?.user?.email || "ravizein@itsecacademy.com"}
            />
          ) : currentView === "kanban" ? (
            <KanbanBoard
              tasks={filteredTasks}
              onUpdateStatus={handleUpdateStatus}
              onDeleteTask={handleDeleteTask}
              onOpenCreateTaskWithStatus={(colStatus) => {
                setCreateTaskDefaultStatus(colStatus);
                setIsCreateTaskOpen(true);
              }}
              onOpenTaskDetail={openTaskDetail}
            />
          ) : (
            <ListView
              tasks={filteredTasks}
              onUpdateStatus={handleUpdateStatus}
              onDeleteTask={handleDeleteTask}
              onOpenTaskDetail={openTaskDetail}
              onQuickCreateTask={handleQuickCreateTask}
            />
          )}
        </main>
      </div>

      {/* ClickUp Task Detail Modal */}
      <TaskDetailModal
        task={selectedTaskForDetail}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedTaskForDetail(null);
        }}
        onUpdateStatus={handleUpdateStatus}
        onDeleteTask={handleDeleteTask}
      />

      {/* Export & Preview Report Modal (PDF / Excel / Print) */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        tasks={filteredTasks}
        projectName={activeProject?.name || "Semua Spaces"}
        userName={session?.user?.name || "Ravi Zein Permana"}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        projects={projects}
        defaultProjectId={selectedProjectId || undefined}
        defaultStatus={createTaskDefaultStatus}
        onTaskCreated={handleTaskCreated}
      />

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
}
