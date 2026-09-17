import { useTranslation } from "react-i18next";
import { ApiError, apiErrorText } from "@/lib/api-error";

type ErrorScope =
  | "account"
  | "tarifs"
  | "tourConfigs"
  | "labelSettings"
  | "billing";

export function useApiErrorMessage(scope: ErrorScope = "account") {
  const { t } = useTranslation();

  return (error: unknown, fallbackKey: string): string => {
    if (error instanceof ApiError) {
      if (error.status === 403) return t(`${scope}.errors.forbidden`);
      const text = apiErrorText(error);
      if (text) return text;
    }
    return t(fallbackKey);
  };
}
