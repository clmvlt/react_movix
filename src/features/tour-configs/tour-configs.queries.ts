import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tourConfigsApi } from "./tour-configs.api";
import { tourConfigKeys } from "./tour-configs.keys";
import type { TourConfigCreateInput, TourConfigUpdateInput } from "./types";

const LIST_STALE_TIME = 60_000;

export function useTourConfigs(enabled = true) {
  return useQuery({
    queryKey: tourConfigKeys.lists(),
    queryFn: () => tourConfigsApi.list(),
    enabled,
    retry: false,
    staleTime: LIST_STALE_TIME,
  });
}

export function useTourConfig(id: string | null, enabled = true) {
  return useQuery({
    queryKey: tourConfigKeys.detail(id ?? ""),
    queryFn: () => tourConfigsApi.get(id as string),
    enabled: enabled && Boolean(id),
    retry: false,
  });
}

export function useCreateTourConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TourConfigCreateInput) => tourConfigsApi.create(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: tourConfigKeys.lists() }),
  });
}

export function useUpdateTourConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: TourConfigUpdateInput;
    }) => tourConfigsApi.update(id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: tourConfigKeys.all }),
  });
}

export function useDeleteTourConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tourConfigsApi.remove(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: tourConfigKeys.lists() }),
  });
}
