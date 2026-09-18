import { useEffect, useMemo, useRef } from "react";
import type {
  ExpressionSpecification,
  GeoJSONSource,
  MapMouseEvent,
} from "mapbox-gl";
import { useMap } from "./use-map";
import { brand, contrastTextOn, neutral } from "@/lib/colors";

export interface MapPoint {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
  color: string;
}

export interface MapPointsProps {
  points: MapPoint[];
  selectedIds?: string[];
  onTogglePoint?: (id: string) => void;
  clusterRadius?: number;
  clusterMaxZoom?: number;
}

interface ClickedFeature {
  properties?: Record<string, unknown> | null;
  geometry?: { type?: string; coordinates?: unknown };
}

const SOURCE = "zone-points";
const CLUSTER_LAYER = "zone-points-cluster";
const CLUSTER_COUNT_LAYER = "zone-points-cluster-count";
const POINT_LAYER = "zone-points-single";
const HIT_LAYER = "zone-points-hit";

function isSelected(ids: string[]): ExpressionSpecification {
  return ["in", ["get", "id"], ["literal", ids]] as ExpressionSpecification;
}

function strokeColor(ids: string[]): ExpressionSpecification {
  return [
    "case",
    isSelected(ids),
    brand[800],
    neutral.white,
  ] as ExpressionSpecification;
}

function strokeWidth(ids: string[]): ExpressionSpecification {
  return ["case", isSelected(ids), 4, 1.5] as ExpressionSpecification;
}

export function MapPoints({
  points,
  selectedIds = [],
  onTogglePoint,
  clusterRadius = 48,
  clusterMaxZoom = 13,
}: MapPointsProps) {
  const { map, loaded } = useMap();

  const data = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: points.map((point) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [point.longitude, point.latitude],
        },
        properties: {
          id: point.id,
          name: point.name,
          color: point.color,
        },
      })),
    }),
    [points]
  );

  const dataRef = useRef(data);
  dataRef.current = data;
  const selectionRef = useRef(selectedIds);
  selectionRef.current = selectedIds;
  const toggleRef = useRef(onTogglePoint);
  toggleRef.current = onTogglePoint;

  useEffect(() => {
    if (!map || !loaded) return;

    const install = () => {
      if (map.getSource(SOURCE)) return;

      map.addSource(SOURCE, {
        type: "geojson",
        data: dataRef.current,
        cluster: true,
        clusterRadius,
        clusterMaxZoom,
      });

      map.addLayer({
        id: CLUSTER_LAYER,
        type: "circle",
        source: SOURCE,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            brand[400],
            25,
            brand[500],
            100,
            brand[600],
          ],
          "circle-radius": ["step", ["get", "point_count"], 16, 25, 22, 100, 28],
          "circle-stroke-width": 2,
          "circle-stroke-color": neutral.white,
          "circle-opacity": 0.92,
        },
      });

      map.addLayer({
        id: CLUSTER_COUNT_LAYER,
        type: "symbol",
        source: SOURCE,
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 12,
          "text-allow-overlap": true,
        },
        paint: { "text-color": contrastTextOn(brand[500]) },
      });

      map.addLayer({
        id: POINT_LAYER,
        type: "circle",
        source: SOURCE,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": ["get", "color"],
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            6,
            4,
            11,
            7,
            15,
            10,
          ],
          "circle-stroke-color": strokeColor(selectionRef.current),
          "circle-stroke-width": strokeWidth(selectionRef.current),
        },
      });

      map.addLayer({
        id: HIT_LAYER,
        type: "circle",
        source: SOURCE,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            6,
            12,
            11,
            16,
            15,
            22,
          ],
          "circle-color": neutral.white,
          "circle-opacity": 0,
        },
      });
    };

    install();
    map.on("styledata", install);

    return () => {
      map.off("styledata", install);
      try {
        for (const layer of [
          HIT_LAYER,
          POINT_LAYER,
          CLUSTER_COUNT_LAYER,
          CLUSTER_LAYER,
        ]) {
          if (map.getLayer(layer)) map.removeLayer(layer);
        }
        if (map.getSource(SOURCE)) map.removeSource(SOURCE);
      } catch {
        /* map already torn down */
      }
    };
  }, [map, loaded, clusterRadius, clusterMaxZoom]);

  useEffect(() => {
    if (!map || !loaded) return;
    const source = map.getSource(SOURCE) as GeoJSONSource | undefined;
    source?.setData(data);
  }, [map, loaded, data]);

  useEffect(() => {
    if (!map || !loaded || !map.getLayer(POINT_LAYER)) return;
    map.setPaintProperty(
      POINT_LAYER,
      "circle-stroke-color",
      strokeColor(selectedIds)
    );
    map.setPaintProperty(
      POINT_LAYER,
      "circle-stroke-width",
      strokeWidth(selectedIds)
    );
  }, [map, loaded, selectedIds]);

  useEffect(() => {
    if (!map || !loaded) return;

    const handlePointClick = (event: MapMouseEvent) => {
      const feature = event.features?.[0] as ClickedFeature | undefined;
      const id = feature?.properties?.id;
      if (typeof id === "string" && id) toggleRef.current?.(id);
    };

    const handleClusterClick = (event: MapMouseEvent) => {
      const feature = event.features?.[0] as ClickedFeature | undefined;
      const clusterId = feature?.properties?.cluster_id;
      const coordinates = feature?.geometry?.coordinates;
      if (typeof clusterId !== "number" || !Array.isArray(coordinates)) return;
      const center = coordinates as [number, number];
      const source = map.getSource(SOURCE) as GeoJSONSource | undefined;
      source?.getClusterExpansionZoom(clusterId, (error, zoom) => {
        if (error || zoom == null) return;
        map.easeTo({ center, zoom, duration: 400 });
      });
    };

    const enter = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const leave = () => {
      map.getCanvas().style.cursor = "";
    };

    map.on("click", HIT_LAYER, handlePointClick);
    map.on("click", CLUSTER_LAYER, handleClusterClick);
    map.on("mouseenter", HIT_LAYER, enter);
    map.on("mouseleave", HIT_LAYER, leave);
    map.on("mouseenter", CLUSTER_LAYER, enter);
    map.on("mouseleave", CLUSTER_LAYER, leave);

    return () => {
      map.off("click", HIT_LAYER, handlePointClick);
      map.off("click", CLUSTER_LAYER, handleClusterClick);
      map.off("mouseenter", HIT_LAYER, enter);
      map.off("mouseleave", HIT_LAYER, leave);
      map.off("mouseenter", CLUSTER_LAYER, enter);
      map.off("mouseleave", CLUSTER_LAYER, leave);
      try {
        map.getCanvas().style.cursor = "";
      } catch {
        /* map already torn down */
      }
    };
  }, [map, loaded]);

  return null;
}
