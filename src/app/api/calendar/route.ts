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
      return NextResponse.json({ status: 'warning', message: 'Apps Script unconfigured', events: [] });
    }

    const scriptUrl = userEmail
      ? `${APPS_SCRIPT_URL}?action=getCalendarEvents&userEmail=${encodeURIComponent(userEmail)}`
      : `${APPS_SCRIPT_URL}?action=getCalendarEvents`;

    const res = await fetch(scriptUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });

    if (!res.ok) {
      return NextResponse.json({
        status: 'warning',
        message: `Google Calendar Apps Script status ${res.status}`,
        events: []
      });
    }

    const text = await res.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      return NextResponse.json({
        status: 'warning',
        message: 'Google Apps Script mengembalikan format non-JSON. Menggunakan kalender lokal.',
        events: []
      });
    }

    const events = json?.events || json?.data?.events || json?.data || [];
    return NextResponse.json({ status: 'success', events: Array.isArray(events) ? events : [] });
  } catch (error: any) {
    console.warn('[Calendar API] GET warning:', error);
    return NextResponse.json({ status: 'error', message: error?.message, events: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    if (!APPS_SCRIPT_URL) {
      return NextResponse.json({
        status: 'success',
        event: {
          id: `gcal_${Date.now()}`,
          ...payload,
          isGoogleEvent: true
        },
        localOnly: true
      });
    }

    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'createCalendarEvent',
        payload
      })
    });

    const text = await res.text();
    let result: any;
    try {
      result = JSON.parse(text);
    } catch {
      return NextResponse.json({
        status: 'success',
        event: {
          id: `gcal_${Date.now()}`,
          ...payload,
          isGoogleEvent: true
        },
        localOnly: true
      });
    }

    return NextResponse.json({ status: 'success', event: result?.data || result });
  } catch (error: any) {
    console.error('[Calendar API] POST error:', error);
    return NextResponse.json({ status: 'error', message: error?.message }, { status: 500 });
  }
}
