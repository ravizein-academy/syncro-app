import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Cek cookie sesi login NextAuth
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value ||
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;

  // Jika pengguna belum login dan membuka halaman utama, otomatis diarahkan langsung ke form login
  if (!sessionToken && (pathname === "/" || pathname === "/dashboard")) {
    const signInUrl = new URL("/auth/signin", request.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/auth, /api/upload
     * 2. /auth/signin, /auth/register
     * 3. /manifest.json, /icons/*, /images/*, /sw.js
     * 4. /_next/* (Next.js internal static assets)
     */
    "/((?!api/auth|api/upload|auth/signin|auth/register|manifest.json|icons|images|sw.js|_next/static|_next/image|favicon.ico).*)",
  ],
};
