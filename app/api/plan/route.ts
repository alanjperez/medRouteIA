import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildWeeklyPlan, type PlannerDoctor } from "@/lib/planner";

const DEFAULT_WORK_DAYS = [1, 2, 3, 4, 5];
const DEFAULT_VISIT_MINUTES = 20;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    homeLatitude,
    homeLongitude,
    weekStartDate,
    doctorIds,
    workDays,
    dayStart,
    dayEnd,
    defaultVisitMinutes,
  } = body as {
    homeLatitude: number;
    homeLongitude: number;
    weekStartDate: string;
    doctorIds?: number[];
    workDays?: number[];
    dayStart?: string;
    dayEnd?: string;
    defaultVisitMinutes?: number;
  };

  if (homeLatitude === undefined || homeLongitude === undefined || !weekStartDate) {
    return NextResponse.json(
      { error: "homeLatitude, homeLongitude y weekStartDate son obligatorios" },
      { status: 400 }
    );
  }

  const doctors = await prisma.doctor.findMany({
    where: {
      active: true,
      ...(doctorIds && doctorIds.length ? { id: { in: doctorIds } } : {}),
    },
    include: { officeHours: true },
  });

  const plannerDoctors: PlannerDoctor[] = await Promise.all(
    doctors.map(async (doctor) => {
      const aggregate = await prisma.visit.aggregate({
        where: { doctorId: doctor.id },
        _avg: { durationMin: true },
      });
      const avg = aggregate._avg.durationMin;
      return {
        id: doctor.id,
        name: doctor.name,
        address: doctor.address,
        latitude: doctor.latitude,
        longitude: doctor.longitude,
        dailyCapacity: doctor.dailyCapacity,
        officeHours: doctor.officeHours.map((oh) => ({
          dayOfWeek: oh.dayOfWeek,
          openTime: oh.openTime,
          closeTime: oh.closeTime,
        })),
        avgVisitMinutes: avg !== null ? Math.round(avg) : defaultVisitMinutes ?? DEFAULT_VISIT_MINUTES,
        hasHistory: avg !== null,
      };
    })
  );

  const result = buildWeeklyPlan({
    doctors: plannerDoctors,
    home: { latitude: homeLatitude, longitude: homeLongitude },
    weekStartDate,
    workDays: workDays ?? DEFAULT_WORK_DAYS,
    dayStart: dayStart ?? "08:00",
    dayEnd: dayEnd ?? "17:00",
    defaultVisitMinutes: defaultVisitMinutes ?? DEFAULT_VISIT_MINUTES,
  });

  return NextResponse.json(result);
}
