import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  AlertTriangle,
  Boxes,
  Check,
  CheckCircle2,
  Info,
  Layers,
  ListFilter,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  RotateCcw,
  Route as RouteIcon,
  Sparkles,
  Store,
  X,
  type LucideIcon,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/form-field";
import { SwitchRow } from "@/components/field-row";
import { ViewSwitch } from "@/components/view-switch";
import {
  hasExpeditionFilters,
  matchesExpeditionFilters,
  type ExpeditionFilters,
} from "@/components/expeditions/expedition-filters";
import { geometryToCoordinates, type LngLat } from "@/components/map";
import { useAuth } from "@/app/auth-context";
import { useToast } from "@/app/toast-context";
import { ApiError, apiErrorText } from "@/lib/api-error";
import { safeCategoryColor } from "@/lib/colors";
import {
  apiDateToDate,
  formatDate,
  formatTime,
  isValidTimeInput,
} from "@/lib/date";
import { cn } from "@/lib/utils";
import { clientLabel, type Client } from "@/features/clients";
import type { CommandExpedition } from "@/features/commands";
import {
  dispatchStaleOf,
  isTourClosed,
  tourRouteFailureOf,
  useRefreshTourRoute,
  useTourDispatchApply,
  useTourDispatchPreview,
  type Tour,
  type TourDispatchApplyResult,
  type TourDispatchExclusionReason,
  type TourDispatchPreview,
  type TourDispatchPreviewInput,
  type TourDispatchSkipped,
} from "@/features/tours";
import { DispatchBetaBadge } from "./dispatch-beta-badge";
import { DispatchComparison } from "./dispatch-comparison";
import { DispatchMap, type DispatchMapTour } from "./dispatch-map";
import { DispatchStepper } from "./dispatch-stepper";
import { DispatchTourCard } from "./dispatch-tour-card";
import {
  DISPATCH_DEFAULT_SERVICE_MINUTES,
  DISPATCH_DEFAULT_VEHICLES,
  DISPATCH_LARGE_SCOPE,
  DISPATCH_MAX_SERVICE_MINUTES,
  DISPATCH_QUALITIES,
  DISPATCH_QUALITY_SECONDS,
  formatKilometers,
  formatMinutes,
  maxVehicleCount,
  proposalStops,
  suggestTourColors,
  suggestTourNames,
  summarizeScope,
  workloadDurationMins,
  type DispatchQuality,
} from "./dispatch-plan";

type Step = "setup" | "running" | "result" | "applying" | "done";
type ResultView = "tours" | "map";

const NAMES_PREVIEW = 5;
const TICK_MS = 500;
const FINISH_SECONDS = 5;
const PHARMACIES_PER_SECOND = 25;
const EXCLUSION_REASONS: TourDispatchExclusionReason[] = [
  "TOUR_LOCKED",
  "SOUFFRANCE",
  "OTHER_DAY",
  "NOT_FOUND",
];

interface RunState {
  request: TourDispatchPreviewInput;
  pharmacies: number;
  startedAt: number;
}

interface SubmittedTour {
  key: string;
  existingId: string | null;
  name: string;
  color: string;
}

interface ErrorView {
  message: string;
  reference: string | null;
  retry: boolean;
}

interface DispatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  expeditions: CommandExpedition[];
  filters: ExpeditionFilters;
  existingTours: Tour[];
  depot: LngLat | null;
  depotLabel: string;
}

function clientNameOf(client: Client | null | undefined): string {
  return client ? clientLabel(client) : "";
}

