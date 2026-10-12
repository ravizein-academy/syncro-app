import { NextResponse } from 'next/server';
import { userStatusOverrides } from '@/lib/userOverrides';
import {
  getCachedUsers,
  updateCachedUser,
  deleteCachedUser,
  broadcastRealtimeEvent,
} from '@/lib/serverCache';

const APPS_SCRIPT_URL =
  process.env.NEXT_PUBLIC_APPS_SCRIPT_URL ||
  process.env.APPS_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbzLlZLTfhcsMK6uh28XFvVQCzLbopK9I2v9-xiNBEjQZw0-lL1oPeXvlKbpp04I1AtS/exec';

export async function GET() {
  try {
    // Ambil user dari fast server-cache (< 5ms)
    const rawUsers = await getCachedUsers();

    // Format & validasi status pengguna
    const users = rawUsers
      .map((u: any) => {
        const email = (u.email || '').toLowerCase().trim();
        const isMasterAdmin = email === 'ravizein@itsecacademy.com';

        const userId =
          u.id && u.id !== ''
            ? u.id
            : u.sta && u.sta !== ''
            ? u.sta
            : isMasterAdmin
            ? 'user_1'
            : `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;

        if (isMasterAdmin) {
          return {
            ...u,
            id: 'user_1',
            role: 'admin',
            status: 'active',
          };
        }

        // 1. Cek apakah ada status persetujuan dari Admin di memory override
        const override = userStatusOverrides.get(email);
        if (override?.status === 'deleted') {
          return null;
        }
        if (override) {
          return {
            ...u,
            id: userId,
            role: override.role || u.role,
            department: override.department || u.department,
            status: override.status,
            requestedAt: u.requestedAt || 'Disetujui Admin',
          };
        }

        // 2. Jika user di Google Sheets sudah memiliki status 'active' atau 'inactive'
        if (u.status === 'active' || u.status === 'inactive') {
          return {
            ...u,
            id: userId,
            status: u.status,
            requestedAt: u.requestedAt || 'Menunggu persetujuan',
          };
        }

        // 3. Jika belum di-ACC, status tetap pending
        return {
          ...u,
          id: userId,
          status: 'pending',
          requestedAt: u.requestedAt || 'Menunggu persetujuan',
        };
      })
      .filter(Boolean);

    return NextResponse.json({ status: 'success', users });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Failed to fetch users', users: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action || 'createUser';
    const payload = body.payload !== undefined ? body.payload : body;

    const email = (payload?.email || '').toLowerCase().trim();

    if (action === 'updateUser') {
      if (email) {
        userStatusOverrides.set(email, {
          status: payload?.status || 'active',
          role: payload?.role,
          department: payload?.department,
          updatedAt: Date.now(),
        });

        // Update in-memory cache & broadcast SSE (< 5ms)
        updateCachedUser({
          ...payload,
          email,
          status: payload?.status || 'active',
        });
      }
      return NextResponse.json({ status: 'success', data: payload });
    }

    if (action === 'deleteUser') {
      if (email) {
        userStatusOverrides.set(email, {
          status: 'deleted',
          updatedAt: Date.now(),
        });

        // Hapus dari in-memory cache & broadcast SSE auto-kick (< 5ms)
        deleteCachedUser(email, payload?.id);
      }
      return NextResponse.json({ status: 'success', data: { success: true, deleted: email } });
    }

    // Default flow: createUser / createRecord
    if (action === 'createUser') {
      updateCachedUser(payload);
    }

    return NextResponse.json({ status: 'success', data: payload });
  } catch (error: any) {
    console.error('User action error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Action failed' },
      { status: 500 }
    );
  }
}
