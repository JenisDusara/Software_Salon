import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = getTenantId();
    const client = await prisma.client.findFirst({
      where: { id, tenantId },
      include: {
        invoices: {
          include: { items: true, staff: { select: { name: true } } },
          orderBy: { date: "desc" },
          take: 20,
        },
      },
    });
    if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(client);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = getTenantId();
    const body = await req.json();
    const client = await prisma.client.updateMany({
      where: { id, tenantId },
      data: {
        name: body.name,
        phone: body.phone,
        email: body.email ?? null,
        gender: body.gender ?? null,
      },
    });
    return NextResponse.json(client);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = getTenantId();
    await prisma.client.deleteMany({ where: { id, tenantId } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
