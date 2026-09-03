import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { anomaliesApi } from "./anomalies.api";
import { anomalyKeys } from "./anomalies.keys";
import type {
  AnomalyCommentInput,
  AnomalyEmailInput,
  AnomalyGenerateInput,
  AnomalySearchInput,
} from "./types";

export type AnomalyListMode = "list" | "search";

export function useAnomalies(input: AnomalySearchInput, mode: AnomalyListMode) {
  const listInput = { page: input.page, size: input.size };
  return useQuery({
    queryKey:
      mode === "search"
        ? anomalyKeys.search(input)
        : anomalyKeys.list(listInput),
    queryFn: () =>
      mode === "search"
        ? anomaliesApi.search(input)
        : anomaliesApi.list(listInput),
    placeholderData: keepPreviousData,
  });
}

const TYPES_STALE_TIME = 5 * 60_000;

export function useAnomalyTypes(enabled = true) {
  return useQuery({
    queryKey: anomalyKeys.types(),
    queryFn: () => anomaliesApi.types(),
    enabled,
    retry: false,
    staleTime: TYPES_STALE_TIME,
  });
}

export function useAnomaly(id: string | undefined) {
  return useQuery({
    queryKey: anomalyKeys.detail(id ?? ""),
    queryFn: () => anomaliesApi.get(id as string),
    enabled: Boolean(id),
    retry: false,
  });
}

export function useGenerateAnomaly() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AnomalyGenerateInput) => anomaliesApi.generate(input),
    onSuccess: (created) => {
      queryClient.setQueryData(anomalyKeys.detail(created.id), created);
      void queryClient.invalidateQueries({ queryKey: anomalyKeys.all });
    },
  });
}

export function useUpdateAnomalyComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: AnomalyCommentInput) =>
      anomaliesApi.updateComment(id, comment),
    onSuccess: (updated) => {
      queryClient.setQueryData(anomalyKeys.detail(updated.id), updated);
      void queryClient.invalidateQueries({ queryKey: anomalyKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: anomalyKeys.searches() });
    },
  });
}

export function useSendAnomalyEmail() {
  return useMutation({
    mutationFn: ({ id, emails }: AnomalyEmailInput) =>
      anomaliesApi.sendEmail(id, emails),
  });
}
