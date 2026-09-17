import { ApiError } from "@/lib/api-error";

export const INVOICE_STATUSES = ["DRAFT", "ISSUED", "PAID", "CANCELLED"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_TYPES = ["INVOICE", "CREDIT_NOTE"] as const;
export type InvoiceType = (typeof INVOICE_TYPES)[number];

export type InvoiceSource = "COMMANDS" | "TOURS" | "MANUAL";

export type InvoiceLineMode = "DETAILED" | "GROUPED";

export const INVOICE_VAT_RATES = [20, 10, 8.5, 5.5, 2.1, 0.9, 0] as const;

export const INVOICE_PAGE_SIZE = 50;
export const INVOICE_NOTES_MAX = 2000;
export const INVOICE_LINE_DESCRIPTION_MAX = 500;
export const INVOICE_CREDIT_REASON_MAX = 500;

export type InvoiceDisplayStatus =
  | "DRAFT"
  | "ISSUED"
  | "OVERDUE"
  | "PAID"
  | "CANCELLED"
  | "CREDIT_NOTE";

export interface InvoiceSummary {
  id: string;
  type: InvoiceType;
  status: InvoiceStatus;
  source: InvoiceSource;
  number: string | null;
  customerId: string | null;
  customerName: string | null;
  issueDate: string | null;
  dueDate: string | null;
  paidAt: string | null;
  totalHt: number;
  totalTtc: number;
  overdue: boolean;
  createdAt: string | null;
}

export interface InvoiceParty {
  name: string | null;
  siret: string | null;
  vatNumber: string | null;
  address1: string | null;
  address2: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  email: string | null;
}

export interface InvoiceVatLine {
  rate: number;
  baseHt: number;
  vatAmount: number;
}

export interface InvoiceLine {
  id: string;
  position: number;
  description: string;
  quantity: number;
  unitPriceHt: number;
  vatRate: number | null;
  totalHt: number;
}

export interface InvoiceCommandLink {
  commandId: string;
  tourId: string | null;
  amountHt: number;
  active: boolean;
}

export interface Invoice extends InvoiceSummary {
  customer: InvoiceParty | null;
  seller: InvoiceParty | null;
  creditedInvoiceId: string | null;
  creditedInvoiceNumber: string | null;
  creditNoteId: string | null;
  creditNoteNumber: string | null;
  serviceStartDate: string | null;
  serviceEndDate: string | null;
  notes: string | null;
  totalVat: number;
  vatBreakdown: InvoiceVatLine[];
  lines: InvoiceLine[];
  commands: InvoiceCommandLink[];
}

export interface InvoicePage {
  items: InvoiceSummary[];
  total: number;
  page: number;
  size: number;
}

export interface InvoiceListFilters {
  status?: InvoiceStatus;
  type?: InvoiceType;
  customerId?: string;
  from?: string;
  to?: string;
  commandId?: string;
  tourId?: string;
  page?: number;
  size?: number;
}

export interface InvoiceGenerateInput {
  tourIds?: string[];
  commandIds?: string[];
  customerId?: string;
  lineMode?: InvoiceLineMode;
}

export interface InvoiceExcludedCommand {
  commandId: string;
  pharmacyName: string | null;
  invoiceId: string;
  invoiceNumber: string | null;
}

export interface InvoiceUnpricedCommand {
  commandId: string;
  pharmacyName: string | null;
  pharmacyCip: string | null;
}

export interface InvoiceGenerateResult {
  invoice: Invoice;
  excludedCommands: InvoiceExcludedCommand[];
  unpricedCommands: InvoiceUnpricedCommand[];
}

export interface InvoiceLineInput {
  description: string;
  quantity: number;
  unitPriceHt: number;
  vatRate: number | null;
}

export interface InvoiceUpdateInput {
  customerId: string;
  serviceStartDate: string | null;
  serviceEndDate: string | null;
  notes: string | null;
  lines: InvoiceLineInput[];
}

export interface InvoiceAlreadyInvoicedCommand {
  commandId: string;
  invoiceId: string;
  invoiceNumber: string | null;
}

export function invoiceDisplayStatus(
  invoice: Pick<InvoiceSummary, "type" | "status" | "overdue">
): InvoiceDisplayStatus {
  if (invoice.type === "CREDIT_NOTE") return "CREDIT_NOTE";
  if (invoice.status === "ISSUED" && invoice.overdue) return "OVERDUE";
  return invoice.status;
}

export function isInvoiceDraft(invoice: Pick<InvoiceSummary, "status">) {
  return invoice.status === "DRAFT";
}

export function formatEuro(value: number | null | undefined): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value ?? 0);
}

export function formatVatRate(rate: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(rate)} %`;
}

export function invoicePdfFilename(invoice: InvoiceSummary): string {
  const label = invoice.number ?? `brouillon_${invoice.id.slice(0, 8)}`;
  return `${label.replace(/[^\w.-]+/g, "_")}.pdf`;
}

function bodyOf(error: unknown): Record<string, unknown> | null {
  if (!(error instanceof ApiError)) return null;
  const body = error.body;
  return typeof body === "object" && body !== null
    ? (body as Record<string, unknown>)
    : null;
}

export function invoiceErrorCode(error: unknown): string | null {
  return error instanceof ApiError ? error.errorCode : null;
}

export function invoiceErrorMissingFields(error: unknown): string[] {
  const fields = bodyOf(error)?.missingFields;
  return Array.isArray(fields)
    ? fields.filter((field): field is string => typeof field === "string")
    : [];
}

export function invoiceErrorCustomerId(error: unknown): string | null {
  const id = bodyOf(error)?.customerId;
  return typeof id === "string" ? id : null;
}

export function invoiceErrorCommands(
  error: unknown
): InvoiceAlreadyInvoicedCommand[] {
  const commands = bodyOf(error)?.commands;
  if (!Array.isArray(commands)) return [];
  return commands.filter(
    (item): item is InvoiceAlreadyInvoicedCommand =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as InvoiceAlreadyInvoicedCommand).invoiceId === "string"
  );
}
