import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Building2,
  Loader2,
  Pencil,
  Plus,
  Receipt,
  Search,
  Trash2,
  TriangleAlert,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { BillingCustomerFormDialog } from "@/components/billing-customers/billing-customer-form-dialog";
import { useInvoiceError } from "@/components/invoices/use-invoice-error";
import { useToast } from "@/app/toast-context";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { ApiError } from "@/lib/api-error";
import {
  useBillingCustomers,
  useDeleteBillingCustomer,
  type BillingCustomer,
} from "@/features/billing-customers";

function customerPlace(customer: BillingCustomer): string {
  return [customer.postalCode, customer.city].filter(Boolean).join(" ");
}

function BillingCustomersContent() {
  const { t } = useTranslation();
  const toast = useToast();
  const describeError = useInvoiceError();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("q") ?? "";
  const debouncedSearch = useDebouncedValue(search, 250);

  const customersQuery = useBillingCustomers(debouncedSearch);
  const deleteCustomer = useDeleteBillingCustomer();

  const [editing, setEditing] = useState<BillingCustomer | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<BillingCustomer | null>(null);
  const [deleteBlocked, setDeleteBlocked] = useState(false);

  const customers = customersQuery.data ?? [];

  const setSearch = (value: string) => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value) next.set("q", value);
        else next.delete("q");
        return next;
      },
      { replace: true }
    );
  };

  const openEdit = (customer: BillingCustomer | null) => {
    setEditing(customer);
    setFormOpen(true);
  };

  const openDelete = (customer: BillingCustomer) => {
    setDeleteBlocked(false);
    setDeleting(customer);
  };

  const confirmDelete = () => {
    if (!deleting) return;
    deleteCustomer.mutate(deleting.id, {
      onSuccess: () => {
        toast.success(t("billingCustomers.deleted"));
        setDeleting(null);
      },
      onError: (error) => {
        if (
          error instanceof ApiError &&
          error.errorCode === "BILLING_CUSTOMER_HAS_INVOICES"
        ) {
          setDeleteBlocked(true);
          return;
        }
        toast.error(describeError(error, "billingCustomers.errors.deleteFailed"));
      },
    });
  };

  const actions = (customer: BillingCustomer) => (
    <div className="flex shrink-0 items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-11 lg:size-8"
        aria-label={t("common.edit")}
        title={t("common.edit")}
        onClick={() => openEdit(customer)}
      >
        <Pencil className="size-5 lg:size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-11 lg:size-8"
        aria-label={t("common.delete")}
        title={t("common.delete")}
        onClick={() => openDelete(customer)}
      >
        <Trash2 className="size-5 text-destructive lg:size-4" />
      </Button>
    </div>
  );

  const badges = (customer: BillingCustomer) => (
    <span className="flex flex-wrap items-center gap-1.5">
      {customer.missingFields.length > 0 && (
        <StatusBadge
          label={t("billingCustomers.incomplete")}
          category="warning"
        />
      )}
      {customer.pharmacyId && (
        <StatusBadge label={t("billingCustomers.linkedPharmacy")} category="info" />
      )}
    </span>
  );

  const renderList = () => {
    if (customersQuery.isLoading) return <LoadingState />;
    if (customersQuery.isError) {
      return (
        <ErrorState
          error={customersQuery.error}
          retrying={customersQuery.isFetching}
          onRetry={() => void customersQuery.refetch()}
        />
      );
    }
    if (customers.length === 0) {
      return (
        <EmptyState
          message={
            search.trim()
              ? t("billingCustomers.noMatch")
              : t("billingCustomers.empty")
          }
          icon={<UsersRound className="size-8" />}
          className="flex-1"
        />
      );
    }

    return (
      <div className="rounded-xl border border-border bg-card">
        <div className="hidden lg:block">
          <Table className="min-w-[860px]">
            <TableHeader>
              <TableRow>
                <TableHead>{t("billingCustomers.fields.name")}</TableHead>
                <TableHead>{t("billingCustomers.columns.place")}</TableHead>
                <TableHead>{t("billingCustomers.fields.siret")}</TableHead>
                <TableHead>{t("billingCustomers.fields.email")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="max-w-64 truncate py-3 font-medium text-foreground">
                    {customer.name}
                  </TableCell>
                  <TableCell className="py-3">
                    {customerPlace(customer) || "-"}
                  </TableCell>
                  <TableCell className="py-3 tabular-nums">
                    {customer.siret ?? "-"}
                  </TableCell>
                  <TableCell className="max-w-56 truncate py-3">
                    {customer.email ?? "-"}
                  </TableCell>
                  <TableCell className="py-3">{badges(customer)}</TableCell>
                  <TableCell className="py-2">{actions(customer)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <ul className="flex flex-col divide-y divide-border lg:hidden">
          {customers.map((customer) => (
            <li key={customer.id} className="flex items-start gap-2 p-3">
              <Building2 className="mt-1 size-4 shrink-0 text-muted-foreground" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-sm font-medium text-foreground">
                  {customer.name}
                </span>
                {customerPlace(customer) && (
                  <span className="truncate text-xs text-muted-foreground">
                    {customerPlace(customer)}
                  </span>
                )}
                {badges(customer)}
              </div>
              {actions(customer)}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="flex w-full flex-1 flex-col">
      <PageHeader
        title={t("billingCustomers.title")}
        subtitle={t("billingCustomers.subtitle")}
        actions={
          <>
            <Button
              variant="outline"
              className="min-h-11 shrink-0 sm:min-h-10"
              asChild
            >
              <Link to="/app/invoices">
                <Receipt className="size-4" />
                {t("nav.invoices")}
              </Link>
            </Button>
            <Button
              className="min-h-11 shrink-0 sm:min-h-10"
              onClick={() => openEdit(null)}
            >
              <Plus className="size-4" />
              {t("billingCustomers.create")}
            </Button>
          </>
        }
      />

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("billingCustomers.searchPlaceholder")}
          aria-label={t("billingCustomers.searchPlaceholder")}
          className="min-h-11 pl-9 lg:min-h-10"
        />
      </div>

      {renderList()}

      <BillingCustomerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        customer={editing}
      />

      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open && !deleteCustomer.isPending) setDeleting(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("billingCustomers.delete.title")}</DialogTitle>
            <DialogDescription>
              {t("billingCustomers.delete.confirm", {
                name: deleting?.name ?? "",
              })}
            </DialogDescription>
          </DialogHeader>
          {deleteBlocked && deleting && (
            <Alert variant="warning">
              <TriangleAlert />
              <AlertDescription className="flex flex-col items-start gap-2">
                <span>{t("billingCustomers.delete.hasInvoices")}</span>
                <Link
                  to={`/app/invoices?customer=${encodeURIComponent(deleting.id)}`}
                  className="inline-flex min-h-10 items-center font-medium underline underline-offset-2"
                >
                  {t("billingCustomers.delete.seeInvoices")}
                </Link>
              </AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 sm:min-h-10"
              disabled={deleteCustomer.isPending}
              onClick={() => setDeleting(null)}
            >
              {deleteBlocked ? t("common.close") : t("common.cancel")}
            </Button>
            {!deleteBlocked && (
              <Button
                type="button"
                variant="destructive"
                className="min-h-11 sm:min-h-10"
                disabled={deleteCustomer.isPending}
                onClick={confirmDelete}
              >
                {deleteCustomer.isPending && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                {t("common.delete")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function BillingCustomersPage() {
  return (
    <AdminGate>
      <BillingCustomersContent />
    </AdminGate>
  );
}
