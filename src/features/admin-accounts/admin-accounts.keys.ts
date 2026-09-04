import { normalizeAccountId } from "./types";

export const adminAccountKeys = {
  all: ["admin-accounts"] as const,
  list: () => [...adminAccountKeys.all, "list"] as const,
  detail: (accountId: string) =>
    [...adminAccountKeys.all, "detail", normalizeAccountId(accountId)] as const,
  deletion: (accountId: string) =>
    [...adminAccountKeys.all, "deletion", normalizeAccountId(accountId)] as const,
  deletionToken: (token: string) =>
    [...adminAccountKeys.all, "deletion-token", token] as const,
};
