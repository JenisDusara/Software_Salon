import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";

export async function GET() {
  try {
    const tenantId = getTenantId();
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const [invoices, expenses] = await Promise.all([
      prisma.invoice.findMany({
        where: { tenantId, date: { gte: startOfDay }, status: { in: ["PAID", "PARTIAL"] } },
        select: { paymentMethod: true, amountPaid: true },
      }),
      prisma.expense.findMany({
        where: { tenantId, date: { gte: startOfDay } },
        select: { amount: true, categoryName: true },
      }),
    ]);

    const breakdown: Record<string, number> = {};
    for (const inv of invoices) {
      const method = inv.paymentMethod ?? "CASH";
      breakdown[method] = (breakdown[method] ?? 0) + inv.amountPaid;
    }

    const totalOutflows = expenses.reduce((s, e) => s + e.amount, 0);
    const totalInflows = Object.values(breakdown).reduce((s, v) => s + v, 0);

    return NextResponse.json({
      cash: breakdown["CASH"] ?? 0,
      upi: breakdown["UPI"] ?? 0,
      card: breakdown["CARD"] ?? 0,
      split: breakdown["SPLIT"] ?? 0,
      other: Object.entries(breakdown)
        .filter(([m]) => !["CASH", "UPI", "CARD", "SPLIT"].includes(m))
        .reduce((s, [, v]) => s + v, 0),
      totalInflows,
      totalOutflows,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
