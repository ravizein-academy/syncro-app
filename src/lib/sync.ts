/**
 * Sync Service between Syncro Client and Google Apps Script / Next.js API Backend
 * Supports:
 * - Automatic background synchronization
 * - Debounced auto-save on task changes
 * - Initial cloud pull & merge on app load
 * - Offline-first caching with graceful recovery
 */

import { Task, useStore } from '@/store/useStore';

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
 * Pull latest data from Google Apps Script / Cloud Backend
 * Used on app initial load or when refreshing tab.
 */
export async function pullCloudData(): Promise<{ success: boolean; pulledCount: number; message: string }> {
  try {
    const res = await fetch('/api/sync', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      return { success: false, pulledCount: 0, message: `Server status: ${res.status}` };
    }

    const data = await res.json();
    const remoteTasks: Task[] = data?.data?.tasks || data?.tasks || [];

    if (Array.isArray(remoteTasks) && remoteTasks.length > 0) {
      const store = useStore.getState();
      const currentTasks = store.tasks;

      // Smart merge: Include all remote tasks while preserving unique local ones
      const taskMap = new Map<string, Task>();
      
      // Populate remote tasks first
      remoteTasks.forEach((t) => {
        if (t && t.id) taskMap.set(t.id, t);
      });

      // Overwrite/merge with current local tasks (local holds latest user interactions)
      currentTasks.forEach((t) => {
        if (t && t.id) taskMap.set(t.id, t);
      });

      const mergedTasks = Array.from(taskMap.values());
      store.setTasks(mergedTasks);

      return {
        success: true,
        pulledCount: remoteTasks.length,
        message: `Berhasil memuat ${remoteTasks.length} tugas dari cloud`,
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
 * Pushes all current tasks to Google Sheets backend automatically.
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
  store.setCloudSyncStatus('syncing');

  try {
    const tasks = store.tasks;

    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tasks,
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
      : 'Tersinkronisasi otomatis dengan Google Sheets';

    store.setCloudSyncStatus('synced', formattedTime, statusMsg);

    return {
      success: true,
      message: statusMsg,
      count: tasks.length,
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
    if (action === 'delete') {
      await fetch(`/api/tasks?id=${task.id}`, { method: 'DELETE' });
    } else if (action === 'update') {
      await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
    } else {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
    }
  } catch (err) {
    console.warn('[Syncro Backend] Single task sync fallback:', err);
  } finally {
    // Also trigger debounced full state sync
    triggerDebouncedAutoSync(1000);
  }
}
