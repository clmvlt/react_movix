import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/page-header";
import { AccountProfileTab } from "@/components/account/account-profile-tab";

export function AccountPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title={t("account.title")} subtitle={t("account.subtitle")} />
      <AccountProfileTab />
    </div>
  );
}
