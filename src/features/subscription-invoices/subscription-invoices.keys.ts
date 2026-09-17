export const subscriptionInvoiceKeys = {
  all: ["subscription-invoices"] as const,
  lists: () => [...subscriptionInvoiceKeys.all, "list"] as const,
  byAccount: (accountId: string) =>
    [...subscriptionInvoiceKeys.all, "account", accountId] as const,
  pdf: (id: string) => [...subscriptionInvoiceKeys.all, "pdf", id] as const,
};
