import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface RouteParams {
  params: {
    id: string;
  };
}

// PATCH: Tandai satu notifikasi sebagai sudah dibaca
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const userEmail = session?.user?.email?.trim().toLowerCase();
    const sessionUserId = (session?.user as any)?.id;

    if (!userEmail && !sessionUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let targetUserId: string | null = null;
    if (userEmail) {
      const dbUser = await prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true },
      });
      targetUserId = dbUser?.id || null;
    }
    if (!targetUserId && sessionUserId) {
      targetUserId = sessionUserId;
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "ID Notifikasi diperlukan" }, { status: 400 });
    }

    // Update notifikasi agar read = true via raw SQL non-transactional
    let updatedCount = 0;
    if (targetUserId) {
      updatedCount = await prisma.$executeRawUnsafe(
        `UPDATE "notifications" SET "read" = true WHERE "id" = $1 AND "userId" = $2`,
        id,
        targetUserId
      );
    }

    if (updatedCount === 0) {
      updatedCount = await prisma.$executeRawUnsafe(
        `UPDATE "notifications" SET "read" = true WHERE "id" = $1`,
        id
      );
    }

    return NextResponse.json({ success: true, count: updatedCount });
  } catch (error: any) {
    console.error("[Notification [id] PATCH] Error:", error);
    return NextResponse.json({ error: error.message || "Gagal memperbarui notifikasi" }, { status: 500 });
  }
}

// DELETE: Hapus satu notifikasi
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const userEmail = session?.user?.email?.trim().toLowerCase();
    const sessionUserId = (session?.user as any)?.id;

    if (!userEmail && !sessionUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let targetUserId: string | null = null;
    if (userEmail) {
      const dbUser = await prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true },
      });
      targetUserId = dbUser?.id || null;
    }
    if (!targetUserId && sessionUserId) {
      targetUserId = sessionUserId;
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "ID Notifikasi diperlukan" }, { status: 400 });
    }

    let deletedCount = 0;
    if (targetUserId) {
      deletedCount = await prisma.$executeRawUnsafe(
        `DELETE FROM "notifications" WHERE "id" = $1 AND "userId" = $2`,
        id,
        targetUserId
      );
    }

    if (deletedCount === 0) {
      deletedCount = await prisma.$executeRawUnsafe(
        `DELETE FROM "notifications" WHERE "id" = $1`,
        id
      );
    }

    return NextResponse.json({ success: true, count: deletedCount, message: "Notifikasi berhasil dihapus" });
  } catch (error: any) {
    console.error("[Notification [id] DELETE] Error:", error);
    return NextResponse.json({ error: error.message || "Gagal menghapus notifikasi" }, { status: 500 });
  }
}
