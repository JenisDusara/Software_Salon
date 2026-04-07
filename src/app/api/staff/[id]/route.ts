import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = getTenantId();
    const body = await req.json();
    await prisma.user.updateMany({
      where: { id, tenantId },
      data: {
        name: body.name,
        phone: body.phone,
        role: body.role,
        commissionRate: Number(body.commissionRate),
        branchId: body.branchId ?? null,
      },
    });
    const updated = await prisma.user.findFirst({ where: { id, tenantId } });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = getTenantId();
    await prisma.user.updateMany({ where: { id, tenantId }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
