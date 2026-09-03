import { useTranslation } from "react-i18next";
import { LegalDocument } from "@/components/legal/legal-document";
import { privacyFr } from "@/content/legal/fr";

export function LegalPrivacyPage() {
  const { t } = useTranslation();
  return (
    <LegalDocument
      path="/legal/privacy"
      documentTitle={t("legal.privacy.documentTitle")}
      metaDescription={t("legal.privacy.metaDescription")}
      content={privacyFr}
    />
  );
}
