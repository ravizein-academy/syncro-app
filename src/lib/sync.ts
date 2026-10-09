/**
 * Sync Service between Syncro Client and Google Apps Script / Next.js API Backend
 */

import { Task, useStore } from '@/store/useStore';

export interface SyncStatus {
  lastSyncTime: string | null;
  isSyncing: boolean;
  status: 'idle' | 'syncing' | 'success' | 'error';
  errorMessage?: string;
}

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
    console.warn('[Syncro Backend] Background task sync failed, cached locally:', err);
  }
}

export async function fullCloudSync(): Promise<{ success: boolean; message: string; count?: number }> {
  try {
    const store = useStore.getState();
    const tasks = store.tasks;

    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tasks,
        timestamp: new Date().toISOString()
      }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    return {
      success: true,
      message: 'Berhasil sinkronisasi dengan Google Sheets!',
      count: tasks.length
    };
  } catch (error: any) {
    console.error('[Syncro Cloud Sync] Error:', error);
    return {
      success: false,
      message: error.message || 'Gagal tersambung ke backend Google Sheets'
    };
  }
}
