import { EventEmitter } from 'events';

const APPS_SCRIPT_URL =
  process.env.NEXT_PUBLIC_APPS_SCRIPT_URL ||
  process.env.APPS_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbzLlZLTfhcsMK6uh28XFvVQCzLbopK9I2v9-xiNBEjQZw0-lL1oPeXvlKbpp04I1AtS/exec';

interface ServerCacheState {
  tasks: any[];
  tasksLastFetch: number;
  users: any[];
  usersLastFetch: number;
  dmThreads: any[];
  dmThreadsLastFetch: number;
  spaces: any[];
  spacesLastFetch: number;
  isTasksFetching: boolean;
  isUsersFetching: boolean;
  isSpacesFetching: boolean;
}

// Global singleton to persist in memory across Next.js invocations
const globalForServerCache = globalThis as unknown as {
  syncroServerCache?: ServerCacheState;
  syncroRealtimeEmitter?: EventEmitter;
};

if (!globalForServerCache.syncroServerCache) {
  globalForServerCache.syncroServerCache = {
    tasks: [],
    tasksLastFetch: 0,
    users: [],
    usersLastFetch: 0,
    dmThreads: [],
    dmThreadsLastFetch: 0,
    spaces: [],
    spacesLastFetch: 0,
    isTasksFetching: false,
    isUsersFetching: false,
    isSpacesFetching: false,
  };
}


if (!globalForServerCache.syncroRealtimeEmitter) {
  const emitter = new EventEmitter();
  emitter.setMaxListeners(200); // Support multiple active SSE client connections
  globalForServerCache.syncroRealtimeEmitter = emitter;
}

export const serverCache = globalForServerCache.syncroServerCache;
export const realtimeEmitter = globalForServerCache.syncroRealtimeEmitter;

const CACHE_TTL_MS = 20000; // 20 detik cache TTL (Stale-While-Revalidate)

/**
 * Broadcast event to all connected realtime clients
 */
