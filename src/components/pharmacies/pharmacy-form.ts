import { PHARMACY_TEXT_MAX } from "@/features/pharmacies";
import type { Pharmacy, PharmacyFormInput } from "@/features/pharmacies";
import type { AddressResult } from "@/features/ors";
import type { LngLat } from "@/components/map";
import { isValidTimeInput } from "@/lib/date";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface PharmacyFormState {
  cip: string;
  name: string;
  address1: string;
  address2: string;
  address3: string;
  postalCode: string;
  city: string;
  country: string;
  quality: string;
  firstName: string;
  lastName: string;
  phone: string;
  fax: string;
  email: string;
  latitude: string;
  longitude: string;
  informations: string;
  commentaire: string;
  color: string;
  numero: string;
  doubleCleTransporteur: boolean;
  doubleCleExpediteur: boolean;
  deliveryWindowEnabled: boolean;
  deliveryWindowStart: string;
  deliveryWindowEnd: string;
  zoneId: string | null;
}

const WINDOW_KEYS = ["deliveryWindowStart", "deliveryWindowEnd"] as const;

function windowValue(
  form: PharmacyFormState,
  key: (typeof WINDOW_KEYS)[number]
): string | null {
  if (!form.deliveryWindowEnabled) return null;
  return form[key].trim() || null;
}

type TextKey = Extract<
  keyof PharmacyFormInput,
  | "name"
  | "address1"
  | "address2"
  | "address3"
  | "postalCode"
  | "city"
  | "country"
  | "quality"
  | "firstName"
  | "lastName"
  | "phone"
  | "fax"
  | "email"
  | "informations"
  | "commentaire"
  | "color"
  | "numero"
>;

const TEXT_KEYS: TextKey[] = [
  "name",
  "address1",
  "address2",
  "address3",
  "postalCode",
  "city",
  "country",
  "quality",
  "firstName",
  "lastName",
  "phone",
  "fax",
  "email",
  "informations",
  "commentaire",
  "color",
  "numero",
];

function numberToInput(value: number | null | undefined): string {
  if (value == null) return "";
  return String(value);
}

export function formatCoordinate(value: number): string {
  return value.toFixed(6);
}

