import { NextResponse } from 'next/server';

const APPS_SCRIPT_URL =
  process.env.NEXT_PUBLIC_APPS_SCRIPT_URL ||
  process.env.APPS_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbzLlZLTfhcsMK6uh28XFvVQCzLbopK9I2v9-xiNBEjQZw0-lL1oPeXvlKbpp04I1AtS/exec';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get('userEmail') || 'ravizein@itsecacademy.com';

    if (!APPS_SCRIPT_URL) {
      return NextResponse.json({ status: 'warning', message: 'Apps Script unconfigured', events: [] });
    }

    const scriptUrl = `${APPS_SCRIPT_URL}?action=getCalendarEvents&userEmail=${encodeURIComponent(userEmail)}`;

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

    const rawEvents: any[] = json?.events || json?.data?.events || json?.data || [];
    const cleanUser = userEmail.toLowerCase().trim();

    // Filter ketat agar akun ravizein@gmail.com tidak me-mirror agenda kantor ravizein@itsecacademy.com
    const events = (Array.isArray(rawEvents) ? rawEvents : []).filter((ev: any) => {
      if (!ev) return false;
      const guests = (ev.guests || '').toLowerCase();
      const evMail = (ev.userEmail || '').toLowerCase().trim();

      if (cleanUser === 'ravizein@gmail.com') {
        // HANYA lolos jika ravizein@gmail.com diundang (guests) atau agenda pribadi ravizein@gmail.com
        const isInvited = guests.includes('ravizein@gmail.com');
        const isAcademyEvent =
          guests.includes('ravizein@itsecacademy.com') ||
          guests.includes('@itsecasia.com') ||
          guests.includes('@itsec.sg') ||
          (ev.title || '').toLowerCase().includes('[classroom academy booking]') ||
          (ev.location || '').toLowerCase().includes('itsec');

        if (isAcademyEvent && !isInvited) {
          return false;
        }

        return isInvited || (evMail === 'ravizein@gmail.com' && !isAcademyEvent);
      }

      if (cleanUser === 'ravizein@itsecacademy.com') {
        // Akun Academy menampilkan agenda workspace ITSEC Academy dan undangan untuknya
        return (
          evMail === 'ravizein@itsecacademy.com' ||
          guests.includes('ravizein@itsecacademy.com') ||
          !guests.includes('ravizein@gmail.com')
        );
      }

      // Akun umum
      return evMail === cleanUser || guests.includes(cleanUser);
    });

    return NextResponse.json({ status: 'success', events });
  } catch (error: any) {
    console.warn('[Calendar API] GET warning:', error);
    return NextResponse.json({ status: 'error', message: error?.message, events: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const payload = {
      ...body,
      userEmail: body.userEmail || 'ravizein@itsecacademy.com'
    };

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
          ...payload,
          id: payload.id || `gcal_${Date.now()}`,
          color: payload.color || "bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30",
          isGoogleEvent: true
        },
        localOnly: true
      });
    }

    const serverData = result?.data || result || {};
    const hasError = serverData.success === false || serverData.status === 'error';

    const mergedEvent = {
      ...payload,
      id: (!hasError && serverData.id) ? serverData.id : (payload.id || `gcal_${Date.now()}`),
      title: serverData.title || payload.title,
      dateStr: serverData.dateStr || payload.dateStr,
      startHour: serverData.startHour || payload.startHour,
      endHour: serverData.endHour || payload.endHour,
      timeRange: serverData.timeRange || payload.timeRange,
      color: payload.color || serverData.color || "bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30",
      meetUrl: payload.meetUrl || serverData.meetUrl || serverData.meetLink,
      location: payload.location || serverData.location,
      description: payload.description || serverData.description,
      guests: payload.guests || serverData.guests,
      userEmail: payload.userEmail || serverData.userEmail,
      isGoogleEvent: true
    };

    return NextResponse.json({ 
      status: 'success', 
      event: mergedEvent,
      cloudSaved: !hasError
    });
  } catch (error: any) {
    console.error('[Calendar API] POST error:', error);
    return NextResponse.json({ 
      status: 'success', 
      event: {
        id: `gcal_${Date.now()}`,
        isGoogleEvent: true
      },
      localOnly: true 
    });
  }
}
