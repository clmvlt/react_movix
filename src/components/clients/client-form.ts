import {
  CLIENT_BILLING_ADDRESS_FIELDS,
  CLIENT_TEXT_MAX,
  isPharmacyClient,
  type Client,
  type ClientBillingAddress,
  type ClientBillingAddressField,
  type ClientInput,
  type ClientType,
} from "@/features/clients";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ClientBillingForm = Record<ClientBillingAddressField, string>;

export interface ClientFormState {
  type: ClientType;
  cip: string;
  numero: string;
  color: string;
  doubleCleTransporteur: boolean;
  doubleCleExpediteur: boolean;
  code: string;
  name: string;
  firstName: string;
  lastName: string;
  quality: string;
  siret: string;
  vatNumber: string;
  address1: string;
  address2: string;
  address3: string;
  postalCode: string;
  city: string;
  country: string;
  latitude: string;
  longitude: string;
  phone: string;
  fax: string;
  email: string;
  informations: string;
  commentaire: string;
  deliveryWindowEnabled: boolean;
  deliveryWindowStart: string;
  deliveryWindowEnd: string;
  zoneId: string | null;
  billingAddress: ClientBillingForm;
}

export const CLIENT_TEXT_FIELDS = [
  "cip",
  "numero",
  "code",
  "name",
  "firstName",
  "lastName",
  "quality",
  "siret",
  "vatNumber",
  "address1",
  "address2",
  "address3",
  "postalCode",
  "city",
  "country",
  "phone",
  "fax",
  "email",
  "informations",
  "commentaire",
] as const;

export type ClientTextField = (typeof CLIENT_TEXT_FIELDS)[number];

function emptyBillingForm(): ClientBillingForm {
  return Object.fromEntries(
    CLIENT_BILLING_ADDRESS_FIELDS.map((field) => [field, ""])
  ) as ClientBillingForm;
}

function billingForm(address: ClientBillingAddress | null): ClientBillingForm {
  return Object.fromEntries(
    CLIENT_BILLING_ADDRESS_FIELDS.map((field) => [
      field,
      address?.[field] ?? "",
    ])
  ) as ClientBillingForm;
}

function numberToInput(value: number | null | undefined): string {
  if (value == null) return "";
  return String(value);
}

