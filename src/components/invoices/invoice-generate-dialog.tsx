import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FileText, Loader2, Rows3, TriangleAlert, Layers } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ClientPicker } from "@/components/clients/client-picker";
import {
  clientOption,
  type ClientOption,
} from "@/components/clients/client-option";
import { cn } from "@/lib/utils";
import {
  invoiceErrorCode,
  invoiceErrorCommands,
  useGenerateInvoice,
  type InvoiceAlreadyInvoicedCommand,
  type InvoiceLineMode,
} from "@/features/invoices";
import { useInvoiceError } from "./use-invoice-error";

interface InvoiceGenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tourIds?: string[];
  commandIds?: string[];
  onGenerated?: () => void;
}

const LINE_MODES: { value: InvoiceLineMode; icon: typeof Rows3 }[] = [
  { value: "DETAILED", icon: Rows3 },
  { value: "GROUPED", icon: Layers },
];

export function InvoiceGenerateDialog({
  open,
  onOpenChange,
  tourIds,
  commandIds,
  onGenerated,
}: InvoiceGenerateDialogProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const describeError = useInvoiceError();
  const generate = useGenerateInvoice();

  const [lineMode, setLineMode] = useState<InvoiceLineMode>("DETAILED");
  const [customer, setCustomer] = useState<ClientOption | null>(null);
  const [customerRequired, setCustomerRequired] = useState(false);
  const [conflicts, setConflicts] = useState<InvoiceAlreadyInvoicedCommand[]>(
    []
  );
  const [error, setError] = useState<string | null>(null);

  const byTours = (tourIds?.length ?? 0) > 0;
  const count = byTours ? (tourIds?.length ?? 0) : (commandIds?.length ?? 0);
  const pending = generate.isPending;

  useEffect(() => {
    if (!open) return;
    setLineMode("DETAILED");
    setCustomer(null);
    setCustomerRequired(false);
    setConflicts([]);
    setError(null);
  }, [open]);

  const submit = () => {
    if (customerRequired && !customer) {
      setError(t("invoices.generate.customerRequired"));
      return;
    }
    setError(null);
    setConflicts([]);
    generate.mutate(
      {
        ...(byTours ? { tourIds } : { commandIds }),
        customerId: customer?.id,
        lineMode,
      },
      {
        onSuccess: (result) => {
          onOpenChange(false);
          onGenerated?.();
          navigate(`/app/invoices/${result.invoice.id}`);
        },
        onError: (cause) => {
          const code = invoiceErrorCode(cause);
          if (code === "CUSTOMER_REQUIRED") {
            setCustomerRequired(true);
            setError(t("invoices.generate.customerRequired"));
            return;
          }
          if (code === "COMMAND_ALREADY_INVOICED") {
            setConflicts(invoiceErrorCommands(cause));
          }
          setError(describeError(cause, "invoices.errors.generateFailed"));
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("invoices.generate.title")}</DialogTitle>
          <DialogDescription>
            {byTours
              ? t("invoices.generate.subtitleTours", { count })
              : t("invoices.generate.subtitleCommands", { count })}
          </DialogDescription>
        </DialogHeader>

        {pending ? (
          <div
            role="status"
            className="flex flex-col items-center gap-3 py-8 text-center"
          >
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">
              {t("invoices.generate.pending")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("invoices.generate.pendingHint")}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label id="invoice-generate-mode">
                {t("invoices.generate.lineMode")}
              </Label>
              <div
                role="radiogroup"
                aria-labelledby="invoice-generate-mode"
                className="grid grid-cols-1 gap-2 sm:grid-cols-2"
              >
                {LINE_MODES.map((mode) => {
                  const active = lineMode === mode.value;
                  return (
                    <button
                      key={mode.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setLineMode(mode.value)}
                      className={cn(
                        "flex min-h-11 items-start gap-2 rounded-lg border p-3 text-left transition-colors",
                        active
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-accent"
                      )}
                    >
                      <mode.icon
                        className={cn(
                          "mt-0.5 size-4 shrink-0",
                          active ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-foreground">
                          {t(`invoices.generate.modes.${mode.value}.label`)}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {t(`invoices.generate.modes.${mode.value}.hint`)}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invoice-generate-customer">
                {t("invoices.fields.customer")}
                {customerRequired && (
                  <span className="ml-0.5 text-destructive">*</span>
                )}
              </Label>
              <ClientPicker
                id="invoice-generate-customer"
                value={customer}
                onChange={(next) => {
                  setCustomer(next ? clientOption(next) : null);
                  setError(null);
                }}
                invalid={customerRequired && !customer}
                inlineResults
              />
              <p
                id="invoice-generate-customer-message"
                className="text-xs leading-4 text-muted-foreground"
              >
                {customerRequired
                  ? t("invoices.generate.customerRequiredHint")
                  : t("invoices.generate.customerOptional")}
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <TriangleAlert />
                <AlertTitle>{error}</AlertTitle>
                {conflicts.length > 0 && (
                  <AlertDescription>
                    <ul className="mt-1 flex flex-col gap-1">
                      {conflicts.map((conflict) => (
                        <li key={conflict.commandId}>
                          <Link
                            to={`/app/invoices/${conflict.invoiceId}`}
                            onClick={() => onOpenChange(false)}
                            className="inline-flex min-h-10 items-center gap-1.5 underline underline-offset-2"
                          >
                            <FileText className="size-3.5" />
                            {t("invoices.generate.alreadyOn", {
                              number:
                                conflict.invoiceNumber ??
                                t("invoices.draftLabel"),
                            })}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                )}
              </Alert>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 sm:min-h-10"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            className="min-h-11 sm:min-h-10"
            disabled={pending || count === 0}
            onClick={submit}
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            {t("invoices.generate.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
