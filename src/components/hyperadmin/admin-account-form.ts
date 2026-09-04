import { frTimeToTimeInput, timeInputToFrTime } from "@/lib/date";
import {
  CITY_FIELD_MAX,
  POSTAL_CODE_MAX,
  SMTP_PORT_MAX,
  SMTP_PORT_MIN,
  TEXT_FIELD_MAX,
} from "@/features/account";
import type {
  AdminAccount,
  AdminAccountCreateInput,
  AdminAccountUpdateInput,
} from "@/features/admin-accounts";
import type { LogoDraft } from "@/components/account/account-form";

const POSTAL_CODE_PATTERN = /^[A-Za-z0-9 -]*$/;
const INTEGER_PATTERN = /^\d+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ANOMALIES_EMAILS_MAX = 1000;
const DEFAULT_DEPARTURE_TIME = "21:00";

export type AdminAccountFormErrors = Record<string, string>;

export interface AdminAccountFormState {
  societe: string;
  logo: LogoDraft;
  address1: string;
  address2: string;
  postalCode: string;
  city: string;
  country: string;
  latitude: string;
  longitude: string;
  maxProfilesUnlimited: boolean;
  maxProfiles: string;
  smtpEnable: boolean;
  smtpHost: string;
  smtpPort: string;
  smtpUsername: string;
  smtpPassword: string;
  smtpUseTls: boolean;
  smtpUseSsl: boolean;
  senderName: string;
  senderAddress: string;
  senderPostalCode: string;
  senderCity: string;
  senderCountry: string;
  isLabelLandscape: boolean;
  isScanCIP: boolean;
  autoSendAnomalieEmails: boolean;
  anomaliesEmails: string;
  defaultTourDepartureTime: string;
}

const TEXT_KEYS = [
  "societe",
  "address1",
  "address2",
  "postalCode",
  "city",
  "country",
  "senderName",
  "senderAddress",
  "senderPostalCode",
  "senderCity",
  "senderCountry",
  "smtpHost",
  "smtpUsername",
] as const;

type TextKey = (typeof TEXT_KEYS)[number];

const BOOLEAN_KEYS = [
  "smtpEnable",
  "smtpUseTls",
  "smtpUseSsl",
  "isScanCIP",
  "autoSendAnomalieEmails",
  "isLabelLandscape",
] as const;

function numberToInput(value: number | null | undefined): string {
  return value == null ? "" : String(value);
}

function parseDecimal(value: string): number {
  return Number(value.trim().replace(",", "."));
}

export function emptyAdminAccountForm(): AdminAccountFormState {
  return {
    societe: "",
    logo: { kind: "keep" },
    address1: "",
    address2: "",
    postalCode: "",
    city: "",
    country: "",
    latitude: "",
    longitude: "",
    maxProfilesUnlimited: true,
    maxProfiles: "",
    smtpEnable: false,
    smtpHost: "",
    smtpPort: "",
    smtpUsername: "",
    smtpPassword: "",
    smtpUseTls: false,
    smtpUseSsl: false,
    senderName: "",
    senderAddress: "",
    senderPostalCode: "",
    senderCity: "",
    senderCountry: "",
    isLabelLandscape: false,
    isScanCIP: false,
    autoSendAnomalieEmails: false,
    anomaliesEmails: "",
    defaultTourDepartureTime: DEFAULT_DEPARTURE_TIME,
  };
}

export function initialAdminAccountForm(
  account: AdminAccount
): AdminAccountFormState {
  const max = account.maxProfiles ?? 0;
  return {
    societe: account.societe ?? "",
    logo: { kind: "keep" },
    address1: account.address1 ?? "",
    address2: account.address2 ?? "",
    postalCode: account.postalCode ?? "",
    city: account.city ?? "",
    country: account.country ?? "",
    latitude: numberToInput(account.latitude),
    longitude: numberToInput(account.longitude),
    maxProfilesUnlimited: max <= 0,
    maxProfiles: max > 0 ? String(max) : "",
    smtpEnable: account.smtpEnable === true,
    smtpHost: account.smtpHost ?? "",
    smtpPort: numberToInput(account.smtpPort),
    smtpUsername: account.smtpUsername ?? "",
    smtpPassword: account.smtpPassword ?? "",
    smtpUseTls: account.smtpUseTls === true,
    smtpUseSsl: account.smtpUseSsl === true,
    senderName: account.senderName ?? "",
    senderAddress: account.senderAddress ?? "",
    senderPostalCode: account.senderPostalCode ?? "",
    senderCity: account.senderCity ?? "",
    senderCountry: account.senderCountry ?? "",
    isLabelLandscape: account.isLabelLandscape === true,
    isScanCIP: account.isScanCIP === true,
    autoSendAnomalieEmails: account.autoSendAnomalieEmails === true,
    anomaliesEmails: account.anomaliesEmails ?? "",
    defaultTourDepartureTime:
      frTimeToTimeInput(account.defaultTourDepartureTime) ?? "",
  };
}

