import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authKeys } from "@/features/auth/auth.keys";
import { accountApi } from "./account.api";
import { accountKeys } from "./account.keys";
import type {
  AccountBilling,
  AccountBillingInput,
  AccountDetail,
  AccountUpdatePatch,
} from "./types";

const DETAIL_STALE_TIME = 60_000;
const DETAIL_GC_TIME = 5 * 60_000;

export function useAccountDetails(enabled = true) {
  return useQuery({
    queryKey: accountKeys.detail(),
    queryFn: () => accountApi.details(),
    enabled,
    retry: false,
    staleTime: DETAIL_STALE_TIME,
    gcTime: DETAIL_GC_TIME,
  });
}

export function useAllAccounts(enabled = true) {
  return useQuery({
    queryKey: accountKeys.list(),
    queryFn: () => accountApi.listAll(),
    enabled,
    retry: false,
    staleTime: DETAIL_STALE_TIME,
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: AccountUpdatePatch): Promise<AccountDetail> => {
      await accountApi.update(patch);

      return queryClient.fetchQuery<AccountDetail>({
        queryKey: accountKeys.detail(),
        queryFn: () => accountApi.details(),
        staleTime: 0,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
}

export function useAccountBilling(enabled = true) {
  return useQuery({
    queryKey: accountKeys.billing(),
    queryFn: () => accountApi.billing(),
    enabled,
    retry: false,
    staleTime: DETAIL_STALE_TIME,
  });
}

export function useUpdateAccountBilling() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AccountBillingInput) => accountApi.updateBilling(input),
    onSuccess: (billing) => {
      queryClient.setQueryData<AccountBilling>(accountKeys.billing(), billing);
    },
  });
}

export function useTestEmail() {
  return useMutation({
    mutationFn: () => accountApi.testEmail(),
  });
}
