import { http, type Paged } from "@/lib/http";
import { ApiError } from "@/lib/api-error";
import { config } from "@/lib/config";
import type {
  Client,
  ClientExists,
  ClientInput,
  ClientListFilters,
  ClientPicture,
  ClientSearchInput,
  ClientZoneAssignInput,
  ClientZoneAssignResult,
  PictureUploadInput,
} from "./types";

const RESOURCE = "/clients";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function pathId(id: string): string {
  const normalized = id.trim().toLowerCase();
  if (!UUID_PATTERN.test(normalized)) {
    throw new ApiError(400, "Invalid client id", null);
  }
  return normalized;
}

function pathCip(cip: string): string {
  return encodeURIComponent(cip.trim());
}

export function sanitizePicture(raw: unknown): ClientPicture {
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

export const clientsApi = {
  list: (filters: ClientListFilters) =>
    http.get<Paged<Client>>(RESOURCE, {
      query: {
        type: filters.type ?? undefined,
        search: filters.search.trim() || undefined,
        page: filters.page,
        size: filters.size,
      },
    }),

  search: (input: ClientSearchInput) =>
    http.post<Paged<Client>>(`${RESOURCE}/search`, input),

  get: (id: string) => http.get<Client>(`${RESOURCE}/${pathId(id)}`),

  getByCip: (cip: string) =>
    http.get<Client>(`${RESOURCE}/by-cip/${pathCip(cip)}`),

  existsByCip: (cip: string) =>
    http.get<ClientExists>(`${RESOURCE}/by-cip/${pathCip(cip)}/exists`),

  create: (input: ClientInput) => http.post<Client>(RESOURCE, input),

  update: (id: string, input: ClientInput) =>
    http.put<Client>(`${RESOURCE}/${pathId(id)}`, input),

  remove: (id: string) => http.delete<void>(`${RESOURCE}/${pathId(id)}`),

  label: (id: string) =>
    http.blob(`${RESOURCE}/${pathId(id)}/label`, {
      body: {},
      headers: { Accept: "application/pdf" },
    }),

  addPicture: (id: string, input: PictureUploadInput) =>
    http
      .post<unknown>(`${RESOURCE}/${pathId(id)}/pictures`, input)
      .then(sanitizePicture),

  updatePicture: (id: string, pictureId: string, input: PictureUploadInput) =>
    http
      .put<unknown>(
        `${RESOURCE}/${pathId(id)}/pictures/${pathId(pictureId)}`,
        input
      )
      .then(sanitizePicture),

  removePicture: (id: string, pictureId: string) =>
    http.delete<void>(`${RESOURCE}/${pathId(id)}/pictures/${pathId(pictureId)}`),

  reorderPictures: (id: string, pictureIds: string[]) =>
    http
      .put<unknown[]>(`${RESOURCE}/${pathId(id)}/pictures/order`, {
        pictureIds: pictureIds.map(pathId),
      })
      .then((pictures) => pictures.map(sanitizePicture)),

  transferReportPicture: (id: string, reportPictureId: string) =>
    http
      .post<unknown>(
        `${RESOURCE}/${pathId(id)}/pictures/from-report/${pathId(reportPictureId)}`
      )
      .then(sanitizePicture),

  pictureBlob: (imagePath: string) => {
    const url = new URL(imagePath, config.apiBaseUrl);
    return http.blob(url.pathname, { baseUrl: url.origin });
  },

  assignZone: (input: ClientZoneAssignInput) =>
    http.put<ClientZoneAssignResult>(`${RESOURCE}/zone`, {
      clientIds: input.clientIds.map(pathId),
      zoneId: input.zoneId ? pathId(input.zoneId) : null,
    }),
};
