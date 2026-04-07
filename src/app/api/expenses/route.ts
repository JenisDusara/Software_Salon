import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";

export async function GET() {
  try {
    const tenantId = getTenantId();
    const expenses = await prisma.expense.findMany({
      where: { tenantId },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(expenses);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = getTenantId();
    const body = await req.json();
    const { categoryId, categoryName, description, amount, date, paymentMethod, vendorName, isRecurring, recurringFreq } = body;

    if (!categoryName || !amount) {
      return NextResponse.json({ error: "Category and amount required" }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        tenantId,
        branchId: "b1-seed",
        categoryId: categoryId ?? "ec12",
        categoryName,
        description: description || null,
        amount: Number(amount),
        date: date ? new Date(date) : new Date(),
        paymentMethod: paymentMethod || "CASH",
        vendorName: vendorName || null,
        isRecurring: Boolean(isRecurring),
        recurringFreq: recurringFreq || null,
        createdById: "s1-seed",
      },
    });
    return NextResponse.json(expense, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
