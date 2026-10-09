import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TaskAttachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'link';
  url: string;
  name: string;
  size?: string;
}

export interface TaskComment {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderDepartment?: string;
  text: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority?: 'urgent' | 'high' | 'normal' | 'low';
  assigneeId?: string;
  spaceId?: string;
  dueDate?: string;
  timeEstimate?: number; // in minutes
  timeTracked?: number; // in minutes
  scheduledSlot?: string; // e.g. "08:00 AM", "10:00 AM", or undefined if unscheduled
  isPersonal?: boolean;
  tags?: string[];
  subtasks?: { id: string; title: string; done: boolean }[];
  attachments?: TaskAttachment[];
  comments?: TaskComment[];
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'guest';
  avatar?: string;
  department: string;
  capacityHours: number;
}

export interface Space {
  id: string;
  name: string;
  color: string;
  description: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  department: string;
  messages: ChatMessage[];
}

export interface DirectMessageThread {
  id: string;
  participantId: string;
  participantName: string;
  messages: ChatMessage[];
}

export interface NotificationItem {
  id: string;
  sender: string;
  action: string;
  target: string;
  time: string;
  read: boolean;
  type: 'task' | 'mention' | 'system';
}

interface AppState {
  tasks: Task[];
  users: User[];
  spaces: Space[];
  channels: Channel[];
  dmThreads: DirectMessageThread[];
  notifications: NotificationItem[];
  activeTimerTaskId: string | null;
  timerSeconds: number;
  isTimerRunning: boolean;
  integrations: {
    googleAuth: boolean;
    googleCalendar: boolean;
    googleDrive: boolean;
    googleMeet: boolean;
    gmail: boolean;
  };

  // Appearance & Localization
  theme: 'light' | 'dark';
  language: 'id' | 'en';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setLanguage: (lang: 'id' | 'en') => void;

  // Mobile Navigation
  isMobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;

  // ClickUp Home Features
  lineupTaskIds: string[];
  personalNotes: string;
  addToLineup: (taskId: string) => void;
  removeFromLineup: (taskId: string) => void;
  setPersonalNotes: (notes: string) => void;

  // Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt'> & { id?: string }) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  
  // Timer Actions
  startTimer: (taskId: string) => void;
  pauseTimer: () => void;
  stopTimer: () => void;
  tickTimer: () => void;

  // Task Comments Actions
  addTaskComment: (taskId: string, comment: Omit<TaskComment, 'id' | 'createdAt'>) => void;
  deleteTaskComment: (taskId: string, commentId: string) => void;

  // Space Actions
  addSpace: (space: Omit<Space, 'id'>) => void;

  // Chat Actions
  sendChannelMessage: (channelId: string, message: { text: string; senderId: string; senderName: string }) => void;
  sendDMMessage: (threadId: string, message: { text: string; senderId: string; senderName: string }) => void;

  // Teams & User Actions
  updateUserRole: (userId: string, role: 'admin' | 'member' | 'guest') => void;
  addUser: (user: Omit<User, 'id'>) => void;

  // Notification Actions
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  // Integration Actions
  toggleIntegration: (key: keyof AppState['integrations']) => void;
}

const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'Ravi Zein', email: 'ravi@syncro.io', role: 'admin', department: 'Engineering', capacityHours: 40, avatar: 'RZ' },
  { id: 'u2', name: 'Sarah Connor', email: 'sarah@syncro.io', role: 'member', department: 'Product', capacityHours: 35, avatar: 'SC' },
  { id: 'u3', name: 'Alex Rivera', email: 'alex@syncro.io', role: 'member', department: 'Design', capacityHours: 40, avatar: 'AR' },
  { id: 'u4', name: 'Devin Vance', email: 'devin@syncro.io', role: 'guest', department: 'External Audit', capacityHours: 20, avatar: 'DV' },
];

const INITIAL_SPACES: Space[] = [
  { id: 'sp1', name: 'Core Product', color: 'from-blue-500 to-indigo-600', description: 'Fitur utama aplikasi Syncro PWA' },
  { id: 'sp2', name: 'Growth & Marketing', color: 'from-purple-500 to-pink-600', description: 'Kampanye peluncuran & adopsi user' },
  { id: 'sp3', name: 'DevOps & Infrastructure', color: 'from-emerald-500 to-teal-600', description: 'Google Cloud, Vercel & GAS pipelines' },
];

