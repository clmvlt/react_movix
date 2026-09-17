import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateTime } from "@/lib/date";
import {
  formatSubscriptionInvoiceAmount,
  subscriptionInvoiceDate,
  type SubscriptionInvoice,
} from "@/features/subscription-invoices";
import { SubscriptionInvoiceActions } from "./subscription-invoice-actions";

interface SubscriptionInvoiceCardListProps {
  invoices: SubscriptionInvoice[];
  onPreview: (invoice: SubscriptionInvoice) => void;
}

export function SubscriptionInvoiceCardList({
  invoices,
  onPreview,
}: SubscriptionInvoiceCardListProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language;

  return (
    <ul className="flex flex-col gap-3 lg:hidden">
      {invoices.map((invoice) => (
        <li
          key={invoice.id}
          className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3"
        >
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {formatDate(subscriptionInvoiceDate(invoice), lang)}
              </p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
                {formatSubscriptionInvoiceAmount(invoice.montantTTC, lang)}
              </p>
            </div>
            <Badge
              variant={invoice.isPaid ? "secondary" : "outline"}
              className="shrink-0"
            >
              {invoice.isPaid
                ? t("subscriptionInvoices.status.paid")
                : t("subscriptionInvoices.status.unpaid")}
            </Badge>
          </div>

          <dl className="text-xs">
            <dt className="text-muted-foreground">
              {t("subscriptionInvoices.columns.createdAt")}
            </dt>
            <dd className="text-foreground">
              {formatDateTime(invoice.createdAt, lang) || "-"}
            </dd>
          </dl>

          <SubscriptionInvoiceActions
            invoice={invoice}
            onPreview={onPreview}
            className="justify-end border-t border-border pt-2"
          />
        </li>
      ))}
    </ul>
  );
}
