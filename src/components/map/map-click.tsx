import { useEffect, useRef } from "react";
import type { MapMouseEvent } from "mapbox-gl";
import { useMap } from "./use-map";

interface MapClickProps {
  onClick: (longitude: number, latitude: number) => void;
  enabled?: boolean;
}

export function MapClick({ onClick, enabled = true }: MapClickProps) {
  const { map, loaded } = useMap();
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  useEffect(() => {
    if (!map || !loaded || !enabled) return;
    const handle = (event: MapMouseEvent) => {
      onClickRef.current(event.lngLat.lng, event.lngLat.lat);
    };
    const canvas = map.getCanvas();
    const previousCursor = canvas.style.cursor;
    canvas.style.cursor = "crosshair";
    map.on("click", handle);
    return () => {
      map.off("click", handle);
      canvas.style.cursor = previousCursor;
    };
  }, [map, loaded, enabled]);

  return null;
}
