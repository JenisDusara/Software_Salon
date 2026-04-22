import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveTenant } from "@/lib/tenant";

export async function GET() {
  try {
    const tenantId = await resolveTenant();
    if (tenantId instanceof NextResponse) return tenantId;
    const staff = await prisma.user.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: "asc" },
      include: {
        invoices: {
          orderBy: { date: "desc" },
          take: 5,
          include: {
            client: { select: { name: true } },
            items: { select: { description: true } },
          },
        },
      },
    });

    // Shape: add totalClients, totalServices, recentActivity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shaped = (staff as any[]).map((s) => ({
      id: s.id,
      name: s.name,
      phone: s.phone,
      role: s.role,
      commissionRate: s.commissionRate ?? 0,
      branchId: s.branchId,
      isActive: s.isActive,
      totalInvoices: s.invoices.length,
      recentActivity: s.invoices.map((inv: any) => ({
        invoiceNumber: inv.invoiceNumber,
        date: inv.date,
        clientName: inv.client?.name ?? inv.walkInName ?? "Walk-in",
        services: inv.items.map((i: any) => i.description).filter(Boolean),
        totalAmount: inv.totalAmount,
        status: inv.status,
      })),
    }));

    return NextResponse.json(shaped);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenant();
    if (tenantId instanceof NextResponse) return tenantId;
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
        branchId: branchId || null,
        isActive: true,
      },
    });
    return NextResponse.json(member, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
