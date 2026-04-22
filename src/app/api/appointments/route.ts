import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveTenant } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    const tenantId = await resolveTenant();
    if (tenantId instanceof NextResponse) return tenantId;
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date"); // ISO date string

    const startOfDay = date ? new Date(date) : new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        tenantId,
        date: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        client: { select: { name: true, phone: true } },
        staff: { select: { name: true } },
        items: { include: { service: { select: { name: true } } } },
      },
      orderBy: { startTime: "asc" },
    });

    // Shape data for frontend
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shaped = (appointments as any[]).map((a) => ({
      id: String(a.id),
      clientId: a.clientId ?? null,
      clientName: String(a.client?.name ?? a.walkInName ?? "Walk-in"),
      serviceName: (a.items ?? [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((i: any) => i?.service?.name ?? "")
        .filter(Boolean)
        .join(", "),
      staffName: String(a.staff?.name ?? ""),
      time: String(
        (a.startTime as Date).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      ),
      startTimeISO: (a.startTime as Date).toISOString(),
      duration: Math.round(
        ((a.endTime as Date).getTime() - (a.startTime as Date).getTime()) / 60000
      ),
      status: String(a.status),
      amount: Number(a.totalPrice),
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
    const { clientId, walkInName, staffId, serviceId, date, time, notes } = body;

    if (!serviceId) {
      return NextResponse.json({ error: "Service required" }, { status: 400 });
    }

    const service = await prisma.service.findFirst({ where: { id: serviceId, tenantId } });
    if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

    const branch = await prisma.branch.findFirst({ where: { tenantId } });
    if (!branch) return NextResponse.json({ error: "No branch found" }, { status: 400 });

    const apptDate = new Date(date);
    apptDate.setHours(0, 0, 0, 0);

    const [hours, minutes] = (time as string).split(":").map(Number);
    const startTime = new Date(apptDate);
    startTime.setHours(hours, minutes, 0, 0);
    const endTime = new Date(startTime.getTime() + service.duration * 60000);

    // Update client lastVisit if existing client
    if (clientId) {
      await prisma.client.updateMany({
        where: { id: clientId, tenantId },
        data: { lastVisit: apptDate },
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        tenantId,
        branchId: branch.id,
        clientId: clientId || null,
        walkInName: !clientId ? (walkInName || "Walk-in") : null,
        staffId: staffId || null,
        date: apptDate,
        startTime,
        endTime,
        status: "CONFIRMED",
        totalPrice: service.price,
        notes: notes || null,
        items: { create: [{ serviceId, price: service.price }] },
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
