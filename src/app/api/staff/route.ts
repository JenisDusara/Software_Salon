import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";

export async function GET() {
  try {
    const tenantId = getTenantId();
    const staff = await prisma.user.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(staff);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = getTenantId();
    const body = await req.json();
    const { name, phone, role, commissionRate, branchId } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "Name and phone required" }, { status: 400 });
    }

    const member = await prisma.user.create({
      data: {
        tenantId,
        name,
        phone,
        role: role ?? "STAFF",
        commissionRate: commissionRate ?? 0,
        branchId: branchId ?? null,
        isActive: true,
      },
    });
    return NextResponse.json(member, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
