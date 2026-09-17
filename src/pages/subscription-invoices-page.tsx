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
import { useSubscriptionInvoiceError } from "@/components/subscription-invoices/use-subscription-invoice-error";
import { usePdfPreview } from "@/app/pdf-preview-context";
import { SubscriptionInvoiceTable } from "@/components/subscription-invoices/subscription-invoice-table";
import { SubscriptionInvoiceCardList } from "@/components/subscription-invoices/subscription-invoice-card-list";
import { formatDate, isValidApiDate } from "@/lib/date";
import {
  subscriptionInvoiceApiDate,
  subscriptionInvoiceDate,
  subscriptionInvoiceFileName,
  subscriptionInvoiceKeys,
  subscriptionInvoicesApi,
  formatSubscriptionInvoiceAmount,
  sumSubscriptionInvoiceAmounts,
  useSubscriptionInvoices,
  type SubscriptionInvoice,
  type SubscriptionInvoicePaidFilter,
} from "@/features/subscription-invoices";

function parsePaid(raw: string | null): SubscriptionInvoicePaidFilter {
  return raw === "paid" || raw === "unpaid" ? raw : "all";
}

function parseDate(raw: string | null): string {
  return isValidApiDate(raw) ? (raw as string) : "";
}

function SubscriptionInvoicesContent() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language;
  const errorMessage = useSubscriptionInvoiceError();

  const [searchParams, setSearchParams] = useSearchParams();
  const paid = parsePaid(searchParams.get("paid"));
  const from = parseDate(searchParams.get("from"));
  const to = parseDate(searchParams.get("to"));

  const invoicesQuery = useSubscriptionInvoices();
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

  const invoices = useMemo(
    () => invoicesQuery.data ?? [],
    [invoicesQuery.data]
  );

  const rows = useMemo(
    () =>
      invoices
        .filter((invoice) =>
          paid === "all"
            ? true
            : paid === "paid"
              ? invoice.isPaid
              : !invoice.isPaid
        )
        .filter((invoice) => {
          const date = subscriptionInvoiceApiDate(invoice);
          if (from && date < from) return false;
          if (to && date > to) return false;
          return true;
        }),
    [invoices, paid, from, to]
  );

  const totals = useMemo(
    () => ({
      total: sumSubscriptionInvoiceAmounts(rows),
      paid: sumSubscriptionInvoiceAmounts(
        rows.filter((invoice) => invoice.isPaid)
      ),
      unpaid: sumSubscriptionInvoiceAmounts(
        rows.filter((invoice) => !invoice.isPaid)
      ),
      unpaidCount: rows.filter((invoice) => !invoice.isPaid).length,
    }),
    [rows]
  );

  const counts = useMemo(
    () => ({
      all: invoices.length,
      paid: invoices.filter((invoice) => invoice.isPaid).length,
      unpaid: invoices.filter((invoice) => !invoice.isPaid).length,
    }),
    [invoices]
  );

  const handlePreview = (invoice: SubscriptionInvoice) => {
    openPdfPreview({
      key: subscriptionInvoiceKeys.pdf(invoice.id),
      title: t("subscriptionInvoices.preview.title"),
      subtitle: t("subscriptionInvoices.preview.subtitle", {
        date: formatDate(subscriptionInvoiceDate(invoice), lang),
        amount: formatSubscriptionInvoiceAmount(invoice.montantTTC, lang),
      }),
      filename: subscriptionInvoiceFileName(invoice),
      load: () => subscriptionInvoicesApi.pdf(invoice.id),
      describeError: (error) =>
        errorMessage(error, "subscriptionInvoices.errors.pdfFailed"),
    });
  };

  const listProps = {
    invoices: rows,
    onPreview: handlePreview,
  };

  const renderList = () => {
    if (invoicesQuery.isLoading) return <LoadingState />;
    if (invoicesQuery.isError) {
      return (
        <>
          <Alert variant="warning" className="mb-4">
            <AlertDescription>
              {errorMessage(
                invoicesQuery.error,
                "subscriptionInvoices.errors.loadFailed"
              )}
            </AlertDescription>
          </Alert>
          <ErrorState
            error={invoicesQuery.error}
            retrying={invoicesQuery.isFetching}
            onRetry={() => void invoicesQuery.refetch()}
          />
        </>
      );
    }
    if (invoices.length === 0) {
      return (
        <EmptyState
          message={t("subscriptionInvoices.empty")}
          icon={<Receipt className="size-8" />}
          className="flex-1"
        />
      );
    }
    if (rows.length === 0) {
      return (
        <EmptyState
          message={t("subscriptionInvoices.noMatch")}
          icon={<ListFilter className="size-8" />}
          className="flex-1"
        />
      );
    }
    return (
      <>
        <SubscriptionInvoiceTable {...listProps} />
        <SubscriptionInvoiceCardList {...listProps} />
      </>
    );
  };

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title={t("subscriptionInvoices.title")}
        subtitle={t("subscriptionInvoices.subtitle")}
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiTile
          label={t("subscriptionInvoices.kpi.total")}
          value={formatSubscriptionInvoiceAmount(totals.total, lang)}
          hint={t("subscriptionInvoices.kpi.count", { count: rows.length })}
          icon={FileText}
        />
        <KpiTile
          label={t("subscriptionInvoices.kpi.paid")}
          value={formatSubscriptionInvoiceAmount(totals.paid, lang)}
          icon={CheckCircle2}
        />
        <KpiTile
          label={t("subscriptionInvoices.kpi.unpaid")}
          value={formatSubscriptionInvoiceAmount(totals.unpaid, lang)}
          hint={t("subscriptionInvoices.kpi.count", {
            count: totals.unpaidCount,
          })}
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
              label: t("subscriptionInvoices.status.unpaid"),
              icon: Clock,
              count: counts.unpaid,
            },
            {
              value: "paid",
              label: t("subscriptionInvoices.status.paid"),
              icon: CheckCircle2,
              count: counts.paid,
            },
          ]}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="subscription-invoice-from">
              {t("subscriptionInvoices.filters.from")}
            </Label>
            <DateField
              id="subscription-invoice-from"
              value={from}
              max={to || undefined}
              onChange={(next) => setParam("from", next, "")}
              className="min-h-11 lg:min-h-10"
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="subscription-invoice-to">
              {t("subscriptionInvoices.filters.to")}
            </Label>
            <DateField
              id="subscription-invoice-to"
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

export function SubscriptionInvoicesPage() {
  return (
    <AdminGate>
      <SubscriptionInvoicesContent />
    </AdminGate>
  );
}
