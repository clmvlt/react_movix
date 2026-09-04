import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  Clock,
  GripVertical,
  Hourglass,
  List,
  Loader2,
  MapPin,
  Redo2,
  RefreshCw,
  Route,
  RotateCcw,
  Save,
  TriangleAlert,
  Undo2,
  Wand2,
  X,
  type LucideIcon,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState, LoadingState } from "@/components/states";
import { ViewSwitch } from "@/components/view-switch";
import { PharmacyTag } from "@/components/pharmacies/pharmacy-tag";
import {
  DepotMarker,
  MapAutoFit,
  MapMarker,
  MapRoute,
  MapView,
  geometryToCoordinates,
  type LngLat,
} from "@/components/map";
import { useAuth } from "@/app/auth-context";
import { useToast } from "@/app/toast-context";
import { ApiError, apiErrorText } from "@/lib/api-error";
import {
  addMinutes,
  apiDateToDate,
  dateToApiDate,
  formatDuration,
  frTimeToTimeInput,
  isValidApiDate,
  isValidTimeInput,
  localOffsetIso,
  parseDate,
  toTimeInput,
  withTime,
} from "@/lib/date";
import {
  formatStopWindow,
  formatWindowBadge,
  formatStopTime,
} from "@/lib/delivery-window";
import { useBack } from "@/lib/use-back";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { cn } from "@/lib/utils";
import {
  commandKeys,
  useExpeditions,
  type CommandExpedition,
} from "@/features/commands";
import {
  isTourClosed,
  tourKeys,
  useOptimizeTour,
  useRefreshTourRoute,
  useTour,
  useTourRoute,
  useTourRoutePreview,
  useUpdateTourOrder,
  type SkippedVisit,
  type Tour,
  type TourCommand,
  type TourRoute,
  type TourRouteFailure,
  type TourStop,
} from "@/features/tours";

type OrderView = "list" | "map";

interface OrderStop {
  id: string;
  name: string;
  city: string;
  cip: string;
  color: string | null;
  numero: string | null;
  tourOrder: number | null;
  lat: number | null;
  lon: number | null;
  windowStart: string | null;
  windowEnd: string | null;
}

interface StopTiming {
  arrival: Date | null;
  serviceStart: Date | null;
  windowStart: Date | null;
  windowEnd: Date | null;
  waitingMins: number;
  lateMins: number;
  late: boolean;
}

interface Schedule {
  stops: Map<string, StopTiming>;
  returnArrival: Date | null;
  waitingMins: number;
  lateCount: number;
  windowCount: number;
}

interface Proposal {
  order: string[];
  geometry: string | null;
  skipped: SkippedVisit[];
  withoutCoordinates: string[];
  ignored: string[];
}

const DEFAULT_DEPARTURE = "08:00";
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_WAITING_MINS = 60;
const EMPTY_SCHEDULE: Schedule = {
  stops: new Map(),
  returnArrival: null,
  waitingMins: 0,
  lateCount: 0,
  windowCount: 0,
};

function coordsOf(stop: OrderStop): LngLat | null {
  if (stop.lat == null || stop.lon == null) return null;
  return [stop.lon, stop.lat];
}

function sortKey(stop: OrderStop): [number, string] {
  return [stop.tourOrder ?? Number.MAX_SAFE_INTEGER, stop.name.toLowerCase()];
}

