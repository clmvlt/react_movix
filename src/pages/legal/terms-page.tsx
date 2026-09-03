import { useTranslation } from "react-i18next";
import { LegalDocument } from "@/components/legal/legal-document";
import { termsFr } from "@/content/legal/fr";

export function LegalTermsPage() {
  const { t } = useTranslation();
  return (
    <LegalDocument
      path="/legal/terms"
      documentTitle={t("legal.terms.documentTitle")}
      metaDescription={t("legal.terms.metaDescription")}
      content={termsFr}
    />
  );
}
