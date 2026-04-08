import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";

export async function GET() {
  try {
    const tenantId = getTenantId();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [staff, invoices, appointments] = await Promise.all([
      prisma.user.findMany({
        where: { tenantId, isActive: true },
        select: { id: true, name: true, commissionRate: true },
      }),
      prisma.invoice.findMany({
        where: { tenantId, date: { gte: startOfMonth }, status: { in: ["PAID", "PARTIAL"] } },
        select: { staffId: true, amountPaid: true },
      }),
      prisma.appointment.findMany({
        where: { tenantId, date: { gte: startOfMonth } },
        select: { staffId: true },
      }),
    ]);

    const performance = staff
      .map((s) => {
        const revenue = invoices
          .filter((i) => i.staffId === s.id)
          .reduce((sum, i) => sum + i.amountPaid, 0);
        const apptCount = appointments.filter((a) => a.staffId === s.id).length;
        const commission = Math.round(revenue * ((s.commissionRate ?? 0) / 100));
        return { name: s.name ?? "Unknown", revenue, appointments: apptCount, commission };
      })
      .filter((s) => s.revenue > 0 || s.appointments > 0)
      .sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json(performance);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
