import { useEffect, useMemo, useRef } from "react";
import type {
  ExpressionSpecification,
  GeoJSONSource,
  Map,
  MapMouseEvent,
} from "mapbox-gl";
import { useMap } from "./use-map";

export interface MapPin {
  id: string;
  longitude: number;
  latitude: number;
  color: string;
}

export interface MapPinsProps {
  pins: MapPin[];
  selectedIds?: Iterable<string>;
  selectedColor?: string;
  onClick?: (id: string) => void;
}

interface ClickedFeature {
  properties?: Record<string, unknown> | null;
}

const SOURCE = "pins";
export const PINS_LAYER_ID = "pins-symbol";
const IMAGE_PREFIX = "pin:";
const PIN_WIDTH = 38;
const PIN_HEIGHT = 33;
const PIXEL_RATIO = 2;
const PIN_PATH = "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z";

function imageId(color: string): string {
  return `${IMAGE_PREFIX}${color.trim().toLowerCase()}`;
}

function drawPin(color: string): ImageData | null {
  const canvas = document.createElement("canvas");
  canvas.width = PIN_WIDTH * PIXEL_RATIO;
  canvas.height = PIN_HEIGHT * PIXEL_RATIO;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const scale = (PIN_WIDTH / 24) * PIXEL_RATIO;
  ctx.scale(scale, scale);
  ctx.translate(0, -1);
  const path = new Path2D(PIN_PATH);
  ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
  ctx.shadowBlur = 2;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = color;
  ctx.fill(path);
  ctx.shadowColor = "transparent";
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = "#ffffff";
  ctx.lineJoin = "round";
  ctx.stroke(path);
  ctx.beginPath();
  ctx.arc(12, 10, 3.2, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function ensureImage(map: Map, id: string) {
  if (!id.startsWith(IMAGE_PREFIX) || map.hasImage(id)) return;
  const image = drawPin(id.slice(IMAGE_PREFIX.length));
  if (image) map.addImage(id, image, { pixelRatio: PIXEL_RATIO });
}

function isSelected(ids: string[]): ExpressionSpecification {
  return ["in", ["get", "id"], ["literal", ids]] as ExpressionSpecification;
}

function iconImage(
  ids: string[],
  selectedColor: string
): ExpressionSpecification {
  return [
    "case",
    isSelected(ids),
    imageId(selectedColor),
    ["get", "icon"],
  ] as ExpressionSpecification;
}

function sortKey(ids: string[]): ExpressionSpecification {
  return ["case", isSelected(ids), 1, 0] as ExpressionSpecification;
}

export function MapPins({
  pins,
  selectedIds,
  selectedColor = "#7c3aed",
  onClick,
}: MapPinsProps) {
  const { map, loaded } = useMap();

  const data = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: pins.map((pin) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [pin.longitude, pin.latitude],
        },
        properties: { id: pin.id, icon: imageId(pin.color) },
      })),
    }),
    [pins]
  );

  const selected = useMemo(
    () => (selectedIds ? Array.from(selectedIds) : []),
    [selectedIds]
  );

  const dataRef = useRef(data);
  dataRef.current = data;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const selectedColorRef = useRef(selectedColor);
  selectedColorRef.current = selectedColor;
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  useEffect(() => {
    if (!map || !loaded) return;

    const handleMissingImage = (event: { id: string }) =>
      ensureImage(map, event.id);

    const install = () => {
      if (map.getSource(SOURCE)) return;
      map.addSource(SOURCE, { type: "geojson", data: dataRef.current });
      map.addLayer({
        id: PINS_LAYER_ID,
        type: "symbol",
        source: SOURCE,
        layout: {
          "icon-image": iconImage(
            selectedRef.current,
            selectedColorRef.current
          ),
          "icon-anchor": "bottom",
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
          "icon-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            0.6,
            10,
            0.85,
            13,
            1,
          ],
          "symbol-z-order": "source",
          "symbol-sort-key": sortKey(selectedRef.current),
        },
      });
    };

    map.on("styleimagemissing", handleMissingImage);
    install();
    map.on("styledata", install);

    return () => {
      map.off("styledata", install);
      map.off("styleimagemissing", handleMissingImage);
      try {
        if (map.getLayer(PINS_LAYER_ID)) map.removeLayer(PINS_LAYER_ID);
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
    if (!map || !loaded || !map.getLayer(PINS_LAYER_ID)) return;
    map.setLayoutProperty(
      PINS_LAYER_ID,
      "icon-image",
      iconImage(selected, selectedColor)
    );
    map.setLayoutProperty(PINS_LAYER_ID, "symbol-sort-key", sortKey(selected));
  }, [map, loaded, selected, selectedColor]);

  useEffect(() => {
    if (!map || !loaded) return;

    const handleClick = (event: MapMouseEvent) => {
      const feature = event.features?.[0] as ClickedFeature | undefined;
      const id = feature?.properties?.id;
      if (typeof id === "string" && id) onClickRef.current?.(id);
    };
    const enter = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const leave = () => {
      map.getCanvas().style.cursor = "";
    };

    map.on("click", PINS_LAYER_ID, handleClick);
    map.on("mouseenter", PINS_LAYER_ID, enter);
    map.on("mouseleave", PINS_LAYER_ID, leave);

    return () => {
      map.off("click", PINS_LAYER_ID, handleClick);
      map.off("mouseenter", PINS_LAYER_ID, enter);
      map.off("mouseleave", PINS_LAYER_ID, leave);
      try {
        map.getCanvas().style.cursor = "";
      } catch {
        /* map already torn down */
      }
    };
  }, [map, loaded]);

  return null;
}
