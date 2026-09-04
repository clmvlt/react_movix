import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Building2, Layers, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/app/toast-context";
import { ViewSwitch } from "@/components/view-switch";
import { SelectionBar } from "@/components/selection-bar";
import { ErrorState, LoadingState } from "@/components/states";
import { ZoneListPanel } from "@/components/zones/zone-list-panel";
import { ZonePharmaciesPanel } from "@/components/zones/zone-pharmacies-panel";
import { ZoneFormDialog } from "@/components/zones/zone-form-dialog";
import { ZoneDeleteDialog } from "@/components/zones/zone-delete-dialog";
import {
  ZoneAssignMenu,
  type ZoneNotice,
} from "@/components/zones/zone-assign-menu";
import { ZoneLegend } from "@/components/zones/zone-legend";
import {
  MapView,
  MapAutoFit,
  MapAreas,
  MapFlyTo,
  MapPoints,
  DepotMarker,
  type LngLat,
  type MapArea,
  type MapPoint,
} from "@/components/map";
import { hasValidLocation } from "@/components/pharmacies/pharmacy-utils";
import { cn } from "@/lib/utils";
import { unassignedColor, zoneColor, zoneColorMap } from "@/lib/colors";
import { useAuth } from "@/app/auth-context";
import { usePharmacySearch, type Pharmacy } from "@/features/pharmacies";
import {
  UNASSIGNED,
  ZONE_PAGE_SIZE,
  useZonePharmacies,
  useZones,
  useZonesMap,
  type Zone,
} from "@/features/zones";

type ZoneFormTarget = { mode: "create" } | { mode: "rename"; zone: Zone };

