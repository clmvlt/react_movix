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
