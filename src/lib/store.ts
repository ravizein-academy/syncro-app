import { create } from 'zustand';
import { Task, User, Team, Space, TimeLog, InboxNotification, ActiveTab, MyTasksFilter, TaskStatus } from '../types';
import { INITIAL_TASKS, INITIAL_USERS, INITIAL_SPACES, INITIAL_TEAMS, INITIAL_NOTIFICATIONS } from './mockData';

export interface ActiveTimerState {
  taskId: string;
  startTime: number;
  elapsedSeconds: number;
  isRunning: boolean;
}

interface AppState {
  // Data
  tasks: Task[];
  users: User[];
  teams: Team[];
  spaces: Space[];
  timeLogs: TimeLog[];
  notifications: InboxNotification[];
  currentUser: User;
  isAuthenticated: boolean;

  // UI States
  activeTab: ActiveTab;
  activeSpaceId: string;
  myTasksFilter: MyTasksFilter;
  selectedTaskId: string | null;
  searchQuery: string;
  calendarView: 'day' | 'week' | 'month';
  selectedDate: string; // YYYY-MM-DD

  // Timer
  activeTimer: ActiveTimerState | null;

  // Cloud & Integrasi
  googleScriptUrl: string;
  geminiApiKey: string;
  isSyncing: boolean;
  syncStatus: 'idle' | 'success' | 'error';
  syncMessage: string;

  // Actions
  setActiveTab: (tab: ActiveTab) => void;
  setActiveSpaceId: (id: string) => void;
  setMyTasksFilter: (filter: MyTasksFilter) => void;
  setSelectedTaskId: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  setCalendarView: (view: 'day' | 'week' | 'month') => void;
  setSelectedDate: (date: string) => void;

