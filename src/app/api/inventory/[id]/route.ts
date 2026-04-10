import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveTenant } from "@/lib/tenant";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = await resolveTenant();
    if (tenantId instanceof NextResponse) return tenantId;
    const body = await req.json();
    await prisma.product.updateMany({
      where: { id, tenantId },
      data: {
        name: body.name,
        brand: body.brand ?? null,
        category: body.category ?? null,
        costPrice: Number(body.costPrice),
        sellingPrice: Number(body.sellingPrice),
        stockLevel: Number(body.stockLevel),
        minStockThreshold: Number(body.minStockThreshold),
      },
    });
    const updated = await prisma.product.findFirst({ where: { id, tenantId } });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = await resolveTenant();
    if (tenantId instanceof NextResponse) return tenantId;
    const body = await req.json();
    // For stock adjustments: { delta: number }
    const product = await prisma.product.findFirst({ where: { id, tenantId } });
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const newStock = Math.max(0, product.stockLevel + Number(body.delta));
    await prisma.product.updateMany({ where: { id, tenantId }, data: { stockLevel: newStock } });
    return NextResponse.json({ stockLevel: newStock });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = await resolveTenant();
    if (tenantId instanceof NextResponse) return tenantId;
    await prisma.product.updateMany({ where: { id, tenantId }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
