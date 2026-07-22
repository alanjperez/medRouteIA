import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseHM } from "@/lib/time";

export async function GET(request: NextRequest) {
  const doctorId = request.nextUrl.searchParams.get("doctorId");
  const visits = await prisma.visit.findMany({
    where: doctorId ? { doctorId: Number(doctorId) } : undefined,
    include: { doctor: { select: { id: true, name: true } } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(visits);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { doctorId, date, arrivalTime, departureTime, notes } = body as {
    doctorId: number;
    date: string;
    arrivalTime: string;
    departureTime: string;
    notes?: string;
  };

  if (!doctorId || !date || !arrivalTime || !departureTime) {
    return NextResponse.json(
      { error: "doctorId, date, arrivalTime y departureTime son obligatorios" },
      { status: 400 }
    );
  }

  const durationMin = parseHM(departureTime) - parseHM(arrivalTime);
  if (durationMin <= 0) {
    return NextResponse.json(
      { error: "La hora de salida debe ser posterior a la hora de llegada" },
      { status: 400 }
    );
  }

  const visit = await prisma.visit.create({
    data: {
      doctorId,
      date: new Date(`${date}T00:00:00`),
      arrivalTime,
      departureTime,
      durationMin,
      notes,
    },
  });

  return NextResponse.json(visit, { status: 201 });
}