function parseCoordinate(value: string): number | null {
  const raw = value.trim().replace(",", ".");
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function hasBillingAddress(form: ClientBillingForm): boolean {
  return CLIENT_BILLING_ADDRESS_FIELDS.some((field) => form[field].trim());
}

export function initialClientForm(
  client: Client | null,
  type: ClientType = "GENERIC"
): ClientFormState {
  const pharmacy = client && isPharmacyClient(client) ? client : null;
  return {
    type: client?.type ?? type,
    cip: pharmacy?.cip ?? "",
    numero: pharmacy?.numero ?? "",
    color: pharmacy?.color ?? "",
    doubleCleTransporteur: pharmacy?.doubleCleTransporteur === true,
    doubleCleExpediteur: pharmacy?.doubleCleExpediteur === true,
    code: client?.code ?? "",
    name: client?.name ?? "",
    firstName: client?.firstName ?? "",
    lastName: client?.lastName ?? "",
    quality: client?.quality ?? "",
    siret: client?.siret ?? "",
    vatNumber: client?.vatNumber ?? "",
    address1: client?.address1 ?? "",
    address2: client?.address2 ?? "",
    address3: client?.address3 ?? "",
    postalCode: client?.postalCode ?? "",
    city: client?.city ?? "",
    country: client?.country ?? "",
    latitude: numberToInput(client?.latitude),
    longitude: numberToInput(client?.longitude),
    phone: client?.phone ?? "",
    fax: client?.fax ?? "",
    email: client?.email ?? "",
    informations: client?.informations ?? "",
    commentaire: client?.commentaire ?? "",
    deliveryWindowEnabled:
      Boolean(client?.deliveryWindowStart) || Boolean(client?.deliveryWindowEnd),
    deliveryWindowStart: client?.deliveryWindowStart ?? "",
    deliveryWindowEnd: client?.deliveryWindowEnd ?? "",
    zoneId: client?.zone?.id ?? null,
    billingAddress: client ? billingForm(client.billingAddress) : emptyBillingForm(),
  };
}

export function buildClientInput(form: ClientFormState): ClientInput {
  const text = (field: ClientTextField) => form[field].trim() || null;
  const windowValue = (value: string) =>
    form.deliveryWindowEnabled ? value.trim() || null : null;

  const billing = hasBillingAddress(form.billingAddress)
    ? (Object.fromEntries(
        CLIENT_BILLING_ADDRESS_FIELDS.map((field) => [
          field,
          form.billingAddress[field].trim() || null,
        ])
      ) as ClientBillingAddress)
    : null;

  const input: ClientInput = {
    type: form.type,
    code: text("code"),
    name: text("name"),
    firstName: text("firstName"),
    lastName: text("lastName"),
    quality: text("quality"),
    siret: text("siret"),
    vatNumber: text("vatNumber"),
    address1: text("address1"),
    address2: text("address2"),
    address3: text("address3"),
    postalCode: text("postalCode"),
    city: text("city"),
    country: text("country"),
    latitude: parseCoordinate(form.latitude),
    longitude: parseCoordinate(form.longitude),
    phone: text("phone"),
    fax: text("fax"),
    email: text("email"),
    informations: text("informations"),
    commentaire: text("commentaire"),
    deliveryWindowStart: windowValue(form.deliveryWindowStart),
    deliveryWindowEnd: windowValue(form.deliveryWindowEnd),
    zoneId: form.zoneId,
    billingAddress: billing,
  };

  if (form.type === "PHARMACY") {
    input.cip = form.cip.trim();
    input.numero = form.numero.trim() || null;
    input.color = form.color.trim() || null;
    input.doubleCleTransporteur = form.doubleCleTransporteur;
    input.doubleCleExpediteur = form.doubleCleExpediteur;
  }

  return input;
}

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function validateClientForm(
  form: ClientFormState,
  t: Translate
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (form.type === "GENERIC" && !form.name.trim()) {
    errors.name = t("common.required");
  }
  if (form.type === "PHARMACY" && !form.cip.trim()) {
    errors.cip = t("common.required");
  }

  const email = form.email.trim();
  if (email && !EMAIL_PATTERN.test(email)) {
    errors.email = t("clients.errors.email");
  }

  const billingEmail = form.billingAddress.email.trim();
  if (billingEmail && !EMAIL_PATTERN.test(billingEmail)) {
    errors["billingAddress.email"] = t("clients.errors.email");
  }

  for (const field of ["informations", "commentaire"] as const) {
    if (form[field].length > CLIENT_TEXT_MAX) {
      errors[field] = t("clients.errors.tooLong", { max: CLIENT_TEXT_MAX });
    }
  }

  return errors;
}

export const CLIENT_FIELD_ORDER = [
  "cip",
  "code",
  "name",
  "firstName",
  "lastName",
  "quality",
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
  "informations",
  "phone",
  "fax",
  "email",
  "siret",
  "vatNumber",
  "billingAddress.name",
  "billingAddress.address1",
  "billingAddress.address2",
  "billingAddress.postalCode",
  "billingAddress.city",
  "billingAddress.country",
  "billingAddress.email",
  "commentaire",
] as const;

const FIELD_ELEMENT_IDS: Record<string, string> = {
  zoneId: "zone",
  postalCode: "postal-code",
  firstName: "first-name",
  lastName: "last-name",
  vatNumber: "vat-number",
  doubleCleTransporteur: "double-carrier",
  doubleCleExpediteur: "double-sender",
};

export function clientFieldId(idPrefix: string, key: string): string {
  if (key.startsWith("billingAddress.")) {
    const field = key.slice("billingAddress.".length);
    return `${idPrefix}-billing-${FIELD_ELEMENT_IDS[field] ?? field}`;
  }
  return `${idPrefix}-${FIELD_ELEMENT_IDS[key] ?? key}`;
}

export function firstClientErrorKey(
  errors: Record<string, string>
): string | null {
  for (const key of CLIENT_FIELD_ORDER) {
    if (errors[key]) return key;
  }
  const remaining = Object.keys(errors).find((key) => errors[key]);
  return remaining ?? null;
}

export function isClientFormDirty(
  form: ClientFormState,
  baseline: Client | null
): boolean {
  const current = JSON.stringify(buildClientInput(form));
  const initial = JSON.stringify(
    buildClientInput(initialClientForm(baseline, form.type))
  );
  return current !== initial;
}
