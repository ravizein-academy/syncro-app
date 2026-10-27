import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Mode Review / Development: Mengizinkan akses langsung ke semua halaman dashboard
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/auth (NextAuth routes)
     * 2. /auth/signin (Sign-in page)
     * 3. /manifest.json, /icons/*, /favicon.ico (PWA assets)
     * 4. /_next/* (Next.js internal static assets)
     */
    "/((?!api/auth|auth/signin|manifest.json|icons|_next/static|_next/image|favicon.ico).*)",
  ],
};
