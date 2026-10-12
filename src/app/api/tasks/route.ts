import { NextResponse } from 'next/server';
import {
  getCachedTasks,
  upsertCachedTask,
  deleteCachedTask,
} from '@/lib/serverCache';

export async function GET() {
  try {
    const tasks = await getCachedTasks();
    return NextResponse.json({ status: 'success', tasks });
  } catch (error: any) {
    console.error('Error getting tasks:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Failed to fetch tasks', tasks: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const saved = upsertCachedTask(payload);
    return NextResponse.json({ status: 'success', data: saved });
  } catch (error: any) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Failed to save task' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const payload = await req.json();
    const updated = upsertCachedTask(payload);
    return NextResponse.json({ status: 'success', data: updated });
  } catch (error: any) {
    console.error('Error updating task:', error);
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

    deleteCachedTask(id);
    return NextResponse.json({ status: 'success', deletedId: id });
  } catch (error: any) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Failed to delete task' },
      { status: 500 }
    );
  }
}
