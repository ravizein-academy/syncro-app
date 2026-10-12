import { NextResponse } from 'next/server';
import { getCachedDMs, saveDMMessageInMemory } from '@/lib/serverCache';

export async function GET() {
  try {
    const dmThreads = await getCachedDMs();
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
