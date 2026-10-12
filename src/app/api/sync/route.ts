import { NextResponse } from 'next/server';
import { userStatusOverrides } from '@/lib/userOverrides';
import {
  getCachedTasks,
  getCachedUsers,
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
    const [tasks, users] = await Promise.all([
      getCachedTasks(),
      getCachedUsers(),
    ]);

    return NextResponse.json({
      status: 'success',
      data: {
        tasks,
        users,
        spaces: [],
        dmThreads: [],
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
    if (userEmail && userEmail !== 'ravizein@itsecacademy.com') {
      const override = userStatusOverrides.get(userEmail);
      if (override?.status === 'deleted') {
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

    if (!APPS_SCRIPT_URL) {
      return NextResponse.json({ status: 'success', localOnly: true, timestamp: new Date().toISOString() });
    }

    // 2. Kirim ke Google Apps Script secara Asynchronous / Background (Non-blocking)
    // Supaya respons ke browser instan (< 15ms) tanpa menunggu Google Sheets 3-4 detik!
    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'syncAll',
        payload,
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
