import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveTenant } from "@/lib/tenant";

export async function GET() {
  try {
    const tenantId = await resolveTenant();
    if (tenantId instanceof NextResponse) return tenantId;
    const branches = await prisma.branch.findMany({
      where: { tenantId },
      select: { id: true, name: true, city: true, address: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(branches);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
