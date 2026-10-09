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

  // Auth State & Actions (PRD: Google OAuth 2.0 & Team Login)
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (user?: User) => void;
  loginWithGoogle: (email?: string, name?: string) => void;
  logout: () => void;

  // Cloud Sync Backend State
  cloudSyncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  lastCloudSync: string | null;
  setCloudSyncStatus: (status: 'idle' | 'syncing' | 'synced' | 'error', time?: string) => void;
}

const INITIAL_USERS: User[] = [];
const INITIAL_SPACES: Space[] = [];
const INITIAL_TASKS: Task[] = [];
const INITIAL_CHANNELS: Channel[] = [];
const INITIAL_DMS: DirectMessageThread[] = [];
const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: [],
      users: [],
      spaces: [],
      channels: [],
      dmThreads: [],
      notifications: [],
      activeTimerTaskId: null,
      timerSeconds: 0,
      isTimerRunning: false,
      integrations: {
        googleAuth: false,
        googleCalendar: false,
        googleDrive: false,
        googleMeet: false,
        gmail: false,
      },

      // Auth State - Clean Initial State (Guest)
      currentUser: null,
      isAuthenticated: false,

      theme: 'light',
      language: 'id',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      setLanguage: (language) => set({ language }),

      isMobileSidebarOpen: false,
      setMobileSidebarOpen: (isMobileSidebarOpen) => set({ isMobileSidebarOpen }),
      toggleMobileSidebar: () => set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),

      lineupTaskIds: [],
      personalNotes: '',
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

      login: (user) => {
        if (user) {
          const exists = get().users.some((u) => u.id === user.id);
          set({
            isAuthenticated: true,
            currentUser: user,
            users: exists ? get().users : [...get().users, user],
          });
        }
      },

      loginWithGoogle: (email = 'ravizein@itsecacademy.com', name = 'Ravi Zein') => {
        const found = get().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        const initials = name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase() || 'RZ';

        const userObj: User = found || {
          id: `u_${Date.now()}`,
          name,
          email,
          role: get().users.length === 0 ? 'admin' : 'member',
          department: 'Product & Tech',
          capacityHours: 40,
          avatar: initials,
        };

        set({
          isAuthenticated: true,
          currentUser: userObj,
          users: found ? get().users : [...get().users, userObj],
          integrations: { ...get().integrations, googleAuth: true },
        });
      },

      logout: () =>
        set({
          isAuthenticated: false,
          currentUser: null,
        }),

      // Cloud Sync Backend State
      cloudSyncStatus: 'idle',
      lastCloudSync: null,
      setCloudSyncStatus: (status, time) =>
        set({
          cloudSyncStatus: status,
          ...(time !== undefined ? { lastCloudSync: time } : {}),
        }),
    }),
    {
      name: 'syncro-storage-v3',
    }
  )
);
