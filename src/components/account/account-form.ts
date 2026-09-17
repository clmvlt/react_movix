import {
  CITY_FIELD_MAX,
  POSTAL_CODE_MAX,
  SMTP_PORT_MAX,
  SMTP_PORT_MIN,
  TEXT_FIELD_MAX,
  type AccountDetail,
  type AccountUpdatePatch,
} from "@/features/account";
import { frTimeToTimeInput, timeInputToFrTime } from "@/lib/date";
import type { SettingsTab } from "./account-tabs";

const POSTAL_CODE_PATTERN = /^[A-Za-z0-9 -]*$/;
const PORT_PATTERN = /^\d+$/;

export type LogoDraft =
  | { kind: "keep" }
  | { kind: "replace"; dataUrl: string; name: string }
  | { kind: "delete" };

export interface AccountFormState {
  societe: string;
  address1: string;
  address2: string;
  postalCode: string;
  city: string;
  country: string;
  logo: LogoDraft;
  latitude: string;
  longitude: string;
  senderName: string;
  senderAddress: string;
  senderPostalCode: string;
  senderCity: string;
  senderCountry: string;
  autoSendAnomalieEmails: boolean;
  smtpEnable: boolean;
  smtpHost: string;
  smtpPort: string;
  smtpUsername: string;
  smtpPassword: string;
  smtpUseTls: boolean;
  smtpUseSsl: boolean;
  isScanCIP: boolean;
  defaultTourDepartureTime: string;
}

export interface AccountTabProps {
  form: AccountFormState;
  baseline: AccountDetail;
  errors: Record<string, string>;
  set: <K extends keyof AccountFormState>(
    key: K,
    value: AccountFormState[K]
  ) => void;
  disabled: boolean;
}

const COMPANY_TEXT_KEYS = [
  "societe",
  "address1",
  "address2",
  "postalCode",
  "city",
  "country",
] as const;

const SENDER_TEXT_KEYS = [
  "senderName",
  "senderAddress",
  "senderPostalCode",
  "senderCity",
  "senderCountry",
] as const;

const SMTP_TEXT_KEYS = ["smtpHost", "smtpUsername", "smtpPassword"] as const;

const TAB_FIELDS: Record<SettingsTab, (keyof AccountFormState)[]> = {
  company: [...COMPANY_TEXT_KEYS, "logo"],
  depot: ["latitude", "longitude"],
  labels: [...SENDER_TEXT_KEYS],
  labelLayout: [],
  emails: ["autoSendAnomalieEmails"],
  smtp: [
    "smtpEnable",
    "smtpHost",
    "smtpPort",
    "smtpUsername",
    "smtpPassword",
    "smtpUseTls",
    "smtpUseSsl",
  ],
  options: ["isScanCIP", "defaultTourDepartureTime"],
  tarifs: [],
  billing: [],
  colors: [],
};

function numberToInput(value: number | null | undefined): string {
  if (value == null) return "";
  return String(value);
}

export function formatCoordinate(value: number): string {
  return value.toFixed(6);
}

export function initialAccountForm(detail: AccountDetail): AccountFormState {
  return {
    societe: detail.societe ?? "",
    address1: detail.address1 ?? "",
    address2: detail.address2 ?? "",
    postalCode: detail.postalCode ?? "",
    city: detail.city ?? "",
    country: detail.country ?? "",
    logo: { kind: "keep" },
    latitude: numberToInput(detail.latitude),
    longitude: numberToInput(detail.longitude),
    senderName: detail.senderName ?? "",
    senderAddress: detail.senderAddress ?? "",
    senderPostalCode: detail.senderPostalCode ?? "",
    senderCity: detail.senderCity ?? "",
    senderCountry: detail.senderCountry ?? "",
    autoSendAnomalieEmails: detail.autoSendAnomalieEmails === true,
    smtpEnable: detail.smtpEnable === true,
    smtpHost: detail.smtpHost ?? "",
    smtpPort: numberToInput(detail.smtpPort),
    smtpUsername: detail.smtpUsername ?? "",
    smtpPassword: detail.smtpPassword ?? "",
    smtpUseTls: detail.smtpUseTls !== false,
    smtpUseSsl: detail.smtpUseSsl === true,
    isScanCIP: detail.isScanCIP === true,
    defaultTourDepartureTime:
      frTimeToTimeInput(detail.defaultTourDepartureTime) ?? "",
  };
}

export function resetAccountTab(
  form: AccountFormState,
  detail: AccountDetail,
  tab: SettingsTab
): AccountFormState {
  const pristine = initialAccountForm(detail);
  const next = { ...form };
  for (const field of TAB_FIELDS[tab]) {
    Object.assign(next, { [field]: pristine[field] });
  }
  return next;
}

export function isAccountTabDirty(
  form: AccountFormState,
  detail: AccountDetail,
  tab: SettingsTab
): boolean {
  const pristine = initialAccountForm(detail);
  return TAB_FIELDS[tab].some((field) => {
    if (field === "logo") return form.logo.kind !== "keep";
    const next = form[field];
    const previous = pristine[field];
    if (typeof next === "string" && typeof previous === "string") {
      return next.trim() !== previous.trim();
    }
    return next !== previous;
  });
}

