import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Check, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCommandError } from "@/components/commands/use-command-error";
import { useToast } from "@/app/toast-context";
import { cn } from "@/lib/utils";
import { safeCategoryColor, zoneColorMap } from "@/lib/colors";
import {
  useAssignCommandsByTour,
  type CommandAssignGroup,
  type CommandAssignGroupFailure,
} from "@/features/commands";
import type { Zone } from "@/features/zones";
import {
  defaultZoneTarget,
  planZoneAssignment,
  zoneTargetOf,
  type ZoneAssignCommand,
  type ZoneAssignGroup,
  type ZoneAssignTour,
} from "./zone-assign";

interface ZoneAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: ZoneAssignCommand[];
  tours: ZoneAssignTour[];
  zones: Zone[];
  onDone: () => void;
}

export function ZoneAssignDialog({
  open,
  onOpenChange,
  commands,
  tours,
  zones,
  onDone,
}: ZoneAssignDialogProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const describeError = useCommandError();
  const assign = useAssignCommandsByTour();
  const [overrides, setOverrides] = useState<Record<string, string | null>>(
    {}
  );
  const [failures, setFailures] = useState<CommandAssignGroupFailure[]>([]);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setOverrides({});
    setFailures([]);
    setApplied(false);
  }, [open]);

  const plan = useMemo(
    () => planZoneAssignment(commands, tours),
    [commands, tours]
  );
  const colors = useMemo(
    () => zoneColorMap(zones.map((zone) => zone.id)),
    [zones]
  );

  const targetOf = (group: ZoneAssignGroup) =>
    group.zoneId in overrides
      ? overrides[group.zoneId]
      : defaultZoneTarget(group);

  const batches: CommandAssignGroup[] = plan.groups.flatMap((group) => {
    const tourId = targetOf(group);
    const { pending } = zoneTargetOf(group, tourId);
    return tourId && pending.length > 0
      ? [{ tourId, commandIds: pending.map((command) => command.id) }]
      : [];
  });
  const total = batches.reduce(
    (sum, batch) => sum + batch.commandIds.length,
    0
  );

  const tourName = (id: string) =>
    tours.find((tour) => tour.id === id)?.name ?? id;

  const changeOpen = (next: boolean) => {
    if (!next && applied) onDone();
    onOpenChange(next);
  };

  const submit = () => {
    if (batches.length === 0) return;
    setFailures([]);
    assign.mutate(batches, {
      onSuccess: (result) => {
        const count = result.assigned.reduce(
          (sum, group) => sum + group.commandIds.length,
          0
        );
        if (count > 0) {
          setApplied(true);
          toast.success(
            t("expeditions.zoneAssignDialog.done", {
              count,
              tours: result.assigned.length,
            })
          );
        }
        if (result.failed.length === 0) {
          onOpenChange(false);
          onDone();
          return;
        }
        setFailures(result.failed);
      },
      onError: (cause) => toast.error(describeError(cause)),
    });
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="pr-6">
            {t("expeditions.zoneAssignDialog.title")}
          </DialogTitle>
          <DialogDescription>
            {t("expeditions.zoneAssignDialog.subtitle", {
              count: commands.length,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {plan.zonedTours === 0 && (
            <Alert>
              <AlertTriangle />
              <AlertDescription>
                {t("expeditions.zoneAssignDialog.noZonedTour")}
              </AlertDescription>
            </Alert>
          )}

          {failures.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle />
              <AlertDescription>
                <p>{t("expeditions.zoneAssignDialog.failed")}</p>
                <ul className="list-disc pl-4">
                  {failures.map((failure) => (
                    <li key={failure.tourId}>
                      {t("expeditions.zoneAssignDialog.failure", {
                        tour: tourName(failure.tourId),
                        message: describeError(failure.error),
                      })}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {plan.groups.length > 0 && (
            <ul className="flex flex-col gap-2">
              {plan.groups.map((group) => (
                <ZoneAssignRow
                  key={group.zoneId}
                  group={group}
                  color={colors[group.zoneId]}
                  tourId={targetOf(group)}
                  disabled={assign.isPending}
                  onChange={(tourId) =>
                    setOverrides((prev) => ({
                      ...prev,
                      [group.zoneId]: tourId,
                    }))
                  }
                />
              ))}
            </ul>
          )}

          {plan.withoutZone.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {t("expeditions.zoneAssignDialog.withoutZone", {
                count: plan.withoutZone.length,
              })}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 lg:min-h-10"
            disabled={assign.isPending}
            onClick={() => changeOpen(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            className="min-h-11 lg:min-h-10"
            disabled={assign.isPending || total === 0}
            onClick={submit}
          >
            {assign.isPending && <Loader2 className="size-4 animate-spin" />}
            {t("expeditions.zoneAssignDialog.submit", { count: total })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ZoneAssignRowProps {
  group: ZoneAssignGroup;
  color?: string;
  tourId: string | null;
  disabled: boolean;
  onChange: (tourId: string | null) => void;
}

function ZoneAssignRow({
  group,
  color,
  tourId,
  disabled,
  onChange,
}: ZoneAssignRowProps) {
  const { t } = useTranslation();
  const target = zoneTargetOf(group, tourId);
  const details = [
    t("expeditions.zoneAssignDialog.commands", {
      count: group.commands.length,
    }),
  ];
  if (target.already > 0) {
    details.push(
      t("expeditions.zoneAssignDialog.already", { count: target.already })
    );
  }
  if (target.moved > 0) {
    details.push(
      t("expeditions.zoneAssignDialog.moved", { count: target.moved })
    );
  }

  const warning =
    group.tours.length === 0
      ? t("expeditions.zoneAssignDialog.noTour")
      : group.tours.length > 1 && !tourId
        ? t("expeditions.zoneAssignDialog.chooseTour", {
            count: group.tours.length,
          })
        : null;

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:gap-3">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
          {color && (
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: color }}
            />
          )}
          <span className="truncate">{group.zoneName}</span>
        </span>
        <span className="text-xs text-muted-foreground">
          {details.join(", ")}
        </span>
        {warning && (
          <span className="flex items-center gap-1 text-xs text-status-warning-text">
            <AlertTriangle aria-hidden className="size-3.5 shrink-0" />
            {warning}
          </span>
        )}
      </div>
      {group.tours.length > 0 && (
        <TourPicker
          className="sm:w-52 sm:shrink-0"
          tours={group.tours}
          value={tourId}
          disabled={disabled}
          ariaLabel={t("expeditions.zoneAssignDialog.tourFor", {
            zone: group.zoneName,
          })}
          onChange={onChange}
        />
      )}
    </li>
  );
}

interface TourPickerProps {
  tours: ZoneAssignTour[];
  value: string | null;
  onChange: (value: string | null) => void;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
}

function TourPicker({
  tours,
  value,
  onChange,
  ariaLabel,
  disabled,
  className,
}: TourPickerProps) {
  const { t } = useTranslation();
  const selected = tours.find((tour) => tour.id === value);
  const skipLabel = t("expeditions.zoneAssignDialog.skip");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={ariaLabel}
          className={cn(
            "min-h-11 w-full justify-between gap-2 font-normal lg:min-h-10",
            className
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            {selected && (
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: safeCategoryColor(selected.color) }}
              />
            )}
            <span className="truncate">
              {selected ? selected.name : skipLabel}
            </span>
          </span>
          <ChevronDown className="shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-80 w-56 overflow-y-auto"
      >
        {tours.map((tour) => (
          <DropdownMenuItem
            key={tour.id}
            className="min-h-11 lg:min-h-9"
            onSelect={() => onChange(tour.id)}
          >
            <Check
              className={cn("opacity-0", tour.id === value && "opacity-100")}
            />
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: safeCategoryColor(tour.color) }}
            />
            <span className="truncate">{tour.name}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="min-h-11 lg:min-h-9"
          onSelect={() => onChange(null)}
        >
          <Check className={cn("opacity-0", value === null && "opacity-100")} />
          <span className="truncate">{skipLabel}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
