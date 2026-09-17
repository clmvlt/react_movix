import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Boxes,
  Car,
  Check,
  CheckSquare,
  Euro,
  Eye,
  FileSpreadsheet,
  Package,
  ReceiptText,
  Route,
  Search,
  Square,
  TrendingUp,
  TriangleAlert,
  Weight,
  X,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/states";
import { InlineSpinner } from "@/components/full-page-spinner";
import { InvoiceGenerateDialog } from "@/components/invoices/invoice-generate-dialog";
import { KpiTile } from "./kpi-tile";
import { SheetPreviewDialog } from "./sheet-preview-dialog";
import type { ExportFiltersApi } from "./use-export-filters";
import { ApiError } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { formatDate, formatDateTime } from "@/lib/date";
import { downloadWorkbook, formatValue } from "@/lib/xlsx";
import {
  buildTourSheets,
  computeTourTotals,
  flattenTourCommands,
  otherStatusCount,
  removedCommandCount,
  tourDriverName,
  tourExportFileName,
  useCancelTourExport,
  useTourExport,
  type TourCommandRow,
  type TourExportItem,
  type TourExportParams,
} from "@/features/exports";

const CONFIRM_DAYS = 31;
const COMMANDS_PAGE_SIZE = 50;

type SortDirection = "asc" | "desc";
interface SortState {
  key: string;
  direction: SortDirection;
}

const TOUR_COLUMNS = [
  "name",
  "date",
  "driver",
  "status",
  "commands",
  "delivered",
  "packages",
  "weight",
  "price",
  "realKm",
  "distance",
] as const;

const COMMAND_COLUMNS = [
  "tour",
  "date",
  "pharmacy",
  "cip",
  "city",
  "order",
  "status",
  "packages",
  "weight",
  "tarif",
  "distance",
] as const;

function nextSort(state: SortState, key: string): SortState {
  if (state.key !== key) return { key, direction: "asc" };
  if (state.direction === "asc") return { key, direction: "desc" };
  return { key: "", direction: "asc" };
}

function sortRows<T>(
  rows: T[],
  state: SortState,
  accessors: Record<string, (row: T) => string | number>
): T[] {
  const accessor = accessors[state.key];
  if (!accessor) return rows;
  const factor = state.direction === "asc" ? 1 : -1;
  return [...rows].sort((left, right) => {
    const a = accessor(left);
    const b = accessor(right);
    if (a < b) return -factor;
    if (a > b) return factor;
    return 0;
  });
}

function SortIcon({ state, column }: { state: SortState; column: string }) {
  if (state.key !== column) {
    return <ArrowUpDown className="size-3 shrink-0 opacity-40" />;
  }
  return state.direction === "asc" ? (
    <ArrowUp className="size-3 shrink-0" />
  ) : (
    <ArrowDown className="size-3 shrink-0" />
  );
}

