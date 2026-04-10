import { NextRequest, NextResponse } from "next/server";
import { resolveTenant } from "@/lib/tenant";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET — fetch current tenant settings
export async function GET() {
  const tenantId = await resolveTenant();
  if (tenantId instanceof NextResponse) return tenantId;

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        businessName: true,
        ownerName: true,
        ownerEmail: true,
        ownerPhone: true,
        city: true,
        address: true,
        gstin: true,
        upiId: true,
        logoUrl: true,
        subscriptionPlan: true,
      },
    });
    if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(tenant);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH — update tenant settings
export async function PATCH(req: NextRequest) {
  const tenantId = await resolveTenant();
  if (tenantId instanceof NextResponse) return tenantId;

  try {
    const body = await req.json();
    const { businessName, ownerName, ownerPhone, city, address, gstin, upiId, newPassword, currentPassword } = body;

    // If changing password, verify current password first
    if (newPassword) {
      const session = await getServerSession(authOptions);
      const userId = (session?.user as any)?.id;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.password) return NextResponse.json({ error: "Cannot change password" }, { status: 400 });
      const valid = await bcrypt.compare(currentPassword ?? "", user.password);
      if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      const hashed = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    }

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(businessName !== undefined && { businessName }),
        ...(ownerName !== undefined && { ownerName }),
        ...(ownerPhone !== undefined && { ownerPhone: ownerPhone || null }),
        ...(city !== undefined && { city: city || null }),
        ...(address !== undefined && { address: address || null }),
        ...(gstin !== undefined && { gstin: gstin || null }),
        ...(upiId !== undefined && { upiId: upiId || null }),
      },
    });

    return NextResponse.json({ success: true, tenant: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
