import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Crosshair, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineSpinner } from "@/components/full-page-spinner";
import { AddressSearch } from "@/components/address-search";
import {
  buildClientInput,
  initialClientForm,
} from "@/components/clients/client-form";
import { commandMapPoints } from "@/lib/command-points";
import {
  entityPosition,
  formatCoordinate,
  hasValidLocation,
} from "@/lib/address-form";
import { FRANCE_CENTER, averageLngLat } from "@/lib/geo";
import { useAuth } from "@/app/auth-context";
import { useToast } from "@/app/toast-context";
import {
  clientLabel,
  useUpdateClient,
  type Client,
} from "@/features/clients";
import { useClientLastCommands } from "@/features/commands";
import type { AddressResult } from "@/features/ors";
import type { LngLat } from "@/components/map";

const PlaceMap = lazy(() =>
  import("@/components/place-map").then((m) => ({
    default: m.PlaceMap,
  }))
);

interface ReportPositionEditorProps {
  client: Client;
  onDirtyChange: (dirty: boolean) => void;
}

export function ReportPositionEditor({
  client,
  onDirtyChange,
}: ReportPositionEditorProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? "en";
  const { user } = useAuth();
  const toast = useToast();
  const lastCommands = useClientLastCommands(client.id);
  const updateClient = useUpdateClient();

  const [override, setOverride] = useState<LngLat | null>(null);
  const [focus, setFocus] = useState<{ center: LngLat; token: number } | null>(
    null
  );
  const baseline = entityPosition(client);

  const account = user?.account;
  const depot: LngLat | null =
    account?.longitude != null && account?.latitude != null
      ? [account.longitude, account.latitude]
      : null;

  const markerPosition: LngLat = override ?? baseline ?? depot ?? FRANCE_CENTER;
  const markerLocated = (override ?? baseline) != null;

  const dirty =
    override != null &&
    (baseline == null ||
      override[0] !== baseline[0] ||
      override[1] !== baseline[1]);

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  const deliveryPoints = useMemo(
    () => commandMapPoints(lastCommands.data ?? [], lang).slice(0, 5),
    [lastCommands.data, lang]
  );

  const applyCoordinates = (longitude: number, latitude: number) => {
    setOverride([
      Number(formatCoordinate(longitude)),
      Number(formatCoordinate(latitude)),
    ]);
  };

  const handleAddressSelect = (result: AddressResult) => {
    applyCoordinates(result.lon, result.lat);
    setFocus((previous) => ({
      center: [result.lon, result.lat],
      token: (previous?.token ?? 0) + 1,
    }));
  };

  const handleAverage = () => {
    const average = averageLngLat(
      deliveryPoints.map((point) => [point.longitude, point.latitude] as LngLat)
    );
    if (!average) return;
    applyCoordinates(average[0], average[1]);
    setFocus((previous) => ({
      center: average,
      token: (previous?.token ?? 0) + 1,
    }));
  };

  const handleSave = () => {
    if (!override) return;
    const form = {
      ...initialClientForm(client),
      latitude: formatCoordinate(override[1]),
      longitude: formatCoordinate(override[0]),
    };
    updateClient.mutate(
      { id: client.id, input: buildClientInput(form) },
      {
        onSuccess: () => {
          setOverride(null);
          toast.success(t("clientReports.positionSaved"));
        },
        onError: () => toast.error(t("clients.errors.saveFailed")),
      }
    );
  };

  const displayed = override ?? baseline;
  const located = hasValidLocation(client);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative h-72 overflow-hidden rounded-lg border border-border lg:h-80">
        <div className="absolute left-2 right-12 top-2 z-10">
          <AddressSearch
            onSelect={handleAddressSelect}
            near={override ?? baseline ?? depot}
            ariaLabel={t("clients.info.findAddress")}
            listClassName="max-h-48"
          />
        </div>
        <Suspense fallback={<InlineSpinner />}>
          <PlaceMap
            marker={markerPosition}
            center={markerPosition}
            title={clientLabel(client)}
            zoneId={client.zone?.id ?? null}
            draggable
            focus={focus?.center ?? null}
            focusToken={focus?.token}
            commands={deliveryPoints}
            fitAnchor={located ? baseline : null}
            onMove={applyCoordinates}
          />
        </Suspense>
      </div>

      <p className="text-xs text-muted-foreground">
        {displayed && (
          <span className="tabular-nums">
            {formatCoordinate(displayed[1])}, {formatCoordinate(displayed[0])}
            {" - "}
          </span>
        )}
        {markerLocated
          ? t("clientReports.info.dragHint")
          : t("clientReports.info.dragHintEmpty")}{" "}
        {t("clientReports.info.searchHint")}
      </p>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full lg:min-h-10"
          onClick={handleAverage}
          disabled={deliveryPoints.length === 0}
        >
          <Crosshair className="size-4" />
          {t("clientReports.useDeliveryAverage", {
            count: deliveryPoints.length,
          })}
        </Button>
        {lastCommands.isLoading ? (
          <p className="text-xs text-muted-foreground">
            {t("clientReports.loadingDeliveries")}
          </p>
        ) : deliveryPoints.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {t("clientReports.noDeliveryPoints")}
          </p>
        ) : null}
      </div>

      {dirty && (
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 lg:min-h-10"
            onClick={() => setOverride(null)}
            disabled={updateClient.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            className="min-h-11 lg:min-h-10"
            onClick={handleSave}
            disabled={updateClient.isPending}
          >
            {updateClient.isPending && <Loader2 className="animate-spin" />}
            {t("clientReports.savePosition")}
          </Button>
        </div>
      )}
    </div>
  );
}
