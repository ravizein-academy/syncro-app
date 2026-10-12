import { NextResponse } from 'next/server';
import { userStatusOverrides } from '@/lib/userOverrides';
import {
  getCachedTasks,
  getCachedUsers,
  getCachedDMs,
  serverCache,
  broadcastRealtimeEvent,
} from '@/lib/serverCache';

const APPS_SCRIPT_URL =
  process.env.NEXT_PUBLIC_APPS_SCRIPT_URL ||
  process.env.APPS_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbzLlZLTfhcsMK6uh28XFvVQCzLbopK9I2v9-xiNBEjQZw0-lL1oPeXvlKbpp04I1AtS/exec';

export async function GET(req: Request) {
  try {
    // Ambil data instan dari fast memory cache (< 5ms)
    const [tasks, users, dmThreads] = await Promise.all([
      getCachedTasks(),
      getCachedUsers(),
      getCachedDMs(),
    ]);

    return NextResponse.json({
      status: 'success',
      data: {
        tasks,
        users,
        spaces: [],
        dmThreads,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: error.message || 'Sync fetch failed' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const userEmail = (payload?.userEmail || '').toLowerCase().trim();

    // Validasi Keamanan: Jika user telah dihapus atau ditandai nonaktif, tolak sinkronisasi
    const cachedUsers = await getCachedUsers();
    if (userEmail && userEmail !== 'ravizein@itsecacademy.com') {
      const override = userStatusOverrides.get(userEmail);
      const isKnownUser = cachedUsers.some(
        (u: any) => u.email && u.email.toLowerCase().trim() === userEmail
      );
      if (override?.status === 'deleted' || (cachedUsers.length > 0 && !isKnownUser)) {
        return NextResponse.json(
          {
            status: 'error',
            unauthorized: true,
            message: 'Akun telah dihapus dan tidak diizinkan mengakses data.',
          },
          { status: 403 }
        );
      }
    }

    // 1. Perbarui in-memory cache secara instan (< 1ms)
    if (payload?.tasks && Array.isArray(payload.tasks)) {
      serverCache.tasks = payload.tasks;
      serverCache.tasksLastFetch = Date.now();
    }

    // Filter DM threads agar tidak menyertakan user yang sudah dihapus/tidak terdaftar
    let sanitizedDMs = payload?.dmThreads;
    if (Array.isArray(sanitizedDMs) && cachedUsers.length > 0) {
      const activeEmails = new Set(
        cachedUsers
          .filter((u: any) => u.status !== 'deleted' && u.status !== 'rejected')
          .map((u: any) => (u.email || '').toLowerCase().trim())
          .filter(Boolean)
      );
      const activeIds = new Set(
        cachedUsers
          .filter((u: any) => u.status !== 'deleted' && u.status !== 'rejected')
          .map((u: any) => u.id)
          .filter(Boolean)
      );

      sanitizedDMs = sanitizedDMs.filter((t: any) => {
        let pEmail = '';
        if (t.participantEmails && Array.isArray(t.participantEmails)) {
          pEmail = (t.participantEmails.find((e: string) => e.toLowerCase().trim() !== userEmail) || '').toLowerCase().trim();
        }
        if (!pEmail && t.participantEmail && t.participantEmail.toLowerCase().trim() !== userEmail) {
          pEmail = t.participantEmail.toLowerCase().trim();
        }
        const pId = t.participantId;

        if (pEmail || pId) {
          const isValid = (pEmail && activeEmails.has(pEmail)) || (pId && activeIds.has(pId));
          if (!isValid) return false;
        }
        return true;
      });
    }

    if (Array.isArray(sanitizedDMs)) {
      serverCache.dmThreads = sanitizedDMs;
      serverCache.dmThreadsLastFetch = Date.now();
    }

    if (!APPS_SCRIPT_URL) {
      return NextResponse.json({ status: 'success', localOnly: true, timestamp: new Date().toISOString() });
    }

    // 2. Kirim payload yang sudah disanitasi ke Google Apps Script di background
    const sanitizedPayload = {
      ...payload,
      dmThreads: sanitizedDMs,
    };

    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'syncAll',
        payload: sanitizedPayload,
      }),
    }).catch((err) => {
      console.warn('[Background syncAll warning]', err?.message || err);
    });

    return NextResponse.json({
      status: 'success',
      message: 'Tersinkronisasi realtime',
      syncedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Sync POST error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Failed to sync to backend' },
      { status: 500 }
    );
  }
}
