// Estimates travel time between two "sectores" (departamento + municipio +
// zona) without real coordinates or a routing API — used by the planner to
// order and cluster visits by proximity.

export type Sector = {
  department: string;
  municipality: string;
  zone?: number | null;
};

const SAME_ZONE_MIN = 12;
const SAME_MUNICIPALITY_MIN = 20;
const SAME_DEPARTMENT_MIN = 40;
const DIFFERENT_DEPARTMENT_MIN = 90;
// Extra minutes per unit of zone-number difference within the same municipio
// (a rough proxy for physical distance between zonas).
const ZONE_DIFFERENCE_FACTOR_MIN = 2;

// Estimated one-way travel time in minutes between two sectores.
export function estimateTravelMinutes(a: Sector, b: Sector): number {
  if (a.department !== b.department) return DIFFERENT_DEPARTMENT_MIN;
  if (a.municipality !== b.municipality) return SAME_DEPARTMENT_MIN;
  if (a.zone != null && b.zone != null) {
    if (a.zone === b.zone) return SAME_ZONE_MIN;
    return SAME_MUNICIPALITY_MIN + Math.abs(a.zone - b.zone) * ZONE_DIFFERENCE_FACTOR_MIN;
  }
  return SAME_MUNICIPALITY_MIN;
}
