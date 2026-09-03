import { Suspense, lazy, useState } from "react";
import { useTranslation } from "react-i18next";
import { Crosshair } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InlineSpinner } from "@/components/full-page-spinner";
import { AddressSearch } from "@/components/address-search";
import type { LngLat } from "@/components/map";
import { FRANCE_CENTER, FRANCE_ZOOM } from "@/lib/geo";
import type { AddressResult } from "@/features/ors";
import { formatCoordinate, type AccountTabProps } from "./account-form";

const DepotMap = lazy(() =>
  import("./account-depot-map").then((module) => ({
    default: module.AccountDepotMap,
  }))
);

function parseCoordinate(value: string): number | null {
  const raw = value.trim().replace(",", ".");
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function AccountDepotTab({
  form,
  baseline,
  errors,
  set,
  disabled,
}: AccountTabProps) {
  const { t } = useTranslation();
  const [focus, setFocus] = useState<{ center: LngLat; token: number } | null>(
    null
  );

  const latitude = parseCoordinate(form.latitude);
  const longitude = parseCoordinate(form.longitude);
  const located = latitude != null && longitude != null;
  const position: LngLat | null = located ? [longitude, latitude] : null;
  const marker: LngLat = position ?? FRANCE_CENTER;
  const coordinateError = errors.latitude || errors.longitude || "";

  const applyCoordinates = (nextLon: number, nextLat: number) => {
    set("latitude", formatCoordinate(nextLat));
    set("longitude", formatCoordinate(nextLon));
  };

  const handleAddressSelect = (result: AddressResult) => {
    applyCoordinates(result.lon, result.lat);
    setFocus((previous) => ({
      center: [result.lon, result.lat],
      token: (previous?.token ?? 0) + 1,
    }));
  };

  const recenter = () => {
    if (!position) return;
    setFocus((previous) => ({
      center: position,
      token: (previous?.token ?? 0) + 1,
    }));
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("account.depot.title")}
          </CardTitle>
          <CardDescription>{t("account.depot.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Alert>
            <AlertDescription>
              {t("account.depot.usedForTours")}
            </AlertDescription>
          </Alert>

          {!located && (
            <Alert variant="warning">
              <AlertDescription>
                {t("account.depot.missingWarning")}
              </AlertDescription>
            </Alert>
          )}

          {coordinateError && (
            <Alert variant="destructive">
              <AlertDescription>{coordinateError}</AlertDescription>
            </Alert>
          )}

          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full lg:min-h-10 lg:w-auto lg:self-start"
            disabled={!located || disabled}
            onClick={recenter}
          >
            <Crosshair className="size-4" />
            {t("account.depot.recenter")}
          </Button>

          <div className="relative h-64 overflow-hidden rounded-xl border border-border sm:h-80 xl:h-[420px]">
            <div className="absolute left-2 right-12 top-2 z-10">
              <AddressSearch
                onSelect={handleAddressSelect}
                near={position}
                ariaLabel={t("account.depot.searchAddress")}
                listClassName="max-h-48 xl:max-h-72"
              />
            </div>
            <Suspense fallback={<InlineSpinner />}>
              <DepotMap
                longitude={marker[0]}
                latitude={marker[1]}
                zoom={located ? 12 : FRANCE_ZOOM}
                title={baseline.societe ?? t("account.depot.title")}
                draggable={!disabled}
                focus={focus?.center ?? null}
                focusToken={focus?.token}
                onMove={applyCoordinates}
              />
            </Suspense>
          </div>

          <p className="text-xs leading-4 text-muted-foreground">
            {located
              ? t("account.depot.dragHint")
              : t("account.depot.dragHintEmpty")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
