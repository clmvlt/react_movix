import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Boxes,
  ChevronDown,
  ClipboardCheck,
  Clock,
  Eye,
  EyeOff,
  FileDown,
  Gauge,
  History,
  Info,
  Loader2,
  LogIn,
  LogOut,
  MapPin,
  Package,
  Pencil,
  Play,
  Plus,
  ReceiptEuro,
  Route,
  Square,
  Timer,
  Trash2,
  Truck,
  User,
  UserPlus,
  Wand2,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { DateField } from "@/components/date-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ColorPicker } from "@/components/color-picker";
import { CommandActions } from "@/components/command-actions";
import { CommandContextMenu } from "@/components/commands/command-context-menu";
import { CommandList, type CommandListHandle } from "@/components/command-list";
import { SelectionBar } from "@/components/selection-bar";
import { ViewSwitch } from "@/components/view-switch";
import { StatusBadge } from "@/components/status-badge";
import { ColorDot } from "@/components/color-dot";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { CreateTourDialog } from "@/components/tours/create-tour-dialog";
import { DeleteTourDialog } from "@/components/tours/delete-tour-dialog";
import { TourContextMenu } from "@/components/tours/tour-context-menu";
import { TourAssignDialog } from "@/components/tours/tour-assign-dialog";
import { TourHistoryDialog } from "@/components/tours/tour-history-dialog";
import { TourStatusDialog } from "@/components/tours/tour-status-dialog";
import { UnsortedBadge } from "@/components/tours/unsorted-badge";
import { NotProvided } from "@/components/not-provided";
import {
  initialTourForm,
  pdfErrorKey,
  tourFormToUpdateInput,
  type TourForm,
} from "@/components/tours/tour-form";
import {
  MapView,
  MapMarker,
  MapAutoFit,
  MapFlyTo,
  MapRoute,
  DepotMarker,
  geometryToCoordinates,
  type LngLat,
} from "@/components/map";
import { getStatusTokens, safeCategoryColor } from "@/lib/colors";
import { tourStatusCategory } from "@/lib/status";
import {
  addMinutes,
  formatDateTime,
  formatDuration,
  frTimeToTimeInput,
  parseDate,
  toTimeInput,
  withTime,
} from "@/lib/date";
import { cn } from "@/lib/utils";
import { useAuth } from "@/app/auth-context";
import { usePdfPreview } from "@/app/pdf-preview-context";
import { useWorkingDate } from "@/app/working-date-context";
import { profilFullName } from "@/features/auth";
import { DeletedProfilBadge } from "@/components/deleted-profil-badge";
import { useProfiles } from "@/features/profiles";
import {
  canDownloadTourPdf,
  CLOSED_TOUR_STATUS_ID,
  isTourClosed,
  isTourDebrief,
  isTourUnsorted,
  tourArrivalEstimates,
  tourPdfFilename,
  tourPdfService,
  useDeleteTour,
  useToursByDate,
  useUpdateTour,
  useUpdateTourStatus,
  type Tour,
  type TourCommand,
  type TourPdfKind,
} from "@/features/tours";

function commandCoords(command: TourCommand): LngLat | null {
  const lng = command.pharmacy?.longitude;
  const lat = command.pharmacy?.latitude;
  if (lng == null || lat == null) return null;
  return [lng, lat];
}

type TourView = "orders" | "map" | "info";

function packagesOf(command: TourCommand): number {
  return command.packagesNumber ?? command.packages?.length ?? 0;
}

