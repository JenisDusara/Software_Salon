import { encode } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  const superEmail = process.env.SUPER_ADMIN_EMAIL;

  if (!secret || !superEmail) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // NextAuth uses __Secure- prefix on HTTPS (production), plain on HTTP (dev)
  const isSecure =
    process.env.NODE_ENV === "production" ||
    (process.env.NEXTAUTH_URL ?? "").startsWith("https://");

  const cookieName = isSecure
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

  // Mint a JWT token — must pass salt=cookieName so getToken() can decrypt it.
  // NextAuth v4.22+ uses HKDF key derivation with the cookie name as salt;
  // without this, getToken() in middleware gets null and causes infinite redirect.
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
    salt: cookieName,
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