const INITIAL_TASKS: Task[] = [
  { 
    id: 't1', 
    title: 'Review PRD Syncro & Gemini API Schema', 
    description: 'Pastikan seluruh scope modul ClickUp & Gemini terakomodasi.', 
    status: 'done', 
    priority: 'high', 
    assigneeId: 'u1', 
    spaceId: 'sp1', 
    dueDate: '2026-10-08', 
    timeEstimate: 120, 
    timeTracked: 110, 
    scheduledSlot: '08:00 AM', 
    isPersonal: false, 
    createdAt: '2026-10-07',
    comments: [
      {
        id: 'c1',
        senderId: 'u2',
        senderName: 'Sarah Connor',
        senderAvatar: 'SC',
        senderDepartment: 'Product',
        text: 'Review PRD sudah tuntas! Scope ClickUp 3.0 & integrasi AI Gemini sudah disetujui.',
        createdAt: '2026-10-07T09:30:00.000Z',
      },
      {
        id: 'c2',
        senderId: 'u1',
        senderName: 'Ravi Zein',
        senderAvatar: 'RZ',
        senderDepartment: 'Engineering',
        text: 'Mantap Sarah! Lanjut ke integrasi Google Apps Script REST Endpoint.',
        createdAt: '2026-10-07T10:15:00.000Z',
      }
    ]
  },
  { 
    id: 't2', 
    title: 'Design System & Dark Mode Aesthetics', 
    description: 'Implementasi tema gelap modern dengan Tailwind CSS.', 
    status: 'done', 
    priority: 'urgent', 
    assigneeId: 'u3', 
    spaceId: 'sp1', 
    dueDate: '2026-10-08', 
    timeEstimate: 180, 
    timeTracked: 175, 
    scheduledSlot: '10:00 AM', 
    isPersonal: false, 
    createdAt: '2026-10-07',
    comments: [
      {
        id: 'c3',
        senderId: 'u3',
        senderName: 'Alex Rivera',
        senderAvatar: 'AR',
        senderDepartment: 'Design',
        text: 'Nuansa warna ITSEC Red (#EE3726) sudah diaplikasikan ke seluruh komponen modal dan badge.',
        createdAt: '2026-10-07T14:20:00.000Z',
      }
    ]
  },
  { 
    id: 't3', 
    title: 'Setup Google Apps Script REST Endpoint', 
    description: 'Hubungkan doGet dan doPost ke Google Sheets database.', 
    status: 'in-progress', 
    priority: 'high', 
    assigneeId: 'u1', 
    spaceId: 'sp3', 
    dueDate: '2026-10-09', 
    timeEstimate: 240, 
    timeTracked: 95, 
    scheduledSlot: '01:00 PM', 
    isPersonal: false, 
    createdAt: '2026-10-08',
    comments: [
      {
        id: 'c4',
        senderId: 'u1',
        senderName: 'Ravi Zein',
        senderAvatar: 'RZ',
        senderDepartment: 'Engineering',
        text: 'Web app URL Apps Script sudah berhasil dideploy dengan akses Any User.',
        createdAt: '2026-10-08T11:00:00.000Z',
      },
      {
        id: 'c5',
        senderId: 'u2',
        senderName: 'Sarah Connor',
        senderAvatar: 'SC',
        senderDepartment: 'Product',
        text: 'Bagus Ravi, pastikan CORS headers dan respon JSON error 400 terformat dengan rapi.',
        createdAt: '2026-10-08T11:45:00.000Z',
      }
    ]
  },
  { id: 't4', title: 'Interactive Planner & Time Blocking Drag-Drop', description: 'Fitur kalender harian, mingguan, dan unscheduled drawer.', status: 'in-progress', priority: 'urgent', assigneeId: 'u1', spaceId: 'sp1', dueDate: '2026-10-09', timeEstimate: 180, timeTracked: 60, scheduledSlot: '03:00 PM', isPersonal: false, createdAt: '2026-10-08' },
  { id: 't5', title: 'Integrasi Google Meet 1-Click Link Generator', description: 'Buat tombol pembuatan room Meet langsung dari Planner.', status: 'todo', priority: 'normal', assigneeId: 'u2', spaceId: 'sp1', dueDate: '2026-10-10', timeEstimate: 90, timeTracked: 0, isPersonal: false, createdAt: '2026-10-08' },
  { id: 't6', title: 'Personal: Siapkan slide presentasi standup mingguan', description: 'Catatan poin-poin progress untuk sync tim.', status: 'todo', priority: 'low', assigneeId: 'u1', dueDate: '2026-10-09', timeEstimate: 45, timeTracked: 0, isPersonal: true, createdAt: '2026-10-08' },
  { id: 't7', title: 'SOP Dokumentasi Google Drive API V2', description: 'Rangkum panduan izin OAuth 2.0 untuk tim support.', status: 'todo', priority: 'normal', assigneeId: 'u2', spaceId: 'sp3', dueDate: '2026-10-12', timeEstimate: 150, timeTracked: 0, isPersonal: false, createdAt: '2026-10-08' },
];

