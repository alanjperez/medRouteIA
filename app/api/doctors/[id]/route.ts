import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/doctors/[id]">) {
  const { id } = await ctx.params;
  const doctor = await prisma.doctor.findUnique({
    where: { id: Number(id) },
    include: {
      officeHours: { orderBy: { dayOfWeek: "asc" } },
      visits: { orderBy: { date: "desc" } },
    },
  });
  if (!doctor) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(doctor);
}

type OfficeHourInput = { dayOfWeek: number; openTime: string; closeTime: string };

export async function PUT(request: NextRequest, ctx: RouteContext<"/api/doctors/[id]">) {
  const { id } = await ctx.params;
  const doctorId = Number(id);
  const body = await request.json();
  const { name, specialty, address, latitude, longitude, phone, notes, dailyCapacity, active, officeHours } =
    body as {
      name: string;
      specialty?: string;
      address: string;
      latitude: number;
      longitude: number;
      phone?: string;
      notes?: string;
      dailyCapacity?: number;
      active?: boolean;
      officeHours?: OfficeHourInput[];
    };

  const doctor = await prisma.$transaction(async (tx) => {
    if (officeHours) {
      await tx.officeHour.deleteMany({ where: { doctorId } });
    }
    return tx.doctor.update({
      where: { id: doctorId },
      data: {
        name,
        specialty,
        address,
        latitude,
        longitude,
        phone,
        notes,
        dailyCapacity,
        active,
        ...(officeHours
          ? {
              officeHours: {
                create: officeHours.map((oh) => ({
                  dayOfWeek: oh.dayOfWeek,
                  openTime: oh.openTime,
                  closeTime: oh.closeTime,
                })),
              },
            }
          : {}),
      },
      include: { officeHours: true },
    });
  });

  return NextResponse.json(doctor);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/doctors/[id]">) {
  const { id } = await ctx.params;
  await prisma.doctor.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
