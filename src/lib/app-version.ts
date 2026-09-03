import { http } from "./http";
import { ApiError } from "./api-error";

export interface AppVersionManifest {
  version: string;
  env?: string;
  buildTime?: string;
}

export const APP_VERSION_PATH = "/version.json";

function isManifest(value: unknown): value is AppVersionManifest {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as AppVersionManifest).version === "string" &&
    (value as AppVersionManifest).version.trim().length > 0
  );
}

export async function fetchDeployedVersion(
  signal?: AbortSignal
): Promise<AppVersionManifest> {
  const body = await http.get<unknown>(APP_VERSION_PATH, {
    baseUrl: window.location.origin,
    auth: false,
    credentials: "omit",
    cache: "no-store",
    timeoutMs: 8_000,
    signal,
  });

  if (!isManifest(body)) {
    throw new ApiError(0, "Invalid version manifest", body);
  }

  return body;
}
