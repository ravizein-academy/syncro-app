import { prisma } from "@/lib/prisma";
import { sendNotificationEmail } from "@/lib/email";

export interface CreateNotificationParams {
  userId?: string;
  userEmail?: string;
  actorId?: string;
  actorName?: string;
  title: string;
  message: string;
  type?:
    | "task_create"
    | "task_update"
    | "task_delete"
    | "status"
    | "priority"
    | "assign"
    | "project"
    | "comment"
    | "custom"
    | "system";
  taskId?: string;
  projectId?: string;
}

/**
 * Mengirim notifikasi ke pengguna yang dituju (berdasarkan userId atau userEmail).
 * Menyimpan notifikasi di database Neon dan secara otomatis mensinkronkan ke email pengguna.
 */
export async function sendTargetedNotification(params: CreateNotificationParams) {
  try {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("your-subdomain")) {
      return null;
    }

    let targetUserId = params.userId;
    let targetUserEmail = params.userEmail?.trim().toLowerCase();
    let targetUserName = "";

    // Dapatkan data user (id, email, name) untuk pengiriman in-app dan email
    if (targetUserId) {
      const user = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, email: true, name: true },
      });
      if (user) {
        targetUserEmail = user.email;
        targetUserName = user.name || "";
      }
    } else if (targetUserEmail) {
      const user = await prisma.user.findUnique({
        where: { email: targetUserEmail },
        select: { id: true, email: true, name: true },
      });
      if (user) {
        targetUserId = user.id;
        targetUserName = user.name || "";
      }
    }

    if (!targetUserId) {
      console.warn("[Notifications] Target user ID tidak ditemukan, notifikasi dibatalkan.");
      return null;
    }

    // 1. Simpan notifikasi ke database Neon
    const notification = await prisma.notification.create({
      data: {
        userId: targetUserId,
        actorId: params.actorId || null,
        actorName: params.actorName || null,
        title: params.title.trim(),
        message: params.message.trim(),
        type: params.type || "info",
        taskId: params.taskId || null,
        projectId: params.projectId || null,
      },
    });

    // 2. Sinkronkan notifikasi ke email pengguna secara otomatis
    if (targetUserEmail) {
      sendNotificationEmail({
        to: targetUserEmail,
        recipientName: targetUserName || targetUserEmail.split("@")[0],
        actorName: params.actorName || "Sistem Syncro",
        title: params.title.trim(),
        message: params.message.trim(),
        type: params.type || "info",
        taskId: params.taskId,
        projectId: params.projectId,
      }).catch((emailErr) => {
        console.warn("[Notifications] Gagal mengirim email sinkronisasi:", emailErr);
      });
    }

    return notification;
  } catch (error) {
    console.error("[Notifications] Gagal menyimpan notifikasi target:", error);
    return null;
  }
}

/**
 * Mengirim notifikasi ke beberapa pengguna target sekaligus (in-app dan email).
 */
export async function sendBatchTargetedNotifications(
  userIds: string[],
  notificationData: Omit<CreateNotificationParams, "userId" | "userEmail">
) {
  try {
    if (!process.env.DATABASE_URL || !userIds || userIds.length === 0) {
      return [];
    }

    const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));

    // Dapatkan data email dan nama pengguna untuk pengiriman email
    const users = await prisma.user.findMany({
      where: { id: { in: uniqueUserIds } },
      select: { id: true, email: true, name: true },
    });

    // 1. Buat notifikasi di database untuk seluruh pengguna
    const promises = uniqueUserIds.map((userId) =>
      prisma.notification.create({
        data: {
          userId,
          actorId: notificationData.actorId || null,
          actorName: notificationData.actorName || null,
          title: notificationData.title.trim(),
          message: notificationData.message.trim(),
          type: notificationData.type || "info",
          taskId: notificationData.taskId || null,
          projectId: notificationData.projectId || null,
        },
      })
    );

    const createdNotifications = await Promise.all(promises);

    // 2. Sinkronkan ke email masing-masing pengguna
    for (const u of users) {
      if (u.email) {
        sendNotificationEmail({
          to: u.email,
          recipientName: u.name || u.email.split("@")[0],
          actorName: notificationData.actorName || "Sistem Syncro",
          title: notificationData.title.trim(),
          message: notificationData.message.trim(),
          type: notificationData.type || "info",
          taskId: notificationData.taskId,
          projectId: notificationData.projectId,
        }).catch((err) => {
          console.warn(`[Batch Email] Error sending notification to ${u.email}:`, err);
        });
      }
    }

    return createdNotifications;
  } catch (error) {
    console.error("[Notifications] Gagal membuat batch notifikasi:", error);
    return [];
  }
}
