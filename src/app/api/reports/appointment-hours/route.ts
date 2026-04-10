import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveTenant } from "@/lib/tenant";

export async function GET() {
  try {
    const tenantId = await resolveTenant();
    if (tenantId instanceof NextResponse) return tenantId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const appointments = await prisma.appointment.findMany({
      where: { tenantId, date: { gte: startOfMonth } },
      select: { startTime: true },
    });

    const hours: Record<number, number> = {};
    for (const appt of appointments) {
      const h = new Date(appt.startTime).getHours();
      hours[h] = (hours[h] ?? 0) + 1;
    }

    const result = [];
    for (let h = 9; h <= 20; h++) {
      const label = h < 12 ? `${h}AM` : h === 12 ? "12PM" : `${h - 12}PM`;
      result.push({ hour: label, count: hours[h] ?? 0 });
    }

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
