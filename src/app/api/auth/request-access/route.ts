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

    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'createUser',
        payload: pendingUser
      })
    }).catch((err) => console.warn('Failed to persist pending user in Google Sheets:', err));

    // 2. Kirim notifikasi email ke Admin (Ravi Zein)
    // Metode A: GET Query Parameter (Paling reliabel untuk Apps Script Web App tanpa isu drop body 302)
    const notifyGetUrl = `${APPS_SCRIPT_URL}?action=notifyAdminAccessRequest&email=${encodeURIComponent(cleanEmail)}&name=${encodeURIComponent(cleanName)}&time=${encodeURIComponent(timeStr)}`;
    
    let notifyResult: any = { status: 'sent' };
    try {
      const getRes = await fetch(notifyGetUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });
      if (getRes.ok) {
        notifyResult = await getRes.json().catch(() => ({ status: 'sent' }));
      }
    } catch (e) {
      console.warn('GET notify to Apps Script error, fallback to POST:', e);
    }

    // Metode B: POST Payload sebagai cadangan
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'notifyAdminAccessRequest',
          payload: {
            email: cleanEmail,
            name: cleanName,
            time: timeStr
          }
        })
      });
    } catch (err) {
      console.warn('POST notify fallback error:', err);
    }

    return NextResponse.json({
      status: 'success',
      message: 'Permintaan akses berhasil dikirim ke Admin.',
      pendingUser,
      data: notifyResult
    });
  } catch (error: any) {
    console.error('Error requesting access:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Failed to submit access request' },
      { status: 500 }
    );
  }
}
