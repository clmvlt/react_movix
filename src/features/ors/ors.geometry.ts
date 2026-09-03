import { decodePolyline, type LngLat } from "@/lib/polyline";
import type { OrsPoint } from "./types";

export function orsPointsToLngLat(
  points: OrsPoint[] | null | undefined
): LngLat[] {
  if (!points) return [];
  return points
    .filter(
      (point) =>
        Array.isArray(point) &&
        point.length >= 2 &&
        Number.isFinite(point[0]) &&
        Number.isFinite(point[1])
    )
    .map((point) => [point[1], point[0]] as LngLat);
}

interface GeometryHolder {
  geometry?: OrsPoint[] | null;
  geometryPolyline?: string | null;
}

export function orsGeometryToLngLat(
  source: GeometryHolder | null | undefined
): LngLat[] {
  if (!source) return [];
  if (source.geometryPolyline) return decodePolyline(source.geometryPolyline);
  return orsPointsToLngLat(source.geometry);
}
