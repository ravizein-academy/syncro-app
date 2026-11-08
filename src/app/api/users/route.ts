import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";

export const runtime = "edge";

// GET: Ambil daftar seluruh pengguna
export async function GET() {
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("your-subdomain")) {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(users);
    }
  } catch (err) {
    console.warn("[Users GET] Database fallback:", err);
  }

  return NextResponse.json([
    {
      id: "cmw76e0mm0000z30nonmudizx",
      name: "Ravi Zein",
      email: "ravizein@itsecacademy.com",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=ravizein%40itsecacademy.com",
      role: "ADMIN",
      createdAt: new Date().toISOString(),
    },
  ]);
}

// POST: Admin mengundang / menambahkan pengguna baru (mendukung @gmail.com dan domain lainnya)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const requesterRole = (session?.user as any)?.role;
    const requesterEmail = session?.user?.email;

    // Verifikasi otorisasi: Hanya ADMIN yang diizinkan mengundang / menambahkan user
    let isAdmin = requesterRole === "ADMIN";
    if (!isAdmin && requesterEmail) {
      const dbUser = await prisma.user.findUnique({
        where: { email: requesterEmail.toLowerCase() },
      });
      if (dbUser?.role === "ADMIN") {
        isAdmin = true;
      }
    }

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya administrator yang dapat menambahkan atau mengundang pengguna baru." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, password, role = "USER" } = body;

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "Alamat email wajib diisi" },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { error: "Format alamat email tidak valid" },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Kata sandi wajib diisi minimal 6 karakter" },
        { status: 400 }
      );
    }

    // Periksa apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: `Pengguna dengan email ${cleanEmail} sudah terdaftar di sistem.` },
        { status: 400 }
      );
    }

    // Hash password dengan bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const displayName =
      name?.trim() || cleanEmail.split("@")[0].replace(/[._]/g, " ");

    const assignedRole = role === "ADMIN" ? "ADMIN" : "USER";

    const newUser = await prisma.user.create({
      data: {
        email: cleanEmail,
        name: displayName,
        password: hashedPassword,
        role: assignedRole,
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
          cleanEmail
        )}`,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Pengguna ${newUser.name} (${newUser.email}) berhasil ditambahkan sebagai ${newUser.role}.`,
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[Users POST] Error adding user:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menambahkan pengguna baru" },
      { status: 500 }
    );
  }
}
