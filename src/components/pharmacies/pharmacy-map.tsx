import { useMemo } from "react";
import {
  DepotMarker,
  MapAutoFit,
  MapClick,
  MapFlyTo,
  MapMarker,
  MapView,
  type LngLat,
} from "@/components/map";
import {
  brand,
  categoryPalette,
  unassignedColor,
  zoneColor,
} from "@/lib/colors";
import { FRANCE_CENTER, FRANCE_ZOOM } from "@/lib/geo";

const COMMAND_COLOR = categoryPalette[4];
const LOCATED_ZOOM = 14;
const DEPOT_ZOOM = 11;

export interface PharmacyMapCommand {
  id: string;
  longitude: number;
  latitude: number;
  title?: string;
  label?: string | number;
}

interface PharmacyMapProps {
  marker: LngLat | null;
  center?: LngLat;
  zoom?: number;
  title: string;
  zoneId?: string | null;
  depot?: LngLat | null;
  depotTitle?: string;
  draggable?: boolean;
  markerSize?: number;
  focus?: LngLat | null;
  focusToken?: number;
  focusZoom?: number;
  commands?: PharmacyMapCommand[];
  fitAnchor?: LngLat | null;
  cooperativeGestures?: boolean;
  onMove?: (longitude: number, latitude: number) => void;
  onMapClick?: (longitude: number, latitude: number) => void;
}

export function PharmacyMap({
  marker,
  center,
  zoom,
  title,
  zoneId,
  depot = null,
  depotTitle,
  draggable = false,
  markerSize,
  focus,
  focusToken,
  focusZoom = 17,
  commands = [],
  fitAnchor = null,
  cooperativeGestures = false,
  onMove,
  onMapClick,
}: PharmacyMapProps) {
  const color = zoneId ? zoneColor(zoneId) : unassignedColor;
  const initialCenter = center ?? marker ?? depot ?? FRANCE_CENTER;
  const initialZoom =
    zoom ?? (marker ? LOCATED_ZOOM : depot ? DEPOT_ZOOM : FRANCE_ZOOM);

  const fitPoints = useMemo<LngLat[]>(() => {
    if (commands.length === 0) return [];
    const points = commands.map(
      (command) => [command.longitude, command.latitude] as LngLat
    );
    return fitAnchor ? [...points, fitAnchor] : points;
  }, [commands, fitAnchor]);

  return (
    <MapView
      center={initialCenter}
      zoom={initialZoom}
      cooperativeGestures={cooperativeGestures}
      className="absolute inset-0"
    >
      {depot && (
        <DepotMarker longitude={depot[0]} latitude={depot[1]} title={depotTitle} />
      )}
      {marker && (
        <MapMarker
          longitude={marker[0]}
          latitude={marker[1]}
          color={color}
          selectedColor={brand[500]}
          selected={draggable}
          title={title}
          size={markerSize}
          draggable={draggable}
          onDragEnd={onMove}
        />
      )}
      {commands.map((command) => (
        <MapMarker
          key={command.id}
          longitude={command.longitude}
          latitude={command.latitude}
          color={COMMAND_COLOR}
          size={30}
          title={command.title}
          label={command.label}
        />
      ))}
      {fitPoints.length > 0 && <MapAutoFit points={fitPoints} />}
      <MapFlyTo center={focus ?? null} zoom={focusZoom} token={focusToken} />
      {onMapClick && <MapClick onClick={onMapClick} />}
    </MapView>
  );
}