export function ToursPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { date } = useWorkingDate();

  const { data, isLoading, isError, error, refetch, isFetching } =
    useToursByDate(date);
  const tours = useMemo(() => data ?? [], [data]);

  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get("view");
  const view: TourView =
    viewParam === "map" || viewParam === "info" ? viewParam : "orders";
  const setView = (next: TourView) =>
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.set("view", next);
        return params;
      },
      { replace: true }
    );

  const selectedTourId = searchParams.get("tour");
  const setSelectedTourId = (id: string | null) =>
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        if (id) params.set("tour", id);
        else params.delete("tour");
        return params;
      },
      { replace: true }
    );

  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());
  const [hideClosed, setHideClosed] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const listRef = useRef<CommandListHandle | null>(null);

  const deleteTour = useDeleteTour();
  const profilesQuery = useProfiles();
  const openPdfPreview = usePdfPreview();

  const selectedTour = useMemo(
    () => tours.find((tour) => tour.id === selectedTourId) ?? null,
    [tours, selectedTourId]
  );

  const closedCount = useMemo(
    () => tours.filter((tour) => isTourClosed(tour.status)).length,
    [tours]
  );

  const visibleTours = useMemo(() => {
    const sorted = [...tours].sort(
      (a, b) =>
        (isTourClosed(a.status) ? 1 : 0) - (isTourClosed(b.status) ? 1 : 0)
    );
    return hideClosed
      ? sorted.filter((tour) => !isTourClosed(tour.status))
      : sorted;
  }, [tours, hideClosed]);

  useEffect(() => {
    if (!data) return;
    const fallback = visibleTours[0]?.id ?? null;
    const valid =
      selectedTourId != null &&
      visibleTours.some((tour) => tour.id === selectedTourId);
    if (valid || selectedTourId === fallback) return;
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        if (fallback) params.set("tour", fallback);
        else params.delete("tour");
        return params;
      },
      { replace: true }
    );
  }, [data, visibleTours, selectedTourId, setSearchParams]);

  useEffect(() => {
    setHighlighted(new Set());
  }, [selectedTourId]);

  const account = user?.account;
  const depotCoords = useMemo<LngLat | null>(
    () =>
      account?.longitude != null && account?.latitude != null
        ? [account.longitude, account.latitude]
        : null,
    [account?.longitude, account?.latitude]
  );

  const commands = useMemo(() => selectedTour?.commands ?? [], [selectedTour]);

  const arrivalEstimates = useMemo(
    () => tourArrivalEstimates(selectedTour),
    [selectedTour]
  );

  const commandRows = useMemo(() => {
    if (arrivalEstimates.size === 0) return commands;
    return commands.map((command) => {
      const estimatedArrival = arrivalEstimates.get(command.id);
      return estimatedArrival ? { ...command, estimatedArrival } : command;
    });
  }, [commands, arrivalEstimates]);

  const routeCoords = useMemo(
    () => geometryToCoordinates(selectedTour?.geometry),
    [selectedTour]
  );

  const points = useMemo(() => {
    const list = commands
      .map(commandCoords)
      .filter((p): p is LngLat => p !== null);
    return depotCoords ? [...list, depotCoords] : list;
  }, [commands, depotCoords]);

  const toggleHighlight = (id: string) =>
    setHighlighted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectFromMap = (id: string) => {
    toggleHighlight(id);
    listRef.current?.scrollToId(id);
  };

  const [focus, setFocus] = useState<{ center: LngLat; token: number } | null>(
    null
  );

  const locate = (id: string) => {
    const command = commands.find((item) => item.id === id);
    const coords = command ? commandCoords(command) : null;
    if (!coords) return;
    setFocus((prev) => ({ center: coords, token: (prev?.token ?? 0) + 1 }));
    setView("map");
  };

  const clearSelection = () => setHighlighted(new Set());
  const hasSelection = highlighted.size > 0;
  const allSelected =
    commands.length > 0 &&
    commands.every((command) => highlighted.has(command.id));
  const toggleAll = () =>
    setHighlighted(
      allSelected ? new Set() : new Set(commands.map((command) => command.id))
    );
  const selectedCommandIds = useMemo(
    () => Array.from(highlighted),
    [highlighted]
  );
  const selectedTourLocked = isTourClosed(selectedTour?.status);
  const otherTours = useMemo(
    () =>
      tours.filter(
        (tour) => tour.id !== selectedTourId && !isTourClosed(tour.status)
      ),
    [tours, selectedTourId]
  );

  const drivers = useMemo(
    () => (profilesQuery.data ?? []).filter((p) => p.isActive),
    [profilesQuery.data]
  );

  const handleShowPdf = (kind: TourPdfKind) => {
    if (!selectedTour) return;
    openPdfPreview({
      key: ["tours", "pdf", selectedTour.id, kind],
      title: t(kind === "tarif" ? "tours.pdfTarifTitle" : "tours.pdfTitle"),
      subtitle: selectedTour.name,
      filename: tourPdfFilename(selectedTour, kind, date),
      load: () => tourPdfService.fetch(selectedTour.id, kind),
      describeError: (error) => t(pdfErrorKey(error)),
    });
  };

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
            <MobileTourPicker
              tours={visibleTours}
              selectedTourId={selectedTourId}
              onSelect={setSelectedTourId}
              emptyLabel={
                tours.length === 0
                  ? t("tours.empty")
                  : t("tours.allClosedHidden", { count: closedCount })
              }
              closedCount={closedCount}
              hideClosed={hideClosed}
              onToggleClosed={() => setHideClosed((value) => !value)}
              onCreate={() => setCreateOpen(true)}
            />
          </div>

          <ViewSwitch
            className="shrink-0 lg:hidden"
            value={view}
            onChange={setView}
            items={[
              {
                value: "orders",
                label: t("common.views.orders"),
                icon: Package,
                count: commands.length,
              },
              { value: "map", label: t("common.views.map"), icon: MapPin },
              { value: "info", label: t("common.views.details"), icon: Info },
            ]}
          />

          <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
            <div
              className={cn(
                "flex min-h-0 w-full flex-col gap-3 lg:w-[440px] lg:shrink-0",
                view !== "orders" && "hidden lg:flex"
              )}
            >
              <div className="hidden flex-col lg:flex">
                <div className="mb-2 flex items-center justify-between gap-2 px-1">
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    {t("tours.listLabel", { count: tours.length })}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {closedCount > 0 && (
                      <Button
                        variant={hideClosed ? "default" : "outline"}
                        size="icon"
                        className="size-7"
                        onClick={() => setHideClosed((value) => !value)}
                        title={t("tours.hideClosed")}
                        aria-label={t("tours.hideClosed")}
                      >
                        {hideClosed ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="default"
                      size="icon"
                      className="size-7"
                      onClick={() => setCreateOpen(true)}
                      title={t("tours.create")}
                      aria-label={t("tours.create")}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </div>
                {tours.length === 0 ? (
                  <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                    {t("tours.empty")}
                  </p>
                ) : visibleTours.length === 0 ? (
                  <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                    {t("tours.allClosedHidden", { count: closedCount })}
                  </p>
                ) : (
                  <div className="max-h-52 min-h-0 overflow-y-auto pr-1">
                    <ul className="divide-y divide-border overflow-hidden rounded-xl border bg-card">
                    {visibleTours.map((tour) => {
                      const closed = isTourClosed(tour.status);
                      const debrief = isTourDebrief(tour.status);
                      return (
                        <li key={tour.id}>
                          <TourContextMenu
                            tour={tour}
                            drivers={drivers}
                            date={date}
                            onOpened={() => setSelectedTourId(tour.id)}
                            onDeleted={() => {
                              if (tour.id === selectedTourId)
                                setSelectedTourId(null);
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedTourId(tour.id)}
                              className={cn(
                                "flex w-full flex-col gap-0.5 px-2.5 py-1.5 text-left transition-colors",
                                tour.id === selectedTourId
                                  ? "bg-primary/10"
                                  : "hover:bg-accent",
                                closed && "opacity-70"
                              )}
                            >
                              <span className="flex items-center gap-1.5">
                                <ColorDot color={tour.color || "#2563eb"} />
                                <span className="truncate font-medium text-foreground">
                                  {tour.name}
                                </span>
                                {isTourUnsorted(tour) && (
                                  <UnsortedBadge className="shrink-0" />
                                )}
                                {(closed || debrief) && tour.status && (
                                  <StatusBadge
                                    label={tour.status.name}
                                    category={tourStatusCategory(
                                      tour.status.id
                                    )}
                                    className="ml-auto shrink-0"
                                  />
                                )}
                              </span>
                              <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 pl-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Package className="size-3" />
                                  {tour.commands?.length ?? 0}
                                </span>
                                {tour.estimateKm != null && (
                                  <span>{Math.round(tour.estimateKm)} km</span>
                                )}
                                {tour.estimateMins != null && (
                                  <span>
                                    {formatDuration(tour.estimateMins)}
                                  </span>
                                )}
                              </span>
                            </button>
                          </TourContextMenu>
                        </li>
                      );
                    })}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex min-h-0 flex-1 flex-col">
                <div className="mb-2 flex h-12 shrink-0 items-center gap-1.5 rounded-xl border bg-card p-1.5 lg:h-11">
                  <Checkbox
                    id="tour-commands-select-all"
                    className="ml-1.5 shrink-0"
                    checked={allSelected}
                    disabled={commands.length === 0}
                    onCheckedChange={toggleAll}
                    aria-label={t("tours.detail.selectAll")}
                  />
                  <div className="flex min-w-0 flex-1 items-center gap-1.5 pl-1">
                    {hasSelection ? (
                      <>
                        <span
                          className="truncate text-sm font-medium text-foreground"
                          title={t("expeditions.selected", {
                            count: highlighted.size,
                          })}
                        >
                          {t("expeditions.selected", {
                            count: highlighted.size,
                          })}
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
                      <label
                        htmlFor="tour-commands-select-all"
                        className="cursor-pointer truncate text-xs font-medium uppercase text-muted-foreground"
                      >
                        {t("tours.detail.orders")} ({commands.length})
                      </label>
                    )}
                  </div>
                  <span className="mx-0.5 hidden h-5 w-px shrink-0 bg-border lg:block" />
                  <div className="hidden items-center gap-1.5 lg:flex">
                    <CommandActions
                      commandIds={selectedCommandIds}
                      tours={otherTours}
                      onDone={clearSelection}
                      disabled={selectedTourLocked}
                      lockedTitle={t("tours.lockedClosed")}
                    />
                  </div>
                </div>
                {commands.length === 0 ? (
                  <EmptyState
                    message={t("tours.detail.noOrders")}
                    className="min-h-0 flex-1"
                  />
                ) : (
                  <CommandList
                    items={commandRows}
                    selectedIds={highlighted}
                    onToggle={toggleHighlight}
                    onOpen={(id) => navigate(`/app/commands/${id}`)}
                    onOpenPharmacy={(cip) =>
                      navigate(`/app/pharmacies/${encodeURIComponent(cip)}`)
                    }
                    onLocate={locate}
                    ref={listRef}
                    wrapItem={(command, node) => (
                      <CommandContextMenu
                        commandIds={
                          highlighted.has(command.id)
                            ? selectedCommandIds
                            : [command.id]
                        }
                        pharmacy={command.pharmacy}
                        tours={otherTours}
                        onDone={
                          highlighted.has(command.id)
                            ? clearSelection
                            : undefined
                        }
                        disabled={selectedTourLocked}
                      >
                        {node}
                      </CommandContextMenu>
                    )}
                    showOrder
                    showDate
                    className={cn(
                      "min-h-0",
                      hasSelection && "pb-28 lg:pb-0"
                    )}
                  />
                )}
              </div>
            </div>

            <div
              className={cn(
                "flex min-h-0 flex-1 flex-col gap-4",
                view === "orders" && "hidden lg:flex"
              )}
            >
              <div
                className={cn(
                  "lg:block lg:flex-none lg:overflow-visible",
                  view === "info"
                    ? "min-h-0 flex-1 overflow-y-auto"
                    : "hidden lg:block"
                )}
              >
                {selectedTour ? (
                  <TourInfo
                    tour={selectedTour}
                    locked={isTourClosed(selectedTour.status)}
                    packageCount={commands.reduce(
                      (s, c) => s + packagesOf(c),
                      0
                    )}
                    commandCount={commands.length}
                    canPdf={canDownloadTourPdf(user, "standard")}
                    canPdfTarif={canDownloadTourPdf(user, "tarif")}
                    onOpenStatus={() => setStatusOpen(true)}
                    onOpenAssign={() => setAssignOpen(true)}
                    onOpenHistory={() => setHistoryOpen(true)}
                    onShowPdf={handleShowPdf}
                    onDelete={() => setDeleteOpen(true)}
                    onOpenOrder={() =>
                      navigate(`/app/tours/${selectedTour.id}/order`)
                    }
                  />
                ) : (
                  <TourInfoPlaceholder />
                )}
              </div>

              <div
                className={cn(
                  "min-h-0 flex-1 overflow-hidden rounded-xl border",
                  view !== "map" && "hidden lg:block"
                )}
              >
                <MapView
                  center={depotCoords ?? undefined}
                  zoom={depotCoords ? 9 : 5}
                >
                  <MapAutoFit points={points} />
                  <MapFlyTo
                    center={focus?.center ?? null}
                    zoom={15}
                    token={focus?.token}
                  />
                  {selectedTour && routeCoords.length >= 2 && (
                    <MapRoute
                      id="tour"
                      coordinates={routeCoords}
                      color={selectedTour.color || "#2563eb"}
                    />
                  )}
                  {depotCoords && (
                    <DepotMarker
                      longitude={depotCoords[0]}
                      latitude={depotCoords[1]}
                      title={account?.societe ?? t("expeditions.depot")}
                    />
                  )}
                  {commands.map((command, index) => {
                    const coords = commandCoords(command);
                    if (!coords) return null;
                    return (
                      <MapMarker
                        key={command.id}
                        longitude={coords[0]}
                        latitude={coords[1]}
                        color={selectedTour?.color || "#2563eb"}
                        selected={highlighted.has(command.id)}
                        title={command.pharmacy?.name}
                        label={command.tourOrder ?? index + 1}
                        onClick={() => selectFromMap(command.id)}
                      />
                    );
                  })}
                </MapView>
              </div>
            </div>
          </div>

          <SelectionBar count={highlighted.size} onClear={clearSelection}>
            <CommandActions
              layout="bar"
              commandIds={selectedCommandIds}
              tours={otherTours}
              onDone={clearSelection}
              disabled={selectedTourLocked}
              lockedTitle={t("tours.lockedClosed")}
            />
          </SelectionBar>
        </>
      )}

      <CreateTourDialog open={createOpen} onOpenChange={setCreateOpen} />
      {selectedTour && (
        <>
          <TourStatusDialog
            open={statusOpen}
            onOpenChange={setStatusOpen}
            tourId={selectedTour.id}
            tourName={selectedTour.name}
          />
          <TourAssignDialog
            open={assignOpen}
            onOpenChange={setAssignOpen}
            tourId={selectedTour.id}
            tourName={selectedTour.name}
            drivers={drivers}
          />
          <TourHistoryDialog
            open={historyOpen}
            onOpenChange={setHistoryOpen}
            tourId={selectedTour.id}
            tourName={selectedTour.name}
          />
          <DeleteTourDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            tourName={selectedTour.name}
            pending={deleteTour.isPending}
            onConfirm={() =>
              deleteTour.mutate(selectedTour.id, {
                onSettled: () => {
                  setDeleteOpen(false);
                  setSelectedTourId(null);
                },
              })
            }
          />
        </>
      )}
    </div>
  );
}

function MobileTourPicker({
  tours,
  selectedTourId,
  onSelect,
  emptyLabel,
  closedCount,
  hideClosed,
  onToggleClosed,
  onCreate,
}: {
  tours: Tour[];
  selectedTourId: string | null;
  onSelect: (id: string) => void;
  emptyLabel: string;
  closedCount: number;
  hideClosed: boolean;
  onToggleClosed: () => void;
  onCreate: () => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const selected = tours.find((tour) => tour.id === selectedTourId) ?? null;

  const handleCreate = () => {
    setOpen(false);
    onCreate();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border bg-card px-3 text-left text-sm transition-colors hover:bg-accent/40"
        >
          {selected ? (
            <>
              <ColorDot color={selected.color || "#2563eb"} />
              <span className="truncate font-medium text-foreground">
                {selected.name}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {t("tours.ordersCount", {
                  count: selected.commands?.length ?? 0,
                })}
              </span>
            </>
          ) : (
            <span className="truncate text-muted-foreground">{emptyLabel}</span>
          )}
          <ChevronDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        hideClose
        className="flex max-h-[80dvh] flex-col gap-0 rounded-t-xl p-0"
      >
        <SheetHeader className="flex-row items-center justify-between border-b p-4">
          <SheetTitle>
            {t("tours.listLabel", { count: tours.length })}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {t("tours.subtitle")}
          </SheetDescription>
          <SheetClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-10 shrink-0"
              aria-label={t("common.close")}
            >
              <X className="size-5" />
            </Button>
          </SheetClose>
        </SheetHeader>
        {tours.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            {emptyLabel}
          </p>
        )}
        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
          {tours.map((tour) => {
            const active = tour.id === selectedTourId;
            const closed = isTourClosed(tour.status);
            const debrief = isTourDebrief(tour.status);
            return (
              <li key={tour.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(tour.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex min-h-11 w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors",
                    active ? "bg-accent" : "hover:bg-accent/50",
                    closed && "opacity-70"
                  )}
                >
                  <span
                    className="h-8 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: tour.color || "#2563eb" }}
                  />
                  <span className="flex min-w-0 flex-1 items-center gap-1.5">
                    <span className="truncate text-sm font-medium text-foreground">
                      {tour.name}
                    </span>
                    {isTourUnsorted(tour) && (
                      <UnsortedBadge className="shrink-0" />
                    )}
                    {(closed || debrief) && tour.status && (
                      <StatusBadge
                        label={tour.status.name}
                        category={tourStatusCategory(tour.status.id)}
                        className="shrink-0"
                      />
                    )}
                  </span>
                  <span className="flex shrink-0 items-center gap-3 text-xs tabular-nums text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Package className="size-3" />
                      {tour.commands?.length ?? 0}
                    </span>
                    {tour.estimateKm != null && (
                      <span>{Math.round(tour.estimateKm)} km</span>
                    )}
                    {tour.estimateMins != null && (
                      <span>{formatDuration(tour.estimateMins)}</span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center gap-2 border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {closedCount > 0 && (
            <Button
              variant="outline"
              className="min-h-11 min-w-0 flex-1 gap-1.5"
              onClick={onToggleClosed}
            >
              {hideClosed ? (
                <Eye className="size-4" />
              ) : (
                <EyeOff className="size-4" />
              )}
              <span className="truncate">
                {hideClosed
                  ? t("tours.closedTours.show")
                  : t("tours.closedTours.hide")}
              </span>
            </Button>
          )}
          <Button
            className="min-h-11 min-w-0 flex-1 gap-1.5"
            onClick={handleCreate}
          >
            <Plus className="size-4" />
            <span className="truncate">{t("tours.create")}</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function InfoPanel({
  title,
  header,
  children,
}: {
  title?: string;
  header?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-2.5 rounded-xl border bg-card p-3 shadow-sm">
      {header ?? (
        <p className="flex min-h-8 items-center px-0.5 text-xs font-medium uppercase text-muted-foreground">
          {title}
        </p>
      )}
      <dl className="grid flex-1 grid-cols-2 content-start gap-x-3 gap-y-2.5">
        {children}
      </dl>
    </section>
  );
}

function InfoRow({
  icon: Icon,
  label,
  action,
  children,
  className,
}: {
  icon: LucideIcon;
  label: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5", className)}>
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5 shrink-0" aria-hidden />
        <span className="truncate">{label}</span>
      </dt>
      <dd className="flex min-h-10 min-w-0 items-center gap-2 text-sm font-medium text-foreground lg:min-h-8">
        <span className="min-w-0 flex-1 truncate">
          {children || <NotProvided />}
        </span>
        {action}
      </dd>
    </div>
  );
}

function estimateDelta(
  actual: number | null,
  estimate: number | null | undefined
): number | null {
  if (actual == null || estimate == null || estimate <= 0) return null;
  return Math.round(((actual - estimate) / estimate) * 100);
}

function DeltaBadge({
  actual,
  estimate,
}: {
  actual: number | null;
  estimate: number | null | undefined;
}) {
  const { t } = useTranslation();
  const delta = estimateDelta(actual, estimate);
  if (delta == null) return null;
  const tokens = getStatusTokens(delta > 0 ? "danger" : "success");
  const value = `${delta > 0 ? "+" : ""}${delta} %`;
  const label = t("tours.deltaVsEstimate", { value });
  return (
    <span
      className="shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums leading-4"
      style={{ backgroundColor: tokens.badgeBg, color: tokens.badgeText }}
      title={label}
      aria-label={label}
    >
      {value}
    </span>
  );
}

function DateTimeRow({
  icon: Icon,
  label,
  day,
  time,
  onDayChange,
  onTimeChange,
  dayLabel,
  timeLabel,
}: {
  icon: LucideIcon;
  label: string;
  day: string;
  time: string;
  onDayChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  dayLabel: string;
  timeLabel: string;
}) {
  return (
    <div className="col-span-2 flex min-w-0 flex-col gap-1">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5 shrink-0" aria-hidden />
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <div className="min-w-0 flex-1">
          <DateField
            value={day}
            onChange={onDayChange}
            className="h-10 lg:h-8"
            aria-label={dayLabel}
          />
        </div>
        <Input
          type="time"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
          className="h-10 w-24 shrink-0 lg:h-8"
          aria-label={timeLabel}
        />
      </div>
    </div>
  );
}

function TourInfoPlaceholder() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canPdf = canDownloadTourPdf(user, "standard");
  const canPdfTarif = canDownloadTourPdf(user, "tarif");
  const [timeTab, setTimeTab] = useState<TourTimeTab>("estimate");

  return (
    <div className="flex shrink-0 flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-h-8 min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
            <div className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden
                className="size-3 shrink-0 translate-y-[1.5px] rounded-full bg-muted"
              />
              <CardTitle className="min-w-0 truncate text-xl leading-tight text-muted-foreground">
                {t("tours.noneSelected")}
              </CardTitle>
            </div>
            <StatusBadge
              label={t("common.none")}
              category="neutral"
              className="shrink-0 py-1"
              editLabel={t("tours.changeStatus")}
              onEdit={() => undefined}
              disabled
            />
            <div className="flex shrink-0 items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Package className="size-4" />
                {t("tours.ordersCount", { count: 0 })}
              </span>
              <span className="flex items-center gap-1.5">
                <Boxes className="size-4" />
                {t("tours.packagesCount", { count: 0 })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="size-10 lg:size-9"
            disabled
            aria-label={t("tours.history.title")}
          >
            <History className="size-4" />
          </Button>
          {canPdf && (
            <Button
              variant="outline"
              size="icon"
              className="size-10 lg:size-9"
              disabled
              aria-label={t("tours.pdf")}
            >
              <FileDown className="size-4" />
            </Button>
          )}
          {canPdfTarif && (
            <Button
              variant="outline"
              size="icon"
              className="size-10 lg:size-9"
              disabled
              aria-label={t("tours.pdfTarif")}
            >
              <ReceiptEuro className="size-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            className="size-10 lg:size-9"
            disabled
            aria-label={t("common.delete")}
          >
            <Trash2 className="size-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-10 lg:h-9" disabled>
            <Pencil className="size-4" />
            {t("tours.edit")}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <InfoPanel title={t("tours.detail.vehicle")}>
          <InfoRow icon={Truck} label={t("tours.immat")} />
          <InfoRow icon={LogOut} label={t("tours.startKm")} />
          <InfoRow icon={LogIn} label={t("tours.endKm")} />
          <InfoRow icon={Timer} label={t("tours.loading")} />
        </InfoPanel>

        <InfoPanel
          header={
            <ViewSwitch
              size="sm"
              value={timeTab}
              onChange={setTimeTab}
              items={[
                { value: "period", label: t("tours.period"), icon: Clock },
                { value: "estimate", label: t("tours.estimate"), icon: Gauge },
              ]}
            />
          }
        >
          {timeTab === "period" ? (
            <>
              <InfoRow icon={Play} label={t("tours.start")} />
              <InfoRow icon={Square} label={t("tours.end")} />
              <InfoRow icon={Clock} label={t("tours.duration")} />
              <InfoRow icon={Route} label={t("tours.distance")} />
            </>
          ) : (
            <>
              <InfoRow icon={Play} label={t("tours.estimatedStart")} />
              <InfoRow icon={Square} label={t("tours.estimatedEnd")} />
              <InfoRow icon={Clock} label={t("tours.estimatedDuration")} />
              <InfoRow icon={Route} label={t("tours.estimatedDistance")} />
            </>
          )}
        </InfoPanel>

        <InfoPanel title={t("tours.informations")}>
          <InfoRow
            className="col-span-2"
            icon={User}
            label={t("tours.driver")}
            action={
              <Button
                variant="outline"
                size="sm"
                className="size-10 shrink-0 gap-1.5 px-0 text-xs lg:h-8 lg:w-auto lg:px-2.5"
                disabled
                aria-label={t("tours.assign")}
              >
                <UserPlus className="size-4" />
                <span className="hidden lg:inline">{t("tours.assign")}</span>
              </Button>
            }
          >
            {t("tours.unassigned")}
          </InfoRow>
          <InfoRow className="col-span-2" icon={MapPin} label={t("tours.zone")} />
        </InfoPanel>
      </div>
    </div>
  );
}

type TourTimeTab = "period" | "estimate";

function defaultTimeTab(tour: Tour): TourTimeTab {
  return isTourDebrief(tour.status) || isTourClosed(tour.status)
    ? "period"
    : "estimate";
}

function estimateBaseDate(tour: Tour, defaultTime: string | null): Date {
  const departure = parseDate(tour.startDate);
  if (departure) return departure;
  const day = parseDate(tour.initialDate) ?? new Date();
  return (defaultTime ? withTime(day, defaultTime) : null) ?? day;
}

interface TourInfoProps {
  tour: Tour;
  locked: boolean;
  packageCount: number;
  commandCount: number;
  canPdf: boolean;
  canPdfTarif: boolean;
  onOpenStatus: () => void;
  onOpenAssign: () => void;
  onOpenHistory: () => void;
  onShowPdf: (kind: TourPdfKind) => void;
  onDelete: () => void;
  onOpenOrder: () => void;
}

function TourInfo({
  tour,
  locked,
  packageCount,
  commandCount,
  canPdf,
  canPdfTarif,
  onOpenStatus,
  onOpenAssign,
  onOpenHistory,
  onShowPdf,
  onDelete,
  onOpenOrder,
}: TourInfoProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? "en";
  const { user } = useAuth();
  const updateTour = useUpdateTour();
  const updateStatus = useUpdateTourStatus();

  const defaultDeparture = frTimeToTimeInput(
    user?.account?.defaultTourDepartureTime
  );
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<TourForm>(() => initialTourForm(tour));
  const [timeTab, setTimeTab] = useState<TourTimeTab>(() =>
    defaultTimeTab(tour)
  );
  const [estimatedStart, setEstimatedStart] = useState<Date>(() =>
    estimateBaseDate(tour, defaultDeparture)
  );

  useEffect(() => {
    setEditing(false);
    setTimeTab(defaultTimeTab(tour));
    setForm(initialTourForm(tour));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tour.id]);

  useEffect(() => {
    setEstimatedStart(estimateBaseDate(tour, defaultDeparture));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tour.id, tour.startDate, defaultDeparture]);

  const setField = (key: keyof TourForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const startEdit = () => {
    setForm(initialTourForm(tour));
    setEditing(true);
    setTimeTab("period");
  };

  const cancelEdit = () => {
    setForm(initialTourForm(tour));
    setEditing(false);
    setTimeTab(defaultTimeTab(tour));
  };

  const save = () => {
    updateTour.mutate(
      {
        id: tour.id,
        input: tourFormToUpdateInput(form),
      },
      {
        onSuccess: () => {
          setEditing(false);
          setTimeTab(defaultTimeTab(tour));
        },
      }
    );
  };

  const travelledKm =
    tour.endKm != null && tour.startKm != null
      ? tour.endKm - tour.startKm
      : null;
  const realDurationMins =
    tour.startDate && tour.endDate
      ? (new Date(tour.endDate).getTime() -
          new Date(tour.startDate).getTime()) /
        60000
      : null;
  const estimateMins = tour.estimateMins ?? null;
  const estimatedEnd =
    estimateMins != null ? addMinutes(estimatedStart, estimateMins) : null;
  const changeEstimatedStart = (time: string) => {
    const next = withTime(estimatedStart, time);
    if (next) setEstimatedStart(next);
  };

  return (
    <div className="flex shrink-0 flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-h-8 min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
            <div className="flex min-w-0 items-center gap-2">
              {editing ? (
                <ColorPicker
                  value={form.color}
                  onChange={(color) => setField("color", color)}
                  label={t("tours.createDialog.color")}
                  swatches={false}
                  triggerClassName="size-10 lg:size-7"
                />
              ) : (
                <ColorDot size="md" color={safeCategoryColor(tour.color)} />
              )}
              {editing ? (
                <Input
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  className="h-10 max-w-56 lg:h-8"
                  aria-label={t("common.name")}
                />
              ) : (
                <CardTitle className="min-w-0 truncate text-xl leading-tight">
                  {tour.name}
                </CardTitle>
              )}
            </div>
            <StatusBadge
              label={tour.status?.name ?? t("common.none")}
              category={tourStatusCategory(tour.status?.id)}
              className="shrink-0 py-1"
              onEdit={onOpenStatus}
              editLabel={t("tours.changeStatus")}
            />
            {isTourUnsorted(tour) && <UnsortedBadge className="shrink-0 py-1" />}
            <div className="flex shrink-0 items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Package className="size-4" />
                {t("tours.ordersCount", { count: commandCount })}
              </span>
              <span className="flex items-center gap-1.5">
                <Boxes className="size-4" />
                {t("tours.packagesCount", { count: packageCount })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-1.5">
          {editing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={cancelEdit}
                disabled={updateTour.isPending}
              >
                {t("common.cancel")}
              </Button>
              <Button size="sm" onClick={save} disabled={updateTour.isPending}>
                {updateTour.isPending && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                {t("common.save")}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="icon"
                className="size-10 lg:size-9"
                onClick={onOpenHistory}
                title={t("tours.history.title")}
                aria-label={t("tours.history.title")}
              >
                <History className="size-4" />
              </Button>
              {canPdf && (
                <Button
                  variant="outline"
                  size="icon"
                  className="size-10 lg:size-9"
                  onClick={() => onShowPdf("standard")}
                  title={t("tours.pdf")}
                  aria-label={t("tours.pdf")}
                >
                  <FileDown className="size-4" />
                </Button>
              )}
              {canPdfTarif && (
                <Button
                  variant="outline"
                  size="icon"
                  className="size-10 lg:size-9"
                  onClick={() => onShowPdf("tarif")}
                  title={t("tours.pdfTarif")}
                  aria-label={t("tours.pdfTarif")}
                >
                  <ReceiptEuro className="size-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                className="size-10 lg:size-9"
                onClick={onDelete}
                title={t("common.delete")}
                aria-label={t("common.delete")}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-10 lg:h-9"
                onClick={startEdit}
                disabled={locked}
                title={locked ? t("tours.lockedClosed") : undefined}
              >
                <Pencil className="size-4" />
                {t("tours.edit")}
              </Button>
              <Button
                size="sm"
                className="h-10 lg:h-9"
                onClick={onOpenOrder}
                disabled={commandCount === 0}
              >
                <Wand2 className="size-4" />
                {t("tours.order.action")}
              </Button>
            </>
          )}
        </div>
      </div>

      {isTourDebrief(tour.status) && (
        <Alert variant="warning">
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2">
              <ClipboardCheck className="size-4 shrink-0 text-status-warning-strong" />
              {t("tours.debrief.notice")}
            </span>
            <Button
              size="sm"
              className="min-h-10 shrink-0 lg:min-h-9"
              onClick={() =>
                updateStatus.mutate({
                  statusId: CLOSED_TOUR_STATUS_ID,
                  tourIds: [tour.id],
                })
              }
              disabled={updateStatus.isPending}
            >
              {updateStatus.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {t("tours.debrief.close")}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 lg:grid-cols-3">
        <InfoPanel title={t("tours.detail.vehicle")}>
          <InfoRow icon={Truck} label={t("tours.immat")}>
            {editing ? (
              <Input
                value={form.immat}
                onChange={(e) => setField("immat", e.target.value)}
                className="h-10 lg:h-8"
                aria-label={t("tours.immat")}
              />
            ) : (
              tour.immat
            )}
          </InfoRow>
          <InfoRow icon={LogOut} label={t("tours.startKm")}>
            {editing ? (
              <Input
                type="number"
                value={form.startKm}
                onChange={(e) => setField("startKm", e.target.value)}
                className="h-10 lg:h-8"
                aria-label={t("tours.startKm")}
              />
            ) : tour.startKm != null ? (
              `${tour.startKm} km`
            ) : null}
          </InfoRow>
          <InfoRow icon={LogIn} label={t("tours.endKm")}>
            {editing ? (
              <Input
                type="number"
                value={form.endKm}
                onChange={(e) => setField("endKm", e.target.value)}
                className="h-10 lg:h-8"
                aria-label={t("tours.endKm")}
              />
            ) : tour.endKm != null ? (
              `${tour.endKm} km`
            ) : null}
          </InfoRow>
          <InfoRow icon={Timer} label={t("tours.loading")}>
            {formatDuration(tour.loadingTimeMinutes)}
          </InfoRow>
        </InfoPanel>

        <InfoPanel
          header={
            <ViewSwitch
              size="sm"
              value={timeTab}
              onChange={setTimeTab}
              items={[
                {
                  value: "period",
                  label: t("tours.period"),
                  icon: Clock,
                },
                {
                  value: "estimate",
                  label: t("tours.estimate"),
                  icon: Gauge,
                },
              ]}
            />
          }
        >
          {timeTab === "period" ? (
            <>
              {editing ? (
                <>
                  <DateTimeRow
                    icon={Play}
                    label={t("tours.start")}
                    day={form.startDay}
                    time={form.startTime}
                    onDayChange={(next) => setField("startDay", next)}
                    onTimeChange={(next) => setField("startTime", next)}
                    dayLabel={t("tours.startDate")}
                    timeLabel={t("tours.startTime")}
                  />
                  <DateTimeRow
                    icon={Square}
                    label={t("tours.end")}
                    day={form.endDay}
                    time={form.endTime}
                    onDayChange={(next) => setField("endDay", next)}
                    onTimeChange={(next) => setField("endTime", next)}
                    dayLabel={t("tours.endDate")}
                    timeLabel={t("tours.endTime")}
                  />
                </>
              ) : (
                <>
                  <InfoRow icon={Play} label={t("tours.start")}>
                    {formatDateTime(tour.startDate, lang)}
                  </InfoRow>
                  <InfoRow icon={Square} label={t("tours.end")}>
                    {formatDateTime(tour.endDate, lang)}
                  </InfoRow>
                </>
              )}
              <InfoRow icon={Clock} label={t("tours.duration")}>
                {realDurationMins != null ? (
                  <span className="inline-flex max-w-full items-center gap-1.5">
                    <span className="truncate">
                      {formatDuration(realDurationMins)}
                    </span>
                    <DeltaBadge
                      actual={realDurationMins}
                      estimate={estimateMins}
                    />
                  </span>
                ) : null}
              </InfoRow>
              <InfoRow icon={Route} label={t("tours.distance")}>
                {travelledKm != null ? (
                  <span className="inline-flex max-w-full items-center gap-1.5">
                    <span className="truncate">
                      {`${Math.round(travelledKm)} km`}
                    </span>
                    <DeltaBadge actual={travelledKm} estimate={tour.estimateKm} />
                  </span>
                ) : null}
              </InfoRow>
            </>
          ) : (
            <>
              <InfoRow
                icon={Play}
                label={t("tours.estimatedStart")}
                action={
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-10 shrink-0 lg:size-7"
                        title={t("tours.estimateStart")}
                        aria-label={t("tours.estimateStart")}
                      >
                        <Clock className="size-3.5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-auto p-3">
                      <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                        {t("tours.estimateStart")}
                        <Input
                          type="time"
                          value={toTimeInput(estimatedStart)}
                          onChange={(e) =>
                            changeEstimatedStart(e.target.value)
                          }
                          className="h-10 w-32 lg:h-9"
                          aria-label={t("tours.estimateStart")}
                        />
                      </label>
                    </PopoverContent>
                  </Popover>
                }
              >
                {formatDateTime(estimatedStart, lang)}
              </InfoRow>
              <InfoRow icon={Square} label={t("tours.estimatedEnd")}>
                {formatDateTime(estimatedEnd, lang)}
              </InfoRow>
              <InfoRow icon={Clock} label={t("tours.estimatedDuration")}>
                {formatDuration(estimateMins)}
              </InfoRow>
              <InfoRow icon={Route} label={t("tours.estimatedDistance")}>
                {tour.estimateKm != null
                  ? `${Math.round(tour.estimateKm)} km`
                  : null}
              </InfoRow>
            </>
          )}
        </InfoPanel>

        <InfoPanel title={t("tours.informations")}>
          <InfoRow
            className="col-span-2"
            icon={User}
            label={t("tours.driver")}
            action={
              <Button
                variant="outline"
                size="sm"
                className="size-10 shrink-0 gap-1.5 px-0 text-xs lg:h-8 lg:w-auto lg:px-2.5"
                onClick={onOpenAssign}
                disabled={locked}
                title={locked ? t("tours.lockedClosed") : t("tours.assign")}
                aria-label={t("tours.assign")}
              >
                <UserPlus className="size-4" />
                <span className="hidden lg:inline">{t("tours.assign")}</span>
              </Button>
            }
          >
            {tour.profil ? (
              <span className="inline-flex flex-wrap items-center gap-1.5">
                {profilFullName(tour.profil)}
                <DeletedProfilBadge profil={tour.profil} />
              </span>
            ) : (
              t("tours.unassigned")
            )}
          </InfoRow>
          <InfoRow className="col-span-2" icon={MapPin} label={t("tours.zone")}>
            {tour.zone?.name}
          </InfoRow>
        </InfoPanel>
      </div>
    </div>
  );
}
