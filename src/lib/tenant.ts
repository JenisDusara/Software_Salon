import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Returns tenantId from the logged-in user's session.
 * Super admin can impersonate a tenant via the sa_tenant cookie.
 */
export async function getTenantId(): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const role = (session.user as any).role;

  // Super admin impersonation — read cookie
  if (role === "SUPER_ADMIN") {
    const cookieStore = await cookies();
    const impersonated = cookieStore.get("sa_tenant")?.value;
    if (impersonated) return impersonated;
    throw new Error("NO_TENANT");
  }

  const tenantId = (session.user as any).tenantId as string | null;
  if (!tenantId) throw new Error("NO_TENANT");
  return tenantId;
}

/**
 * Helper for API routes: returns tenantId or sends 401/403 response.
 * Usage: const result = await resolveTenant(); if (result instanceof NextResponse) return result;
 */
export async function resolveTenant(): Promise<string | NextResponse> {
  try {
    return await getTenantId();
  } catch (e: any) {
    if (e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (e.message === "NO_TENANT") {
      return NextResponse.json({ error: "Forbidden — no tenant selected" }, { status: 403 });
    }
    return NextResponse.json({ error: "Auth error" }, { status: 500 });
  }
}
