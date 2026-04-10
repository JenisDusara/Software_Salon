import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveTenant } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    const tenantId = await resolveTenant();
    if (tenantId instanceof NextResponse) return tenantId;
    const days = parseInt(new URL(req.url).searchParams.get("days") ?? "7", 10);
    const now = new Date();

    const result = [];
    let runningBalance = 0;

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const [invoices, expenses] = await Promise.all([
        prisma.invoice.findMany({
          where: { tenantId, date: { gte: dayStart, lte: dayEnd }, status: { in: ["PAID", "PARTIAL"] } },
          select: { amountPaid: true },
        }),
        prisma.expense.findMany({
          where: { tenantId, date: { gte: dayStart, lte: dayEnd } },
          select: { amount: true },
        }),
      ]);

      const inflows = invoices.reduce((s, i) => s + i.amountPaid, 0);
      const outflows = expenses.reduce((s, e) => s + e.amount, 0);
      const opening = runningBalance;
      const closing = opening + inflows - outflows;
      runningBalance = closing;

      result.push({
        date: dayStart.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        day: dayStart.toLocaleDateString("en-IN", { weekday: "short" }),
        opening,
        inflows,
        outflows,
        closing,
      });
    }

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
