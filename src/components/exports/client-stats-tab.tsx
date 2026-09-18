import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Boxes,
  ChartColumn,
  Check,
  CheckSquare,
  ChevronDown,
  Eye,
  FileSpreadsheet,
  Package,
  PackageX,
  Route,
  Search,
  Square,
  TrendingUp,
  TriangleAlert,
  Weight,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState, ErrorState } from "@/components/states";
import { InlineSpinner } from "@/components/full-page-spinner";
import { KpiTile } from "./kpi-tile";
import { SheetPreviewDialog } from "./sheet-preview-dialog";
import type { ExportFiltersApi } from "./use-export-filters";
import { cn } from "@/lib/utils";
import { downloadWorkbook, formatValue } from "@/lib/xlsx";
import { useProfiles } from "@/features/profiles";
import type { Profil } from "@/features/auth";
import {
  LOW_DELIVERY_RATE_THRESHOLD,
  buildPharmacySheets,
  buildStatsFilters,
  computeClientTotals,
  pharmacyStatsFileName,
  useStatsByClient,
  useStatsOverview,
  type ClientStatsParams,
  type StatsClientItem,
} from "@/features/stats";

const ROW_HEIGHT = 44;
const ALL_DRIVERS = "__all__";

const COLUMNS = [
  "cip",
  "name",
  "city",
  "totalCommands",
  "delivered",
  "notDelivered",
  "totalPackages",
  "deliveredPackages",
  "deliveryRate",
  "totalWeight",
] as const;

const GRID_TEMPLATE =
  "2rem minmax(120px,1fr) minmax(180px,2fr) minmax(120px,1fr) repeat(7, minmax(84px,0.9fr))";

type SortDirection = "asc" | "desc";
interface SortState {
  key: string;
  direction: SortDirection;
}

const ACCESSORS: Record<string, (row: StatsClientItem) => string | number> = {
  cip: (row) => row.cip ?? "",
  name: (row) => (row.name ?? "").toLowerCase(),
  city: (row) => (row.city ?? "").toLowerCase(),
  totalCommands: (row) => row.totalCommands ?? 0,
  delivered: (row) => row.deliveredCommands ?? 0,
  notDelivered: (row) => row.notDeliveredCommands ?? 0,
  totalPackages: (row) => row.totalPackages ?? 0,
  deliveredPackages: (row) => row.deliveredPackages ?? 0,
  deliveryRate: (row) => row.deliveryRate ?? 0,
  totalWeight: (row) => row.totalWeight ?? 0,
};

