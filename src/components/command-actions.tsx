import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Ban,
  CalendarClock,
  CircleDot,
  Loader2,
  PackageX,
  Route as RouteIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/date-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/form-field";
import { CommandSouffranceDialog } from "@/components/commands/command-souffrance-dialog";
import { CommandStatusDialog } from "@/components/commands/command-status-dialog";
import { useCommandError } from "@/components/commands/use-command-error";
import { useToast } from "@/app/toast-context";
import { safeCategoryColor } from "@/lib/colors";
import { dateToApiDate, formatDate, parseDate } from "@/lib/date";
import {
  expDateIso,
  useAssignCommands,
  useUnassignCommands,
  useUpdateCommands,
} from "@/features/commands";
import { tourKeys } from "@/features/tours";

export interface CommandActionTour {
  id: string;
  name: string;
  color?: string;
}

interface CommandActionsProps {
  commandIds: string[];
  tours?: CommandActionTour[];
  onDone: () => void;
  disabled?: boolean;
  lockedTitle?: string;
  layout?: "inline" | "bar";
  showAssign?: boolean;
}

export function CommandActions({
  commandIds,
  tours = [],
  onDone,
  disabled = false,
  lockedTitle,
  layout = "inline",
  showAssign = true,
}: CommandActionsProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [statusOpen, setStatusOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [expDateOpen, setExpDateOpen] = useState(false);
  const [souffranceOpen, setSouffranceOpen] = useState(false);

  const inactive = disabled || commandIds.length === 0;
  const title = (label: string) =>
    disabled && lockedTitle ? lockedTitle : label;

  const done = () => {
    void queryClient.invalidateQueries({ queryKey: tourKeys.all });
    onDone();
  };

  const actions = [
    {
      key: "status",
      icon: CircleDot,
      label: t("expeditions.changeStatus"),
      short: t("expeditions.actionsShort.status"),
      disabled: inactive,
      onClick: () => setStatusOpen(true),
    },
    ...(showAssign
      ? [
          {
            key: "assign",
            icon: RouteIcon,
            label: t("expeditions.assign"),
            short: t("expeditions.actionsShort.assign"),
            disabled: inactive,
            onClick: () => setAssignOpen(true),
          },
        ]
      : []),
    {
      key: "expDate",
      icon: CalendarClock,
      label: t("expeditions.changeExpDate"),
      short: t("expeditions.actionsShort.expDate"),
      disabled: inactive,
      onClick: () => setExpDateOpen(true),
    },
    {
      key: "souffrance",
      icon: PackageX,
      label: t("expeditions.souffrance"),
      short: t("expeditions.actionsShort.souffrance"),
      disabled: inactive,
      onClick: () => setSouffranceOpen(true),
    },
  ];

  return (
    <>
      {actions.map((action) =>
        layout === "bar" ? (
          <Button
            key={action.key}
            variant="outline"
            className="min-h-11 shrink-0 gap-1.5 px-3"
            disabled={action.disabled}
            aria-label={action.label}
            onClick={action.onClick}
          >
            <action.icon className="size-4" />
            {action.short}
          </Button>
        ) : (
          <Button
            key={action.key}
            variant="outline"
            size="icon"
            className="size-8 shrink-0"
            disabled={action.disabled}
            title={title(action.label)}
            aria-label={action.label}
            onClick={action.onClick}
          >
            <action.icon className="size-4" />
          </Button>
        )
      )}

      <CommandStatusDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        commandIds={commandIds}
        onDone={done}
      />
      {showAssign && (
        <AssignDialog
          open={assignOpen}
          onOpenChange={setAssignOpen}
          commandIds={commandIds}
          tours={tours}
          onDone={done}
        />
      )}
      <CommandExpDateDialog
        open={expDateOpen}
        onOpenChange={setExpDateOpen}
        commandIds={commandIds}
        onDone={done}
      />
      <CommandSouffranceDialog
        open={souffranceOpen}
        onOpenChange={setSouffranceOpen}
        commandIds={commandIds}
        onDone={done}
      />
    </>
  );
}

interface ActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commandIds: string[];
  onDone: () => void;
}

function AssignDialog({
  open,
  onOpenChange,
  commandIds,
  tours,
  onDone,
}: ActionDialogProps & { tours: CommandActionTour[] }) {
  const { t } = useTranslation();
  const assign = useAssignCommands();
  const unassign = useUnassignCommands();
  const describeError = useCommandError();
  const toast = useToast();
  const pending = assign.isPending || unassign.isPending;

  const close = () => {
    onOpenChange(false);
    onDone();
  };

  const fail = (cause: unknown) => toast.error(describeError(cause));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("expeditions.assignDialog.title")}</DialogTitle>
          <DialogDescription>
            {t("expeditions.assignDialog.subtitle", {
              count: commandIds.length,
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
          {tours.length === 0 ? (
            <p className="px-1 py-4 text-center text-sm text-muted-foreground">
              {t("expeditions.noTours")}
            </p>
          ) : (
            tours.map((tour) => (
              <Button
                key={tour.id}
                variant="outline"
                className="min-h-11 shrink-0 justify-start gap-2.5 px-3 lg:min-h-10"
                disabled={pending}
                onClick={() =>
                  assign.mutate(
                    { tourId: tour.id, commandIds },
                    { onSuccess: close, onError: fail }
                  )
                }
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: safeCategoryColor(tour.color) }}
                />
                <span className="truncate">{tour.name}</span>
              </Button>
            ))
          )}
        </div>
        <DialogFooter className="border-t pt-4">
          <Button
            variant="outline"
            className="min-h-11 text-destructive lg:min-h-10"
            disabled={pending}
            onClick={() =>
              unassign.mutate({ commandIds }, { onSuccess: close, onError: fail })
            }
          >
            <Ban className="size-4" />
            {t("expeditions.unassign")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface CommandExpDateDialogProps extends ActionDialogProps {
  currentExpDate?: string | null;
}

export function CommandExpDateDialog({
  open,
  onOpenChange,
  commandIds,
  onDone,
  currentExpDate,
}: CommandExpDateDialogProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? "en";
  const update = useUpdateCommands();
  const describeError = useCommandError();
  const toast = useToast();
  const parsed = parseDate(currentExpDate);
  const initial = parsed ? dateToApiDate(parsed) : "";
  const [expDate, setExpDate] = useState(initial);

  useEffect(() => {
    if (!open) return;
    setExpDate(initial);
  }, [open, initial]);

  const unchanged = !expDate || expDate === initial;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (unchanged) return;
    update.mutate(
      { commandIds, expDate: expDateIso(expDate) },
      {
        onSuccess: () => {
          onOpenChange(false);
          onDone();
        },
        onError: (cause) => toast.error(describeError(cause)),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("expeditions.expDateDialog.title")}</DialogTitle>
          <DialogDescription>
            {initial
              ? t("expeditions.expDateDialog.current", {
                  date: formatDate(currentExpDate, lang),
                })
              : t("expeditions.statusDialog.subtitle", {
                  count: commandIds.length,
                })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Alert>
            <AlertTriangle />
            <AlertDescription>
              {t("expeditions.expDateDialog.warning")}
            </AlertDescription>
          </Alert>
          <FormField
            label={t("expeditions.expDateDialog.date")}
            htmlFor="exp-new-date"
            required
          >
            <DateField
              id="exp-new-date"
              value={expDate}
              onChange={setExpDate}
              className="min-h-11 lg:min-h-10"
              required
            />
          </FormField>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 lg:min-h-10"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              className="min-h-11 lg:min-h-10"
              disabled={update.isPending || unchanged}
            >
              {update.isPending && <Loader2 className="size-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
