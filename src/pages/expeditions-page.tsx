import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Boxes,
  Layers,
  ListFilter,
  MapPin,
  Package,
  Spline,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CommandActions } from "@/components/command-actions";
import { CommandContextMenu } from "@/components/commands/command-context-menu";
import { CommandList, type CommandListHandle } from "@/components/command-list";
import { ExpeditionFilterButton } from "@/components/expeditions/expedition-filter-button";
import { RefreshButton } from "@/components/refresh-button";
import {
  EMPTY_EXPEDITION_FILTERS,
  hasExpeditionFilters,
  matchesExpeditionFilters,
  parseExpeditionFilters,
  writeExpeditionFilters,
  type ExpeditionFilters,
} from "@/components/expeditions/expedition-filters";
import { SelectionBar } from "@/components/selection-bar";
import { ViewSwitch } from "@/components/view-switch";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { cn } from "@/lib/utils";
import {
  MapView,
  MapPins,
  MapAutoFit,
  MapFlyTo,
  MapRoute,
  DepotMarker,
  geometryToCoordinates,
  type LngLat,
  type MapPin as MapPinData,
} from "@/components/map";
import { getStatusPalette } from "@/lib/colors";
import { commandStatusCategory } from "@/lib/status";
import { useAuth } from "@/app/auth-context";
import { useWorkingDate } from "@/app/working-date-context";
import { useExpeditions, type CommandExpedition } from "@/features/commands";
import { CLOSED_TOUR_STATUS_ID, useToursByDate } from "@/features/tours";
import { useZones } from "@/features/zones";

function coordsOf(command: CommandExpedition): LngLat | null {
  const lng = command.pharmacy?.longitude;
  const lat = command.pharmacy?.latitude;
  if (lng == null || lat == null) return null;
  return [lng, lat];
}

function markerColor(command: CommandExpedition): string {
  if (command.tour?.color) return command.tour.color;
  return getStatusPalette(commandStatusCategory(command.status?.id)).strong;
}

