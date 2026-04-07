import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";

export async function GET() {
  try {
    const tenantId = getTenantId();
    const services = await prisma.service.findMany({
      where: { tenantId, isActive: true },
      include: { category: true },
      orderBy: [{ category: { order: "asc" } }, { name: "asc" }],
    });
    return NextResponse.json(services);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = getTenantId();
    const body = await req.json();
    const { name, categoryId, duration, price, gstRate } = body;

    if (!name || !categoryId || !price) {
      return NextResponse.json({ error: "Name, category, and price required" }, { status: 400 });
    }

    const service = await prisma.service.create({
      data: { tenantId, name, categoryId, duration: Number(duration) || 30, price: Number(price), gstRate: Number(gstRate) || 18, isActive: true },
      include: { category: true },
    });
    return NextResponse.json(service, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