const INITIAL_CHANNELS: Channel[] = [
  {
    id: 'ch-general',
    name: 'general',
    description: 'Diskusi umum seluruh anggota tim Syncro',
    department: 'All',
    messages: [
      { id: 'm1', senderId: 'u1', senderName: 'Ravi Zein', text: 'Halo tim! Proyek Syncro PWA sudah dimulai. Fokus utama kita adalah kesederhanaan & integrasi Gemini.', timestamp: '09:00 AM' },
      { id: 'm2', senderId: 'u2', senderName: 'Sarah Connor', text: 'Siap Ravi, PRD sudah kami review. Alur Planner time blocking sangat bersih!', timestamp: '09:15 AM' },
    ],
  },
  {
    id: 'ch-engineering',
    name: 'engineering',
    description: 'Diskusi arsitektur kode Next.js, Apps Script & Gemini API',
    department: 'Engineering',
    messages: [
      { id: 'm3', senderId: 'u1', senderName: 'Ravi Zein', text: 'Endpoints doGet & doPost sudah siap di script backend sheets.', timestamp: '10:30 AM' },
      { id: 'm4', senderId: 'u3', senderName: 'Alex Rivera', text: 'Bagus, komponen UI Drag & Drop juga sudah sinkron dengan Zustand store.', timestamp: '11:00 AM' },
    ],
  },
  {
    id: 'ch-product',
    name: 'product-roadmap',
    description: 'Perencanaan fitur ClickUp-lite & feedback pengguna',
    department: 'Product',
    messages: [
      { id: 'm5', senderId: 'u2', senderName: 'Sarah Connor', text: 'Pastikan fitur AI Brain memiliki 3 mode: Knowledge Manager, Standup Writer, & Action Extractor.', timestamp: '08:45 AM' },
    ],
  },
];

