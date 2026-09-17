import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { invoicesApi } from "./invoices.api";
import { invoiceKeys, type InvoiceGenerationNotice } from "./invoices.keys";
import type {
  Invoice,
  InvoiceGenerateInput,
  InvoiceListFilters,
  InvoiceUpdateInput,
} from "./types";

const LIST_STALE_TIME = 30_000;

function storeInvoice(queryClient: QueryClient, invoice: Invoice) {
  queryClient.setQueryData(invoiceKeys.detail(invoice.id), invoice);
  queryClient.removeQueries({ queryKey: [...invoiceKeys.pdfs(), invoice.id] });
  void queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
}

export function useInvoices(filters: InvoiceListFilters, enabled = true) {
  return useQuery({
    queryKey: invoiceKeys.list(filters),
    queryFn: () => invoicesApi.list(filters),
    enabled,
    retry: false,
    staleTime: LIST_STALE_TIME,
    placeholderData: (previous) => previous,
  });
}

export function useInvoicesOf(
  target: { tourId?: string | null; commandId?: string | null },
  enabled = true
) {
  const filters: InvoiceListFilters = {
    tourId: target.tourId ?? undefined,
    commandId: target.commandId ?? undefined,
    size: 20,
  };
  return useQuery({
    queryKey: invoiceKeys.list(filters),
    queryFn: () => invoicesApi.list(filters),
    enabled: enabled && Boolean(target.tourId || target.commandId),
    retry: false,
    staleTime: LIST_STALE_TIME,
  });
}

export function useInvoice(id: string | null | undefined) {
  return useQuery({
    queryKey: invoiceKeys.detail(id ?? ""),
    queryFn: () => invoicesApi.get(id as string),
    enabled: Boolean(id),
    retry: false,
  });
}

export function useInvoiceGenerationNotice(id: string | null | undefined) {
  const queryClient = useQueryClient();
  const query = useQuery<InvoiceGenerationNotice | null>({
    queryKey: invoiceKeys.generation(id ?? ""),
    queryFn: () => null,
    enabled: false,
    staleTime: Infinity,
    gcTime: 30 * 60_000,
  });
  const dismiss = () => {
    if (id) queryClient.setQueryData(invoiceKeys.generation(id), null);
  };
  return { notice: query.data ?? null, dismiss };
}

export function useGenerateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: InvoiceGenerateInput) => invoicesApi.generate(input),
    onSuccess: (result) => {
      storeInvoice(queryClient, result.invoice);
      const notice: InvoiceGenerationNotice = {
        excludedCommands: result.excludedCommands ?? [],
        unpricedCommands: result.unpricedCommands ?? [],
      };
      if (
        notice.excludedCommands.length > 0 ||
        notice.unpricedCommands.length > 0
      ) {
        queryClient.setQueryData(
          invoiceKeys.generation(result.invoice.id),
          notice
        );
      }
    },
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (customerId: string) => invoicesApi.create(customerId),
    onSuccess: (invoice) => storeInvoice(queryClient, invoice),
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: InvoiceUpdateInput }) =>
      invoicesApi.update(id, input),
    onSuccess: (invoice) => storeInvoice(queryClient, invoice),
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoicesApi.remove(id),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: invoiceKeys.detail(id) });
      queryClient.removeQueries({ queryKey: [...invoiceKeys.pdfs(), id] });
      queryClient.removeQueries({ queryKey: invoiceKeys.generation(id) });
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}

export function useIssueInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoicesApi.issue(id),
    onSuccess: (invoice) => storeInvoice(queryClient, invoice),
  });
}

export function useMarkInvoicePaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paidAt }: { id: string; paidAt: string | null }) =>
      invoicesApi.markPaid(id, paidAt),
    onSuccess: (invoice) => storeInvoice(queryClient, invoice),
  });
}

export function useCancelInvoicePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoicesApi.cancelPayment(id),
    onSuccess: (invoice) => storeInvoice(queryClient, invoice),
  });
}

export function useCreditInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string | null }) =>
      invoicesApi.creditNote(id, reason),
    onSuccess: (creditNote, { id }) => {
      storeInvoice(queryClient, creditNote);
      queryClient.removeQueries({ queryKey: [...invoiceKeys.pdfs(), id] });
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(id) });
    },
  });
}
