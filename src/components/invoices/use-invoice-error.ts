import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ApiError, apiErrorText } from "@/lib/api-error";

export function useInvoiceError(): (
  error: unknown,
  fallbackKey?: string
) => string {
  const { t, i18n } = useTranslation();
  return useCallback(
    (error: unknown, fallbackKey = "invoices.errors.actionFailed") => {
      if (error instanceof ApiError) {
        const code = error.errorCode;
        if (code && i18n.exists(`invoices.errors.codes.${code}`)) {
          return t(`invoices.errors.codes.${code}`);
        }
        if (error.status === 403) return t("invoices.errors.forbidden");
        if (error.status === 404) return t("invoices.errors.notFound");
      }
      return apiErrorText(error) ?? t(fallbackKey);
    },
    [t, i18n]
  );
}
