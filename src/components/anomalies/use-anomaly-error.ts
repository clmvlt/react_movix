import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ApiError, apiErrorText } from "@/lib/api-error";

function fallbackKey(error: unknown, notFoundKey: string): string {
  if (error instanceof ApiError) {
    if (error.status === 400) return "anomalies.errors.invalid";
    if (error.status === 403) return "anomalies.errors.forbidden";
    if (error.status === 404) return notFoundKey;
    if (error.status === 408) return "anomalies.errors.timeout";
  }
  return "anomalies.errors.actionFailed";
}

export function useAnomalyError(): (
  error: unknown,
  notFoundKey?: string
) => string {
  const { t } = useTranslation();
  return useCallback(
    (error: unknown, notFoundKey = "anomalies.errors.notFound") =>
      apiErrorText(error) ?? t(fallbackKey(error, notFoundKey)),
    [t]
  );
}
