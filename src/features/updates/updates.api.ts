import { http, type RequestOptions } from "@/lib/http";
import { config } from "@/lib/config";
import type { MobileUpdate, MobileUpdateEdit } from "./types";

const RESOURCE = "/updates";

const PUBLIC_OPTIONS: RequestOptions = { handleUnauthorized: false };
const UPLOAD_TIMEOUT = 600_000;

export interface UploadUpdateInput {
  version: string;
  apk: Blob;
  changelog?: string;
  mandatory?: boolean;
}

export const updatesApi = {
  list: () => http.get<MobileUpdate[]>(RESOURCE, PUBLIC_OPTIONS),

  latest: () => http.get<MobileUpdate>(`${RESOURCE}/latest`, PUBLIC_OPTIONS),

  upload: ({ version, apk, changelog, mandatory }: UploadUpdateInput) =>
    http.post<MobileUpdate>(
      `${RESOURCE}/${encodeURIComponent(version.trim())}`,
      apk,
      {
        query: {
          changelog: changelog?.trim() || undefined,
          mandatory: mandatory || undefined,
        },
        headers: { "Content-Type": "application/octet-stream" },
        timeoutMs: UPLOAD_TIMEOUT,
      }
    ),

  edit: (version: string, body: MobileUpdateEdit) =>
    http.patch<MobileUpdate>(
      `${RESOURCE}/${encodeURIComponent(version.trim())}`,
      body
    ),

  remove: (version: string) =>
    http.delete<void>(`${RESOURCE}/${encodeURIComponent(version.trim())}`),
};

export function apkDownloadUrl(update: MobileUpdate): string {
  const base = config.apiBaseUrl.replace(/\/+$/, "");
  const path =
    update.downloadUrl ||
    `${RESOURCE}/download/${encodeURIComponent(update.id)}`;
  return `${base}/${path.replace(/^\/+/, "")}`;
}
