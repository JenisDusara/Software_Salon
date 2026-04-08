import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";

export async function GET() {
  try {
    const tenantId = getTenantId();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const items = await prisma.invoiceItem.findMany({
      where: {
        invoice: {
          tenantId,
          date: { gte: startOfMonth },
          status: { in: ["PAID", "PARTIAL"] },
        },
      },
      select: { description: true, total: true },
    });

    const map: Record<string, number> = {};
    for (const item of items) {
      map[item.description] = (map[item.description] ?? 0) + item.total;
    }

    const result = Object.entries(map)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
