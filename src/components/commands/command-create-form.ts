import { isValidApiDate, isValidTimeInput, localOffsetIso } from "@/lib/date";
import { parseCoordinateInput } from "@/lib/address-form";
import type { Client } from "@/features/clients";
import type {
  CommandCreateInput,
  CommandCreatePackageInput,
  CommandPartyInput,
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

export const PARTY_TEXT_FIELDS = [
  "name",
  "firstName",
  "lastName",
  "address1",
  "address2",
  "address3",
  "postalCode",
  "city",
  "country",
  "phone",
  "email",
] as const;

export type PartyTextField = (typeof PARTY_TEXT_FIELDS)[number];

export type PartyFreeState = Record<
  PartyTextField | "latitude" | "longitude",
  string
>;

export type PartyMode = "linked" | "free";

export type PartyRole = "sender" | "recipient";

export interface PartyFormState {
  mode: PartyMode;
  client: Client | null;
  free: PartyFreeState;
}

export interface CommandCreateFormState {
  expDate: string;
  expTime: string;
  numTransport: string;
  orderer: Client | null;
  sender: PartyFormState;
  recipient: PartyFormState;
  packages: PackageFormState[];
  allowNoPackages: boolean;
}

export interface CommandCreateFormErrors {
  orderer?: string;
  sender?: string;
  recipient?: string;
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

export function emptyPartyFree(): PartyFreeState {
  return {
    name: "",
    firstName: "",
    lastName: "",
    address1: "",
    address2: "",
    address3: "",
    postalCode: "",
    city: "",
    country: "",
    phone: "",
    email: "",
    latitude: "",
    longitude: "",
  };
}

export function emptyParty(): PartyFormState {
  return { mode: "linked", client: null, free: emptyPartyFree() };
}

export function isPartyFilled(party: PartyFormState): boolean {
  if (party.mode === "linked") return party.client !== null;
  return Object.values(party.free).some((value) => value.trim() !== "");
}

export function initialCreateForm(expDate: string): CommandCreateFormState {
  return {
    expDate,
    expTime: "08:00",
    numTransport: "",
    orderer: null,
    sender: emptyParty(),
    recipient: emptyParty(),
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
    errors.orderer ||
    errors.sender ||
    errors.recipient ||
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

function validateParty(
  party: PartyFormState,
  required: boolean,
  t: Translate
): string | undefined {
  if (party.mode === "linked") {
    if (!party.client && required) {
      return t("commands.create.errors.clientRequired");
    }
    return undefined;
  }
  if (!isPartyFilled(party)) {
    return required ? t("commands.create.errors.partyRequired") : undefined;
  }
  if (!party.free.name.trim()) {
    return t("commands.create.errors.partyName");
  }
  return undefined;
}

export function validateCreateForm(
  form: CommandCreateFormState,
  t: Translate
): CommandCreateFormErrors {
  const errors: CommandCreateFormErrors = { packages: {} };

  if (!form.orderer) {
    errors.orderer = t("commands.create.errors.ordererRequired");
  }

  const sender = validateParty(form.sender, false, t);
  if (sender) errors.sender = sender;

  const recipient = validateParty(form.recipient, true, t);
  if (recipient) errors.recipient = recipient;

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

export function buildPartyInput(
  party: PartyFormState
): CommandPartyInput | null {
  if (party.mode === "linked") {
    return party.client ? { clientId: party.client.id } : null;
  }
  if (!isPartyFilled(party)) return null;

  const payload: CommandPartyInput = {};
  for (const field of PARTY_TEXT_FIELDS) {
    const value = party.free[field].trim();
    if (value) payload[field] = value;
  }

  const latitude = parseCoordinateInput(party.free.latitude);
  const longitude = parseCoordinateInput(party.free.longitude);
  if (latitude != null && longitude != null) {
    payload.latitude = latitude;
    payload.longitude = longitude;
  }

  return payload;
}

export function buildCreateInput(
  form: CommandCreateFormState
): CommandCreateInput {
  const input: CommandCreateInput = {
    expedition_date: localOffsetIso(form.expDate, form.expTime),
    ordererId: form.orderer?.id ?? "",
    command: {
      num_transport: form.numTransport.trim(),
      packages: form.packages.map(buildPackage),
    },
  };

  const sender = buildPartyInput(form.sender);
  if (sender) input.sender = sender;

  const recipient = buildPartyInput(form.recipient);
  if (recipient) input.recipient = recipient;

  return input;
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

    if (field === "ordererId") {
      errors.orderer = message;
      matched += 1;
    } else if (field.startsWith("sender")) {
      errors.sender = message;
      matched += 1;
    } else if (
      field.startsWith("recipient") ||
      field === "cip" ||
      field === "clientId"
    ) {
      errors.recipient = message;
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

export type PartyErrorField = "orderer" | PartyRole;

export function partyErrorField(role: string | null): PartyErrorField | null {
  if (role === "orderer" || role === "sender" || role === "recipient") {
    return role;
  }
  return null;
}
