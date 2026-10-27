import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockTasks } from "@/lib/mock-data";

export const runtime = "edge";

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

      return NextResponse.json(tasks);
    }
  } catch (err) {
    console.warn("[Tasks API] Falling back to memory store:", err);
  }

  // Fallback demo tasks
  let filtered = [...mockTasks];
  if (projectId) filtered = filtered.filter((t) => t.projectId === projectId);
  if (status) filtered = filtered.filter((t) => t.status === status);

  return NextResponse.json(filtered);
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
        const newTask = await prisma.task.create({
          data: {
            title,
            description,
            status,
            priority,
            projectId,
            assigneeId: assigneeId || null,
            mediaUrls,
            dueDate: dueDate ? new Date(dueDate) : null,
          },
          include: {
            project: true,
            assignee: true,
          },
        });
        return NextResponse.json(newTask, { status: 201 });
      }
    } catch (err) {
      console.warn("[Tasks API POST] Neon DB error, using local fallback:", err);
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
