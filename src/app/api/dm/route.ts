import { NextResponse } from 'next/server';
import {
  getCachedDMs,
  saveDMMessageInMemory,
  deleteCachedDMMessage,
  deleteCachedDMThread,
} from '@/lib/serverCache';

const APPS_SCRIPT_URL =
  process.env.NEXT_PUBLIC_APPS_SCRIPT_URL ||
  process.env.APPS_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbzLlZLTfhcsMK6uh28XFvVQCzLbopK9I2v9-xiNBEjQZw0-lL1oPeXvlKbpp04I1AtS/exec';

export async function GET() {
  try {
    const dmThreads = await getCachedDMs(true);
    return NextResponse.json({ status: 'success', dmThreads });
  } catch (error: any) {
    console.error('Error getting DM threads:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Failed to fetch DMs', dmThreads: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { threadId, message, participantEmail, participantName, participantId, participantEmails } = payload;

    if (!threadId || !message) {
      return NextResponse.json(
        { status: 'error', message: 'threadId and message are required' },
        { status: 400 }
      );
    }

    const updatedThread = saveDMMessageInMemory(threadId, message, {
      participantEmail,
      participantName,
      participantId,
      participantEmails,
    });

    // Wajib await ke Google Apps Script agar pesan tersimpan permanen di Google Sheets (DirectMessages)
    // dan terbaca oleh semua pengguna lain di semua instance server
    if (APPS_SCRIPT_URL) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'saveDM',
            payload: updatedThread,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (err: any) {
        console.warn('[Sync to Apps Script saveDM warning]', err?.message || err);
      }
    }

    return NextResponse.json({
      status: 'success',
      data: message,
      thread: updatedThread,
    });
  } catch (error: any) {
    console.error('Error saving DM message:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const payload = await req.json();
    const { threadId, messageId, deleteThread } = payload;

    if (!threadId) {
      return NextResponse.json(
        { status: 'error', message: 'threadId is required' },
        { status: 400 }
      );
    }

    if (deleteThread) {
      deleteCachedDMThread(threadId);

      if (APPS_SCRIPT_URL) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);
          await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'deleteDMThread',
              payload: { id: threadId },
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
        } catch (err: any) {
          console.warn('[Sync to Apps Script deleteDMThread warning]', err?.message || err);
        }
      }

      return NextResponse.json({
        status: 'success',
        deletedThreadId: threadId,
      });
    }

    if (!messageId) {
      return NextResponse.json(
        { status: 'error', message: 'messageId is required' },
        { status: 400 }
      );
    }

    const updatedThread = deleteCachedDMMessage(threadId, messageId);

    if (APPS_SCRIPT_URL && updatedThread) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'saveDM',
            payload: updatedThread,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (err: any) {
        console.warn('[Sync to Apps Script deleteDMMessage warning]', err?.message || err);
      }
    }

    return NextResponse.json({
      status: 'success',
      deletedMessageId: messageId,
      thread: updatedThread,
    });
  } catch (error: any) {
    console.error('Error deleting DM message:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Failed to delete message' },
      { status: 500 }
    );
  }
}
