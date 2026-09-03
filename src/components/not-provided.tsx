import { useTranslation } from "react-i18next";

export function NotProvided() {
  const { t } = useTranslation();
  return (
    <span className="italic text-muted-foreground">
      {t("common.notProvided")}
    </span>
  );
}
