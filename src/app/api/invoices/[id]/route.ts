import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = getTenantId();
    const body = await req.json();
    // Supports: { status, amountPaid, paymentMethod }
    await prisma.invoice.updateMany({
      where: { id, tenantId },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(body.amountPaid !== undefined ? { amountPaid: Number(body.amountPaid) } : {}),
        ...(body.paymentMethod ? { paymentMethod: body.paymentMethod } : {}),
      },
    });
    const updated = await prisma.invoice.findFirst({ where: { id, tenantId } });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = getTenantId();
    await prisma.invoice.deleteMany({ where: { id, tenantId } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
