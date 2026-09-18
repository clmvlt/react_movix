import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Label } from "@/components/ui/label";
import { ClientPicker } from "@/components/clients/client-picker";
import {
  clientOption,
  type ClientOption,
} from "@/components/clients/client-option";
import { useToast } from "@/app/toast-context";
import { useCreateInvoice } from "@/features/invoices";
import { useInvoiceError } from "./use-invoice-error";

export function InvoiceCreateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const describeError = useInvoiceError();
  const createInvoice = useCreateInvoice();
  const [customer, setCustomer] = useState<ClientOption | null>(null);

  useEffect(() => {
    if (open) setCustomer(null);
  }, [open]);

  const submit = () => {
    if (!customer) return;
    createInvoice.mutate(customer.id, {
      onSuccess: (invoice) => {
        onOpenChange(false);
        navigate(`/app/invoices/${invoice.id}/edit`);
      },
      onError: (error) =>
        toast.error(describeError(error, "invoices.errors.createFailed")),
    });
  };

  const pending = createInvoice.isPending;

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("invoices.create.title")}</DialogTitle>
          <DialogDescription>{t("invoices.create.subtitle")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invoice-create-customer">
            {t("invoices.fields.customer")}
            <span className="ml-0.5 text-destructive">*</span>
          </Label>
          <ClientPicker
            id="invoice-create-customer"
            value={customer}
            onChange={(next) => setCustomer(next ? clientOption(next) : null)}
            disabled={pending}
            inlineResults
          />
        </div>
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
            disabled={!customer || pending}
            onClick={submit}
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            {t("invoices.create.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
