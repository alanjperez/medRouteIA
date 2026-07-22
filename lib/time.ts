// Time-of-day helpers. Times are always "HH:mm" 24h strings <-> minutes since midnight.

export function parseHM(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

export function formatHM(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

const DAY_NAMES_ES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export function dayNameEs(dayOfWeek: number): string {
  return DAY_NAMES_ES[dayOfWeek];
}

// weekStartDate must be an ISO date string ("YYYY-MM-DD") that falls on a Monday.
export function dateForWeekday(weekStartDate: string, dayOfWeek: number): string {
  const monday = new Date(`${weekStartDate}T00:00:00`);
  const offset = (dayOfWeek - 1 + 7) % 7;
  const target = new Date(monday);
  target.setDate(monday.getDate() + offset);
  return target.toISOString().slice(0, 10);
}
