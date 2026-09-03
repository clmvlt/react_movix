import { MapMarker } from "./map-marker";

const DEPOT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"/><path d="M6 18h12"/><path d="M6 14h12"/><path d="M6 10h12"/></svg>`;
const DEPOT_COLOR = "#1e3a8a";

interface DepotMarkerProps {
  longitude: number;
  latitude: number;
  title?: string;
}

export function DepotMarker({ longitude, latitude, title }: DepotMarkerProps) {
  return (
    <MapMarker
      longitude={longitude}
      latitude={latitude}
      color={DEPOT_COLOR}
      icon={DEPOT_ICON}
      size={46}
      title={title}
    />
  );
}
