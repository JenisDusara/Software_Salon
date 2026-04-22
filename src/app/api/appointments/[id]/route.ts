import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveTenant } from "@/lib/tenant";

const VALID_STATUSES = ["CONFIRMED", "PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"];

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = await resolveTenant();
    if (tenantId instanceof NextResponse) return tenantId;

    const appt = await prisma.appointment.findFirst({
      where: { id: params.id, tenantId },
      include: {
        client: { select: { id: true, name: true, phone: true, loyaltyPoints: true } },
        staff: { select: { id: true, name: true } },
        items: {
          include: {
            service: { select: { id: true, name: true, price: true, duration: true, gstRate: true } },
          },
        },
      },
    });

    if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      id: appt.id,
      status: appt.status,
      clientId: appt.client?.id ?? null,
      clientName: appt.client?.name ?? (appt as any).walkInName ?? "Walk-in",
      clientPhone: appt.client?.phone ?? null,
      clientLoyaltyPoints: appt.client?.loyaltyPoints ?? 0,
      staffId: appt.staff?.id ?? null,
      staffName: appt.staff?.name ?? null,
      services: ((appt.items ?? []) as any[])
        .filter((i) => i.service)
        .map((i) => ({
          serviceId: i.service.id,
          name: i.service.name,
          price: Number(i.price ?? i.service.price),
          duration: i.service.duration ?? 30,
          gstRate: i.service.gstRate ?? 18,
        })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = await resolveTenant();
    if (tenantId instanceof NextResponse) return tenantId;

    const body = await req.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const existing = await prisma.appointment.findFirst({
      where: { id: params.id, tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const updated = await prisma.appointment.update({
      where: { id: params.id },
      data: { status },
    });

    return NextResponse.json({ id: updated.id, status: updated.status });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
