import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

// GET — full details for one tenant (super admin only)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const deny = await requireSuperAdmin();
  if (deny) return deny;

  const { id } = params;

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        branches: true,
        users: { where: { role: "SALON_ADMIN" }, select: { id: true, name: true, email: true, phone: true, createdAt: true } },
      },
    });

    if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Staff
    const staff = await prisma.user.findMany({
      where: { tenantId: id },
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    // Clients
    const clients = await prisma.client.findMany({
      where: { tenantId: id },
      select: { id: true, name: true, phone: true, totalSpent: true, visitCount: true, lastVisit: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    // Invoices
    const invoices = await prisma.invoice.findMany({
      where: { tenantId: id },
      select: {
        id: true, invoiceNumber: true, totalAmount: true, status: true,
        paymentMethod: true, date: true,
        client: { select: { name: true } },
        walkInName: true,
      },
      orderBy: { date: "desc" },
      take: 50,
    });

    // Services
    const services = await prisma.service.findMany({
      where: { tenantId: id },
      select: { id: true, name: true, price: true, duration: true, isActive: true },
      orderBy: { name: "asc" },
    });

    // Revenue stats
    const revenueResult = await prisma.invoice.aggregate({
      where: { tenantId: id, status: "PAID" },
      _sum: { totalAmount: true },
      _count: { id: true },
    });

    // This month revenue
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthRevenueResult = await prisma.invoice.aggregate({
      where: { tenantId: id, status: "PAID", date: { gte: monthStart } },
      _sum: { totalAmount: true },
    });

    return NextResponse.json({
      tenant,
      staff,
      clients,
      invoices,
      services,
      stats: {
        totalRevenue: revenueResult._sum.totalAmount ?? 0,
        totalInvoices: revenueResult._count.id,
        totalClients: clients.length,
        totalStaff: staff.length,
        monthRevenue: monthRevenueResult._sum.totalAmount ?? 0,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH — update tenant plan / active status
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const deny = await requireSuperAdmin();
  if (deny) return deny;

  const { id } = params;
  try {
    const body = await req.json();
    const { subscriptionPlan, isActive } = body;

    const updated = await prisma.tenant.update({
      where: { id },
      data: {
        ...(subscriptionPlan !== undefined && { subscriptionPlan }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ success: true, tenant: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE — remove tenant entirely
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const deny = await requireSuperAdmin();
  if (deny) return deny;

  const { id } = params;
  try {
    await prisma.tenant.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