function shiftDays(value: Date | null, days: number): Date | null {
  if (!value || days === 0) return value;
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function daysBetween(from: Date, to: Date): number {
  const fromDay = apiDateToDate(dateToApiDate(from)).getTime();
  const toDay = apiDateToDate(dateToApiDate(to)).getTime();
  return Math.round((toDay - fromDay) / DAY_MS);
}

function offsetFrom(anchor: Date, serverAnchor: Date, serverValue: Date): Date {
  return new Date(anchor.getTime() + (serverValue.getTime() - serverAnchor.getTime()));
}

interface WindowSpec {
  start: string | null;
  end: string | null;
}

function parseBound(
  value: string | null | undefined,
  base: Date,
  dayShift: number
): Date | null {
  if (!value) return null;
  if (isValidTimeInput(value)) return withTime(base, value);
  return shiftDays(parseDate(value), dayShift);
}

function resolveWindow(
  stop: TourStop,
  spec: WindowSpec | undefined,
  base: Date,
  dayShift: number
): { start: Date | null; end: Date | null; fromServer: boolean } {
  const serverStart = parseBound(stop.deliveryWindowStart, base, dayShift);
  const serverEnd = parseBound(stop.deliveryWindowEnd, base, dayShift);
  const start =
    serverStart ?? (spec?.start ? withTime(base, spec.start) : null);
  let end = serverEnd ?? (spec?.end ? withTime(base, spec.end) : null);
  if (start && end && end < start) end = shiftDays(end, 1);
  const fromServer =
    (start === null || serverStart !== null) &&
    (end === null || serverEnd !== null);
  return { start, end, fromServer };
}

function emptyTiming(
  windowStart: Date | null,
  windowEnd: Date | null
): StopTiming {
  return {
    arrival: null,
    serviceStart: null,
    windowStart,
    windowEnd,
    waitingMins: 0,
    lateMins: 0,
    late: false,
  };
}

function buildSchedule(
  route: TourRoute | null | undefined,
  departure: Date | null,
  fallbackWindows: Map<string, WindowSpec>
): Schedule {
  if (!route || !departure) return EMPTY_SCHEDULE;

  const stops = new Map<string, StopTiming>();
  const serverDeparture = parseDate(route.departureTime);
  const hasEta =
    serverDeparture !== null &&
    route.stops.some((stop) => parseDate(stop.estimatedArrivalTime) !== null);
  const exact =
    hasEta && departure.getTime() === (serverDeparture as Date).getTime();
  const dayShift = serverDeparture ? daysBetween(serverDeparture, departure) : 0;

  let cursor = departure;
  let previousServer = serverDeparture ?? departure;
  let previousCumulative = 0;
  let waitingMins = 0;
  let lateCount = 0;
  let windowCount = 0;

  for (const stop of route.stops) {
    const {
      start: windowStart,
      end: windowEnd,
      fromServer: serverWindows,
    } = resolveWindow(
      stop,
      fallbackWindows.get(stop.commandId),
      departure,
      dayShift
    );
    if (windowStart || windowEnd) windowCount += 1;

    const serverArrival = hasEta ? parseDate(stop.estimatedArrivalTime) : null;
    const cumulative = stop.cumulativeDurationMins;
    if (hasEta ? !serverArrival : cumulative == null) {
      stops.set(stop.commandId, emptyTiming(windowStart, windowEnd));
      continue;
    }
    const serverService =
      parseDate(stop.estimatedServiceStartTime) ?? serverArrival;

    let timing: StopTiming;
    if (exact && serverArrival && serverWindows) {
      const lateMins = stop.lateMins ?? 0;
      timing = {
        arrival: serverArrival,
        serviceStart: serverService ?? serverArrival,
        windowStart,
        windowEnd,
        waitingMins: stop.waitingMins ?? 0,
        lateMins,
        late: stop.late === true || lateMins > 0,
      };
    } else {
      const arrival = serverArrival
        ? offsetFrom(cursor, previousServer, serverArrival)
        : addMinutes(cursor, (cumulative as number) - previousCumulative);
      const serviceStart =
        windowStart && arrival < windowStart ? windowStart : arrival;
      const lateMins =
        windowEnd && arrival > windowEnd
          ? (arrival.getTime() - windowEnd.getTime()) / 60000
          : 0;
      timing = {
        arrival,
        serviceStart,
        windowStart,
        windowEnd,
        waitingMins: (serviceStart.getTime() - arrival.getTime()) / 60000,
        lateMins,
        late: lateMins > 0,
      };
    }

    if (timing.waitingMins > MAX_WAITING_MINS) timing = { ...timing, late: true };
    stops.set(stop.commandId, timing);
    waitingMins += timing.waitingMins;
    if (timing.late) lateCount += 1;
    cursor = timing.serviceStart ?? cursor;
    if (serverService) previousServer = serverService;
    if (cumulative != null) previousCumulative = cumulative;
  }

  let returnArrival: Date | null = null;
  const serverReturn = hasEta ? parseDate(route.returnLeg?.arrivalTime) : null;
  if (serverReturn) {
    returnArrival = exact
      ? serverReturn
      : offsetFrom(cursor, previousServer, serverReturn);
  } else if (route.estimateMins != null) {
    returnArrival = addMinutes(cursor, route.estimateMins - previousCumulative);
  }

  return { stops, returnArrival, waitingMins, lateCount, windowCount };
}

function routeFailureOf(cause: unknown): TourRouteFailure | null {
  if (!(cause instanceof ApiError)) return null;
  if (cause.status !== 422 && cause.status !== 503) return null;
  const body = cause.body;
  if (!body || typeof body !== "object") return null;
  const failure = body as TourRouteFailure;
  return failure.reason ? failure : null;
}

type Tone = "neutral" | "success" | "warning" | "danger";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-status-success-bg text-status-success-text",
  warning: "bg-status-warning-bg text-status-warning-text",
  danger: "bg-status-danger-bg text-status-danger-text",
};

const CHIP_TONE_CLASSES: Record<Tone, string> = {
  neutral: "border-border bg-card",
  success:
    "border-status-success-strong/30 bg-status-success-bg text-status-success-text [&>svg]:text-status-success-strong",
  warning:
    "border-status-warning-strong/30 bg-status-warning-bg text-status-warning-text [&>svg]:text-status-warning-strong",
  danger:
    "border-status-danger-strong/30 bg-status-danger-bg text-status-danger-text [&>svg]:text-status-danger-strong",
};

function StatChip({
  icon: Icon,
  value,
  tone = "neutral",
}: {
  icon: LucideIcon;
  value: string;
  tone?: Tone;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-1 text-sm font-semibold tabular-nums",
        CHIP_TONE_CLASSES[tone]
      )}
    >
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      {value}
    </span>
  );
}

function TimingBadge({
  icon: Icon,
  tone,
  label,
  className,
  children,
}: {
  icon: LucideIcon;
  tone: Tone;
  label?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium tabular-nums",
        TONE_CLASSES[tone],
        className
      )}
      title={label}
      aria-label={label}
    >
      <Icon aria-hidden className="size-3 shrink-0" />
      {children}
    </span>
  );
}

