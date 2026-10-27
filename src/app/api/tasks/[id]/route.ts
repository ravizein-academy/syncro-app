import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockTasks } from "@/lib/mock-data";

export const runtime = "edge";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    try {
      if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("your-subdomain")) {
        const updated = await prisma.task.update({
          where: { id },
          data: {
            ...body,
            dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
          },
          include: {
            project: true,
            assignee: true,
          },
        });
        return NextResponse.json(updated);
      }
    } catch (err) {
      console.warn("[Task PATCH] Database fallback:", err);
    }

    const taskIndex = mockTasks.findIndex((t) => t.id === id);
    if (taskIndex !== -1) {
      mockTasks[taskIndex] = {
        ...mockTasks[taskIndex],
        ...body,
      };
      return NextResponse.json(mockTasks[taskIndex]);
    }

    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    try {
      if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("your-subdomain")) {
        await prisma.task.delete({ where: { id } });
        return NextResponse.json({ success: true });
      }
    } catch (err) {
      console.warn("[Task DELETE] Database fallback:", err);
    }

    const index = mockTasks.findIndex((t) => t.id === id);
    if (index !== -1) {
      mockTasks.splice(index, 1);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete task" },
      { status: 500 }
    );
  }
}