function formMaxProfiles(form: AdminAccountFormState): number | null {
  if (form.maxProfilesUnlimited) return 0;
  const raw = form.maxProfiles.trim();
  if (!INTEGER_PATTERN.test(raw)) return null;
  return Number(raw);
}

export function normalizeAnomaliesEmails(value: string): string {
  return value
    .split(/[,;\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .join(",");
}

export function buildAdminAccountCreate(
  form: AdminAccountFormState
): AdminAccountCreateInput {
  const input: AdminAccountCreateInput = {
    societe: form.societe.trim(),
    address1: form.address1.trim(),
  };

  for (const key of TEXT_KEYS) {
    if (key === "societe" || key === "address1") continue;
    const value = form[key].trim();
    if (value) input[key] = value;
  }

  const password = form.smtpPassword.trim();
  if (password) input.smtpPassword = password;

  const latitude = form.latitude.trim();
  const longitude = form.longitude.trim();
  if (latitude && longitude) {
    input.latitude = parseDecimal(latitude);
    input.longitude = parseDecimal(longitude);
  }

  const port = form.smtpPort.trim();
  if (port) input.smtpPort = Number(port);

  const maxProfiles = formMaxProfiles(form);
  if (maxProfiles != null) input.maxProfiles = maxProfiles;

  for (const key of BOOLEAN_KEYS) {
    if (form[key]) input[key] = true;
  }

  const emails = normalizeAnomaliesEmails(form.anomaliesEmails);
  if (emails) input.anomaliesEmails = emails;

  const departure = timeInputToFrTime(form.defaultTourDepartureTime.trim());
  if (departure) input.defaultTourDepartureTime = departure;

  return input;
}

export function buildAdminAccountUpdate(
  form: AdminAccountFormState,
  baseline: AdminAccount
): AdminAccountUpdateInput {
  const input: AdminAccountUpdateInput = {
    anomaliesEmails: normalizeAnomaliesEmails(form.anomaliesEmails) || null,
  };

  for (const key of TEXT_KEYS) {
    const next = form[key].trim();
    if (next !== (baseline[key] ?? "").trim()) input[key] = next;
  }

  if (form.smtpPassword !== (baseline.smtpPassword ?? "")) {
    input.smtpPassword = form.smtpPassword;
  }

  for (const key of ["latitude", "longitude"] as const) {
    const raw = form[key].trim();
    const previous = baseline[key] ?? null;
    if (!raw) {
      if (previous != null && previous !== 0) input[key] = 0;
      continue;
    }
    const parsed = parseDecimal(raw);
    if (parsed !== previous) input[key] = parsed;
  }

  const port = form.smtpPort.trim();
  const previousPort = baseline.smtpPort ?? null;
  if (!port) {
    if (previousPort != null && previousPort !== 0) input.smtpPort = 0;
  } else if (Number(port) !== previousPort) {
    input.smtpPort = Number(port);
  }

  const maxProfiles = formMaxProfiles(form);
  if (maxProfiles != null && maxProfiles !== (baseline.maxProfiles ?? 0)) {
    input.maxProfiles = maxProfiles;
  }

  for (const key of BOOLEAN_KEYS) {
    if (form[key] !== (baseline[key] === true)) input[key] = form[key];
  }

  const departure = timeInputToFrTime(form.defaultTourDepartureTime.trim());
  const previousDeparture = frTimeToTimeInput(baseline.defaultTourDepartureTime);
  if (departure && form.defaultTourDepartureTime.trim() !== previousDeparture) {
    input.defaultTourDepartureTime = departure;
  }

  if (form.logo.kind === "delete") input.logo = "";
  else if (form.logo.kind === "replace") input.logo = form.logo.dataUrl;

  return input;
}

export function isAdminAccountDirty(
  form: AdminAccountFormState,
  baseline: AdminAccount
): boolean {
  const payload = buildAdminAccountUpdate(form, baseline);
  const changed = Object.keys(payload).filter(
    (key) => key !== "anomaliesEmails"
  );
  if (changed.length > 0) return true;
  return (
    (payload.anomaliesEmails ?? "") !==
    normalizeAnomaliesEmails(baseline.anomaliesEmails ?? "")
  );
}

type Translate = (key: string, options?: Record<string, unknown>) => string;

function tooLong(
  errors: AdminAccountFormErrors,
  form: AdminAccountFormState,
  key: TextKey,
  max: number,
  t: Translate
): void {
  if (form[key].trim().length > max) {
    errors[key] = t("account.form.errors.tooLong", { max });
  }
}

export function validateAdminAccount(
  form: AdminAccountFormState,
  mode: "create" | "edit",
  t: Translate
): AdminAccountFormErrors {
  const errors: AdminAccountFormErrors = {};

  if (!form.societe.trim()) {
    errors.societe = t("account.form.errors.societeRequired");
  }
  if (mode === "create" && !form.address1.trim()) {
    errors.address1 = t("hyperadmin.companies.errors.address1Required");
  }

  tooLong(errors, form, "societe", TEXT_FIELD_MAX, t);
  tooLong(errors, form, "address1", TEXT_FIELD_MAX, t);
  tooLong(errors, form, "address2", TEXT_FIELD_MAX, t);
  tooLong(errors, form, "city", CITY_FIELD_MAX, t);
  tooLong(errors, form, "country", CITY_FIELD_MAX, t);
  tooLong(errors, form, "senderName", TEXT_FIELD_MAX, t);
  tooLong(errors, form, "senderAddress", TEXT_FIELD_MAX, t);
  tooLong(errors, form, "senderCity", CITY_FIELD_MAX, t);
  tooLong(errors, form, "senderCountry", CITY_FIELD_MAX, t);
  tooLong(errors, form, "smtpHost", TEXT_FIELD_MAX, t);
  tooLong(errors, form, "smtpUsername", TEXT_FIELD_MAX, t);

  for (const key of ["postalCode", "senderPostalCode"] as const) {
    const value = form[key].trim();
    if (value.length > POSTAL_CODE_MAX) {
      errors[key] = t("account.form.errors.tooLong", { max: POSTAL_CODE_MAX });
    } else if (value && !POSTAL_CODE_PATTERN.test(value)) {
      errors[key] = t("account.form.errors.postalCode");
    }
  }

  const latitude = form.latitude.trim();
  const longitude = form.longitude.trim();
  if (Boolean(latitude) !== Boolean(longitude)) {
    errors[latitude ? "longitude" : "latitude"] = t(
      "account.form.errors.coordinatePair"
    );
  }
  for (const { key, limit } of [
    { key: "latitude" as const, limit: 90 },
    { key: "longitude" as const, limit: 180 },
  ]) {
    const raw = form[key].trim();
    if (!raw || errors[key]) continue;
    const parsed = parseDecimal(raw);
    if (!Number.isFinite(parsed)) {
      errors[key] = t("account.form.errors.number");
    } else if (parsed < -limit || parsed > limit) {
      errors[key] = t(`account.form.errors.${key}`);
    }
  }

  if (!form.maxProfilesUnlimited) {
    const raw = form.maxProfiles.trim();
    if (!INTEGER_PATTERN.test(raw)) {
      errors.maxProfiles = t("account.form.errors.number");
    } else if (Number(raw) < 1) {
      errors.maxProfiles = t("hyperadmin.companies.errors.maxProfilesMin");
    }
  }

  const port = form.smtpPort.trim();
  if (port && !INTEGER_PATTERN.test(port)) {
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

  const emails = normalizeAnomaliesEmails(form.anomaliesEmails);
  if (emails.length > ANOMALIES_EMAILS_MAX) {
    errors.anomaliesEmails = t("account.form.errors.tooLong", {
      max: ANOMALIES_EMAILS_MAX,
    });
  } else if (
    emails &&
    !emails.split(",").every((entry) => EMAIL_PATTERN.test(entry))
  ) {
    errors.anomaliesEmails = t("hyperadmin.companies.errors.anomaliesEmails");
  }

  const departure = form.defaultTourDepartureTime.trim();
  if (departure && timeInputToFrTime(departure) === null) {
    errors.defaultTourDepartureTime = t(
      "account.form.errors.departureTimeInvalid"
    );
  } else if (mode === "create" && !departure) {
    errors.defaultTourDepartureTime = t(
      "account.form.errors.departureTimeInvalid"
    );
  }

  return errors;
}

const FIELD_ALIASES: Record<string, string> = {
  postal_code: "postalCode",
  postalcode: "postalCode",
  sender_postal_code: "senderPostalCode",
  max_profiles: "maxProfiles",
  anomalies_emails: "anomaliesEmails",
  default_tour_departure_time: "defaultTourDepartureTime",
  smtp_host: "smtpHost",
  smtp_port: "smtpPort",
};

export function adminAccountFieldErrors(
  fieldErrors: Record<string, string>
): AdminAccountFormErrors {
  const errors: AdminAccountFormErrors = {};
  for (const [key, message] of Object.entries(fieldErrors)) {
    errors[FIELD_ALIASES[key] ?? key] = message;
  }
  return errors;
}
