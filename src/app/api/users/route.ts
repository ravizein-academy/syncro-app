import { NextResponse } from 'next/server';

const APPS_SCRIPT_URL =
  process.env.NEXT_PUBLIC_APPS_SCRIPT_URL ||
  process.env.APPS_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbysCD7FNRG0gzuu3LKrqCGjtv2GwmcgIvHEXkrsNbc5gDKrs3H8kJEMtKGd2k450wl3/exec';

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
    const users = json?.data?.users || json?.users || [];
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
    const payload = await req.json();

    if (!APPS_SCRIPT_URL) {
      return NextResponse.json({ status: 'success', data: payload, localOnly: true });
    }

    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'createUser',
        payload
      })
    });

    const result = await res.json();
    return NextResponse.json({ status: 'success', data: result });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
