import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, TriangleAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/form-field";
import { DateField } from "@/components/date-field";
import { useToast } from "@/app/toast-context";
import { todayApiDate } from "@/lib/date";
import {
  INVOICE_CREDIT_REASON_MAX,
  formatEuro,
  useCreditInvoice,
  useDeleteInvoice,
  useIssueInvoice,
  useMarkInvoicePaid,
  type Invoice,
} from "@/features/invoices";
import { useInvoiceError } from "./use-invoice-error";

interface BaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
}

function DialogButtons({
  pending,
  onCancel,
  onConfirm,
  confirmLabel,
  destructive,
  disabled,
}: {
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  destructive?: boolean;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <DialogFooter>
      <Button
        type="button"
        variant="outline"
        className="min-h-11 sm:min-h-10"
        disabled={pending}
        onClick={onCancel}
      >
        {t("common.cancel")}
      </Button>
      <Button
        type="button"
        variant={destructive ? "destructive" : "default"}
        className="min-h-11 sm:min-h-10"
        disabled={pending || disabled}
        onClick={onConfirm}
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        {confirmLabel}
      </Button>
    </DialogFooter>
  );
}

export function InvoiceIssueDialog({
  open,
  onOpenChange,
  invoice,
  onProblem,
}: BaseDialogProps & { onProblem: (error: unknown) => void }) {
  const { t } = useTranslation();
  const toast = useToast();
  const issue = useIssueInvoice();

  const confirm = () => {
    issue.mutate(invoice.id, {
      onSuccess: (issued) => {
        onOpenChange(false);
        toast.success(
          t("invoices.issue.done", { number: issued.number ?? "" })
        );
      },
      onError: (error) => {
        onOpenChange(false);
        onProblem(error);
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !issue.isPending && onOpenChange(next)}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("invoices.issue.title")}</DialogTitle>
          <DialogDescription>
            {t("invoices.issue.subtitle", {
              customer: invoice.customerName ?? "-",
              amount: formatEuro(invoice.totalTtc),
            })}
          </DialogDescription>
        </DialogHeader>
        <Alert variant="warning">
          <TriangleAlert />
          <AlertDescription>{t("invoices.issue.irreversible")}</AlertDescription>
        </Alert>
        <DialogButtons
          pending={issue.isPending}
          onCancel={() => onOpenChange(false)}
          onConfirm={confirm}
          confirmLabel={t("invoices.issue.confirm")}
        />
      </DialogContent>
    </Dialog>
  );
}

export function InvoicePaymentDialog({
  open,
  onOpenChange,
  invoice,
}: BaseDialogProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const describeError = useInvoiceError();
  const markPaid = useMarkInvoicePaid();
  const today = todayApiDate();
  const minDate = invoice.issueDate?.slice(0, 10);
  const [paidAt, setPaidAt] = useState(today);

  useEffect(() => {
    if (open) setPaidAt(today);
  }, [open, today]);

  const confirm = () => {
    markPaid.mutate(
      { id: invoice.id, paidAt: paidAt || null },
      {
        onSuccess: () => {
          onOpenChange(false);
          toast.success(t("invoices.payment.done"));
        },
        onError: (error) =>
          toast.error(describeError(error, "invoices.errors.actionFailed")),
      }
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !markPaid.isPending && onOpenChange(next)}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("invoices.payment.title")}</DialogTitle>
          <DialogDescription>
            {t("invoices.payment.subtitle", {
              number: invoice.number ?? "",
              amount: formatEuro(invoice.totalTtc),
            })}
          </DialogDescription>
        </DialogHeader>
        <FormField
          label={t("invoices.payment.date")}
          htmlFor="invoice-paid-at"
          hint={t("invoices.payment.dateHint")}
        >
          <DateField
            id="invoice-paid-at"
            value={paidAt}
            min={minDate}
            max={today}
            onChange={setPaidAt}
            aria-describedby="invoice-paid-at-message"
            className="min-h-11 lg:min-h-10"
          />
        </FormField>
        <DialogButtons
          pending={markPaid.isPending}
          onCancel={() => onOpenChange(false)}
          onConfirm={confirm}
          confirmLabel={t("invoices.payment.confirm")}
        />
      </DialogContent>
    </Dialog>
  );
}

export function InvoiceCreditNoteDialog({
  open,
  onOpenChange,
  invoice,
  onCreated,
  onProblem,
}: BaseDialogProps & {
  onCreated: (creditNote: Invoice) => void;
  onProblem: (error: unknown) => void;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const credit = useCreditInvoice();
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  const confirm = () => {
    credit.mutate(
      { id: invoice.id, reason: reason.trim() || null },
      {
        onSuccess: (creditNote) => {
          onOpenChange(false);
          toast.success(
            t("invoices.creditNote.done", { number: creditNote.number ?? "" })
          );
          onCreated(creditNote);
        },
        onError: (error) => {
          onOpenChange(false);
          onProblem(error);
        },
      }
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !credit.isPending && onOpenChange(next)}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("invoices.creditNote.title")}</DialogTitle>
          <DialogDescription>
            {t("invoices.creditNote.subtitle", {
              number: invoice.number ?? "",
              amount: formatEuro(invoice.totalTtc),
            })}
          </DialogDescription>
        </DialogHeader>
        <Alert variant="warning">
          <TriangleAlert />
          <AlertDescription>
            {t("invoices.creditNote.irreversible")}
          </AlertDescription>
        </Alert>
        <FormField
          label={t("invoices.creditNote.reason")}
          htmlFor="invoice-credit-reason"
          hint={t("invoices.creditNote.reasonCount", {
            count: reason.length,
            max: INVOICE_CREDIT_REASON_MAX,
          })}
        >
          <Textarea
            id="invoice-credit-reason"
            rows={3}
            value={reason}
            maxLength={INVOICE_CREDIT_REASON_MAX}
            onChange={(event) => setReason(event.target.value)}
            disabled={credit.isPending}
            aria-describedby="invoice-credit-reason-message"
          />
        </FormField>
        <DialogButtons
          pending={credit.isPending}
          onCancel={() => onOpenChange(false)}
          onConfirm={confirm}
          confirmLabel={t("invoices.creditNote.confirm")}
          destructive
        />
      </DialogContent>
    </Dialog>
  );
}

export function InvoiceDeleteDialog({
  open,
  onOpenChange,
  invoice,
  onDeleted,
}: BaseDialogProps & { onDeleted: () => void }) {
  const { t } = useTranslation();
  const toast = useToast();
  const describeError = useInvoiceError();
  const remove = useDeleteInvoice();

  const confirm = () => {
    remove.mutate(invoice.id, {
      onSuccess: () => {
        onOpenChange(false);
        toast.success(t("invoices.delete.done"));
        onDeleted();
      },
      onError: (error) =>
        toast.error(describeError(error, "invoices.errors.actionFailed")),
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !remove.isPending && onOpenChange(next)}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("invoices.delete.title")}</DialogTitle>
          <DialogDescription>{t("invoices.delete.confirm")}</DialogDescription>
        </DialogHeader>
        <DialogButtons
          pending={remove.isPending}
          onCancel={() => onOpenChange(false)}
          onConfirm={confirm}
          confirmLabel={t("common.delete")}
          destructive
        />
      </DialogContent>
    </Dialog>
  );
}
