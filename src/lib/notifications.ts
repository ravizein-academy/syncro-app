import { prisma } from "@/lib/prisma";

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
 * Jika userId tidak diberikan, akan mencari pengguna berdasarkan userEmail.
 */
export async function sendTargetedNotification(params: CreateNotificationParams) {
  try {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("your-subdomain")) {
      return null;
    }

    let targetUserId = params.userId;

    // Jika targetUserId belum ada, cari berdasarkan userEmail
    if (!targetUserId && params.userEmail) {
      const foundUser = await prisma.user.findUnique({
        where: { email: params.userEmail.trim().toLowerCase() },
        select: { id: true },
      });
      if (foundUser) {
        targetUserId = foundUser.id;
      }
    }

    if (!targetUserId) {
      console.warn("[Notifications] Target user ID tidak ditemukan, notifikasi dibatalkan.");
      return null;
    }

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

    return notification;
  } catch (error) {
    console.error("[Notifications] Gagal menyimpan notifikasi target:", error);
    return null;
  }
}

/**
 * Mengirim notifikasi ke beberapa pengguna target sekaligus.
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

    return await Promise.all(promises);
  } catch (error) {
    console.error("[Notifications] Gagal membuat batch notifikasi:", error);
    return [];
  }
}
