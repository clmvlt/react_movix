import { apiDateToDate } from "@/lib/date";

export interface Facture {
  id: string;
  pdfUrl?: string | null;
  dateFacture: string;
  montantTTC: number;
  isPaid: boolean;
  createdAt?: string | null;
  accountId?: string | null;
}

export interface FactureCreateInput {
  dateFacture: string;
  montantTTC: number;
  accountId: string;
  pdfBase64: string;
  isPaid?: boolean;
}

export interface FactureUpdateInput {
  dateFacture?: string;
  montantTTC?: number;
  isPaid?: boolean;
  pdfBase64?: string;
}

export const PDF_MAX_BYTES = 10 * 1024 * 1024;
export const PDF_MIME_TYPE = "application/pdf";

export type FacturePaidFilter = "all" | "paid" | "unpaid";

export function factureDate(facture: Facture): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}/.test(facture.dateFacture)) return null;
  return apiDateToDate(facture.dateFacture.slice(0, 10));
}

export function factureApiDate(facture: Facture): string {
  return facture.dateFacture.slice(0, 10);
}

export function sortFactures(factures: Facture[]): Facture[] {
  return [...factures].sort((a, b) =>
    factureApiDate(b).localeCompare(factureApiDate(a))
  );
}

export function formatMontant(value: number, lang = "en"): string {
  return new Intl.NumberFormat(lang.startsWith("fr") ? "fr-FR" : "en-GB", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function factureFileName(facture: Facture): string {
  return `facture_${factureApiDate(facture)}_${facture.id.slice(0, 8)}.pdf`;
}

export function sumMontants(factures: Facture[]): number {
  return factures.reduce((total, facture) => total + facture.montantTTC, 0);
}
