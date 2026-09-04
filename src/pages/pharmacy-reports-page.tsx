import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ClipboardList, Search, Wrench } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/page-header";
import { ViewSwitch, type ViewSwitchItem } from "@/components/view-switch";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { ReportListItem } from "@/components/pharmacies/report-list-item";
import { ReportWorkspacePanel } from "@/components/pharmacies/report-workspace-panel";
import { cn } from "@/lib/utils";
import { usePharmacyReports } from "@/features/pharmacy-reports";

type ReportsView = "list" | "detail";

export function PharmacyReportsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("q") ?? "";
  const selectedId = searchParams.get("report");
  const viewParam = searchParams.get("view");
  const view: ReportsView =
    viewParam === "detail" || viewParam === "list"
      ? viewParam
      : selectedId
        ? "detail"
        : "list";

  const setParams = (patch: Record<string, string | null>) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(patch)) {
          if (value === null) next.delete(key);
          else next.set(key, value);
        }
        return next;
      },
      { replace: true }
    );
  };

  const reportsQuery = usePharmacyReports();

  const reports = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (reportsQuery.data ?? []).filter((report) => {
      if (!term) return true;
      const haystack = [
        report.pharmacy?.name,
        report.pharmacy?.cip,
        report.pharmacy?.city,
        report.profil?.firstName,
        report.profil?.lastName,
        report.commentaire,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [reportsQuery.data, search]);

  const selectedReport = useMemo(
    () =>
      (reportsQuery.data ?? []).find((report) => report.id === selectedId) ??
      null,
    [reportsQuery.data, selectedId]
  );

  const [dirty, setDirty] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<string | null>(
    null
  );

  useEffect(() => {
    setDirty(false);
  }, [selectedId]);

  const applySelection = (id: string) =>
    setParams({ report: id, view: "detail" });

  const handleSelect = (id: string) => {
    if (id === selectedId) {
      setParams({ view: "detail" });
      return;
    }
    if (dirty) {
      setPendingSelection(id);
      return;
    }
    applySelection(id);
  };

  const handleDeleted = () => {
    const index = reports.findIndex((report) => report.id === selectedId);
    const next = reports[index + 1] ?? (index > 0 ? reports[index - 1] : null);
    if (next) applySelection(next.id);
    else setParams({ report: null, view: null });
  };

  const viewItems: ViewSwitchItem<ReportsView>[] = [
    {
      value: "list",
      label: t("pharmacies.reports.views.list"),
      icon: ClipboardList,
      count: reports.length,
    },
    {
      value: "detail",
      label: t("pharmacies.reports.views.detail"),
      icon: Wrench,
    },
  ];

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <PageHeader
        title={t("pharmacies.reports.title")}
        subtitle={t("pharmacies.reports.subtitle")}
      />

      <ViewSwitch
        items={viewItems}
        value={view}
        onChange={(next) => setParams({ view: next })}
        className="mb-4 lg:hidden"
      />

      <div className="flex min-h-0 flex-1 gap-4">
        <div
          className={cn(
            "min-h-0 w-full flex-col gap-3 lg:flex lg:w-96 lg:shrink-0",
            view === "detail" ? "hidden" : "flex"
          )}
        >
          <div className="relative shrink-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) =>
                setParams({
                  q: event.target.value.trim() ? event.target.value : null,
                })
              }
              placeholder={t("pharmacies.reports.filterPlaceholder")}
              aria-label={t("common.search")}
              className="min-h-11 pl-9 lg:min-h-10"
            />
          </div>

          {reportsQuery.isLoading ? (
            <LoadingState />
          ) : reportsQuery.isError ? (
            <ErrorState
              error={reportsQuery.error}
              retrying={reportsQuery.isFetching}
              onRetry={() => void reportsQuery.refetch()}
            />
          ) : reports.length === 0 ? (
            <EmptyState
              message={t("pharmacies.reports.empty")}
              icon={<ClipboardList className="size-8" />}
            />
          ) : (
            <>
              <p className="shrink-0 text-sm text-muted-foreground">
                {t("pharmacies.reports.count", { count: reports.length })}
              </p>
              <ul className="-m-1 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-1 pb-4 lg:pr-1">
                {reports.map((report) => (
                  <ReportListItem
                    key={report.id}
                    report={report}
                    selected={report.id === selectedId}
                    onSelect={handleSelect}
                  />
                ))}
              </ul>
            </>
          )}
        </div>

        <div
          className={cn(
            "min-h-0 flex-1 flex-col lg:flex",
            view === "detail" ? "flex" : "hidden"
          )}
        >
          {selectedReport ? (
            <ReportWorkspacePanel
              key={selectedReport.id}
              report={selectedReport}
              onDirtyChange={setDirty}
              onDeleted={handleDeleted}
              onOpenPharmacy={(cip) =>
                navigate(`/app/pharmacies/${encodeURIComponent(cip)}`)
              }
            />
          ) : selectedId && !reportsQuery.isLoading ? (
            <EmptyState
              message={t("pharmacies.reports.reportGone")}
              className="flex-1"
            />
          ) : (
            <EmptyState
              message={t("pharmacies.reports.selectPrompt")}
              icon={<Wrench className="size-8" />}
              className="flex-1"
            />
          )}
        </div>
      </div>

      <Dialog
        open={pendingSelection != null}
        onOpenChange={(open) => {
          if (!open) setPendingSelection(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("pharmacies.reports.discardTitle")}</DialogTitle>
            <DialogDescription>
              {t("pharmacies.reports.discardConfirm")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 sm:min-h-10"
              onClick={() => setPendingSelection(null)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              className="min-h-11 sm:min-h-10"
              onClick={() => {
                if (pendingSelection) applySelection(pendingSelection);
                setPendingSelection(null);
              }}
            >
              {t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
