import { clearSelectedAccountId } from "./account-selection";

const SESSION_FLAG = "movix.session";
const TOKEN_KEY = "movix.token";
export const UNAUTHORIZED_EVENT = "movix:unauthorized";

export function setSession(token?: string | null): void {
  try {
    localStorage.setItem(SESSION_FLAG, "1");
    if (token) localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage unavailable, cookie may still carry the session */
  }
}

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearSession(): void {
  clearSelectedAccountId();
  try {
    localStorage.removeItem(SESSION_FLAG);
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function hasSession(): boolean {
  try {
    return localStorage.getItem(SESSION_FLAG) === "1";
  } catch {
    return false;
  }
}

export function emitUnauthorized(): void {
  clearSession();
  window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
}

export function onUnauthorized(callback: () => void): () => void {
  window.addEventListener(UNAUTHORIZED_EVENT, callback);
  return () => window.removeEventListener(UNAUTHORIZED_EVENT, callback);
}
