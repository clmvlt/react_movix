import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/page-header";
import { MobileAppPanels } from "@/components/mobile-app/mobile-app-panels";
import { VersionHistory } from "@/components/mobile-app/version-history";
import { useLatestUpdate } from "@/features/updates";

export function MobileAppPage() {
  const { t } = useTranslation();
  const latestQuery = useLatestUpdate();

  return (
    <div className="flex w-full flex-col">
      <PageHeader
        title={t("mobileApp.title")}
        subtitle={t("mobileApp.subtitle")}
      />
      <MobileAppPanels />
      <VersionHistory latest={latestQuery.data ?? null} />
    </div>
  );
}
