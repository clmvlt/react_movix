import { http } from "@/lib/http";
import type {
  LabelConfigPayload,
  LabelFieldCatalogEntry,
  LabelPreviewFormat,
  LabelSettings,
} from "./types";

const RESOURCE = "/account/label-settings";
const PREVIEW_TIMEOUT = 30_000;

export const labelSettingsApi = {
  get: () => http.get<LabelSettings>(RESOURCE),

  catalog: () => http.get<LabelFieldCatalogEntry[]>(`${RESOURCE}/catalog`),

  update: (config: LabelConfigPayload) =>
    http.put<LabelSettings>(RESOURCE, config),

  reset: () => http.post<LabelSettings>(`${RESOURCE}/reset`),

  preview: (
    config: LabelConfigPayload,
    format: LabelPreviewFormat,
    signal?: AbortSignal
  ) =>
    http.blob(`${RESOURCE}/preview`, {
      query: { format },
      body: config,
      signal,
      timeoutMs: PREVIEW_TIMEOUT,
    }),
};
