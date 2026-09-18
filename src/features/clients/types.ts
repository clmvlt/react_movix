export const CLIENT_TYPES = ["GENERIC", "PHARMACY"] as const;

export type ClientType = (typeof CLIENT_TYPES)[number];

export const CLIENT_PAGE_SIZE = 50;
export const CLIENT_PICKER_SIZE = 20;
export const CLIENT_NAME_MAX = 255;
export const CLIENT_TEXT_MAX = 4000;

export const CLIENT_BILLING_ADDRESS_FIELDS = [
  "name",
  "address1",
  "address2",
  "postalCode",
  "city",
  "country",
  "email",
] as const;

export type ClientBillingAddressField =
  (typeof CLIENT_BILLING_ADDRESS_FIELDS)[number];

export type ClientBillingAddress = Record<
  ClientBillingAddressField,
  string | null
>;

export interface ClientZoneRef {
  id: string;
  name: string;
}

export interface ClientPicture {
  id: string;
  name: string;
  displayOrder: number | null;
  mimeType: string;
  originalName: string | null;
  createdAt: string;
  imagePath: string;
}

export interface ClientCommonFields {
  code: string | null;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  address1: string | null;
  address2: string | null;
  address3: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  quality: string | null;
  phone: string | null;
  fax: string | null;
  email: string | null;
  informations: string | null;
  commentaire: string | null;
  deliveryWindowStart: string | null;
  deliveryWindowEnd: string | null;
  siret: string | null;
  vatNumber: string | null;
  billingAddress: ClientBillingAddress | null;
}

export interface PharmacyClientFields {
  cip: string;
  numero: string | null;
  color: string | null;
  doubleCleTransporteur: boolean | null;
  doubleCleExpediteur: boolean | null;
}

interface ClientBase extends ClientCommonFields {
  id: string;
  neverOrdered: boolean | null;
  zone: ClientZoneRef | null;
  missingFields: string[];
  createdAt: string | null;
  updatedAt: string | null;
  pictures?: ClientPicture[];
}

export interface GenericClient extends ClientBase {
  type: "GENERIC";
}

export interface PharmacyClient extends ClientBase, PharmacyClientFields {
  type: "PHARMACY";
}

export type Client = GenericClient | PharmacyClient;

export interface ClientRef {
  id: string;
  type: ClientType;
  code: string | null;
  name: string | null;
  city: string | null;
  postalCode: string | null;
  cip?: string | null;
}

export interface ClientInput extends ClientCommonFields {
  type: ClientType;
  zoneId: string | null;
  cip?: string;
  numero?: string | null;
  color?: string | null;
  doubleCleTransporteur?: boolean;
  doubleCleExpediteur?: boolean;
}

export interface ClientListFilters {
  type: ClientType | null;
  search: string;
  page: number;
  size: number;
}

export function isPharmacyClient(client: Client): client is PharmacyClient {
  return client.type === "PHARMACY";
}

interface PlaceSource {
  postalCode?: string | null;
  city?: string | null;
}

export function clientPlace(client: PlaceSource): string {
  return [client.postalCode, client.city]
    .map((part) => part?.trim() ?? "")
    .filter(Boolean)
    .join(" ");
}

interface LabelSource {
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  cip?: string | null;
}

export function clientRefLabel(
  client: LabelSource | null | undefined
): string {
  if (!client) return "";
  const name = client.name?.trim();
  if (name) return name;
  const person = [client.firstName, client.lastName]
    .map((part) => part?.trim() ?? "")
    .filter(Boolean)
    .join(" ");
  if (person) return person;
  return client.cip?.trim() ?? "";
}

export function clientLabel(client: Client): string {
  return clientRefLabel(client);
}

export const NO_ZONE = "none";
export const CLIENT_PAGE_SIZES = [25, 50, 100] as const;
export const CLIENT_QUERY_MAX_WORDS = 10;
export const CLIENT_EXISTS_STALE_TIME = 30_000;

export const PICTURE_MAX_BYTES = 10 * 1024 * 1024;
export const PICTURE_MAX_EDGE = 1600;
export const PICTURE_QUALITY = 0.8;
export const PICTURE_PASSTHROUGH_BYTES = 1024 * 1024;

export interface ClientSearchInput {
  query?: string;
  type?: ClientType;
  name?: string;
  city?: string;
  postalCode?: string;
  address?: string;
  email?: string;
  cip?: string;
  zoneId?: string;
  hasPhotos?: boolean;
  hasOrdered?: boolean;
  isLocationValid?: boolean;
  page: number;
  size: number;
}

export interface ClientExists {
  exists: boolean;
  id: string | null;
}

export interface PictureUploadInput {
  base64?: string;
  name?: string | null;
  displayOrder?: number | null;
}

export interface ClientZoneAssignInput {
  clientIds: string[];
  zoneId: string | null;
}

export interface ClientZoneAssignResult {
  updated: number;
}
