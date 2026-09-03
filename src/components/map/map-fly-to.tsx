import { useEffect, useState } from "react";
import { useMap } from "./use-map";
import type { LngLat } from "./map-utils";

interface MapFlyToProps {
  center: LngLat | null;
  zoom?: number;
  token?: number | string;
  duration?: number;
}

export function MapFlyTo({
  center,
  zoom,
  token,
  duration = 600,
}: MapFlyToProps) {
  const { map, loaded } = useMap();
  const [visible, setVisible] = useState(true);
  const longitude = center?.[0];
  const latitude = center?.[1];

  useEffect(() => {
    if (!map) return;
    const container = map.getContainer();
    const read = () =>
      setVisible(container.offsetWidth > 0 && container.offsetHeight > 0);
    const observer = new ResizeObserver(read);
    observer.observe(container);
    read();
    return () => observer.disconnect();
  }, [map]);

  useEffect(() => {
    if (!map || !loaded || !visible) return;
    if (longitude == null || latitude == null) return;
    map.easeTo({ center: [longitude, latitude], zoom, duration });
  }, [map, loaded, visible, longitude, latitude, zoom, token, duration]);

  return null;
}
