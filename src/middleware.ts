import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const DASHBOARD_PATHS = [
  "/dashboard",
  "/finance",
  "/appointments",
  "/clients",
  "/staff",
  "/services",
  "/inventory",
  "/reports",
  "/marketing",
  "/settings",
];

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  const role = token?.role as string | undefined;

  // Super admin panel
  if (pathname.startsWith("/super-admin")) {
    // No session → auto-login as super admin
    if (!token) {
      return NextResponse.redirect(new URL("/api/auto-login", req.url));
    }
    // Logged in but not super admin → send to login
    if (role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  // Dashboard routes — salon users must log in manually
  const isDashboard = DASHBOARD_PATHS.some((p) => pathname.startsWith(p));
  if (isDashboard) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (role === "SUPER_ADMIN") {
      // Super admin must have impersonation cookie to enter dashboard
      const impersonating = req.cookies.get("sa_tenant")?.value;
      if (!impersonating) {
        return NextResponse.redirect(new URL("/super-admin", req.url));
      }
      return NextResponse.next();
    }
    // Regular tenant user must have tenantId in token
    if (!token.tenantId) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/super-admin/:path*",
    "/dashboard/:path*",
    "/finance/:path*",
    "/appointments/:path*",
    "/clients/:path*",
    "/staff/:path*",
    "/services/:path*",
    "/inventory/:path*",
    "/reports/:path*",
    "/marketing/:path*",
    "/settings/:path*",
  ],
};
