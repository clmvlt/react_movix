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
  factureApiDate,
  useCreateFacture,
  useUpdateFacture,
  type Facture,
  type FactureUpdateInput,
} from "@/features/factures";

interface HyperFactureFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  facture: Facture | null;
}

interface FormState {
  dateFacture: string;
  montant: string;
  isPaid: boolean;
  file: File | null;
}

function initialForm(facture: Facture | null): FormState {
  return {
    dateFacture: facture ? factureApiDate(facture) : "",
    montant: facture ? String(facture.montantTTC) : "",
    isPaid: facture?.isPaid ?? false,
    file: null,
  };
}

function parseMontant(raw: string): number | null {
  const value = Number(raw.trim().replace(",", "."));
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100) / 100;
}

function isPdfFile(file: File): boolean {
  return (
    file.type === PDF_MIME_TYPE || file.name.toLowerCase().endsWith(".pdf")
  );
}

export function HyperFactureFormDialog({
  open,
  onOpenChange,
  accountId,
  facture,
}: HyperFactureFormDialogProps) {
  const { t } = useTranslation();
  const errorMessage = useHyperError();
  const toast = useToast();
  const createFacture = useCreateFacture();
  const updateFacture = useUpdateFacture();

  const [form, setForm] = useState<FormState>(() => initialForm(null));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [reading, setReading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(initialForm(facture));
    setErrors({});
  }, [open, facture]);

  const isEdit = Boolean(facture);
  const pending = createFacture.isPending || updateFacture.isPending || reading;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: "" }));
  };

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {};
    if (!form.dateFacture) next.dateFacture = t("common.required");
    if (parseMontant(form.montant) === null) {
      next.montant = form.montant.trim()
        ? t("hyperadmin.factures.form.invalidAmount")
        : t("common.required");
    }
    if (!isEdit && !form.file) next.file = t("common.required");
    if (form.file) {
      if (!isPdfFile(form.file)) {
        next.file = t("hyperadmin.factures.form.pdfOnly");
      } else if (form.file.size > PDF_MAX_BYTES) {
        next.file = t("hyperadmin.factures.form.pdfTooLarge", {
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

    const montant = parseMontant(form.montant) as number;
    const onError = (error: unknown) => {
      toast.error(
        errorMessage(
          error,
          isEdit
            ? "hyperadmin.factures.errors.saveFailed"
            : "hyperadmin.factures.errors.createFailed"
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
          file: t("hyperadmin.factures.form.readFailed"),
        }));
        return;
      } finally {
        setReading(false);
      }
    }

    if (facture) {
      const patch: FactureUpdateInput = {};
      if (form.dateFacture !== factureApiDate(facture)) {
        patch.dateFacture = form.dateFacture;
      }
      if (montant !== facture.montantTTC) patch.montantTTC = montant;
      if (form.isPaid !== facture.isPaid) patch.isPaid = form.isPaid;
      if (pdfBase64) patch.pdfBase64 = pdfBase64;

      if (Object.keys(patch).length === 0) {
        onOpenChange(false);
        return;
      }

      updateFacture.mutate(
        { id: facture.id, accountId, input: patch },
        { onSuccess: () => onOpenChange(false), onError }
      );
      return;
    }

    createFacture.mutate(
      {
        accountId,
        dateFacture: form.dateFacture,
        montantTTC: montant,
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
              ? t("hyperadmin.factures.form.editTitle")
              : t("hyperadmin.factures.form.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("hyperadmin.factures.form.editSubtitle")
              : t("hyperadmin.factures.form.createSubtitle")}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="flex flex-col gap-1"
          noValidate
        >
          <FormField
            label={t("hyperadmin.factures.form.date")}
            htmlFor="hyper-facture-date"
            error={errors.dateFacture}
            required
          >
            <DateField
              id="hyper-facture-date"
              value={form.dateFacture}
              onChange={(next) => set("dateFacture", next)}
              required
              className="min-h-11 lg:min-h-10"
            />
          </FormField>

          <FormField
            label={t("hyperadmin.factures.form.amount")}
            htmlFor="hyper-facture-amount"
            error={errors.montant}
            required
          >
            <Input
              id="hyper-facture-amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={form.montant}
              onChange={(event) => set("montant", event.target.value)}
              className="min-h-11 lg:min-h-10"
            />
          </FormField>

          <FormField
            label={t("hyperadmin.factures.form.pdf")}
            htmlFor="hyper-facture-pdf"
            error={errors.file}
            hint={
              isEdit
                ? t("hyperadmin.factures.form.pdfKeepHint")
                : t("hyperadmin.factures.form.pdfHint")
            }
            required={!isEdit}
          >
            <Input
              id="hyper-facture-pdf"
              type="file"
              accept=".pdf,application/pdf"
              onChange={(event) =>
                set("file", event.target.files?.[0] ?? null)
              }
              className="min-h-11 pt-2.5 lg:min-h-10 lg:pt-2"
            />
          </FormField>

          <div className="mb-2 flex items-start gap-3 rounded-xl border border-border bg-card p-3">
            <Checkbox
              id="hyper-facture-paid"
              checked={form.isPaid}
              onCheckedChange={(checked) => set("isPaid", checked === true)}
              className="mt-0.5"
            />
            <div className="min-w-0">
              <Label htmlFor="hyper-facture-paid">
                {t("hyperadmin.factures.form.paid")}
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("hyperadmin.factures.form.paidHint")}
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
