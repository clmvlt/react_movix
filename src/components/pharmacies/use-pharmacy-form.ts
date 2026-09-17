import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/app/toast-context";
import { ApiError, apiErrorText } from "@/lib/api-error";
import {
  addressKey,
  addressResultPatch,
  firstErrorKey,
  formPosition,
  formatCoordinate,
  initialFormState,
  isFormEqual,
  isPharmacyFormDirty,
  pharmacyFieldId,
  validatePharmacyForm,
  type PharmacyFormState,
} from "@/components/pharmacies/pharmacy-form";
import { fromApiFieldErrors, type Pharmacy } from "@/features/pharmacies";
import type { AddressResult } from "@/features/ors";
import type { LngLat } from "@/components/map";

export type PharmacyFormMode = "edit" | "create";
export type PositionSource = "saved" | "address" | "manual" | "deliveries";

const ADDRESS_ZOOM = 17;

export interface MapFocus {
  center: LngLat;
  zoom: number;
  token: number;
}

export interface PharmacyFormApi {
  mode: PharmacyFormMode;
  idPrefix: string;
  form: PharmacyFormState;
  snapshot: Pharmacy | null;
  errors: Record<string, string>;
  formError: string | null;
  dirty: boolean;
  position: LngLat | null;
  placedPosition: LngLat | null;
  positionSource: PositionSource;
  positionStale: boolean;
  focus: MapFocus | null;
  set: <K extends keyof PharmacyFormState>(
    key: K,
    value: PharmacyFormState[K]
  ) => void;
  patch: (partial: Partial<PharmacyFormState>) => void;
  setPosition: (
    position: LngLat | null,
    source: PositionSource,
    focusZoom?: number
  ) => void;
  applyAddress: (result: AddressResult) => void;
  focusOn: (center: LngLat, zoom: number) => void;
  reset: (next?: Pharmacy | null) => void;
  validate: () => boolean;
  applyApiError: (error: unknown) => void;
  focusField: (key: string) => void;
}

interface UsePharmacyFormOptions {
  baseline: Pharmacy | null;
  mode: PharmacyFormMode;
  idPrefix: string;
}

interface PositionMeta {
  source: PositionSource;
  addressAtPlacement: string;
  placedPosition: LngLat | null;
}

interface Draft {
  form: PharmacyFormState;
  meta: PositionMeta;
}

function initialDraft(baseline: Pharmacy | null): Draft {
  const form = initialFormState(baseline);
  return {
    form,
    meta: {
      source: "saved",
      addressAtPlacement: addressKey(form),
      placedPosition: formPosition(form),
    },
  };
}

