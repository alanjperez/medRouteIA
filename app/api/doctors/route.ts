import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const doctors = await prisma.doctor.findMany({
    where: { active: true },
    include: { officeHours: { orderBy: { dayOfWeek: "asc" } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(doctors);
}

type OfficeHourInput = { dayOfWeek: number; openTime: string; closeTime: string };

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, specialty, address, latitude, longitude, phone, notes, dailyCapacity, officeHours } =
    body as {
      name: string;
      specialty?: string;
      address: string;
      latitude: number;
      longitude: number;
      phone?: string;
      notes?: string;
      dailyCapacity?: number;
      officeHours: OfficeHourInput[];
    };

  if (!name || !address || latitude === undefined || longitude === undefined) {
    return NextResponse.json(
      { error: "name, address, latitude y longitude son obligatorios" },
      { status: 400 }
    );
  }

  const doctor = await prisma.doctor.create({
    data: {
      name,
      specialty,
      address,
      latitude,
      longitude,
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
