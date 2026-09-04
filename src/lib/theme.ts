import { applyColorTokens, brand, neutral, type ColorScheme } from "@/lib/colors";

export const THEME_STORAGE_KEY = "movix.theme";
export const THEME_EVENT = "movix:theme";

export const THEME_PREFERENCES = ["light", "dark", "system"] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export type ResolvedTheme = ColorScheme;

const DARK_QUERY = "(prefers-color-scheme: dark)";

function isPreference(value: unknown): value is ThemePreference {
  return (
    typeof value === "string" &&
    (THEME_PREFERENCES as readonly string[]).includes(value)
  );
}

function readStored(): ThemePreference {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    return isPreference(raw) ? raw : "system";
  } catch {
    return "system";
  }
}

function systemQuery(): MediaQueryList | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return null;
  }
  return window.matchMedia(DARK_QUERY);
}

function resolve(preference: ThemePreference): ResolvedTheme {
  if (preference !== "system") return preference;
  return systemQuery()?.matches ? "dark" : "light";
}

let preference: ThemePreference = readStored();
let resolved: ResolvedTheme = resolve(preference);

const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
  window.dispatchEvent(new Event(THEME_EVENT));
}

function applyDom(theme: ResolvedTheme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  applyColorTokens(theme);
  const meta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]'
  );
  if (meta) meta.content = theme === "dark" ? neutral[900] : brand[500];
}

function sync(): void {
  const next = resolve(preference);
  const changed = next !== resolved;
  resolved = next;
  applyDom(resolved);
  if (changed) notify();
}

export function getThemePreference(): ThemePreference {
  return preference;
}

export function getResolvedTheme(): ResolvedTheme {
  return resolved;
}

export function setThemePreference(next: ThemePreference): void {
  if (next === preference) return;
  preference = next;
  try {
    if (next === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    /* storage unavailable, the choice lives for this page only */
  }
  const previous = resolved;
  sync();
  if (previous === resolved) notify();
}

export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function initTheme(): void {
  applyDom(resolved);
}

if (typeof window !== "undefined") {
  systemQuery()?.addEventListener("change", () => {
    if (preference === "system") sync();
  });

  window.addEventListener("storage", (event) => {
    if (event.key !== null && event.key !== THEME_STORAGE_KEY) return;
    const next = readStored();
    if (next === preference) return;
    preference = next;
    const previous = resolved;
    sync();
    if (previous === resolved) notify();
  });
}
