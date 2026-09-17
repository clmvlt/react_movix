import { useTranslation } from "react-i18next";
import { StatusBadge } from "@/components/status-badge";
import type { StatusCategory } from "@/lib/colors";
import {
  invoiceDisplayStatus,
  type InvoiceDisplayStatus,
  type InvoiceSummary,
} from "@/features/invoices";

const CATEGORIES: Record<InvoiceDisplayStatus, StatusCategory> = {
  DRAFT: "neutral",
  ISSUED: "progress",
  OVERDUE: "danger",
  PAID: "success",
  CANCELLED: "warning",
  CREDIT_NOTE: "info",
};

export function InvoiceStatusBadge({
  invoice,
  className,
}: {
  invoice: Pick<InvoiceSummary, "type" | "status" | "overdue">;
  className?: string;
}) {
  const { t } = useTranslation();
  const status = invoiceDisplayStatus(invoice);
  return (
    <StatusBadge
      label={t(`invoices.status.${status}`)}
      category={CATEGORIES[status]}
      className={className}
    />
  );
}
