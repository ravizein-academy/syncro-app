import { NextResponse } from 'next/server';

const APPS_SCRIPT_URL =
  process.env.NEXT_PUBLIC_APPS_SCRIPT_URL ||
  process.env.APPS_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbzLlZLTfhcsMK6uh28XFvVQCzLbopK9I2v9-xiNBEjQZw0-lL1oPeXvlKbpp04I1AtS/exec';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { email, name } = payload;

    if (!email) {
      return NextResponse.json({ status: 'error', message: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name || cleanEmail.split('@')[0]).trim();
    const timeStr = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB';

    if (!APPS_SCRIPT_URL) {
      return NextResponse.json({ status: 'warning', message: 'Apps Script URL not set' });
    }

    // 1. Simpan user dengan status 'pending' ke database Google Sheets
    const pendingUser = {
      id: `u_${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      role: 'member',
      department: 'Product & Tech',
      capacityHours: 40,
      avatar: cleanName.slice(0, 2).toUpperCase(),
      status: 'pending',
      requestedAt: timeStr
    };

    // 1 & 2. Jalankan simpan user dan kirim email notifikasi secara PARALEL (Promise.allSettled)
    // agar response cepat (1-2 detik) dan tidak membuat loading aplikasi lambat/lelet!
    const createUrl = `${APPS_SCRIPT_URL}?action=createUser&id=${encodeURIComponent(pendingUser.id)}&name=${encodeURIComponent(pendingUser.name)}&email=${encodeURIComponent(pendingUser.email)}&role=member&department=${encodeURIComponent(pendingUser.department)}&avatar=${encodeURIComponent(pendingUser.avatar)}&status=pending&requestedAt=${encodeURIComponent(timeStr)}`;
    const notifyGetUrl = `${APPS_SCRIPT_URL}?action=notifyAdminAccessRequest&email=${encodeURIComponent(cleanEmail)}&name=${encodeURIComponent(cleanName)}&time=${encodeURIComponent(timeStr)}`;

    await Promise.allSettled([
      fetch(createUrl, { method: 'GET', headers: { Accept: 'application/json' }, cache: 'no-store' }),
      fetch(notifyGetUrl, { method: 'GET', headers: { Accept: 'application/json' }, cache: 'no-store' }),
    ]);

    return NextResponse.json({
      status: 'success',
      message: 'Permintaan akses berhasil dikirim ke Admin.',
      pendingUser
    });
  } catch (error: any) {
    console.error('Error requesting access:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Failed to submit access request' },
      { status: 500 }
    );
  }
}