export function buildCompanyPatch(
  form: AccountFormState,
  detail: AccountDetail
): AccountUpdatePatch {
  const patch: AccountUpdatePatch = {};
  for (const key of COMPANY_TEXT_KEYS) {
    const next = form[key].trim();
    if (next !== (detail[key] ?? "").trim()) patch[key] = next;
  }
  if (form.logo.kind === "delete") patch.logo = "";
  else if (form.logo.kind === "replace") patch.logo = form.logo.dataUrl;
  return patch;
}

export function buildDepotPatch(
  form: AccountFormState,
  detail: AccountDetail
): AccountUpdatePatch {
  const patch: AccountUpdatePatch = {};
  const fields = ["latitude", "longitude"] as const;
  for (const key of fields) {
    const raw = form[key].trim();
    const previous = detail[key] ?? null;
    if (!raw) {
      if (previous != null && previous !== 0) patch[key] = 0;
      continue;
    }
    const parsed = Number(raw.replace(",", "."));
    if (parsed !== previous) patch[key] = parsed;
  }
  return patch;
}

export function buildLabelsPatch(
  form: AccountFormState,
  detail: AccountDetail
): AccountUpdatePatch {
  const patch: AccountUpdatePatch = {};
  for (const key of SENDER_TEXT_KEYS) {
    const next = form[key].trim();
    if (next !== (detail[key] ?? "").trim()) patch[key] = next;
  }
  return patch;
}

export function buildEmailsPatch(
  form: AccountFormState,
  detail: AccountDetail
): AccountUpdatePatch {
  const patch: AccountUpdatePatch = {};
  if (form.autoSendAnomalieEmails !== (detail.autoSendAnomalieEmails === true)) {
    patch.autoSendAnomalieEmails = form.autoSendAnomalieEmails;
  }
  return patch;
}

export function buildSmtpPatch(
  form: AccountFormState,
  detail: AccountDetail
): AccountUpdatePatch {
  const patch: AccountUpdatePatch = {};
  for (const key of SMTP_TEXT_KEYS) {
    const next = form[key].trim();
    if (next !== (detail[key] ?? "").trim()) patch[key] = next;
  }
  const port = form.smtpPort.trim();
  const previousPort = detail.smtpPort ?? null;
  if (!port) {
    if (previousPort != null && previousPort !== 0) patch.smtpPort = 0;
  } else if (Number(port) !== previousPort) {
    patch.smtpPort = Number(port);
  }
  if (form.smtpEnable !== (detail.smtpEnable === true)) {
    patch.smtpEnable = form.smtpEnable;
  }
  if (form.smtpUseTls !== (detail.smtpUseTls !== false)) {
    patch.smtpUseTls = form.smtpUseTls;
  }
  if (form.smtpUseSsl !== (detail.smtpUseSsl === true)) {
    patch.smtpUseSsl = form.smtpUseSsl;
  }
  return patch;
}

export function buildOptionsPatch(
  form: AccountFormState,
  detail: AccountDetail
): AccountUpdatePatch {
  const patch: AccountUpdatePatch = {};
  if (form.isScanCIP !== (detail.isScanCIP === true)) {
    patch.isScanCIP = form.isScanCIP;
  }
  const nextDeparture = timeInputToFrTime(form.defaultTourDepartureTime.trim());
  const previousDeparture = frTimeToTimeInput(detail.defaultTourDepartureTime);
  if (
    nextDeparture &&
    form.defaultTourDepartureTime.trim() !== (previousDeparture ?? "")
  ) {
    patch.defaultTourDepartureTime = nextDeparture;
  }
  return patch;
}

export function buildAccountTabPatch(
  form: AccountFormState,
  detail: AccountDetail,
  tab: SettingsTab
): AccountUpdatePatch {
  switch (tab) {
    case "company":
      return buildCompanyPatch(form, detail);
    case "depot":
      return buildDepotPatch(form, detail);
    case "labels":
      return buildLabelsPatch(form, detail);
    case "emails":
      return buildEmailsPatch(form, detail);
    case "smtp":
      return buildSmtpPatch(form, detail);
    case "options":
      return buildOptionsPatch(form, detail);
    default:
      return {};
  }
}

type Translate = (key: string, options?: Record<string, unknown>) => string;

function tooLong(
  errors: Record<string, string>,
  form: AccountFormState,
  key: keyof AccountFormState,
  max: number,
  t: Translate
) {
  const value = form[key];
  if (typeof value === "string" && value.trim().length > max) {
    errors[key] = t("account.form.errors.tooLong", { max });
  }
}

