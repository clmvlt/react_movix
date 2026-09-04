import { http } from "@/lib/http";
import type {
  AccountDeletionPreview,
  AccountDeletionRequest,
  AccountDeletionResult,
  AdminAccount,
  AdminAccountCreateInput,
  AdminAccountUpdateInput,
} from "./types";
import { normalizeAccountId } from "./types";

const RESOURCE = "/admin/accounts";

function accountPath(accountId: string): string {
  return `${RESOURCE}/${encodeURIComponent(normalizeAccountId(accountId))}`;
}

export const adminAccountsApi = {
  list: () => http.get<AdminAccount[]>(RESOURCE),

  detail: (accountId: string) =>
    http.get<AdminAccount>(accountPath(accountId)),

  create: (input: AdminAccountCreateInput) =>
    http.post<AdminAccount>(RESOURCE, input),

  update: (accountId: string, input: AdminAccountUpdateInput) =>
    http.put<AdminAccount>(accountPath(accountId), input),

  setStatus: (accountId: string, isActive: boolean) =>
    http.put<AdminAccount>(`${accountPath(accountId)}/status`, { isActive }),

  deletionPreview: (accountId: string) =>
    http.get<AccountDeletionPreview>(`${accountPath(accountId)}/deletion`),

  requestDeletion: (accountId: string) =>
    http.post<AccountDeletionRequest>(`${accountPath(accountId)}/deletion`),

  resendDeletion: (accountId: string) =>
    http.post<AccountDeletionRequest>(
      `${accountPath(accountId)}/deletion/resend`
    ),

  cancelDeletion: (accountId: string) =>
    http.delete<void>(`${accountPath(accountId)}/deletion`),

  deletionByToken: (token: string) =>
    http.get<AccountDeletionPreview>(
      `${RESOURCE}/deletion/${encodeURIComponent(token)}`
    ),

  confirmDeletion: (token: string) =>
    http.post<AccountDeletionResult>(`${RESOURCE}/deletion/confirm`, { token }),
};
