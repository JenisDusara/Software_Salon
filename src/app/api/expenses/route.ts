import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveTenant } from "@/lib/tenant";

export async function GET() {
  try {
    const tenantId = await resolveTenant();
    if (tenantId instanceof NextResponse) return tenantId;
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
    const tenantId = await resolveTenant();
    if (tenantId instanceof NextResponse) return tenantId;
    const body = await req.json();
    const { categoryId, categoryName, description, amount, date, paymentMethod, vendorName, isRecurring, recurringFreq } = body;

    if (!categoryName || !amount) {
      return NextResponse.json({ error: "Category and amount required" }, { status: 400 });
    }

    const branch = await prisma.branch.findFirst({ where: { tenantId } });
    if (!branch) return NextResponse.json({ error: "No branch found" }, { status: 400 });

    const expense = await prisma.expense.create({
      data: {
        tenantId,
        branchId: branch.id,
        categoryId: categoryId ?? "ec12",
        categoryName,
        description: description || null,
        amount: Number(amount),
        date: date ? new Date(date) : new Date(),
        paymentMethod: paymentMethod || "CASH",
        vendorName: vendorName || null,
        isRecurring: Boolean(isRecurring),
        recurringFreq: recurringFreq || null,
      },
    });
    return NextResponse.json(expense, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
