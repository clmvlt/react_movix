import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/form-field";
import { DateField } from "@/components/date-field";
import { useHyperError } from "@/components/hyperadmin/use-hyper-error";
import { useToast } from "@/app/toast-context";
import { fileToDataUrl } from "@/lib/images";
import {
  PDF_MAX_BYTES,
  PDF_MIME_TYPE,
  subscriptionInvoiceApiDate,
  useCreateSubscriptionInvoice,
  useUpdateSubscriptionInvoice,
  type SubscriptionInvoice,
  type SubscriptionInvoiceUpdateInput,
} from "@/features/subscription-invoices";

interface HyperSubscriptionInvoiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  invoice: SubscriptionInvoice | null;
}

interface FormState {
  dateFacture: string;
  amount: string;
  isPaid: boolean;
  file: File | null;
}

function initialForm(invoice: SubscriptionInvoice | null): FormState {
  return {
    dateFacture: invoice ? subscriptionInvoiceApiDate(invoice) : "",
    amount: invoice ? String(invoice.montantTTC) : "",
    isPaid: invoice?.isPaid ?? false,
    file: null,
  };
}

function parseAmount(raw: string): number | null {
  const value = Number(raw.trim().replace(",", "."));
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100) / 100;
}

function isPdfFile(file: File): boolean {
  return (
    file.type === PDF_MIME_TYPE || file.name.toLowerCase().endsWith(".pdf")
  );
}

export function HyperSubscriptionInvoiceFormDialog({
  open,
  onOpenChange,
  accountId,
  invoice,
}: HyperSubscriptionInvoiceFormDialogProps) {
  const { t } = useTranslation();
  const errorMessage = useHyperError();
  const toast = useToast();
  const createInvoice = useCreateSubscriptionInvoice();
  const updateInvoice = useUpdateSubscriptionInvoice();

  const [form, setForm] = useState<FormState>(() => initialForm(null));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [reading, setReading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(initialForm(invoice));
    setErrors({});
  }, [open, invoice]);

  const isEdit = Boolean(invoice);
  const pending = createInvoice.isPending || updateInvoice.isPending || reading;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: "" }));
  };

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {};
    if (!form.dateFacture) next.dateFacture = t("common.required");
    if (parseAmount(form.amount) === null) {
      next.amount = form.amount.trim()
        ? t("hyperadmin.subscriptionInvoices.form.invalidAmount")
        : t("common.required");
    }
    if (!isEdit && !form.file) next.file = t("common.required");
    if (form.file) {
      if (!isPdfFile(form.file)) {
        next.file = t("hyperadmin.subscriptionInvoices.form.pdfOnly");
      } else if (form.file.size > PDF_MAX_BYTES) {
        next.file = t("hyperadmin.subscriptionInvoices.form.pdfTooLarge", {
          max: Math.round(PDF_MAX_BYTES / (1024 * 1024)),
        });
      }
    }
    return next;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const amount = parseAmount(form.amount) as number;
    const onError = (error: unknown) => {
      toast.error(
        errorMessage(
          error,
          isEdit
            ? "hyperadmin.subscriptionInvoices.errors.saveFailed"
            : "hyperadmin.subscriptionInvoices.errors.createFailed"
        )
      );
    };

    let pdfBase64: string | undefined;
    if (form.file) {
      setReading(true);
      try {
        pdfBase64 = await fileToDataUrl(form.file);
      } catch {
        setErrors((previous) => ({
          ...previous,
          file: t("hyperadmin.subscriptionInvoices.form.readFailed"),
        }));
        return;
      } finally {
        setReading(false);
      }
    }

    if (invoice) {
      const patch: SubscriptionInvoiceUpdateInput = {};
      if (form.dateFacture !== subscriptionInvoiceApiDate(invoice)) {
        patch.dateFacture = form.dateFacture;
      }
      if (amount !== invoice.montantTTC) patch.montantTTC = amount;
      if (form.isPaid !== invoice.isPaid) patch.isPaid = form.isPaid;
      if (pdfBase64) patch.pdfBase64 = pdfBase64;

      if (Object.keys(patch).length === 0) {
        onOpenChange(false);
        return;
      }

      updateInvoice.mutate(
        { id: invoice.id, accountId, input: patch },
        { onSuccess: () => onOpenChange(false), onError }
      );
      return;
    }

    createInvoice.mutate(
      {
        accountId,
        dateFacture: form.dateFacture,
        montantTTC: amount,
        isPaid: form.isPaid,
        pdfBase64: pdfBase64 as string,
      },
      { onSuccess: () => onOpenChange(false), onError }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t("hyperadmin.subscriptionInvoices.form.editTitle")
              : t("hyperadmin.subscriptionInvoices.form.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("hyperadmin.subscriptionInvoices.form.editSubtitle")
              : t("hyperadmin.subscriptionInvoices.form.createSubtitle")}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="flex flex-col gap-1"
          noValidate
        >
          <FormField
            label={t("hyperadmin.subscriptionInvoices.form.date")}
            htmlFor="hyper-subscription-invoice-date"
            error={errors.dateFacture}
            required
          >
            <DateField
              id="hyper-subscription-invoice-date"
              value={form.dateFacture}
              onChange={(next) => set("dateFacture", next)}
              required
              className="min-h-11 lg:min-h-10"
            />
          </FormField>

          <FormField
            label={t("hyperadmin.subscriptionInvoices.form.amount")}
            htmlFor="hyper-subscription-invoice-amount"
            error={errors.amount}
            required
          >
            <Input
              id="hyper-subscription-invoice-amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={(event) => set("amount", event.target.value)}
              className="min-h-11 lg:min-h-10"
            />
          </FormField>

          <FormField
            label={t("hyperadmin.subscriptionInvoices.form.pdf")}
            htmlFor="hyper-subscription-invoice-pdf"
            error={errors.file}
            hint={
              isEdit
                ? t("hyperadmin.subscriptionInvoices.form.pdfKeepHint")
                : t("hyperadmin.subscriptionInvoices.form.pdfHint")
            }
            required={!isEdit}
          >
            <Input
              id="hyper-subscription-invoice-pdf"
              type="file"
              accept=".pdf,application/pdf"
              onChange={(event) => set("file", event.target.files?.[0] ?? null)}
              className="min-h-11 pt-2.5 lg:min-h-10 lg:pt-2"
            />
          </FormField>

          <div className="mb-2 flex items-start gap-3 rounded-xl border border-border bg-card p-3">
            <Checkbox
              id="hyper-subscription-invoice-paid"
              checked={form.isPaid}
              onCheckedChange={(checked) => set("isPaid", checked === true)}
              className="mt-0.5"
            />
            <div className="min-w-0">
              <Label htmlFor="hyper-subscription-invoice-paid">
                {t("hyperadmin.subscriptionInvoices.form.paid")}
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("hyperadmin.subscriptionInvoices.form.paidHint")}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 sm:min-h-10"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              className="min-h-11 sm:min-h-10"
              disabled={pending}
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? t("common.save") : t("common.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
