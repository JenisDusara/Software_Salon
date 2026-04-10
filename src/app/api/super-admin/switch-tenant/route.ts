import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST — super admin enters a tenant's dashboard
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { tenantId, businessName } = await req.json();
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });

  const res = NextResponse.json({ success: true });
  // httpOnly — read by server (resolveTenant)
  res.cookies.set("sa_tenant", tenantId, { httpOnly: true, path: "/", sameSite: "lax" });
  // readable by client — for the banner
  res.cookies.set("sa_business", businessName ?? "Unknown", { httpOnly: false, path: "/", sameSite: "lax" });
  return res;
}

// DELETE — exit impersonation, go back to super-admin
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.delete("sa_tenant");
  res.cookies.delete("sa_business");
  return res;
}
