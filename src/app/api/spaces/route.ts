import { NextResponse } from 'next/server';
import {
  getCachedSpaces,
  upsertCachedSpace,
  deleteCachedSpace,
  getCachedUsers,
} from '@/lib/serverCache';

export async function GET() {
  try {
    const spaces = await getCachedSpaces();
    return NextResponse.json({ status: 'success', spaces });
  } catch (error: any) {
    console.error('Error fetching spaces:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Gagal memuat spaces', spaces: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    if (!payload || !payload.name) {
      return NextResponse.json(
        { status: 'error', message: 'Nama space diperlukan' },
        { status: 400 }
      );
    }

    const saved = upsertCachedSpace(payload);
    return NextResponse.json({ status: 'success', data: saved });
  } catch (error: any) {
    console.error('Error creating space:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Gagal membuat space' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const payload = await req.json();
    if (!payload || !payload.id || !payload.name) {
      return NextResponse.json(
        { status: 'error', message: 'ID dan nama space diperlukan' },
        { status: 400 }
      );
    }

    const updated = upsertCachedSpace(payload);
    return NextResponse.json({ status: 'success', data: updated });
  } catch (error: any) {
    console.error('Error updating space:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Gagal memperbarui space' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const userEmail = (searchParams.get('userEmail') || '').toLowerCase().trim();

    if (!id) {
      return NextResponse.json(
        { status: 'error', message: 'Parameter query ID diperlukan' },
        { status: 400 }
      );
    }

    // Validasi Keamanan: Hanya admin yang boleh menghapus space
    if (userEmail && userEmail !== 'ravizein@itsecacademy.com') {
      const users = await getCachedUsers();
      const requestingUser = users.find(
        (u: any) => u.email && u.email.toLowerCase().trim() === userEmail
      );

      if (!requestingUser || requestingUser.role !== 'admin') {
        return NextResponse.json(
          {
            status: 'error',
            unauthorized: true,
            message: 'Akses ditolak: Hanya admin yang berhak menghapus Space',
          },
          { status: 403 }
        );
      }
    }

    deleteCachedSpace(id, userEmail);
    return NextResponse.json({ status: 'success', deletedId: id });
  } catch (error: any) {
    console.error('Error deleting space:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Gagal menghapus space' },
      { status: 500 }
    );
  }
}
