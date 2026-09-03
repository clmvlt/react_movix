import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accountColorsApi } from "./account-colors.api";
import { accountColorKeys } from "./account-colors.keys";
import {
  sortAccountColors,
  type AccountColor,
  type AccountColorCreateInput,
  type AccountColorOrderEntry,
  type AccountColorUpdateInput,
} from "./types";

export function useAccountColors(enabled = true) {
  return useQuery({
    queryKey: accountColorKeys.list(),
    queryFn: () => accountColorsApi.list(),
    staleTime: Infinity,
    enabled,
  });
}

export function useCreateAccountColor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AccountColorCreateInput) =>
      accountColorsApi.create(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: accountColorKeys.all }),
  });
}

export function useUpdateAccountColor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AccountColorUpdateInput }) =>
      accountColorsApi.update(id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: accountColorKeys.all }),
  });
}

export function useDeleteAccountColor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountColorsApi.remove(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: accountColorKeys.all }),
  });
}

export function useReorderAccountColors() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entries: AccountColorOrderEntry[]) =>
      accountColorsApi.reorder(entries),
    onMutate: async (entries) => {
      await queryClient.cancelQueries({ queryKey: accountColorKeys.list() });
      const previous = queryClient.getQueryData<AccountColor[]>(
        accountColorKeys.list()
      );
      if (previous) {
        const orders = new Map(
          entries.map((entry) => [entry.id, entry.displayOrder])
        );
        queryClient.setQueryData(
          accountColorKeys.list(),
          sortAccountColors(
            previous.map((color) => {
              const displayOrder = orders.get(color.id);
              return displayOrder == null ? color : { ...color, displayOrder };
            })
          )
        );
      }
      return { previous };
    },
    onError: (_error, _entries, context) => {
      if (context?.previous) {
        queryClient.setQueryData(accountColorKeys.list(), context.previous);
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: accountColorKeys.all }),
  });
}
