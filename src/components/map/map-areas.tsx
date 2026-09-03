import { useEffect, useMemo, useRef } from "react";
import type { ExpressionSpecification, GeoJSONSource } from "mapbox-gl";
import { useMap } from "./use-map";
import type { LngLat } from "./map-utils";

export interface MapArea {
  id: string;
  color: string;
  points: LngLat[];
}

export interface MapAreasProps {
  areas: MapArea[];
  activeId?: string | null;
}

const SOURCE = "zone-areas";
const FILL_LAYER = "zone-areas-fill";
const LINE_LAYER = "zone-areas-line";

const BUFFER_LAT = 0.0035;
const BUFFER_SEGMENTS = 12;

function cross(o: LngLat, a: LngLat, b: LngLat): number {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

function convexHull(points: LngLat[]): LngLat[] {
  const sorted = Array.from(
    new Map(points.map((point) => [`${point[0]},${point[1]}`, point])).values()
  ).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (sorted.length <= 2) return sorted;
  const lower: LngLat[] = [];
  for (const point of sorted) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0
    ) {
      lower.pop();
    }
    lower.push(point);
  }
  const upper: LngLat[] = [];
  for (let index = sorted.length - 1; index >= 0; index -= 1) {
    const point = sorted[index];
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0
    ) {
      upper.pop();
    }
    upper.push(point);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

function areaPolygon(points: LngLat[]): LngLat[] | null {
  if (points.length === 0) return null;
  const hull = convexHull(points);
  const expanded: LngLat[] = [];
  for (const [lng, lat] of hull) {
    const radiusLat = BUFFER_LAT;
    const radiusLng =
      BUFFER_LAT / Math.max(Math.cos((lat * Math.PI) / 180), 0.2);
    for (let step = 0; step < BUFFER_SEGMENTS; step += 1) {
      const angle = (2 * Math.PI * step) / BUFFER_SEGMENTS;
      expanded.push([
        lng + radiusLng * Math.cos(angle),
        lat + radiusLat * Math.sin(angle),
      ]);
    }
  }
  const ring = convexHull(expanded);
  if (ring.length < 3) return null;
  ring.push(ring[0]);
  return ring;
}

function isActive(activeId: string | null): ExpressionSpecification {
  return [
    "==",
    ["get", "id"],
    activeId ?? "",
  ] as ExpressionSpecification;
}

function fillOpacity(activeId: string | null): ExpressionSpecification {
  return ["case", isActive(activeId), 0.16, 0.07] as ExpressionSpecification;
}

function lineWidth(activeId: string | null): ExpressionSpecification {
  return ["case", isActive(activeId), 2.5, 1.5] as ExpressionSpecification;
}

export function MapAreas({ areas, activeId = null }: MapAreasProps) {
  const { map, loaded } = useMap();

  const data = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: areas.flatMap((area) => {
        const ring = areaPolygon(area.points);
        if (!ring) return [];
        return [
          {
            type: "Feature" as const,
            geometry: { type: "Polygon" as const, coordinates: [ring] },
            properties: { id: area.id, color: area.color },
          },
        ];
      }),
    }),
    [areas]
  );

  const dataRef = useRef(data);
  dataRef.current = data;
  const activeRef = useRef(activeId);
  activeRef.current = activeId;

  useEffect(() => {
    if (!map || !loaded) return;

    const install = () => {
      if (map.getSource(SOURCE)) return;

      map.addSource(SOURCE, { type: "geojson", data: dataRef.current });

      map.addLayer({
        id: FILL_LAYER,
        type: "fill",
        source: SOURCE,
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": fillOpacity(activeRef.current),
        },
      });

      map.addLayer({
        id: LINE_LAYER,
        type: "line",
        source: SOURCE,
        layout: { "line-join": "round" },
        paint: {
          "line-color": ["get", "color"],
          "line-width": lineWidth(activeRef.current),
          "line-dasharray": [2, 2],
          "line-opacity": 0.9,
        },
      });
    };

    install();
    map.on("styledata", install);

    return () => {
      map.off("styledata", install);
      try {
        for (const layer of [LINE_LAYER, FILL_LAYER]) {
          if (map.getLayer(layer)) map.removeLayer(layer);
        }
        if (map.getSource(SOURCE)) map.removeSource(SOURCE);
      } catch {
        /* map already torn down */
      }
    };
  }, [map, loaded]);

  useEffect(() => {
    if (!map || !loaded) return;
    const source = map.getSource(SOURCE) as GeoJSONSource | undefined;
    source?.setData(data);
  }, [map, loaded, data]);

  useEffect(() => {
    if (!map || !loaded || !map.getLayer(FILL_LAYER)) return;
    map.setPaintProperty(FILL_LAYER, "fill-opacity", fillOpacity(activeId));
    map.setPaintProperty(LINE_LAYER, "line-width", lineWidth(activeId));
  }, [map, loaded, activeId]);

  return null;
}
