import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const runtime = "edge";

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

    let targetUserId = sessionUserId;
    if (!targetUserId && userEmail) {
      const dbUser = await prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true },
      });
      targetUserId = dbUser?.id;
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "ID Notifikasi diperlukan" }, { status: 400 });
    }

    const updated = await prisma.notification.updateMany({
      where: {
        id,
        ...(targetUserId ? { userId: targetUserId } : {}),
      },
      data: { read: true },
    });

    return NextResponse.json({ success: true, count: updated.count });
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

    let targetUserId = sessionUserId;
    if (!targetUserId && userEmail) {
      const dbUser = await prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true },
      });
      targetUserId = dbUser?.id;
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "ID Notifikasi diperlukan" }, { status: 400 });
    }

    await prisma.notification.deleteMany({
      where: {
        id,
        ...(targetUserId ? { userId: targetUserId } : {}),
      },
    });

    return NextResponse.json({ success: true, message: "Notifikasi berhasil dihapus" });
  } catch (error: any) {
    console.error("[Notification [id] DELETE] Error:", error);
    return NextResponse.json({ error: error.message || "Gagal menghapus notifikasi" }, { status: 500 });
  }
}
