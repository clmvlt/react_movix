import { MapFlyTo, MapMarker, MapView, type LngLat } from "@/components/map";
import { brand } from "@/lib/colors";

interface AccountDepotMapProps {
  longitude: number;
  latitude: number;
  title: string;
  zoom?: number;
  draggable?: boolean;
  focus?: LngLat | null;
  focusToken?: number;
  onMove?: (longitude: number, latitude: number) => void;
}

export function AccountDepotMap({
  longitude,
  latitude,
  title,
  zoom = 12,
  draggable = true,
  focus,
  focusToken,
  onMove,
}: AccountDepotMapProps) {
  return (
    <MapView center={[longitude, latitude]} zoom={zoom} className="size-full">
      <MapMarker
        longitude={longitude}
        latitude={latitude}
        color={brand[800]}
        selectedColor={brand[500]}
        selected
        title={title}
        draggable={draggable}
        onDragEnd={onMove}
      />
      <MapFlyTo center={focus ?? null} zoom={15} token={focusToken} />
    </MapView>
  );
}
