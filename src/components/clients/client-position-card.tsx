import { Suspense, lazy, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  Crosshair,
  Loader2,
  LocateFixed,
  MapPin,
  MapPinOff,
  MapPinPlus,
  MoreHorizontal,
  Package,
  TriangleAlert,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DetailField } from "@/components/detail-field";
import { FieldRow } from "@/components/field-row";
import { InlineSpinner } from "@/components/full-page-spinner";
import { useToast } from "@/app/toast-context";
import { cn } from "@/lib/utils";
import { coarsePointer } from "@/lib/pointer";
import { averageLngLat } from "@/lib/geo";
import type { CommandMapPoint } from "@/lib/command-points";
import {
  addressSummary,
  entityPosition,
  formPosition,
  formatCoordinate,
  samePosition,
} from "@/lib/address-form";
import {
  isOrsUnavailable,
  orsApi,
  orsKeys,
  type AddressSearchParams,
} from "@/features/ors";
import { ClientTextField, SectionCard } from "./client-fields";
import type { ClientFormApi } from "./use-client-form";
import type { Client } from "@/features/clients";
import type { LngLat } from "@/components/map";

const PlaceMap = lazy(() =>
  import("@/components/place-map").then((m) => ({
    default: m.PlaceMap,
  }))
);

const DELIVERY_SAMPLE = 5;
const DELIVERIES_ZOOM = 16;
const RECENTER_ZOOM = 16;
const ADDRESS_ZOOM = 17;
const EDIT_MARKER_SIZE = 44;
const LOCATE_STALE_TIME = 60_000;

const MAP_BOX =
  "relative h-64 shrink-0 overflow-hidden rounded-xl border border-border sm:h-80 lg:h-[26rem]";

interface ClientPositionCardProps {
  mode: "view" | "edit" | "create";
  client: Client | null;
  api?: ClientFormApi;
  title: string;
  depot: LngLat | null;
  depotTitle?: string;
  commands?: CommandMapPoint[];
  commandsLoading?: boolean;
  disabled?: boolean;
  onSetPosition?: () => void;
  className?: string;
}

function coordinatesText(position: LngLat): string {
  return `${formatCoordinate(position[1])}, ${formatCoordinate(position[0])}`;
}

function RecenterButton({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="absolute bottom-2 right-2 z-10 size-11 bg-background shadow-md lg:size-10"
      disabled={disabled}
      onClick={onClick}
      aria-label={t("clients.info.centerOnMarker")}
      title={t("clients.info.centerOnMarker")}
    >
      <Crosshair className="size-4" />
    </Button>
  );
}