export function broadcastRealtimeEvent(type: string, data: any) {
  try {
    realtimeEmitter.emit('realtime_event', {
      type,
      data,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.warn('[Realtime Emitter Error]', err);
  }
}

/**
 * Background async task to sync with Google Apps Script without blocking response
 */
function fireAndForget(promise: Promise<any>, description = 'Background Sync') {
  promise.catch((err) => {
    console.warn(`[${description} Warning]`, err?.message || err);
  });
}

// ==========================================
// USER CACHE & REALTIME OPERATIONS
// ==========================================

export async function getCachedUsers(forceFresh = false): Promise<any[]> {
  const now = Date.now();
  const isStale = now - serverCache.usersLastFetch > CACHE_TTL_MS;

  // Jika cache masih hangat dan data ada, langsung kembalikan dalam < 1ms
  if (!forceFresh && serverCache.users.length > 0 && !isStale) {
    return serverCache.users;
  }

  // Jika sedang fetching di background, kembalikan cache yang ada dulu
  if (serverCache.isUsersFetching && serverCache.users.length > 0) {
    return serverCache.users;
  }

  // Fetch dari Google Apps Script
  serverCache.isUsersFetching = true;
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=getUsers`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (res.ok) {
      const json = await res.json();
      const rawUsers = json?.data?.users || json?.users || [];
      if (Array.isArray(rawUsers)) {
        serverCache.users = rawUsers;
        serverCache.usersLastFetch = Date.now();
      }
    }
  } catch (err) {
    console.warn('[getCachedUsers] Apps Script fetch failed, using fallback memory:', err);
  } finally {
    serverCache.isUsersFetching = false;
  }

  return serverCache.users;
}

export function updateCachedUser(userData: any) {
  const email = (userData.email || '').toLowerCase().trim();
  if (!email) return;

  const idx = serverCache.users.findIndex(
    (u) => (u.email && u.email.toLowerCase().trim() === email) || (userData.id && u.id === userData.id)
  );

  if (idx !== -1) {
    serverCache.users[idx] = { ...serverCache.users[idx], ...userData };
  } else {
    serverCache.users.push(userData);
  }
  serverCache.usersLastFetch = Date.now();

  // 1. Broadcast seketika ke seluruh tab / user yang aktif
  broadcastRealtimeEvent('user_updated', userData);

  // 2. Simpan ke Google Apps Script di background (Non-blocking)
  const updateUrl = `${APPS_SCRIPT_URL}?action=updateUser&id=${encodeURIComponent(userData.id || '')}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(userData.name || '')}&role=${encodeURIComponent(userData.role || '')}&department=${encodeURIComponent(userData.department || '')}&status=${encodeURIComponent(userData.status || 'active')}`;
  fireAndForget(
    fetch(updateUrl, { method: 'GET', headers: { Accept: 'application/json' }, cache: 'no-store' }),
    `updateUser (${email})`
  );
}

export function deleteCachedUser(email: string, id?: string) {
  const cleanEmail = email.toLowerCase().trim();
  serverCache.users = serverCache.users.filter((u) => {
    if (cleanEmail && u.email && u.email.toLowerCase().trim() === cleanEmail) return false;
    if (id && id !== '' && u.id === id) return false;
    return true;
  });
  serverCache.usersLastFetch = Date.now();

  // 1. Hapus seluruh DM thread terkait user ini dari memory cache & broadcast
  if (serverCache.dmThreads) {
    const deletedThreadIds: string[] = [];
    serverCache.dmThreads = serverCache.dmThreads.filter((t) => {
      const isMatch =
        (cleanEmail && t.participantEmail?.toLowerCase().trim() === cleanEmail) ||
        (cleanEmail && t.participantEmails && t.participantEmails.some((e: string) => e.toLowerCase().trim() === cleanEmail)) ||
        (cleanEmail && t.id.includes(cleanEmail.replace(/[^a-zA-Z0-9]/g, '_'))) ||
        (id && (t.participantId === id || t.id.includes(id)));
      if (isMatch) {
        deletedThreadIds.push(t.id);
        return false;
      }
      return true;
    });
    serverCache.dmThreadsLastFetch = Date.now();
    deletedThreadIds.forEach((tId) => {
      broadcastRealtimeEvent('dm_thread_deleted', { threadId: tId });
    });
  }

  // 2. Broadcast seketika (akan memicu auto-kick di browser akun tersebut)
  broadcastRealtimeEvent('user_deleted', { email: cleanEmail, id });

  // 3. Simpan ke Google Apps Script di background
  const deleteUrl = `${APPS_SCRIPT_URL}?action=deleteUser&id=${encodeURIComponent(id || '')}&email=${encodeURIComponent(cleanEmail)}`;
  fireAndForget(
    fetch(deleteUrl, { method: 'GET', headers: { Accept: 'application/json' }, cache: 'no-store' }),
    `deleteUser (${cleanEmail})`
  );
}

// ==========================================
// TASK CACHE & REALTIME OPERATIONS
// ==========================================

export async function getCachedTasks(forceFresh = false): Promise<any[]> {
  const now = Date.now();
  const isStale = now - serverCache.tasksLastFetch > CACHE_TTL_MS;

  // Cache hit: langsung respons dalam 1ms
  if (!forceFresh && serverCache.tasks.length > 0 && !isStale) {
    return serverCache.tasks;
  }

  // Jika sedang fetch, kirimkan data yang ada dulu
  if (serverCache.isTasksFetching && serverCache.tasks.length > 0) {
    return serverCache.tasks;
  }

  serverCache.isTasksFetching = true;
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=getTasks`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (res.ok) {
      const json = await res.json();
      const tasks = json?.data?.tasks || json?.tasks || [];
      if (Array.isArray(tasks)) {
        serverCache.tasks = tasks;
        serverCache.tasksLastFetch = Date.now();
      }
    }
  } catch (err) {
    console.warn('[getCachedTasks] Apps Script fetch failed, using fallback memory:', err);
  } finally {
    serverCache.isTasksFetching = false;
  }

  return serverCache.tasks;
}

export function upsertCachedTask(task: any) {
  const id = task.id || ('task_' + Date.now());
  const formattedTask = {
    ...task,
    id,
    updatedAt: new Date().toISOString(),
  };

  const idx = serverCache.tasks.findIndex((t) => t.id === id);
  if (idx !== -1) {
    serverCache.tasks[idx] = { ...serverCache.tasks[idx], ...formattedTask };
    broadcastRealtimeEvent('task_updated', formattedTask);
  } else {
    serverCache.tasks.push(formattedTask);
    broadcastRealtimeEvent('task_created', formattedTask);
  }
  serverCache.tasksLastFetch = Date.now();

  // Sinkronkan ke Google Apps Script di background tanpa membuat frontend menunggu
  fireAndForget(
    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: idx !== -1 ? 'updateTask' : 'createTask',
        payload: formattedTask,
      }),
    }),
    `upsertTask (${id})`
  );

  return formattedTask;
}

