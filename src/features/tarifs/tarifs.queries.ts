import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tarifsApi } from "./tarifs.api";
import { tarifKeys } from "./tarifs.keys";
import { sortTarifs, type Tarif, type TarifInput } from "./types";

const LIST_STALE_TIME = 60_000;

export function useTarifs(enabled = true) {
  return useQuery({
    queryKey: tarifKeys.lists(),
    queryFn: async () => sortTarifs(await tarifsApi.list()),
    enabled,
    retry: false,
    staleTime: LIST_STALE_TIME,
  });
}

export function useCreateTarif() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TarifInput) => tarifsApi.create(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: tarifKeys.lists() }),
  });
}

export function useDeleteTarif() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tarifsApi.remove(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: tarifKeys.lists() }),
  });
}

export function useReplaceTarif() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: TarifInput;
    }): Promise<Tarif> => {
      const created = await tarifsApi.create(input);
      await tarifsApi.remove(id);
      return created;
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: tarifKeys.lists() }),
  });
}
