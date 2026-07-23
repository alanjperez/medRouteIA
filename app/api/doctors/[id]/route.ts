import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { validateSector, isCapitalCity } from "@/lib/guatemala-locations";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/doctors/[id]">) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await ctx.params;
  const doctor = await prisma.doctor.findUnique({
    where: { id: Number(id) },
    include: {
      officeHours: { orderBy: { dayOfWeek: "asc" } },
      visits: { orderBy: { date: "desc" } },
    },
  });
  if (!doctor || doctor.userId !== sessionUser.id) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  return NextResponse.json(doctor);
}

type OfficeHourInput = { dayOfWeek: number; openTime: string; closeTime: string };

export async function PUT(request: NextRequest, ctx: RouteContext<"/api/doctors/[id]">) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await ctx.params;
  const doctorId = Number(id);

  const existing = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!existing || existing.userId !== sessionUser.id) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const body = await request.json();
  const {
    name,
    specialty,
    address,
    department,
    municipality,
    zone,
    phone,
    notes,
    dailyCapacity,
    active,
    officeHours,
  } = body as {
    name: string;
    specialty?: string;
    address: string;
    department: string;
    municipality: string;
    zone?: number;
    phone?: string;
    notes?: string;
    dailyCapacity?: number;
    active?: boolean;
    officeHours?: OfficeHourInput[];
  };

  if (department && municipality) {
    const sectorError = validateSector(department, municipality, zone);
    if (sectorError) {
      return NextResponse.json({ error: sectorError }, { status: 400 });
    }
  }

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
        department,
        municipality,
        zone: department && municipality ? (isCapitalCity(department, municipality) ? zone : null) : undefined,
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
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await ctx.params;
  const doctorId = Number(id);

  const existing = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!existing || existing.userId !== sessionUser.id) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  await prisma.doctor.delete({ where: { id: doctorId } });
  return NextResponse.json({ ok: true });
}
