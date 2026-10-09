import { NextResponse } from 'next/server';

const APPS_SCRIPT_URL =
  process.env.NEXT_PUBLIC_APPS_SCRIPT_URL ||
  process.env.APPS_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbysCD7FNRG0gzuu3LKrqCGjtv2GwmcgIvHEXkrsNbc5gDKrs3H8kJEMtKGd2k450wl3/exec';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { email, name, time, device } = payload;

    if (!email) {
      return NextResponse.json({ status: 'error', message: 'Email is required' }, { status: 400 });
    }

    if (!APPS_SCRIPT_URL) {
      return NextResponse.json({ status: 'warning', message: 'Apps Script URL not set' });
    }

    // Call Google Apps Script backend to dispatch security notification email
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'notifyLogin',
        payload: {
          email,
          name,
          time: time || new Date().toISOString(),
          device: device || 'Web Browser'
        }
      })
    });

    const result = await res.json().catch(() => ({ status: 'sent' }));
    return NextResponse.json({ status: 'success', data: result });
  } catch (error: any) {
    console.error('Error sending login notification email:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Failed to send login notification' },
      { status: 500 }
    );
  }
}
