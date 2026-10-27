import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isAllowedCompanyEmail } from "@/lib/domain-auth";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan kata sandi wajib diisi" },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // 1. Pemeriksaan Domain Ketat: Hanya izinkan domain resmi @itsecacademy.com dan @itsecasia.com
    if (!isAllowedCompanyEmail(cleanEmail)) {
      return NextResponse.json(
        {
          error: "Domain email tidak diizinkan",
          message:
            "Domain email tidak diizinkan. Pendaftaran hanya dibuka untuk alamat email resmi perusahaan (@itsecacademy.com atau @itsecasia.com).",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Kata sandi minimal 6 karakter" },
        { status: 400 }
      );
    }

    // 2. Hash kata sandi menggunakan bcryptjs (Edge-compatible)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const displayName =
      name?.trim() || cleanEmail.split("@")[0].replace(/[._]/g, " ");

    // 3. Simpan ke basis data jika database terhubung
    if (
      process.env.DATABASE_URL &&
      !process.env.DATABASE_URL.includes("your-subdomain")
    ) {
      const existingUser = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Email sudah terdaftar. Silakan masuk menggunakan kata sandi Anda." },
          { status: 400 }
        );
      }

      const newUser = await prisma.user.create({
        data: {
          email: cleanEmail,
          name: displayName,
          password: hashedPassword,
          role: "USER",
          image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
            cleanEmail
          )}`,
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: "Pendaftaran berhasil. Silakan masuk ke akun Anda.",
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
          },
        },
        { status: 201 }
      );
    }

    // Mode fallback jika database offline/mock
    return NextResponse.json(
      {
        success: true,
        message: "Pendaftaran berhasil terverifikasi untuk domain perusahaan.",
        user: {
          id: `user-${Date.now()}`,
          email: cleanEmail,
          name: displayName,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan internal server" },
      { status: 500 }
    );
  }
}
