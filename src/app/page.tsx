"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { ListView } from "@/components/tasks/ListView";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";
import { CreateProjectModal } from "@/components/tasks/CreateProjectModal";
import { EditProjectModal } from "@/components/tasks/EditProjectModal";
import { UserManagementModal } from "@/components/admin/UserManagementModal";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { ExportReportModal } from "@/components/tasks/ExportReportModal";
import { NotificationDrawer, NotificationItem } from "@/components/notifications/NotificationDrawer";
import { SendNotificationModal } from "@/components/notifications/SendNotificationModal";
import { TicketingDashboardView } from "@/components/dashboard/TicketingDashboardView";
import { TaskItem } from "@/components/tasks/TaskCard";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const DEFAULT_PROJECTS: any[] = [];

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
  // Inisialisasi dengan data kosong agar tugas sinkron murni dari Neon Database
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [projects, setProjects] = useState<any[]>(DEFAULT_PROJECTS);

  // Hitung jumlah task per space/project secara dinamis dan real-time dari array tasks aktif
  const projectsWithCounts = useMemo(() => {
    return projects.map((p) => ({
      ...p,
      _count: {
        tasks: tasks.filter((t) => t.projectId === p.id).length,
      },
    }));
  }, [projects, tasks]);

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
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // ClickUp Task Detail Modal state
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<TaskItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Admin User Management state
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const isAdmin =
    (session?.user as any)?.role === "ADMIN" ||
    session?.user?.email?.toLowerCase().includes("ravizein");

  // Pusat Notifikasi & Kegiatan state
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSendNotificationOpen, setIsSendNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Sinkronisasi notifikasi target dari server Neon DB secara berkala
  const fetchNotifications = useCallback(async () => {
    if (status !== "authenticated") return;
    try {
      const res = await fetch(`/api/notifications?_t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setNotifications(data);
          try {
            localStorage.setItem("syncro_notifications", JSON.stringify(data));
          } catch (e) {}
        }
      }
    } catch (e) {
      console.warn("Failed to fetch notifications:", e);
    }
  }, [status]);

  useEffect(() => {
    // 1. Muat cache offline lokal dahulu
    try {
      const saved = localStorage.getItem("syncro_notifications");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setNotifications(parsed);
        }
      }
    } catch (e) {}

    // 2. Ambil data notifikasi real-time dari database
    if (status === "authenticated") {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 5000);
      return () => clearInterval(interval);
    }
  }, [status, fetchNotifications]);

  const addNotification = (
    title: string,
    message: string,
    type: NotificationItem["type"],
    extra?: {
      taskId?: string;
      projectId?: string;
      actorName?: string;
      targetUserId?: string;
      targetUserEmail?: string;
      sendToAll?: boolean;
    }
  ) => {
    const actorName = session?.user?.name || session?.user?.email?.split("@")[0] || "Sistem";
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      timestamp: "Baru saja",
      createdAt: new Date().toISOString(),
      read: false,
      type,
      actorName,
      ...extra,
    };

    setNotifications((prev) => {
      const updated = [newNotif, ...prev.slice(0, 49)];
      try {
        localStorage.setItem("syncro_notifications", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Simpan ke database Neon PostgreSQL agar orang yang dituju menerimanya di feed akun mereka
    fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        message,
        type,
        taskId: extra?.taskId,
        projectId: extra?.projectId,
        userId: extra?.targetUserId,
        userEmail: extra?.targetUserEmail,
        sendToAll: extra?.sendToAll,
      }),
    }).catch((err) => console.warn("Failed to persist notification to DB:", err));
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      try {
        localStorage.setItem("syncro_notifications", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    fetch(`/api/notifications/${id}`, {
      method: "PATCH",
    }).catch(() => {});
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      try {
        localStorage.setItem("syncro_notifications", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllAsRead: true }),
    }).catch(() => {});
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      try {
        localStorage.setItem("syncro_notifications", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    fetch(`/api/notifications?id=${id}`, {
      method: "DELETE",
    }).catch(() => {});
  };

  const handleClearAllNotifications = () => {
    if (confirm("Bersihkan seluruh riwayat notifikasi kegiatan Anda?")) {
      setNotifications([]);
      try {
        localStorage.removeItem("syncro_notifications");
      } catch (e) {}

      fetch("/api/notifications?clearAll=true", {
        method: "DELETE",
      }).catch(() => {});
    }
  };

  const handleOpenTaskDetailFromNotification = (taskId: string) => {
    const found = tasks.find((t) => t.id === taskId);
    if (found) {
      setSelectedTaskForDetail(found);
      setIsDetailModalOpen(true);
      setIsNotificationOpen(false);
    }
  };

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

  const fetchData = useCallback(async () => {
    try {
      const timestamp = Date.now();
      const [tasksRes, projectsRes] = await Promise.all([
        fetch(`/api/tasks?_t=${timestamp}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        }),
        fetch(`/api/projects?_t=${timestamp}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        }),
      ]);

      if (tasksRes.ok) {
        const taskData = await tasksRes.json();
        if (Array.isArray(taskData)) {
          setTasks(taskData);
          // Jika modal detail sedang membuka tugas yang ternyata sudah dihapus oleh pengguna lain, tutup otomatis
          setSelectedTaskForDetail((prev) => {
            if (prev && !taskData.some((t: any) => t.id === prev.id)) {
              setIsDetailModalOpen(false);
              return null;
            }
            return prev;
          });
        }
      }
      if (projectsRes.ok) {
        const projData = await projectsRes.json();
        if (Array.isArray(projData)) {
          setProjects(projData);
        }
      }
    } catch (err) {
      console.warn("Background data sync notice (using local cache):", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sinkronisasi tugas & proyek secara real-time antar seluruh pengguna
  useEffect(() => {
    fetchData();

    // Polling setiap 2.5 detik agar perubahan (buat, ubah, hapus tugas) dari pengguna lain langsung sinkron otomatis tanpa refresh
    const interval = setInterval(fetchData, 2500);

    // Sinkronisasi instan saat pengguna kembali ke tab browser Syncro
    const handleFocus = () => fetchData();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchData();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchData]);

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

    const currentTask = tasks.find((t) => t.id === taskId);
    const taskTitle = currentTask?.title || "Tugas";
    const statusLabel =
      newStatus === "DONE" ? "Complete (Selesai)" : newStatus === "IN_PROGRESS" ? "In Progress" : "To Do";

    toast({
      title: "Status Tugas Diperbarui",
      description: `Status tiket diubah menjadi ${statusLabel}.`,
      variant: "success",
    });

    if (currentTask?.assigneeId) {
      addNotification(
        "Status Tugas Anda Diperbarui",
        `Tiket "${taskTitle}" yang Anda pegang telah diubah statusnya menjadi ${statusLabel}.`,
        "status",
        { taskId, targetUserId: currentTask.assigneeId }
      );
    } else {
      addNotification(
        "Status Tugas Diperbarui",
        `Tiket "${taskTitle}" diperbarui menjadi status ${statusLabel}.`,
        "status",
        { taskId, sendToAll: true }
      );
    }

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchData();
    } catch (err) {
      console.error("Failed to update task status:", err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus tugas ini?")) return;

    const targetTask = tasks.find((t) => t.id === taskId);
    const targetTitle = targetTask?.title || "Tugas";

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

    if (targetTask?.assigneeId) {
      addNotification(
        "Tugas Dihapus",
        `Tugas "${targetTitle}" yang ditugaskan kepada Anda telah dihapus dari sistem.`,
        "task_delete",
        { taskId, targetUserId: targetTask.assigneeId }
      );
    } else {
      addNotification(
        "Tugas Dihapus",
        `Tugas "${targetTitle}" telah dihapus dari sistem.`,
        "task_delete",
        { taskId, sendToAll: true }
      );
    }

    try {
      await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      fetchData();
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

    const currentTask = tasks.find((t) => t.id === taskId);
    const taskTitle = currentTask?.title || "Tugas";

    toast({
      title: "Prioritas Diperbarui",
      description: `Prioritas tugas telah diatur ke "${newPriority}".`,
      variant: "success",
    });

    if (currentTask?.assigneeId) {
      addNotification(
        "Prioritas Tugas Anda Diubah",
        `Prioritas tiket "${taskTitle}" diubah menjadi ${newPriority}.`,
        "priority",
        { taskId, targetUserId: currentTask.assigneeId }
      );
    } else {
      addNotification(
        "Prioritas Tugas Diubah",
        `Prioritas tiket "${taskTitle}" diubah menjadi ${newPriority}.`,
        "priority",
        { taskId, sendToAll: true }
      );
    }

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      });
      fetchData();
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

    const currentTask = tasks.find((t) => t.id === taskId);
    const taskTitle = currentTask?.title || "Tugas";

    toast({
      title: "Penanggung Jawab Diperbarui",
      description: assignee ? `Tugas ditugaskan kepada ${assignee.name}.` : "Penugasan tugas dibatalkan.",
      variant: "success",
    });

    if (assignee) {
      addNotification(
        "Tugas Baru Ditugaskan kepada Anda",
        `Anda telah ditugaskan sebagai PIC pada tiket "${taskTitle}".`,
        "assign",
        { taskId, targetUserId: assignee.id }
      );
    } else if (currentTask?.assigneeId) {
      addNotification(
        "Penugasan Tugas Dilepas",
        `Penugasan Anda pada tiket "${taskTitle}" telah dilepas.`,
        "assign",
        { taskId, targetUserId: currentTask.assigneeId }
      );
    }

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId: assignee ? assignee.id : null }),
      });
      fetchData();
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

    if (newTask.assigneeId) {
      addNotification(
        "Tugas Baru Ditugaskan kepada Anda",
        `Anda ditugaskan pada tugas "${newTask.title}".`,
        "assign",
        { taskId: newTask.id, projectId: newTask.projectId, targetUserId: newTask.assigneeId }
      );
    } else {
      addNotification(
        "Tugas Baru Dibuat",
        `Tugas "${newTask.title}" berhasil ditambahkan ke antrean kerja.`,
        "task_create",
        { taskId: newTask.id, projectId: newTask.projectId, sendToAll: true }
      );
    }
    fetchData();
  };

  const handleProjectCreated = (newProject: any) => {
    setProjects((prev) => [...prev, newProject]);
    toast({
      title: "Space Berhasil Dibuat",
      description: `Space "${newProject.name}" siap digunakan.`,
      variant: "success",
    });
    addNotification(
      "Space Baru Dibuat",
      `Space kerja "${newProject.name}" siap digunakan.`,
      "project",
      { projectId: newProject.id, sendToAll: true }
    );
    fetchData();
  };

  const handleOpenEditProject = (project: any) => {
    setEditingProject(project);
    setIsEditProjectOpen(true);
  };

  const handleProjectUpdated = (updatedProject: any) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === updatedProject.id ? { ...p, ...updatedProject } : p))
    );
    setTasks((prev) =>
      prev.map((t) =>
        t.projectId === updatedProject.id
          ? {
              ...t,
              project: {
                id: updatedProject.id,
                name: updatedProject.name,
                color: updatedProject.color,
              },
            }
          : t
      )
    );
    addNotification(
      "Space Diperbarui",
      `Pengaturan space "${updatedProject.name}" telah diperbarui.`,
      "project",
      { projectId: updatedProject.id, sendToAll: true }
    );
    fetchData();
  };

  const handleProjectDeleted = (deletedProjectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== deletedProjectId));
    setTasks((prev) => prev.filter((t) => t.projectId !== deletedProjectId));
    if (selectedProjectId === deletedProjectId) {
      setSelectedProjectId(null);
    }
    addNotification(
      "Space Dihapus",
      "Space kerja beserta tugas di dalamnya telah dihapus.",
      "project",
      { projectId: deletedProjectId, sendToAll: true }
    );
    fetchData();
  };

  // ClickUp Inline Quick Task Creator
  const handleQuickCreateTask = async (
    title: string,
    status: "TODO" | "IN_PROGRESS" | "DONE"
  ) => {
    const targetProjectId = selectedProjectId || projects[0]?.id || "proj-1";
    const projObj = projects.find((p) => p.id === targetProjectId);

    const currentUserId = (session?.user as any)?.id || null;
    const currentUserName = session?.user?.name || "Pengguna";
    const currentUserEmail = session?.user?.email || "user@itsecacademy.com";

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
      assignee: currentUserId
        ? {
            id: currentUserId,
            name: currentUserName,
            email: currentUserEmail,
            image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUserName)}`,
          }
        : undefined,
      createdAt: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);
    toast({
      title: "Tugas Berhasil Dibuat",
      description: `Tugas "${title}" berhasil ditambahkan.`,
      variant: "success",
    });
    addNotification(
      "Tugas Cepat Ditambahkan",
      `Tugas "${title}" berhasil ditambahkan ke antrean.`,
      "task_create",
      { taskId: newTask.id, projectId: targetProjectId, sendToAll: true }
    );

    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          projectId: targetProjectId,
          status,
          priority: "MEDIUM",
          assigneeId: currentUserId,
          dueDate: newTask.dueDate,
          mediaUrls: [],
        }),
      });
      fetchData();
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
        projects={projectsWithCounts}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        statusFilter={statusFilter}
        onSelectStatus={setStatusFilter}
        currentView={currentView}
        onSelectView={setCurrentView}
        onOpenCreateProject={() => setIsCreateProjectOpen(true)}
        onEditProject={handleOpenEditProject}
        onOpenCreateTask={() => {
          setCreateTaskDefaultStatus("TODO");
          setIsCreateTaskOpen(true);
        }}
        onOpenExportReport={() => setIsExportModalOpen(true)}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        unreadNotificationsCount={notifications.filter((n) => !n.read).length}
        isAdmin={isAdmin}
        onOpenUserManagement={() => setIsUserManagementOpen(true)}
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
          onOpenNotifications={() => setIsNotificationOpen(true)}
          unreadNotificationsCount={notifications.filter((n) => !n.read).length}
          isAdmin={isAdmin}
          onOpenUserManagement={() => setIsUserManagementOpen(true)}
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
        onCommentAdded={(text, task) => {
          if (task.assigneeId) {
            addNotification(
              "Komentar Baru pada Tugas Anda",
              `${session?.user?.name || "Rekan"} berkomentar pada tiket "${task.title}": "${text.length > 60 ? text.substring(0, 60) + "..." : text}"`,
              "comment",
              { taskId: task.id, targetUserId: task.assigneeId }
            );
          } else {
            addNotification(
              "Komentar Baru",
              `${session?.user?.name || "Rekan"} berkomentar pada tiket "${task.title}": "${text.length > 60 ? text.substring(0, 60) + "..." : text}"`,
              "comment",
              { taskId: task.id, sendToAll: true }
            );
          }
        }}
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

      {/* Edit & Delete Project Modal */}
      <EditProjectModal
        isOpen={isEditProjectOpen}
        onClose={() => setIsEditProjectOpen(false)}
        project={editingProject}
        onProjectUpdated={handleProjectUpdated}
        onProjectDeleted={handleProjectDeleted}
      />

      {/* Admin User Management Modal (Khusus Admin) */}
      {isAdmin && (
        <UserManagementModal
          isOpen={isUserManagementOpen}
          onClose={() => setIsUserManagementOpen(false)}
          currentUserEmail={session?.user?.email || "ravizein@itsecacademy.com"}
          onUserAddedOrUpdated={(action) => {
            addNotification(
              "Manajemen Pengguna",
              `Administrator ${action}.`,
              "assign",
              { sendToAll: true }
            );
          }}
        />
      )}

      {/* Pusat Notifikasi & Kegiatan Slide-over Drawer */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onDeleteNotification={handleDeleteNotification}
        onClearAllNotifications={handleClearAllNotifications}
        onOpenTaskDetail={handleOpenTaskDetailFromNotification}
        onOpenSendNotification={() => setIsSendNotificationOpen(true)}
      />

      {/* Modal Kirim Notifikasi Langsung ke Orang Tertentu */}
      <SendNotificationModal
        isOpen={isSendNotificationOpen}
        onClose={() => setIsSendNotificationOpen(false)}
        currentUserEmail={session?.user?.email || ""}
        onNotificationSent={(targetName, notifTitle) => {
          toast({
            title: "Notifikasi Terkirim",
            description: `Notifikasi "${notifTitle}" berhasil dikirim kepada ${targetName}.`,
            variant: "success",
          });
          fetchNotifications();
        }}
      />
    </div>
  );
}
