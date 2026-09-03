import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ApiError, apiErrorText } from "@/lib/api-error";

function fallbackKey(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 400) return "commands.errors.invalid";
    if (error.status === 403) return "commands.errors.forbidden";
    if (error.status === 404) return "commands.errors.notFound";
    if (error.status === 409) return "commands.errors.tourClosed";
  }
  return "commands.errors.actionFailed";
}

export function useCommandError(): (error: unknown) => string {
  const { t } = useTranslation();
  return useCallback(
    (error: unknown) => apiErrorText(error) ?? t(fallbackKey(error)),
    [t]
  );
}
