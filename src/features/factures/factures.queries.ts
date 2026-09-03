import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { facturesApi, hyperFacturesApi } from "./factures.api";
import { factureKeys } from "./factures.keys";
import {
  sortFactures,
  type Facture,
  type FactureCreateInput,
  type FactureUpdateInput,
} from "./types";

const LIST_STALE_TIME = 60_000;

export function useFactures(enabled = true) {
  return useQuery({
    queryKey: factureKeys.lists(),
    queryFn: async () => sortFactures(await facturesApi.list()),
    enabled,
    retry: false,
    staleTime: LIST_STALE_TIME,
  });
}

export function useAccountFactures(accountId: string | null) {
  return useQuery({
    queryKey: factureKeys.byAccount(accountId ?? ""),
    queryFn: async () =>
      sortFactures(await hyperFacturesApi.listByAccount(accountId as string)),
    enabled: Boolean(accountId),
    retry: false,
    staleTime: LIST_STALE_TIME,
  });
}

export function useCreateFacture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: FactureCreateInput) => hyperFacturesApi.create(input),
    onSuccess: (created, input) => {
      queryClient.setQueryData<Facture[]>(
        factureKeys.byAccount(input.accountId),
        (previous) =>
          previous ? sortFactures([...previous, created]) : [created]
      );
    },
  });
}

export function useUpdateFacture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      accountId: string;
      input: FactureUpdateInput;
    }) => hyperFacturesApi.update(id, input),
    onSuccess: (updated, { accountId }) => {
      queryClient.setQueryData<Facture[]>(
        factureKeys.byAccount(accountId),
        (previous) =>
          previous
            ? sortFactures(
                previous.map((facture) =>
                  facture.id === updated.id ? updated : facture
                )
              )
            : [updated]
      );
      queryClient.removeQueries({ queryKey: factureKeys.pdf(updated.id) });
    },
  });
}

export function useDeleteFacture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; accountId: string }) =>
      hyperFacturesApi.remove(id),
    onSuccess: (_result, { id, accountId }) => {
      queryClient.setQueryData<Facture[]>(
        factureKeys.byAccount(accountId),
        (previous) => previous?.filter((facture) => facture.id !== id)
      );
      queryClient.removeQueries({ queryKey: factureKeys.pdf(id) });
    },
  });
}
