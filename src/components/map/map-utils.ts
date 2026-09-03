import mapboxgl from "mapbox-gl";
import { decodePolyline, type LngLat } from "@/lib/polyline";

export { decodePolyline };
export type { LngLat };

export function boundsFromPoints(points: LngLat[]): mapboxgl.LngLatBounds | null {
  if (points.length === 0) return null;
  const bounds = new mapboxgl.LngLatBounds();
  for (const point of points) bounds.extend(point);
  return bounds;
}

function extractCoordinates(parsed: unknown): LngLat[] {
  if (Array.isArray(parsed)) {
    return parsed
      .filter(
        (pair): pair is [number, number] =>
          Array.isArray(pair) &&
          pair.length >= 2 &&
          typeof pair[0] === "number" &&
          typeof pair[1] === "number"
      )
      .map((pair) => [pair[0], pair[1]]);
  }
  const obj = parsed as { type?: string; geometry?: unknown; coordinates?: unknown };
  if (obj?.type === "Feature") return extractCoordinates(obj.geometry);
  if (Array.isArray(obj?.coordinates)) return extractCoordinates(obj.coordinates);
  return [];
}

export function geometryToCoordinates(
  geometry: string | null | undefined
): LngLat[] {
  if (!geometry) return [];
  const trimmed = geometry.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const coords = extractCoordinates(JSON.parse(trimmed));
      if (coords.length >= 2) return coords;
    } catch {
      /* fall through to polyline decoding */
    }
  }
  return decodePolyline(trimmed);
}
