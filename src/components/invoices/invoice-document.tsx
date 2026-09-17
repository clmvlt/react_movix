import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CalendarDays,
  FileText,
  Package,
  StickyNote,
  UserRound,
  Building2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/date";
import {
  formatEuro,
  formatVatRate,
  type Invoice,
  type InvoiceParty,
} from "@/features/invoices";

function quantityText(value: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 3 }).format(
    value
  );
}

function PartyBlock({ party }: { party: InvoiceParty | null }) {
  const { t } = useTranslation();
  if (!party) {
    return <p className="text-sm text-muted-foreground">-</p>;
  }
  const place = [party.postalCode, party.city].filter(Boolean).join(" ");
  return (
    <div className="flex flex-col gap-0.5 text-sm">
      <span className="font-medium text-foreground">{party.name ?? "-"}</span>
      {party.address1 && <span>{party.address1}</span>}
      {party.address2 && <span>{party.address2}</span>}
      {(place || party.country) && (
        <span>{[place, party.country].filter(Boolean).join(", ")}</span>
      )}
      {party.siret && (
        <span className="text-xs text-muted-foreground">
          {t("invoices.party.siret", { value: party.siret })}
        </span>
      )}
      {party.vatNumber && (
        <span className="text-xs text-muted-foreground">
          {t("invoices.party.vat", { value: party.vatNumber })}
        </span>
      )}
      {party.email && (
        <span className="break-all text-xs text-muted-foreground">
          {party.email}
        </span>
      )}
    </div>
  );
}

function DateRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium tabular-nums text-foreground">
        {value || "-"}
      </dd>
    </div>
  );
}