export function parseCoordinateInput(value: string): number | null {
  const raw = value.trim().replace(",", ".");
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formPosition(
  form: Pick<PharmacyFormState, "latitude" | "longitude">
): LngLat | null {
  const latitude = parseCoordinateInput(form.latitude);
  const longitude = parseCoordinateInput(form.longitude);
  if (latitude == null || longitude == null) return null;
  if (latitude === 0 && longitude === 0) return null;
  return [longitude, latitude];
}

export function samePosition(a: LngLat | null, b: LngLat | null): boolean {
  if (a === null || b === null) return a === b;
  return a[0] === b[0] && a[1] === b[1];
}

export function pharmacyPosition(
  pharmacy: Pick<Pharmacy, "latitude" | "longitude"> | null | undefined
): LngLat | null {
  if (!pharmacy) return null;
  const { latitude, longitude } = pharmacy;
  if (latitude == null || longitude == null) return null;
  if (latitude === 0 && longitude === 0) return null;
  return [longitude, latitude];
}

export function addressResultPatch(
  result: AddressResult
): Pick<PharmacyFormState, "address1" | "postalCode" | "city" | "latitude" | "longitude"> {
  const street = [result.houseNumber, result.street]
    .map((part) => part?.trim() ?? "")
    .filter(Boolean)
    .join(" ");
  return {
    address1: street || result.label,
    postalCode: result.postcode?.trim() ?? "",
    city: result.city?.trim() ?? "",
    latitude: formatCoordinate(result.lat),
    longitude: formatCoordinate(result.lon),
  };
}

export function addressSummary(
  form: Pick<PharmacyFormState, "address1" | "postalCode" | "city">
): string {
  return [form.address1, form.postalCode, form.city]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
}

export function addressKey(
  form: Pick<PharmacyFormState, "address1" | "postalCode" | "city">
): string {
  return addressSummary(form).replace(/\s+/g, " ").toLowerCase();
}

export const PHARMACY_FIELD_ORDER = [
  "cip",
  "name",
  "zoneId",
  "address1",
  "address2",
  "address3",
  "postalCode",
  "city",
  "country",
  "latitude",
  "longitude",
  "deliveryWindowStart",
  "deliveryWindowEnd",
  "numero",
  "color",
  "doubleCleTransporteur",
  "doubleCleExpediteur",
  "informations",
  "quality",
  "firstName",
  "lastName",
  "phone",
  "fax",
  "email",
  "commentaire",
] as const;

const FIELD_ELEMENT_IDS: Partial<Record<string, string>> = {
  zoneId: "zone",
  postalCode: "postal-code",
  firstName: "first-name",
  lastName: "last-name",
  doubleCleTransporteur: "double-carrier",
  doubleCleExpediteur: "double-sender",
};

export function pharmacyFieldId(idPrefix: string, key: string): string {
  return `${idPrefix}-${FIELD_ELEMENT_IDS[key] ?? key}`;
}

export function firstErrorKey(errors: Record<string, string>): string | null {
  for (const key of PHARMACY_FIELD_ORDER) {
    if (errors[key]) return key;
  }
  return null;
}

export function isPharmacyFormDirty(
  form: PharmacyFormState,
  baseline: Pharmacy
): boolean {
  return Object.keys(buildUpdatePayload(form, baseline)).length > 0;
}

export function isFormEqual(a: PharmacyFormState, b: PharmacyFormState): boolean {
  return (Object.keys(a) as (keyof PharmacyFormState)[]).every(
    (key) => a[key] === b[key]
  );
}

export function initialFormState(pharmacy: Pharmacy | null): PharmacyFormState {
  return {
    cip: pharmacy?.cip ?? "",
    name: pharmacy?.name ?? "",
    address1: pharmacy?.address1 ?? "",
    address2: pharmacy?.address2 ?? "",
    address3: pharmacy?.address3 ?? "",
    postalCode: pharmacy?.postalCode ?? "",
    city: pharmacy?.city ?? "",
    country: pharmacy?.country ?? "",
    quality: pharmacy?.quality ?? "",
    firstName: pharmacy?.firstName ?? "",
    lastName: pharmacy?.lastName ?? "",
    phone: pharmacy?.phone ?? "",
    fax: pharmacy?.fax ?? "",
    email: pharmacy?.email ?? "",
    latitude: numberToInput(pharmacy?.latitude),
    longitude: numberToInput(pharmacy?.longitude),
    informations: pharmacy?.informations ?? "",
    commentaire: pharmacy?.commentaire ?? "",
    color: pharmacy?.color ?? "",
    numero: pharmacy?.numero ?? "",
    doubleCleTransporteur: pharmacy?.doubleCleTransporteur === true,
    doubleCleExpediteur: pharmacy?.doubleCleExpediteur === true,
    deliveryWindowEnabled:
      Boolean(pharmacy?.deliveryWindowStart) ||
      Boolean(pharmacy?.deliveryWindowEnd),
    deliveryWindowStart: pharmacy?.deliveryWindowStart ?? "",
    deliveryWindowEnd: pharmacy?.deliveryWindowEnd ?? "",
    zoneId: pharmacy?.zone?.id ?? null,
  };
}

export function buildCreatePayload(form: PharmacyFormState): PharmacyFormInput {
  const payload: PharmacyFormInput = {};
  for (const key of TEXT_KEYS) {
    const value = form[key].trim();
    if (value) payload[key] = value;
  }
  const latitude = parseCoordinateInput(form.latitude);
  const longitude = parseCoordinateInput(form.longitude);
  if (latitude != null) payload.latitude = latitude;
  if (longitude != null) payload.longitude = longitude;
  payload.doubleCleTransporteur = form.doubleCleTransporteur;
  payload.doubleCleExpediteur = form.doubleCleExpediteur;
  for (const key of WINDOW_KEYS) {
    const value = windowValue(form, key);
    if (value) payload[key] = value;
  }
  if (form.zoneId) payload.zoneId = form.zoneId;
  return payload;
}

export function buildUpdatePayload(
  form: PharmacyFormState,
  baseline: Pharmacy
): PharmacyFormInput {
  const payload: PharmacyFormInput = {};

  for (const key of TEXT_KEYS) {
    const next = form[key].trim();
    const previous = (baseline[key] ?? "").trim();
    if (next === previous) continue;
    payload[key] = next;
  }

  const numberFields = ["latitude", "longitude"] as const;
  for (const key of numberFields) {
    const parsed = parseCoordinateInput(form[key]);
    const previous = baseline[key] ?? null;
    if (parsed == null) {
      if (previous != null && previous !== 0) payload[key] = 0;
      continue;
    }
    if (parsed !== previous) payload[key] = parsed;
  }

  if (form.doubleCleTransporteur !== (baseline.doubleCleTransporteur === true)) {
    payload.doubleCleTransporteur = form.doubleCleTransporteur;
  }
  if (form.doubleCleExpediteur !== (baseline.doubleCleExpediteur === true)) {
    payload.doubleCleExpediteur = form.doubleCleExpediteur;
  }

  for (const key of WINDOW_KEYS) {
    const next = windowValue(form, key);
    const previous = baseline[key] ?? null;
    if (next !== previous) payload[key] = next;
  }

  const previousZone = (baseline.zone?.id ?? "").toLowerCase();
  const nextZone = (form.zoneId ?? "").toLowerCase();
  if (previousZone !== nextZone) {
    payload.zoneId = form.zoneId;
  }

  return payload;
}

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function validatePharmacyForm(
  form: PharmacyFormState,
  requireCip: boolean,
  t: Translate,
  only?: readonly string[]
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (requireCip && !form.cip.trim()) {
    errors.cip = t("pharmacies.form.errors.cipRequired");
  }

  if (!form.name.trim()) {
    errors.name = t("pharmacies.form.errors.nameRequired");
  }

  const email = form.email.trim();
  if (email && !EMAIL_PATTERN.test(email)) {
    errors.email = t("pharmacies.form.errors.email");
  }

  for (const key of ["informations", "commentaire"] as const) {
    if (form[key].length > PHARMACY_TEXT_MAX) {
      errors[key] = t("pharmacies.form.errors.tooLong", {
        max: PHARMACY_TEXT_MAX,
      });
    }
  }

  if (form.deliveryWindowEnabled) {
    for (const key of WINDOW_KEYS) {
      const raw = form[key].trim();
      if (raw && !isValidTimeInput(raw)) {
        errors[key] = t("pharmacies.form.errors.time");
      }
    }
  }

  const bounds = [
    { key: "latitude" as const, limit: 90 },
    { key: "longitude" as const, limit: 180 },
  ];
  for (const { key, limit } of bounds) {
    const raw = form[key].trim();
    if (!raw) continue;
    const parsed = parseCoordinateInput(raw);
    if (parsed == null) {
      errors[key] = t("pharmacies.form.errors.number");
    } else if (parsed < -limit || parsed > limit) {
      errors[key] = t(`pharmacies.form.errors.${key}`);
    }
  }
  const hasLatitude = form.latitude.trim() !== "";
  const hasLongitude = form.longitude.trim() !== "";
  if (hasLatitude !== hasLongitude) {
    const missing = hasLatitude ? "longitude" : "latitude";
    errors[missing] = t("pharmacies.form.errors.number");
  }

  if (only) {
    for (const key of Object.keys(errors)) {
      if (!only.includes(key)) delete errors[key];
    }
  }

  return errors;
}
