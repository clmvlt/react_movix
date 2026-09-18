import type { LngLat } from "@/lib/polyline";

export const FRANCE_CENTER: LngLat = [2.3522, 46.6];
export const FRANCE_ZOOM = 4.6;

export function averageLngLat(points: LngLat[]): LngLat | null {
  if (points.length === 0) return null;
  let longitude = 0;
  let latitude = 0;
  for (const [lng, lat] of points) {
    longitude += lng;
    latitude += lat;
  }
  return [longitude / points.length, latitude / points.length];
}

const EARTH_RADIUS_M = 6371000;

export function distanceMeters(a: LngLat, b: LngLat): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const [lngA, latA] = a;
  const [lngB, latB] = b;
  const dLat = toRadians(latB - latA);
  const dLng = toRadians(lngB - lngA);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRadians(latA)) * Math.cos(toRadians(latB)) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}
