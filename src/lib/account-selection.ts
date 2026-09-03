const LAST_ACCOUNT_KEY = "movix.account.last";
const ACCOUNT_KEY_PREFIX = "movix.account.";
export const NO_ACCOUNT_ACCESS_EVENT = "movix:no-account-access";

let selectedAccountId: string | null = null;

try {
  selectedAccountId = localStorage.getItem(LAST_ACCOUNT_KEY);
} catch {
  selectedAccountId = null;
}

export function getSelectedAccountId(): string | null {
  return selectedAccountId;
}

export function setSelectedAccountId(
  accountId: string,
  userId?: string | null
): void {
  selectedAccountId = accountId;
  try {
    localStorage.setItem(LAST_ACCOUNT_KEY, accountId);
    if (userId) {
      localStorage.setItem(`${ACCOUNT_KEY_PREFIX}${userId}`, accountId);
    }
  } catch {
    /* storage unavailable */
  }
}

export function clearSelectedAccountId(): void {
  selectedAccountId = null;
  try {
    localStorage.removeItem(LAST_ACCOUNT_KEY);
  } catch {
    /* ignore */
  }
}

export function storedAccountIdFor(userId: string): string | null {
  try {
    return localStorage.getItem(`${ACCOUNT_KEY_PREFIX}${userId}`);
  } catch {
    return null;
  }
}

export function emitNoAccountAccess(): void {
  window.dispatchEvent(new Event(NO_ACCOUNT_ACCESS_EVENT));
}

export function onNoAccountAccess(callback: () => void): () => void {
  window.addEventListener(NO_ACCOUNT_ACCESS_EVENT, callback);
  return () => window.removeEventListener(NO_ACCOUNT_ACCESS_EVENT, callback);
}
