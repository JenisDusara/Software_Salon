import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";

export async function GET() {
  try {
    const tenantId = getTenantId();
    const products = await prisma.product.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(products);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = getTenantId();
    const body = await req.json();
    const { name, brand, category, costPrice, sellingPrice, stockLevel, minStockThreshold } = body;

    if (!name || !sellingPrice) {
      return NextResponse.json({ error: "Name and price required" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        tenantId,
        name,
        brand: brand || null,
        category: category || null,
        costPrice: Number(costPrice) || 0,
        sellingPrice: Number(sellingPrice),
        stockLevel: Number(stockLevel) || 0,
        minStockThreshold: Number(minStockThreshold) || 5,
        gstRate: 18,
        isActive: true,
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
