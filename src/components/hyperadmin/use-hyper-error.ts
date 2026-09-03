import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ApiError, apiErrorText } from "@/lib/api-error";

function statusKey(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  if (error.status === 403) return "hyperadmin.errors.forbidden";
  if (error.status === 404) return "hyperadmin.errors.notFound";
  return null;
}

export function useHyperError(): (
  error: unknown,
  defaultKey?: string
) => string {
  const { t } = useTranslation();
  return useCallback(
    (error: unknown, defaultKey = "hyperadmin.errors.actionFailed") =>
      apiErrorText(error) ?? t(statusKey(error) ?? defaultKey),
    [t]
  );
}