export function TourExportTab({ api }: { api: ExportFiltersApi }) {
  const { t, i18n } = useTranslation();
  const { filters, setFilter, rangeError, rangeDays, rangeDaysInclusive } = api;

  const [params, setParams] = useState<TourExportParams | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [hideRemoved, setHideRemoved] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [tourSort, setTourSort] = useState<SortState>({
    key: "",
    direction: "asc",
  });
  const [commandSort, setCommandSort] = useState<SortState>({
    key: "",
    direction: "asc",
  });
  const [commandPage, setCommandPage] = useState(1);
  const [duration, setDuration] = useState<number | null>(null);
  const startedAtRef = useRef<number | null>(null);

  const query = useTourExport(params);
  const cancelExport = useCancelTourExport();

  const isLoading = params !== null && query.isFetching;

  useEffect(() => {
    if (!isLoading) {
      setElapsed(0);
      return;
    }
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [isLoading]);

  useEffect(() => {
    if (!query.data) return;
    setSelectedIds(query.data.tours.map((tour) => tour.id));
    setCommandPage(1);
    if (startedAtRef.current !== null) {
      setDuration(Math.round(performance.now() - startedAtRef.current));
      startedAtRef.current = null;
    }
  }, [query.data]);

  const unassigned = t("exports.values.unassigned");
  const loadedTours = query.data?.tours ?? [];
  const selectedTours = loadedTours.filter((tour) =>
    selectedIds.includes(tour.id)
  );
  const isAllSelected =
    loadedTours.length > 0 && selectedIds.length === loadedTours.length;

  const localTotals = computeTourTotals(selectedTours, hideRemoved);
  const serverSummary = query.data?.summary;
  const totals =
    serverSummary && isAllSelected && !hideRemoved
      ? {
          ...serverSummary,
          isLocal: false,
          commandsWithoutTarif: localTotals.commandsWithoutTarif,
          removedCommands: localTotals.removedCommands,
        }
      : localTotals;

  const commandRows = flattenTourCommands(
    selectedTours,
    hideRemoved,
    unassigned
  );

  const tourAccessors: Record<string, (tour: TourExportItem) => string | number> =
    {
      name: (tour) => (tour.name ?? "").toLowerCase(),
      date: (tour) => tour.initialDate ?? "",
      driver: (tour) => tourDriverName(tour, unassigned).toLowerCase(),
      status: (tour) => (tour.statusName ?? "").toLowerCase(),
      commands: (tour) => tour.totalCommands ?? 0,
      delivered: (tour) => tour.deliveredCommands ?? 0,
      packages: (tour) => tour.totalPackages ?? 0,
      weight: (tour) => tour.totalWeight ?? 0,
      price: (tour) => tour.totalPrice ?? 0,
      realKm: (tour) => tour.realKm ?? 0,
      distance: (tour) => tour.totalCalculatedDistance ?? 0,
    };

  const commandAccessors: Record<
    string,
    (row: TourCommandRow) => string | number
  > = {
    tour: (row) => (row.tourName ?? "").toLowerCase(),
    date: (row) => row.tourDate ?? "",
    pharmacy: (row) => (row.command.pharmacyName ?? "").toLowerCase(),
    cip: (row) => row.command.pharmacyCip ?? "",
    city: (row) => (row.command.pharmacyCity ?? "").toLowerCase(),
    order: (row) => row.command.tourOrder ?? 0,
    status: (row) => (row.command.statusName ?? "").toLowerCase(),
    packages: (row) => row.command.packageCount ?? 0,
    weight: (row) => row.command.weight ?? 0,
    tarif: (row) => row.command.tarif ?? 0,
    distance: (row) => row.command.distance ?? 0,
  };

  const sortedTours = sortRows(selectedTours, tourSort, tourAccessors);
  const sortedCommands = sortRows(commandRows, commandSort, commandAccessors);
  const pageCount = Math.max(
    1,
    Math.ceil(sortedCommands.length / COMMANDS_PAGE_SIZE)
  );
  const safePage = Math.min(commandPage, pageCount);
  const pagedCommands = sortedCommands.slice(
    (safePage - 1) * COMMANDS_PAGE_SIZE,
    safePage * COMMANDS_PAGE_SIZE
  );

  const deliveryRate = totals.totalCommands
    ? (totals.totalDeliveredCommands / totals.totalCommands) * 100
    : null;

  const toursWithoutTarif = selectedTours.filter(
    (tour) => (tour.commandsWithoutTarif ?? 0) > 0
  );
  const hasRemovedCommands = loadedTours.some((tour) =>
    tour.commands.some((command) => command.removedDuringDebrief)
  );
  const canExport = !isLoading && !isExporting && selectedTours.length > 0;

  const buildSheets = () =>
    params
      ? buildTourSheets({
          tours: selectedTours,
          totals,
          params,
          excludeRemoved: hideRemoved,
          loadedTourCount: loadedTours.length,
          t,
        })
      : [];

  const startLoad = () => {
    startedAtRef.current = performance.now();
    setDuration(null);
    setParams({
      startDate: filters.startDate,
      endDate: filters.endDate,
      closedOnly: filters.closedOnly,
    });
  };

  const requestLoad = () => {
    if (rangeError) return;
    if (rangeDays > CONFIRM_DAYS) {
      setConfirmOpen(true);
      return;
    }
    startLoad();
  };

  const handleCancel = async () => {
    if (params) await cancelExport(params);
    setParams(null);
  };

  const toggleTour = (tourId: string) => {
    setSelectedIds((previous) =>
      previous.includes(tourId)
        ? previous.filter((id) => id !== tourId)
        : [...previous, tourId]
    );
  };

  const toggleAll = () => {
    setSelectedIds(isAllSelected ? [] : loadedTours.map((tour) => tour.id));
  };

  const handleDownload = async () => {
    if (!params || !canExport) return;
    setIsExporting(true);
    setProgress(0);
    setProgressLabel(t("exports.progress.preparing"));
    try {
      await downloadWorkbook(
        buildSheets(),
        tourExportFileName(params),
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

  const errorMessage = () => {
    const error = query.error;
    if (!(error instanceof ApiError)) return t("errors.loadFailed");
    if (error.status === 403) return t("exports.errors.adminOnly");
    if (error.status === 408) return t("exports.errors.timeout");
    return error.message || t("errors.loadFailed");
  };

  const num = (value: number | null | undefined) =>
    formatValue(value, "integer");

  const hasData = loadedTours.length > 0;
  const kpi = (value: string) => (hasData ? value : "");

  const notices = hasData
    ? [
        totals.isLocal ? t("exports.tours.localTotals") : null,
        toursWithoutTarif.length > 0
          ? t("exports.tours.withoutTarif", {
              commands: totals.commandsWithoutTarif,
              tours: toursWithoutTarif.length,
            })
          : null,
        totals.removedCommands > 0 && !hideRemoved
          ? t("exports.tours.removedNotice", { count: totals.removedCommands })
          : null,
      ].filter((line): line is string => line !== null)
    : [];

  return (
    <div className="flex flex-1 flex-col gap-3">
      <InvoiceGenerateDialog
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
        tourIds={selectedTours.map((tour) => tour.id)}
      />
      <Card>
        <CardContent className="flex flex-col gap-3 p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex min-h-10 items-center gap-2">
                <Checkbox
                  id="tour-closed-only"
                  checked={filters.closedOnly}
                  disabled={isLoading}
                  onCheckedChange={(checked) =>
                    setFilter("closedOnly", checked === true)
                  }
                />
                <Label htmlFor="tour-closed-only" className="cursor-pointer">
                  {t("exports.filters.closedOnly")}
                </Label>
              </div>
              <div className="flex min-h-10 items-center gap-2">
                <Checkbox
                  id="tour-hide-removed"
                  checked={hideRemoved}
                  disabled={!hasRemovedCommands}
                  onCheckedChange={(checked) =>
                    setHideRemoved(checked === true)
                  }
                />
                <Label
                  htmlFor="tour-hide-removed"
                  className={cn(
                    "cursor-pointer",
                    !hasRemovedCommands && "text-muted-foreground"
                  )}
                >
                  {t("exports.tours.hideRemoved")}
                </Label>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isLoading ? (
                <>
                  <Button disabled className="min-h-11 lg:min-h-10">
                    {t("exports.actions.loadingWithTime", { seconds: elapsed })}
                  </Button>
                  <Button
                    variant="outline"
                    className="min-h-11 lg:min-h-10"
                    onClick={handleCancel}
                  >
                    <X className="size-4" />
                    {t("common.cancel")}
                  </Button>
                </>
              ) : (
                <Button
                  className="min-h-11 lg:min-h-10"
                  disabled={rangeError !== null}
                  onClick={requestLoad}
                >
                  <Search className="size-4" />
                  {t("exports.actions.load")}
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex min-h-10 flex-wrap items-center gap-2 text-sm">
              {hasData ? (
                <>
                  <span className="font-semibold">
                    {t("exports.tours.found", { count: loadedTours.length })}
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
                variant="outline"
                className="min-h-11 lg:min-h-10"
                disabled={selectedTours.length === 0}
                onClick={() => setInvoiceOpen(true)}
              >
                <ReceiptText className="size-3.5" />
                {t("invoices.generate.actionSelection", {
                  count: selectedTours.length,
                })}
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
            {t("exports.tours.scopeHint")}
          </p>
        </CardContent>
      </Card>

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
          label={t("exports.kpi.tours")}
          value={kpi(num(totals.tourCount))}
          icon={Route}
        />
        <KpiTile
          label={t("exports.kpi.commands")}
          value={kpi(num(totals.totalCommands))}
          hint={
            hasData
              ? t("exports.kpi.deliveredHint", {
                  count: totals.totalDeliveredCommands,
                })
              : undefined
          }
          icon={Package}
        />
        <KpiTile
          label={t("exports.kpi.deliveryRate")}
          value={kpi(
            deliveryRate === null ? "-" : formatValue(deliveryRate, "rate")
          )}
          icon={TrendingUp}
        />
        <KpiTile
          label={t("exports.kpi.packages")}
          value={kpi(num(totals.totalPackages))}
          hint={
            hasData
              ? t("exports.kpi.deliveredHint", {
                  count: totals.totalDeliveredPackages,
                })
              : undefined
          }
          icon={Boxes}
        />
        <KpiTile
          label={t("exports.kpi.weight")}
          value={kpi(formatValue(totals.totalWeight, "weight"))}
          icon={Weight}
        />
        <KpiTile
          label={t("exports.kpi.billed")}
          value={kpi(formatValue(totals.totalPrice, "currency"))}
          icon={Euro}
        />
        <KpiTile
          label={t("exports.kpi.calculatedKm")}
          value={kpi(formatValue(totals.totalCalculatedDistance, "distance"))}
          icon={Route}
        />
        <KpiTile
          label={t("exports.kpi.realKm")}
          value={kpi(formatValue(totals.totalRealKm, "distance"))}
          icon={Car}
        />
      </div>

      {isLoading && (
        <div className="flex min-h-[280px] flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6 text-center">
          <InlineSpinner />
          <p className="text-sm font-medium">
            {t("exports.tours.loadingTitle")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("exports.tours.loadingDetail", {
              seconds: elapsed,
              days: rangeDaysInclusive,
            })}
          </p>
        </div>
      )}

      {!isLoading && query.isError && (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertDescription>{errorMessage()}</AlertDescription>
        </Alert>
      )}

      {!isLoading && !query.isError && params === null && (
        <EmptyState
          message={t("exports.tours.idle")}
          icon={<FileSpreadsheet className="size-8" />}
          className="min-h-[280px] flex-1"
        />
      )}

      {!isLoading && !query.isError && params !== null && query.data && !hasData && (
        <EmptyState
          message={t("exports.tours.empty")}
          className="min-h-[280px] flex-1"
        />
      )}

      {!isLoading && !query.isError && hasData && (
        <>
          <Card>
            <CardContent className="p-0">
              <p className="p-3 text-sm font-semibold">
                {t("exports.tours.selectionTitle", {
                  count: selectedTours.length,
                })}
              </p>
              <div className="max-h-80 overflow-y-auto border-t border-border">
                {loadedTours.map((tour) => {
                  const selected = selectedIds.includes(tour.id);
                  return (
                    <button
                      key={tour.id}
                      type="button"
                      role="checkbox"
                      aria-checked={selected}
                      onClick={() => toggleTour(tour.id)}
                      className={cn(
                        "flex min-h-11 w-full items-start gap-3 border-b border-border p-3 text-left transition-colors last:border-b-0 hover:bg-accent",
                        selected && "bg-primary/10"
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm border",
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input"
                        )}
                      >
                        {selected && <Check className="size-3" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="mb-1 flex flex-wrap items-center gap-2">
                          <span
                            aria-hidden
                            className="size-2.5 shrink-0 rounded-full border border-border"
                            style={{
                              backgroundColor: tour.color ?? "transparent",
                            }}
                          />
                          <span className="min-w-0 flex-1 truncate font-semibold">
                            {tour.name || t("exports.values.unnamedTour")}
                          </span>
                          <span className="shrink-0 rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            {formatDate(tour.initialDate, i18n.language) ||
                              t("exports.values.unknownDate")}
                          </span>
                        </span>
                        <span className="flex flex-col gap-1 text-sm sm:flex-row sm:gap-4">
                          <span className="truncate">
                            {tourDriverName(tour, unassigned)}
                          </span>
                          <span className="truncate">
                            {tour.immat || t("exports.values.noPlate")}
                          </span>
                          <span className="truncate">
                            {t("exports.tours.countsInline", {
                              commands: tour.totalCommands,
                              packages: tour.totalPackages,
                            })}
                          </span>
                          <span className="truncate">
                            {formatValue(tour.totalPrice, "currency")}
                          </span>
                        </span>
                        {(removedCommandCount(tour) > 0 ||
                          (tour.commandsWithoutTarif ?? 0) > 0) && (
                          <span className="mt-1.5 flex flex-wrap gap-1.5">
                            {removedCommandCount(tour) > 0 && (
                              <Badge variant="secondary" className="text-[10px]">
                                {t("exports.tours.removedBadge", {
                                  count: removedCommandCount(tour),
                                })}
                              </Badge>
                            )}
                            {(tour.commandsWithoutTarif ?? 0) > 0 && (
                              <Badge variant="outline" className="text-[10px]">
                                {t("exports.tours.withoutTarifBadge", {
                                  count: tour.commandsWithoutTarif,
                                })}
                              </Badge>
                            )}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <p className="p-3 text-sm font-semibold">
                {t("exports.tours.tableTitle")}
              </p>
              <div className="max-h-[440px] overflow-auto border-t border-border">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-background">
                    <TableRow>
                      {TOUR_COLUMNS.map((column) => (
                        <TableHead
                          key={column}
                          className="cursor-pointer text-xs font-semibold whitespace-nowrap select-none"
                          onClick={() =>
                            setTourSort((state) => nextSort(state, column))
                          }
                        >
                          <span className="inline-flex items-center gap-1">
                            {t(`exports.columns.${column}`)}
                            <SortIcon state={tourSort} column={column} />
                          </span>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedTours.map((tour) => (
                      <TableRow key={tour.id}>
                        <TableCell className="text-xs font-medium whitespace-nowrap">
                          {tour.name || t("exports.values.unnamedTour")}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {formatDate(tour.initialDate, i18n.language)}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {tourDriverName(tour, unassigned)}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {tour.statusName || "-"}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {tour.totalCommands}
                          {otherStatusCount(tour) > 0 && (
                            <span className="text-muted-foreground">
                              {" "}
                              {t("exports.tours.otherStatuses", {
                                count: otherStatusCount(tour),
                              })}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {tour.deliveredCommands}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {tour.totalPackages}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {formatValue(tour.totalWeight, "weight")}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {formatValue(tour.totalPrice, "currency")}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {formatValue(tour.realKm, "distance") || "-"}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {formatValue(tour.totalCalculatedDistance, "distance")}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="sticky bottom-0 font-semibold [&>td]:bg-muted">
                      <TableCell className="text-xs whitespace-nowrap">
                        {t("exports.values.toursCount", {
                          count: sortedTours.length,
                        })}
                      </TableCell>
                      <TableCell />
                      <TableCell />
                      <TableCell />
                      <TableCell className="text-xs whitespace-nowrap">
                        {num(totals.totalCommands)}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {num(totals.totalDeliveredCommands)}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {num(totals.totalPackages)}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {formatValue(totals.totalWeight, "weight")}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {formatValue(totals.totalPrice, "currency")}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {formatValue(totals.totalRealKm, "distance")}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {formatValue(totals.totalCalculatedDistance, "distance")}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold">
                  {t("exports.tours.commandsTitle", {
                    count: sortedCommands.length,
                  })}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-10"
                    disabled={safePage <= 1}
                    onClick={() => setCommandPage(safePage - 1)}
                  >
                    {t("common.previous")}
                  </Button>
                  <span className="text-xs whitespace-nowrap text-muted-foreground">
                    {safePage} / {pageCount}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-10"
                    disabled={safePage >= pageCount}
                    onClick={() => setCommandPage(safePage + 1)}
                  >
                    {t("common.next")}
                  </Button>
                </div>
              </div>

              {sortedCommands.length === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground">
                  {t("exports.tours.noCommands")}
                </p>
              ) : (
                <div className="max-h-[440px] overflow-auto border-t border-border">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-background">
                      <TableRow>
                        {COMMAND_COLUMNS.map((column) => (
                          <TableHead
                            key={column}
                            className="cursor-pointer text-xs font-semibold whitespace-nowrap select-none"
                            onClick={() =>
                              setCommandSort((state) => nextSort(state, column))
                            }
                          >
                            <span className="inline-flex items-center gap-1">
                              {t(`exports.columns.${column}`)}
                              <SortIcon state={commandSort} column={column} />
                            </span>
                          </TableHead>
                        ))}
                        <TableHead className="text-xs font-semibold whitespace-nowrap">
                          {t("exports.columns.expDate")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedCommands.map((row) => (
                        <TableRow
                          key={row.command.id}
                          className={
                            row.command.removedDuringDebrief
                              ? "bg-muted/50 opacity-60"
                              : undefined
                          }
                        >
                          <TableCell className="text-xs whitespace-nowrap">
                            {row.tourName || t("exports.values.unnamedTour")}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {formatDate(row.tourDate, i18n.language)}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5">
                              {row.command.pharmacyName || "-"}
                              {row.command.newPharmacy && (
                                <Badge className="text-[10px]">
                                  {t("exports.tours.newPharmacy")}
                                </Badge>
                              )}
                              {row.command.removedDuringDebrief && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  {t("exports.tours.removed")}
                                </Badge>
                              )}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-xs whitespace-nowrap">
                            {row.command.pharmacyCip || "-"}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {row.command.pharmacyCity || "-"}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {row.command.tourOrder ?? "-"}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {row.command.statusName || "-"}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {row.command.packageCount}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {formatValue(row.command.weight, "weight")}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {formatValue(row.command.tarif, "currency")}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {formatValue(row.command.distance, "distance")}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {formatDateTime(row.command.expDate, i18n.language)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t("exports.confirm.title", { count: rangeDaysInclusive })}
            </DialogTitle>
            <DialogDescription>
              {t("exports.confirm.body", { days: CONFIRM_DAYS })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="min-h-11"
              onClick={() => setConfirmOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              className="min-h-11"
              onClick={() => {
                setConfirmOpen(false);
                startLoad();
              }}
            >
              {t("exports.confirm.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SheetPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={t("exports.preview.toursTitle")}
        sheets={previewOpen ? buildSheets() : []}
        canDownload={canExport}
        onDownload={handleDownload}
      />
    </div>
  );
}
