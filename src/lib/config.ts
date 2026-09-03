type AppEnv = "dev" | "beta" | "demo" | "prod";

function readEnv(): AppEnv {
  const value = import.meta.env.VITE_APP_ENV as string | undefined;
  if (value === "beta" || value === "demo" || value === "prod") return value;
  return "dev";
}

function readBaseUrl(): string {
  const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed) {
    console.warn(
      "[config] VITE_API_BASE_URL is empty. API calls will fail until it is set."
    );
  }
  return trimmed;
}

const ORS_FALLBACK_URL = "https://ors.stack.bzh";

function readOrsBaseUrl(): string {
  const raw = (import.meta.env.VITE_ORS_BASE_URL as string | undefined) ?? "";
  const trimmed = raw.trim().replace(/\/+$/, "");
  return trimmed || ORS_FALLBACK_URL;
}

const GOOGLE_CLIENT_ID =
  "703495171118-v85fhr4jtc48bbftopumegqsaf3i0ops.apps.googleusercontent.com";

const appEnv = readEnv();

export const config = {
  appEnv,
  appVersion: __APP_VERSION__,
  apiBaseUrl: readBaseUrl(),
  orsBaseUrl: readOrsBaseUrl(),
  mapboxToken: (import.meta.env.VITE_MAPBOX_TOKEN as string | undefined) ?? "",
  googleClientId: GOOGLE_CLIENT_ID,
  isDev: appEnv === "dev",
  isBeta: appEnv === "beta",
  isProd: appEnv === "prod",
  betaFeatures: appEnv === "dev" || appEnv === "beta",
} as const;