const INITIAL_DMS: DirectMessageThread[] = [
  {
    id: 'dm-sarah',
    participantId: 'u2',
    participantName: 'Sarah Connor',
    messages: [
      { id: 'dm1', senderId: 'u2', senderName: 'Sarah Connor', text: 'Hai Ravi, bagaimana estimasi kuota free tier Gemini API kita?', timestamp: 'Yesterday' },
      { id: 'dm2', senderId: 'u1', senderName: 'Ravi Zein', text: 'Sangat aman, model Gemini 1.5 Flash memiliki rate limit gratis yang cukup leluasa untuk tim kita.', timestamp: 'Yesterday' },
    ],
  },
  {
    id: 'dm-alex',
    participantId: 'u3',
    participantName: 'Alex Rivera',
    messages: [
      { id: 'dm3', senderId: 'u3', senderName: 'Alex Rivera', text: 'Icon PWA 192x192 & 512x512 sudah saya siapkan polanya ya.', timestamp: '10:05 AM' },
    ],
  },
];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: 'n1', sender: 'Sarah Connor', action: 'menugaskan task baru', target: 'Integrasi Google Meet 1-Click Link', time: '10m lalu', read: false, type: 'task' },
  { id: 'n2', sender: 'Alex Rivera', action: 'menyelesaikan tugas', target: 'Design System & Dark Mode Aesthetics', time: '1 jam lalu', read: false, type: 'task' },
  { id: 'n3', sender: 'Syncro System', action: 'sinkronisasi sukses', target: 'Google Sheets Backend (GAS)', time: '2 jam lalu', read: true, type: 'system' },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: INITIAL_TASKS,
      users: INITIAL_USERS,
      spaces: INITIAL_SPACES,
      channels: INITIAL_CHANNELS,
      dmThreads: INITIAL_DMS,
      notifications: INITIAL_NOTIFICATIONS,
      activeTimerTaskId: null,
      timerSeconds: 0,
      isTimerRunning: false,
      integrations: {
        googleAuth: true,
        googleCalendar: true,
        googleDrive: true,
        googleMeet: true,
        gmail: false,
      },

      theme: 'light',
      language: 'id',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      setLanguage: (language) => set({ language }),

      isMobileSidebarOpen: false,
      setMobileSidebarOpen: (isMobileSidebarOpen) => set({ isMobileSidebarOpen }),
      toggleMobileSidebar: () => set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),

      lineupTaskIds: ['t3', 't4'],
      personalNotes: "- Persiapkan demo Syncro PWA untuk tim ITSEC\n- Tinjau konfigurasi Google OAuth SSO\n- Evaluasi response rate Gemini AI",
      addToLineup: (taskId) => set((state) => ({
        lineupTaskIds: state.lineupTaskIds.includes(taskId) ? state.lineupTaskIds : [...state.lineupTaskIds, taskId]
      })),
      removeFromLineup: (taskId) => set((state) => ({
        lineupTaskIds: state.lineupTaskIds.filter((id) => id !== taskId)
      })),
      setPersonalNotes: (personalNotes) => set({ personalNotes }),

      setTasks: (tasks) => set({ tasks }),
      
      addTask: (taskData) => {
        const newTask: Task = {
          ...taskData,
          id: taskData.id || `t_${Date.now()}`,
          createdAt: new Date().toISOString().split('T')[0],
          timeTracked: taskData.timeTracked || 0,
        };
        set((state) => ({ tasks: [newTask, ...state.tasks] }));
      },

      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),

      addTaskComment: (taskId, commentData) =>
        set((state) => {
          const newComment: TaskComment = {
            ...commentData,
            id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            createdAt: new Date().toISOString(),
          };

          const targetTask = state.tasks.find((t) => t.id === taskId);
          const newNotif: NotificationItem = {
            id: `notif_${Date.now()}`,
            sender: commentData.senderName,
            action: 'mengomentari task',
            target: targetTask ? targetTask.title : 'Tugas',
            time: 'Baru saja',
            read: false,
            type: 'task',
          };

          return {
            tasks: state.tasks.map((t) =>
              t.id === taskId
                ? { ...t, comments: [...(t.comments || []), newComment] }
                : t
            ),
            notifications: [newNotif, ...state.notifications],
          };
        }),

      deleteTaskComment: (taskId, commentId) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, comments: (t.comments || []).filter((c) => c.id !== commentId) }
              : t
          ),
        })),

      startTimer: (taskId) => {
        const state = get();
        if (state.activeTimerTaskId === taskId && state.isTimerRunning) return;
        set({
          activeTimerTaskId: taskId,
          isTimerRunning: true,
          timerSeconds: 0,
        });
      },

      pauseTimer: () => set({ isTimerRunning: false }),

      stopTimer: () => {
        const state = get();
        if (state.activeTimerTaskId && state.timerSeconds > 0) {
          const addedMinutes = Math.max(1, Math.round(state.timerSeconds / 60));
          const task = state.tasks.find((t) => t.id === state.activeTimerTaskId);
          if (task) {
            get().updateTask(task.id, {
              timeTracked: (task.timeTracked || 0) + addedMinutes,
            });
          }
        }
        set({
          activeTimerTaskId: null,
          isTimerRunning: false,
          timerSeconds: 0,
        });
      },

      tickTimer: () => {
        const state = get();
        if (state.isTimerRunning) {
          set({ timerSeconds: state.timerSeconds + 1 });
        }
      },

      addSpace: (spaceData) => {
        const newSpace: Space = {
          ...spaceData,
          id: `sp_${Date.now()}`,
        };
        set((state) => ({ spaces: [...state.spaces, newSpace] }));
      },

      sendChannelMessage: (channelId, message) => {
        const newMsg: ChatMessage = {
          id: `msg_${Date.now()}`,
          ...message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        set((state) => ({
          channels: state.channels.map((ch) =>
            ch.id === channelId ? { ...ch, messages: [...ch.messages, newMsg] } : ch
          ),
        }));
      },

      sendDMMessage: (threadId, message) => {
        const newMsg: ChatMessage = {
          id: `dm_msg_${Date.now()}`,
          ...message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        set((state) => ({
          dmThreads: state.dmThreads.map((dm) =>
            dm.id === threadId ? { ...dm, messages: [...dm.messages, newMsg] } : dm
          ),
        }));
      },

      updateUserRole: (userId, role) =>
        set((state) => ({
          users: state.users.map((u) => (u.id === userId ? { ...u, role } : u)),
        })),

      addUser: (userData) => {
        const newUser: User = {
          ...userData,
          id: `u_${Date.now()}`,
        };
        set((state) => ({ users: [...state.users, newUser] }));
      },

      markNotificationAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      markAllNotificationsAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

      toggleIntegration: (key) =>
        set((state) => ({
          integrations: {
            ...state.integrations,
            [key]: !state.integrations[key],
          },
        })),
    }),
    {
      name: 'syncro-storage-v2',
    }
  )
);
