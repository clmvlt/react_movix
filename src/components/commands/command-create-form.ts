import { isValidApiDate, isValidTimeInput, localOffsetIso } from "@/lib/date";
import type {
  CommandCreateInput,
  CommandCreatePackageInput,
} from "@/features/commands";

export const PACKAGE_NUMBER_FIELDS = [
  "quantity",
  "weight",
  "volume",
  "length",
  "width",
  "height",
] as const;

export type PackageNumberField = (typeof PACKAGE_NUMBER_FIELDS)[number];

export interface PackageFormState {
  key: string;
  id: string;
  type: string;
  designation: string;
  num: string;
  quantity: string;
  weight: string;
  volume: string;
  length: string;
  width: string;
  height: string;
  fresh: boolean;
}

export type PackageErrors = Partial<Record<PackageNumberField | "id", string>>;

export interface CommandCreateFormState {
  expDate: string;
  expTime: string;
  numTransport: string;
  packages: PackageFormState[];
  allowNoPackages: boolean;
}

export interface CommandCreateFormErrors {
  cip?: string;
  expDate?: string;
  expTime?: string;
  numTransport?: string;
  packages: Record<string, PackageErrors>;
  global?: string;
}

type Translate = (key: string, options?: Record<string, unknown>) => string;

let packageCounter = 0;

export function emptyPackage(): PackageFormState {
  packageCounter += 1;
  return {
    key: `package-${packageCounter}`,
    id: "",
    type: "",
    designation: "",
    num: "",
    quantity: "1",
    weight: "",
    volume: "",
    length: "",
    width: "",
    height: "",
    fresh: false,
  };
}

export function initialCreateForm(expDate: string): CommandCreateFormState {
  return {
    expDate,
    expTime: "08:00",
    numTransport: "",
    packages: [emptyPackage()],
    allowNoPackages: false,
  };
}

function numberValue(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export interface PackageTotals {
  count: number;
  quantity: number;
  weight: number;
  volume: number;
}

export function packageTotals(packages: PackageFormState[]): PackageTotals {
  const totals: PackageTotals = {
    count: packages.length,
    quantity: 0,
    weight: 0,
    volume: 0,
  };
  for (const item of packages) {
    for (const field of ["quantity", "weight", "volume"] as const) {
      const value = numberValue(item[field]);
      if (value != null && Number.isFinite(value) && value > 0) {
        totals[field] += value;
      }
    }
  }
  return totals;
}

export function hasErrors(errors: CommandCreateFormErrors): boolean {
  if (
    errors.cip ||
    errors.expDate ||
    errors.expTime ||
    errors.numTransport ||
    errors.global
  ) {
    return true;
  }
  return Object.values(errors.packages).some((entry) =>
    Object.values(entry).some(Boolean)
  );
}

export function validateCreateForm(
  form: CommandCreateFormState,
  cip: string,
  t: Translate
): CommandCreateFormErrors {
  const errors: CommandCreateFormErrors = { packages: {} };

  if (!cip.trim()) errors.cip = t("commands.create.errors.pharmacyRequired");

  if (!form.expDate.trim()) {
    errors.expDate = t("commands.create.errors.required");
  } else if (!isValidApiDate(form.expDate)) {
    errors.expDate = t("commands.create.errors.invalidDate");
  }

  if (!isValidTimeInput(form.expTime)) {
    errors.expTime = t("commands.create.errors.invalidTime");
  }

  if (!form.numTransport.trim()) {
    errors.numTransport = t("commands.create.errors.required");
  }

  for (const item of form.packages) {
    const packageErrors: PackageErrors = {};
    for (const field of PACKAGE_NUMBER_FIELDS) {
      const value = numberValue(item[field]);
      if (value == null) continue;
      if (Number.isNaN(value)) {
        packageErrors[field] = t("commands.create.errors.number");
      } else if (value <= 0) {
        packageErrors[field] = t("commands.create.errors.positive");
      } else if (field === "quantity" && !Number.isInteger(value)) {
        packageErrors[field] = t("commands.create.errors.integer");
      }
    }
    if (Object.keys(packageErrors).length > 0) {
      errors.packages[item.key] = packageErrors;
    }
  }

  if (form.packages.length === 0 && !form.allowNoPackages) {
    errors.global = t("commands.create.errors.noPackages");
  }

  return errors;
}

function buildPackage(item: PackageFormState): CommandCreatePackageInput {
  const payload: CommandCreatePackageInput = {};

  for (const field of ["id", "type", "designation", "num"] as const) {
    const value = item[field].trim();
    if (value) payload[field] = value;
  }

  for (const field of PACKAGE_NUMBER_FIELDS) {
    const value = numberValue(item[field]);
    if (value != null && Number.isFinite(value) && value > 0) {
      payload[field] = value;
    }
  }

  if (item.fresh) payload.fresh = true;

  return payload;
}

export function buildCreateInput(
  form: CommandCreateFormState,
  cip: string
): CommandCreateInput {
  return {
    expedition_date: localOffsetIso(form.expDate, form.expTime),
    cip: cip.trim(),
    command: {
      num_transport: form.numTransport.trim(),
      packages: form.packages.map(buildPackage),
    },
  };
}

const SERVER_MESSAGES: Record<string, string> = {
  "is required": "commands.create.errors.required",
  "must be a positive number": "commands.create.errors.positive",
  "must be a number": "commands.create.errors.number",
};

function translateServerMessage(message: string, t: Translate): string {
  const key = SERVER_MESSAGES[message.trim().toLowerCase()];
  return key ? t(key) : message;
}

const PACKAGE_FIELD_PATTERN = /^command\.packages\[(\d+)\]\.(\w+)$/;

export interface ServerErrorMapping {
  errors: CommandCreateFormErrors;
  unmatched: string[];
  matched: number;
}

export function mapServerErrors(
  fieldErrors: Record<string, string>,
  packages: PackageFormState[],
  t: Translate
): ServerErrorMapping {
  const errors: CommandCreateFormErrors = { packages: {} };
  const unmatched: string[] = [];
  let matched = 0;

  for (const [field, rawMessage] of Object.entries(fieldErrors)) {
    const message = translateServerMessage(rawMessage, t);
    const packageMatch = PACKAGE_FIELD_PATTERN.exec(field);

    if (packageMatch) {
      const item = packages[Number(packageMatch[1])];
      const name = packageMatch[2] as PackageNumberField | "id";
      if (item) {
        errors.packages[item.key] = {
          ...errors.packages[item.key],
          [name]: message,
        };
        matched += 1;
        continue;
      }
    }

    if (field === "cip") {
      errors.cip = message;
      matched += 1;
    } else if (field === "expedition_date") {
      errors.expDate = message;
      matched += 1;
    } else if (field === "command.num_transport") {
      errors.numTransport = message;
      matched += 1;
    } else {
      unmatched.push(`${field} ${rawMessage}`);
    }
  }

  return { errors, unmatched, matched };
}
