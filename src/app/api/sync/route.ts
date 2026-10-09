import { NextResponse } from 'next/server';

const APPS_SCRIPT_URL =
  process.env.NEXT_PUBLIC_APPS_SCRIPT_URL ||
  process.env.APPS_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbysCD7FNRG0gzuu3LKrqCGjtv2GwmcgIvHEXkrsNbc5gDKrs3H8kJEMtKGd2k450wl3/exec';

export async function GET() {
  try {
    if (!APPS_SCRIPT_URL) {
      return NextResponse.json({ status: 'warning', message: 'Apps script URL unconfigured' });
    }

    const res = await fetch(`${APPS_SCRIPT_URL}?action=getAllData`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error(`Google Apps Script responded with ${res.status}`);
    }

    const json = await res.json();
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

    const result = await res.json();
    return NextResponse.json({ status: 'success', result, syncedAt: new Date().toISOString() });
  } catch (error: any) {
    console.error('Sync POST error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Failed to sync to backend' },
      { status: 500 }
    );
  }
}
