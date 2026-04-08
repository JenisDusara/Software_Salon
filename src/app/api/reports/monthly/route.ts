import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";

export async function GET() {
  try {
    const tenantId = getTenantId();
    const now = new Date();

    // Last 12 months
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      return {
        label: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }).replace(" ", " "),
        start: new Date(d.getFullYear(), d.getMonth(), 1),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),
      };
    });

    const data = await Promise.all(
      months.map(async ({ label, start, end }) => {
        const [invoices, expenses] = await Promise.all([
          prisma.invoice.findMany({
            where: { tenantId, date: { gte: start, lte: end }, status: { in: ["PAID", "PARTIAL"] } },
            select: { amountPaid: true },
          }),
          prisma.expense.findMany({
            where: { tenantId, date: { gte: start, lte: end } },
            select: { amount: true },
          }),
        ]);

        const revenue = invoices.reduce((s, i) => s + i.amountPaid, 0);
        const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);
        return { month: label, revenue, expenses: expenseTotal, profit: revenue - expenseTotal };
      })
    );

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
