import { useContext } from "react";
import { MapContext, type MapContextValue } from "./map-context";

export function useMap(): MapContextValue {
  return useContext(MapContext);
}
