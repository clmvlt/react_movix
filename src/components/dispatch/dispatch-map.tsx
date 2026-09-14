import { useMemo, useState } from "react";
import {
  DepotMarker,
  MapAutoFit,
  MapMarker,
  MapPins,
  MapRoute,
  MapView,
  type LngLat,
  type MapPin,
} from "@/components/map";
import { safeCategoryColor, unassignedColor } from "@/lib/colors";
import { coarsePointer } from "@/lib/pointer";
import type { ProposalStop } from "./dispatch-plan";

export interface DispatchMapTour {
  key: string;
  color: string;
  coordinates: LngLat[];
  stops: ProposalStop[];
}

interface DispatchMapProps {
  tours: DispatchMapTour[];
  focusKey: string | null;
  depot: LngLat | null;
  depotLabel: string;
  version: number;
  onSelectTour: (key: string) => void;
}

const PIN_SEPARATOR = "|";

export function DispatchMap({
  tours,
  focusKey,
  depot,
  depotLabel,
  version,
  onSelectTour,
}: DispatchMapProps) {
  const [cooperative] = useState(coarsePointer);
  const focused = tours.find((tour) => tour.key === focusKey) ?? null;

  const colorOf = (tour: DispatchMapTour) =>
    focused && focused.key !== tour.key
      ? unassignedColor
      : safeCategoryColor(tour.color);

  const pins = useMemo<MapPin[]>(() => {
    const list: MapPin[] = [];
    for (const tour of tours) {
      if (focused && tour.key === focused.key) continue;
      const color = focused ? unassignedColor : safeCategoryColor(tour.color);
      tour.stops.forEach((stop, index) => {
        if (!stop.position) return;
        list.push({
          id: `${tour.key}${PIN_SEPARATOR}${index}`,
          longitude: stop.position[0],
          latitude: stop.position[1],
          color,
        });
      });
    }
    return list;
  }, [tours, focused]);

  const points = useMemo<LngLat[]>(() => {
    const list: LngLat[] = depot ? [depot] : [];
    for (const tour of focused ? [focused] : tours) {
      for (const stop of tour.stops) {
        if (stop.position) list.push(stop.position);
      }
    }
    return list;
  }, [tours, focused, depot]);

  const layered = focused
    ? [...tours.filter((tour) => tour.key !== focused.key), focused]
    : tours;

  return (
    <MapView
      center={depot ?? points[0]}
      zoom={9}
      cooperativeGestures={cooperative}
    >
      <MapAutoFit points={points} />
      {depot && (
        <DepotMarker longitude={depot[0]} latitude={depot[1]} title={depotLabel} />
      )}
      {layered.map((tour) =>
        tour.coordinates.length < 2 ? null : (
          <MapRoute
            key={`${version}-${tour.key}`}
            id={`dispatch-${tour.key}`}
            coordinates={tour.coordinates}
            color={colorOf(tour)}
            width={focused?.key === tour.key ? 6 : 4}
          />
        )
      )}
      <MapPins
        pins={pins}
        onClick={(id) => onSelectTour(id.split(PIN_SEPARATOR)[0])}
      />
      {focused?.stops.map((stop, index) =>
        stop.position ? (
          <MapMarker
            key={`${version}-${stop.key}-${index}`}
            longitude={stop.position[0]}
            latitude={stop.position[1]}
            color={safeCategoryColor(focused.color)}
            label={index + 1}
            title={stop.name}
            alert={stop.issue !== null}
            size={34}
          />
        ) : null
      )}
    </MapView>
  );
}
