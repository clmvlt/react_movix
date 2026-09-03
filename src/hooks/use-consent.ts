import { useCallback, useSyncExternalStore } from "react";
import {
  closeConsentPreferences,
  getConsent,
  isConsentPreferencesOpen,
  openConsentPreferences,
  saveConsent,
  subscribeConsent,
  type ConsentCategory,
  type ConsentChoices,
  type ConsentRecord,
} from "@/lib/consent";

export interface UseConsentResult {
  consent: ConsentRecord | null;
  hasDecided: boolean;
  preferencesOpen: boolean;
  isAllowed: (category: ConsentCategory) => boolean;
  accept: (categories: Partial<ConsentChoices>) => ConsentRecord;
  openPreferences: () => void;
  closePreferences: () => void;
}

export function useConsent(): UseConsentResult {
  const consent = useSyncExternalStore(subscribeConsent, getConsent, getConsent);
  const preferencesOpen = useSyncExternalStore(
    subscribeConsent,
    isConsentPreferencesOpen,
    isConsentPreferencesOpen
  );

  const isAllowed = useCallback(
    (category: ConsentCategory) => {
      if (category === "necessary") return true;
      return consent?.categories[category] === true;
    },
    [consent]
  );

  const accept = useCallback((categories: Partial<ConsentChoices>) => {
    const record = saveConsent(categories);
    closeConsentPreferences();
    return record;
  }, []);

  return {
    consent,
    hasDecided: consent !== null,
    preferencesOpen,
    isAllowed,
    accept,
    openPreferences: openConsentPreferences,
    closePreferences: closeConsentPreferences,
  };
}
