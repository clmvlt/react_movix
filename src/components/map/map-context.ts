import { createContext } from "react";
import type { Map } from "mapbox-gl";

export interface MapContextValue {
  map: Map | null;
  loaded: boolean;
}

export const MapContext = createContext<MapContextValue>({
  map: null,
  loaded: false,
});
