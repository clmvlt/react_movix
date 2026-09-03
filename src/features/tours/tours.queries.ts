import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { toursApi } from "./tours.api";
import { tourKeys } from "./tours.keys";
import type {
  TourAssignInput,
  TourCreateInput,
  TourOptimizeInput,
  TourStatusInput,
  TourUpdateInput,
  TourUpdateOrderInput,
} from "./types";

export function useToursByDate(date: string) {
  return useQuery({
    queryKey: tourKeys.byDate(date),
    queryFn: () => toursApi.byDate(date),
    enabled: Boolean(date),
    placeholderData: keepPreviousData,
  });
}

export function useTour(id: string | undefined) {
  return useQuery({
    queryKey: tourKeys.detail(id ?? ""),
    queryFn: () => toursApi.get(id as string),
    enabled: Boolean(id),
  });
}

export function useTourHistory(id: string | undefined) {
  return useQuery({
    queryKey: tourKeys.history(id ?? ""),
    queryFn: () => toursApi.history(id as string),
    enabled: Boolean(id),
  });
}

function invalidateTours(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: tourKeys.all });
}

export function useCreateTour() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TourCreateInput) => toursApi.create(input),
    onSuccess: () => invalidateTours(queryClient),
  });
}

export function useUpdateTour() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TourUpdateInput }) =>
      toursApi.update(id, input),
    onSuccess: () => invalidateTours(queryClient),
  });
}

export function useUpdateTourStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TourStatusInput) => toursApi.updateState(input),
    onSuccess: () => invalidateTours(queryClient),
  });
}

export function useTourRoute(id: string | undefined) {
  return useQuery({
    queryKey: tourKeys.route(id ?? ""),
    queryFn: () => toursApi.route(id as string),
    enabled: Boolean(id),
  });
}

export function useTourRoutePreview(
  id: string | undefined,
  order: string[],
  enabled: boolean
) {
  return useQuery({
    queryKey: tourKeys.routePreview(id ?? "", order.join("|")),
    queryFn: () =>
      toursApi.previewRoute(id as string, {
        commands: order.map((commandId, index) => ({
          commandId,
          tourOrder: index + 1,
        })),
      }),
    enabled: Boolean(id) && enabled && order.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
    gcTime: 5 * 60_000,
    retry: false,
  });
}

export function useRefreshTourRoute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => toursApi.refreshRoute(id),
    onSuccess: (route, id) => {
      queryClient.setQueryData(tourKeys.route(id), route);
      return invalidateTours(queryClient);
    },
  });
}

export function useOptimizeTour() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input?: TourOptimizeInput }) =>
      toursApi.optimize(id, input),
    onSuccess: (result, { id }) => {
      if (!result.applied) return;
      if (result.route) queryClient.setQueryData(tourKeys.route(id), result.route);
      return invalidateTours(queryClient);
    },
    retry: false,
  });
}

export function useUpdateTourOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TourUpdateOrderInput }) =>
      toursApi.updateOrder(id, input),
    onSuccess: (route, { id }) => {
      queryClient.setQueryData(tourKeys.route(id), route);
    },
  });
}

export function useAssignTour() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TourAssignInput }) =>
      toursApi.assign(id, input),
    onSuccess: () => invalidateTours(queryClient),
  });
}

export function useUnassignTour() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => toursApi.unassign(id),
    onSuccess: () => invalidateTours(queryClient),
  });
}

export function useDeleteTour() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => toursApi.remove(id),
    onSuccess: () => invalidateTours(queryClient),
  });
}
