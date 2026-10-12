import { NextResponse } from 'next/server';

const APPS_SCRIPT_URL =
  process.env.NEXT_PUBLIC_APPS_SCRIPT_URL ||
  process.env.APPS_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbzLlZLTfhcsMK6uh28XFvVQCzLbopK9I2v9-xiNBEjQZw0-lL1oPeXvlKbpp04I1AtS/exec';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get('userEmail') || '';

    if (!APPS_SCRIPT_URL) {
      return NextResponse.json({ status: 'warning', message: 'Apps script URL unconfigured' });
    }

    const scriptUrl = userEmail
      ? `${APPS_SCRIPT_URL}?action=getAllData&userEmail=${encodeURIComponent(userEmail)}`
      : `${APPS_SCRIPT_URL}?action=getAllData`;

    const res = await fetch(scriptUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });

    if (!res.ok) {
      return NextResponse.json({
        status: 'warning',
        message: `Google Apps Script status ${res.status}`,
        tasks: []
      });
    }

    const text = await res.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      return NextResponse.json({
        status: 'warning',
        message: 'Google Apps Script endpoint mengembalikan respon non-JSON. Menggunakan cache lokal.',
        tasks: []
      });
    }

    return NextResponse.json({ status: 'success', data: json.data || json });
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

    if (!APPS_SCRIPT_URL) {
      return NextResponse.json({ status: 'success', localOnly: true, timestamp: new Date().toISOString() });
    }

    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'syncAll',
        payload
      })
    });

    const text = await res.text();
    let result: any;
    try {
      result = JSON.parse(text);
    } catch {
      // Endpoint returned HTML (e.g. Google Apps Script requires redeploy/authorisation)
      return NextResponse.json({
        status: 'success',
        localOnly: true,
        message: 'Data tersimpan lokal. Menunggu Google Apps Script Web App siap.',
        syncedAt: new Date().toISOString()
      });
    }

    return NextResponse.json({ status: 'success', result, syncedAt: new Date().toISOString() });
  } catch (error: any) {
    console.error('Sync POST error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Failed to sync to backend' },
      { status: 500 }
    );
  }
}
