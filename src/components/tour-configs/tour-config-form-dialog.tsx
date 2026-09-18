import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormField } from "@/components/form-field";
import { ColorPicker } from "@/components/color-picker";
import { ZoneSelect } from "@/components/zone-select";
import { ClientSelectField } from "@/components/clients/client-select-field";
import { useApiErrorMessage } from "@/components/account/use-account-error";
import { useToast } from "@/app/toast-context";
import { normalizeHexColor } from "@/lib/colors";
import { useZones } from "@/features/zones";
import { useProfiles } from "@/features/profiles";
import {
  activeWeekdays,
  TOUR_CONFIG_NAME_MAX,
  useCreateTourConfig,
  useUpdateTourConfig,
  type TourConfig,
} from "@/features/tour-configs";
import {
  buildTourConfigPayload,
  buildTourConfigUpdate,
  initialTourConfigForm,
  validateTourConfigForm,
  type TourConfigFormState,
} from "./tour-config-form";
import { WeekdayPicker } from "./weekday-picker";
import { HourPicker } from "./hour-picker";
import { ProfilSelect } from "./profil-select";

export type TourConfigDialogMode = "create" | "edit" | "duplicate";

interface TourConfigFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: TourConfigDialogMode;
  config: TourConfig | null;
  configs: TourConfig[];
}

export function TourConfigFormDialog({
  open,
  onOpenChange,
  mode,
  config,
  configs,
}: TourConfigFormDialogProps) {
  const { t } = useTranslation();
  const zonesQuery = useZones();
  const profilesQuery = useProfiles();
  const createConfig = useCreateTourConfig();
  const updateConfig = useUpdateTourConfig();
  const errorMessage = useApiErrorMessage("tourConfigs");
  const toast = useToast();

  const [form, setForm] = useState<TourConfigFormState>(() =>
    initialTourConfigForm(null)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = mode === "edit";
  const isDuplicate = mode === "duplicate";

  useEffect(() => {
    if (!open) return;
    const next = initialTourConfigForm(config, isDuplicate);
    if (isDuplicate && config) {
      next.tourName = t("tourConfigs.form.copySuffix", {
        name: config.tourName,
      });
    }
    setForm(next);
    setErrors({});
  }, [open, config, isDuplicate, t]);

  const set = <K extends keyof TourConfigFormState>(
    key: K,
    value: TourConfigFormState[K]
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: "" }));
  };

  const pending = createConfig.isPending || updateConfig.isPending;
  const zoneLocked = isEdit && Boolean(config?.zone);
  const profilLocked = isEdit && Boolean(config?.profil);
  const noRecurrence = activeWeekdays(form.recurrence).length === 0;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const nextErrors = validateTourConfigForm(
      form,
      configs,
      isEdit ? (config?.id ?? null) : null,
      t
    );
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const onSuccess = () => onOpenChange(false);
    const onError = (error: unknown) => {
      toast.error(errorMessage(error, "tourConfigs.errors.saveFailed"));
    };

    if (isEdit && config) {
      updateConfig.mutate(
        { id: config.id, input: buildTourConfigUpdate(form, config) },
        { onSuccess, onError }
      );
    } else {
      createConfig.mutate(buildTourConfigPayload(form), { onSuccess, onError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t("tourConfigs.form.editTitle")
              : isDuplicate
                ? t("tourConfigs.form.duplicateTitle")
                : t("tourConfigs.form.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("tourConfigs.deferredNotice")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-1" noValidate>
          <FormField
            label={t("tourConfigs.form.name")}
            htmlFor="tour-config-name"
            error={errors.tourName}
            hint={t("tourConfigs.form.nameHint")}
            required
          >
            <Input
              id="tour-config-name"
              value={form.tourName}
              onChange={(event) => set("tourName", event.target.value)}
              maxLength={TOUR_CONFIG_NAME_MAX}
              autoComplete="off"
            />
          </FormField>

          <FormField
            label={t("tourConfigs.form.color")}
            htmlFor="tour-config-color"
            error={errors.tourColor}
          >
            <ColorPicker
              id="tour-config-color"
              value={form.tourColor}
              onChange={(next) =>
                set("tourColor", normalizeHexColor(next) ?? next)
              }
              disabled={pending}
            />
          </FormField>

          <FormField
            label={t("tourConfigs.form.zone")}
            htmlFor="tour-config-zone"
            hint={zoneLocked ? t("tourConfigs.form.zoneLocked") : undefined}
          >
            <ZoneSelect
              id="tour-config-zone"
              value={form.zoneId}
              onChange={(next) => {
                if (zoneLocked && next === null) return;
                set("zoneId", next);
              }}
              zones={zonesQuery.data ?? []}
              neutralLabel={t("tourConfigs.noZone")}
              ariaLabel={t("tourConfigs.form.zone")}
              disabled={pending}
            />
          </FormField>

          <FormField
            label={t("tourConfigs.form.driver")}
            htmlFor="tour-config-profil"
            hint={profilLocked ? t("tourConfigs.form.driverLocked") : undefined}
          >
            <ProfilSelect
              id="tour-config-profil"
              value={form.profilId}
              onChange={(next) => set("profilId", next)}
              profiles={profilesQuery.data ?? []}
              neutralLabel={t("tourConfigs.noDriver")}
              allowNeutral={!profilLocked}
              ariaLabel={t("tourConfigs.form.driver")}
              disabled={pending}
            />
          </FormField>

          <FormField
            label={t("tourConfigs.form.client")}
            htmlFor="tour-config-client"
            hint={t("tourConfigs.form.clientHint")}
          >
            <ClientSelectField
              id="tour-config-client"
              value={form.client}
              onChange={(next) => set("client", next)}
              disabled={pending}
              dialogTitle={t("commands.parties.pick.orderer")}
            />
          </FormField>

          <FormField
            label={t("tourConfigs.form.recurrence")}
            htmlFor="tour-config-recurrence"
          >
            <WeekdayPicker
              id="tour-config-recurrence"
              value={form.recurrence}
              onChange={(next) => set("recurrence", next)}
              disabled={pending}
            />
          </FormField>

          {noRecurrence && (
            <Alert variant="warning" className="mb-2">
              <AlertDescription>
                {t("tourConfigs.form.noRecurrenceWarning")}
              </AlertDescription>
            </Alert>
          )}

          <FormField
            label={t("tourConfigs.form.hour")}
            htmlFor="tour-config-hour"
            error={errors.tourHour}
            hint={t("tourConfigs.form.hourHint")}
          >
            <HourPicker
              id="tour-config-hour"
              value={form.tourHour}
              onChange={(next) => set("tourHour", next)}
              ariaLabel={t("tourConfigs.form.hour")}
              disabled={pending}
            />
          </FormField>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 sm:min-h-10"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              className="min-h-11 sm:min-h-10"
              disabled={pending}
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? t("common.save") : t("common.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
