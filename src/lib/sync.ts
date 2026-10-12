/**
 * Sync Service between Syncro Client and Google Apps Script / Next.js API Backend
 * Supports:
 * - Automatic background synchronization per user Gmail account
 * - Debounced auto-save on task changes
 * - Initial cloud pull & merge on app load / user login
 * - Offline-first caching with graceful recovery
 */

import { Task, CalendarEvent, useStore } from '@/store/useStore';

export interface SyncStatus {
  lastSyncTime: string | null;
  isSyncing: boolean;
  status: 'idle' | 'syncing' | 'synced' | 'error';
  errorMessage?: string;
}

// Global in-flight lock and debounce timer
let isSyncInProgress = false;
let autoSyncDebounceTimer: NodeJS.Timeout | null = null;
let hasPendingChanges = false;

/**
 * Format timestamp to friendly local time string (e.g. 14:05:30)
 */
function getNowFormatted(): string {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/**
 * Debounced Auto Sync Trigger
 * Called automatically when tasks are created, modified, or deleted.
 * Waits for a brief pause (1.5 seconds) before automatically syncing to Google Sheets.
 */
export function triggerDebouncedAutoSync(delayMs = 1500) {
  const { isAutoSyncEnabled } = useStore.getState();
  if (!isAutoSyncEnabled) return;

  hasPendingChanges = true;

  if (autoSyncDebounceTimer) {
    clearTimeout(autoSyncDebounceTimer);
  }

  autoSyncDebounceTimer = setTimeout(() => {
    autoSyncDebounceTimer = null;
    performAutoCloudSync();
  }, delayMs);
}

/**
 * Pull latest data from Google Apps Script / Cloud Backend for the current Gmail account
 * Used on app initial load, user login, or when refreshing tab.
 */
export async function pullCloudData(specificEmail?: string): Promise<{
  success: boolean;
  pulledCount: number;
  message: string;
}> {
  try {
    const store = useStore.getState();
    const userEmail = (specificEmail || store.currentUser?.email || '').trim().toLowerCase();

    // Pull all shared workspace data (users, tasks, spaces, DMs)
    const url = '/api/sync';

    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      return { success: false, pulledCount: 0, message: `Server status: ${res.status}` };
    }

    const data = await res.json();
    const remoteData = data?.data || data || {};
    const remoteTasks: Task[] = remoteData?.tasks || [];
    const remoteSpaces = remoteData?.spaces || [];
    const remoteUsers = remoteData?.users || [];
    const remoteDMs = remoteData?.dmThreads || [];

    // 1. Sync All Team Members from Cloud (Single Source of Truth)
    if (Array.isArray(remoteUsers)) {
      store.setUsers(remoteUsers);

      // Verifikasi sesi akun saat ini: Jika akun tidak aktif / dihapus, logout otomatis
      if (store.currentUser && store.currentUser.email?.toLowerCase().trim() !== 'ravizein@itsecacademy.com') {
        const myEmail = store.currentUser.email.toLowerCase().trim();
        const matched = remoteUsers.find((u: any) => u.email && u.email.toLowerCase().trim() === myEmail);
        if (!matched || matched.status !== 'active') {
          console.warn('[Sync Security] Akun', myEmail, 'tidak aktif di cloud. Melakukan logout otomatis.');
          store.logout();
          if (typeof window !== 'undefined') {
            try {
              localStorage.removeItem('syncro_remembered_device_account');
            } catch (e) {}
            window.location.href = '/login';
          }
          return { success: false, pulledCount: 0, message: 'Sesi berakhir atau akun telah dicabut' };
        }
      }
    }

    // 2. Sync & Merge All Spaces from Cloud
    if (Array.isArray(remoteSpaces) && remoteSpaces.length > 0) {
      const spaceMap = new Map<string, any>();
      remoteSpaces.forEach((s) => {
        if (s && s.id) spaceMap.set(s.id, s);
      });
      store.spaces.forEach((s) => {
        if (s && s.id) spaceMap.set(s.id, s);
      });
      store.setSpaces(Array.from(spaceMap.values()));
    }

    // 3. Sync & Merge All Direct Message Threads from Cloud
    if (Array.isArray(remoteDMs) && remoteDMs.length > 0) {
      const dmMap = new Map<string, any>();
      remoteDMs.forEach((dm) => {
        if (dm && dm.id) dmMap.set(dm.id, dm);
      });
      store.dmThreads.forEach((dm) => {
        if (dm && dm.id) {
          const remote = dmMap.get(dm.id);
          if (remote) {
            const msgMap = new Map<string, any>();
            (remote.messages || []).forEach((m: any) => msgMap.set(m.id, m));
            (dm.messages || []).forEach((m: any) => msgMap.set(m.id, m));
            dmMap.set(dm.id, { ...remote, messages: Array.from(msgMap.values()) });
          } else {
            dmMap.set(dm.id, dm);
          }
        }
      });
      useStore.setState({ dmThreads: Array.from(dmMap.values()) });
    }

    // 4. Sync & Merge Shared Workspace Tasks
    if (Array.isArray(remoteTasks) && remoteTasks.length > 0) {
      const currentTasks = store.tasks;
      const taskMap = new Map<string, Task>();
      
      // Populate remote tasks first
      remoteTasks.forEach((t) => {
        if (t && t.id) {
          taskMap.set(t.id, t);
        }
      });

      // Preserve local updates without overwriting original creator's userEmail
      currentTasks.forEach((t) => {
        if (t && t.id) {
          const remote = taskMap.get(t.id);
          taskMap.set(t.id, remote ? { ...remote, ...t } : t);
        }
      });

      const mergedTasks = Array.from(taskMap.values());
      store.setTasks(mergedTasks);

      return {
        success: true,
        pulledCount: remoteTasks.length,
        message: `Berhasil memuat ${remoteTasks.length} tugas tim untuk workspace`,
      };
    }

    return { success: true, pulledCount: 0, message: 'Cloud data up to date' };
  } catch (err: any) {
    console.warn('[Syncro Auto-Pull] Pull failed, using local offline cache:', err);
    return { success: false, pulledCount: 0, message: err?.message || 'Gagal memuat dari cloud' };
  }
}

