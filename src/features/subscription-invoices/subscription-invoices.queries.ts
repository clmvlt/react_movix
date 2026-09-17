import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  subscriptionInvoicesApi,
  hyperSubscriptionInvoicesApi,
} from "./subscription-invoices.api";
import { subscriptionInvoiceKeys } from "./subscription-invoices.keys";
import {
  sortSubscriptionInvoices,
  type SubscriptionInvoice,
  type SubscriptionInvoiceCreateInput,
  type SubscriptionInvoiceUpdateInput,
} from "./types";

const LIST_STALE_TIME = 60_000;

export function useSubscriptionInvoices(enabled = true) {
  return useQuery({
    queryKey: subscriptionInvoiceKeys.lists(),
    queryFn: async () =>
      sortSubscriptionInvoices(await subscriptionInvoicesApi.list()),
    enabled,
    retry: false,
    staleTime: LIST_STALE_TIME,
  });
}

export function useAccountSubscriptionInvoices(accountId: string | null) {
  return useQuery({
    queryKey: subscriptionInvoiceKeys.byAccount(accountId ?? ""),
    queryFn: async () =>
      sortSubscriptionInvoices(
        await hyperSubscriptionInvoicesApi.listByAccount(accountId as string)
      ),
    enabled: Boolean(accountId),
    retry: false,
    staleTime: LIST_STALE_TIME,
  });
}

export function useCreateSubscriptionInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SubscriptionInvoiceCreateInput) =>
      hyperSubscriptionInvoicesApi.create(input),
    onSuccess: (created, input) => {
      queryClient.setQueryData<SubscriptionInvoice[]>(
        subscriptionInvoiceKeys.byAccount(input.accountId),
        (previous) =>
          previous
            ? sortSubscriptionInvoices([...previous, created])
            : [created]
      );
    },
  });
}

export function useUpdateSubscriptionInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      accountId: string;
      input: SubscriptionInvoiceUpdateInput;
    }) => hyperSubscriptionInvoicesApi.update(id, input),
    onSuccess: (updated, { accountId }) => {
      queryClient.setQueryData<SubscriptionInvoice[]>(
        subscriptionInvoiceKeys.byAccount(accountId),
        (previous) =>
          previous
            ? sortSubscriptionInvoices(
                previous.map((invoice) =>
                  invoice.id === updated.id ? updated : invoice
                )
              )
            : [updated]
      );
      queryClient.removeQueries({
        queryKey: subscriptionInvoiceKeys.pdf(updated.id),
      });
    },
  });
}

export function useDeleteSubscriptionInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; accountId: string }) =>
      hyperSubscriptionInvoicesApi.remove(id),
    onSuccess: (_result, { id, accountId }) => {
      queryClient.setQueryData<SubscriptionInvoice[]>(
        subscriptionInvoiceKeys.byAccount(accountId),
        (previous) => previous?.filter((invoice) => invoice.id !== id)
      );
      queryClient.removeQueries({ queryKey: subscriptionInvoiceKeys.pdf(id) });
    },
  });
}