export function ZonesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();

  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get("view") === "map" ? "map" : "list";
  const bucket = (searchParams.get("zone") ?? "").trim().toLowerCase() || null;
  const isUnassigned = bucket === UNASSIGNED;
  const zoneId = isUnassigned ? null : bucket;
  const isolate = (searchParams.get("isolate") ?? "").trim().toLowerCase() || null;
  const search = searchParams.get("q") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [formTarget, setFormTarget] = useState<ZoneFormTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Zone | null>(null);
  const [focus, setFocus] = useState<{ center: LngLat; token: number } | null>(
    null
  );

  const setParams = (patch: Record<string, string | null>) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(patch)) {
          if (value === null) next.delete(key);
          else next.set(key, value);
        }
        return next;
      },
      { replace: true }
    );
  };

  const zonesQuery = useZones();
  const mapQuery = useZonesMap();
  const zones = useMemo(() => zonesQuery.data ?? [], [zonesQuery.data]);

  const selectedZone = zoneId
    ? zones.find((zone) => zone.id.toLowerCase() === zoneId)
    : undefined;
  const zoneGone =
    Boolean(zoneId) &&
    zonesQuery.isSuccess &&
    !zonesQuery.isFetching &&
    !selectedZone;

  const zonePharmaciesQuery = useZonePharmacies(
    zoneId,
    { page: page - 1, size: ZONE_PAGE_SIZE, search },
    !zoneGone
  );

  const unassignedQuery = usePharmacySearch(
    isUnassigned
      ? {
          zoneId: UNASSIGNED,
          query: search.trim() || undefined,
          page: page - 1,
          size: ZONE_PAGE_SIZE,
        }
      : null
  );

  const listQuery = isUnassigned ? unassignedQuery : zonePharmaciesQuery;

  const colors = useMemo(
    () => zoneColorMap(zones.map((zone) => zone.id)),
    [zones]
  );

  const geolocated = useMemo(
    () =>
      (mapQuery.data ?? []).filter(
        (entry) =>
          entry.latitude != null &&
          entry.longitude != null &&
          entry.latitude !== 0 &&
          entry.longitude !== 0
      ),
    [mapQuery.data]
  );

  const hiddenCount = (mapQuery.data?.length ?? 0) - geolocated.length;

  const mapPoints = useMemo<MapPoint[]>(
    () =>
      geolocated
        .filter(
          (entry) =>
            !isolate ||
            (entry.zoneId ?? UNASSIGNED).toLowerCase() === isolate
        )
        .map((entry) => ({
          cip: entry.cip,
          name: entry.name,
          longitude: entry.longitude as number,
          latitude: entry.latitude as number,
          color: entry.zoneId
            ? colors[entry.zoneId.toLowerCase()] ?? zoneColor(entry.zoneId)
            : unassignedColor,
        })),
    [geolocated, isolate, colors]
  );

  const zoneAreas = useMemo<MapArea[]>(() => {
    const grouped = new Map<string, LngLat[]>();
    for (const entry of geolocated) {
      if (!entry.zoneId) continue;
      const key = entry.zoneId.toLowerCase();
      if (isolate && key !== isolate) continue;
      const points = grouped.get(key);
      const point: LngLat = [
        entry.longitude as number,
        entry.latitude as number,
      ];
      if (points) points.push(point);
      else grouped.set(key, [point]);
    }
    return Array.from(grouped, ([key, points]) => ({
      id: key,
      color: colors[key] ?? zoneColor(key),
      points,
    }));
  }, [geolocated, isolate, colors]);

  const fitPoints = useMemo<LngLat[]>(() => {
    if (mapPoints.length === 0) return [];
    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;
    for (const point of mapPoints) {
      if (point.longitude < minLng) minLng = point.longitude;
      if (point.longitude > maxLng) maxLng = point.longitude;
      if (point.latitude < minLat) minLat = point.latitude;
      if (point.latitude > maxLat) maxLat = point.latitude;
    }
    return [
      [minLng, minLat],
      [maxLng, maxLat],
    ];
  }, [mapPoints]);

  const cipsInBucket = useMemo(() => {
    if (!bucket) return [];
    return (mapQuery.data ?? [])
      .filter((entry) => (entry.zoneId ?? UNASSIGNED).toLowerCase() === bucket)
      .map((entry) => entry.cip);
  }, [mapQuery.data, bucket]);

  const unassignedCount = useMemo(
    () =>
      (mapQuery.data ?? []).filter((entry) => entry.zoneId == null).length,
    [mapQuery.data]
  );

  const selectedCips = useMemo(() => Array.from(selected), [selected]);
  const hasSelection = selected.size > 0;

  const clearSelection = () => setSelected(new Set());

  const toggle = (cip: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(cip)) next.delete(cip);
      else next.add(cip);
      return next;
    });

  const togglePage = (cips: string[], checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const cip of cips) {
        if (checked) next.add(cip);
        else next.delete(cip);
      }
      return next;
    });

  const selectBucket = (value: string | null) => {
    setParams({ zone: value ? value.toLowerCase() : null, q: null, page: null });
    clearSelection();
  };

  const setView = (next: "list" | "map") => setParams({ view: next });
  const setSearch = (value: string) =>
    setParams({ q: value.trim() ? value : null, page: null });
  const setPage = (next: number) =>
    setParams({ page: next <= 1 ? null : String(next) });
  const setIsolate = (value: string | null) => setParams({ isolate: value });
  const showOnMap = (value: string | null) =>
    setParams(value ? { isolate: value, view: "map" } : { isolate: null });

  const locatePharmacy = (pharmacy: Pharmacy) => {
    if (!hasValidLocation(pharmacy)) return;
    setFocus((prev) => ({
      center: [pharmacy.longitude as number, pharmacy.latitude as number],
      token: (prev?.token ?? 0) + 1,
    }));
    const patch: Record<string, string | null> = { view: "map" };
    if (isolate && isolate !== bucket) patch.isolate = null;
    setParams(patch);
  };

  const account = user?.account;
  const depotCoords = useMemo<LngLat | null>(
    () =>
      account?.longitude != null && account?.latitude != null
        ? [account.longitude, account.latitude]
        : null,
    [account?.longitude, account?.latitude]
  );

  const handleAssignResult = (result: ZoneNotice) => {
    if (result.variant === "success") toast.success(result.message);
    else if (result.variant === "warning") toast.warning(result.message);
    else toast.error(result.message);
  };

  const assignMenu = (layout: "inline" | "bar") => (
    <ZoneAssignMenu
      layout={layout}
      cips={selectedCips}
      zones={zones}
      colors={colors}
      onResult={handleAssignResult}
      onDone={clearSelection}
    />
  );

  const panelTitle = isUnassigned
    ? t("zones.unassigned")
    : selectedZone?.name?.trim() || t("zones.untitled");

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {zoneGone && (
        <Alert variant="destructive" className="shrink-0">
          <AlertDescription className="flex items-center gap-2">
            <span className="min-w-0 flex-1">{t("zones.errors.zoneGone")}</span>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => selectBucket(null)}
            >
              {t("zones.backToZones")}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex shrink-0 items-center gap-2 lg:hidden">
        <ViewSwitch
          className="min-w-0 flex-1"
          value={view}
          onChange={setView}
          items={[
            {
              value: "list",
              label: t("zones.views.zones"),
              icon: Layers,
              count: zones.length,
            },
            { value: "map", label: t("common.views.map"), icon: MapPin },
          ]}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <div
          className={cn(
            "order-2 flex min-h-0 w-full flex-col lg:order-1 lg:w-[480px] lg:shrink-0 xl:w-[560px]",
            view === "map" && "hidden lg:flex"
          )}
        >
          <div className="mb-3 hidden h-11 shrink-0 items-center gap-1.5 rounded-xl border bg-card p-1.5 lg:flex">
            <div className="flex min-w-0 flex-1 items-center gap-1.5 pl-1">
              {hasSelection ? (
                <>
                  <span
                    className="truncate text-sm font-medium text-foreground"
                    title={t("zones.selected", { count: selected.size })}
                  >
                    {t("zones.selected", { count: selected.size })}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0"
                    onClick={clearSelection}
                    title={t("zones.clearSelection")}
                    aria-label={t("zones.clearSelection")}
                  >
                    <X className="size-4" />
                  </Button>
                </>
              ) : (
                <>
                  <span
                    className="flex shrink-0 items-center gap-1.5 text-sm text-foreground"
                    title={t("zones.title")}
                  >
                    <Layers className="size-4 text-muted-foreground" />
                    <span className="font-medium">{zones.length}</span>
                  </span>
                  <span
                    className="flex shrink-0 items-center gap-1.5 text-sm text-foreground"
                    title={t("nav.pharmacies")}
                  >
                    <Building2 className="size-4 text-muted-foreground" />
                    <span className="font-medium">
                      {mapQuery.data?.length ?? 0}
                    </span>
                  </span>
                  {unassignedCount > 0 && (
                    <span
                      className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground"
                      title={t("zones.unassigned")}
                    >
                      <span
                        aria-hidden="true"
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: unassignedColor }}
                      />
                      <span className="truncate font-medium tabular-nums">
                        {unassignedCount}
                      </span>
                    </span>
                  )}
                </>
              )}
            </div>
            <span className="mx-0.5 h-5 w-px shrink-0 bg-border" />
            {assignMenu("inline")}
          </div>

          {zonesQuery.isLoading ? (
            <LoadingState />
          ) : zonesQuery.isError ? (
            <ErrorState
              error={zonesQuery.error}
              retrying={zonesQuery.isFetching}
              onRetry={() => void zonesQuery.refetch()}
            />
          ) : bucket && !zoneGone ? (
            <ZonePharmaciesPanel
              key={bucket}
              className="min-h-0 flex-1"
              title={panelTitle}
              isUnassigned={isUnassigned}
              search={search}
              onSearchChange={setSearch}
              page={page}
              onPageChange={setPage}
              data={listQuery.data}
              isLoading={listQuery.isLoading}
              isFetching={listQuery.isFetching}
              isError={listQuery.isError}
              onRetry={() => void listQuery.refetch()}
              selected={selected}
              onToggle={toggle}
              onTogglePage={togglePage}
              onSelectAllInZone={() => setSelected(new Set(cipsInBucket))}
              allInZoneCount={cipsInBucket.length}
              onBack={() => selectBucket(null)}
              onLocate={locatePharmacy}
              isolated={isolate === bucket}
              onIsolate={(next) => showOnMap(next ? bucket : null)}
              onRename={
                selectedZone
                  ? () => setFormTarget({ mode: "rename", zone: selectedZone })
                  : undefined
              }
              onDelete={
                selectedZone ? () => setDeleteTarget(selectedZone) : undefined
              }
              hasSelection={hasSelection}
            />
          ) : (
            <ZoneListPanel
              className="min-h-0 flex-1"
              zones={zones}
              colors={colors}
              unassignedCount={mapQuery.data ? unassignedCount : null}
              isolate={isolate}
              onIsolate={showOnMap}
              onSelect={selectBucket}
              onCreate={() => setFormTarget({ mode: "create" })}
              onRename={(zone) => setFormTarget({ mode: "rename", zone })}
              onDelete={setDeleteTarget}
            />
          )}
        </div>

        <div
          className={cn(
            "relative order-1 min-h-0 flex-1 overflow-hidden rounded-xl border lg:order-2",
            view === "list" && "hidden lg:block"
          )}
        >
          <MapView center={depotCoords ?? undefined} zoom={depotCoords ? 9 : 5}>
            <MapAutoFit points={fitPoints} />
            <MapFlyTo
              center={focus?.center ?? null}
              zoom={15}
              token={focus?.token}
            />
            <MapAreas areas={zoneAreas} activeId={zoneId} />
            {depotCoords && (
              <DepotMarker
                longitude={depotCoords[0]}
                latitude={depotCoords[1]}
                title={account?.societe ?? t("expeditions.depot")}
              />
            )}
            <MapPoints
              points={mapPoints}
              selectedCips={selectedCips}
              onTogglePoint={toggle}
            />
          </MapView>
          <ZoneLegend
            zones={zones}
            colors={colors}
            isolate={isolate}
            onIsolate={setIsolate}
            hiddenCount={hiddenCount}
          />
        </div>
      </div>

      <SelectionBar count={selected.size} onClear={clearSelection}>
        {assignMenu("bar")}
      </SelectionBar>

      <ZoneFormDialog
        open={formTarget !== null}
        onOpenChange={(open) => !open && setFormTarget(null)}
        zone={formTarget?.mode === "rename" ? formTarget.zone : null}
        zones={zones}
        onSaved={(saved) => {
          setFormTarget(null);
          if (formTarget?.mode === "create") selectBucket(saved.id);
        }}
        onGone={() => {
          setFormTarget(null);
          selectBucket(null);
        }}
      />

      <ZoneDeleteDialog
        zone={deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onDeleted={(deleted) => {
          setDeleteTarget(null);
          if (bucket === deleted.id.toLowerCase()) selectBucket(null);
          if (isolate === deleted.id.toLowerCase()) setIsolate(null);
        }}
        onGone={() => {
          setDeleteTarget(null);
          selectBucket(null);
        }}
      />
    </div>
  );
}
