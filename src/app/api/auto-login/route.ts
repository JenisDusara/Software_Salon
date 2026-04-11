import { encode } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  const superEmail = process.env.SUPER_ADMIN_EMAIL;

  if (!secret || !superEmail) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Mirror getToken()'s own secureCookie logic exactly:
  // if NEXTAUTH_URL is set, use it; otherwise fall back to VERCEL env var.
  // This ensures the cookie name we set matches the one getToken() looks for.
  const isSecure = process.env.NEXTAUTH_URL
    ? process.env.NEXTAUTH_URL.startsWith("https://")
    : !!process.env.VERCEL;

  const cookieName = isSecure
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

  // Mint a JWT token. Do NOT pass salt — getToken() in middleware calls decode()
  // with no salt (salt=""), so encode() must also use no salt for keys to match.
  const token = await encode({
    token: {
      sub: "super-admin",
      id: "super-admin",
      name: "Super Admin",
      email: superEmail,
      role: "SUPER_ADMIN",
      tenantId: null,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
    },
    secret,
  });

  const response = NextResponse.redirect(new URL("/super-admin", req.url));
  response.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });

  return response;
}
