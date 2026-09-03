import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authKeys } from "@/features/auth/auth.keys";
import type { ProfilUpdateInput } from "@/features/profiles/types";
import { membersApi } from "./members.api";
import { memberKeys } from "./members.keys";
import type { AccountMemberAddInput } from "./types";

export function useAccountMembers(accountId: string | null) {
  return useQuery({
    queryKey: memberKeys.list(accountId ?? ""),
    queryFn: () => membersApi.list(accountId as string),
    enabled: Boolean(accountId),
  });
}

export function useAddAccountMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      input,
    }: {
      accountId: string;
      input: AccountMemberAddInput;
    }) => membersApi.add(accountId, input),
    onSuccess: (_membership, { accountId }) => {
      void queryClient.invalidateQueries({
        queryKey: memberKeys.list(accountId),
      });
    },
  });
}

export function useUpdateAccountMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      profilId,
      input,
    }: {
      accountId: string;
      profilId: string;
      input: ProfilUpdateInput;
    }) => membersApi.update(accountId, profilId, input),
    onSuccess: (_void, { accountId }) => {
      void queryClient.invalidateQueries({
        queryKey: memberKeys.list(accountId),
      });
      void queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}

export function useRemoveAccountMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      profilId,
    }: {
      accountId: string;
      profilId: string;
    }) => membersApi.remove(accountId, profilId),
    onSuccess: (_void, { accountId }) => {
      void queryClient.invalidateQueries({
        queryKey: memberKeys.list(accountId),
      });
      void queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}
