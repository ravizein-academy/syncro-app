import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendTargetedNotification, sendBatchTargetedNotifications } from "@/lib/notifications";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET: Ambil notifikasi khusus untuk pengguna yang sedang login
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userEmail = session?.user?.email?.trim().toLowerCase();
    const sessionUserId = (session?.user as any)?.id;

    if (!userEmail && !sessionUserId) {
      return NextResponse.json({ error: "Sesi tidak valid / belum masuk" }, { status: 401 });
    }

    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("your-subdomain")) {
      return NextResponse.json([]);
    }

    // Cari User ID jika belum ada di session
    let targetUserId = sessionUserId;
    if (!targetUserId && userEmail) {
      const dbUser = await prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true },
      });
      targetUserId = dbUser?.id;
    }

    if (!targetUserId) {
      return NextResponse.json([]);
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(notifications, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error: any) {
    console.error("[Notifications GET] Error:", error);
    return NextResponse.json({ error: error.message || "Gagal mengambil notifikasi" }, { status: 500 });
  }
}

// POST: Buat notifikasi yang ditujukan ke orang tertentu (atau broadcast)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const actorEmail = session?.user?.email;
    const actorName = session?.user?.name || actorEmail?.split("@")[0] || "Sistem";

    const body = await request.json();
    const {
      userId,
      userEmail,
      targetUserIds,
      sendToAll,
      title,
      message,
      type = "custom",
      taskId,
      projectId,
    } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: "Judul dan isi pesan notifikasi wajib diisi." },
        { status: 400 }
      );
    }

    // Jika broadcast ke semua pengguna
    if (sendToAll) {
      const allUsers = await prisma.user.findMany({ select: { id: true } });
      const userIds = allUsers.map((u) => u.id);
      const results = await sendBatchTargetedNotifications(userIds, {
        actorName,
        title,
        message,
        type,
        taskId,
        projectId,
      });
      return NextResponse.json(
        { success: true, count: results.length, message: "Notifikasi broadcast berhasil dikirim." },
        { status: 201 }
      );
    }

    // Jika dikirim ke kumpulan user tertentu
    if (Array.isArray(targetUserIds) && targetUserIds.length > 0) {
      const results = await sendBatchTargetedNotifications(targetUserIds, {
        actorName,
        title,
        message,
        type,
        taskId,
        projectId,
      });
      return NextResponse.json(
        { success: true, count: results.length, message: "Notifikasi berhasil dikirim ke penerima target." },
        { status: 201 }
      );
    }

    // Jika dikirim ke satu orang target spesifik
    if (!userId && !userEmail) {
      return NextResponse.json(
        { error: "Penerima notifikasi (userId atau userEmail) wajib ditentukan." },
        { status: 400 }
      );
    }

    const created = await sendTargetedNotification({
      userId,
      userEmail,
      actorName,
      title,
      message,
      type,
      taskId,
      projectId,
    });

    if (!created) {
      return NextResponse.json(
        { error: "Gagal mengirim notifikasi ke penerima yang dituju." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        notification: created,
        message: "Notifikasi berhasil dikirim ke orang yang dituju.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[Notifications POST] Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal membuat notifikasi" },
      { status: 500 }
    );
  }
}

// PATCH: Tandai semua atau satu notifikasi sebagai sudah dibaca
export async function PATCH(request: NextRequest) {
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

    if (!targetUserId) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { id, markAllAsRead } = body;

    if (markAllAsRead) {
      await prisma.notification.updateMany({
        where: { userId: targetUserId, read: false },
        data: { read: true },
      });
      return NextResponse.json({ success: true, message: "Semua notifikasi ditandai sudah dibaca" });
    }

    if (id) {
      await prisma.notification.updateMany({
        where: { id, userId: targetUserId },
        data: { read: true },
      });
      return NextResponse.json({ success: true, message: "Notifikasi ditandai sudah dibaca" });
    }

    return NextResponse.json({ error: "Parameter tidak lengkap" }, { status: 400 });
  } catch (error: any) {
    console.error("[Notifications PATCH] Error:", error);
    return NextResponse.json({ error: error.message || "Gagal memperbarui notifikasi" }, { status: 500 });
  }
}

// DELETE: Hapus notifikasi tertentu atau hapus semua
export async function DELETE(request: NextRequest) {
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

    if (!targetUserId) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const clearAll = searchParams.get("clearAll") === "true";

    if (clearAll) {
      await prisma.notification.deleteMany({
        where: { userId: targetUserId },
      });
      return NextResponse.json({ success: true, message: "Seluruh notifikasi berhasil dibersihkan" });
    }

    if (id) {
      await prisma.notification.deleteMany({
        where: { id, userId: targetUserId },
      });
      return NextResponse.json({ success: true, message: "Notifikasi berhasil dihapus" });
    }

    return NextResponse.json({ error: "Parameter id atau clearAll diperlukan" }, { status: 400 });
  } catch (error: any) {
    console.error("[Notifications DELETE] Error:", error);
    return NextResponse.json({ error: error.message || "Gagal menghapus notifikasi" }, { status: 500 });
  }
}
