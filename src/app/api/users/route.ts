import { NextResponse } from 'next/server';

const APPS_SCRIPT_URL =
  process.env.NEXT_PUBLIC_APPS_SCRIPT_URL ||
  process.env.APPS_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbzLlZLTfhcsMK6uh28XFvVQCzLbopK9I2v9-xiNBEjQZw0-lL1oPeXvlKbpp04I1AtS/exec';

export async function GET() {
  try {
    if (!APPS_SCRIPT_URL) {
      return NextResponse.json({ status: 'warning', users: [] });
    }

    const res = await fetch(`${APPS_SCRIPT_URL}?action=getUsers`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error(`Google Apps Script responded with ${res.status}`);
    }

    const json = await res.json();
    const rawUsers = json?.data?.users || json?.users || [];
    
    // Pastikan setiap user memiliki status yang valid (Admin = active, pemohon baru = pending)
    const users = rawUsers.map((u: any) => {
      const email = (u.email || '').toLowerCase().trim();
      const isMasterAdmin = email === 'ravizein@itsecacademy.com' || u.role === 'admin';

      if (isMasterAdmin) {
        return {
          ...u,
          role: 'admin',
          status: 'active'
        };
      }

      // Jika user sudah disetujui (active) atau dinonaktifkan (inactive), pertahankan
      // Jika status kosong atau 'pending', jadikan 'pending' agar muncul di Inbox Admin
      const status = u.status === 'active' ? 'active' : (u.status === 'inactive' ? 'inactive' : 'pending');
      return {
        ...u,
        status,
        requestedAt: u.requestedAt || 'Menunggu persetujuan'
      };
    });

    return NextResponse.json({ status: 'success', users });
  } catch (error: any) {
    console.error('Error fetching users from Apps Script:', error);
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

    if (!APPS_SCRIPT_URL) {
      return NextResponse.json({ status: 'success', data: payload, localOnly: true });
    }

    // Metode A (Failsafe): Untuk deleteUser & updateUser, kirim via GET parameter
    // agar kebal terhadap issue Google Apps Script HTTP 302 drop body
    if (action === 'deleteUser') {
      const deleteUrl = `${APPS_SCRIPT_URL}?action=deleteUser&id=${encodeURIComponent(payload?.id || '')}&email=${encodeURIComponent(payload?.email || '')}`;
      try {
        const getRes = await fetch(deleteUrl, { method: 'GET', headers: { 'Accept': 'application/json' }, cache: 'no-store' });
        if (getRes.ok) {
          const json = await getRes.json().catch(() => null);
          if (json && json.status === 'success') {
            return NextResponse.json({ status: 'success', data: json });
          }
        }
      } catch (e) {
        console.warn('GET deleteUser fallback failed:', e);
      }
    }

    if (action === 'updateUser') {
      const updateUrl = `${APPS_SCRIPT_URL}?action=updateUser&id=${encodeURIComponent(payload?.id || '')}&email=${encodeURIComponent(payload?.email || '')}&name=${encodeURIComponent(payload?.name || '')}&role=${encodeURIComponent(payload?.role || '')}&department=${encodeURIComponent(payload?.department || '')}&status=${encodeURIComponent(payload?.status || '')}`;
      try {
        const getRes = await fetch(updateUrl, { method: 'GET', headers: { 'Accept': 'application/json' }, cache: 'no-store' });
        if (getRes.ok) {
          const json = await getRes.json().catch(() => null);
          if (json && json.status === 'success') {
            return NextResponse.json({ status: 'success', data: json });
          }
        }
      } catch (e) {
        console.warn('GET updateUser fallback failed:', e);
      }
    }

    // Metode B: Kirim via POST
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        payload
      })
    });

    const result = await res.json().catch(() => ({ status: 'success' }));
    return NextResponse.json({ status: 'success', data: result });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
