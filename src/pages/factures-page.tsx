import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CheckCircle2,
  Clock,
  FileText,
  ListFilter,
  Receipt,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { AdminGate } from "@/components/admin-gate";
import { DateField } from "@/components/date-field";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { ViewSwitch } from "@/components/view-switch";
import { KpiTile } from "@/components/exports/kpi-tile";
import { useFactureError } from "@/components/factures/use-facture-error";
import { usePdfPreview } from "@/app/pdf-preview-context";
import { FactureTable } from "@/components/factures/facture-table";
import { FactureCardList } from "@/components/factures/facture-card-list";
import { formatDate, isValidApiDate } from "@/lib/date";
import {
  factureApiDate,
  factureDate,
  factureFileName,
  factureKeys,
  facturesApi,
  formatMontant,
  sumMontants,
  useFactures,
  type Facture,
  type FacturePaidFilter,
} from "@/features/factures";

function parsePaid(raw: string | null): FacturePaidFilter {
  return raw === "paid" || raw === "unpaid" ? raw : "all";
}

function parseDate(raw: string | null): string {
  return isValidApiDate(raw) ? (raw as string) : "";
}

function FacturesContent() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language;
  const errorMessage = useFactureError();

  const [searchParams, setSearchParams] = useSearchParams();
  const paid = parsePaid(searchParams.get("paid"));
  const from = parseDate(searchParams.get("from"));
  const to = parseDate(searchParams.get("to"));

  const facturesQuery = useFactures();
  const openPdfPreview = usePdfPreview();

  const setParam = (key: string, value: string, fallback: string) => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value && value !== fallback) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true }
    );
  };

  const factures = useMemo(
    () => facturesQuery.data ?? [],
    [facturesQuery.data]
  );

  const rows = useMemo(
    () =>
      factures
        .filter((facture) =>
          paid === "all" ? true : paid === "paid" ? facture.isPaid : !facture.isPaid
        )
        .filter((facture) => {
          const date = factureApiDate(facture);
          if (from && date < from) return false;
          if (to && date > to) return false;
          return true;
        }),
    [factures, paid, from, to]
  );

  const totals = useMemo(
    () => ({
      total: sumMontants(rows),
      paid: sumMontants(rows.filter((facture) => facture.isPaid)),
      unpaid: sumMontants(rows.filter((facture) => !facture.isPaid)),
      unpaidCount: rows.filter((facture) => !facture.isPaid).length,
    }),
    [rows]
  );

  const counts = useMemo(
    () => ({
      all: factures.length,
      paid: factures.filter((facture) => facture.isPaid).length,
      unpaid: factures.filter((facture) => !facture.isPaid).length,
    }),
    [factures]
  );

  const handlePreview = (facture: Facture) => {
    openPdfPreview({
      key: factureKeys.pdf(facture.id),
      title: t("factures.preview.title"),
      subtitle: t("factures.preview.subtitle", {
        date: formatDate(factureDate(facture), lang),
        amount: formatMontant(facture.montantTTC, lang),
      }),
      filename: factureFileName(facture),
      load: () => facturesApi.pdf(facture.id),
      describeError: (error) =>
        errorMessage(error, "factures.errors.pdfFailed"),
    });
  };

  const listProps = {
    factures: rows,
    onPreview: handlePreview,
  };

  const renderList = () => {
    if (facturesQuery.isLoading) return <LoadingState />;
    if (facturesQuery.isError) {
      return (
        <>
          <Alert variant="warning" className="mb-4">
            <AlertDescription>
              {errorMessage(facturesQuery.error, "factures.errors.loadFailed")}
            </AlertDescription>
          </Alert>
          <ErrorState onRetry={() => void facturesQuery.refetch()} />
        </>
      );
    }
    if (factures.length === 0) {
      return (
        <EmptyState
          message={t("factures.empty")}
          icon={<Receipt className="size-8" />}
          className="flex-1"
        />
      );
    }
    if (rows.length === 0) {
      return (
        <EmptyState
          message={t("factures.noMatch")}
          icon={<ListFilter className="size-8" />}
          className="flex-1"
        />
      );
    }
    return (
      <>
        <FactureTable {...listProps} />
        <FactureCardList {...listProps} />
      </>
    );
  };

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title={t("factures.title")} subtitle={t("factures.subtitle")} />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiTile
          label={t("factures.kpi.total")}
          value={formatMontant(totals.total, lang)}
          hint={t("factures.kpi.count", { count: rows.length })}
          icon={FileText}
        />
        <KpiTile
          label={t("factures.kpi.paid")}
          value={formatMontant(totals.paid, lang)}
          icon={CheckCircle2}
        />
        <KpiTile
          label={t("factures.kpi.unpaid")}
          value={formatMontant(totals.unpaid, lang)}
          hint={t("factures.kpi.count", { count: totals.unpaidCount })}
          icon={Clock}
        />
      </div>

      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-card p-3">
        <ViewSwitch
          value={paid}
          onChange={(next) => setParam("paid", next, "all")}
          items={[
            {
              value: "all",
              label: t("common.all"),
              icon: ListFilter,
              count: counts.all,
            },
            {
              value: "unpaid",
              label: t("factures.status.unpaid"),
              icon: Clock,
              count: counts.unpaid,
            },
            {
              value: "paid",
              label: t("factures.status.paid"),
              icon: CheckCircle2,
              count: counts.paid,
            },
          ]}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="facture-from">{t("factures.filters.from")}</Label>
            <DateField
              id="facture-from"
              value={from}
              max={to || undefined}
              onChange={(next) => setParam("from", next, "")}
              className="min-h-11 lg:min-h-10"
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="facture-to">{t("factures.filters.to")}</Label>
            <DateField
              id="facture-to"
              value={to}
              min={from || undefined}
              onChange={(next) => setParam("to", next, "")}
              className="min-h-11 lg:min-h-10"
            />
          </div>
        </div>
      </div>

      {renderList()}
    </div>
  );
}

export function FacturesPage() {
  return (
    <AdminGate>
      <FacturesContent />
    </AdminGate>
  );
}
