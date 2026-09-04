import { useEffect, useRef, useState, type ReactNode } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import i18n from "@/i18n";
import { useTheme } from "@/hooks/use-theme";
import { config } from "@/lib/config";
import { cn } from "@/lib/utils";
import { MapContext, type MapContextValue } from "./map-context";
import type { LngLat } from "./map-utils";

export interface MapViewProps {
  center?: LngLat;
  zoom?: number;
  styleUrl?: string;
  className?: string;
  interactive?: boolean;
  cooperativeGestures?: boolean;
  children?: ReactNode;
}

const DEFAULT_CENTER: LngLat = [2.3522, 46.6];
const LIGHT_STYLE = "mapbox://styles/mapbox/streets-v12";
const DARK_STYLE = "mapbox://styles/mapbox/dark-v11";

export function MapView({
  center = DEFAULT_CENTER,
  zoom = 5,
  styleUrl,
  className,
  interactive = true,
  cooperativeGestures = false,
  children,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isDark } = useTheme();
  const resolvedStyle = styleUrl ?? (isDark ? DARK_STYLE : LIGHT_STYLE);
  const [context, setContext] = useState<MapContextValue>({
    map: null,
    loaded: false,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!config.mapboxToken) {
      console.warn("[map] VITE_MAPBOX_TOKEN is empty. The map will not render.");
    }
    mapboxgl.accessToken = config.mapboxToken;

    const map = new mapboxgl.Map({
      container,
      style: resolvedStyle,
      center,
      zoom,
      interactive,
      cooperativeGestures,
      locale: {
        "ScrollZoomBlocker.CtrlMessage": i18n.t("map.cooperative.ctrl"),
        "ScrollZoomBlocker.CmdMessage": i18n.t("map.cooperative.cmd"),
        "TouchPanBlocker.Message": i18n.t("map.cooperative.touch"),
      },
    });
    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right"
    );

    setContext({ map, loaded: false });
    const handleLoad = () => setContext({ map, loaded: true });
    map.on("load", handleLoad);

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      map.off("load", handleLoad);
      map.remove();
      setContext({ map: null, loaded: false });
    };
    // Initialise once; runtime updates go through markers/children.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedStyle]);

  return (
    <MapContext.Provider value={context}>
      <div
        ref={containerRef}
        className={cn(
          "h-full w-full overflow-hidden rounded-xl [&_.mapboxgl-canvas]:rounded-xl",
          className
        )}
        role="application"
      />
      {children}
    </MapContext.Provider>
  );
}
