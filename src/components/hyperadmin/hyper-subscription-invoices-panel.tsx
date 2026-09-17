import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Loader2, Pencil, Plus, Receipt, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { AccountPicker } from "@/components/hyperadmin/account-picker";
import { HyperSubscriptionInvoiceFormDialog } from "@/components/hyperadmin/hyper-subscription-invoice-form-dialog";
import { useHyperError } from "@/components/hyperadmin/use-hyper-error";
import { usePdfPreview } from "@/app/pdf-preview-context";
import { useToast } from "@/app/toast-context";
import { formatDate } from "@/lib/date";
import {
  subscriptionInvoiceDate,
  subscriptionInvoiceFileName,
  subscriptionInvoiceKeys,
  subscriptionInvoicesApi,
  formatSubscriptionInvoiceAmount,
  useAccountSubscriptionInvoices,
  useDeleteSubscriptionInvoice,
  type SubscriptionInvoice,
} from "@/features/subscription-invoices";
import type { Account } from "@/features/auth";

export function HyperSubscriptionInvoicesPanel() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language;
  const errorMessage = useHyperError();
  const toast = useToast();
  const openPdfPreview = usePdfPreview();

  const [account, setAccount] = useState<Account | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionInvoice | null>(null);
  const [deleting, setDeleting] = useState<SubscriptionInvoice | null>(null);

  const invoicesQuery = useAccountSubscriptionInvoices(account?.id ?? null);
  const deleteInvoice = useDeleteSubscriptionInvoice();

  const invoices = invoicesQuery.data ?? [];

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (invoice: SubscriptionInvoice) => {
    setEditing(invoice);
    setFormOpen(true);
  };

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

  const handleDelete = () => {
    if (!deleting || !account) return;
    deleteInvoice.mutate(
      { id: deleting.id, accountId: account.id },
      {
        onSuccess: () => setDeleting(null),
        onError: (error) => {
          setDeleting(null);
          toast.error(
            errorMessage(
              error,
              "hyperadmin.subscriptionInvoices.errors.deleteFailed"
            )
          );
        },
      }
    );
  };

  const renderList = () => {
    if (!account) {
      return (
        <EmptyState
          message={t("hyperadmin.subscriptionInvoices.selectAccount")}
          icon={<Receipt className="size-8" />}
        />
      );
    }
    if (invoicesQuery.isLoading) return <LoadingState />;
    if (invoicesQuery.isError) {
      return (
        <>
          <Alert variant="warning" className="mb-4">
            <AlertDescription>
              {errorMessage(
                invoicesQuery.error,
                "hyperadmin.subscriptionInvoices.errors.loadFailed"
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
          message={t("hyperadmin.subscriptionInvoices.empty")}
          icon={<Receipt className="size-8" />}
        />
      );
    }
    return (
      <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
        {invoices.map((invoice) => (
          <li
            key={invoice.id}
            className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">
                  {formatDate(subscriptionInvoiceDate(invoice), lang)}
                </span>
                <Badge variant={invoice.isPaid ? "secondary" : "outline"}>
                  {invoice.isPaid
                    ? t("subscriptionInvoices.status.paid")
                    : t("subscriptionInvoices.status.unpaid")}
                </Badge>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {formatSubscriptionInvoiceAmount(invoice.montantTTC, lang)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="size-11 lg:size-9"
                aria-label={t("subscriptionInvoices.actions.preview")}
                onClick={() => handlePreview(invoice)}
              >
                <FileText className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-11 lg:size-9"
                aria-label={t("common.edit")}
                onClick={() => openEdit(invoice)}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-11 lg:size-9"
                aria-label={t("common.delete")}
                onClick={() => setDeleting(invoice)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Label htmlFor="hyper-subscription-invoices-account">
              {t("hyperadmin.subscriptionInvoices.accountLabel")}
            </Label>
            <AccountPicker
              id="hyper-subscription-invoices-account"
              value={account}
              onChange={setAccount}
            />
          </div>
          <Button
            className="min-h-11 shrink-0 lg:min-h-10"
            disabled={!account}
            onClick={openCreate}
          >
            <Plus className="size-4" />
            {t("hyperadmin.subscriptionInvoices.create")}
          </Button>
        </CardContent>
      </Card>

      {renderList()}

      {account && (
        <HyperSubscriptionInvoiceFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          accountId={account.id}
          invoice={editing}
        />
      )}

      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open && !deleteInvoice.isPending) setDeleting(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t("hyperadmin.subscriptionInvoices.delete.title")}
            </DialogTitle>
            <DialogDescription>
              {t("hyperadmin.subscriptionInvoices.delete.confirm", {
                date: deleting
                  ? formatDate(subscriptionInvoiceDate(deleting), lang)
                  : "",
                amount: deleting
                  ? formatSubscriptionInvoiceAmount(deleting.montantTTC, lang)
                  : "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 sm:min-h-10"
              onClick={() => setDeleting(null)}
              disabled={deleteInvoice.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="min-h-11 sm:min-h-10"
              onClick={handleDelete}
              disabled={deleteInvoice.isPending}
            >
              {deleteInvoice.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
