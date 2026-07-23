import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { buildWeeklyPlan, type PlannerDoctor } from "@/lib/planner";
import { GUATEMALA_DEPARTMENTS, GUATEMALA_CITY_ZONES, isCapitalCity } from "@/lib/guatemala-locations";

const DEFAULT_WORK_DAYS = [1, 2, 3, 4, 5];
const DEFAULT_VISIT_MINUTES = 20;

export async function POST(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const {
    homeDepartment,
    homeMunicipality,
    homeZone,
    weekStartDate,
    doctorIds,
    workDays,
    dayStart,
    dayEnd,
    defaultVisitMinutes,
  } = body as {
    homeDepartment: string;
    homeMunicipality: string;
    homeZone?: number;
    weekStartDate: string;
    doctorIds?: number[];
    workDays?: number[];
    dayStart?: string;
    dayEnd?: string;
    defaultVisitMinutes?: number;
  };

  if (!homeDepartment || !homeMunicipality || !weekStartDate) {
    return NextResponse.json(
      { error: "homeDepartment, homeMunicipality y weekStartDate son obligatorios" },
      { status: 400 }
    );
  }

  const homeMunicipalities = GUATEMALA_DEPARTMENTS[homeDepartment];
  if (!homeMunicipalities || !homeMunicipalities.includes(homeMunicipality)) {
    return NextResponse.json({ error: "Departamento o municipio de partida inválido" }, { status: 400 });
  }
  const homeIsCapital = isCapitalCity(homeDepartment, homeMunicipality);
  if (homeIsCapital && (homeZone === undefined || !GUATEMALA_CITY_ZONES.includes(homeZone))) {
    return NextResponse.json(
      { error: "Selecciona una zona válida de partida en la Ciudad de Guatemala" },
      { status: 400 }
    );
  }

  const doctors = await prisma.doctor.findMany({
    where: {
      userId: sessionUser.id,
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
        department: doctor.department,
        municipality: doctor.municipality,
        zone: doctor.zone,
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
    home: {
      department: homeDepartment,
      municipality: homeMunicipality,
      zone: homeIsCapital ? homeZone : null,
    },
    weekStartDate,
    workDays: workDays ?? DEFAULT_WORK_DAYS,
    dayStart: dayStart ?? "08:00",
    dayEnd: dayEnd ?? "17:00",
    defaultVisitMinutes: defaultVisitMinutes ?? DEFAULT_VISIT_MINUTES,
  });

  return NextResponse.json(result);
}
