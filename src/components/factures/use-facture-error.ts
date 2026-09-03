import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ApiError, apiErrorText } from "@/lib/api-error";

function statusKey(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  if (error.status === 401) return "factures.errors.noAccount";
  if (error.status === 403) return "factures.errors.forbidden";
  if (error.status === 406) return "factures.errors.pdfFailed";
  return null;
}

export function useFactureError(): (
  error: unknown,
  defaultKey?: string
) => string {
  const { t } = useTranslation();
  return useCallback(
    (error: unknown, defaultKey = "factures.errors.actionFailed") => {
      const key = statusKey(error);
      if (key) return t(key);
      return apiErrorText(error) ?? t(defaultKey);
    },
    [t]
  );
}
