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
  userEmail?: string; // Akun Gmail pemilik/pembuat tugas
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
  status?: 'active' | 'pending' | 'inactive';
  requestedAt?: string;
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
  senderEmail?: string;
  text: string;
  timestamp: string;
}



export interface DirectMessageThread {
  id: string;
  participantId: string;
  participantName: string;
  participantEmail?: string;
  participantEmails?: string[];
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

export interface CalendarEvent {
  id: string;
  title: string;
  dateStr: string; // "YYYY-MM-DD"
  timeRange?: string; // e.g. "09:00 - 10:00"
  startHour?: string; // e.g. "09:00"
  endHour?: string; // e.g. "10:00"
  color?: string;
  meetUrl?: string;
  isGoogleEvent?: boolean;
  userEmail?: string;
  taskId?: string;
  location?: string;
  description?: string;
  guests?: string;
  isInvitation?: boolean;
  myStatus?: string;
  eventType?: 'event' | 'task' | 'focus' | 'reminder';
  recurrence?: string;
}

interface AppState {
  tasks: Task[];
  users: User[];
  spaces: Space[];
  deletedSpaceIds?: string[];
  dmThreads: DirectMessageThread[];
  notifications: NotificationItem[];
  calendarEvents: CalendarEvent[];
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

  // Google Calendar Actions
  setCalendarEvents: (events: CalendarEvent[]) => void;
  addCalendarEvent: (event: CalendarEvent) => void;
  replaceCalendarEvent: (oldId: string, newEvent: CalendarEvent) => void;
  deleteCalendarEvent: (id: string) => void;

  // Space Actions
  setSpaces: (spaces: Space[]) => void;
  addSpace: (space: Omit<Space, 'id'>) => void;
  updateSpace: (id: string, updates: Partial<Space>) => void;
  deleteSpace: (id: string) => void;

  // Direct Message Actions
  setDMThreads: (dmThreads: DirectMessageThread[]) => void;
  createOrSelectDMThread: (participant: User) => string;
  sendDMMessage: (threadId: string, message: { text: string; senderId: string; senderName: string; senderEmail?: string }) => void;
  deleteDMMessage: (threadId: string, messageId: string) => void;
  deleteDMThread: (threadId: string) => void;


  // Teams & User Actions
  setUsers: (users: User[]) => void;
  updateUserRole: (userId: string, role: 'admin' | 'member' | 'guest') => void;
  addUser: (user: Omit<User, 'id'>) => void;
  approveUser: (userId: string, role: 'admin' | 'member' | 'guest', department?: string, userEmail?: string) => void;
  rejectUser: (userId: string, userEmail?: string) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string, userEmail?: string) => void;

  // Notification Actions
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  // Integration Actions
  toggleIntegration: (key: keyof AppState['integrations']) => void;

  // Auth State & Actions (Strict Team Authentication)
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (user?: User) => boolean | void;
  loginWithGoogle: (email: string, name?: string, avatarUrl?: string) => boolean;
  logout: () => void;

  // Cloud Sync Backend State
  cloudSyncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  lastCloudSync: string | null;
  lastCloudSyncMessage?: string | null;
  isAutoSyncEnabled: boolean;
  toggleAutoSync: () => void;
  setAutoSyncEnabled: (enabled: boolean) => void;
  setCloudSyncStatus: (status: 'idle' | 'syncing' | 'synced' | 'error', time?: string, message?: string | null) => void;
}

