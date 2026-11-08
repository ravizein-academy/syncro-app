import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "edge";

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
        },
        orderBy: { name: "asc" },
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
    },
  ]);
}
