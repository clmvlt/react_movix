import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateTime } from "@/lib/date";
import {
  subscriptionInvoiceDate,
  formatSubscriptionInvoiceAmount,
  type SubscriptionInvoice,
} from "@/features/subscription-invoices";
import { SubscriptionInvoiceActions } from "./subscription-invoice-actions";

interface SubscriptionInvoiceTableProps {
  invoices: SubscriptionInvoice[];
  onPreview: (invoice: SubscriptionInvoice) => void;
}

export function SubscriptionInvoiceTable({
  invoices,
  onPreview,
}: SubscriptionInvoiceTableProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language;

  return (
    <div className="hidden w-full rounded-xl border border-border lg:block">
      <Table className="min-w-[720px]">
        <TableHeader>
          <TableRow>
            <TableHead>{t("subscriptionInvoices.columns.date")}</TableHead>
            <TableHead className="text-right">
              {t("subscriptionInvoices.columns.amount")}
            </TableHead>
            <TableHead>{t("common.status")}</TableHead>
            <TableHead>{t("subscriptionInvoices.columns.createdAt")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="py-3 font-medium text-foreground">
                {formatDate(subscriptionInvoiceDate(invoice), lang)}
              </TableCell>
              <TableCell className="py-3 text-right font-medium tabular-nums text-foreground">
                {formatSubscriptionInvoiceAmount(invoice.montantTTC, lang)}
              </TableCell>
              <TableCell className="py-3">
                <Badge variant={invoice.isPaid ? "secondary" : "outline"}>
                  {invoice.isPaid
                    ? t("subscriptionInvoices.status.paid")
                    : t("subscriptionInvoices.status.unpaid")}
                </Badge>
              </TableCell>
              <TableCell className="py-3 text-sm text-muted-foreground">
                {formatDateTime(invoice.createdAt, lang) || "-"}
              </TableCell>
              <TableCell className="py-3">
                <SubscriptionInvoiceActions
                  invoice={invoice}
                  onPreview={onPreview}
                  className="justify-end"
                  compact
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
