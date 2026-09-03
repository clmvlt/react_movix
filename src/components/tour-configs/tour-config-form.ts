import { normalizeHexColor } from "@/lib/colors";
import {
  DEFAULT_TOUR_HOUR,
  TOUR_CONFIG_NAME_MAX,
  toRecurrence,
  type TourConfig,
  type TourConfigCreateInput,
  type TourConfigUpdateInput,
  type TourRecurrence,
} from "@/features/tour-configs";

const HOUR_PATTERN = /^\d{2}:00$/;

export interface TourConfigFormState {
  tourName: string;
  tourColor: string;
  zoneId: string | null;
  profilId: string | null;
  recurrence: TourRecurrence;
  tourHour: string;
}

export function fromTourHour(value: string | null | undefined): string {
  const raw = (value ?? "").trim();
  if (!raw) return DEFAULT_TOUR_HOUR;
  const [hours] = raw.split(":");
  if (!hours) return DEFAULT_TOUR_HOUR;
  return `${hours.padStart(2, "0")}:00`;
}

export function toTourHour(value: string): string | null {
  const raw = value.trim();
  return HOUR_PATTERN.test(raw) ? raw : null;
}

export function initialTourConfigForm(
  config: TourConfig | null,
  duplicate = false
): TourConfigFormState {
  return {
    tourName: config ? config.tourName : "",
    tourColor: config?.tourColor ?? "",
    zoneId: duplicate ? null : (config?.zone?.id ?? null),
    profilId: duplicate ? null : (config?.profil?.id ?? null),
    recurrence: toRecurrence(config?.recurrence),
    tourHour: fromTourHour(config?.tourHour),
  };
}

export function buildTourConfigPayload(
  form: TourConfigFormState
): TourConfigCreateInput {
  const payload: TourConfigCreateInput = {
    tourName: form.tourName.trim(),
    recurrence: form.recurrence,
    tourHour: toTourHour(form.tourHour) ?? DEFAULT_TOUR_HOUR,
  };
  const color = normalizeHexColor(form.tourColor);
  if (color) payload.tourColor = color;
  if (form.zoneId) payload.zone = { id: form.zoneId };
  if (form.profilId) payload.profil = { id: form.profilId };
  return payload;
}

export function buildTourConfigUpdate(
  form: TourConfigFormState
): TourConfigUpdateInput {
  return buildTourConfigPayload(form);
}

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function validateTourConfigForm(
  form: TourConfigFormState,
  existing: TourConfig[],
  editingId: string | null,
  t: Translate
): Record<string, string> {
  const errors: Record<string, string> = {};

  const name = form.tourName.trim();
  if (!name) {
    errors.tourName = t("tourConfigs.form.errors.nameRequired");
  } else if (name.length > TOUR_CONFIG_NAME_MAX) {
    errors.tourName = t("tourConfigs.form.errors.nameTooLong", {
      max: TOUR_CONFIG_NAME_MAX,
    });
  } else if (
    existing.some(
      (config) =>
        config.id !== editingId &&
        config.tourName.trim().toLowerCase() === name.toLowerCase()
    )
  ) {
    errors.tourName = t("tourConfigs.form.errors.duplicate");
  }

  const color = form.tourColor.trim();
  if (color && !normalizeHexColor(color)) {
    errors.tourColor = t("tourConfigs.form.errors.color");
  }

  if (!toTourHour(form.tourHour)) {
    errors.tourHour = t("tourConfigs.form.errors.hour");
  }

  return errors;
}