export function deleteCachedTask(id: string) {
  serverCache.tasks = serverCache.tasks.filter((t) => t.id !== id);
  serverCache.tasksLastFetch = Date.now();

  broadcastRealtimeEvent('task_deleted', { id });

  // Hapus dari Google Apps Script di background
  fireAndForget(
    fetch(`${APPS_SCRIPT_URL}?action=deleteTask&id=${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    }),
    `deleteTask (${id})`
  );
}

// ==========================================
// DIRECT MESSAGE CACHE & REALTIME OPERATIONS
// ==========================================

export async function getCachedDMs(forceFresh = false): Promise<any[]> {
  const now = Date.now();
  const isStale = now - (serverCache.dmThreadsLastFetch || 0) > CACHE_TTL_MS;

  if (!forceFresh && (serverCache.dmThreads || []).length > 0 && !isStale) {
    return serverCache.dmThreads || [];
  }

  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=getDMs`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (res.ok) {
      const json = await res.json();
      const threads = json?.data?.dmThreads || json?.dmThreads || [];
      if (Array.isArray(threads)) {
        // Hanya pertahankan thread yang ada di database Google Sheets
        const activeEmails = new Set(
          (serverCache.users || [])
            .filter((u: any) => u.status !== 'deleted' && u.status !== 'rejected')
            .map((u: any) => (u.email || '').toLowerCase().trim())
            .filter(Boolean)
        );
        const activeIds = new Set(
          (serverCache.users || [])
            .filter((u: any) => u.status !== 'deleted' && u.status !== 'rejected')
            .map((u: any) => u.id)
            .filter(Boolean)
        );

        const sanitizedThreads = threads.filter((t: any) => {
          let pEmail = '';
          if (t.participantEmails && Array.isArray(t.participantEmails)) {
            pEmail = (t.participantEmails.find((e: string) => e.toLowerCase().trim() !== 'ravizein@itsecacademy.com') || '').toLowerCase().trim();
          }
          if (!pEmail && t.participantEmail) {
            pEmail = t.participantEmail.toLowerCase().trim();
          }
          const pId = t.participantId;

          if ((activeEmails.size > 0 || activeIds.size > 0) && (pEmail || pId)) {
            const isValid = (pEmail && activeEmails.has(pEmail)) || (pId && activeIds.has(pId));
            if (!isValid) return false;
          }
          return true;
        });

        serverCache.dmThreads = sanitizedThreads;
        serverCache.dmThreadsLastFetch = Date.now();
      }
    }
  } catch (err) {
    console.warn('[getCachedDMs] Apps Script fetch failed:', err);
  }

  return serverCache.dmThreads || [];
}

export function saveDMMessageInMemory(threadId: string, message: any, participantInfo?: any) {
  if (!serverCache.dmThreads) serverCache.dmThreads = [];

  let thread = serverCache.dmThreads.find((t) => t.id === threadId);
  if (!thread) {
    thread = {
      id: threadId,
      participantId: participantInfo?.participantId || '',
      participantName: participantInfo?.participantName || '',
      participantEmail: participantInfo?.participantEmail || '',
      participantEmails: participantInfo?.participantEmails || [],
      messages: [],
    };
    serverCache.dmThreads.push(thread);
  } else if (participantInfo?.participantEmails && (!thread.participantEmails || thread.participantEmails.length === 0)) {
    thread.participantEmails = participantInfo.participantEmails;
  }

  // Hindari duplikasi pesan berdasarkan id pesan
  const msgExists = (thread.messages || []).some((m: any) => m.id === message.id);
  if (!msgExists) {
    thread.messages = [...(thread.messages || []), message];
  }
  serverCache.dmThreadsLastFetch = Date.now();

  // 1. Broadcast seketika ke seluruh tab / user yang aktif (< 5ms)
  broadcastRealtimeEvent('dm_message', {
    threadId,
    message,
    participantEmail: participantInfo?.participantEmail,
    participantName: participantInfo?.participantName,
    participantEmails: thread.participantEmails || participantInfo?.participantEmails,
  });

  // 2. Simpan thread ke Google Apps Script di background
  fireAndForget(
    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'saveDM',
        payload: thread,
      }),
    }),
    `saveDM (${threadId})`
  );

  return thread;
}