/**
 * Core Auto Cloud Sync Engine
 * Pushes all current tasks tagged with current user Gmail to Google Sheets backend automatically.
 */
export async function performAutoCloudSync(options: { force?: boolean } = {}): Promise<{
  success: boolean;
  message: string;
  count?: number;
}> {
  const store = useStore.getState();

  // If auto-sync is disabled and not forced, skip
  if (!store.isAutoSyncEnabled && !options.force) {
    return { success: false, message: 'Auto-sync dinonaktifkan' };
  }

  // Prevent overlapping concurrent sync executions
  if (isSyncInProgress) {
    hasPendingChanges = true;
    return { success: true, message: 'Sync sedang berlangsung' };
  }

  isSyncInProgress = true;
  hasPendingChanges = false;
  // Silent sync: tidak mengubah status ke 'syncing' agar UI tetap tenang dan realtime

  try {

    const currentUser = store.currentUser;
    const userEmail = (currentUser?.email || '').trim().toLowerCase();
    const userName = currentUser?.name || '';
    const userId = currentUser?.id || '';

    // Validasi Keamanan: Jangan sinkronisasi jika user tidak login atau belum aktif
    if (!store.isAuthenticated || !userEmail) {
      return { success: false, message: 'Tidak terotentikasi' };
    }
    if (userEmail !== 'ravizein@itsecacademy.com' && currentUser?.status !== 'active') {
      console.warn('[Sync Security] Akun belum berstatus aktif, sinkronisasi cloud dibatalkan.');
      return { success: false, message: 'Akun belum aktif' };
    }

    // Automatically tag all tasks with current user's Gmail if not already set
    const tasksWithUserEmail = store.tasks.map((task) => ({
      ...task,
      userEmail: task.userEmail || userEmail,
    }));

    // Bersihkan thread yang rekan bicaranya sudah dihapus atau tidak terdaftar di workspace
    const validUsers = store.users.filter(
      (u) => (u.status as string) !== 'deleted' && (u.status as string) !== 'rejected'
    );
    const validEmails = new Set(validUsers.map((u) => u.email?.toLowerCase().trim()).filter(Boolean));
    const validIds = new Set(validUsers.map((u) => u.id).filter(Boolean));

    const cleanDMThreads = store.dmThreads.filter((t) => {
      let partnerEmail = '';
      if (t.participantEmails && t.participantEmails.length > 0) {
        partnerEmail = (t.participantEmails.find((e: string) => e.toLowerCase().trim() !== userEmail) || '').toLowerCase().trim();
      }
      if (!partnerEmail && t.participantEmail && t.participantEmail.toLowerCase().trim() !== userEmail) {
        partnerEmail = t.participantEmail.toLowerCase().trim();
      }
      const partnerId = t.participantId !== userId ? t.participantId : '';

      if (validUsers.length > 0 && (partnerEmail || partnerId)) {
        const isPartnerValid = (partnerEmail && validEmails.has(partnerEmail)) || (partnerId && validIds.has(partnerId));
        if (!isPartnerValid) return false;
      }
      return true;
    });

    if (cleanDMThreads.length !== store.dmThreads.length) {
      useStore.setState({ dmThreads: cleanDMThreads });
    }

    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tasks: tasksWithUserEmail,
        users: store.users,
        dmThreads: cleanDMThreads,
        userEmail,
        userName,
        userId,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      throw new Error(`Koneksi cloud error: status ${res.status}`);
    }

    const json = await res.json();
    const formattedTime = getNowFormatted();
    const statusMsg = json?.localOnly
      ? 'Tersimpan lokal (offline)'
      : userEmail
      ? `Tersinkron otomatis dengan ${userEmail}`
      : 'Tersinkronisasi otomatis dengan Google Sheets';

    store.setCloudSyncStatus('synced', formattedTime, statusMsg);

    return {
      success: true,
      message: statusMsg,
      count: tasksWithUserEmail.length,
    };
  } catch (error: any) {
    console.warn('[Syncro Auto-Sync] Sync warning (tersimpan lokal):', error);
    const formattedTime = getNowFormatted();
    store.setCloudSyncStatus('error', formattedTime, error?.message || 'Koneksi cloud terputus');
    return {
      success: false,
      message: error?.message || 'Gagal tersambung ke backend Google Sheets',
    };
  } finally {
    isSyncInProgress = false;

    // If more changes arrived while sync was running, schedule another trailing sync
    if (hasPendingChanges) {
      hasPendingChanges = false;
      setTimeout(() => performAutoCloudSync(), 1000);
    }
  }
}

