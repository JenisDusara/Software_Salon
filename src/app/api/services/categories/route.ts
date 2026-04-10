import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";

export async function GET() {
  try {
    const tenantId = getTenantId();
    const categories = await prisma.serviceCategory.findMany({
      where: { tenantId },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(categories);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = getTenantId();
    const body = await req.json();
    const { name } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Category name required" }, { status: 400 });
    }

    const count = await prisma.serviceCategory.count({ where: { tenantId } });
    const category = await prisma.serviceCategory.create({
      data: { tenantId, name: name.trim(), order: count + 1 },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