export function deleteCachedDMMessage(threadId: string, messageId: string) {
  if (!serverCache.dmThreads) return null;
  const thread = serverCache.dmThreads.find((t) => t.id === threadId);
  if (!thread) return null;

  thread.messages = (thread.messages || []).filter((m: any) => m.id !== messageId);
  serverCache.dmThreadsLastFetch = Date.now();

  broadcastRealtimeEvent('dm_message_deleted', { threadId, messageId });

  fireAndForget(
    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'saveDM',
        payload: thread,
      }),
    }),
    `deleteDMMessage (${threadId}, ${messageId})`
  );

  return thread;
}

export function deleteCachedDMThread(threadId: string) {
  if (!serverCache.dmThreads) return false;
  serverCache.dmThreads = serverCache.dmThreads.filter((t) => t.id !== threadId);
  serverCache.dmThreadsLastFetch = Date.now();

  broadcastRealtimeEvent('dm_thread_deleted', { threadId });

  fireAndForget(
    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'deleteDMThread',
        payload: { id: threadId },
      }),
    }),
    `deleteDMThread (${threadId})`
  );

  return true;
}

// ==========================================
// SPACES CACHE & REALTIME OPERATIONS
// ==========================================

export async function getCachedSpaces(forceFresh = false): Promise<any[]> {
  const now = Date.now();
  const isStale = now - (serverCache.spacesLastFetch || 0) > CACHE_TTL_MS;

  // Cache hit
  if (!forceFresh && serverCache.spaces && serverCache.spaces.length > 0 && !isStale) {
    return serverCache.spaces;
  }

  if (serverCache.isSpacesFetching && serverCache.spaces && serverCache.spaces.length > 0) {
    return serverCache.spaces;
  }

  serverCache.isSpacesFetching = true;
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=getSpaces`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (res.ok) {
      const json = await res.json();
      const spaces = json?.data?.spaces || json?.spaces || [];
      if (Array.isArray(spaces)) {
        serverCache.spaces = spaces;
        serverCache.spacesLastFetch = Date.now();
      }
    }
  } catch (err) {
    console.warn('[getCachedSpaces] Apps Script fetch failed, using fallback memory:', err);
  } finally {
    serverCache.isSpacesFetching = false;
  }

  return serverCache.spaces || [];
}

export function upsertCachedSpace(space: any) {
  const id = space.id || (`sp_${Date.now()}`);
  const formatted = {
    ...space,
    id,
  };

  if (!serverCache.spaces) serverCache.spaces = [];

  const idx = serverCache.spaces.findIndex((s) => s.id === id);
  if (idx !== -1) {
    serverCache.spaces[idx] = { ...serverCache.spaces[idx], ...formatted };
    broadcastRealtimeEvent('space_updated', formatted);
  } else {
    serverCache.spaces.push(formatted);
    broadcastRealtimeEvent('space_created', formatted);
  }
  serverCache.spacesLastFetch = Date.now();

  // Kirim ke Google Apps Script di background
  fireAndForget(
    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updateSpace',
        payload: formatted,
      }),
    }),
    `upsertSpace (${id})`
  );

  return formatted;
}

export function deleteCachedSpace(id: string, userEmail?: string) {
  if (!serverCache.spaces) return false;
  serverCache.spaces = serverCache.spaces.filter((s) => s.id !== id);
  serverCache.spacesLastFetch = Date.now();

  // Lepaskan spaceId dari tasks di serverCache
  if (serverCache.tasks) {
    serverCache.tasks = serverCache.tasks.map((t) => (t.spaceId === id ? { ...t, spaceId: undefined } : t));
    serverCache.tasksLastFetch = Date.now();
  }

  broadcastRealtimeEvent('space_deleted', { id });

  fireAndForget(
    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'deleteSpace',
        payload: { id, userEmail },
      }),
    }),
    `deleteSpace (${id})`
  );

  return true;
}

