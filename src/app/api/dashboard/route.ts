import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveTenant } from "@/lib/tenant";

export async function GET() {
  try {
    const tenantId = await resolveTenant();
    if (tenantId instanceof NextResponse) return tenantId;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const [
      totalClients,
      newClientsThisMonth,
      todayAppointments,
      monthInvoices,
      pendingInvoices,
      staffCount,
    ] = await Promise.all([
      prisma.client.count({ where: { tenantId } }),
      prisma.client.count({ where: { tenantId, createdAt: { gte: startOfMonth } } }),
      prisma.appointment.findMany({
        where: { tenantId, date: { gte: startOfDay } },
        include: { client: true, staff: true, items: { include: { service: true } } },
        orderBy: { startTime: "asc" },
      }),
      prisma.invoice.findMany({
        where: { tenantId, date: { gte: startOfMonth } },
      }),
      prisma.invoice.findMany({
        where: { tenantId, status: { in: ["PENDING", "OVERDUE", "PARTIAL"] } },
        include: { client: true },
      }),
      prisma.user.count({ where: { tenantId, isActive: true } }),
    ]);

    const monthRevenue = monthInvoices
      .filter((i) => i.status === "PAID" || i.status === "PARTIAL")
      .reduce((s, i) => s + i.amountPaid, 0);

    const outstandingAmount = pendingInvoices.reduce(
      (s, i) => s + (i.totalAmount - i.amountPaid),
      0
    );

    return NextResponse.json({
      totalClients,
      newClientsThisMonth,
      monthRevenue,
      outstandingAmount,
      staffCount,
      todayAppointmentsCount: todayAppointments.length,
      todayCompleted: todayAppointments.filter((a) => a.status === "COMPLETED").length,
      todayRevenue: todayAppointments
        .filter((a) => a.status === "COMPLETED")
        .reduce((s, a) => s + a.totalPrice, 0),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