export function ClientPositionCard({
  mode,
  client,
  api,
  title,
  depot,
  depotTitle,
  commands = [],
  commandsLoading = false,
  disabled = false,
  onSetPosition,
  className,
}: ClientPositionCardProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [showCoordinates, setShowCoordinates] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [locating, setLocating] = useState(false);
  const [viewFocus, setViewFocus] = useState<{
    center: LngLat;
    token: number;
  } | null>(null);

  if (mode === "view" || !api) {
    const position = entityPosition(client);
    return (
      <SectionCard
        title={t("clients.sections.position")}
        description={t("clients.sections.positionDesc")}
        icon={LocateFixed}
        className={className}
        contentClassName="flex min-h-0 flex-1 flex-col gap-3 lg:overflow-y-auto"
      >
        {position ? (
          <>
            <div className={MAP_BOX}>
              <Suspense fallback={<InlineSpinner />}>
                <PlaceMap
                  marker={position}
                  title={title}
                  zoneId={client?.zone?.id ?? null}
                  depot={depot}
                  depotTitle={depotTitle}
                  commands={showCommands ? commands : []}
                  fitAnchor={position}
                  focus={viewFocus?.center ?? null}
                  focusToken={viewFocus?.token}
                  focusZoom={RECENTER_ZOOM}
                  cooperativeGestures={coarsePointer()}
                />
              </Suspense>
              <RecenterButton
                disabled={false}
                onClick={() =>
                  setViewFocus((previous) => ({
                    center: position,
                    token: (previous?.token ?? 0) + 1,
                  }))
                }
              />
            </div>
            <dl>
              <DetailField label={t("clients.info.coordinates")}>
                <span className="tabular-nums">{coordinatesText(position)}</span>
              </DetailField>
            </dl>
            {commands.length > 0 && (
              <Button
                type="button"
                variant={showCommands ? "default" : "outline"}
                className="min-h-11 w-full lg:min-h-10"
                aria-pressed={showCommands}
                onClick={() => setShowCommands((previous) => !previous)}
              >
                <Package className="size-4" />
                {showCommands
                  ? t("clients.orders.hideOnMap")
                  : t("clients.orders.showOnMap", { count: commands.length })}
              </Button>
            )}
          </>
        ) : (
          <div className="flex h-64 shrink-0 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-6 text-center sm:h-80 lg:h-[26rem]">
            <MapPinOff aria-hidden className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              {t("clients.info.noCoordinates")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("clients.info.positionNoneHintView")}
            </p>
            {onSetPosition && (
              <Button
                type="button"
                className="min-h-11 lg:min-h-10"
                onClick={onSetPosition}
              >
                <MapPinPlus className="size-4" />
                {t("clients.info.setPosition")}
              </Button>
            )}
          </div>
        )}
      </SectionCard>
    );
  }

  const { form, position, positionSource, positionStale } = api;
  const located = position !== null;
  const snapshotPosition = entityPosition(api.snapshot);
  const canLocate = addressSummary(form) !== "";
  const coordinatesOpen =
    showCoordinates || Boolean(api.errors.latitude || api.errors.longitude);

  const provenance =
    positionSource === "address"
      ? t("clients.info.positionFromAddress")
      : positionSource === "manual"
        ? t("clients.info.positionManual")
        : null;

  const statusRow = !located ? (
    <FieldRow
      icon={MapPinOff}
      tone="warning"
      label={t("clients.info.positionNone")}
      summary={t("clients.info.positionNoneHint")}
    />
  ) : positionStale ? (
    <FieldRow
      icon={TriangleAlert}
      tone="warning"
      label={t("clients.info.positionStale")}
      summary={t("clients.info.positionStaleHint")}
    />
  ) : (
    <FieldRow
      icon={MapPin}
      active
      label={t("clients.info.positionSet")}
      summary={
        <span className="tabular-nums">
          {coordinatesText(position as LngLat)}
          {provenance ? ` - ${provenance}` : ""}
        </span>
      }
    />
  );

  const locateFromAddress = async () => {
    const q = addressSummary(form);
    if (!q) return;
    setLocating(true);
    try {
      const params: AddressSearchParams = {
        q,
        limit: 1,
        lat: depot?.[1],
        lon: depot?.[0],
      };
      const results = await queryClient.fetchQuery({
        queryKey: orsKeys.searchQuery(params),
        queryFn: ({ signal }) => orsApi.search(params, signal),
        staleTime: LOCATE_STALE_TIME,
      });
      const first = results[0];
      if (!first) {
        toast.warning(t("clients.info.locateFromAddressNone"));
        return;
      }
      api.setPosition([first.lon, first.lat], "address", ADDRESS_ZOOM);
      toast.success(
        t("clients.info.locateFromAddressDone", { label: first.label })
      );
    } catch (error) {
      toast.error(
        t(isOrsUnavailable(error) ? "address.unavailable" : "address.failed")
      );
    } finally {
      setLocating(false);
    }
  };

  const normalizeCoordinates = () => {
    const parsed = formPosition(form);
    if (!parsed) return;
    const formatted = {
      latitude: formatCoordinate(parsed[1]),
      longitude: formatCoordinate(parsed[0]),
    };
    if (samePosition(parsed, api.placedPosition)) {
      if (
        form.latitude !== formatted.latitude ||
        form.longitude !== formatted.longitude
      ) {
        api.patch(formatted);
      }
      return;
    }
    api.setPosition(parsed, "manual");
  };

  return (
    <SectionCard
      title={t("clients.sections.position")}
      description={t("clients.sections.positionDesc")}
      icon={LocateFixed}
      className={className}
      contentClassName="flex min-h-0 flex-1 flex-col gap-3 lg:overflow-y-auto"
    >
      {statusRow}

      <div className={MAP_BOX}>
        <Suspense fallback={<InlineSpinner />}>
          <PlaceMap
            marker={position}
            title={title}
            zoneId={form.zoneId}
            depot={depot}
            depotTitle={depotTitle}
            commands={showCommands ? commands : []}
            draggable={located && !disabled}
            markerSize={EDIT_MARKER_SIZE}
            fitAnchor={position}
            focus={api.focus?.center ?? null}
            focusToken={api.focus?.token}
            focusZoom={api.focus?.zoom ?? RECENTER_ZOOM}
            cooperativeGestures={coarsePointer()}
            onMove={(longitude, latitude) =>
              api.setPosition([longitude, latitude], "manual")
            }
            onMapClick={
              !located && !disabled
                ? (longitude, latitude) =>
                    api.setPosition([longitude, latitude], "manual")
                : undefined
            }
          />
        </Suspense>
        <RecenterButton
          disabled={!located}
          onClick={() => {
            if (position) api.focusOn(position, RECENTER_ZOOM);
          }}
        />
      </div>

      <p className="min-h-4 text-xs leading-4 text-muted-foreground">
        {located ? t("clients.info.positionHint") : ""}
      </p>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={located && !positionStale ? "outline" : "default"}
          className="min-h-11 flex-1 lg:min-h-10"
          disabled={disabled || locating || !canLocate}
          onClick={() => void locateFromAddress()}
        >
          {locating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LocateFixed className="size-4" />
          )}
          {t("clients.info.locateFromAddress")}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-11 shrink-0 lg:size-10"
              disabled={disabled}
              aria-label={t("clients.info.positionActions")}
              title={t("clients.info.positionActions")}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuItem
              className="min-h-11 lg:min-h-9"
              disabled={samePosition(position, snapshotPosition)}
              onSelect={() =>
                api.setPosition(snapshotPosition, "saved", RECENTER_ZOOM)
              }
            >
              <Undo2 className="size-4" />
              <span className="truncate">{t("clients.info.resetPosition")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="min-h-11 text-destructive focus:text-destructive lg:min-h-9"
              disabled={!located}
              onSelect={() => api.setPosition(null, "manual")}
            >
              <MapPinOff className="size-4" />
              <span className="truncate">{t("clients.info.clearPosition")}</span>
            </DropdownMenuItem>
            {commands.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="min-h-11 lg:min-h-9"
                  onSelect={() => setShowCommands((previous) => !previous)}
                >
                  <Package className="size-4" />
                  <span className="truncate">
                    {showCommands
                      ? t("clients.orders.hideOnMap")
                      : t("clients.orders.showOnMap", {
                          count: commands.length,
                        })}
                  </span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {commands.length > 0 && (
        <Button
          type="button"
          variant="outline"
          className="min-h-11 lg:min-h-10"
          disabled={disabled || commandsLoading}
          onClick={() => {
            const average = averageLngLat(
              commands
                .slice(0, DELIVERY_SAMPLE)
                .map((point) => [point.longitude, point.latitude] as LngLat)
            );
            if (average) api.setPosition(average, "manual", DELIVERIES_ZOOM);
          }}
        >
          <Package className="size-4" />
          {t("clients.orders.useDeliveryAverage", {
            count: Math.min(commands.length, DELIVERY_SAMPLE),
          })}
        </Button>
      )}

      <div className="flex flex-col">
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 w-fit px-2 text-xs lg:min-h-9"
          aria-expanded={coordinatesOpen}
          onClick={() => setShowCoordinates((previous) => !previous)}
        >
          <ChevronDown
            className={cn(
              "size-4 transition-transform",
              coordinatesOpen && "rotate-180"
            )}
          />
          {t("clients.info.editCoordinates")}
        </Button>
        {coordinatesOpen && (
          <div className="mt-2 grid grid-cols-2 gap-x-4">
            <ClientTextField
              api={api}
              field="latitude"
              label={t("clients.info.latitude")}
              hint={t("clients.info.coordinatesHint")}
              inputMode="decimal"
              disabled={disabled}
              onBlur={normalizeCoordinates}
              className="tabular-nums"
            />
            <ClientTextField
              api={api}
              field="longitude"
              label={t("clients.info.longitude")}
              inputMode="decimal"
              disabled={disabled}
              onBlur={normalizeCoordinates}
              className="tabular-nums"
            />
          </div>
        )}
      </div>
    </SectionCard>
  );
}