const INITIAL_USERS: User[] = [];
const INITIAL_SPACES: Space[] = [];
const INITIAL_TASKS: Task[] = [];
const INITIAL_DMS: DirectMessageThread[] = [];
const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: [],
      users: [],
      spaces: [],
      deletedSpaceIds: [],
      dmThreads: [],
      notifications: [],
      calendarEvents: [],
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
        const currentUser = get().currentUser;
        const newTask: Task = {
          ...taskData,
          id: taskData.id || `t_${Date.now()}`,
          createdAt: new Date().toISOString().split('T')[0],
          timeTracked: taskData.timeTracked || 0,
          userEmail: taskData.userEmail || currentUser?.email || '',
          assigneeId: taskData.assigneeId || currentUser?.id || 'u1',
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

      setCalendarEvents: (calendarEvents) => set({ calendarEvents }),
      addCalendarEvent: (event) => set((state) => ({
        calendarEvents: [event, ...state.calendarEvents.filter((e) => e.id !== event.id)],
      })),
      replaceCalendarEvent: (oldId, newEvent) => set((state) => ({
        calendarEvents: [
          newEvent,
          ...state.calendarEvents.filter((e) => e.id !== oldId && e.id !== newEvent.id),
        ],
      })),
      deleteCalendarEvent: (id) => set((state) => ({
        calendarEvents: state.calendarEvents.filter((e) => e.id !== id),
      })),

      setSpaces: (spaces) => set({ spaces }),
      addSpace: (spaceData) => {
        const newSpace: Space = {
          ...spaceData,
          id: `sp_${Date.now()}`,
        };
        set((state) => ({ spaces: [...state.spaces, newSpace] }));
      },
      updateSpace: (id, updates) => {
        set((state) => ({
          spaces: state.spaces.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        }));
      },
      deleteSpace: (id) => {
        set((state) => ({
          spaces: state.spaces.filter((s) => s.id !== id),
          tasks: state.tasks.map((t) => (t.spaceId === id ? { ...t, spaceId: undefined } : t)),
          deletedSpaceIds: [...(state.deletedSpaceIds || []).filter((x) => x !== id).slice(-50), id],
        }));
      },


      setDMThreads: (dmThreads) => set({ dmThreads }),

      createOrSelectDMThread: (participant: User) => {
        const state = get();
        const currentUser = state.currentUser;
        const myEmail = (currentUser?.email || 'user_me').toLowerCase().trim();
        const theirEmail = (participant.email || participant.id).toLowerCase().trim();

        // Buat ID kanonikal yang sama persis di kedua belah pihak
        const sorted = [myEmail, theirEmail].sort();
        const canonicalId = `dm_${sorted[0].replace(/[^a-zA-Z0-9]/g, '_')}_${sorted[1].replace(/[^a-zA-Z0-9]/g, '_')}`;

        const existing = state.dmThreads.find(
          (t) =>
            t.id === canonicalId ||
            (t.participantEmails && t.participantEmails.includes(myEmail) && t.participantEmails.includes(theirEmail)) ||
            (t.participantEmail && t.participantEmail.toLowerCase().trim() === theirEmail) ||
            t.participantId === participant.id
        );

        if (existing) {
          if (existing.id !== canonicalId || !existing.participantEmails) {
            set((s) => ({
              dmThreads: s.dmThreads.map((t) =>
                t.id === existing.id
                  ? {
                      ...t,
                      id: canonicalId,
                      participantEmail: participant.email,
                      participantName: participant.name,
                      participantEmails: [myEmail, theirEmail],
                    }
                  : t
              ),
            }));
          }
          return canonicalId;
        }

        const newThread: DirectMessageThread = {
          id: canonicalId,
          participantId: participant.id,
          participantName: participant.name,
          participantEmail: participant.email,
          participantEmails: [myEmail, theirEmail],
          messages: [],
        };

        set((s) => ({ dmThreads: [newThread, ...s.dmThreads] }));
        return newThread.id;
      },

      sendDMMessage: (threadId, message) => {
        const currentUser = get().currentUser;
        const newMsg: ChatMessage = {
          id: `dm_msg_${Date.now()}`,
          ...message,
          senderEmail: message.senderEmail || currentUser?.email || '',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        set((state) => ({
          dmThreads: state.dmThreads.map((dm) =>
            dm.id === threadId ? { ...dm, messages: [...(dm.messages || []), newMsg] } : dm
          ),
        }));

        // Sinkronkan ke API /api/dm secara realtime (< 10ms)
        if (typeof fetch !== 'undefined') {
          const thread = get().dmThreads.find((dm) => dm.id === threadId);
          fetch('/api/dm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              threadId,
              message: newMsg,
              participantEmail: thread?.participantEmail,
              participantName: thread?.participantName,
              participantId: thread?.participantId,
              participantEmails: thread?.participantEmails || [],
            }),
          }).catch((err) => console.warn('[DM Sync Warning]', err));
        }
      },

      deleteDMMessage: (threadId, messageId) => {
        set((state) => ({
          dmThreads: state.dmThreads.map((t) =>
            t.id === threadId
              ? { ...t, messages: (t.messages || []).filter((m) => m.id !== messageId) }
              : t
          ),
        }));

        if (typeof fetch !== 'undefined') {
          fetch('/api/dm', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ threadId, messageId }),
          }).catch((err) => console.warn('[Delete DM Msg Warning]', err));
        }
      },

      deleteDMThread: (threadId) => {
        set((state) => ({
          dmThreads: state.dmThreads.filter((t) => t.id !== threadId),
        }));

        if (typeof fetch !== 'undefined') {
          fetch('/api/dm', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ threadId, deleteThread: true }),
          }).catch((err) => console.warn('[Delete DM Thread Warning]', err));
        }
      },


      setUsers: (users) => set({ users }),
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

      approveUser: (userId, role, department, userEmail) => {
        const target = get().users.find((u) =>
          (userEmail && u.email?.toLowerCase().trim() === userEmail.toLowerCase().trim()) ||
          (userId && userId !== '' && u.id === userId)
        );
        if (!target) return;

        const targetEmail = target.email?.toLowerCase().trim() || '';
        const isMaster = targetEmail === 'ravizein@itsecacademy.com';
        const finalRole = isMaster ? 'admin' : role;

        const updated: User = {
          ...target,
          role: finalRole,
          department: department || target.department || 'Product & Tech',
          status: 'active',
        };

        set((state) => ({
          users: state.users.map((u) => {
            const isMatch = (targetEmail && u.email?.toLowerCase().trim() === targetEmail) ||
                            (userId && userId !== '' && u.id === userId);
            return isMatch ? updated : u;
          }),
        }));

        if (typeof fetch !== 'undefined') {
          fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'updateUser',
              payload: updated,
            }),
          }).catch((err) => console.warn('Failed to sync approved user:', err));
        }
      },

      rejectUser: (userId, userEmail) => {
        const target = get().users.find((u) =>
          (userEmail && u.email?.toLowerCase().trim() === userEmail.toLowerCase().trim()) ||
          (userId && userId !== '' && u.id === userId)
        );
        const targetEmail = (target?.email || userEmail || '').toLowerCase().trim();

        set((state) => ({
          users: state.users.filter((u) => {
            if (targetEmail && u.email?.toLowerCase().trim() === targetEmail) return false;
            if (userId && userId !== '' && u.id === userId) return false;
            return true;
          }),
          dmThreads: state.dmThreads.filter((t) => {
            if (targetEmail) {
              if (t.participantEmail?.toLowerCase().trim() === targetEmail) return false;
              if (t.participantEmails && t.participantEmails.some((e) => e.toLowerCase().trim() === targetEmail)) return false;
              if (t.id.includes(targetEmail.replace(/[^a-zA-Z0-9]/g, '_'))) return false;
            }
            if (userId && (t.participantId === userId || t.id.includes(userId))) return false;
            return true;
          }),
        }));

        if (typeof fetch !== 'undefined') {
          fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'deleteUser',
              payload: { id: userId, email: targetEmail },
            }),
          }).catch((err) => console.warn('Failed to delete rejected user:', err));
        }
      },

      updateUser: (userId, updates) => {
        const target = get().users.find((u) => u.id === userId);
        if (!target) return;
        const updated: User = {
          ...target,
          ...updates,
        };
        set((state) => ({
          users: state.users.map((u) => (u.id === userId ? updated : u)),
          currentUser: state.currentUser?.id === userId ? updated : state.currentUser,
        }));

        if (typeof fetch !== 'undefined') {
          fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'updateUser',
              payload: updated,
            }),
          }).catch((err) => console.warn('Failed to sync updated user:', err));
        }
      },

      deleteUser: (userId, userEmail) => {
        const target = get().users.find((u) =>
          (userEmail && u.email?.toLowerCase().trim() === userEmail.toLowerCase().trim()) ||
          (userId && userId !== '' && u.id === userId)
        );
        const emailToDelete = (target?.email || userEmail || '').toLowerCase().trim();

        set((state) => ({
          users: state.users.filter((u) => {
            if (emailToDelete && u.email?.toLowerCase().trim() === emailToDelete) return false;
            if (userId && userId !== '' && u.id === userId) return false;
            return true;
          }),
          dmThreads: state.dmThreads.filter((t) => {
            if (emailToDelete) {
              if (t.participantEmail?.toLowerCase().trim() === emailToDelete) return false;
              if (t.participantEmails && t.participantEmails.some((e) => e.toLowerCase().trim() === emailToDelete)) return false;
              if (t.id.includes(emailToDelete.replace(/[^a-zA-Z0-9]/g, '_'))) return false;
            }
            if (userId && (t.participantId === userId || t.id.includes(userId))) return false;
            return true;
          }),
        }));

        if (typeof fetch !== 'undefined') {
          fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'deleteUser',
              payload: { id: userId, email: emailToDelete },
            }),
          }).catch((err) => console.warn('Failed to delete user:', err));
        }
      },

      login: (user) => {
        if (user) {
          const isMaster = user.email.toLowerCase().trim() === 'ravizein@itsecacademy.com';
          if (isMaster) {
            set({
              isAuthenticated: true,
              currentUser: { ...user, role: 'admin', status: 'active' },
            });
            return true;
          }

          const matched = get().users.find(
            (u) => u.email.toLowerCase().trim() === user.email.toLowerCase().trim()
          );
          if (matched && matched.status === 'active') {
            set({
              isAuthenticated: true,
              currentUser: matched,
            });
            return true;
          }
        }
        return false;
      },

      loginWithGoogle: (email: string, name?: string, avatarUrl?: string) => {
        const cleanEmail = email.trim().toLowerCase();
        if (cleanEmail === 'ravizein@itsecacademy.com') {
          const adminUser: User = {
            id: 'user_1',
            name: name || 'Ravi Zein',
            email: cleanEmail,
            role: 'admin',
            avatar: avatarUrl || 'RA',
            department: 'Product & Tech',
            capacityHours: 40,
            status: 'active',
          };
          set({
            isAuthenticated: true,
            currentUser: adminUser,
            integrations: { ...get().integrations, googleAuth: true },
          });
          return true;
        }

        const found = get().users.find((u) => u.email.toLowerCase().trim() === cleanEmail);

        if (found && found.status === 'active') {
          set({
            isAuthenticated: true,
            currentUser: found,
            integrations: { ...get().integrations, googleAuth: true },
          });
          return true;
        }

        // Email belum berstatus aktif atau belum disetujui Admin
        return false;
      },


      logout: () =>
        set({
          isAuthenticated: false,
          currentUser: null,
        }),

      // Cloud Sync Backend State
      cloudSyncStatus: 'idle',
      lastCloudSync: null,
      lastCloudSyncMessage: null,
      isAutoSyncEnabled: true,
      toggleAutoSync: () =>
        set((state) => ({ isAutoSyncEnabled: !state.isAutoSyncEnabled })),
      setAutoSyncEnabled: (isAutoSyncEnabled) => set({ isAutoSyncEnabled }),
      setCloudSyncStatus: (status, time, message) =>
        set({
          cloudSyncStatus: status,
          ...(time !== undefined ? { lastCloudSync: time } : {}),
          ...(message !== undefined ? { lastCloudSyncMessage: message } : {}),
        }),
    }),
    {
      name: 'syncro-storage-v3',
    }
  )
);
