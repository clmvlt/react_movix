import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  DepotMarker,
  MapAutoFit,
  MapMarker,
  MapRoute,
  MapView,
  type LngLat,
} from "@/components/map";
import { commandMapColors } from "@/lib/colors";
import { FRANCE_CENTER, FRANCE_ZOOM } from "@/lib/geo";

const TRUCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>`;

const PACKAGE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73Z"/><path d="M12 22V12"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="m7.5 4.27 9 5.15"/></svg>`;

const CHECK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;

const ADDRESS_SIZE = 40;
const RECORDED_SIZE = 32;
const GAP_WIDTH = 3;

export interface CommandMapProps {
  senderAddress: LngLat | null;
  recipientAddress: LngLat | null;
  loadingPoint: LngLat | null;
  deliveryPoint: LngLat | null;
  senderTitle?: string;
  recipientTitle?: string;
  depot?: LngLat | null;
  depotTitle?: string;
  cooperativeGestures?: boolean;
}

export function CommandMap({
  senderAddress,
  recipientAddress,
  loadingPoint,
  deliveryPoint,
  senderTitle,
  recipientTitle,
  depot = null,
  depotTitle,
  cooperativeGestures = false,
}: CommandMapProps) {
  const { t } = useTranslation();

  const points = useMemo(
    () =>
      [
        senderAddress,
        recipientAddress,
        loadingPoint,
        deliveryPoint,
        depot,
      ].filter((point): point is LngLat => point !== null),
    [senderAddress, recipientAddress, loadingPoint, deliveryPoint, depot]
  );

  const center = recipientAddress ?? deliveryPoint ?? points[0] ?? FRANCE_CENTER;

  return (
    <MapView
      center={center}
      zoom={points.length > 0 ? 13 : FRANCE_ZOOM}
      cooperativeGestures={cooperativeGestures}
      className="absolute inset-0"
    >
      {depot && (
        <DepotMarker longitude={depot[0]} latitude={depot[1]} title={depotTitle} />
      )}

      {senderAddress && loadingPoint && (
        <MapRoute
          key={`sender-${senderAddress.join()}-${loadingPoint.join()}`}
          id="command-sender-gap"
          coordinates={[senderAddress, loadingPoint]}
          color={commandMapColors.sender}
          width={GAP_WIDTH}
        />
      )}
      {recipientAddress && deliveryPoint && (
        <MapRoute
          key={`recipient-${recipientAddress.join()}-${deliveryPoint.join()}`}
          id="command-recipient-gap"
          coordinates={[recipientAddress, deliveryPoint]}
          color={commandMapColors.recipient}
          width={GAP_WIDTH}
        />
      )}

      {senderAddress && (
        <MapMarker
          longitude={senderAddress[0]}
          latitude={senderAddress[1]}
          color={commandMapColors.sender}
          icon={TRUCK_ICON}
          size={ADDRESS_SIZE}
          title={senderTitle ?? t("commands.proofs.legendSender")}
        />
      )}
      {recipientAddress && (
        <MapMarker
          longitude={recipientAddress[0]}
          latitude={recipientAddress[1]}
          color={commandMapColors.recipient}
          icon={PACKAGE_ICON}
          size={ADDRESS_SIZE}
          title={recipientTitle ?? t("commands.proofs.legendRecipient")}
        />
      )}
      {loadingPoint && (
        <MapMarker
          longitude={loadingPoint[0]}
          latitude={loadingPoint[1]}
          color={commandMapColors.sender}
          icon={CHECK_ICON}
          size={RECORDED_SIZE}
          title={t("commands.proofs.legendLoading")}
        />
      )}
      {deliveryPoint && (
        <MapMarker
          longitude={deliveryPoint[0]}
          latitude={deliveryPoint[1]}
          color={commandMapColors.recipient}
          icon={CHECK_ICON}
          size={RECORDED_SIZE}
          title={t("commands.proofs.legendDelivery")}
        />
      )}

      {points.length > 0 && <MapAutoFit points={points} />}
    </MapView>
  );
}