export function usePharmacyForm({
  baseline,
  mode,
  idPrefix,
}: UsePharmacyFormOptions): PharmacyFormApi {
  const { t } = useTranslation();
  const toast = useToast();

  const [snapshot, setSnapshot] = useState<Pharmacy | null>(baseline);
  const [draft, setDraft] = useState<Draft>(() => initialDraft(baseline));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [focus, setFocus] = useState<MapFocus | null>(null);
  const [pendingFocus, setPendingFocus] = useState<string | null>(null);

  const { form, meta } = draft;
  const position = formPosition(form);
  const dirty =
    mode === "edit" && snapshot
      ? isPharmacyFormDirty(form, snapshot)
      : !isFormEqual(form, initialFormState(snapshot));
  const positionStale =
    position !== null && addressKey(form) !== meta.addressAtPlacement;

  const clearErrors = (keys: string[]) => {
    setErrors((prev) => {
      if (!keys.some((key) => prev[key])) return prev;
      const next = { ...prev };
      for (const key of keys) delete next[key];
      return next;
    });
  };

  const set: PharmacyFormApi["set"] = (key, value) => {
    setDraft((prev) => ({ ...prev, form: { ...prev.form, [key]: value } }));
    clearErrors([key]);
  };

  const patch: PharmacyFormApi["patch"] = (partial) => {
    setDraft((prev) => ({ ...prev, form: { ...prev.form, ...partial } }));
    clearErrors(Object.keys(partial));
  };

  const focusOn: PharmacyFormApi["focusOn"] = (center, zoom) => {
    setFocus((prev) => ({ center, zoom, token: (prev?.token ?? 0) + 1 }));
  };

  const setPosition: PharmacyFormApi["setPosition"] = (
    next,
    source,
    focusZoom
  ) => {
    setDraft((prev) => {
      const updated = {
        ...prev.form,
        latitude: next ? formatCoordinate(next[1]) : "",
        longitude: next ? formatCoordinate(next[0]) : "",
      };
      return {
        form: updated,
        meta: {
          source,
          addressAtPlacement: addressKey(updated),
          placedPosition: next,
        },
      };
    });
    clearErrors(["latitude", "longitude"]);
    if (next && focusZoom != null) focusOn(next, focusZoom);
  };

  const applyAddress: PharmacyFormApi["applyAddress"] = (result) => {
    setDraft((prev) => {
      const updated = { ...prev.form, ...addressResultPatch(result) };
      return {
        form: updated,
        meta: {
          source: "address",
          addressAtPlacement: addressKey(updated),
          placedPosition: [result.lon, result.lat],
        },
      };
    });
    clearErrors(["address1", "postalCode", "city", "latitude", "longitude"]);
    focusOn([result.lon, result.lat], ADDRESS_ZOOM);
  };

  const reset: PharmacyFormApi["reset"] = (next) => {
    const target = next === undefined ? snapshot : next;
    setSnapshot(target);
    setDraft(initialDraft(target));
    setErrors({});
    setFormError(null);
    setFocus(null);
  };

  const focusField: PharmacyFormApi["focusField"] = (key) => {
    const element = document.getElementById(pharmacyFieldId(idPrefix, key));
    if (!element) return;
    element.scrollIntoView({ block: "center", behavior: "smooth" });
    element.focus({ preventScroll: true });
  };

  useEffect(() => {
    if (!pendingFocus) return;
    focusField(pendingFocus);
    setPendingFocus(null);
  }, [pendingFocus, focusField]);

  const validate: PharmacyFormApi["validate"] = () => {
    const found = validatePharmacyForm(form, t);
    setErrors(found);
    setFormError(null);
    const first = firstErrorKey(found);
    if (!first) return true;
    toast.error(t("pharmacies.form.formInvalid"));
    setPendingFocus(first);
    return false;
  };

  const applyApiError: PharmacyFormApi["applyApiError"] = (error) => {
    if (error instanceof ApiError) {
      if (error.isPharmacyCipAlreadyUsed) {
        setErrors({ cip: t("pharmacies.form.errors.cipAlreadyUsed") });
        setFormError(null);
        toast.error(t("pharmacies.form.errors.cipAlreadyUsed"));
        setPendingFocus("cip");
        return;
      }
      const mapped = fromApiFieldErrors(error.fieldErrors);
      const known: Record<string, string> = {};
      const unknown: string[] = [];
      for (const [key, message] of Object.entries(mapped)) {
        if (key in form) known[key] = message;
        else unknown.push(`${key} ${message}`);
      }
      if (Object.keys(known).length > 0) {
        setErrors(known);
        setFormError(unknown.length > 0 ? unknown.join("\n") : null);
        toast.error(t("pharmacies.form.formInvalid"));
        const first = firstErrorKey(known);
        if (first) setPendingFocus(first);
        return;
      }
      const text = apiErrorText(error);
      setFormError(text);
      toast.error(text ?? t("pharmacies.form.failed"));
      return;
    }
    setFormError(null);
    toast.error(t("pharmacies.form.failed"));
  };

  return {
    mode,
    idPrefix,
    form,
    snapshot,
    errors,
    formError,
    dirty,
    position,
    placedPosition: meta.placedPosition,
    positionSource: position ? meta.source : "saved",
    positionStale,
    focus,
    set,
    patch,
    setPosition,
    applyAddress,
    focusOn,
    reset,
    validate,
    applyApiError,
    focusField,
  };
}
