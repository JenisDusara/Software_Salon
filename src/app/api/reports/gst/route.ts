import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveTenant } from "@/lib/tenant";

export async function GET() {
  try {
    const tenantId = await resolveTenant();
    if (tenantId instanceof NextResponse) return tenantId;
    const now = new Date();

    const months = Array.from({ length: 4 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (3 - i), 1);
      return {
        label: d.toLocaleDateString("en-IN", { month: "short" }),
        start: new Date(d.getFullYear(), d.getMonth(), 1),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),
      };
    });

    const data = await Promise.all(
      months.map(async ({ label, start, end }) => {
        const items = await prisma.invoiceItem.findMany({
          where: {
            invoice: {
              tenantId,
              date: { gte: start, lte: end },
              status: { in: ["PAID", "PARTIAL"] },
            },
          },
          select: { cgst: true, sgst: true, taxableAmt: true },
        });

        const collected = items.reduce((s, i) => s + i.cgst + i.sgst, 0);
        const taxableRevenue = items.reduce((s, i) => s + i.taxableAmt, 0);
        // Simplified: assume ~33% input tax credit reduces payable
        const payable = Math.max(0, Math.round(collected * 0.67));

        return {
          month: label,
          collected: Math.round(collected),
          payable,
          taxableRevenue: Math.round(taxableRevenue),
        };
      })
    );

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
