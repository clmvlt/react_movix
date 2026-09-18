import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/app/toast-context";
import { ApiError, apiErrorText } from "@/lib/api-error";
import {
  addressKey,
  addressResultPatch,
  formPosition,
  formatCoordinate,
} from "@/lib/address-form";
import {
  buildClientInput,
  clientFieldId,
  firstClientErrorKey,
  initialClientForm,
  isClientFormDirty,
  validateClientForm,
  type ClientBillingForm,
  type ClientFormState,
} from "./client-form";
import type { DeliveryWindowForm } from "@/components/delivery-window-fields";
import type { Client, ClientType } from "@/features/clients";
import type { AddressResult } from "@/features/ors";
import type { LngLat } from "@/components/map";

export type ClientFormMode = "edit" | "create";
export type ClientPositionSource = "saved" | "address" | "manual";

const ADDRESS_ZOOM = 17;

export interface ClientMapFocus {
  center: LngLat;
  zoom: number;
  token: number;
}

export interface ClientFormApi {
  mode: ClientFormMode;
  idPrefix: string;
  form: ClientFormState;
  snapshot: Client | null;
  errors: Record<string, string>;
  formError: string | null;
  dirty: boolean;
  position: LngLat | null;
  placedPosition: LngLat | null;
  positionSource: ClientPositionSource;
  positionStale: boolean;
  focus: ClientMapFocus | null;
  set: <K extends keyof ClientFormState>(
    key: K,
    value: ClientFormState[K]
  ) => void;
  patch: (partial: Partial<ClientFormState>) => void;
  setBilling: (field: keyof ClientBillingForm, value: string) => void;
  setWindow: <K extends keyof DeliveryWindowForm>(
    key: K,
    value: DeliveryWindowForm[K]
  ) => void;
  setPosition: (
    position: LngLat | null,
    source: ClientPositionSource,
    focusZoom?: number
  ) => void;
  applyAddress: (result: AddressResult) => void;
  focusOn: (center: LngLat, zoom: number) => void;
  validate: () => boolean;
  applyApiError: (error: unknown) => void;
  toInput: () => ReturnType<typeof buildClientInput>;
}

interface UseClientFormOptions {
  baseline: Client | null;
  mode: ClientFormMode;
  idPrefix: string;
  type?: ClientType;
}

interface PositionMeta {
  source: ClientPositionSource;
  addressAtPlacement: string;
  placedPosition: LngLat | null;
}

interface Draft {
  form: ClientFormState;
  meta: PositionMeta;
}

function initialDraft(baseline: Client | null, type: ClientType): Draft {
  const form = initialClientForm(baseline, type);
  return {
    form,
    meta: {
      source: "saved",
      addressAtPlacement: addressKey(form),
      placedPosition: formPosition(form),
    },
  };
}

export function useClientForm({
  baseline,
  mode,
  idPrefix,
  type = "GENERIC",
}: UseClientFormOptions): ClientFormApi {
  const { t } = useTranslation();
  const toast = useToast();

  const [snapshot] = useState<Client | null>(baseline);
  const [draft, setDraft] = useState<Draft>(() => initialDraft(baseline, type));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [focus, setFocus] = useState<ClientMapFocus | null>(null);
  const [pendingFocus, setPendingFocus] = useState<string | null>(null);

  const { form, meta } = draft;
  const position = formPosition(form);
  const dirty = isClientFormDirty(form, mode === "edit" ? snapshot : null);
  const positionStale =
    position !== null && addressKey(form) !== meta.addressAtPlacement;

  const clearErrors = (keys: string[]) => {
    setErrors((previous) => {
      if (!keys.some((key) => previous[key])) return previous;
      const next = { ...previous };
      for (const key of keys) delete next[key];
      return next;
    });
  };

  const set: ClientFormApi["set"] = (key, value) => {
    setDraft((previous) => ({
      ...previous,
      form: { ...previous.form, [key]: value },
    }));
    clearErrors([key as string]);
  };

  const patch: ClientFormApi["patch"] = (partial) => {
    setDraft((previous) => ({
      ...previous,
      form: { ...previous.form, ...partial },
    }));
    clearErrors(Object.keys(partial));
  };

  const setWindow: ClientFormApi["setWindow"] = (key, value) => {
    setDraft((previous) => ({
      ...previous,
      form: { ...previous.form, [key]: value },
    }));
    clearErrors([key]);
  };

  const setBilling: ClientFormApi["setBilling"] = (field, value) => {
    setDraft((previous) => ({
      ...previous,
      form: {
        ...previous.form,
        billingAddress: { ...previous.form.billingAddress, [field]: value },
      },
    }));
    clearErrors([`billingAddress.${field}`]);
  };

  const focusOn: ClientFormApi["focusOn"] = (center, zoom) => {
    setFocus((previous) => ({ center, zoom, token: (previous?.token ?? 0) + 1 }));
  };

  const setPosition: ClientFormApi["setPosition"] = (next, source, focusZoom) => {
    setDraft((previous) => {
      const updated = {
        ...previous.form,
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

  const applyAddress: ClientFormApi["applyAddress"] = (result) => {
    setDraft((previous) => {
      const updated = { ...previous.form, ...addressResultPatch(result) };
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

  const focusField = useCallback(
    (key: string) => {
      const element = document.getElementById(clientFieldId(idPrefix, key));
      if (!element) return;
      element.scrollIntoView({ block: "center", behavior: "smooth" });
      element.focus({ preventScroll: true });
    },
    [idPrefix]
  );

  useEffect(() => {
    if (!pendingFocus) return;
    focusField(pendingFocus);
    setPendingFocus(null);
  }, [pendingFocus, focusField]);

  const validate: ClientFormApi["validate"] = () => {
    const found = validateClientForm(form, t);
    setErrors(found);
    setFormError(null);
    const first = firstClientErrorKey(found);
    if (!first) return true;
    toast.error(t("clients.form.invalid"));
    setPendingFocus(first);
    return false;
  };

  const applyApiError: ClientFormApi["applyApiError"] = (error) => {
    if (error instanceof ApiError) {
      if (error.errorCode === "PHARMACY_CIP_ALREADY_USED") {
        const message = t("clients.errors.cipAlreadyUsed");
        setErrors({ cip: message });
        setFormError(null);
        toast.error(message);
        setPendingFocus("cip");
        return;
      }
      const fieldErrors = error.structuredFieldErrors;
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        setFormError(null);
        toast.error(t("clients.form.invalid"));
        const first = firstClientErrorKey(fieldErrors);
        if (first) setPendingFocus(first);
        return;
      }
      const text = apiErrorText(error);
      setFormError(text);
      toast.error(text ?? t("clients.errors.saveFailed"));
      return;
    }
    setFormError(null);
    toast.error(t("clients.errors.saveFailed"));
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
    setBilling,
    setWindow,
    setPosition,
    applyAddress,
    focusOn,
    validate,
    applyApiError,
    toInput: () => buildClientInput(form),
  };
}