  // Task Actions
  addTask: (task: Partial<Task>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTaskStatus: (id: string, newStatus: TaskStatus) => void;
  scheduleTask: (id: string, scheduledTime: string, date?: string) => void;
  unscheduleTask: (id: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addComment: (taskId: string, content: string, attachment?: import('../types').TaskAttachment) => void;
  addAttachment: (taskId: string, attachment: import('../types').TaskAttachment) => void;
  removeAttachment: (taskId: string, attachmentId: string) => void;

  // Timer Actions
  startTimer: (taskId: string) => void;
  pauseTimer: () => void;
  stopTimer: () => void;
  tickTimer: () => void;

  // User Actions
  setCurrentUser: (user: User) => void;
  loginUser: (user: User) => void;
  logoutUser: () => void;
  updateUserCapacity: (userId: string, hours: number) => void;
  isInviteModalOpen: boolean;
  setInviteModalOpen: (open: boolean) => void;
  inviteUser: (userData: { name: string; email: string; role: import('../types').UserRole; team: string }) => Promise<User>;

  // Notification Actions
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;

  // Sync & Settings Actions
  setGoogleScriptUrl: (url: string) => void;
  setGeminiApiKey: (key: string) => void;
  syncWithGoogleSheets: () => Promise<void>;
  seedDemoDataAction: () => Promise<void>;
}

const todayStr = new Date().toISOString().substring(0, 10);

export const useAppStore = create<AppState>((set, get) => ({
  tasks: INITIAL_TASKS,
  users: INITIAL_USERS,
  teams: INITIAL_TEAMS,
  spaces: INITIAL_SPACES,
  timeLogs: [],
  notifications: INITIAL_NOTIFICATIONS,
  currentUser: INITIAL_USERS[0],
  isAuthenticated: false,

  activeTab: 'home',
  activeSpaceId: 'space_all',
  myTasksFilter: 'all',
  selectedTaskId: null,
  searchQuery: '',
  calendarView: 'day',
  selectedDate: todayStr,

  activeTimer: null,
  isInviteModalOpen: false,

  googleScriptUrl: process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || '',
  geminiApiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
  isSyncing: false,
  syncStatus: 'idle',
  syncMessage: '',

  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveSpaceId: (id) => set({ activeSpaceId: id }),
  setMyTasksFilter: (filter) => set({ myTasksFilter: filter }),
  setSelectedTaskId: (id) => set({ selectedTaskId: id }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setCalendarView: (view) => set({ calendarView: view }),
  setSelectedDate: (date) => set({ selectedDate: date }),

  addTask: (data) => {
    const newTask: Task = {
      id: 'task_' + Math.random().toString(36).substring(2, 9),
      title: data.title || 'Tugas Baru',
      description: data.description || '',
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      dueDate: data.dueDate || todayStr,
      scheduledTime: data.scheduledTime,
      durationMinutes: data.durationMinutes || 60,
      assignedTo: data.assignedTo || get().currentUser.id,
      spaceId: data.spaceId || (get().activeSpaceId !== 'space_all' ? get().activeSpaceId : 'space_pwa'),
      tags: data.tags || ['General'],
      subtasks: data.subtasks || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    set((state) => ({ tasks: [newTask, ...state.tasks] }));

    // Async sync if script URL configured
    const scriptUrl = get().googleScriptUrl;
    if (scriptUrl) {
      fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'createTask', data: newTask })
      }).catch(console.error);
    }

    return newTask;
  },

  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      )
    }));

    const scriptUrl = get().googleScriptUrl;
    if (scriptUrl) {
      fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'updateTask', id, data: updates })
      }).catch(console.error);
    }
  },

  deleteTask: (id) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
      selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId
    }));

    const scriptUrl = get().googleScriptUrl;
    if (scriptUrl) {
      fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'deleteTask', id })
      }).catch(console.error);
    }
  },

  moveTaskStatus: (id, newStatus) => {
    get().updateTask(id, { status: newStatus });
  },

  scheduleTask: (id, scheduledTime, date) => {
    const updates: Partial<Task> = { scheduledTime };
    if (date) updates.dueDate = date;
    get().updateTask(id, updates);
  },

  unscheduleTask: (id) => {
    get().updateTask(id, { scheduledTime: undefined });
  },

  toggleSubtask: (taskId, subtaskId) => {
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const subtasks = (t.subtasks || []).map((st) =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        return { ...t, subtasks, updatedAt: new Date().toISOString() };
      })
    }));
  },

  addComment: (taskId, content, attachment) => {
    const currentUser = get().currentUser;
    const newComment = {
      id: 'cmt_' + Math.random().toString(36).substring(2, 9),
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      content,
      createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      attachment
    };

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              comments: [...(t.comments || []), newComment],
              updatedAt: new Date().toISOString()
            }
          : t
      )
    }));
  },

  addAttachment: (taskId, attachment) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              attachments: [...(t.attachments || []), attachment],
              updatedAt: new Date().toISOString()
            }
          : t
      )
    }));
  },

  removeAttachment: (taskId, attachmentId) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              attachments: (t.attachments || []).filter((a) => a.id !== attachmentId),
              updatedAt: new Date().toISOString()
            }
          : t
      )
    }));
  },

  startTimer: (taskId) => {
    const currentTimer = get().activeTimer;
    if (currentTimer && currentTimer.taskId === taskId) {
      set({ activeTimer: { ...currentTimer, isRunning: true } });
      return;
    }
    set({
      activeTimer: {
        taskId,
        startTime: Date.now(),
        elapsedSeconds: 0,
        isRunning: true
      }
    });
  },

  pauseTimer: () => {
    const timer = get().activeTimer;
    if (timer) {
      set({ activeTimer: { ...timer, isRunning: false } });
    }
  },

  stopTimer: () => {
    const timer = get().activeTimer;
    if (!timer) return;

    const minutes = Math.max(1, Math.round(timer.elapsedSeconds / 60));
    const newLog: TimeLog = {
      id: 'log_' + Math.random().toString(36).substring(2, 9),
      taskId: timer.taskId,
      userId: get().currentUser.id,
      durationMinutes: minutes,
      logDate: todayStr,
      notes: `Durasi pengerjaan live timer: ${minutes} menit`,
      createdAt: new Date().toISOString()
    };

    set((state) => ({
      timeLogs: [newLog, ...state.timeLogs],
      activeTimer: null
    }));

    const scriptUrl = get().googleScriptUrl;
    if (scriptUrl) {
      fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'logTime', data: newLog })
      }).catch(console.error);
    }
  },

  tickTimer: () => {
    const timer = get().activeTimer;
    if (timer && timer.isRunning) {
      set({ activeTimer: { ...timer, elapsedSeconds: timer.elapsedSeconds + 1 } });
    }
  },

  setCurrentUser: (user) => set({ currentUser: user }),

  loginUser: (user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('SYNCRO_AUTH_USER', JSON.stringify(user));
    }
    set({ currentUser: user, isAuthenticated: true });
  },

  logoutUser: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('SYNCRO_AUTH_USER');
      localStorage.removeItem('SYNCRO_REMEMBER');
      sessionStorage.removeItem('SYNCRO_AUTH_USER');
    }
    set({ isAuthenticated: false });
  },

  setInviteModalOpen: (open) => set({ isInviteModalOpen: open }),

  inviteUser: async (data) => {
    const newUser: User = {
      id: `user_${Date.now().toString(36)}`,
      name: data.name,
      email: data.email,
      role: data.role,
      team: data.team,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name)}&backgroundColor=ee3425`,
      weeklyCapacityHours: 40
    };

    set((state) => ({
      users: [...state.users, newUser],
      notifications: [
        {
          id: `notif_${Date.now()}`,
          title: 'Undangan Rekan Kerja Terkirim',
          message: `${newUser.name} (${newUser.email}) berhasil ditambahkan ke tim ${newUser.team}.`,
          type: 'system',
          timestamp: 'Baru saja',
          read: false
        },
        ...state.notifications
      ]
    }));

    const url = get().googleScriptUrl;
    if (url) {
      try {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'registerUser', data: newUser })
        });
      } catch (err) {
        console.error('Failed to sync new invited user to Google Sheets', err);
      }
    }

    return newUser;
  },

  updateUserCapacity: (userId, hours) => {
    set((state) => ({
      users: state.users.map((u) => (u.id === userId ? { ...u, weeklyCapacityHours: hours } : u))
    }));
  },

  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    }));
  },

  clearAllNotifications: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true }))
    }));
  },

  setGoogleScriptUrl: (url) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('SYNCRO_APPS_SCRIPT_URL', url);
    }
    set({ googleScriptUrl: url });
  },

  setGeminiApiKey: (key) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('SYNCRO_GEMINI_KEY', key);
    }
    set({ geminiApiKey: key });
  },

  syncWithGoogleSheets: async () => {
    const url = get().googleScriptUrl;
    if (!url) {
      set({ syncStatus: 'error', syncMessage: 'URL Google Apps Script belum diisi di Pengaturan.' });
      return;
    }

    set({ isSyncing: true, syncMessage: 'Menghubungkan ke Google Sheets...' });
    try {
      const response = await fetch(`${url}?action=getInitialData`);
      const json = await response.json();

      if (json.status === 'success' && json.data) {
        const { tasks, users, teams, spaces, timeLogs } = json.data;
        set({
          tasks: Array.isArray(tasks) && tasks.length > 0 ? tasks : get().tasks,
          users: Array.isArray(users) && users.length > 0 ? users : get().users,
          teams: Array.isArray(teams) && teams.length > 0 ? teams : get().teams,
          spaces: Array.isArray(spaces) && spaces.length > 0 ? spaces : get().spaces,
          timeLogs: Array.isArray(timeLogs) ? timeLogs : get().timeLogs,
          syncStatus: 'success',
          syncMessage: `Berhasil tersinkronisasi (${new Date().toLocaleTimeString('id-ID')})`
        });
      } else {
        throw new Error(json.message || 'Gagal mengambil data');
      }
    } catch (err: any) {
      set({
        syncStatus: 'error',
        syncMessage: `Gagal sinkronisasi: ${err.message || 'Periksa koneksi atau URL Web App'}`
      });
    } finally {
      set({ isSyncing: false });
    }
  },

  seedDemoDataAction: async () => {
    const url = get().googleScriptUrl;
    if (!url) {
      set({ syncStatus: 'error', syncMessage: 'URL Google Apps Script belum diatur.' });
      return;
    }

    set({ isSyncing: true, syncMessage: 'Mengisi demo data ke Google Sheets...' });
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'seedDemoData' })
      });
      const data = await res.json();
      if (data.status === 'success') {
        await get().syncWithGoogleSheets();
      }
    } catch (err: any) {
      set({ syncStatus: 'error', syncMessage: err.message });
    } finally {
      set({ isSyncing: false });
    }
  }
}));
