import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Crosshair, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineSpinner } from "@/components/full-page-spinner";
import { AddressSearch } from "@/components/address-search";
import { formatCoordinate, initialFormState, buildUpdatePayload } from "@/components/pharmacies/pharmacy-form";
import {
  commandMapPoints,
  hasValidLocation,
} from "@/components/pharmacies/pharmacy-utils";
import { FRANCE_CENTER, averageLngLat } from "@/lib/geo";
import { useAuth } from "@/app/auth-context";
import { useToast } from "@/app/toast-context";
import { useUpdatePharmacy, type PharmacyDetail } from "@/features/pharmacies";
import { usePharmacyLastCommands } from "@/features/commands";
import type { AddressResult } from "@/features/ors";
import type { LngLat } from "@/components/map";

const PharmacyMap = lazy(() =>
  import("@/components/pharmacies/pharmacy-map").then((m) => ({
    default: m.PharmacyMap,
  }))
);

interface ReportPositionEditorProps {
  pharmacy: PharmacyDetail;
  onDirtyChange: (dirty: boolean) => void;
}

export function ReportPositionEditor({
  pharmacy,
  onDirtyChange,
}: ReportPositionEditorProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? "en";
  const { user } = useAuth();
  const toast = useToast();
  const lastCommands = usePharmacyLastCommands(pharmacy.cip);
  const updatePharmacy = useUpdatePharmacy();

  const [override, setOverride] = useState<LngLat | null>(null);
  const [focus, setFocus] = useState<{ center: LngLat; token: number } | null>(
    null
  );
  const located = hasValidLocation(pharmacy);
  const baseline: LngLat | null = located
    ? [pharmacy.longitude as number, pharmacy.latitude as number]
    : null;

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
    setFocus((prev) => ({
      center: [result.lon, result.lat],
      token: (prev?.token ?? 0) + 1,
    }));
  };

  const handleAverage = () => {
    const average = averageLngLat(
      deliveryPoints.map((point) => [point.longitude, point.latitude] as LngLat)
    );
    if (!average) return;
    applyCoordinates(average[0], average[1]);
    setFocus((prev) => ({
      center: average,
      token: (prev?.token ?? 0) + 1,
    }));
  };

  const handleCancel = () => {
    setOverride(null);
  };

  const handleSave = () => {
    if (!override) return;
    const form = {
      ...initialFormState(pharmacy),
      latitude: formatCoordinate(override[1]),
      longitude: formatCoordinate(override[0]),
    };
    const payload = buildUpdatePayload(form, pharmacy);
    if (Object.keys(payload).length === 0) {
      setOverride(null);
      return;
    }
    updatePharmacy.mutate(
      { cip: pharmacy.cip, input: payload },
      {
        onSuccess: () => {
          setOverride(null);
          toast.success(t("pharmacies.reports.positionSaved"));
        },
        onError: () => toast.error(t("pharmacies.form.failed")),
      }
    );
  };

  const displayed = override ?? baseline;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative h-72 overflow-hidden rounded-lg border border-border lg:h-80">
        <div className="absolute left-2 right-12 top-2 z-10">
          <AddressSearch
            onSelect={handleAddressSelect}
            near={override ?? baseline ?? depot}
            ariaLabel={t("pharmacies.info.searchAddress")}
            listClassName="max-h-48"
          />
        </div>
        <Suspense fallback={<InlineSpinner />}>
          <PharmacyMap
            marker={markerPosition}
            center={markerPosition}
            title={pharmacy.name?.trim() || pharmacy.cip}
            zoneId={pharmacy.zone?.id ?? null}
            draggable
            focus={focus?.center ?? null}
            focusToken={focus?.token}
            commands={deliveryPoints}
            fitAnchor={baseline}
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
          ? t("pharmacies.info.dragHint")
          : t("pharmacies.info.dragHintEmpty")}{" "}
        {t("pharmacies.info.searchHint")}
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
          {t("pharmacies.reports.useDeliveryAverage", {
            count: deliveryPoints.length,
          })}
        </Button>
        {lastCommands.isLoading ? (
          <p className="text-xs text-muted-foreground">
            {t("pharmacies.reports.loadingDeliveries")}
          </p>
        ) : deliveryPoints.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {t("pharmacies.reports.noDeliveryPoints")}
          </p>
        ) : null}
      </div>

      {dirty && (
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 lg:min-h-10"
            onClick={handleCancel}
            disabled={updatePharmacy.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            className="min-h-11 lg:min-h-10"
            onClick={handleSave}
            disabled={updatePharmacy.isPending}
          >
            {updatePharmacy.isPending && <Loader2 className="animate-spin" />}
            {t("pharmacies.reports.savePosition")}
          </Button>
        </div>
      )}
    </div>
  );
}
