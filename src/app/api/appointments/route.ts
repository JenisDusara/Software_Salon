import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    const tenantId = getTenantId();
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
    const shaped = appointments.map((a) => ({
      id: a.id,
      clientName: a.client?.name ?? a.walkInName ?? "Walk-in",
      serviceName: a.items.map((i) => i.service?.name ?? "").filter(Boolean).join(", "),
      staffName: a.staff?.name ?? "",
      time: a.startTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
      duration: Math.round((a.endTime.getTime() - a.startTime.getTime()) / 60000),
      status: a.status,
      amount: a.totalPrice,
    }));

    return NextResponse.json(shaped);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = getTenantId();
    const body = await req.json();
    const { clientId, walkInName, walkInPhone, staffId, serviceId, date, time, notes } = body;

    if (!staffId || !serviceId) {
      return NextResponse.json({ error: "Staff and service required" }, { status: 400 });
    }

    const service = await prisma.service.findFirst({ where: { id: serviceId, tenantId } });
    if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

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
        branchId: "b1-seed",
        clientId: clientId || null,
        walkInName: !clientId ? (walkInName || "Walk-in") : null,
        staffId,
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
