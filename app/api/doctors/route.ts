import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { validateSector, isCapitalCity } from "@/lib/guatemala-locations";

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const doctors = await prisma.doctor.findMany({
    where: { userId: sessionUser.id, active: true },
    include: { officeHours: { orderBy: { dayOfWeek: "asc" } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(doctors);
}

type OfficeHourInput = { dayOfWeek: number; openTime: string; closeTime: string };

export async function POST(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

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
    officeHours: OfficeHourInput[];
  };

  if (!name || !address || !department || !municipality) {
    return NextResponse.json(
      { error: "name, address, department y municipality son obligatorios" },
      { status: 400 }
    );
  }

  const sectorError = validateSector(department, municipality, zone);
  if (sectorError) {
    return NextResponse.json({ error: sectorError }, { status: 400 });
  }

  const doctor = await prisma.doctor.create({
    data: {
      userId: sessionUser.id,
      name,
      specialty,
      address,
      department,
      municipality,
      zone: isCapitalCity(department, municipality) ? zone : null,
      phone,
      notes,
      dailyCapacity: dailyCapacity ?? 1,
      officeHours: {
        create: (officeHours ?? []).map((oh) => ({
          dayOfWeek: oh.dayOfWeek,
          openTime: oh.openTime,
          closeTime: oh.closeTime,
        })),
      },
    },
    include: { officeHours: true },
  });

  return NextResponse.json(doctor, { status: 201 });
}