export function TourOrderPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const goBack = useBack(id ? `/app/tours?tour=${id}` : "/app/tours");
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const toast = useToast();

  const [searchParams, setSearchParams] = useSearchParams();
  const view: OrderView = searchParams.get("view") === "map" ? "map" : "list";
  const setView = (next: OrderView) => {
    setSearchParams(
      (previous) => {
        const params = new URLSearchParams(previous);
        if (next === "list") params.delete("view");
        else params.set("view", next);
        return params;
      },
      { replace: true }
    );
  };

  const tourQuery = useTour(id);
  const tour = tourQuery.data;
  const date = tour?.initialDate ?? "";
  const expeditionsQuery = useExpeditions(date);
  const routeQuery = useTourRoute(id);
  const route = routeQuery.data;

  const optimize = useOptimizeTour();
  const refreshRoute = useRefreshTourRoute();
  const updateOrder = useUpdateTourOrder();

  const [order, setOrder] = useState<string[]>([]);
  const [history, setHistory] = useState<string[][]>([]);
  const [cursor, setCursor] = useState(0);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [fakeSaving, setFakeSaving] = useState(false);
  const [pendingFakeSave, setPendingFakeSave] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [routeFailure, setRouteFailure] = useState<string | null>(null);
  const [confirmLateOpen, setConfirmLateOpen] = useState(false);
  const fallbackDeparture =
    frTimeToTimeInput(user?.account?.defaultTourDepartureTime) ??
    DEFAULT_DEPARTURE;
  const [mountedAt] = useState(() => new Date());
  const [departureDate, setDepartureDate] = useState(() =>
    dateToApiDate(mountedAt)
  );
  const [departureTime, setDepartureTime] = useState(fallbackDeparture);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [draggingIds, setDraggingIds] = useState<string[]>([]);
  const syncedRef = useRef<string>("");
  const departureRef = useRef<string>("");
  const dragRef = useRef<string[] | null>(null);
  const fakeSaveRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (fakeSaveRef.current != null) window.clearTimeout(fakeSaveRef.current);
    },
    []
  );

  const depotCoords = useMemo<LngLat | null>(() => {
    const account = user?.account;
    if (account?.latitude == null || account?.longitude == null) return null;
    return [account.longitude, account.latitude];
  }, [user?.account]);

  const stops = useMemo<OrderStop[]>(() => {
    const expeditions = expeditionsQuery.data ?? [];
    const membership = new Map<string, string | null>(
      expeditions.map((command) => [command.id, command.tour?.id ?? null])
    );

    const byId = new Map<string, OrderStop>();
    const toStop = (
      command: TourCommand | CommandExpedition,
      previous: OrderStop | undefined
    ): OrderStop => ({
      id: command.id,
      name: command.pharmacy?.name ?? "",
      city: command.pharmacy?.city ?? "",
      cip: command.pharmacy?.cip ?? "",
      color: command.pharmacy?.color ?? null,
      numero: command.pharmacy?.numero ?? null,
      tourOrder: command.tourOrder ?? null,
      lat: command.pharmacy?.latitude ?? null,
      lon: command.pharmacy?.longitude ?? null,
      windowStart:
        command.pharmacyDeliveryWindowStart ??
        command.pharmacy?.deliveryWindowStart ??
        previous?.windowStart ??
        null,
      windowEnd:
        command.pharmacyDeliveryWindowEnd ??
        command.pharmacy?.deliveryWindowEnd ??
        previous?.windowEnd ??
        null,
    });
    for (const command of tour?.commands ?? []) {
      const known = membership.get(command.id);
      if (known !== undefined && known !== id) continue;
      byId.set(command.id, toStop(command, byId.get(command.id)));
    }
    for (const command of expeditions) {
      if (command.tour?.id !== id) continue;
      byId.set(command.id, toStop(command, byId.get(command.id)));
    }
    return [...byId.values()];
  }, [expeditionsQuery.data, tour?.commands, id]);

  const stopById = useMemo(() => {
    const map = new Map<string, OrderStop>();
    for (const stop of stops) map.set(stop.id, stop);
    return map;
  }, [stops]);

  const serverOrder = useMemo(
    () =>
      [...stops]
        .sort((left, right) => {
          const [leftOrder, leftName] = sortKey(left);
          const [rightOrder, rightName] = sortKey(right);
          if (leftOrder !== rightOrder) return leftOrder - rightOrder;
          return leftName.localeCompare(rightName);
        })
        .map((stop) => stop.id),
    [stops]
  );

  useEffect(() => {
    const signature = serverOrder.join("|");
    if (signature === syncedRef.current) return;
    syncedRef.current = signature;
    setOrder(serverOrder);
    setHistory([serverOrder]);
    setCursor(0);
    setProposal(null);
    setPendingFakeSave(false);
    setSelected(new Set());
  }, [serverOrder]);

  const serverDeparture = useMemo(() => {
    const known = parseDate(route?.departureTime) ?? parseDate(tour?.startDate);
    if (known) return { date: dateToApiDate(known), time: toTimeInput(known) };
    if (tour?.initialDate && isValidApiDate(tour.initialDate)) {
      return { date: tour.initialDate, time: fallbackDeparture };
    }
    return { date: dateToApiDate(mountedAt), time: toTimeInput(mountedAt) };
  }, [
    route?.departureTime,
    tour?.startDate,
    tour?.initialDate,
    fallbackDeparture,
    mountedAt,
  ]);

  useEffect(() => {
    const signature = `${serverDeparture.date}T${serverDeparture.time}`;
    if (signature === departureRef.current) return;
    departureRef.current = signature;
    setDepartureDate(serverDeparture.date);
    setDepartureTime(serverDeparture.time);
  }, [serverDeparture]);

  const localDeparture = useMemo(
    () =>
      isValidApiDate(departureDate)
        ? withTime(apiDateToDate(departureDate), departureTime)
        : null,
    [departureDate, departureTime]
  );

  const orderKey = order.join("|");
  const serverOrderKey = serverOrder.join("|");
  const dirty = orderKey !== serverOrderKey;
  const saving = updateOrder.isPending;
  const closed = isTourClosed(tour?.status);
  const busy =
    optimize.isPending || updateOrder.isPending || refreshRoute.isPending;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const dragging = draggingIds.length > 0;
  const [settledOrder, setSettledOrder] = useState(order);
  useEffect(() => {
    if (!dragging) setSettledOrder(order);
  }, [dragging, order]);

  const debouncedOrder = useDebouncedValue(settledOrder, 400);
  const previewKey = debouncedOrder.join("|");
  const previewEnabled = dirty && previewKey !== serverOrderKey;
  const previewQuery = useTourRoutePreview(id, debouncedOrder, previewEnabled);
  const previewRoute = previewEnabled ? (previewQuery.data ?? null) : null;
  const previewSyncing =
    dirty && (previewKey !== orderKey || previewQuery.isFetching);
  const activeRoute = previewRoute ?? route;
  const routeStale = previewRoute ? false : route?.routeStale === true;

  const fallbackWindows = useMemo(() => {
    const map = new Map<string, WindowSpec>();
    for (const stop of stops) {
      if (stop.windowStart || stop.windowEnd) {
        map.set(stop.id, { start: stop.windowStart, end: stop.windowEnd });
      }
    }
    return map;
  }, [stops]);

  const schedule = useMemo(
    () => buildSchedule(activeRoute, localDeparture, fallbackWindows),
    [activeRoute, localDeparture, fallbackWindows]
  );

  const orderedStops = useMemo(
    () =>
      order
        .map((stopId) => stopById.get(stopId))
        .filter((stop): stop is OrderStop => stop !== undefined),
    [order, stopById]
  );

  const withoutCoordsCount = orderedStops.filter(
    (stop) => coordsOf(stop) === null
  ).length;

  const positions = useMemo(() => {
    const map = new Map<string, number>();
    order.forEach((stopId, index) => map.set(stopId, index));
    return map;
  }, [order]);

  const selectionOrder = useMemo(
    () => order.filter((stopId) => selected.has(stopId)),
    [order, selected]
  );

  const groupOf = (stopId: string): string[] =>
    selected.has(stopId) && selectionOrder.length > 1
      ? selectionOrder
      : [stopId];

  const commit = (next: string[]) => {
    if (next.join("|") === orderKey) return;
    setOrder(next);
    setHistory((previous) => [...previous.slice(0, cursor + 1), next]);
    setCursor((previous) => previous + 1);
    setPendingFakeSave(next.join("|") === serverOrderKey);
  };

  const commitCurrent = () => {
    if (history[cursor]?.join("|") === orderKey) return;
    setHistory((previous) => [...previous.slice(0, cursor + 1), order]);
    setCursor((previous) => previous + 1);
    setPendingFakeSave(orderKey === serverOrderKey);
  };

  const goHistory = (step: number) => {
    const target = cursor + step;
    if (target < 0 || target >= history.length) return;
    setCursor(target);
    setOrder(history[target]);
    setPendingFakeSave(history[target].join("|") === serverOrderKey);
  };

  const insertGroup = (source: string[], ids: string[], at: number): string[] => {
    const group = new Set(ids);
    const without = source.filter((stopId) => !group.has(stopId));
    const index = Math.max(0, Math.min(at, without.length));
    return [...without.slice(0, index), ...ids, ...without.slice(index)];
  };

  const move = (stopId: string, delta: number) => {
    const ids = groupOf(stopId);
    const group = new Set(ids);
    const without = order.filter((entry) => !group.has(entry));
    if (without.length === 0) return;

    const first = order.findIndex((entry) => group.has(entry));
    const last = order.reduce(
      (found, entry, index) => (group.has(entry) ? index : found),
      -1
    );
    if (delta < 0 && first <= 0) return;
    if (delta > 0 && last >= order.length - 1) return;

    const neighbour =
      delta < 0
        ? [...order.slice(0, first)].reverse().find((entry) => !group.has(entry))
        : order.slice(last + 1).find((entry) => !group.has(entry));
    if (!neighbour) return;

    const index = without.indexOf(neighbour);
    commit(insertGroup(order, ids, delta < 0 ? index : index + 1));
  };

  const startDrag = (stopId: string) => {
    const ids = groupOf(stopId);
    dragRef.current = ids;
    setDraggingIds(ids);
  };

  const dragOverRow = (
    event: React.DragEvent<HTMLLIElement>,
    targetId: string
  ) => {
    event.preventDefault();
    const ids = dragRef.current;
    if (!ids || ids.includes(targetId)) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const after = event.clientY > rect.top + rect.height / 2;
    const group = new Set(ids);
    const without = order.filter((stopId) => !group.has(stopId));
    const index = without.indexOf(targetId);
    if (index < 0) return;

    const next = insertGroup(order, ids, after ? index + 1 : index);
    if (next.join("|") !== orderKey) setOrder(next);
  };

  const endDrag = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setDraggingIds([]);
    commitCurrent();
  };

  const toggleSelected = (stopId: string) =>
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(stopId)) next.delete(stopId);
      else next.add(stopId);
      return next;
    });

  const describeError = (
    cause: unknown,
    fallback: string,
    scope: "order" | "optimize"
  ): string => {
    if (!(cause instanceof ApiError)) return fallback;

    const failure = routeFailureOf(cause);
    if (failure) {
      return [
        failure.detail?.trim() || t(`tours.order.errors.${failure.reason}`),
        failure.correlationId
          ? t("tours.order.correlationId", { value: failure.correlationId })
          : null,
      ]
        .filter(Boolean)
        .join(" ");
    }

    const detail = apiErrorText(cause);
    if (cause.status === 403) return t("tours.order.errors.forbidden");
    if (cause.status === 409) {
      if (detail && /appartient/i.test(detail)) {
        return `${t("tours.order.errors.notInTour")} ${detail}`;
      }
      return t("tours.order.errors.closed");
    }
    if (cause.status === 400) {
      if (scope === "optimize") return t("tours.order.errors.depotMissing");
      return detail ? `${fallback} ${detail}` : fallback;
    }
    return detail ? `${fallback} ${detail}` : fallback;
  };

  const applySavedOrder = (saved: string[]) => {
    const positionOf = new Map(saved.map((stopId, index) => [stopId, index + 1]));
    const reorder = <T extends { id: string; tourOrder?: number | null }>(
      command: T
    ): T =>
      positionOf.has(command.id)
        ? { ...command, tourOrder: positionOf.get(command.id) as number }
        : command;

    if (date) {
      queryClient.setQueryData<CommandExpedition[]>(
        commandKeys.byDate(date),
        (previous) => previous?.map(reorder)
      );
    }
    if (id) {
      queryClient.setQueryData<Tour>(tourKeys.detail(id), (previous) =>
        previous
          ? {
              ...previous,
              sorted: true,
              commands: (previous.commands ?? []).map(reorder),
            }
          : previous
      );
      void queryClient.invalidateQueries({ queryKey: tourKeys.detail(id) });
    }
    if (date) {
      void queryClient.invalidateQueries({ queryKey: commandKeys.byDate(date) });
    }
  };

  const runOptimize = async () => {
    if (!id || busy || closed) return;
    try {
      const result = await optimize.mutateAsync({
        id,
        input: {
          apply: false,
          departureTime: localDeparture
            ? localOffsetIso(departureDate, departureTime)
            : undefined,
        },
      });
      const retained = parseDate(result.departureTime);
      if (retained) {
        setDepartureDate(dateToApiDate(retained));
        setDepartureTime(toTimeInput(retained));
      }
      const known = new Set(stops.map((stop) => stop.id));
      const proposed = result.order.filter((stopId) => known.has(stopId));
      if (proposed.length === 0) {
        toast.error(t("tours.order.errors.noRoutableStop"));
        return;
      }
      const tail = order.filter((stopId) => !proposed.includes(stopId));
      const applied = [...proposed, ...tail];

      commit(applied);
      if (applied.join("|") === serverOrderKey) setPendingFakeSave(true);
      if (
        result.previewRoute &&
        applied.join("|") === result.order.join("|") &&
        applied.join("|") !== serverOrderKey
      ) {
        queryClient.setQueryData(
          tourKeys.routePreview(id, applied.join("|")),
          result.previewRoute
        );
      }
      const reported = new Set([
        ...result.order,
        ...(result.skippedVisits ?? []).map((visit) => visit.visitId),
        ...(result.commandsWithoutCoordinates ?? []),
      ]);
      setProposal({
        order: applied,
        geometry: result.previewGeometry ?? null,
        skipped: (result.skippedVisits ?? []).filter((visit) =>
          known.has(visit.visitId)
        ),
        withoutCoordinates: (result.commandsWithoutCoordinates ?? []).filter(
          (stopId) => known.has(stopId)
        ),
        ignored: tail.filter((stopId) => !reported.has(stopId)),
      });
    } catch (cause) {
      toast.error(describeError(cause, t("tours.order.errors.optimizeFailed"), "optimize"));
    }
  };

  const save = () => {
    if (!id || closed || busy || fakeSaving) return;
    if (dirty && schedule.lateCount > 0) {
      setConfirmLateOpen(true);
      return;
    }
    void performSave();
  };

  const performSave = async () => {
    if (!id || closed || busy || fakeSaving) return;
    if (!dirty) {
      if (!pendingFakeSave) return;
      setFakeSaving(true);
      fakeSaveRef.current = window.setTimeout(() => {
        setFakeSaving(false);
        setPendingFakeSave(false);
      }, 600);
      return;
    }
    const saved = order;
    try {
      await updateOrder.mutateAsync({
        id,
        input: {
          commands: saved.map((stopId, index) => ({
            commandId: stopId,
            tourOrder: index + 1,
          })),
        },
      });
      applySavedOrder(saved);
      setProposal(null);
      setRouteFailure(null);
    } catch (cause) {
      toast.error(describeError(cause, t("tours.order.errors.saveFailed"), "order"));
    }
  };

  const reset = () => {
    setOrder(serverOrder);
    setHistory([serverOrder]);
    setCursor(0);
    setProposal(null);
    setPendingFakeSave(false);
  };

  const recalculate = async () => {
    if (!id || busy) return;
    setRouteFailure(null);
    try {
      await refreshRoute.mutateAsync(id);
    } catch (cause) {
      const message = describeError(
        cause,
        t("tours.order.errors.refreshFailed"),
        "order"
      );
      if (routeFailureOf(cause)) setRouteFailure(message);
      else toast.error(message);
    }
  };

  const allSelected =
    orderedStops.length > 0 && selectionOrder.length === orderedStops.length;

  const previewUnsupported =
    previewQuery.error instanceof ApiError &&
    (previewQuery.error.status === 404 || previewQuery.error.status === 405);
  const previewFailed =
    previewEnabled && previewQuery.isError && !previewUnsupported;
  const previewMessage = previewFailed
    ? `${t("tours.order.previewFailed")} ${describeError(
        previewQuery.error,
        t("tours.order.errors.refreshFailed"),
        "order"
      )}`
    : null;

  const routePending = previewSyncing || (dirty && !previewRoute);
  const arrivalsStale = saving || routeStale || routePending;
  const returnArrival = formatStopTime(schedule.returnArrival);

  const lateStops = orderedStops.filter(
    (stop) => schedule.stops.get(stop.id)?.late === true
  );

  const windowBounds = (
    stop: OrderStop,
    timing: StopTiming | null
  ): [string | null, string | null] =>
    timing && (timing.windowStart || timing.windowEnd)
      ? [
          formatStopTime(timing.windowStart),
          formatStopTime(timing.windowEnd),
        ]
      : [stop.windowStart, stop.windowEnd];

  const stopWindowText = (
    stop: OrderStop,
    timing: StopTiming | null
  ): string | null => {
    const [start, end] = windowBounds(stop, timing);
    return formatStopWindow(start, end, t);
  };

  const stopWindowCompact = (
    stop: OrderStop,
    timing: StopTiming | null
  ): string | null => {
    const [start, end] = windowBounds(stop, timing);
    return formatWindowBadge(start, end, t);
  };

  const shownGeometry =
    previewRoute?.geometry ??
    proposal?.geometry ??
    route?.geometry ??
    tour?.geometry ??
    null;

  const savedRouteBroken =
    orderedStops.length > 1 && (routeStale || !route?.geometry);
  const canRefresh =
    !dirty && (savedRouteBroken || refreshRoute.isPending || routeFailure !== null);

  const routeCoords = useMemo<LngLat[]>(
    () => geometryToCoordinates(shownGeometry),
    [shownGeometry]
  );

  const mapPoints = useMemo<LngLat[]>(() => {
    const points = orderedStops
      .map(coordsOf)
      .filter((point): point is LngLat => point !== null);
    return depotCoords ? [...points, depotCoords] : points;
  }, [orderedStops, depotCoords]);

  const tourColor = tour?.color || undefined;
  const estimateKm = activeRoute?.estimateKm ?? tour?.estimateKm ?? null;
  const estimateMins = activeRoute?.estimateMins ?? tour?.estimateMins ?? null;
  const totalMins =
    estimateMins != null ? estimateMins + schedule.waitingMins : null;

  if (tourQuery.isPending) return <LoadingState />;
  if (tourQuery.isError || !tour) {
    return (
      <ErrorState
        error={tourQuery.error}
        retrying={tourQuery.isFetching}
        onRetry={() => void tourQuery.refetch()}
      />
    );
  }

  const statsDimmed = routeStale || saving || routePending;
  const headerStats = (
    <>
      <StatChip
        icon={MapPin}
        value={t("tours.order.stops", { count: orderedStops.length })}
      />
      {estimateKm != null && (
        <StatChip
          icon={Route}
          value={t("tours.order.distance", {
            value: Math.round(estimateKm),
          })}
        />
      )}
      {totalMins != null && (
        <StatChip icon={Clock} value={formatDuration(totalMins)} />
      )}
      {schedule.windowCount > 0 && (
        <StatChip
          icon={Clock}
          value={t("tours.order.windows.summaryCount", {
            count: schedule.windowCount,
          })}
        />
      )}
      {schedule.lateCount > 0 && (
        <StatChip
          icon={TriangleAlert}
          tone="danger"
          value={t("tours.order.windows.summaryLate", {
            count: schedule.lateCount,
          })}
        />
      )}
      {schedule.waitingMins > 0 && (
        <StatChip
          icon={Hourglass}
          tone="warning"
          value={t("tours.order.windows.summaryWaiting", {
            count: Math.round(schedule.waitingMins),
          })}
        />
      )}
      <Badge
        className="shrink-0"
        variant={tour.sorted ? "secondary" : "outline"}
      >
        {tour.sorted ? t("tours.order.sorted") : t("tours.order.toSort")}
      </Badge>
      {(routeStale || previewSyncing) && (
        <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-sm text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          {t("tours.order.recalculating")}
        </span>
      )}
    </>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex shrink-0 flex-col gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="size-11 shrink-0 lg:size-10"
            onClick={() => (dirty ? setLeaveOpen(true) : goBack())}
            aria-label={t("common.back")}
          >
            <ArrowLeft className="size-4" />
          </Button>

          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex min-w-0 shrink items-center gap-2">
              <span
                aria-hidden
                className="size-3 shrink-0 rounded-full border border-border"
                style={{ backgroundColor: tourColor ?? "transparent" }}
              />
              <h1 className="truncate text-xl font-semibold tracking-tight">
                {tour.name || t("tours.order.untitled")}
              </h1>
            </div>
            <div
              className={cn(
                "hidden min-w-0 flex-1 flex-wrap items-center gap-2 sm:flex",
                statsDimmed && "opacity-60"
              )}
            >
              {headerStats}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              className="min-h-11 lg:min-h-10"
              disabled={!dirty || busy}
              onClick={reset}
              aria-label={t("tours.order.reset")}
            >
              <RotateCcw className="size-4" />
              <span className="hidden sm:inline">{t("tours.order.reset")}</span>
            </Button>
            <Button
              className="min-h-11 lg:min-h-10"
              disabled={
                (!dirty && !pendingFakeSave) || closed || busy || fakeSaving
              }
              onClick={save}
              aria-label={
                saving || fakeSaving
                  ? t("tours.order.saving")
                  : t("tours.order.save")
              }
            >
              {saving || fakeSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              <span className="hidden sm:inline">
                {saving || fakeSaving
                  ? t("tours.order.saving")
                  : t("tours.order.save")}
              </span>
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "flex items-center gap-2 overflow-x-auto sm:hidden",
            statsDimmed && "opacity-60"
          )}
        >
          {headerStats}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex items-center gap-2 sm:contents">
            <Button
              className="min-h-11 min-w-0 flex-1 sm:flex-none lg:min-h-10"
              disabled={orderedStops.length < 2 || closed || busy}
              onClick={runOptimize}
            >
              {optimize.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Wand2 className="size-4" />
              )}
              <span className="truncate">
                {optimize.isPending
                  ? t("tours.order.sorting")
                  : t("tours.order.autoSort")}
              </span>
            </Button>

            <Button
              variant="outline"
              className="min-h-11 shrink-0 lg:min-h-10"
              disabled={orderedStops.length < 2 || closed || busy}
              onClick={() => commit([...order].reverse())}
              aria-label={t("tours.order.reverse")}
            >
              <ArrowLeftRight className="size-4" />
              <span className="hidden sm:inline">{t("tours.order.reverse")}</span>
            </Button>

            <div className="flex shrink-0 items-center gap-2 sm:order-last sm:ml-auto">
              <Button
                variant="outline"
                size="icon"
                className="size-11 lg:size-10"
                disabled={cursor <= 0}
                onClick={() => goHistory(-1)}
                aria-label={t("tours.order.undo")}
                title={t("tours.order.undo")}
              >
                <Undo2 className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-11 lg:size-10"
                disabled={cursor >= history.length - 1}
                onClick={() => goHistory(1)}
                aria-label={t("tours.order.redo")}
                title={t("tours.order.redo")}
              >
                <Redo2 className="size-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Label
              htmlFor="tour-order-departure"
              className="hidden shrink-0 text-sm font-normal text-muted-foreground sm:block"
            >
              {t("tours.order.departureTime")}
            </Label>
            <Clock
              aria-hidden
              className="size-4 shrink-0 text-muted-foreground sm:hidden"
            />
            <Input
              id="tour-order-departure"
              type="time"
              value={departureTime}
              aria-label={t("tours.order.departureTime")}
              className="min-h-11 w-26 shrink-0 lg:min-h-10"
              onChange={(event) => setDepartureTime(event.target.value)}
            />
            <span
              aria-label={t("tours.order.estimatedReturn")}
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md border border-border bg-card px-2 text-sm lg:min-h-10",
                arrivalsStale && "opacity-60"
              )}
            >
              <ArrowRight aria-hidden className="size-3.5 text-muted-foreground" />
              <span className="hidden text-muted-foreground sm:inline">
                {t("tours.order.estimatedReturn")}
              </span>
              <span className="font-semibold tabular-nums">
                {returnArrival ?? "-"}
              </span>
            </span>
          </div>

          {canRefresh && (
            <Button
              variant="outline"
              className="min-h-11 lg:min-h-10"
              disabled={busy}
              onClick={recalculate}
              aria-label={t("tours.order.recalculate")}
            >
              {refreshRoute.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              {t("tours.order.recalculate")}
            </Button>
          )}
        </div>

        <ViewSwitch
          className="shrink-0 lg:hidden"
          value={view}
          onChange={setView}
          items={[
            {
              value: "list",
              label: t("common.views.list"),
              icon: List,
              count: orderedStops.length,
            },
            { value: "map", label: t("common.views.map"), icon: MapPin },
          ]}
        />

        {closed && (
          <Alert variant="warning">
            <TriangleAlert />
            <AlertDescription>{t("tours.order.errors.closed")}</AlertDescription>
          </Alert>
        )}

        {previewMessage && (
          <Alert variant="warning">
            <TriangleAlert />
            <AlertDescription>{previewMessage}</AlertDescription>
          </Alert>
        )}

        {routeFailure && (
          <Alert variant="warning">
            <TriangleAlert />
            <AlertDescription>{routeFailure}</AlertDescription>
          </Alert>
        )}

        {lateStops.length > 0 && (
          <Alert
            variant="destructive"
            className={cn(
              "py-2.5 [&>svg]:top-3",
              arrivalsStale && "opacity-60"
            )}
          >
            <TriangleAlert />
            <AlertDescription className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="font-medium">
                {t("tours.order.windows.infeasibleTitle", {
                  count: lateStops.length,
                  time: departureTime,
                })}
              </span>
              {lateStops.map((stop) => (
                <a
                  key={stop.id}
                  href={`/app/pharmacies/${encodeURIComponent(stop.cip)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2"
                  aria-label={t("tours.order.windows.openPharmacy", {
                    name: stop.name || stop.cip,
                  })}
                >
                  {stop.name || stop.cip}
                </a>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {proposal && proposal.skipped.length > 0 && (
          <Alert variant="warning">
            <TriangleAlert />
            <AlertDescription className="flex flex-col gap-1">
              <span>
                {t("tours.order.skippedTitle", {
                  count: proposal.skipped.length,
                })}
              </span>
              {proposal.skipped.map((visit) => (
                <span key={visit.visitId} className="text-xs">
                  {stopById.get(visit.visitId)?.name ||
                    visit.name ||
                    visit.visitId}
                  {" - "}
                  {visit.reason === "TOO_FAR" && visit.snapDistanceMeters != null
                    ? t("tours.order.skippedReason.TOO_FAR_DISTANCE", {
                        value: Math.round(visit.snapDistanceMeters),
                      })
                    : t(`tours.order.skippedReason.${visit.reason}`)}
                </span>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {proposal && proposal.ignored.length > 0 && (
          <Alert variant="warning">
            <TriangleAlert />
            <AlertDescription className="flex flex-col gap-1">
              <span>
                {t("tours.order.ignoredTitle", {
                  count: proposal.ignored.length,
                })}
              </span>
              {proposal.ignored.map((stopId) => (
                <span key={stopId} className="text-xs">
                  {stopById.get(stopId)?.name || stopId}
                </span>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {proposal && proposal.withoutCoordinates.length > 0 && (
          <Alert variant="warning">
            <TriangleAlert />
            <AlertDescription className="flex flex-col gap-1">
              <span>
                {t("tours.order.missingCoords", {
                  count: proposal.withoutCoordinates.length,
                })}
              </span>
              {proposal.withoutCoordinates.map((stopId) => (
                <span key={stopId} className="text-xs">
                  {stopById.get(stopId)?.name || stopId}
                </span>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {!proposal && withoutCoordsCount > 0 && (
          <Alert variant="warning">
            <TriangleAlert />
            <AlertDescription>
              {t("tours.order.missingCoords", { count: withoutCoordsCount })}
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
        <div
          className={cn(
            "flex max-h-full min-h-0 flex-col rounded-xl border lg:max-w-md lg:flex-none lg:basis-96 lg:self-start",
            view !== "list" && "hidden lg:flex"
          )}
        >
          <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2 lg:h-11">
            <Checkbox
              id="tour-order-select-all"
              className="ml-1 shrink-0"
              checked={allSelected}
              disabled={orderedStops.length === 0}
              onCheckedChange={() =>
                setSelected(allSelected ? new Set() : new Set(order))
              }
              aria-label={t("tours.order.selectAll")}
            />
            <label
              htmlFor="tour-order-select-all"
              className="min-w-0 flex-1 cursor-pointer truncate text-sm font-semibold"
            >
              {t("tours.order.listTitle")}
            </label>

            <span className="shrink-0 text-xs text-muted-foreground">
              {selectionOrder.length > 0
                ? t("expeditions.selected", { count: selectionOrder.length })
                : saving
                  ? t("tours.order.saving")
                  : dirty
                    ? t("tours.order.unsaved")
                    : null}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "size-8 shrink-0",
                selectionOrder.length === 0 && "invisible"
              )}
              onClick={() => setSelected(new Set())}
              aria-label={t("expeditions.clearSelection")}
              title={t("expeditions.clearSelection")}
            >
              <X className="size-4" />
            </Button>
          </div>

          {orderedStops.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              {t("tours.order.empty")}
            </p>
          ) : (
            <ul
              className="min-h-0 flex-1 overflow-y-auto rounded-b-xl"
              onDragOver={(event) => event.preventDefault()}
              onDrop={endDrag}
            >
              {orderedStops.map((stop, index) => {
                const timing = schedule.stops.get(stop.id) ?? null;
                const arrival = timing?.arrival
                  ? toTimeInput(timing.arrival)
                  : null;
                const windowText = stopWindowText(stop, timing);
                const isLate = timing?.late === true;
                const waitingMins = Math.round(timing?.waitingMins ?? 0);
                const windowTone: Tone = isLate
                  ? "danger"
                  : waitingMins > 0
                    ? "warning"
                    : timing?.arrival
                      ? "success"
                      : "neutral";
                const windowCompact = stopWindowCompact(stop, timing);
                const lateMins = Math.round(timing?.lateMins ?? 0);
                const windowExtra =
                  lateMins > 0
                    ? t("tours.order.windows.late", { count: lateMins })
                    : waitingMins > 0
                      ? t("tours.order.windows.waitingShort", { count: waitingMins })
                      : null;
                const windowLabel = [
                  windowText,
                  lateMins > 0
                    ? windowExtra
                    : waitingMins > 0
                      ? [
                          t("tours.order.windows.waiting", { count: waitingMins }),
                          timing?.arrival && timing.serviceStart
                            ? t("tours.order.windows.arrivalThenDelivery", {
                                arrival: toTimeInput(timing.arrival),
                                delivery: toTimeInput(timing.serviceStart),
                              })
                            : null,
                        ]
                          .filter(Boolean)
                          .join(", ")
                      : windowTone === "success"
                        ? t("tours.order.windows.held")
                        : null,
                ]
                  .filter(Boolean)
                  .join(" - ");
                const noCoords = coordsOf(stop) === null;
                const isSelected = selected.has(stop.id);
                const isDragging = draggingIds.includes(stop.id);
                const group = isSelected && selectionOrder.length > 1;
                const firstOfGroup = group
                  ? (positions.get(selectionOrder[0]) ?? 0)
                  : index;
                const lastOfGroup = group
                  ? (positions.get(selectionOrder[selectionOrder.length - 1]) ??
                    index)
                  : index;
                return (
                  <li
                    key={stop.id}
                    draggable={!closed}
                    onDragStart={() => startDrag(stop.id)}
                    onDragEnd={endDrag}
                    onDragOver={(event) => dragOverRow(event, stop.id)}
                    onDrop={endDrag}
                    onClick={() => toggleSelected(stop.id)}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center gap-2 border-b border-border px-2 transition-colors last:border-b-0 hover:bg-accent lg:min-h-10",
                      isLate &&
                        "border-l-2 border-l-status-danger-strong bg-status-danger-bg/40",
                      isSelected && "bg-primary/10",
                      isDragging && "opacity-60 ring-1 ring-inset ring-primary"
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onClick={(event) => event.stopPropagation()}
                      onCheckedChange={() => toggleSelected(stop.id)}
                      aria-label={stop.name || stop.cip}
                    />
                    <GripVertical
                      aria-hidden
                      className="hidden size-3.5 shrink-0 cursor-grab text-muted-foreground lg:block"
                    />
                    <span
                      className="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-primary-foreground"
                      style={{ backgroundColor: tourColor ?? undefined }}
                    >
                      {index + 1}
                    </span>

                    <span
                      className="min-w-0 flex-1 truncate text-sm"
                      title={[stop.name || stop.cip, stop.city]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <span className="font-medium">
                        {stop.name || stop.cip}
                      </span>
                      {stop.city && (
                        <span className="text-muted-foreground"> {stop.city}</span>
                      )}
                    </span>

                    <PharmacyTag color={stop.color} numero={stop.numero} />

                    {noCoords && (
                      <TriangleAlert
                        className="size-4 shrink-0 text-status-warning-text"
                        aria-label={t("tours.order.stopWithoutCoords")}
                      />
                    )}

                    {windowCompact && (
                      <TimingBadge
                        icon={
                          isLate
                            ? TriangleAlert
                            : waitingMins > 0
                              ? Hourglass
                              : windowTone === "success"
                                ? CircleCheck
                                : Clock
                        }
                        tone={windowTone}
                        label={windowLabel}
                        className={cn(arrivalsStale && "opacity-60")}
                      >
                        <span className="hidden sm:inline">{windowCompact}</span>
                      </TimingBadge>
                    )}

                    {arrival && (
                      <span
                        className={cn(
                          "shrink-0 rounded px-1.5 py-0.5 text-xs font-medium tabular-nums",
                          isLate
                            ? "bg-status-danger-bg text-status-danger-text"
                            : "bg-muted",
                          arrivalsStale && "text-muted-foreground opacity-60"
                        )}
                      >
                        {arrival}
                      </span>
                    )}

                    <span
                      className="flex shrink-0 flex-col"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-9 rounded-b-none lg:h-4.5 lg:w-7"
                        disabled={firstOfGroup === 0 || closed}
                        onClick={() => move(stop.id, -1)}
                        aria-label={t("tours.order.moveUp")}
                      >
                        <ChevronUp className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-9 rounded-t-none lg:h-4.5 lg:w-7"
                        disabled={lastOfGroup === order.length - 1 || closed}
                        onClick={() => move(stop.id, 1)}
                        aria-label={t("tours.order.moveDown")}
                      >
                        <ChevronDown className="size-3.5" />
                      </Button>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

        </div>

        <div
          className={cn(
            "min-h-0 flex-1 overflow-hidden rounded-xl border",
            view !== "map" && "hidden lg:block"
          )}
        >
          <MapView center={depotCoords ?? undefined} zoom={depotCoords ? 9 : 5}>
            <MapAutoFit points={mapPoints} />
            {routeCoords.length >= 2 && (
              <MapRoute
                id="tour-order"
                coordinates={routeCoords}
                color={tourColor}
              />
            )}
            {depotCoords && (
              <DepotMarker
                longitude={depotCoords[0]}
                latitude={depotCoords[1]}
                title={user?.account?.societe ?? t("expeditions.depot")}
              />
            )}
            {orderedStops.map((stop, index) => {
              const coords = coordsOf(stop);
              if (!coords) return null;
              const timing = schedule.stops.get(stop.id) ?? null;
              const windowText = stopWindowText(stop, timing);
              const isLate = timing?.late === true;
              const title = [
                stop.name,
                windowText,
                timing && (timing.lateMins ?? 0) > 0
                  ? t("tours.order.windows.late", {
                      count: Math.round(timing.lateMins ?? 0),
                    })
                  : timing && timing.waitingMins > 0
                    ? t("tours.order.windows.waiting", {
                        count: Math.round(timing.waitingMins),
                      })
                    : null,
              ]
                .filter(Boolean)
                .join(" - ");
              return (
                <MapMarker
                  key={stop.id}
                  longitude={coords[0]}
                  latitude={coords[1]}
                  color={tourColor}
                  title={title}
                  label={index + 1}
                  alert={isLate}
                  onClick={() => toggleSelected(stop.id)}
                />
              );
            })}
          </MapView>
        </div>
      </div>

      <Dialog open={confirmLateOpen} onOpenChange={setConfirmLateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t("tours.order.windows.confirmDialog.title")}
            </DialogTitle>
            <DialogDescription>
              {t("tours.order.windows.confirmDialog.message", {
                count: schedule.lateCount,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="min-h-11 lg:min-h-10"
              onClick={() => setConfirmLateOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              className="min-h-11 lg:min-h-10"
              onClick={() => {
                setConfirmLateOpen(false);
                void performSave();
              }}
            >
              {t("tours.order.windows.confirmDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("tours.order.leaveDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("tours.order.leaveDialog.message")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="min-h-11 lg:min-h-10"
              onClick={() => setLeaveOpen(false)}
            >
              {t("tours.order.leaveDialog.stay")}
            </Button>
            <Button
              variant="destructive"
              className="min-h-11 lg:min-h-10"
              onClick={() => {
                setLeaveOpen(false);
                goBack();
              }}
            >
              {t("tours.order.leaveDialog.leave")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
