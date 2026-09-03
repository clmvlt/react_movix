import { useTranslation } from "react-i18next";
import { LegalDocument } from "@/components/legal/legal-document";
import { cookiesFr } from "@/content/legal/fr";

export function LegalCookiesPage() {
  const { t } = useTranslation();
  return (
    <LegalDocument
      path="/legal/cookies"
      documentTitle={t("legal.cookies.documentTitle")}
      metaDescription={t("legal.cookies.metaDescription")}
      content={cookiesFr}
    />
  );
}
