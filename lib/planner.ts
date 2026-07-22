import { haversineDistanceKm, estimateTravelMinutes, type LatLng } from "@/lib/geo";
import { parseHM, formatHM, dateForWeekday } from "@/lib/time";

export type PlannerOfficeHour = {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
};

export type PlannerDoctor = LatLng & {
  id: number;
  name: string;
  address: string;
  dailyCapacity: number;
  officeHours: PlannerOfficeHour[];
  avgVisitMinutes: number;
  hasHistory: boolean;
};

export type PlannerInput = {
  doctors: PlannerDoctor[];
  home: LatLng;
  weekStartDate: string; // ISO date, must fall on a Monday
  workDays: number[]; // 0=Sun..6=Sat
  dayStart: string; // "HH:mm"
  dayEnd: string; // "HH:mm"
  defaultVisitMinutes: number;
};

export type PlannerStop = {
  doctorId: number;
  doctorName: string;
  address: string;
  arrival: string;
  departure: string;
  travelMinutes: number;
  visitMinutes: number;
  usedDefaultDuration: boolean;
  warning?: string;
};

export type PlannerDay = {
  dayOfWeek: number;
  date: string;
  stops: PlannerStop[];
  totalTravelMinutes: number;
  totalVisitMinutes: number;
  returnHomeTime: string;
};

export type PlannerResult = {
  days: PlannerDay[];
  unscheduled: { doctorId: number; doctorName: string; reason: string }[];
};

// Greedy weekly scheduler:
//   1. Assign each doctor to the eligible day with the lowest projected load,
//      weighting in geographic proximity to doctors already on that day
//      (most-constrained-first: doctors open fewer days get placed first).
//   2. Within each day, build a route with a nearest-neighbour heuristic
//      starting and ending at `home`, respecting each office's open hours.
export function buildWeeklyPlan(input: PlannerInput): PlannerResult {
  const { doctors, home, weekStartDate, workDays, dayStart, dayEnd, defaultVisitMinutes } = input;

  const unscheduled: PlannerResult["unscheduled"] = [];

  const withEligibility = doctors.map((doctor) => ({
    doctor: {
      ...doctor,
      avgVisitMinutes: doctor.hasHistory ? doctor.avgVisitMinutes : defaultVisitMinutes,
    },
    eligibleDays: workDays.filter((wd) => doctor.officeHours.some((oh) => oh.dayOfWeek === wd)),
  }));

  const assignable = withEligibility.filter(({ doctor, eligibleDays }) => {
    if (eligibleDays.length === 0) {
      unscheduled.push({
        doctorId: doctor.id,
        doctorName: doctor.name,
        reason: "Sin horario de atención configurado para los días laborables seleccionados",
      });
      return false;
    }
    return true;
  });

  // Most-constrained-first, then doctors with tighter daily capacity (queues fill faster).
  assignable.sort(
    (a, b) =>
      a.eligibleDays.length - b.eligibleDays.length ||
      a.doctor.dailyCapacity - b.doctor.dailyCapacity
  );

  const dayBuckets = new Map<number, PlannerDoctor[]>();
  workDays.forEach((wd) => dayBuckets.set(wd, []));

  for (const { doctor, eligibleDays } of assignable) {
    let bestDay = eligibleDays[0];
    let bestScore = Infinity;
    for (const day of eligibleDays) {
      const bucket = dayBuckets.get(day)!;
      const loadMinutes = bucket.reduce((s, d) => s + d.avgVisitMinutes, 0);
      const avgDistanceKm = bucket.length
        ? bucket.reduce((s, d) => s + haversineDistanceKm(d, doctor), 0) / bucket.length
        : 0;
      const score = loadMinutes + avgDistanceKm * 2;
      if (score < bestScore) {
        bestScore = score;
        bestDay = day;
      }
    }
    dayBuckets.get(bestDay)!.push(doctor);
  }

  const dayEndMin = parseHM(dayEnd);
  const days: PlannerDay[] = workDays.map((wd) => {
    const bucket = [...dayBuckets.get(wd)!];
    const date = dateForWeekday(weekStartDate, wd);

    if (bucket.length === 0) {
      return {
        dayOfWeek: wd,
        date,
        stops: [],
        totalTravelMinutes: 0,
        totalVisitMinutes: 0,
        returnHomeTime: dayStart,
      };
    }

    let current: LatLng = home;
    let clock = parseHM(dayStart);
    const stops: PlannerStop[] = [];

    while (bucket.length > 0) {
      let nearestIdx = 0;
      let nearestDist = Infinity;
      bucket.forEach((doc, idx) => {
        const dist = haversineDistanceKm(current, doc);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = idx;
        }
      });
      const doc = bucket.splice(nearestIdx, 1)[0];

      const travel = estimateTravelMinutes(current, doc);
      let arrival = clock + travel;

      const officeHour = doc.officeHours.find((oh) => oh.dayOfWeek === wd)!;
      const openMin = parseHM(officeHour.openTime);
      const closeMin = parseHM(officeHour.closeTime);

      let warning: string | undefined;
      if (arrival < openMin) {
        arrival = openMin;
        warning = `Llegada antes de la apertura, se ajustó a las ${officeHour.openTime}`;
      } else if (arrival >= closeMin) {
        warning = `La llegada estimada (${formatHM(arrival)}) supera el cierre (${officeHour.closeTime})`;
      }

      const visitMinutes = doc.avgVisitMinutes;
      const departure = arrival + visitMinutes;
      if (!warning && departure > closeMin) {
        warning = `La visita podría exceder el horario de cierre (${officeHour.closeTime})`;
      }
      if (!warning && departure > dayEndMin) {
        warning = `La visita termina después de tu jornada (${dayEnd})`;
      }

      stops.push({
        doctorId: doc.id,
        doctorName: doc.name,
        address: doc.address,
        arrival: formatHM(arrival),
        departure: formatHM(departure),
        travelMinutes: travel,
        visitMinutes,
        usedDefaultDuration: !doc.hasHistory,
        warning,
      });

      clock = departure;
      current = doc;
    }

    const travelHome = estimateTravelMinutes(current, home);
    return {
      dayOfWeek: wd,
      date,
      stops,
      totalTravelMinutes: stops.reduce((s, x) => s + x.travelMinutes, 0) + travelHome,
      totalVisitMinutes: stops.reduce((s, x) => s + x.visitMinutes, 0),
      returnHomeTime: formatHM(clock + travelHome),
    };
  });

  return { days, unscheduled };
}