/**
 * Backward compatibility: fullCloudSync alias for manual button click
 */
export async function fullCloudSync(): Promise<{ success: boolean; message: string; count?: number }> {
  return performAutoCloudSync({ force: true });
}

/**
 * Granular single task sync to backend
 */
export async function syncSingleTaskToBackend(task: Task, action: 'create' | 'update' | 'delete' = 'create') {
  try {
    const currentUser = useStore.getState().currentUser;
    const taskPayload = {
      ...task,
      userEmail: task.userEmail || currentUser?.email || '',
    };

    if (action === 'delete') {
      await fetch(`/api/tasks?id=${task.id}`, { method: 'DELETE' });
    } else if (action === 'update') {
      await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskPayload),
      });
    } else {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskPayload),
      });
    }
  } catch (err) {
    console.warn('[Syncro Backend] Single task sync fallback:', err);
  } finally {
    // Also trigger debounced full state sync
    triggerDebouncedAutoSync(1000);
  }
}

/**
 * Fetch Google Calendar events for the current user from cloud backend
 */
export async function fetchGoogleCalendarEvents(specificEmail?: string): Promise<{
  success: boolean;
  events: CalendarEvent[];
  message: string;
}> {
  try {
    const store = useStore.getState();
    const userEmail = (specificEmail || store.currentUser?.email || '').trim().toLowerCase();
    const url = userEmail ? `/api/calendar?userEmail=${encodeURIComponent(userEmail)}` : '/api/calendar';

    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });

    if (!res.ok) {
      return { success: false, events: store.calendarEvents, message: `Status: ${res.status}` };
    }

    const data = await res.json();
    const remoteEvents: CalendarEvent[] = data?.events || [];

    if (Array.isArray(remoteEvents) && remoteEvents.length > 0) {
      // Merge with existing events
      const eventMap = new Map<string, CalendarEvent>();
      store.calendarEvents.forEach((ev) => eventMap.set(ev.id, ev));
      remoteEvents.forEach((ev) => eventMap.set(ev.id, ev));

      const merged = Array.from(eventMap.values());
      store.setCalendarEvents(merged);
      return { success: true, events: merged, message: `Tersinkron ${remoteEvents.length} agenda Google Calendar` };
    }

    return { success: true, events: store.calendarEvents, message: 'Google Calendar up to date' };
  } catch (err: any) {
    console.warn('[Syncro Calendar Sync] Warning:', err);
    return { success: false, events: useStore.getState().calendarEvents, message: err?.message || 'Gagal sinkron calendar' };
  }
}

/**
 * Create a new event on Google Calendar via cloud API
 */
export async function createCalendarEventOnCloud(event: CalendarEvent): Promise<{
  success: boolean;
  event: CalendarEvent;
}> {
  const store = useStore.getState();
  const currentUser = store.currentUser;
  const eventPayload = {
    ...event,
    userEmail: event.userEmail || currentUser?.email || '',
  };

  // Add to local state immediately
  store.addCalendarEvent(eventPayload);

  try {
    const res = await fetch('/api/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventPayload),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.event) {
        store.addCalendarEvent(data.event);
        return { success: true, event: data.event };
      }
    }
  } catch (err) {
    console.warn('[Syncro Calendar API] Event cloud push cached locally:', err);
  }

  return { success: true, event: eventPayload };
}
