import { useEffect } from "react";
import type { Map } from "mapbox-gl";
import { useMap } from "./use-map";
import type { LngLat } from "./map-utils";
import { PINS_LAYER_ID } from "./map-pins";

interface MapRouteProps {
  id: string;
  coordinates: LngLat[];
  color?: string;
  width?: number;
}

const ARROW_IMAGE_ID = "route-direction-arrow";

function ensureArrowImage(map: Map) {
  if (map.hasImage(ARROW_IMAGE_ID)) return;
  const size = 18;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.beginPath();
  ctx.moveTo(5, 3);
  ctx.lineTo(14, 9);
  ctx.lineTo(5, 15);
  ctx.closePath();
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.55)";
  ctx.lineJoin = "round";
  ctx.stroke();
  const image = ctx.getImageData(0, 0, size, size);
  map.addImage(ARROW_IMAGE_ID, image, { pixelRatio: 2 });
}

export function MapRoute({
  id,
  coordinates,
  color = "#2563eb",
  width = 4,
}: MapRouteProps) {
  const { map, loaded } = useMap();
  const sourceId = `route-${id}`;
  const lineLayerId = `route-line-${id}`;
  const arrowLayerId = `route-arrows-${id}`;
  const key = coordinates.length;

  useEffect(() => {
    if (!map || !loaded || coordinates.length < 2) return;

    const data = {
      type: "Feature" as const,
      properties: {},
      geometry: { type: "LineString" as const, coordinates },
    };

    const existing = map.getSource(sourceId) as
      { setData: (value: typeof data) => void } | undefined;

    if (existing) {
      existing.setData(data);
    } else {
      ensureArrowImage(map);
      const beforeId = map.getLayer(PINS_LAYER_ID) ? PINS_LAYER_ID : undefined;
      map.addSource(sourceId, { type: "geojson", data });
      map.addLayer(
        {
          id: lineLayerId,
          type: "line",
          source: sourceId,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": color,
            "line-width": width,
            "line-opacity": 0.85,
          },
        },
        beforeId
      );
      map.addLayer(
        {
          id: arrowLayerId,
          type: "symbol",
          source: sourceId,
          layout: {
            "symbol-placement": "line",
            "symbol-spacing": 80,
            "icon-image": ARROW_IMAGE_ID,
            "icon-size": 0.9,
            "icon-rotation-alignment": "map",
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
          },
        },
        beforeId
      );
    }

    map.setPaintProperty(lineLayerId, "line-color", color);

    return () => {
      try {
        if (map.getLayer(arrowLayerId)) map.removeLayer(arrowLayerId);
        if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch {
        /* map already torn down */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, loaded, key, color, width]);

  return null;
}