export function ClientStatsTab({ api }: { api: ExportFiltersApi }) {
  const { t } = useTranslation();
  const { filters, setFilter, rangeError } = api;

  const [params, setParams] = useState<ClientStatsParams | null>(null);
  const [selectedCips, setSelectedCips] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState>({ key: "", direction: "asc" });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [duration, setDuration] = useState<number | null>(null);
  const startedAtRef = useRef<number | null>(null);

  const profilesQuery = useProfiles();
  const drivers = profilesQuery.data ?? [];
  const driverName = (profile: Profil) =>
    [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() ||
    profile.identifiant;
  const selectedDriver = drivers.find(
    (profile) => profile.id === filters.profilId
  );
  const driverLabel = selectedDriver
    ? driverName(selectedDriver)
    : t("exports.filters.allDrivers");

  const statsFilters = params ? buildStatsFilters(params) : null;
  const overviewQuery = useStatsOverview(statsFilters);
  const byClientQuery = useStatsByClient(statsFilters);

  const isLoading =
    params !== null && (overviewQuery.isPending || byClientQuery.isPending);
  const isError = overviewQuery.isError || byClientQuery.isError;

  const pharmacies = byClientQuery.data?.pharmacies ?? [];
  const overview = overviewQuery.data ?? null;

  useEffect(() => {
    if (!byClientQuery.data) return;
    setSelectedCips(
      byClientQuery.data.pharmacies.map((row) => row.clientId)
    );
    if (startedAtRef.current !== null) {
      setDuration(Math.round(performance.now() - startedAtRef.current));
      startedAtRef.current = null;
    }
  }, [byClientQuery.data]);

  const selectedPharmacies = pharmacies.filter((row) =>
    selectedCips.includes(row.clientId)
  );
  const isAllSelected =
    pharmacies.length > 0 && selectedCips.length === pharmacies.length;
  const totals = computeClientTotals(
    selectedPharmacies,
    overview,
    isAllSelected
  );

  const sumOfRows = pharmacies.reduce(
    (total, row) => total + (row.totalCommands ?? 0),
    0
  );
  const coherenceIssue =
    overview !== null &&
    pharmacies.length > 0 &&
    sumOfRows !== overview.totalCommands;

  const term = search.trim().toLowerCase();
  const filtered = term
    ? pharmacies.filter(
        (row) =>
          (row.cip ?? "").toLowerCase().includes(term) ||
          (row.name ?? "").toLowerCase().includes(term) ||
          (row.city ?? "").toLowerCase().includes(term)
      )
    : pharmacies;

  const accessor = ACCESSORS[sort.key];
  const visibleRows = accessor
    ? [...filtered].sort((left, right) => {
        const factor = sort.direction === "asc" ? 1 : -1;
        const a = accessor(left);
        const b = accessor(right);
        if (a < b) return -factor;
        if (a > b) return factor;
        return 0;
      })
    : filtered;

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const virtualizer = useVirtualizer({
    count: visibleRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  const lowRateCount = visibleRows.filter(
    (row) => (row.deliveryRate ?? 0) < LOW_DELIVERY_RATE_THRESHOLD
  ).length;

  const canExport = !isLoading && !isExporting && selectedPharmacies.length > 0;

  const buildSheets = () =>
    params
      ? buildPharmacySheets({
          pharmacies: selectedPharmacies,
          overview,
          totals,
          params,
          loadedPharmacyCount: pharmacies.length,
          t,
        })
      : [];

  const requestLoad = () => {
    if (rangeError) return;
    startedAtRef.current = performance.now();
    setDuration(null);
    setParams({
      startDate: filters.startDate,
      endDate: filters.endDate,
      pharmacyCip: filters.pharmacyCip,
      profilId: filters.profilId,
    });
  };

  const clearSpecificFilters = () => {
    setFilter("pharmacyCip", "");
    setFilter("profilId", "");
  };

  const hasSpecificFilters = Boolean(filters.pharmacyCip || filters.profilId);

  const toggleAll = () => {
    setSelectedCips(
      isAllSelected ? [] : pharmacies.map((row) => row.clientId)
    );
  };

  const toggleClient = (cip: string) => {
    setSelectedCips((previous) =>
      previous.includes(cip)
        ? previous.filter((value) => value !== cip)
        : [...previous, cip]
    );
  };

  const handleDownload = async () => {
    if (!params || !canExport) return;
    setIsExporting(true);
    setProgress(0);
    setProgressLabel(t("exports.progress.preparing"));
    try {
      await downloadWorkbook(
        buildSheets(),
        pharmacyStatsFileName(params),
        (percent, label) => {
          setProgress(percent);
          setProgressLabel(label);
        }
      );
    } finally {
      setIsExporting(false);
      setProgress(0);
      setProgressLabel("");
    }
  };

  const num = (value: number | null | undefined) =>
    formatValue(value, "integer");

  const hasData = pharmacies.length > 0;
  const kpi = (value: string) => (hasData && overview ? value : "");

  const notices = hasData
    ? [
        totals.isLocal ? t("exports.clients.localTotals") : null,
        lowRateCount > 0
          ? t("exports.clients.lowRate", {
              count: lowRateCount,
              threshold: LOW_DELIVERY_RATE_THRESHOLD,
            })
          : null,
      ].filter((line): line is string => line !== null)
    : [];

  return (
    <div className="flex flex-1 flex-col gap-3">
      <Card>
        <CardContent className="flex flex-col gap-3 p-3 sm:p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="stats-cip">
                {t("exports.filters.clientCip")}
              </Label>
              <Input
                id="stats-cip"
                value={filters.pharmacyCip}
                placeholder={t("exports.filters.allPharmacies")}
                className="min-h-11 lg:min-h-10"
                onChange={(event) =>
                  setFilter("pharmacyCip", event.target.value)
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="stats-driver">
                {t("exports.filters.driverId")}
              </Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    id="stats-driver"
                    variant="outline"
                    className="min-h-11 w-full justify-between font-normal lg:min-h-10"
                  >
                    <span className="truncate">{driverLabel}</span>
                    <ChevronDown className="size-4 shrink-0 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="max-h-72 w-(--radix-dropdown-menu-trigger-width) overflow-y-auto"
                >
                  <DropdownMenuRadioGroup
                    value={filters.profilId || ALL_DRIVERS}
                    onValueChange={(value) =>
                      setFilter("profilId", value === ALL_DRIVERS ? "" : value)
                    }
                  >
                    <DropdownMenuRadioItem value={ALL_DRIVERS}>
                      {t("exports.filters.allDrivers")}
                    </DropdownMenuRadioItem>
                    {drivers.map((driver) => (
                      <DropdownMenuRadioItem key={driver.id} value={driver.id}>
                        {driverName(driver)}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-end gap-2 sm:col-span-2">
              <Button
                className="min-h-11 lg:min-h-10"
                disabled={rangeError !== null || isLoading}
                onClick={requestLoad}
              >
                <Search className="size-4" />
                {isLoading
                  ? t("exports.actions.loading")
                  : t("exports.actions.load")}
              </Button>
              {hasSpecificFilters && (
                <Button
                  variant="ghost"
                  className="min-h-11 text-muted-foreground lg:min-h-10"
                  onClick={clearSpecificFilters}
                >
                  {t("exports.filters.clear")}
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex min-h-10 flex-wrap items-center gap-2 text-sm">
              {hasData ? (
                <>
                  <span className="font-semibold">
                    {t("exports.clients.found", {
                      count: pharmacies.length,
                    })}
                  </span>
                  {duration !== null && (
                    <span className="text-xs text-muted-foreground">
                      {duration >= 1000
                        ? t("exports.duration.seconds", {
                            value: (duration / 1000).toFixed(1),
                          })
                        : t("exports.duration.milliseconds", {
                            value: duration,
                          })}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground">
                  {t("exports.results.none")}
                </span>
              )}
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                className="min-h-11 lg:min-h-10"
                disabled={!hasData}
                onClick={toggleAll}
              >
                {isAllSelected ? (
                  <Square className="size-3.5" />
                ) : (
                  <CheckSquare className="size-3.5" />
                )}
                {isAllSelected
                  ? t("exports.actions.deselectAll")
                  : t("exports.actions.selectAll")}
              </Button>

              <Button
                variant="outline"
                className="min-h-11 lg:min-h-10"
                disabled={!canExport}
                onClick={() => setPreviewOpen(true)}
              >
                <Eye className="size-3.5" />
                {t("exports.actions.preview")}
              </Button>

              <Button
                className="min-h-11 lg:min-h-10"
                disabled={!canExport}
                onClick={handleDownload}
              >
                <FileSpreadsheet className="size-3.5" />
                {t("exports.actions.download")}
              </Button>
            </div>
          </div>

          {isExporting && (
            <div className="rounded-lg border border-border bg-muted p-3">
              <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-semibold">
                  {t("exports.progress.title")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {progressLabel}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-border">
                <div
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {t("exports.clients.scopeHint")}
          </p>
        </CardContent>
      </Card>

      {coherenceIssue && (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertDescription>
            {t("exports.clients.coherence", {
              overview: overview?.totalCommands ?? 0,
              rows: sumOfRows,
            })}
          </AlertDescription>
        </Alert>
      )}

      {notices.length > 0 && (
        <Alert variant="warning">
          <TriangleAlert />
          <AlertDescription className="flex flex-col gap-1">
            {notices.map((notice) => (
              <span key={notice}>{notice}</span>
            ))}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <KpiTile
          label={t("exports.kpi.commands")}
          value={kpi(num(overview?.totalCommands))}
          hint={
            overview && hasData
              ? t("exports.kpi.deliveredHint", {
                  count: overview.deliveredCommands,
                })
              : undefined
          }
          icon={Package}
        />
        <KpiTile
          label={t("exports.kpi.deliveryRate")}
          value={kpi(formatValue(overview?.deliveryRate, "rate"))}
          icon={TrendingUp}
        />
        <KpiTile
          label={t("exports.kpi.notDelivered")}
          value={kpi(num(overview?.notDeliveredCommands))}
          icon={PackageX}
        />
        <KpiTile
          label={t("exports.kpi.packages")}
          value={kpi(num(overview?.totalPackages))}
          hint={
            overview && hasData
              ? t("exports.kpi.deliveredHint", {
                  count: overview.deliveredPackages,
                })
              : undefined
          }
          icon={Boxes}
        />
        <KpiTile
          label={t("exports.kpi.packageRate")}
          value={kpi(formatValue(overview?.packageDeliveryRate, "rate"))}
          icon={TrendingUp}
        />
        <KpiTile
          label={t("exports.kpi.weight")}
          value={kpi(formatValue(overview?.totalWeight, "weight"))}
          icon={Weight}
        />
        <KpiTile
          label={t("exports.kpi.tours")}
          value={kpi(num(overview?.totalTours))}
          hint={
            overview && hasData
              ? t("exports.kpi.commandsPerTour", {
                  value: formatValue(overview.avgCommandsPerTour, "decimal"),
                })
              : undefined
          }
          icon={Route}
        />
        <KpiTile
          label={t("exports.kpi.packagesPerCommand")}
          value={kpi(formatValue(overview?.avgPackagesPerCommand, "decimal"))}
          icon={Boxes}
        />
      </div>

      {isLoading && (
        <div className="flex min-h-[280px] flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6 text-center">
          <InlineSpinner />
          <p className="text-sm font-medium">
            {t("exports.clients.loadingTitle")}
          </p>
        </div>
      )}

      {!isLoading && isError && (
        <ErrorState
          error={overviewQuery.error ?? byClientQuery.error}
          retrying={overviewQuery.isFetching || byClientQuery.isFetching}
          onRetry={() => {
            overviewQuery.refetch();
            byClientQuery.refetch();
          }}
        />
      )}

      {!isLoading && !isError && params === null && (
        <EmptyState
          message={t("exports.clients.idle")}
          icon={<ChartColumn className="size-8" />}
          className="min-h-[280px] flex-1"
        />
      )}

      {!isLoading && !isError && params !== null && !hasData && (
        <EmptyState
          message={t("exports.clients.empty")}
          className="min-h-[280px] flex-1"
        />
      )}

      {!isLoading && !isError && hasData && (
        <>
          <Card>
            <CardContent className="p-0">
              <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="text-sm font-semibold">
                    {t("exports.clients.tableTitle", {
                      shown: visibleRows.length,
                      total: pharmacies.length,
                    })}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {t("exports.clients.selectedCount", {
                      count: selectedCips.length,
                    })}
                  </span>
                </div>
                <Input
                  value={search}
                  placeholder={t("exports.clients.searchPlaceholder")}
                  aria-label={t("exports.clients.searchPlaceholder")}
                  className="min-h-11 w-full shrink-0 sm:w-72 lg:min-h-10"
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              {visibleRows.length === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground">
                  {t("exports.clients.noMatch")}
                </p>
              ) : (
                <div
                  ref={scrollRef}
                  className="max-h-[480px] overflow-auto border-t border-border"
                >
                  <div className="min-w-[1120px]">
                    <div
                      className="sticky top-0 z-10 grid items-center gap-2 border-b border-border bg-background px-3"
                      style={{
                        gridTemplateColumns: GRID_TEMPLATE,
                        height: ROW_HEIGHT,
                      }}
                    >
                      <span />
                      {COLUMNS.map((column) => (
                        <button
                          key={column}
                          type="button"
                          className="flex items-center gap-1 truncate text-left text-xs font-semibold"
                          onClick={() =>
                            setSort((state) =>
                              state.key !== column
                                ? { key: column, direction: "asc" }
                                : state.direction === "asc"
                                  ? { key: column, direction: "desc" }
                                  : { key: "", direction: "asc" }
                            )
                          }
                        >
                          {t(`exports.columns.${column}`)}
                          {sort.key !== column ? (
                            <ArrowUpDown className="size-3 shrink-0 opacity-40" />
                          ) : sort.direction === "asc" ? (
                            <ArrowUp className="size-3 shrink-0" />
                          ) : (
                            <ArrowDown className="size-3 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>

                    <div
                      className="relative"
                      style={{ height: virtualizer.getTotalSize() }}
                    >
                      {virtualizer.getVirtualItems().map((virtualRow) => {
                        const row = visibleRows[virtualRow.index];
                        const selected = selectedCips.includes(row.clientId);
                        const lowRate =
                          (row.deliveryRate ?? 0) < LOW_DELIVERY_RATE_THRESHOLD;
                        return (
                          <button
                            key={row.clientId}
                            type="button"
                            role="checkbox"
                            aria-checked={selected}
                            onClick={() => toggleClient(row.clientId)}
                            className={cn(
                              "absolute top-0 left-0 grid w-full items-center gap-2 border-b border-border px-3 text-left transition-colors hover:bg-accent",
                              selected && "bg-primary/10",
                              lowRate && "text-status-warning-text"
                            )}
                            style={{
                              gridTemplateColumns: GRID_TEMPLATE,
                              height: virtualRow.size,
                              transform: `translateY(${virtualRow.start}px)`,
                            }}
                          >
                            <span
                              aria-hidden
                              className={cn(
                                "flex size-4 shrink-0 items-center justify-center rounded-sm border",
                                selected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-input"
                              )}
                            >
                              {selected && <Check className="size-3" />}
                            </span>
                            <span className="truncate font-mono text-xs">
                              {row.cip ?? "-"}
                            </span>
                            <span className="truncate text-xs font-medium">
                              {row.name || "-"}
                            </span>
                            <span className="truncate text-xs">
                              {row.city || "-"}
                            </span>
                            <span className="truncate text-xs">
                              {num(row.totalCommands)}
                            </span>
                            <span className="truncate text-xs">
                              {num(row.deliveredCommands)}
                            </span>
                            <span className="truncate text-xs">
                              {num(row.notDeliveredCommands)}
                            </span>
                            <span className="truncate text-xs">
                              {num(row.totalPackages)}
                            </span>
                            <span className="truncate text-xs">
                              {num(row.deliveredPackages)}
                            </span>
                            <span className="truncate text-xs font-medium">
                              {formatValue(row.deliveryRate, "rate")}
                            </span>
                            <span className="truncate text-xs">
                              {formatValue(row.totalWeight, "weight")}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div
                      className="sticky bottom-0 grid items-center gap-2 border-t border-border bg-muted px-3 font-semibold"
                      style={{
                        gridTemplateColumns: GRID_TEMPLATE,
                        height: ROW_HEIGHT,
                      }}
                    >
                      <span />
                      <span className="truncate text-xs">
                        {t("exports.values.pharmaciesCount", {
                          count: selectedPharmacies.length,
                        })}
                      </span>
                      <span />
                      <span />
                      <span className="truncate text-xs">
                        {num(totals.totalCommands)}
                      </span>
                      <span className="truncate text-xs">
                        {num(totals.deliveredCommands)}
                      </span>
                      <span className="truncate text-xs">
                        {num(totals.notDeliveredCommands)}
                      </span>
                      <span className="truncate text-xs">
                        {num(totals.totalPackages)}
                      </span>
                      <span className="truncate text-xs">
                        {num(totals.deliveredPackages)}
                      </span>
                      <span className="truncate text-xs">
                        {totals.deliveryRate === null
                          ? "-"
                          : formatValue(totals.deliveryRate, "rate")}
                      </span>
                      <span className="truncate text-xs">
                        {formatValue(totals.totalWeight, "weight")}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <p className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
                {t("exports.clients.tableNote")}
              </p>
            </CardContent>
          </Card>
        </>
      )}

      <SheetPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={t("exports.preview.clientsTitle")}
        sheets={previewOpen ? buildSheets() : []}
        canDownload={canExport}
        onDownload={handleDownload}
      />
    </div>
  );
}
