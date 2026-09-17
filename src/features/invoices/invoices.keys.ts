import type { InvoiceGenerateResult, InvoiceListFilters } from "./types";

export const invoiceKeys = {
  all: ["invoices"] as const,
  lists: () => [...invoiceKeys.all, "list"] as const,
  list: (filters: InvoiceListFilters) =>
    [...invoiceKeys.lists(), filters] as const,
  details: () => [...invoiceKeys.all, "detail"] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
  pdfs: () => [...invoiceKeys.all, "pdf"] as const,
  pdf: (id: string, version: string) =>
    [...invoiceKeys.pdfs(), id, version] as const,
  generation: (id: string) => [...invoiceKeys.all, "generation", id] as const,
};

export type InvoiceGenerationNotice = Pick<
  InvoiceGenerateResult,
  "excludedCommands" | "unpricedCommands"
>;
