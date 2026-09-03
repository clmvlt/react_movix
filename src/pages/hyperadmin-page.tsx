import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Building2, Receipt, Smartphone } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { HyperadminGate } from "@/components/admin-gate";
import { ViewSwitch } from "@/components/view-switch";
import { HyperMembersPanel } from "@/components/hyperadmin/hyper-members-panel";
import { HyperFacturesPanel } from "@/components/hyperadmin/hyper-factures-panel";
import { HyperUpdatesPanel } from "@/components/hyperadmin/hyper-updates-panel";

type HyperTab = "account" | "factures" | "updates";

function parseTab(raw: string | null): HyperTab {
  return raw === "factures" || raw === "updates" ? raw : "account";
}

function HyperadminContent() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));

  const setTab = (next: HyperTab) => {
    setSearchParams(
      (previous) => {
        const params = new URLSearchParams(previous);
        if (next === "account") params.delete("tab");
        else params.set("tab", next);
        return params;
      },
      { replace: true }
    );
  };

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title={t("hyperadmin.title")}
        subtitle={t("hyperadmin.subtitle")}
      />

      <ViewSwitch
        className="mb-4 sm:w-fit"
        value={tab}
        onChange={setTab}
        items={[
          {
            value: "account",
            label: t("hyperadmin.tabs.account"),
            icon: Building2,
          },
          {
            value: "factures",
            label: t("hyperadmin.tabs.factures"),
            icon: Receipt,
          },
          {
            value: "updates",
            label: t("hyperadmin.tabs.updates"),
            icon: Smartphone,
          },
        ]}
      />

      {tab === "account" && <HyperMembersPanel />}
      {tab === "factures" && <HyperFacturesPanel />}
      {tab === "updates" && <HyperUpdatesPanel />}
    </div>
  );
}

export function HyperadminPage() {
  return (
    <HyperadminGate>
      <HyperadminContent />
    </HyperadminGate>
  );
}
