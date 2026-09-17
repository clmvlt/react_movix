import { http } from "@/lib/http";
import type {
  Invoice,
  InvoiceGenerateInput,
  InvoiceGenerateResult,
  InvoiceListFilters,
  InvoicePage,
  InvoiceUpdateInput,
} from "./types";

const RESOURCE = "/invoices";
const GENERATE_TIMEOUT = 120_000;
const PDF_TIMEOUT = 60_000;

function pathId(id: string): string {
  return encodeURIComponent(id.trim());
}

export const invoicesApi = {
  list: (filters: InvoiceListFilters) =>
    http.get<InvoicePage>(RESOURCE, {
      query: {
        status: filters.status,
        type: filters.type,
        customerId: filters.customerId,
        from: filters.from,
        to: filters.to,
        commandId: filters.commandId,
        tourId: filters.tourId,
        page: filters.page,
        size: filters.size,
      },
    }),

  get: (id: string) => http.get<Invoice>(`${RESOURCE}/${pathId(id)}`),

  generate: (input: InvoiceGenerateInput) =>
    http.post<InvoiceGenerateResult>(`${RESOURCE}/generate`, input, {
      timeoutMs: GENERATE_TIMEOUT,
    }),

  create: (customerId: string) =>
    http.post<Invoice>(RESOURCE, { customerId }),

  update: (id: string, input: InvoiceUpdateInput) =>
    http.put<Invoice>(`${RESOURCE}/${pathId(id)}`, input),

  remove: (id: string) => http.delete<void>(`${RESOURCE}/${pathId(id)}`),

  issue: (id: string) => http.post<Invoice>(`${RESOURCE}/${pathId(id)}/issue`),

  markPaid: (id: string, paidAt: string | null) =>
    http.post<Invoice>(`${RESOURCE}/${pathId(id)}/payment`, {
      paidAt: paidAt || undefined,
    }),

  cancelPayment: (id: string) =>
    http.delete<Invoice>(`${RESOURCE}/${pathId(id)}/payment`),

  creditNote: (id: string, reason: string | null) =>
    http.post<Invoice>(`${RESOURCE}/${pathId(id)}/credit-note`, {
      reason: reason || undefined,
    }),

  pdf: (id: string) =>
    http.blob(`${RESOURCE}/${pathId(id)}/pdf`, {
      headers: { Accept: "application/pdf" },
      timeoutMs: PDF_TIMEOUT,
    }),
};