function validateCompany(form: AccountFormState, t: Translate) {
  const errors: Record<string, string> = {};
  if (!form.societe.trim()) {
    errors.societe = t("account.form.errors.societeRequired");
  }
  tooLong(errors, form, "societe", TEXT_FIELD_MAX, t);
  tooLong(errors, form, "address1", TEXT_FIELD_MAX, t);
  tooLong(errors, form, "address2", TEXT_FIELD_MAX, t);
  tooLong(errors, form, "city", CITY_FIELD_MAX, t);
  tooLong(errors, form, "country", CITY_FIELD_MAX, t);

  const postalCode = form.postalCode.trim();
  if (postalCode.length > POSTAL_CODE_MAX) {
    errors.postalCode = t("account.form.errors.tooLong", {
      max: POSTAL_CODE_MAX,
    });
  } else if (postalCode && !POSTAL_CODE_PATTERN.test(postalCode)) {
    errors.postalCode = t("account.form.errors.postalCode");
  }
  return errors;
}

function validateDepot(form: AccountFormState, t: Translate) {
  const errors: Record<string, string> = {};
  const latitude = form.latitude.trim();
  const longitude = form.longitude.trim();

  if (Boolean(latitude) !== Boolean(longitude)) {
    const key = latitude ? "longitude" : "latitude";
    errors[key] = t("account.form.errors.coordinatePair");
  }

  const bounds = [
    { key: "latitude" as const, limit: 90 },
    { key: "longitude" as const, limit: 180 },
  ];
  for (const { key, limit } of bounds) {
    const raw = form[key].trim();
    if (!raw || errors[key]) continue;
    const parsed = Number(raw.replace(",", "."));
    if (!Number.isFinite(parsed)) {
      errors[key] = t("account.form.errors.number");
    } else if (parsed < -limit || parsed > limit) {
      errors[key] = t(`account.form.errors.${key}`);
    }
  }

  if (
    !errors.latitude &&
    !errors.longitude &&
    latitude &&
    longitude &&
    Number(latitude.replace(",", ".")) === 0 &&
    Number(longitude.replace(",", ".")) === 0
  ) {
    errors.latitude = t("account.form.errors.nullIsland");
  }

  return errors;
}

function validateLabels(form: AccountFormState, t: Translate) {
  const errors: Record<string, string> = {};
  for (const key of SENDER_TEXT_KEYS) {
    tooLong(errors, form, key, TEXT_FIELD_MAX, t);
  }
  const filled = SENDER_TEXT_KEYS.some((key) => form[key].trim());
  if (filled) {
    for (const key of ["senderName", "senderAddress", "senderCity"] as const) {
      if (!form[key].trim() && !errors[key]) {
        errors[key] = t("account.form.errors.senderIncomplete");
      }
    }
  }
  return errors;
}

function validateSmtp(form: AccountFormState, t: Translate) {
  const errors: Record<string, string> = {};
  const port = form.smtpPort.trim();

  if (port && !PORT_PATTERN.test(port)) {
    errors.smtpPort = t("account.form.errors.number");
  } else if (
    port &&
    (Number(port) < SMTP_PORT_MIN || Number(port) > SMTP_PORT_MAX)
  ) {
    errors.smtpPort = t("account.form.errors.smtpPortRange", {
      min: SMTP_PORT_MIN,
      max: SMTP_PORT_MAX,
    });
  }

  if (form.smtpEnable) {
    if (!form.smtpHost.trim()) {
      errors.smtpHost = t("account.form.errors.smtpHostRequired");
    }
    if (!port && !errors.smtpPort) {
      errors.smtpPort = t("account.form.errors.smtpPortRequired");
    }
  }

  if (form.smtpUseTls && form.smtpUseSsl) {
    errors.smtpUseTls = t("account.form.errors.tlsSslExclusive");
  }

  tooLong(errors, form, "smtpHost", TEXT_FIELD_MAX, t);
  tooLong(errors, form, "smtpUsername", TEXT_FIELD_MAX, t);

  return errors;
}

function validateOptions(form: AccountFormState, t: Translate) {
  const errors: Record<string, string> = {};
  const departure = form.defaultTourDepartureTime.trim();
  if (!departure || timeInputToFrTime(departure) === null) {
    errors.defaultTourDepartureTime = t(
      "account.form.errors.departureTimeInvalid"
    );
  }
  return errors;
}

export function validateAccountTab(
  form: AccountFormState,
  tab: SettingsTab,
  t: Translate
): Record<string, string> {
  switch (tab) {
    case "company":
      return validateCompany(form, t);
    case "depot":
      return validateDepot(form, t);
    case "labels":
      return validateLabels(form, t);
    case "smtp":
      return validateSmtp(form, t);
    case "options":
      return validateOptions(form, t);
    default:
      return {};
  }
}

export function smtpPortHint(form: AccountFormState): string | null {
  const port = form.smtpPort.trim();
  if (!form.smtpEnable || !PORT_PATTERN.test(port)) return null;
  if (port === "465" && !form.smtpUseSsl) return "account.smtp.portHint465";
  if (port === "587" && !form.smtpUseTls) return "account.smtp.portHint587";
  return null;
}
