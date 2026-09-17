import { useEffect, useState, type FormEvent } from "react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import { useInvoiceError } from "@/components/invoices/use-invoice-error";
import { useToast } from "@/app/toast-context";
import { ApiError } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import {
  BILLING_CUSTOMER_FIELDS,
  BILLING_CUSTOMER_NAME_MAX,
  useCreateBillingCustomer,
  useUpdateBillingCustomer,
  type BillingCustomer,
  type BillingCustomerField,
  type BillingCustomerInput,
} from "@/features/billing-customers";

type FormState = Record<BillingCustomerField, string>;

const EMITTING_FIELDS: BillingCustomerField[] = [
  "address1",
  "postalCode",
  "city",
];

function initialForm(customer: BillingCustomer | null): FormState {
  return Object.fromEntries(
    BILLING_CUSTOMER_FIELDS.map((field) => [field, customer?.[field] ?? ""])
  ) as FormState;
}

function toInput(form: FormState): BillingCustomerInput {
  const value = (field: BillingCustomerField) => form[field].trim() || null;
  return {
    name: form.name.trim(),
    siret: value("siret"),
    vatNumber: value("vatNumber"),
    address1: value("address1"),
    address2: value("address2"),
    postalCode: value("postalCode"),
    city: value("city"),
    country: value("country"),
    email: value("email"),
    phone: value("phone"),
  };
}

interface BillingCustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: BillingCustomer | null;
  initialName?: string;
  notice?: string;
  onSaved?: (customer: BillingCustomer) => void;
}

export function BillingCustomerFormDialog({
  open,
  onOpenChange,
  customer,
  initialName,
  notice,
  onSaved,
}: BillingCustomerFormDialogProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const describeError = useInvoiceError();
  const createCustomer = useCreateBillingCustomer();
  const updateCustomer = useUpdateBillingCustomer();

  const [form, setForm] = useState<FormState>(() => initialForm(customer));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    const next = initialForm(customer);
    if (!customer && initialName) next.name = initialName;
    setForm(next);
    setErrors({});
  }, [open, customer, initialName]);

  const pending = createCustomer.isPending || updateCustomer.isPending;
  const missing = new Set(
    (customer?.missingFields ?? []).filter(
      (field) => !form[field as BillingCustomerField]?.trim()
    )
  );

  const set = (field: BillingCustomerField, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: "" }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!form.name.trim()) {
      setErrors({ name: t("common.required") });
      return;
    }
    const input = toInput(form);
    const options = {
      onSuccess: (saved: BillingCustomer) => {
        toast.success(t("billingCustomers.saved"));
        onOpenChange(false);
        onSaved?.(saved);
      },
      onError: (error: unknown) => {
        if (error instanceof ApiError) {
          const fieldErrors = error.structuredFieldErrors;
          if (Object.keys(fieldErrors).length > 0) setErrors(fieldErrors);
        }
        toast.error(describeError(error, "billingCustomers.errors.saveFailed"));
      },
    };
    if (customer) {
      updateCustomer.mutate({ id: customer.id, input }, options);
    } else {
      createCustomer.mutate(input, options);
    }
  };

  const field = (
    name: BillingCustomerField,
    options: {
      className?: string;
      type?: string;
      autoComplete?: string;
      inputMode?: "numeric" | "email" | "tel";
      placeholder?: string;
      maxLength?: number;
    } = {}
  ) => {
    const id = `billing-customer-${name}`;
    const highlighted = missing.has(name);
    return (
      <FormField
        label={t(`billingCustomers.fields.${name}`)}
        htmlFor={id}
        error={errors[name]}
        hint={
          highlighted
            ? t("billingCustomers.missingHint")
            : EMITTING_FIELDS.includes(name)
              ? t("billingCustomers.emittingHint")
              : undefined
        }
        required={name === "name"}
        className={options.className}
      >
        <Input
          id={id}
          value={form[name]}
          onChange={(event) => set(name, event.target.value)}
          disabled={pending}
          type={options.type}
          inputMode={options.inputMode}
          autoComplete={options.autoComplete ?? "off"}
          placeholder={options.placeholder}
          maxLength={options.maxLength}
          aria-invalid={errors[name] || highlighted ? true : undefined}
          aria-describedby={`${id}-message`}
          className={cn(
            highlighted &&
              "border-status-warning-strong ring-1 ring-status-warning-strong/40"
          )}
        />
      </FormField>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {customer
              ? t("billingCustomers.form.editTitle")
              : t("billingCustomers.form.createTitle")}
          </DialogTitle>
          <DialogDescription>{t("billingCustomers.form.subtitle")}</DialogDescription>
        </DialogHeader>

        {(notice || missing.size > 0) && (
          <Alert variant="warning">
            <TriangleAlert />
            <AlertTitle>
              {notice ?? t("billingCustomers.missingTitle")}
            </AlertTitle>
            {missing.size > 0 && (
              <AlertDescription>
                {[...missing]
                  .map((name) =>
                    t(`billingCustomers.fields.${name}`, { defaultValue: name })
                  )
                  .join(", ")}
              </AlertDescription>
            )}
          </Alert>
        )}

        <form
          id="billing-customer-form"
          onSubmit={handleSubmit}
          noValidate
          className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2"
        >
          {field("name", {
            className: "sm:col-span-2",
            autoComplete: "organization",
            maxLength: BILLING_CUSTOMER_NAME_MAX,
          })}
          {field("siret", { inputMode: "numeric" })}
          {field("vatNumber")}
          {field("address1", {
            className: "sm:col-span-2",
            autoComplete: "address-line1",
          })}
          {field("address2", {
            className: "sm:col-span-2",
            autoComplete: "address-line2",
          })}
          {field("postalCode", {
            inputMode: "numeric",
            autoComplete: "postal-code",
          })}
          {field("city", { autoComplete: "address-level2" })}
          {field("country", {
            autoComplete: "country-name",
            placeholder: t("billingCustomers.countryPlaceholder"),
          })}
          {field("email", { type: "email", inputMode: "email" })}
          {field("phone", { type: "tel", inputMode: "tel" })}
        </form>

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
            type="submit"
            form="billing-customer-form"
            className="min-h-11 sm:min-h-10"
            disabled={pending}
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            {customer ? t("common.save") : t("common.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
