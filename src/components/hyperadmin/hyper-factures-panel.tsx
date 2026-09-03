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
import { HyperFactureFormDialog } from "@/components/hyperadmin/hyper-facture-form-dialog";
import { useHyperError } from "@/components/hyperadmin/use-hyper-error";
import { usePdfPreview } from "@/app/pdf-preview-context";
import { useToast } from "@/app/toast-context";
import { formatDate } from "@/lib/date";
import {
  factureDate,
  factureFileName,
  factureKeys,
  facturesApi,
  formatMontant,
  useAccountFactures,
  useDeleteFacture,
  type Facture,
} from "@/features/factures";
import type { Account } from "@/features/auth";

export function HyperFacturesPanel() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language;
  const errorMessage = useHyperError();
  const toast = useToast();
  const openPdfPreview = usePdfPreview();

  const [account, setAccount] = useState<Account | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Facture | null>(null);
  const [deleting, setDeleting] = useState<Facture | null>(null);

  const facturesQuery = useAccountFactures(account?.id ?? null);
  const deleteFacture = useDeleteFacture();

  const factures = facturesQuery.data ?? [];

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (facture: Facture) => {
    setEditing(facture);
    setFormOpen(true);
  };

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

  const handleDelete = () => {
    if (!deleting || !account) return;
    deleteFacture.mutate(
      { id: deleting.id, accountId: account.id },
      {
        onSuccess: () => setDeleting(null),
        onError: (error) => {
          setDeleting(null);
          toast.error(
            errorMessage(error, "hyperadmin.factures.errors.deleteFailed")
          );
        },
      }
    );
  };

  const renderList = () => {
    if (!account) {
      return (
        <EmptyState
          message={t("hyperadmin.factures.selectAccount")}
          icon={<Receipt className="size-8" />}
        />
      );
    }
    if (facturesQuery.isLoading) return <LoadingState />;
    if (facturesQuery.isError) {
      return (
        <>
          <Alert variant="warning" className="mb-4">
            <AlertDescription>
              {errorMessage(
                facturesQuery.error,
                "hyperadmin.factures.errors.loadFailed"
              )}
            </AlertDescription>
          </Alert>
          <ErrorState onRetry={() => void facturesQuery.refetch()} />
        </>
      );
    }
    if (factures.length === 0) {
      return (
        <EmptyState
          message={t("hyperadmin.factures.empty")}
          icon={<Receipt className="size-8" />}
        />
      );
    }
    return (
      <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
        {factures.map((facture) => (
          <li
            key={facture.id}
            className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">
                  {formatDate(factureDate(facture), lang)}
                </span>
                <Badge variant={facture.isPaid ? "secondary" : "outline"}>
                  {facture.isPaid
                    ? t("factures.status.paid")
                    : t("factures.status.unpaid")}
                </Badge>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {formatMontant(facture.montantTTC, lang)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="size-11 lg:size-9"
                aria-label={t("factures.actions.preview")}
                onClick={() => handlePreview(facture)}
              >
                <FileText className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-11 lg:size-9"
                aria-label={t("common.edit")}
                onClick={() => openEdit(facture)}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-11 lg:size-9"
                aria-label={t("common.delete")}
                onClick={() => setDeleting(facture)}
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
            <Label htmlFor="hyper-factures-account">
              {t("hyperadmin.factures.accountLabel")}
            </Label>
            <AccountPicker
              id="hyper-factures-account"
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
            {t("hyperadmin.factures.create")}
          </Button>
        </CardContent>
      </Card>

      {renderList()}

      {account && (
        <HyperFactureFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          accountId={account.id}
          facture={editing}
        />
      )}

      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open && !deleteFacture.isPending) setDeleting(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("hyperadmin.factures.delete.title")}</DialogTitle>
            <DialogDescription>
              {t("hyperadmin.factures.delete.confirm", {
                date: deleting
                  ? formatDate(factureDate(deleting), lang)
                  : "",
                amount: deleting
                  ? formatMontant(deleting.montantTTC, lang)
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
              disabled={deleteFacture.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="min-h-11 sm:min-h-10"
              onClick={handleDelete}
              disabled={deleteFacture.isPending}
            >
              {deleteFacture.isPending && (
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
