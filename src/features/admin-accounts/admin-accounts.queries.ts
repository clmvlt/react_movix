import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { accountKeys } from "@/features/account/account.keys";
import { authKeys } from "@/features/auth/auth.keys";
import { adminAccountsApi } from "./admin-accounts.api";
import { adminAccountKeys } from "./admin-accounts.keys";
import type {
  AccountDeletionPreview,
  AccountDeletionRequest,
  AdminAccount,
  AdminAccountCreateInput,
  AdminAccountUpdateInput,
} from "./types";
import { normalizeAccountId } from "./types";

const LIST_STALE_TIME = 30_000;

function cacheAccount(queryClient: QueryClient, account: AdminAccount): void {
  queryClient.setQueryData(adminAccountKeys.detail(account.id), account);
  queryClient.setQueryData<AdminAccount[]>(
    adminAccountKeys.list(),
    (previous) =>
      previous?.map((entry) => (entry.id === account.id ? account : entry))
  );
}

function dropAccount(queryClient: QueryClient, accountId: string): void {
  const id = normalizeAccountId(accountId);
  queryClient.setQueryData<AdminAccount[]>(
    adminAccountKeys.list(),
    (previous) =>
      previous?.filter((entry) => normalizeAccountId(entry.id) !== id)
  );
  queryClient.removeQueries({ queryKey: adminAccountKeys.detail(accountId) });
  queryClient.removeQueries({ queryKey: adminAccountKeys.deletion(accountId) });
  void queryClient.invalidateQueries({ queryKey: accountKeys.list() });
  void queryClient.invalidateQueries({ queryKey: authKeys.me() });
}

export function useAdminAccounts(enabled = true) {
  return useQuery({
    queryKey: adminAccountKeys.list(),
    queryFn: () => adminAccountsApi.list(),
    enabled,
    staleTime: LIST_STALE_TIME,
  });
}

export function useAdminAccount(accountId: string | null) {
  return useQuery({
    queryKey: adminAccountKeys.detail(accountId ?? ""),
    queryFn: () => adminAccountsApi.detail(accountId as string),
    enabled: Boolean(accountId),
    retry: false,
  });
}

export function useCreateAdminAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminAccountCreateInput) =>
      adminAccountsApi.create(input),
    onSuccess: (account) => {
      queryClient.setQueryData(adminAccountKeys.detail(account.id), account);
      void queryClient.invalidateQueries({ queryKey: adminAccountKeys.list() });
      void queryClient.invalidateQueries({ queryKey: accountKeys.list() });
    },
  });
}

export function useUpdateAdminAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      input,
    }: {
      accountId: string;
      input: AdminAccountUpdateInput;
    }) => adminAccountsApi.update(accountId, input),
    onSuccess: (account) => {
      cacheAccount(queryClient, account);
      void queryClient.invalidateQueries({ queryKey: accountKeys.list() });
      void queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}

export function useSetAdminAccountStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      isActive,
    }: {
      accountId: string;
      isActive: boolean;
    }) => adminAccountsApi.setStatus(accountId, isActive),
    onSuccess: (account) => {
      cacheAccount(queryClient, account);
      void queryClient.invalidateQueries({ queryKey: accountKeys.list() });
      void queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}

export function useAccountDeletionPreview(
  accountId: string | null,
  enabled = true
) {
  return useQuery({
    queryKey: adminAccountKeys.deletion(accountId ?? ""),
    queryFn: () => adminAccountsApi.deletionPreview(accountId as string),
    enabled: Boolean(accountId) && enabled,
    retry: false,
    gcTime: 0,
  });
}

export function useAccountDeletionByToken(token: string) {
  return useQuery({
    queryKey: adminAccountKeys.deletionToken(token),
    queryFn: () => adminAccountsApi.deletionByToken(token),
    enabled: Boolean(token),
    retry: false,
    gcTime: 0,
  });
}

function applyPendingRequest(
  queryClient: QueryClient,
  accountId: string,
  request: AccountDeletionRequest | null
): void {
  queryClient.setQueryData<AccountDeletionPreview>(
    adminAccountKeys.deletion(accountId),
    (previous) => (previous ? { ...previous, pendingRequest: request } : previous)
  );
}

export function useRequestAccountDeletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (accountId: string) =>
      adminAccountsApi.requestDeletion(accountId),
    onSuccess: (request, accountId) => {
      applyPendingRequest(queryClient, accountId, request);
    },
  });
}

export function useResendAccountDeletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (accountId: string) =>
      adminAccountsApi.resendDeletion(accountId),
    onSuccess: (request, accountId) => {
      applyPendingRequest(queryClient, accountId, request);
    },
  });
}

export function useCancelAccountDeletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (accountId: string) =>
      adminAccountsApi.cancelDeletion(accountId),
    onSuccess: (_void, accountId) => {
      applyPendingRequest(queryClient, accountId, null);
    },
  });
}

export function useConfirmAccountDeletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => adminAccountsApi.confirmDeletion(token),
    onSuccess: (result) => {
      dropAccount(queryClient, result.accountId);
    },
  });
}