export function DispatchDialog({
  open,
  onOpenChange,
  date,
  expeditions,
  filters,
  existingTours,
  depot,
  depotLabel,
}: DispatchDialogProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? "en";
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const previewMutation = useTourDispatchPreview();
  const applyMutation = useTourDispatchApply();
  const refreshRoute = useRefreshTourRoute();

  const [step, setStep] = useState<Step>("setup");
  const [includeAssigned, setIncludeAssigned] = useState(false);
  const [vehicleCount, setVehicleCount] = useState(DISPATCH_DEFAULT_VEHICLES);
  const [departureInput, setDepartureInput] = useState("");
  const [serviceMinutes, setServiceMinutes] = useState(
    DISPATCH_DEFAULT_SERVICE_MINUTES
  );
  const [quality, setQuality] = useState<DispatchQuality>("standard");
  const [run, setRun] = useState<RunState | null>(null);
  const [runError, setRunError] = useState<unknown>(null);
  const [preview, setPreview] = useState<TourDispatchPreview | null>(null);
  const [version, setVersion] = useState(0);
  const [names, setNames] = useState<Record<string, string>>({});
  const [colors, setColors] = useState<Record<string, string>>({});
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [view, setView] = useState<ResultView>("tours");
  const [applyError, setApplyError] = useState<unknown>(null);
  const [applyResult, setApplyResult] = useState<TourDispatchApplyResult | null>(
    null
  );
  const [submitted, setSubmitted] = useState<SubmittedTour[]>([]);
  const [refreshed, setRefreshed] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setStep("setup");
    setRunError(null);
    setPreview(null);
    setFocusKey(null);
    setView("tours");
    setApplyError(null);
    setApplyResult(null);
    setRefreshed(new Set());
  }, [open]);

  useEffect(() => {
    if (step !== "running") return;
    const timer = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(timer);
  }, [step]);

  const commandsById = useMemo(
    () => new Map(expeditions.map((command) => [command.id, command])),
    [expeditions]
  );
  const tourById = useMemo(
    () => new Map(existingTours.map((tour) => [tour.id, tour])),
    [existingTours]
  );
  const closedTourIds = useMemo(
    () =>
      new Set(
        existingTours
          .filter((tour) => isTourClosed(tour.status))
          .map((tour) => tour.id)
      ),
    [existingTours]
  );
  const filtersActive = hasExpeditionFilters(filters);
  const filtered = useMemo(
    () =>
      expeditions.filter((command) => matchesExpeditionFilters(command, filters)),
    [expeditions, filters]
  );
  const assignable = useMemo(
    () =>
      summarizeScope(
        filtered.filter(
          (command) => command.tour && !closedTourIds.has(command.tour.id)
        )
      ),
    [filtered, closedTourIds]
  );
  const scope = useMemo(
    () =>
      summarizeScope(
        filtered.filter(
          (command) =>
            !command.tour ||
            (includeAssigned && !closedTourIds.has(command.tour.id))
        )
      ),
    [filtered, includeAssigned, closedTourIds]
  );

  const maxVehicles = maxVehicleCount(scope.pharmacies);
  const vehicles = Math.min(Math.max(1, vehicleCount), maxVehicles);
  const departureValid =
    departureInput === "" || isValidTimeInput(departureInput);
  const canRun =
    scope.commandIds.length > 0 &&
    departureValid &&
    !previewMutation.isPending;
  const accountDeparture = user?.account?.defaultTourDepartureTime ?? null;

  const proposals = useMemo(() => preview?.tours ?? [], [preview]);
  const stopsByKey = useMemo(
    () =>
      new Map(
        proposals.map((proposal) => [
          proposal.key,
          proposalStops(proposal.route, commandsById),
        ])
      ),
    [proposals, commandsById]
  );
  const mapTours = useMemo<DispatchMapTour[]>(
    () =>
      proposals.map((proposal) => ({
        key: proposal.key,
        color: safeCategoryColor(colors[proposal.key]),
        coordinates: geometryToCoordinates(proposal.route.geometry),
        stops: stopsByKey.get(proposal.key) ?? [],
      })),
    [proposals, colors, stopsByKey]
  );
  const changes = proposals.filter((proposal) => !proposal.unchanged);
  const reorganizing = proposals.some((proposal) => proposal.matchedTourId);
  const namesValid = proposals.every(
    (proposal) =>
      proposal.matchedTourId !== null ||
      (names[proposal.key] ?? "").trim().length > 0
  );
  const noChange =
    preview !== null &&
    changes.length === 0 &&
    preview.releasedTours.length === 0;

  const reasonLabel = (skipped: TourDispatchSkipped) => {
    if (skipped.reason === "TOO_FAR" && skipped.snapDistanceMeters != null) {
      return t("expeditions.dispatch.result.reasons.TOO_FAR_DISTANCE", {
        distance: Math.round(skipped.snapDistanceMeters),
      });
    }
    return t(`expeditions.dispatch.result.reasons.${skipped.reason}`, {
      defaultValue: skipped.reason,
    });
  };

  const skippedByPharmacy = new Map<string, { key: string; label: string }>();
  for (const skipped of preview?.skipped ?? []) {
    const key = skipped.clientId ?? skipped.commandId;
    if (skippedByPharmacy.has(key)) continue;
    const name =
      skipped.clientName || skipped.pharmacyName ||
      clientNameOf(commandsById.get(skipped.commandId)?.client) ||
      t("commands.noPharmacy");
    skippedByPharmacy.set(key, { key, label: `${name} (${reasonLabel(skipped)})` });
  }
  const skippedItems = Array.from(skippedByPharmacy.values());

  const exclusions = EXCLUSION_REASONS.map((reason) => ({
    reason,
    count: (preview?.excludedCommands ?? []).filter(
      (entry) => entry.reason === reason
    ).length,
  })).filter((entry) => entry.count > 0);
  const excludedCount = preview?.excludedCommands.length ?? 0;

  const describePreviewError = (error: unknown): ErrorView => {
    const failure = tourRouteFailureOf(error);
    if (failure) {
      const status = error instanceof ApiError ? error.status : 0;
      const fallback =
        status === 422
          ? t("expeditions.dispatch.errors.unroutable")
          : t("expeditions.dispatch.errors.unavailable");
      return {
        message: failure.detail?.trim() || fallback,
        reference: failure.correlationId ?? null,
        retry: status === 503 || failure.retryable === true,
      };
    }
    if (error instanceof ApiError && error.status === 408) {
      return {
        message: t("expeditions.dispatch.errors.timeout"),
        reference: null,
        retry: true,
      };
    }
    if (error instanceof ApiError && error.status === 0) {
      return {
        message: t("expeditions.dispatch.errors.network"),
        reference: null,
        retry: true,
      };
    }
    return {
      message: apiErrorText(error) ?? t("expeditions.dispatch.errors.failed"),
      reference: null,
      retry: false,
    };
  };

  const describeApplyError = (error: unknown) => {
    const stale = dispatchStaleOf(error);
    if (stale) {
      return {
        title: t("expeditions.dispatch.apply.stale"),
        message: t("expeditions.dispatch.apply.staleDetail", {
          count: stale.commands?.length ?? 0,
        }),
        rerun: true,
      };
    }
    if (error instanceof ApiError && error.status === 409) {
      return {
        title: apiErrorText(error) ?? t("expeditions.dispatch.apply.failed"),
        message: t("expeditions.dispatch.apply.conflict"),
        rerun: true,
      };
    }
    if (
      error instanceof ApiError &&
      (error.status === 0 || error.status === 408)
    ) {
      return {
        title: t("expeditions.dispatch.apply.noAnswer"),
        message: null,
        rerun: true,
      };
    }
    return {
      title: t("expeditions.dispatch.apply.failed"),
      message: apiErrorText(error),
      rerun: false,
    };
  };

  const toggleInclude = (checked: boolean) => {
    setIncludeAssigned(checked);
    if (checked && assignable.assignedTours > 0) {
      setVehicleCount(assignable.assignedTours);
    }
  };

  const launch = (request: TourDispatchPreviewInput, pharmacies: number) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const started = Date.now();
    setRun({ request, pharmacies, startedAt: started });
    setNow(started);
    setRunError(null);
    setApplyError(null);
    setStep("running");

    previewMutation.mutate(
      { input: request, signal: controller.signal },
      {
        onSuccess: (result) => {
          if (controller.signal.aborted) return;
          const fresh = result.tours.filter((proposal) => !proposal.matchedTourId);
          const suggestedNames = suggestTourNames(
            fresh.length,
            existingTours.map((tour) => tour.name),
            (index) => t("expeditions.dispatch.defaultName", { index })
          );
          const suggestedColors = suggestTourColors(
            fresh.length,
            existingTours.map((tour) => tour.color)
          );
          const nextNames: Record<string, string> = {};
          const nextColors: Record<string, string> = {};
          let index = 0;
          for (const proposal of result.tours) {
            if (proposal.matchedTourId) {
              nextNames[proposal.key] = proposal.matchedTourName ?? "";
              nextColors[proposal.key] = safeCategoryColor(proposal.matchedTourColor);
            } else {
              nextNames[proposal.key] = suggestedNames[index];
              nextColors[proposal.key] = suggestedColors[index];
              index += 1;
            }
          }
          setNames(nextNames);
          setColors(nextColors);
          setPreview(result);
          setVersion((value) => value + 1);
          setFocusKey(null);
          setView("tours");
          setStep("result");
        },
        onError: (error) => {
          if (controller.signal.aborted) return;
          setRunError(error);
          setStep("setup");
        },
      }
    );
  };

  const runFromSettings = () => {
    if (!canRun) return;
    const request: TourDispatchPreviewInput = {
      date,
      commandIds: scope.commandIds,
      vehicleCount: vehicles,
      stopServiceSeconds: Math.round(serviceMinutes * 60),
      maxSolvingSeconds: DISPATCH_QUALITY_SECONDS[quality],
    };
    if (departureInput) request.departureTime = `${date}T${departureInput}:00`;
    launch(request, scope.pharmacies);
  };

  const rerun = () => {
    if (run) launch(run.request, run.pharmacies);
  };

  const stopRun = () => {
    abortRef.current?.abort();
    abortRef.current = null;
  };

  const cancelRun = () => {
    stopRun();
    previewMutation.reset();
    setStep(preview ? "result" : "setup");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && applyMutation.isPending) return;
    if (!next) stopRun();
    onOpenChange(next);
  };

  const backToSetup = () => {
    setPreview(null);
    setFocusKey(null);
    setApplyError(null);
    setStep("setup");
  };

  const startApply = () => {
    if (!preview || !namesValid || changes.length === 0) return;
    if (applyMutation.isPending) return;
    const entries: SubmittedTour[] = changes.map((proposal) => ({
      key: proposal.key,
      existingId: proposal.matchedTourId,
      name: proposal.matchedTourId
        ? (proposal.matchedTourName ?? "")
        : (names[proposal.key] ?? "").trim(),
      color: safeCategoryColor(colors[proposal.key]),
    }));
    const tours = changes.map((proposal, index) =>
      proposal.matchedTourId
        ? { tourId: proposal.matchedTourId, commandIds: proposal.commandIds }
        : {
            tourId: null,
            name: entries[index].name,
            color: entries[index].color,
            commandIds: proposal.commandIds,
          }
    );
    setSubmitted(entries);
    setApplyError(null);
    setStep("applying");
    applyMutation.mutate(
      { date: preview.date, tours, expected: preview.expected },
      {
        onSuccess: (result) => {
          setApplyResult(result);
          setRefreshed(new Set());
          setStep("done");
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 400) {
            console.error("[dispatch] apply rejected", error.body);
          }
          setApplyError(error);
          setStep("result");
        },
      }
    );
  };

  let createdIndex = 0;
  const appliedRows = applyResult
    ? submitted.map((entry) => {
        const id = entry.existingId ?? applyResult.createdTourIds[createdIndex] ?? null;
        if (!entry.existingId) createdIndex += 1;
        return { ...entry, id };
      })
    : [];
  const failureRows = (applyResult?.routeFailures ?? []).map((failure) => ({
    ...failure,
    name:
      appliedRows.find((row) => row.id === failure.tourId)?.name ||
      tourById.get(failure.tourId ?? "")?.name ||
      t("expeditions.dispatch.apply.unknownTour"),
  }));
  const createdCount = applyResult?.createdTourIds.length ?? 0;
  const updatedCount = applyResult?.updatedTourIds.length ?? 0;
  let doneKey = "expeditions.dispatch.apply.doneSubtitle";
  if (updatedCount === 0) doneKey = "expeditions.dispatch.apply.doneCreated";
  else if (createdCount === 0) doneKey = "expeditions.dispatch.apply.doneUpdated";
  const firstTourId = appliedRows.find((row) => row.id)?.id ?? null;

  const refreshFailure = (tourId: string) =>
    refreshRoute.mutate(tourId, {
      onSuccess: () =>
        setRefreshed((previous) => new Set(previous).add(tourId)),
      onError: (error) =>
        toast.error(
          apiErrorText(error) ?? t("expeditions.dispatch.apply.refreshFailed")
        ),
    });

  const viewTours = () => {
    onOpenChange(false);
    navigate(firstTourId ? `/app/tours?tour=${firstTourId}` : "/app/tours");
  };

  const solvingSeconds = run?.request.maxSolvingSeconds ?? 0;
  const estimate =
    solvingSeconds +
    FINISH_SECONDS +
    Math.ceil((run?.pharmacies ?? 0) / PHARMACIES_PER_SECOND);
  const elapsed = run ? Math.max(0, Math.floor((now - run.startedAt) / 1000)) : 0;
  const progress = Math.min(95, Math.round((elapsed / estimate) * 100));
  const runErrorView = runError == null ? null : describePreviewError(runError);
  const applyErrorView = applyError == null ? null : describeApplyError(applyError);
  const date0 = formatDate(apiDateToDate(date), lang);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        ref={contentRef}
        hideClose={applyMutation.isPending}
        className={cn(
          "outline-none",
          step === "result"
            ? "max-w-6xl lg:flex lg:h-[calc(100dvh-2rem)] lg:flex-col"
            : "top-[max(1rem,calc(50dvh_-_21rem))] max-h-[min(calc(100dvh_-_2rem),calc(50dvh_+_20rem))] translate-y-0 [scrollbar-gutter:stable_both-edges]"
        )}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          contentRef.current?.focus();
        }}
        onInteractOutside={(event) => {
          if (step !== "setup") event.preventDefault();
        }}
      >
        <DialogHeader className="pr-8">
          <DialogTitle className="flex flex-wrap items-center justify-center gap-2 leading-tight sm:justify-start">
            {t("expeditions.dispatch.title")}
            <DispatchBetaBadge />
          </DialogTitle>
          <DialogDescription>
            {t("expeditions.dispatch.subtitle", { date: date0 })}
          </DialogDescription>
        </DialogHeader>

        {step === "setup" && (
          <>
            <div className="flex flex-col gap-4">
              <SwitchRow
                id="dispatch-include-assigned"
                checked={includeAssigned}
                onCheckedChange={toggleInclude}
                icon={Layers}
                label={t("expeditions.dispatch.scope.includeAssigned")}
                summary={
                  assignable.assigned > 0
                    ? t("expeditions.dispatch.scope.includeAssignedHint")
                    : t("expeditions.dispatch.scope.noAssigned")
                }
                disabled={assignable.assigned === 0 && !includeAssigned}
              />

              <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3">
                <p className="text-sm font-medium text-foreground">
                  {t("expeditions.dispatch.scope.title")}
                </p>
                {scope.commandIds.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("expeditions.dispatch.scope.empty")}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground">
                    <ScopeStat
                      icon={Package}
                      text={t("expeditions.dispatch.scope.commands", {
                        count: scope.commandIds.length,
                      })}
                    />
                    <ScopeStat
                      icon={Store}
                      text={t("expeditions.dispatch.scope.pharmacies", {
                        count: scope.pharmacies,
                      })}
                    />
                    <ScopeStat
                      icon={Boxes}
                      text={t("expeditions.dispatch.scope.packages", {
                        count: scope.packages,
                      })}
                    />
                  </div>
                )}
                {includeAssigned && scope.assigned > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {t("expeditions.dispatch.scope.alreadyAssigned", {
                      count: scope.assigned,
                      tours: scope.assignedTours,
                    })}
                  </p>
                )}
                {filtersActive && (
                  <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <ListFilter className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    {t("expeditions.dispatch.scope.filtered")}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {includeAssigned
                    ? t("expeditions.dispatch.scope.lockedNote")
                    : t("expeditions.dispatch.scope.assignedKept")}
                </p>
              </div>

              {scope.pharmacies > DISPATCH_LARGE_SCOPE && (
                <Alert variant="warning">
                  <AlertTriangle />
                  <AlertDescription>
                    {t("expeditions.dispatch.scope.tooMany")}
                  </AlertDescription>
                </Alert>
              )}
              {runErrorView && (
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertDescription className="flex flex-col items-start gap-2">
                    <span>{runErrorView.message}</span>
                    {runErrorView.reference && (
                      <span className="text-xs">
                        {t("expeditions.dispatch.errors.reference", {
                          id: runErrorView.reference,
                        })}
                      </span>
                    )}
                    {runErrorView.retry && run && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="min-h-10"
                        onClick={rerun}
                      >
                        <RefreshCw />
                        {t("expeditions.dispatch.errors.retry")}
                      </Button>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-x-4 sm:grid-cols-2">
                <FormField
                  label={t("expeditions.dispatch.settings.vehicleCount")}
                  htmlFor="dispatch-vehicles"
                  hint={t("expeditions.dispatch.settings.vehicleHint", {
                    max: maxVehicles,
                  })}
                >
                  <DispatchStepper
                    id="dispatch-vehicles"
                    value={vehicles}
                    min={1}
                    max={maxVehicles}
                    onChange={setVehicleCount}
                    decreaseLabel={t("expeditions.dispatch.settings.decrease")}
                    increaseLabel={t("expeditions.dispatch.settings.increase")}
                  />
                </FormField>
                <FormField
                  label={t("expeditions.dispatch.settings.service")}
                  htmlFor="dispatch-service"
                  hint={t("expeditions.dispatch.settings.serviceHint")}
                >
                  <DispatchStepper
                    id="dispatch-service"
                    value={serviceMinutes}
                    min={0}
                    max={DISPATCH_MAX_SERVICE_MINUTES}
                    onChange={setServiceMinutes}
                    decreaseLabel={t("expeditions.dispatch.settings.serviceDecrease")}
                    increaseLabel={t("expeditions.dispatch.settings.serviceIncrease")}
                    unit={t("expeditions.dispatch.settings.minutesUnit")}
                  />
                </FormField>
                <FormField
                  label={t("expeditions.dispatch.settings.departure")}
                  htmlFor="dispatch-departure"
                  className="sm:col-span-2"
                  hint={
                    accountDeparture
                      ? t("expeditions.dispatch.settings.departureDefault", {
                          time: accountDeparture,
                        })
                      : t("expeditions.dispatch.settings.departureDefaultNone")
                  }
                  error={
                    departureValid
                      ? undefined
                      : t("expeditions.dispatch.settings.invalidTime")
                  }
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      id="dispatch-departure"
                      type="time"
                      step={60}
                      value={departureInput}
                      onChange={(event) => setDepartureInput(event.target.value)}
                      aria-invalid={departureValid ? undefined : true}
                      className="min-h-11 w-fit lg:min-h-10"
                    />
                    {departureInput && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="min-h-10"
                        onClick={() => setDepartureInput("")}
                      >
                        {t("expeditions.dispatch.settings.departureReset")}
                      </Button>
                    )}
                  </div>
                </FormField>
              </div>

              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-sm font-medium leading-none text-foreground">
                  {t("expeditions.dispatch.settings.quality")}
                </legend>
                <div role="radiogroup" className="grid grid-cols-3 gap-2">
                  {DISPATCH_QUALITIES.map((option) => {
                    const active = option === quality;
                    return (
                      <button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setQuality(option)}
                        className={cn(
                          "flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg border px-2 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          active
                            ? "border-primary bg-accent text-foreground ring-1 ring-primary"
                            : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        <span className="truncate font-medium">
                          {t(`expeditions.dispatch.settings.qualities.${option}`)}
                        </span>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {t("expeditions.dispatch.settings.seconds", {
                            count: DISPATCH_QUALITY_SECONDS[option],
                          })}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("expeditions.dispatch.settings.qualityHint")}
                </p>
              </fieldset>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 lg:min-h-10"
                onClick={() => handleOpenChange(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="button"
                className="min-h-11 lg:min-h-10"
                disabled={!canRun}
                onClick={runFromSettings}
              >
                <Sparkles />
                {t("expeditions.dispatch.run")}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "running" && run && (
          <>
            <div
              className="flex flex-col items-center gap-4 py-6 text-center"
              role="status"
              aria-live="polite"
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-accent text-primary">
                <Sparkles className="size-7 animate-pulse" aria-hidden />
              </span>
              <div className="flex flex-col gap-1">
                <p className="text-base font-semibold text-foreground">
                  {t("expeditions.dispatch.running.title", { total: estimate })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("expeditions.dispatch.running.detail", {
                    pharmacies: run.pharmacies,
                    tours: run.request.vehicleCount,
                  })}
                </p>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-label={t("expeditions.dispatch.running.progress")}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
              >
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs tabular-nums text-muted-foreground">
                {t("expeditions.dispatch.running.elapsed", { elapsed })}
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 lg:min-h-10"
                onClick={cancelRun}
              >
                <X />
                {t("common.cancel")}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "result" && preview && (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <SummaryTile
                label={t("expeditions.dispatch.result.tours")}
                value={
                  run && proposals.length < run.request.vehicleCount
                    ? t("expeditions.dispatch.result.toursOf", {
                        used: proposals.length,
                        total: run.request.vehicleCount,
                      })
                    : String(proposals.length)
                }
              />
              <SummaryTile
                label={t("expeditions.dispatch.result.totalDuration")}
                value={formatMinutes(workloadDurationMins(preview.proposed))}
              />
              <SummaryTile
                label={t("expeditions.dispatch.result.totalDistance")}
                value={formatKilometers(preview.proposed.distanceKm, lang)}
              />
              <SummaryTile
                label={t("expeditions.dispatch.result.spread")}
                value={formatMinutes(preview.proposed.spreadMins)}
                hint={t("expeditions.dispatch.result.spreadHint")}
              />
            </div>
            <p className="-mt-2 text-xs text-muted-foreground">
              {t("expeditions.dispatch.result.settingsLine", {
                time: formatTime(preview.departureTime, lang),
                minutes: Math.round(preview.stopServiceSeconds / 60),
              })}
            </p>

            {applyErrorView && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription className="flex flex-col items-start gap-2">
                  <span className="font-medium">{applyErrorView.title}</span>
                  {applyErrorView.message && <span>{applyErrorView.message}</span>}
                  {applyErrorView.rerun && run && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-h-10"
                      onClick={rerun}
                    >
                      <RefreshCw />
                      {t("expeditions.dispatch.apply.rerun")}
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}
            {preview.current && (
              <DispatchComparison
                key={version}
                current={preview.current}
                proposed={preview.proposed}
                lang={lang}
              />
            )}
            {noChange && (
              <Alert variant="success">
                <CheckCircle2 />
                <AlertDescription>
                  {t("expeditions.dispatch.result.noChange")}
                </AlertDescription>
              </Alert>
            )}
            {!preview.feasible && (
              <Alert variant="warning">
                <AlertTriangle />
                <AlertDescription>
                  {t("expeditions.dispatch.result.infeasible", {
                    count: preview.timeWindowViolations,
                  })}
                </AlertDescription>
              </Alert>
            )}
            {skippedItems.length > 0 && (
              <Alert variant="warning">
                <MapPin />
                <AlertDescription>
                  {t("expeditions.dispatch.result.skipped", {
                    count: preview.skipped.length,
                  })}
                  <NameList items={skippedItems} />
                </AlertDescription>
              </Alert>
            )}
            {excludedCount > 0 && (
              <Alert>
                <Info />
                <AlertDescription>
                  {t("expeditions.dispatch.result.excluded", {
                    count: excludedCount,
                  })}
                  <ul className="mt-1.5 flex flex-col gap-0.5 text-xs text-muted-foreground">
                    {exclusions.map((entry) => (
                      <li key={entry.reason}>
                        {t(`expeditions.dispatch.result.exclusions.${entry.reason}`, {
                          count: entry.count,
                        })}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <ViewSwitch
              className="lg:hidden"
              value={view}
              onChange={setView}
              items={[
                {
                  value: "tours",
                  label: t("common.views.tours"),
                  icon: RouteIcon,
                  count: proposals.length,
                },
                { value: "map", label: t("common.views.map"), icon: MapPin },
              ]}
            />

            <div className="grid min-w-0 gap-4 lg:min-h-88 lg:flex-1 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
              <div
                className={cn(
                  "flex min-h-0 min-w-0 flex-col gap-3 lg:overflow-y-auto lg:pr-1",
                  view === "map" && "hidden lg:flex"
                )}
              >
                {proposals.map((proposal) => (
                  <DispatchTourCard
                    key={proposal.key}
                    proposal={proposal}
                    stops={stopsByKey.get(proposal.key) ?? []}
                    name={names[proposal.key] ?? ""}
                    color={colors[proposal.key] ?? ""}
                    focused={focusKey === proposal.key}
                    reorganizing={reorganizing}
                    onNameChange={(value) =>
                      setNames((previous) => ({ ...previous, [proposal.key]: value }))
                    }
                    onColorChange={(value) =>
                      setColors((previous) => ({ ...previous, [proposal.key]: value }))
                    }
                    onFocus={() =>
                      setFocusKey((previous) =>
                        previous === proposal.key ? null : proposal.key
                      )
                    }
                  />
                ))}
                {preview.releasedTours.map((entry) => (
                  <p
                    key={entry.tourId}
                    className="shrink-0 rounded-xl border border-dashed border-status-warning-strong/40 px-3 py-3 text-sm text-muted-foreground"
                  >
                    {t("expeditions.dispatch.result.released", {
                      name: entry.name ?? tourById.get(entry.tourId)?.name ?? "",
                      count: entry.outgoing,
                    })}
                  </p>
                ))}
              </div>
              <div
                className={cn(
                  "relative h-[50dvh] min-h-64 overflow-hidden rounded-xl border border-border lg:h-full lg:min-h-0",
                  view === "tours" && "hidden lg:block"
                )}
              >
                <DispatchMap
                  tours={mapTours}
                  focusKey={focusKey}
                  depot={depot}
                  depotLabel={depotLabel}
                  version={version}
                  onSelectTour={setFocusKey}
                />
              </div>
            </div>

            <DialogFooter className="sticky -bottom-4 z-10 -mx-4 -mb-4 flex-row rounded-b-lg border-t border-border bg-card px-4 py-3 sm:-bottom-6 sm:-mx-6 sm:-mb-6 sm:px-6">
              <Button
                type="button"
                variant="outline"
                className="min-h-11 min-w-11 px-3 lg:min-h-10"
                aria-label={t("expeditions.dispatch.result.back")}
                onClick={backToSetup}
              >
                <RotateCcw />
                <span className="hidden sm:inline">
                  {t("expeditions.dispatch.result.back")}
                </span>
              </Button>
              <Button
                type="button"
                className="min-h-11 flex-1 sm:flex-none lg:min-h-10"
                disabled={!namesValid || changes.length === 0}
                onClick={startApply}
              >
                <Check />
                {reorganizing
                  ? t("expeditions.dispatch.result.applyReorganize", {
                      count: changes.length,
                    })
                  : t("expeditions.dispatch.result.apply", {
                      count: changes.length,
                    })}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "applying" && (
          <div
            className="flex flex-col items-center gap-3 py-8 text-center"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
            <p className="text-base font-semibold text-foreground">
              {t("expeditions.dispatch.apply.running")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("expeditions.dispatch.apply.runningDetail")}
            </p>
          </div>
        )}

        {step === "done" && applyResult && (
          <>
            <div className="flex flex-col gap-1">
              <p className="text-base font-semibold text-foreground">
                {t("expeditions.dispatch.apply.doneTitle")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t(doneKey, {
                  created: createdCount,
                  updated: updatedCount,
                  date: date0,
                })}
              </p>
            </div>
            <ol className="flex flex-col gap-2">
              {appliedRows.map((row) => (
                <li
                  key={row.key}
                  className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5"
                >
                  <Check
                    className="size-4 shrink-0 text-status-success-strong"
                    aria-hidden
                  />
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: row.color }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                    {row.name}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {row.existingId
                      ? t("expeditions.dispatch.apply.updated")
                      : t("expeditions.dispatch.apply.created")}
                  </span>
                </li>
              ))}
            </ol>
            {failureRows.length > 0 && (
              <Alert variant="warning">
                <AlertTriangle />
                <AlertDescription className="flex flex-col gap-2">
                  <span>
                    {t("expeditions.dispatch.apply.routeFailures", {
                      count: failureRows.length,
                    })}
                  </span>
                  <ul className="flex flex-col gap-2">
                    {failureRows.map((failure, index) => {
                      const tourId = failure.tourId ?? null;
                      const done = tourId !== null && refreshed.has(tourId);
                      const busy =
                        refreshRoute.isPending && refreshRoute.variables === tourId;
                      return (
                        <li
                          key={`${tourId ?? "tour"}-${index}`}
                          className="flex flex-wrap items-center justify-between gap-2 text-xs"
                        >
                          <span className="min-w-0">
                            <span className="font-medium">{failure.name}</span>
                            {failure.detail ? ` : ${failure.detail}` : ""}
                            {failure.correlationId && (
                              <span className="block opacity-80">
                                {t("expeditions.dispatch.errors.reference", {
                                  id: failure.correlationId,
                                })}
                              </span>
                            )}
                          </span>
                          {done ? (
                            <span className="inline-flex items-center gap-1 font-medium text-status-success-text">
                              <Check className="size-3.5" aria-hidden />
                              {t("expeditions.dispatch.apply.refreshed")}
                            </span>
                          ) : (
                            tourId &&
                            failure.retryable !== false && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="min-h-10"
                                disabled={busy}
                                onClick={() => refreshFailure(tourId)}
                              >
                                {busy ? (
                                  <Loader2 className="animate-spin" />
                                ) : (
                                  <RefreshCw />
                                )}
                                {t("expeditions.dispatch.apply.refresh")}
                              </Button>
                            )
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 lg:min-h-10"
                onClick={() => handleOpenChange(false)}
              >
                {t("common.close")}
              </Button>
              <Button
                type="button"
                className="min-h-11 lg:min-h-10"
                onClick={viewTours}
              >
                <RouteIcon />
                {t("expeditions.dispatch.apply.viewTours")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ScopeStat({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 tabular-nums">
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      {text}
    </span>
  );
}

function SummaryTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 rounded-lg border border-border bg-muted/40 px-3 py-2">
      <span className="truncate text-xs text-muted-foreground">{label}</span>
      <span className="truncate text-base font-semibold tabular-nums text-foreground">
        {value}
      </span>
      {hint && (
        <span className="hidden text-xs text-muted-foreground sm:block">
          {hint}
        </span>
      )}
    </div>
  );
}

function NameList({ items }: { items: { key: string; label: string }[] }) {
  const { t } = useTranslation();
  const shown = items.slice(0, NAMES_PREVIEW);
  const rest = items.length - shown.length;
  return (
    <ul className="mt-1.5 flex flex-col gap-0.5 text-xs">
      {shown.map((item) => (
        <li key={item.key} className="wrap-break-word">
          {item.label}
        </li>
      ))}
      {rest > 0 && <li>{t("expeditions.dispatch.more", { count: rest })}</li>}
    </ul>
  );
}

