import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "edge";

const mockProjects: any[] = [];

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
    const { name, description, color = "#6366f1", createdBy } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nama space wajib diisi" }, { status: 400 });
    }

    try {
      if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("your-subdomain")) {
        let validCreatedBy = createdBy;
        if (createdBy) {
          const user = await prisma.user.findUnique({ where: { id: createdBy } });
          if (!user) validCreatedBy = null;
        }
        if (!validCreatedBy) {
          const firstUser = await prisma.user.findFirst();
          validCreatedBy = firstUser?.id;
        }

        if (!validCreatedBy) {
          throw new Error("Pengguna tidak ditemukan di database untuk menjadi pemilik space");
        }

        const newProj = await prisma.project.create({
          data: {
            name: name.trim(),
            description: description || null,
            color,
            createdBy: validCreatedBy,
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
