import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ApiError, apiErrorText } from "@/lib/api-error";

function fallbackKey(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 400) return "souffrance.errors.invalid";
    if (error.status === 403) return "souffrance.errors.forbidden";
    if (error.status === 404) return "souffrance.errors.notFoundPackages";
  }
  return "souffrance.errors.actionFailed";
}

export function usePackageError(): (error: unknown) => string {
  const { t } = useTranslation();
  return useCallback(
    (error: unknown) => apiErrorText(error) ?? t(fallbackKey(error)),
    [t]
  );
}
