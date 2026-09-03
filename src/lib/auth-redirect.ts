const KEY = "movix.authRedirect";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_TARGET = "/app";

interface StoredRedirect {
  path: string;
  savedAt: number;
}

interface FromLocation {
  pathname?: string;
  search?: string;
  hash?: string;
}

function isInternalPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//");
}

function read(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as Partial<StoredRedirect>;
    if (
      typeof stored.path !== "string" ||
      typeof stored.savedAt !== "number" ||
      Date.now() - stored.savedAt > MAX_AGE_MS ||
      !isInternalPath(stored.path)
    ) {
      localStorage.removeItem(KEY);
      return null;
    }
    return stored.path;
  } catch {
    return null;
  }
}

export function saveAuthRedirect(path: string | null | undefined): void {
  try {
    if (!path || path === DEFAULT_TARGET || !isInternalPath(path)) {
      localStorage.removeItem(KEY);
      return;
    }
    const stored: StoredRedirect = { path, savedAt: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(stored));
  } catch {
    /* storage unavailable */
  }
}

export function peekAuthRedirect(): string | null {
  return read();
}

export function clearAuthRedirect(onlyIfPath?: string): void {
  try {
    if (onlyIfPath !== undefined && read() !== onlyIfPath) return;
    localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
}

export function consumeAuthRedirect(): string | null {
  const path = read();
  clearAuthRedirect();
  return path;
}

export function pathFromState(state: unknown): string | null {
  const from = (state as { from?: FromLocation } | null)?.from;
  if (!from?.pathname) return null;
  const path = `${from.pathname}${from.search ?? ""}${from.hash ?? ""}`;
  return isInternalPath(path) ? path : null;
}

export function resolveAuthRedirect(state: unknown): string {
  return pathFromState(state) ?? peekAuthRedirect() ?? DEFAULT_TARGET;
}
