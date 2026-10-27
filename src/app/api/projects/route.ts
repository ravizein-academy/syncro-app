import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "edge";

const mockProjects = [
  {
    id: "proj-1",
    name: "Core Infrastructure",
    description: "Cloudflare Pages and Neon Database systems",
    color: "#6366f1",
    _count: { tasks: 4 },
  },
  {
    id: "proj-2",
    name: "Client Mobile Experience",
    description: "PWA serwist offline caching and install prompts",
    color: "#ec4899",
    _count: { tasks: 1 },
  },
  {
    id: "proj-3",
    name: "Product Design & UX",
    description: "ClickUp inspired Kanban & List views with micro-animations",
    color: "#10b981",
    _count: { tasks: 1 },
  },
];

export async function GET() {
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("your-subdomain")) {
      const projects = await prisma.project.findMany({
        include: {
          _count: {
            select: { tasks: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(projects);
    }
  } catch (err) {
    console.warn("[Projects GET] Fallback to mock:", err);
  }

  return NextResponse.json(mockProjects);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, color = "#6366f1", createdBy = "system" } = body;

    if (!name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    try {
      if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("your-subdomain")) {
        const newProj = await prisma.project.create({
          data: {
            name,
            description,
            color,
            createdBy,
          },
        });
        return NextResponse.json(newProj, { status: 201 });
      }
    } catch (err) {
      console.warn("[Projects POST] Neon DB fallback:", err);
    }

    const created = {
      id: `proj-${Date.now()}`,
      name,
      description,
      color,
      _count: { tasks: 0 },
    };
    mockProjects.push(created);
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create project" },
      { status: 500 }
    );
  }
}
