import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    const tenantId = getTenantId();
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