export function ExpeditionsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { date } = useWorkingDate();

  const { data, isLoading, isError, error, refetch, isFetching } =
    useExpeditions(date);
  const expeditions = useMemo(() => data ?? [], [data]);

  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get("view") === "map" ? "map" : "list";
  const setView = (next: "list" | "map") =>
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.set("view", next);
        return params;
      },
      { replace: true }
    );

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showAssigned, setShowAssigned] = useState(false);
  const [showRoutes, setShowRoutes] = useState(false);
  const listRef = useRef<CommandListHandle | null>(null);

  useEffect(() => {
    setSelected(new Set());
  }, [date]);

  const filters = useMemo(
    () => parseExpeditionFilters(searchParams),
    [searchParams]
  );
  const filtersActive = hasExpeditionFilters(filters);
  const setFilters = (next: ExpeditionFilters) => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        writeExpeditionFilters(params, next);
        return params;
      },
      { replace: true }
    );
    setSelected(new Set());
  };

  const toursQuery = useToursByDate(date);
  const zonesQuery = useZones();
  const zones = useMemo(() => zonesQuery.data ?? [], [zonesQuery.data]);
  const refreshing = isFetching || toursQuery.isFetching;
  const refresh = () => Promise.all([refetch(), toursQuery.refetch()]);

  const account = user?.account;
  const depotCoords = useMemo<LngLat | null>(
    () =>
      account?.longitude != null && account?.latitude != null
        ? [account.longitude, account.latitude]
        : null,
    [account?.longitude, account?.latitude]
  );

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectFromMap = (id: string) => {
    toggle(id);
    listRef.current?.scrollToId(id);
  };

  const [focus, setFocus] = useState<{ center: LngLat; token: number } | null>(
    null
  );

  const locate = (id: string) => {
    const command = expeditions.find((item) => item.id === id);
    const coords = command ? coordsOf(command) : null;
    if (!coords) return;
    setFocus((prev) => ({ center: coords, token: (prev?.token ?? 0) + 1 }));
    setView("map");
  };

  const clearSelection = () => setSelected(new Set());
  const hasSelection = selected.size > 0;
  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  const visibleCommands = useMemo(
    () =>
      expeditions.filter(
        (command) =>
          (showAssigned || !command.tour) &&
          matchesExpeditionFilters(command, filters)
      ),
    [expeditions, showAssigned, filters]
  );

  const allVisibleSelected =
    visibleCommands.length > 0 &&
    visibleCommands.every((command) => selected.has(command.id));
  const selectAllState = allVisibleSelected
    ? true
    : hasSelection
      ? "indeterminate"
      : false;
  const toggleAll = () =>
    setSelected(
      allVisibleSelected
        ? new Set()
        : new Set(visibleCommands.map((command) => command.id))
    );
  const selectAllLabel = t("expeditions.selectAll", {
    count: visibleCommands.length,
  });

  const pins = useMemo<MapPinData[]>(() => {
    const list: MapPinData[] = [];
    for (const command of visibleCommands) {
      const coords = coordsOf(command);
      if (!coords) continue;
      list.push({
        id: command.id,
        longitude: coords[0],
        latitude: coords[1],
        color: markerColor(command),
      });
    }
    return list;
  }, [visibleCommands]);

  const points = useMemo(() => {
    const list: LngLat[] = pins.map((pin) => [pin.longitude, pin.latitude]);
    return depotCoords ? [...list, depotCoords] : list;
  }, [pins, depotCoords]);

  const tours = useMemo(
    () =>
      (toursQuery.data ?? []).filter(
        (tour) => tour.status?.id !== CLOSED_TOUR_STATUS_ID
      ),
    [toursQuery.data]
  );

  const totalPackages = useMemo(
    () =>
      expeditions.reduce(
        (sum, command) => sum + (command.packagesNumber ?? 0),
        0
      ),
    [expeditions]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState
          error={error}
          retrying={isFetching}
          onRetry={() => void refetch()}
        />
      ) : (
        <>
        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          <ViewSwitch
            className="min-w-0 flex-1"
            compactLabels
            value={view}
            onChange={setView}
            items={[
              {
                value: "list",
                label: t("common.views.list"),
                icon: Package,
                count: visibleCommands.length,
              },
              { value: "map", label: t("common.views.map"), icon: MapPin },
            ]}
          />
          <ExpeditionFilterButton
            filters={filters}
            onChange={setFilters}
            commands={expeditions}
            zones={zones}
            className="size-11"
            iconClassName="size-5"
          />
          <Button
            variant={showAssigned ? "default" : "outline"}
            size="icon"
            className="size-11 shrink-0"
            aria-label={t("expeditions.showAssigned")}
            onClick={() => {
              setShowAssigned((value) => !value);
              clearSelection();
            }}
          >
            <Layers className="size-5" />
          </Button>
          <Button
            variant={showRoutes ? "default" : "outline"}
            size="icon"
            className="size-11 shrink-0"
            aria-label={t("expeditions.showRoutes")}
            onClick={() => setShowRoutes((value) => !value)}
          >
            <Spline className="size-5" />
          </Button>
          <RefreshButton
            className="size-11"
            iconClassName="size-5"
            refreshing={refreshing}
            onRefresh={refresh}
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
          <div
            className={cn(
              "order-2 flex min-h-0 w-full flex-col lg:order-1 lg:w-[480px] lg:shrink-0",
              view === "map" && "hidden lg:flex"
            )}
          >
            <div className="mb-3 hidden h-11 shrink-0 items-center gap-1.5 rounded-xl border bg-card p-1.5 lg:flex">
              <div className="flex min-w-0 flex-1 items-center gap-1.5 pl-1">
                <Checkbox
                  className="mx-1"
                  checked={selectAllState}
                  onCheckedChange={toggleAll}
                  disabled={visibleCommands.length === 0}
                  title={selectAllLabel}
                  aria-label={selectAllLabel}
                />
                {hasSelection ? (
                  <>
                    <span
                      className="truncate text-sm font-medium text-foreground"
                      title={t("expeditions.selected", { count: selected.size })}
                    >
                      {t("expeditions.selected", { count: selected.size })}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0"
                      title={t("expeditions.clearSelection")}
                      aria-label={t("expeditions.clearSelection")}
                      onClick={clearSelection}
                    >
                      <X className="size-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span
                      className="flex shrink-0 items-center gap-1.5 text-sm text-foreground"
                      title={t("nav.commands")}
                    >
                      <Package className="size-4 text-muted-foreground" />
                      <span className="font-medium">{expeditions.length}</span>
                    </span>
                    <span
                      className="flex shrink-0 items-center gap-1.5 text-sm text-foreground"
                      title={t("commands.packages")}
                    >
                      <Boxes className="size-4 text-muted-foreground" />
                      <span className="font-medium">{totalPackages}</span>
                    </span>
                  </>
                )}
              </div>
              <span className="mx-0.5 h-5 w-px shrink-0 bg-border" />
              <CommandActions
                commandIds={selectedIds}
                tours={tours}
                onDone={clearSelection}
              />

              <span className="mx-0.5 h-5 w-px shrink-0 bg-border" />
              <div className="flex shrink-0 items-center gap-1.5 pr-1">
                <ExpeditionFilterButton
                  filters={filters}
                  onChange={setFilters}
                  commands={expeditions}
                  zones={zones}
                  className="size-8"
                  iconClassName="size-4"
                />
                <Button
                  variant={showAssigned ? "default" : "outline"}
                  size="icon"
                  className="size-8"
                  title={t("expeditions.showAssigned")}
                  aria-label={t("expeditions.showAssigned")}
                  onClick={() => {
                    setShowAssigned((value) => !value);
                    clearSelection();
                  }}
                >
                  <Layers className="size-4" />
                </Button>
                <Button
                  variant={showRoutes ? "default" : "outline"}
                  size="icon"
                  className="size-8"
                  title={t("expeditions.showRoutes")}
                  aria-label={t("expeditions.showRoutes")}
                  onClick={() => setShowRoutes((value) => !value)}
                >
                  <Spline className="size-4" />
                </Button>
                <RefreshButton
                  className="size-8"
                  refreshing={refreshing}
                  onRefresh={refresh}
                />
              </div>
            </div>

            {visibleCommands.length > 0 && (
              <label className="mb-2 flex min-h-11 shrink-0 cursor-pointer items-center gap-3 rounded-xl border bg-card px-3 text-sm font-medium text-foreground lg:hidden">
                <Checkbox
                  checked={selectAllState}
                  onCheckedChange={toggleAll}
                />
                <span className="truncate">{selectAllLabel}</span>
              </label>
            )}

            {visibleCommands.length === 0 ? (
              <EmptyState
                message={
                  filtersActive
                    ? t("expeditions.filters.empty")
                    : t("expeditions.empty")
                }
                icon={
                  filtersActive ? (
                    <ListFilter className="size-8" />
                  ) : (
                    <MapPin className="size-8" />
                  )
                }
                action={
                  filtersActive ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters(EMPTY_EXPEDITION_FILTERS)}
                    >
                      {t("common.clearFilters")}
                    </Button>
                  ) : undefined
                }
                className="min-h-0 flex-1"
              />
            ) : (
              <CommandList
                items={visibleCommands}
                selectedIds={selected}
                onToggle={toggle}
                onOpen={(id) => navigate(`/app/commands/${id}`)}
                onOpenPharmacy={(cip) =>
                  navigate(`/app/pharmacies/${encodeURIComponent(cip)}`)
                }
                onLocate={locate}
                ref={listRef}
                wrapItem={(command, node) => (
                  <CommandContextMenu
                    commandIds={
                      selected.has(command.id) ? selectedIds : [command.id]
                    }
                    pharmacy={command.pharmacy}
                    tours={tours}
                    onDone={
                      selected.has(command.id) ? clearSelection : undefined
                    }
                  >
                    {node}
                  </CommandContextMenu>
                )}
                className={cn(
                  "min-h-0",
                  hasSelection && "pb-28 lg:pb-0"
                )}
              />
            )}
          </div>

          <div
            className={cn(
              "order-1 min-h-0 flex-1 overflow-hidden rounded-xl border lg:order-2",
              view === "list" && "hidden lg:block"
            )}
          >
            <MapView center={depotCoords ?? undefined} zoom={depotCoords ? 9 : 5}>
              <MapAutoFit points={points} />
              <MapFlyTo
                center={focus?.center ?? null}
                zoom={15}
                token={focus?.token}
              />
              {depotCoords && (
                <DepotMarker
                  longitude={depotCoords[0]}
                  latitude={depotCoords[1]}
                  title={account?.societe ?? t("expeditions.depot")}
                />
              )}
              {showRoutes &&
                toursQuery.data?.map((tour) => {
                  const coords = geometryToCoordinates(tour.geometry);
                  if (coords.length < 2) return null;
                  return (
                    <MapRoute
                      key={tour.id}
                      id={tour.id}
                      coordinates={coords}
                      color={tour.color || "#2563eb"}
                    />
                  );
                })}
              <MapPins
                pins={pins}
                selectedIds={selected}
                onClick={selectFromMap}
              />
            </MapView>
          </div>
        </div>

        <SelectionBar count={selected.size} onClear={clearSelection}>
          <CommandActions
            layout="bar"
            commandIds={selectedIds}
            tours={tours}
            onDone={clearSelection}
          />
        </SelectionBar>
        </>
      )}
    </div>
  );
}
