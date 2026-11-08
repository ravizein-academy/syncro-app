import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockTasks } from "@/lib/mock-data";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const status = searchParams.get("status");

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("your-subdomain")) {
      const where: any = {};
      if (projectId) where.projectId = projectId;
      if (status) where.status = status;

      const tasks = await prisma.task.findMany({
        where,
        include: {
          project: true,
          assignee: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(tasks, {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
    }
  } catch (err) {
    console.warn("[Tasks API] Falling back to memory store:", err);
  }

  // Fallback demo tasks
  let filtered = [...mockTasks];
  if (projectId) filtered = filtered.filter((t) => t.projectId === projectId);
  if (status) filtered = filtered.filter((t) => t.status === status);

  return NextResponse.json(filtered, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, status = "TODO", priority = "MEDIUM", projectId, assigneeId, mediaUrls = [], dueDate } = body;

    if (!title || !projectId) {
      return NextResponse.json(
        { error: "Title and projectId are required" },
        { status: 400 }
      );
    }

    try {
      if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("your-subdomain")) {
        // Pastikan assigneeId valid di database untuk menghindari error foreign key
        let validAssigneeId: string | null = null;
        if (assigneeId) {
          const user = await prisma.user.findUnique({ where: { id: assigneeId } });
          if (user) {
            validAssigneeId = user.id;
          }
        }

        // Pastikan projectId valid di database
        let validProjectId = projectId;
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) {
          const firstProject = await prisma.project.findFirst();
          if (firstProject) {
            validProjectId = firstProject.id;
          }
        }

        const created = await prisma.task.create({
          data: {
            title,
            description,
            status,
            priority,
            projectId: validProjectId,
            assigneeId: validAssigneeId,
            mediaUrls,
            dueDate: dueDate ? new Date(dueDate) : null,
          },
        });

        const newTask = await prisma.task.findUnique({
          where: { id: created.id },
          include: {
            project: true,
            assignee: true,
          },
        });

        // Buat notifikasi otomatis di database jika tugas ditugaskan ke PIC tertentu
        if (validAssigneeId) {
          try {
            await prisma.notification.create({
              data: {
                userId: validAssigneeId,
                title: "Tugas Baru Ditugaskan kepada Anda",
                message: `Anda telah ditugaskan pada tugas "${title}".`,
                type: "assign",
                taskId: created.id,
                projectId: validProjectId,
              },
            });
          } catch (notifErr) {
            console.warn("[Tasks POST] Auto notification error:", notifErr);
          }
        }

        return NextResponse.json(newTask || created, { status: 201 });
      }
    } catch (err) {
      console.error("[Tasks API POST] Neon DB error:", err);
    }

    const createdTask = {
      id: `task-${Date.now()}`,
      title,
      description: description || "",
      status,
      priority,
      projectId,
      assigneeId: assigneeId || null,
      mediaUrls,
      dueDate: dueDate || null,
      project: { id: projectId, name: "Active Project", color: "#6366f1" },
      assignee: assigneeId
        ? {
            id: assigneeId,
            name: "Colleague",
            email: "colleague@itsecacademy.com",
            image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Assignee",
          }
        : null,
      createdAt: new Date().toISOString(),
    };

    mockTasks.unshift(createdTask);
    return NextResponse.json(createdTask, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create task" },
      { status: 500 }
    );
  }
}
