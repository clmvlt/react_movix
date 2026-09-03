import { useEffect, useState } from "react";
import { useMap } from "./use-map";
import { boundsFromPoints, type LngLat } from "./map-utils";

interface MapAutoFitProps {
  points: LngLat[];
  padding?: number;
  maxZoom?: number;
}

export function MapAutoFit({
  points,
  padding = 56,
  maxZoom = 14,
}: MapAutoFitProps) {
  const { map, loaded } = useMap();
  const [visible, setVisible] = useState(true);
  const key = points.map((p) => p.join(",")).join("|");

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
    if (!map || !loaded || !visible || points.length === 0) return;
    const bounds = boundsFromPoints(points);
    if (!bounds) return;
    map.fitBounds(bounds, { padding, maxZoom, duration: 400 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, loaded, visible, key, padding, maxZoom]);

  return null;
}
