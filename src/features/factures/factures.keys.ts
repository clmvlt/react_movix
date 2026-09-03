export const factureKeys = {
  all: ["factures"] as const,
  lists: () => [...factureKeys.all, "list"] as const,
  byAccount: (accountId: string) =>
    [...factureKeys.all, "account", accountId] as const,
  pdf: (id: string) => [...factureKeys.all, "pdf", id] as const,
};
