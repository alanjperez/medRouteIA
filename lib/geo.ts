const EARTH_RADIUS_KM = 6371;

// Average city-driving speed used to translate distance into a travel-time
// estimate when no real routing API is configured.
const AVERAGE_SPEED_KMH = 28;

// Fixed overhead added to every trip (parking, walking in, reception, etc.).
const TRIP_OVERHEAD_MIN = 5;

export type LatLng = { latitude: number; longitude: number };

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineDistanceKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.asin(Math.sqrt(h));
}

// Estimated one-way travel time in minutes between two points.
export function estimateTravelMinutes(a: LatLng, b: LatLng): number {
  const distanceKm = haversineDistanceKm(a, b);
  const drivingMin = (distanceKm / AVERAGE_SPEED_KMH) * 60;
  return Math.round(drivingMin + TRIP_OVERHEAD_MIN);
}
