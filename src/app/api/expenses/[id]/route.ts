import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveTenant } from "@/lib/tenant";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = await resolveTenant();
    if (tenantId instanceof NextResponse) return tenantId;
    const body = await req.json();
    await prisma.expense.updateMany({
      where: { id, tenantId },
      data: {
        categoryId: body.categoryId,
        categoryName: body.categoryName,
        description: body.description || null,
        amount: Number(body.amount),
        date: new Date(body.date),
        paymentMethod: body.paymentMethod,
        vendorName: body.vendorName || null,
      },
    });
    const updated = await prisma.expense.findFirst({ where: { id, tenantId } });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = await resolveTenant();
    if (tenantId instanceof NextResponse) return tenantId;
    await prisma.expense.deleteMany({ where: { id, tenantId } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
