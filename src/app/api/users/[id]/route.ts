import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";

export const runtime = "edge";

interface RouteParams {
  params: {
    id: string;
  };
}

// PATCH: Reset password pengguna atau perbarui peran (Khusus ADMIN)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const requesterRole = (session?.user as any)?.role;
    const requesterEmail = session?.user?.email;

    // Verifikasi otorisasi Admin
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
        { error: "Akses ditolak. Hanya administrator yang dapat mereset kata sandi atau mengubah peran pengguna." },
        { status: 403 }
      );
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "User ID diperlukan" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    const body = await request.json();
    const { newPassword, role, name } = body;

    const updateData: any = {};

    if (name && typeof name === "string" && name.trim()) {
      updateData.name = name.trim();
    }

    if (role && (role === "ADMIN" || role === "USER")) {
      updateData.role = role;
    }

    // Jika admin melakukan reset password
    if (newPassword) {
      if (typeof newPassword !== "string" || newPassword.length < 6) {
        return NextResponse.json(
          { error: "Kata sandi baru minimal harus 6 karakter" },
          { status: 400 }
        );
      }
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(newPassword, salt);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Tidak ada data perubahan yang dikirimkan" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
      },
    });

    const isPasswordReset = !!newPassword;
    return NextResponse.json({
      success: true,
      message: isPasswordReset
        ? `Kata sandi untuk pengguna ${updatedUser.name} (${updatedUser.email}) berhasil direset.`
        : `Profil pengguna ${updatedUser.name} berhasil diperbarui.`,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("[Users PATCH] Error resetting password / updating user:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui pengguna" },
      { status: 500 }
    );
  }
}

// DELETE: Hapus pengguna dari sistem (Khusus ADMIN)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const requesterRole = (session?.user as any)?.role;
    const requesterEmail = session?.user?.email;

    // Verifikasi otorisasi Admin
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
        { error: "Akses ditolak. Hanya administrator yang dapat menghapus pengguna." },
        { status: 403 }
      );
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "User ID diperlukan" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    // Proteksi: Jangan biarkan admin menghapus akunnya sendiri
    if (
      targetUser.email.toLowerCase() === requesterEmail?.toLowerCase() ||
      targetUser.id === (session?.user as any)?.id
    ) {
      return NextResponse.json(
        { error: "Anda tidak dapat menghapus akun administrator Anda sendiri." },
        { status: 400 }
      );
    }

    // Lepas penugasan tugas yang dimiliki user sebelum menghapus (agar tidak melanggar foreign key constraint)
    await prisma.task.updateMany({
      where: { assigneeId: id },
      data: { assigneeId: null },
    });

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Pengguna ${targetUser.name} (${targetUser.email}) berhasil dihapus dari sistem.`,
    });
  } catch (error: any) {
    console.error("[Users DELETE] Error deleting user:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menghapus pengguna" },
      { status: 500 }
    );
  }
}

