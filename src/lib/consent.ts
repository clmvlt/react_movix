export const CONSENT_VERSION = 1;
export const CONSENT_STORAGE_KEY = "movix.consent";
export const CONSENT_EVENT = "movix:consent";

export const OPTIONAL_CONSENT_CATEGORIES = ["google", "analytics"] as const;
export type OptionalConsentCategory =
  (typeof OPTIONAL_CONSENT_CATEGORIES)[number];
export type ConsentCategory = "necessary" | OptionalConsentCategory;

export type ConsentChoices = Record<OptionalConsentCategory, boolean>;

export interface ConsentCategories extends ConsentChoices {
  necessary: true;
}

export interface ConsentRecord {
  version: number;
  decidedAt: string;
  categories: ConsentCategories;
}

export const REFUSE_ALL_CHOICES: ConsentChoices = {
  google: false,
  analytics: false,
};

export const ACCEPT_ALL_CHOICES: ConsentChoices = {
  google: true,
  analytics: true,
};

function isRecord(value: unknown): value is ConsentRecord {
  if (!value || typeof value !== "object") return false;
  const raw = value as Partial<ConsentRecord>;
  if (raw.version !== CONSENT_VERSION) return false;
  if (typeof raw.decidedAt !== "string") return false;
  const categories = raw.categories as Partial<ConsentCategories> | undefined;
  if (!categories || typeof categories !== "object") return false;
  return OPTIONAL_CONSENT_CATEGORIES.every(
    (category) => typeof categories[category] === "boolean"
  );
}

function readStored(): ConsentRecord | null {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

let snapshot: ConsentRecord | null = readStored();
let preferencesOpen = false;

const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

export function getConsent(): ConsentRecord | null {
  return snapshot;
}

export function hasDecidedConsent(): boolean {
  return snapshot !== null;
}

export function isConsentAllowed(category: ConsentCategory): boolean {
  if (category === "necessary") return true;
  return snapshot?.categories[category] === true;
}

export function saveConsent(choices: Partial<ConsentChoices>): ConsentRecord {
  const record: ConsentRecord = {
    version: CONSENT_VERSION,
    decidedAt: new Date().toISOString(),
    categories: {
      necessary: true,
      google: choices.google === true,
      analytics: choices.analytics === true,
    },
  };
  snapshot = record;
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
  } catch {
    /* storage unavailable, the choice lives for this page only */
  }
  notify();
  return record;
}

export function isConsentPreferencesOpen(): boolean {
  return preferencesOpen;
}

export function openConsentPreferences(): void {
  if (preferencesOpen) return;
  preferencesOpen = true;
  notify();
}

export function closeConsentPreferences(): void {
  if (!preferencesOpen) return;
  preferencesOpen = false;
  notify();
}

export function subscribeConsent(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== null && event.key !== CONSENT_STORAGE_KEY) return;
    const next = readStored();
    if (JSON.stringify(next) === JSON.stringify(snapshot)) return;
    snapshot = next;
    notify();
  });
}
