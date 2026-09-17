import { http } from "@/lib/http";
import type {
  SubscriptionInvoice,
  SubscriptionInvoiceCreateInput,
  SubscriptionInvoiceUpdateInput,
} from "./types";
import { PDF_MIME_TYPE } from "./types";

const RESOURCE = "/subscription-invoices";
const PDF_TIMEOUT = 60_000;

function pathId(id: string): string {
  return encodeURIComponent(id.trim());
}

function stripDataUrl(base64: string): string {
  const comma = base64.indexOf(",");
  return base64.startsWith("data:") && comma >= 0
    ? base64.slice(comma + 1)
    : base64;
}

function updateBody(input: SubscriptionInvoiceUpdateInput) {
  const body: Record<string, unknown> = {};
  if (input.dateFacture !== undefined) body.dateFacture = input.dateFacture;
  if (input.montantTTC !== undefined) body.montantTTC = input.montantTTC;
  if (input.isPaid !== undefined) body.isPaid = input.isPaid;
  if (input.pdfBase64 !== undefined) {
    body.pdfBase64 = stripDataUrl(input.pdfBase64);
  }
  return body;
}

export const subscriptionInvoicesApi = {
  list: () =>
    http.get<SubscriptionInvoice[]>(RESOURCE, { handleUnauthorized: false }),

  pdf: (id: string) =>
    http.blob(`${RESOURCE}/${pathId(id)}/pdf`, {
      headers: { Accept: PDF_MIME_TYPE },
      timeoutMs: PDF_TIMEOUT,
      handleUnauthorized: false,
    }),
};

export const hyperSubscriptionInvoicesApi = {
  listByAccount: (accountId: string) =>
    http.get<SubscriptionInvoice[]>(`${RESOURCE}/account/${pathId(accountId)}`),

  create: (input: SubscriptionInvoiceCreateInput) =>
    http.post<SubscriptionInvoice>(
      RESOURCE,
      {
        dateFacture: input.dateFacture,
        montantTTC: input.montantTTC,
        accountId: input.accountId,
        pdfBase64: stripDataUrl(input.pdfBase64),
        isPaid: input.isPaid ?? false,
      },
      { timeoutMs: PDF_TIMEOUT }
    ),

  update: (id: string, input: SubscriptionInvoiceUpdateInput) =>
    http.put<SubscriptionInvoice>(
      `${RESOURCE}/${pathId(id)}`,
      updateBody(input),
      {
        timeoutMs: PDF_TIMEOUT,
      }
    ),

  remove: (id: string) => http.delete<string>(`${RESOURCE}/${pathId(id)}`),
};
