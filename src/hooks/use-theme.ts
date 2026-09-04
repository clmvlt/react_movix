import { useSyncExternalStore } from "react";
import {
  getResolvedTheme,
  getThemePreference,
  setThemePreference,
  subscribeTheme,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme";

export interface UseThemeResult {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  isDark: boolean;
  setPreference: (next: ThemePreference) => void;
}

export function useTheme(): UseThemeResult {
  const preference = useSyncExternalStore(
    subscribeTheme,
    getThemePreference,
    getThemePreference
  );
  const resolved = useSyncExternalStore(
    subscribeTheme,
    getResolvedTheme,
    getResolvedTheme
  );

  return {
    preference,
    resolved,
    isDark: resolved === "dark",
    setPreference: setThemePreference,
  };
}
