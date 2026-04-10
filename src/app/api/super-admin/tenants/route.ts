import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

// GET — list all tenants
export async function GET() {
  const deny = await requireSuperAdmin();
  if (deny) return deny;

  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        branches: { select: { id: true, name: true, city: true } },
        users: {
          where: { role: "SALON_ADMIN" },
          select: { id: true, name: true, email: true },
        },
      },
    });
    return NextResponse.json(tenants);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST — create new tenant (salon)
export async function POST(req: NextRequest) {
  const deny = await requireSuperAdmin();
  if (deny) return deny;

  try {
    const body = await req.json();
    const { businessName, ownerName, ownerEmail, ownerPhone, city, plan, branchName, password } = body;

    if (!businessName || !ownerEmail || !password) {
      return NextResponse.json(
        { error: "Business name, email and password are required" },
        { status: 400 }
      );
    }

    // Check email not already used
    const existing = await prisma.user.findFirst({ where: { email: ownerEmail.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create tenant + branch + admin user in one transaction
    const tenant = await prisma.$transaction(async (tx) => {
      const t = await tx.tenant.create({
        data: {
          businessName,
          ownerName: ownerName || businessName,
          ownerEmail: ownerEmail.toLowerCase(),
          ownerPhone: ownerPhone || null,
          city: city || null,
          subscriptionPlan: plan || "BASIC",
          isActive: true,
        },
      });

      const branch = await tx.branch.create({
        data: {
          tenantId: t.id,
          name: branchName || `${businessName} - Main`,
          city: city || null,
        },
      });

      await tx.user.create({
        data: {
          tenantId: t.id,
          branchId: branch.id,
          name: ownerName || businessName,
          email: ownerEmail.toLowerCase(),
          password: hashedPassword,
          phone: ownerPhone || null,
          role: "SALON_ADMIN",
          isActive: true,
        },
      });

      return t;
    });

    return NextResponse.json({ success: true, tenantId: tenant.id }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
