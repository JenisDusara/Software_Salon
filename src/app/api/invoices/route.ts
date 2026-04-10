import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveTenant } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    const tenantId = await resolveTenant();
    if (tenantId instanceof NextResponse) return tenantId;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search") ?? "";

    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        ...(status && status !== "All" ? { status: status.toUpperCase() } : {}),
        ...(search
          ? {
              OR: [
                { invoiceNumber: { contains: search, mode: "insensitive" } },
                { client: { name: { contains: search, mode: "insensitive" } } },
                { walkInName: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        client: { select: { name: true, phone: true } },
        staff: { select: { name: true } },
        items: true,
      },
      orderBy: { date: "desc" },
    });

    const shaped = invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      clientId: inv.clientId,
      clientName: inv.client?.name ?? inv.walkInName ?? "Walk-in",
      clientPhone: inv.client?.phone ?? "",
      staffName: inv.staff?.name ?? "",
      items: inv.items.map((i) => ({ description: i.description, quantity: i.quantity, rate: i.rate, discount: i.discount, cgst: i.cgst, sgst: i.sgst, total: i.total })),
      subtotal: inv.subtotal,
      taxAmount: inv.taxAmount,
      discount: inv.discount,
      tips: inv.tips,
      totalAmount: inv.totalAmount,
      amountPaid: inv.amountPaid,
      paymentMethod: inv.paymentMethod,
      status: inv.status,
      date: inv.date,
      dueDate: inv.dueDate,
    }));

    return NextResponse.json(shaped);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenant();
    if (tenantId instanceof NextResponse) return tenantId;
    const body = await req.json();
    const {
      clientId, walkInName, staffId, items, subtotal, taxAmount,
      discount, tips, totalAmount, amountPaid, paymentMethod, status,
    } = body;

    // Generate invoice number
    const count = await prisma.invoice.count({ where: { tenantId } });
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const branch = await prisma.branch.findFirst({ where: { tenantId } });
    if (!branch) return NextResponse.json({ error: "No branch found" }, { status: 400 });

    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        branchId: branch.id,
        invoiceNumber,
        clientId: clientId || null,
        walkInName: !clientId ? (walkInName || "Walk-in") : null,
        staffId: staffId || null,
        date: new Date(),
        subtotal: Number(subtotal),
        taxAmount: Number(taxAmount),
        discount: Number(discount || 0),
        tips: Number(tips || 0),
        totalAmount: Number(totalAmount),
        amountPaid: Number(amountPaid || totalAmount),
        paymentMethod: paymentMethod || "CASH",
        status: status || "PAID",
        items: {
          create: (items as any[]).map((item: any) => ({
            description: item.name || item.description,
            quantity: item.quantity,
            rate: item.rate,
            discount: item.discount || 0,
            taxableAmt: item.taxableAmt || item.rate * item.quantity,
            cgst: item.cgst || 0,
            sgst: item.sgst || 0,
            total: item.total || item.rate * item.quantity,
          })),
        },
      },
    });

    // Update client loyalty points & visit count
    if (clientId) {
      const pointsEarned = Math.floor(Number(totalAmount) / 100);
      await prisma.client.updateMany({
        where: { id: clientId, tenantId },
        data: {
          visitCount: { increment: 1 },
          totalSpent: { increment: Number(totalAmount) },
          loyaltyPoints: { increment: pointsEarned },
          lastVisit: new Date(),
        },
      });
    }

    return NextResponse.json({ ...invoice, invoiceNumber }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
