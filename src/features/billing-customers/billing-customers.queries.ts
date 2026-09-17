import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { billingCustomersApi } from "./billing-customers.api";
import { billingCustomerKeys } from "./billing-customers.keys";
import type { BillingCustomer, BillingCustomerInput } from "./types";

const LIST_STALE_TIME = 30_000;

function storeCustomer(queryClient: QueryClient, customer: BillingCustomer) {
  queryClient.setQueryData(billingCustomerKeys.detail(customer.id), customer);
  void queryClient.invalidateQueries({
    queryKey: billingCustomerKeys.lists(),
  });
}

export function useBillingCustomers(search = "", enabled = true) {
  const term = search.trim();
  return useQuery({
    queryKey: billingCustomerKeys.list(term),
    queryFn: () => billingCustomersApi.list(term),
    enabled,
    retry: false,
    staleTime: LIST_STALE_TIME,
    placeholderData: (previous) => previous,
  });
}

export function useBillingCustomer(id: string | null | undefined) {
  return useQuery({
    queryKey: billingCustomerKeys.detail(id ?? ""),
    queryFn: () => billingCustomersApi.get(id as string),
    enabled: Boolean(id),
    retry: false,
  });
}

export function useCreateBillingCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BillingCustomerInput) =>
      billingCustomersApi.create(input),
    onSuccess: (customer) => storeCustomer(queryClient, customer),
  });
}

export function useUpdateBillingCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: BillingCustomerInput }) =>
      billingCustomersApi.update(id, input),
    onSuccess: (customer) => storeCustomer(queryClient, customer),
  });
}

export function useDeleteBillingCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => billingCustomersApi.remove(id),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: billingCustomerKeys.detail(id) });
      void queryClient.invalidateQueries({
        queryKey: billingCustomerKeys.lists(),
      });
    },
  });
}

export function useBillingCustomerFromPharmacy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pharmacyId: string) =>
      billingCustomersApi.fromPharmacy(pharmacyId),
    onSuccess: (customer) => storeCustomer(queryClient, customer),
  });
}
