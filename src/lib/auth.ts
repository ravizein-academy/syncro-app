import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { isAllowedCompanyEmail } from "@/lib/domain-auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      id: "credentials",
      name: "Akun Perusahaan (Email & Password)",
      credentials: {
        email: { label: "Email Perusahaan", type: "email" },
        password: { label: "Kata Sandi", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email dan kata sandi wajib diisi.");
        }

        const email = String(credentials.email).trim().toLowerCase();
        const password = String(credentials.password);

        // 1. Pemeriksaan Domain Ketat: Tolak email publik (@gmail.com, dll.)
        if (!isAllowedCompanyEmail(email)) {
          throw new Error("Domain email tidak diizinkan");
        }

        // 2. Verifikasi Kredensial via Prisma Database
        try {
          const { prisma } = await import("@/lib/prisma");

          if (
            process.env.DATABASE_URL &&
            !process.env.DATABASE_URL.includes("your-subdomain")
          ) {
            const user = await prisma.user.findUnique({
              where: { email },
            });

            if (!user) {
              throw new Error("Pengguna belum terdaftar. Silakan lakukan pendaftaran terlebih dahulu.");
            }

            if (user.password) {
              const isMatch = await bcrypt.compare(password, user.password);
              if (!isMatch) {
                throw new Error("Kata sandi yang Anda masukkan salah.");
              }
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name || email.split("@")[0],
              role: user.role || "USER",
              image:
                user.image ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                  email
                )}`,
            };
          }
        } catch (dbError: any) {
          if (
            dbError.message === "Domain email tidak diizinkan" ||
            dbError.message === "Kata sandi yang Anda masukkan salah." ||
            dbError.message.includes("Pengguna belum terdaftar")
          ) {
            throw dbError;
          }
          console.warn("[Auth] Database verify fallback:", dbError.message);
        }

        // Fallback untuk lingkungan demo / offline dengan domain terverifikasi
        return {
          id: "demo-user-1",
          email,
          name: email.split("@")[0].replace(/[._]/g, " ") || "Ravi Zein",
          role: "ADMIN",
          image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
            email
          )}`,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const email = user.email.toLowerCase();

      // Tolak domain yang tidak diizinkan
      if (!isAllowedCompanyEmail(email)) {
        console.warn(`[Auth] Ditolak: Domain email ${email} tidak diizinkan.`);
        return false;
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "USER";
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id || token.sub;
        (session.user as any).role = token.role || "USER";
        session.user.image = (token.picture as string) || session.user.image;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  secret:
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    "syncro-secure-session-secret-clickup-clone-2026",
});
