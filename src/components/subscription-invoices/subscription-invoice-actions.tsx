import { useTranslation } from "react-i18next";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SubscriptionInvoice } from "@/features/subscription-invoices";

interface SubscriptionInvoiceActionsProps {
  invoice: SubscriptionInvoice;
  onPreview: (invoice: SubscriptionInvoice) => void;
  className?: string;
  compact?: boolean;
}

export function SubscriptionInvoiceActions({
  invoice,
  onPreview,
  className,
  compact,
}: SubscriptionInvoiceActionsProps) {
  const { t } = useTranslation();

  if (!invoice.pdfUrl) {
    return (
      <span
        className={cn(
          "block text-xs text-muted-foreground",
          compact && "text-right",
          className
        )}
      >
        {t("subscriptionInvoices.noPdf")}
      </span>
    );
  }

  const size = compact ? "size-8" : "size-11 lg:size-8";
  const icon = compact ? "size-4" : "size-5 lg:size-4";

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("shrink-0", size)}
        aria-label={t("subscriptionInvoices.actions.preview")}
        title={t("subscriptionInvoices.actions.preview")}
        onClick={() => onPreview(invoice)}
      >
        <Eye className={icon} />
      </Button>
    </div>
  );
}
