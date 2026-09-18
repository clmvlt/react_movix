import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ListFilter, Plus, Receipt, UsersRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { AdminGate } from "@/components/admin-gate";
import { DateField } from "@/components/date-field";
import { Pagination } from "@/components/pagination";
import { FilterSummaryButton } from "@/components/filter-toggle";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { BillingChoice } from "@/components/billing/billing-choice";
import { ClientPicker } from "@/components/clients/client-picker";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { InvoiceCreateDialog } from "@/components/invoices/invoice-create-dialog";
import { formatDate, isValidApiDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import { clientLabel, useClient } from "@/features/clients";
import {
  INVOICE_PAGE_SIZE,
  INVOICE_STATUSES,
  INVOICE_TYPES,
  formatEuro,
  useInvoices,
  type InvoiceListFilters,
  type InvoiceSummary,
} from "@/features/invoices";

function parseEnum<T extends string>(
  raw: string | null,
  values: readonly T[]
): T | undefined {
  return values.find((value) => value === raw);
}

function InvoicesContent() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const status = parseEnum(searchParams.get("status"), INVOICE_STATUSES);
  const type = parseEnum(searchParams.get("type"), INVOICE_TYPES);
  const customerId = searchParams.get("customer") ?? undefined;
  const fromRaw = searchParams.get("from");
  const toRaw = searchParams.get("to");
  const from = isValidApiDate(fromRaw) ? (fromRaw as string) : undefined;
  const to = isValidApiDate(toRaw) ? (toRaw as string) : undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const filters: InvoiceListFilters = {
    status,
    type,
    customerId,
    from,
    to,
    page: page - 1,
    size: INVOICE_PAGE_SIZE,
  };

  const invoicesQuery = useInvoices(filters);
  const customerQuery = useClient(customerId);

  const setParams = (patch: Record<string, string | null>) => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        for (const [key, value] of Object.entries(patch)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        if (!("page" in patch)) next.delete("page");
        return next;
      },
      { replace: true }
    );
  };

  const activeFilters = [status, type, customerId, from, to].filter(Boolean)
    .length;
  const hasFilters = activeFilters > 0;
  const data = invoicesQuery.data;
  const items = data?.items ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.size)) : 1;

  const customerValue = customerId
    ? {
        id: customerId,
        name: customerQuery.data
          ? clientLabel(customerQuery.data)
          : t("invoices.filters.customerLoading"),
      }
    : null;

  const open = (invoice: InvoiceSummary) =>
    navigate(`/app/invoices/${invoice.id}`);

  const numberLabel = (invoice: InvoiceSummary) =>
    invoice.number ?? t("invoices.draftLabel");

  const renderList = () => {
    if (invoicesQuery.isLoading) return <LoadingState />;
    if (invoicesQuery.isError) {
      return (
        <ErrorState
          error={invoicesQuery.error}
          retrying={invoicesQuery.isFetching}
          onRetry={() => void invoicesQuery.refetch()}
        />
      );
    }
    if (items.length === 0) {
      return (
        <EmptyState
          message={hasFilters ? t("invoices.noMatch") : t("invoices.empty")}
          icon={
            hasFilters ? (
              <ListFilter className="size-8" />
            ) : (
              <Receipt className="size-8" />
            )
          }
          className="flex-1"
        />
      );
    }

    return (
      <div className="flex flex-col rounded-xl border border-border bg-card">
        <div className="hidden lg:block">
          <Table className="min-w-[860px]">
            <TableHeader>
              <TableRow>
                <TableHead>{t("invoices.columns.number")}</TableHead>
                <TableHead>{t("invoices.columns.customer")}</TableHead>
                <TableHead>{t("invoices.columns.issueDate")}</TableHead>
                <TableHead>{t("invoices.columns.dueDate")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead className="text-right">
                  {t("invoices.columns.totalHt")}
                </TableHead>
                <TableHead className="text-right">
                  {t("invoices.columns.totalTtc")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((invoice) => (
                <TableRow
                  key={invoice.id}
                  className="cursor-pointer"
                  onClick={() => open(invoice)}
                >
                  <TableCell className="py-3 font-medium text-foreground">
                    <Link
                      to={`/app/invoices/${invoice.id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="hover:underline"
                    >
                      {numberLabel(invoice)}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-64 truncate py-3">
                    {invoice.customerName ?? "-"}
                  </TableCell>
                  <TableCell className="py-3 tabular-nums">
                    {formatDate(invoice.issueDate, lang) || "-"}
                  </TableCell>
                  <TableCell className="py-3 tabular-nums">
                    {formatDate(invoice.dueDate, lang) || "-"}
                  </TableCell>
                  <TableCell className="py-3">
                    <InvoiceStatusBadge invoice={invoice} />
                  </TableCell>
                  <TableCell className="py-3 text-right tabular-nums">
                    {formatEuro(invoice.totalHt)}
                  </TableCell>
                  <TableCell className="py-3 text-right font-medium tabular-nums text-foreground">
                    {formatEuro(invoice.totalTtc)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <ul className="flex flex-col divide-y divide-border lg:hidden">
          {items.map((invoice) => (
            <li key={invoice.id}>
              <Link
                to={`/app/invoices/${invoice.id}`}
                className="flex min-h-11 flex-col gap-1.5 p-3 transition-colors hover:bg-accent"
              >
                <span className="flex min-w-0 items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-foreground">
                    {numberLabel(invoice)}
                  </span>
                  <InvoiceStatusBadge invoice={invoice} className="shrink-0" />
                </span>
                <span className="truncate text-sm text-muted-foreground">
                  {invoice.customerName ?? "-"}
                </span>
                <span className="flex items-end justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    {invoice.issueDate
                      ? t("invoices.issuedOn", {
                          date: formatDate(invoice.issueDate, lang),
                        })
                      : t("invoices.notIssued")}
                  </span>
                  <span className="shrink-0 text-base font-semibold tabular-nums text-foreground">
                    {formatEuro(invoice.totalTtc)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <Pagination
          page={page}
          totalPages={totalPages}
          totalElements={data?.total ?? 0}
          isFetching={invoicesQuery.isFetching}
          onPageChange={(next) =>
            setParams({ page: next <= 1 ? null : String(next) })
          }
        />
      </div>
    );
  };

  return (
    <div className="flex w-full flex-1 flex-col">
      <PageHeader
        title={t("invoices.title")}
        subtitle={t("invoices.subtitle")}
        actions={
          <>
            <Button
              variant="outline"
              className="min-h-11 shrink-0 sm:min-h-10"
              onClick={() => navigate("/app/clients")}
            >
              <UsersRound className="size-4" />
              {t("nav.clients")}
            </Button>
            <Button
              className="min-h-11 shrink-0 sm:min-h-10"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-4" />
              {t("invoices.create.action")}
            </Button>
          </>
        }
      />

      <div className="mb-3 flex lg:hidden">
        <FilterSummaryButton
          open={filtersOpen}
          onToggle={() => setFiltersOpen((open) => !open)}
          count={activeFilters}
          label={
            hasFilters
              ? t("invoices.filters.active", { count: activeFilters })
              : t("invoices.filters.none")
          }
        />
      </div>

      <div
        className={cn(
          "mb-4 grid-cols-1 gap-3 rounded-xl border border-border bg-card p-3 sm:grid-cols-2 lg:grid xl:grid-cols-[repeat(2,minmax(0,1fr))_minmax(0,1.5fr)_repeat(2,minmax(0,1fr))_auto] xl:items-end",
          filtersOpen ? "grid" : "hidden"
        )}
      >
        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor="invoices-filter-status">{t("common.status")}</Label>
          <BillingChoice
            id="invoices-filter-status"
            value={status ?? ""}
            options={INVOICE_STATUSES.map((value) => ({
              value,
              label: t(`invoices.status.${value}`),
            }))}
            onChange={(value) => setParams({ status: value || null })}
            placeholder={t("invoices.filters.allStatuses")}
            emptyLabel={t("invoices.filters.allStatuses")}
            className="min-h-11 lg:min-h-10"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor="invoices-filter-type">{t("invoices.fields.type")}</Label>
          <BillingChoice
            id="invoices-filter-type"
            value={type ?? ""}
            options={INVOICE_TYPES.map((value) => ({
              value,
              label: t(`invoices.types.${value}`),
            }))}
            onChange={(value) => setParams({ type: value || null })}
            placeholder={t("invoices.filters.allTypes")}
            emptyLabel={t("invoices.filters.allTypes")}
            className="min-h-11 lg:min-h-10"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5 sm:col-span-2 xl:col-span-1">
          <Label htmlFor="invoices-filter-customer">
            {t("invoices.fields.customer")}
          </Label>
          <ClientPicker
            id="invoices-filter-customer"
            value={customerValue}
            onChange={(customer) =>
              setParams({ customer: customer?.id ?? null })
            }
            allowCreate={false}
            placeholder={t("invoices.filters.allCustomers")}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor="invoices-filter-from">
            {t("invoices.filters.from")}
          </Label>
          <DateField
            id="invoices-filter-from"
            value={from ?? ""}
            max={to}
            onChange={(value) => setParams({ from: value || null })}
            className="min-h-11 lg:min-h-10"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor="invoices-filter-to">{t("invoices.filters.to")}</Label>
          <DateField
            id="invoices-filter-to"
            value={to ?? ""}
            min={from}
            onChange={(value) => setParams({ to: value || null })}
            className="min-h-11 lg:min-h-10"
          />
        </div>
        <Button
          variant="ghost"
          className="min-h-11 sm:col-span-2 lg:min-h-10 xl:col-span-1"
          disabled={!hasFilters}
          onClick={() =>
            setParams({
              status: null,
              type: null,
              customer: null,
              from: null,
              to: null,
            })
          }
        >
          <X className="size-4" />
          {t("invoices.filters.clear")}
        </Button>
      </div>

      {renderList()}

      <InvoiceCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

export function InvoicesPage() {
  return (
    <AdminGate>
      <InvoicesContent />
    </AdminGate>
  );
}
