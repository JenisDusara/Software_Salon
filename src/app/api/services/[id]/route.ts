import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = getTenantId();
    const body = await req.json();
    const service = await prisma.service.updateMany({
      where: { id, tenantId },
      data: {
        name: body.name,
        categoryId: body.categoryId,
        duration: Number(body.duration),
        price: Number(body.price),
        gstRate: Number(body.gstRate),
      },
    });
    return NextResponse.json(service);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = getTenantId();
    await prisma.service.updateMany({ where: { id, tenantId }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
