import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Receipt } from "lucide-react";
import { useIsAdmin } from "@/components/admin-gate";
import { cn } from "@/lib/utils";
import { useInvoicesOf } from "@/features/invoices";

interface InvoicedBadgesProps {
  tourId?: string | null;
  commandId?: string | null;
  className?: string;
}

export function InvoicedBadges({
  tourId,
  commandId,
  className,
}: InvoicedBadgesProps) {
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();
  const query = useInvoicesOf({ tourId, commandId }, isAdmin);

  const invoices = (query.data?.items ?? []).filter(
    (invoice) => invoice.type === "INVOICE" && invoice.status !== "CANCELLED"
  );
  if (!isAdmin || invoices.length === 0) return null;

  return (
    <span className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {invoices.map((invoice) => (
        <Link
          key={invoice.id}
          to={`/app/invoices/${invoice.id}`}
          className="inline-flex min-h-8 items-center gap-1 rounded-full border border-border bg-card px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
        >
          <Receipt className="size-3.5 shrink-0 text-muted-foreground" />
          {invoice.number
            ? t("invoices.invoicedOn", { number: invoice.number })
            : t("invoices.invoicedDraft")}
        </Link>
      ))}
    </span>
  );
}
