import { apiDateToDate } from "@/lib/date";

export interface SubscriptionInvoice {
  id: string;
  pdfUrl?: string | null;
  dateFacture: string;
  montantTTC: number;
  isPaid: boolean;
  createdAt?: string | null;
  accountId?: string | null;
}

export interface SubscriptionInvoiceCreateInput {
  dateFacture: string;
  montantTTC: number;
  accountId: string;
  pdfBase64: string;
  isPaid?: boolean;
}

export interface SubscriptionInvoiceUpdateInput {
  dateFacture?: string;
  montantTTC?: number;
  isPaid?: boolean;
  pdfBase64?: string;
}

export const PDF_MAX_BYTES = 10 * 1024 * 1024;
export const PDF_MIME_TYPE = "application/pdf";

export type SubscriptionInvoicePaidFilter = "all" | "paid" | "unpaid";

export function subscriptionInvoiceDate(
  invoice: SubscriptionInvoice
): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}/.test(invoice.dateFacture)) return null;
  return apiDateToDate(invoice.dateFacture.slice(0, 10));
}

export function subscriptionInvoiceApiDate(
  invoice: SubscriptionInvoice
): string {
  return invoice.dateFacture.slice(0, 10);
}

export function sortSubscriptionInvoices(
  invoices: SubscriptionInvoice[]
): SubscriptionInvoice[] {
  return [...invoices].sort((a, b) =>
    subscriptionInvoiceApiDate(b).localeCompare(subscriptionInvoiceApiDate(a))
  );
}

export function formatSubscriptionInvoiceAmount(
  value: number,
  lang = "en"
): string {
  return new Intl.NumberFormat(lang.startsWith("fr") ? "fr-FR" : "en-GB", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function subscriptionInvoiceFileName(
  invoice: SubscriptionInvoice
): string {
  return `movix_abonnement_${subscriptionInvoiceApiDate(invoice)}_${invoice.id.slice(0, 8)}.pdf`;
}

export function sumSubscriptionInvoiceAmounts(
  invoices: SubscriptionInvoice[]
): number {
  return invoices.reduce((total, invoice) => total + invoice.montantTTC, 0);
}
