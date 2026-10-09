import { NextResponse } from 'next/server';

const APPS_SCRIPT_URL =
  process.env.NEXT_PUBLIC_APPS_SCRIPT_URL ||
  process.env.APPS_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbysCD7FNRG0gzuu3LKrqCGjtv2GwmcgIvHEXkrsNbc5gDKrs3H8kJEMtKGd2k450wl3/exec';

export async function GET() {
  try {
    if (!APPS_SCRIPT_URL) {
      return NextResponse.json({ status: 'warning', message: 'Apps Script URL not set', tasks: [] });
    }

    const res = await fetch(`${APPS_SCRIPT_URL}?action=getTasks`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error(`Google Apps Script responded with ${res.status}`);
    }

    const json = await res.json();
    const tasks = json?.data?.tasks || json?.tasks || [];
    return NextResponse.json({ status: 'success', tasks });
  } catch (error: any) {
    console.error('Error fetching tasks from Google Apps Script:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Failed to fetch tasks', tasks: [] },
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
        action: 'createTask',
        payload
      })
    });

    const result = await res.json();
    return NextResponse.json({ status: 'success', data: result });
  } catch (error: any) {
    console.error('Error saving task to Google Apps Script:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Failed to save task' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const payload = await req.json();

    if (!APPS_SCRIPT_URL) {
      return NextResponse.json({ status: 'success', data: payload, localOnly: true });
    }

    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updateTask',
        payload
      })
    });

    const result = await res.json();
    return NextResponse.json({ status: 'success', data: result });
  } catch (error: any) {
    console.error('Error updating task in Google Apps Script:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Failed to update task' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ status: 'error', message: 'ID query param is required' }, { status: 400 });
    }

    if (!APPS_SCRIPT_URL) {
      return NextResponse.json({ status: 'success', id, localOnly: true });
    }

    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'deleteTask',
        payload: { id }
      })
    });

    const result = await res.json();
    return NextResponse.json({ status: 'success', data: result });
  } catch (error: any) {
    console.error('Error deleting task in Google Apps Script:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Failed to delete task' },
      { status: 500 }
    );
  }
}
