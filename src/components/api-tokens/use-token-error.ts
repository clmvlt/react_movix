import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ApiError, apiErrorText } from "@/lib/api-error";

function statusKey(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  if (error.status === 403) return "apiTokens.errors.forbidden";
  if (error.status === 404) return "apiTokens.errors.notFound";
  return null;
}

export function useTokenError(): (error: unknown, defaultKey?: string) => string {
  const { t } = useTranslation();
  return useCallback(
    (error: unknown, defaultKey = "apiTokens.errors.actionFailed") =>
      apiErrorText(error) ?? t(statusKey(error) ?? defaultKey),
    [t]
  );
}
