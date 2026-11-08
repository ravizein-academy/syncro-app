import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "edge";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, description, color } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nama space wajib diisi" }, { status: 400 });
    }

    try {
      if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("your-subdomain")) {
        const updated = await prisma.project.update({
          where: { id },
          data: {
            name: name.trim(),
            description: description !== undefined ? description : undefined,
            color: color || undefined,
          },
        });
        return NextResponse.json(updated);
      }
    } catch (err: any) {
      console.warn("[Project PATCH] Database error:", err);
      return NextResponse.json(
        { error: err.message || "Gagal mengupdate project" },
        { status: 500 }
      );
    }

    return NextResponse.json({ id, name, description, color });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Bad Request" }, { status: 400 });
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
        await prisma.project.delete({ where: { id } });
        return NextResponse.json({ success: true });
      }
    } catch (err: any) {
      console.warn("[Project DELETE] Database error:", err);
      if (err.code === "P2025") {
        return NextResponse.json({ success: true, message: "Project already removed" });
      }
      return NextResponse.json(
        { error: err.message || "Gagal menghapus project" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Bad Request" }, { status: 400 });
  }
}