export function InvoiceLinesCard({ invoice }: { invoice: Invoice }) {
  const { t } = useTranslation();
  const lines = [...invoice.lines].sort((a, b) => a.position - b.position);

  return (
    <SectionCard
      title={t("invoices.detail.lines")}
      icon={FileText}
      contentClassName="flex flex-col gap-4"
    >
      {lines.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
          {t("invoices.detail.noLines")}
        </p>
      ) : (
        <>
          <div className="hidden md:block">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead>{t("invoices.lines.description")}</TableHead>
                  <TableHead className="text-right">
                    {t("invoices.lines.quantity")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("invoices.lines.unitPriceHt")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("invoices.lines.vatRate")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("invoices.lines.totalHt")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="whitespace-pre-line py-2.5">
                      {line.description}
                    </TableCell>
                    <TableCell className="py-2.5 text-right tabular-nums">
                      {quantityText(line.quantity)}
                    </TableCell>
                    <TableCell className="py-2.5 text-right tabular-nums">
                      {formatEuro(line.unitPriceHt)}
                    </TableCell>
                    <TableCell className="py-2.5 text-right tabular-nums">
                      {line.vatRate == null ? "-" : formatVatRate(line.vatRate)}
                    </TableCell>
                    <TableCell className="py-2.5 text-right font-medium tabular-nums text-foreground">
                      {formatEuro(line.totalHt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border md:hidden">
            {lines.map((line) => (
              <li key={line.id} className="flex flex-col gap-1 p-3">
                <span className="whitespace-pre-line text-sm text-foreground">
                  {line.description}
                </span>
                <span className="flex items-end justify-between gap-2 text-xs text-muted-foreground">
                  <span className="tabular-nums">
                    {quantityText(line.quantity)} x {formatEuro(line.unitPriceHt)}
                    {line.vatRate != null && ` - ${formatVatRate(line.vatRate)}`}
                  </span>
                  <span className="shrink-0 text-sm font-medium tabular-nums text-foreground">
                    {formatEuro(line.totalHt)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <InvoiceTotals invoice={invoice} />
    </SectionCard>
  );
}

export function InvoiceTotals({ invoice }: { invoice: Invoice }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 sm:max-w-sm">
        {invoice.vatBreakdown.length > 0 && (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground">
                <th className="py-1 pr-3 text-left font-medium">
                  {t("invoices.vat.rate")}
                </th>
                <th className="py-1 pr-3 text-right font-medium">
                  {t("invoices.vat.base")}
                </th>
                <th className="py-1 text-right font-medium">
                  {t("invoices.vat.amount")}
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.vatBreakdown.map((row) => (
                <tr key={row.rate} className="border-t border-border">
                  <td className="py-1 pr-3 tabular-nums">
                    {formatVatRate(row.rate)}
                  </td>
                  <td className="py-1 pr-3 text-right tabular-nums">
                    {formatEuro(row.baseHt)}
                  </td>
                  <td className="py-1 text-right tabular-nums">
                    {formatEuro(row.vatAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <dl className="flex w-full flex-col gap-1 rounded-lg bg-muted/50 p-3 sm:w-64 sm:shrink-0">
        <DateRow
          label={t("invoices.totals.ht")}
          value={formatEuro(invoice.totalHt)}
        />
        <DateRow
          label={t("invoices.totals.vat")}
          value={formatEuro(invoice.totalVat)}
        />
        <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-border pt-2">
          <dt className="text-sm font-medium text-foreground">
            {t("invoices.totals.ttc")}
          </dt>
          <dd className="text-lg font-semibold tabular-nums text-foreground">
            {formatEuro(invoice.totalTtc)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function InvoiceSideCards({ invoice }: { invoice: Invoice }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language;
  const period =
    invoice.serviceStartDate || invoice.serviceEndDate
      ? t("invoices.detail.periodValue", {
          from: formatDate(invoice.serviceStartDate, lang) || "-",
          to: formatDate(invoice.serviceEndDate, lang) || "-",
        })
      : null;

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title={t("invoices.detail.dates")} icon={CalendarDays}>
        <dl className="flex flex-col gap-1.5">
          <DateRow
            label={t("invoices.fields.issueDate")}
            value={formatDate(invoice.issueDate, lang)}
          />
          <DateRow
            label={t("invoices.fields.dueDate")}
            value={formatDate(invoice.dueDate, lang)}
          />
          {invoice.paidAt && (
            <DateRow
              label={t("invoices.fields.paidAt")}
              value={formatDate(invoice.paidAt, lang)}
            />
          )}
          <DateRow label={t("invoices.fields.period")} value={period} />
          <DateRow
            label={t("invoices.fields.source")}
            value={t(`invoices.sources.${invoice.source}`)}
          />
        </dl>
        {(invoice.creditedInvoiceId || invoice.creditNoteId) && (
          <div className="mt-3 flex flex-col gap-1 border-t border-border pt-3 text-sm">
            {invoice.creditedInvoiceId && (
              <Link
                to={`/app/invoices/${invoice.creditedInvoiceId}`}
                className="inline-flex min-h-10 items-center font-medium text-primary underline-offset-2 hover:underline"
              >
                {t("invoices.detail.creditedInvoice", {
                  number: invoice.creditedInvoiceNumber ?? "",
                })}
              </Link>
            )}
            {invoice.creditNoteId && (
              <Link
                to={`/app/invoices/${invoice.creditNoteId}`}
                className="inline-flex min-h-10 items-center font-medium text-primary underline-offset-2 hover:underline"
              >
                {t("invoices.detail.creditNote", {
                  number: invoice.creditNoteNumber ?? "",
                })}
              </Link>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard title={t("invoices.detail.customer")} icon={UserRound}>
        <PartyBlock party={invoice.customer} />
      </SectionCard>

      <SectionCard title={t("invoices.detail.seller")} icon={Building2}>
        <PartyBlock party={invoice.seller} />
      </SectionCard>

      {invoice.notes && (
        <SectionCard title={t("invoices.fields.notes")} icon={StickyNote}>
          <p className="whitespace-pre-line text-sm text-foreground">
            {invoice.notes}
          </p>
        </SectionCard>
      )}

      {invoice.commands.length > 0 && (
        <SectionCard
          title={t("invoices.detail.commands", {
            count: invoice.commands.length,
          })}
          icon={Package}
        >
          <ul className="flex max-h-80 flex-col divide-y divide-border overflow-y-auto">
            {invoice.commands.map((command) => (
              <li
                key={command.commandId}
                className="flex items-center justify-between gap-2"
              >
                <Link
                  to={`/app/commands/${command.commandId}`}
                  className="flex min-h-10 min-w-0 items-center gap-2 text-sm text-primary hover:underline"
                >
                  <span className="truncate font-mono text-xs">
                    {command.commandId.slice(0, 8)}
                  </span>
                  {!command.active && (
                    <StatusBadge
                      label={t("invoices.detail.commandInactive")}
                      category="neutral"
                    />
                  )}
                </Link>
                <span className="shrink-0 text-sm tabular-nums text-foreground">
                  {formatEuro(command.amountHt)}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}
