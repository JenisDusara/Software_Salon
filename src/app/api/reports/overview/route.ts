import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveTenant } from "@/lib/tenant";

function getPeriodRange(period: string, now: Date) {
  if (period === "last_month") {
    return {
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
      prevStart: new Date(now.getFullYear(), now.getMonth() - 2, 1),
      prevEnd: new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999),
    };
  }
  if (period === "this_quarter") {
    const q = Math.floor(now.getMonth() / 3);
    return {
      start: new Date(now.getFullYear(), q * 3, 1),
      end: now,
      prevStart: new Date(now.getFullYear(), (q - 1) * 3, 1),
      prevEnd: new Date(now.getFullYear(), q * 3, 0, 23, 59, 59, 999),
    };
  }
  if (period === "this_year") {
    return {
      start: new Date(now.getFullYear(), 0, 1),
      end: now,
      prevStart: new Date(now.getFullYear() - 1, 0, 1),
      prevEnd: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999),
    };
  }
  // default: this month
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: now,
    prevStart: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    prevEnd: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
  };
}

export async function GET(req: NextRequest) {
  try {
    const tenantId = await resolveTenant();
    if (tenantId instanceof NextResponse) return tenantId;
    const period = new URL(req.url).searchParams.get("period") ?? "this_month";
    const now = new Date();
    const { start, end, prevStart, prevEnd } = getPeriodRange(period, now);

    const [invoices, prevInvoices, allInvoices, expenses, prevExpenses, totalClients] =
      await Promise.all([
        prisma.invoice.findMany({
          where: { tenantId, date: { gte: start, lte: end }, status: { in: ["PAID", "PARTIAL"] } },
          select: { amountPaid: true },
        }),
        prisma.invoice.findMany({
          where: { tenantId, date: { gte: prevStart, lte: prevEnd }, status: { in: ["PAID", "PARTIAL"] } },
          select: { amountPaid: true },
        }),
        prisma.invoice.findMany({
          where: { tenantId, date: { gte: start, lte: end } },
          select: { status: true },
        }),
        prisma.expense.findMany({
          where: { tenantId, date: { gte: start, lte: end } },
          select: { amount: true },
        }),
        prisma.expense.findMany({
          where: { tenantId, date: { gte: prevStart, lte: prevEnd } },
          select: { amount: true },
        }),
        prisma.client.count({ where: { tenantId } }),
      ]);

    const revenue = invoices.reduce((s, i) => s + i.amountPaid, 0);
    const prevRevenue = prevInvoices.reduce((s, i) => s + i.amountPaid, 0);
    const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);
    const prevExpenseTotal = prevExpenses.reduce((s, e) => s + e.amount, 0);

    return NextResponse.json({
      revenue,
      prevRevenue,
      expenses: expenseTotal,
      prevExpenses: prevExpenseTotal,
      netProfit: revenue - expenseTotal,
      prevNetProfit: prevRevenue - prevExpenseTotal,
      totalClients,
      totalInvoices: allInvoices.length,
      paidInvoices: allInvoices.filter((i) => i.status === "PAID").length,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
