import { http, type Paged } from "@/lib/http";
import { mapPool } from "@/lib/async";
import { ApiError } from "@/lib/api-error";
import { config } from "@/lib/config";
import type {
  Pharmacy,
  PharmacyCreateInput,
  PharmacyDetachResult,
  PharmacyDetail,
  PharmacyFormInput,
  PharmacyPicture,
  PharmacySearchInput,
  PharmacyUpdateInput,
  PictureUploadInput,
} from "./types";

const RESOURCE = "/pharmacies";
const TRANSFER_RESOURCE = "/pharmacy-picture-transfer";
const DETACH_CONCURRENCY = 5;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SNAKE_CASE_FIELDS: Partial<Record<keyof PharmacyFormInput, string>> = {
  postalCode: "postal_code",
  firstName: "first_name",
  lastName: "last_name",
};

const CAMEL_CASE_FIELDS: Record<string, string> = Object.fromEntries(
  Object.entries(SNAKE_CASE_FIELDS).map(([camel, snake]) => [snake, camel])
);

export function fromApiFieldErrors(
  errors: Record<string, string>
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, message] of Object.entries(errors)) {
    const field = CAMEL_CASE_FIELDS[key] ?? key;
    if (!result[field]) result[field] = message;
  }
  return result;
}

function pathCip(cip: string): string {
  return encodeURIComponent(cip);
}

function pathUuid(id: string): string {
  const normalized = id.trim().toLowerCase();
  if (!UUID_PATTERN.test(normalized)) {
    throw new ApiError(400, "Invalid picture id", null);
  }
  return normalized;
}

export function toApiPayload(
  input: Partial<PharmacyFormInput>
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    if (key === "accountId" || key === "neverOrdered") continue;
    const field = SNAKE_CASE_FIELDS[key as keyof PharmacyFormInput] ?? key;
    payload[field] = value;
  }
  return payload;
}

export function sanitizePicture(raw: unknown): PharmacyPicture {
  const source = (raw ?? {}) as Record<string, unknown>;
  return {
    id: String(source.id ?? ""),
    name: String(source.name ?? ""),
    displayOrder:
      typeof source.displayOrder === "number" ? source.displayOrder : null,
    mimeType:
      typeof source.mimeType === "string" && source.mimeType
        ? source.mimeType
        : "image/jpeg",
    originalName:
      typeof source.originalName === "string" ? source.originalName : null,
    createdAt: String(source.createdAt ?? ""),
    imagePath: String(source.imagePath ?? ""),
  };
}

function update(cip: string, input: PharmacyUpdateInput) {
  return http.put<Pharmacy>(`${RESOURCE}/${pathCip(cip)}`, toApiPayload(input));
}

export const pharmaciesApi = {
  search: (input: PharmacySearchInput) =>
    http.post<Paged<Pharmacy>>(`${RESOURCE}/search`, input),

  get: (cip: string) => http.get<PharmacyDetail>(`${RESOURCE}/${pathCip(cip)}`),

  exists: (cip: string) =>
    http.get<boolean>(`${RESOURCE}/exist/${pathCip(cip)}`),

  create: ({ cip, ...rest }: PharmacyCreateInput) =>
    http.post<Pharmacy>(RESOURCE, { cip, ...toApiPayload(rest) }),

  update,

  addPicture: (cip: string, input: PictureUploadInput) =>
    http
      .post<unknown>(`${RESOURCE}/${pathCip(cip)}/picture`, input)
      .then(sanitizePicture),

  updatePicture: (cip: string, id: string, input: PictureUploadInput) =>
    http
      .put<unknown>(`${RESOURCE}/${pathCip(cip)}/picture/${pathUuid(id)}`, input)
      .then(sanitizePicture),

  removePicture: (cip: string, id: string) =>
    http.delete<void>(`${RESOURCE}/${pathCip(cip)}/picture/${pathUuid(id)}`),

  pictureBlob: (imagePath: string) => {
    const url = new URL(imagePath, config.apiBaseUrl);
    return http.blob(url.pathname, { baseUrl: url.origin });
  },

  transferReportPicture: (cip: string, pictureId: string) =>
    http
      .post<unknown>(
        `${TRANSFER_RESOURCE}/${pathCip(cip)}/from-pharmacy-infos/${pathUuid(pictureId)}`
      )
      .then(sanitizePicture),

  label: (cip: string) =>
    http.blob(`${RESOURCE}/${pathCip(cip)}/label`, {
      body: {},
      headers: { Accept: "application/pdf" },
    }),

  detachFromZone: async (cips: string[]): Promise<PharmacyDetachResult> => {
    const results = await mapPool(cips, DETACH_CONCURRENCY, async (cip) => {
      try {
        const updated = await update(cip, { zoneId: null });
        return { cip, ok: updated?.zone == null };
      } catch {
        return { cip, ok: false };
      }
    });

    return {
      requested: cips.length,
      detached: results.filter((result) => result.ok).length,
      failed: results.filter((result) => !result.ok).map((result) => result.cip),
    };
  },
};
