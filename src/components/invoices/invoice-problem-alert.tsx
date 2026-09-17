import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, Settings, TriangleAlert, UserRoundPen, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { BillingCustomerFormDialog } from "@/components/billing-customers/billing-customer-form-dialog";
import { useBillingCustomer } from "@/features/billing-customers";
import {
  invoiceErrorCode,
  invoiceErrorCustomerId,
  invoiceErrorMissingFields,
} from "@/features/invoices";
import { useInvoiceError } from "./use-invoice-error";

interface InvoiceProblemAlertProps {
  error: unknown;
  onDismiss: () => void;
}

export function InvoiceProblemAlert({
  error,
  onDismiss,
}: InvoiceProblemAlertProps) {
  const { t, i18n } = useTranslation();
  const describeError = useInvoiceError();
  const code = invoiceErrorCode(error);
  const missing = invoiceErrorMissingFields(error);
  const customerId =
    code === "CUSTOMER_INFO_INCOMPLETE" ? invoiceErrorCustomerId(error) : null;
  const customerQuery = useBillingCustomer(customerId);
  const [customerOpen, setCustomerOpen] = useState(false);
  const autoOpened = useRef(false);

  useEffect(() => {
    if (!customerQuery.data || autoOpened.current) return;
    autoOpened.current = true;
    setCustomerOpen(true);
  }, [customerQuery.data]);

  const fieldLabel = (field: string, scope: string) => {
    const key = `${scope}.${field}`;
    return i18n.exists(key) ? t(key) : field;
  };

  let detail: string | null = null;
  if (code === "BILLING_INFO_INCOMPLETE" && missing.length > 0) {
    detail = missing
      .map((field) => fieldLabel(field, "billing.fields"))
      .join(", ");
  } else if (code === "CUSTOMER_INFO_INCOMPLETE" && missing.length > 0) {
    detail = missing
      .map((field) => fieldLabel(field, "billingCustomers.fields"))
      .join(", ");
  } else if (code === "VAT_NOT_APPLICABLE") {
    detail = t("invoices.problems.vatNotApplicableHint");
  }

  return (
    <Alert variant="destructive">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1 size-11 lg:size-8"
        aria-label={t("common.close")}
        onClick={onDismiss}
      >
        <X className="size-4" />
      </Button>
      <TriangleAlert />
      <div className="flex flex-col gap-2 pr-10">
        <AlertTitle>{describeError(error)}</AlertTitle>
        {detail && (
          <AlertDescription>
            {code === "VAT_NOT_APPLICABLE"
              ? detail
              : t("invoices.problems.missing", { fields: detail })}
          </AlertDescription>
        )}
        {code === "BILLING_INFO_INCOMPLETE" && (
          <Button
            asChild
            variant="outline"
            className="min-h-11 self-start lg:min-h-9"
          >
            <Link to="/app/settings?tab=billing">
              <Settings className="size-4" />
              {t("invoices.problems.openBillingSettings")}
            </Link>
          </Button>
        )}
        {code === "CUSTOMER_INFO_INCOMPLETE" && customerId && (
          <Button
            variant="outline"
            className="min-h-11 self-start lg:min-h-9"
            disabled={!customerQuery.data}
            onClick={() => setCustomerOpen(true)}
          >
            {customerQuery.isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UserRoundPen className="size-4" />
            )}
            {t("invoices.problems.editCustomer")}
          </Button>
        )}
      </div>

      {customerQuery.data && (
        <BillingCustomerFormDialog
          open={customerOpen}
          onOpenChange={setCustomerOpen}
          customer={customerQuery.data}
          notice={t("invoices.problems.customerNotice")}
          onSaved={(saved) => {
            if (saved.missingFields.length === 0) onDismiss();
          }}
        />
      )}
    </Alert>
  );
}
