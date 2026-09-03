import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { ChartColumn, Route } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SettingsTabs, type SettingsTabItem } from "@/components/settings-tabs";
import { ExportFilterBar } from "@/components/exports/export-filter-bar";
import { PharmacyStatsTab } from "@/components/exports/pharmacy-stats-tab";
import { TourExportTab } from "@/components/exports/tour-export-tab";
import { useExportFilters } from "@/components/exports/use-export-filters";
import { AdminGate } from "@/components/admin-gate";
import { useAuth } from "@/app/auth-context";

type ExportTab = "tours" | "pharmacies";

function ExportsContent() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.isAdmin === true;

  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("tab");
  const tab: ExportTab =
    requested === "tours" && isAdmin ? "tours" : "pharmacies";

  const api = useExportFilters();

  useEffect(() => {
    if (requested === "tours" && !isAdmin) {
      setSearchParams(
        (previous) => {
          const params = new URLSearchParams(previous);
          params.delete("tab");
          return params;
        },
        { replace: true }
      );
    }
  }, [requested, isAdmin, setSearchParams]);

  const setTab = (next: ExportTab) => {
    setSearchParams(
      (previous) => {
        const params = new URLSearchParams(previous);
        if (next === "pharmacies") params.delete("tab");
        else params.set("tab", next);
        return params;
      },
      { replace: true }
    );
  };

  const items: SettingsTabItem<ExportTab>[] = [
    ...(isAdmin
      ? [
          {
            value: "tours" as const,
            label: t("exports.tabs.tours"),
            icon: Route,
          },
        ]
      : []),
    {
      value: "pharmacies" as const,
      label: t("exports.tabs.pharmacies"),
      icon: ChartColumn,
    },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title={t("exports.title")} subtitle={t("exports.subtitle")} />

      <div className="mb-4">
        <ExportFilterBar api={api} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-6">
        <SettingsTabs
          items={items}
          value={tab}
          onChange={setTab}
          idPrefix="exports"
        />

        <div className="flex min-w-0 flex-1 flex-col">
          {isAdmin && (
            <div
              role="tabpanel"
              id="exports-panel-tours"
              aria-labelledby="exports-tab-tours"
              className={tab === "tours" ? "flex flex-1 flex-col" : "hidden"}
            >
              <TourExportTab api={api} />
            </div>
          )}

          <div
            role="tabpanel"
            id="exports-panel-pharmacies"
            aria-labelledby="exports-tab-pharmacies"
            className={tab === "pharmacies" ? "flex flex-1 flex-col" : "hidden"}
          >
            <PharmacyStatsTab api={api} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ExportsPage() {
  return (
    <AdminGate>
      <ExportsContent />
    </AdminGate>
  );
}
