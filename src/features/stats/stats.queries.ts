import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { statsApi } from "./stats.api";
import { statsKeys } from "./stats.keys";
import type { ClientStatsParams, StatsFilters } from "./types";

const IDLE_FILTERS: StatsFilters = { startDate: "", endDate: "" };

export function buildStatsFilters(params: ClientStatsParams): StatsFilters {
  return {
    startDate: params.startDate,
    endDate: params.endDate,
    pharmacyCip: params.pharmacyCip.trim() || null,
    profilId: params.profilId.trim() || null,
  };
}

export function useStatsOverview(filters: StatsFilters | null) {
  return useQuery({
    queryKey: statsKeys.overview(filters ?? IDLE_FILTERS),
    queryFn: ({ signal }) => statsApi.overview(filters as StatsFilters, signal),
    enabled: filters !== null,
    staleTime: 5 * 60_000,
  });
}

export function useStatsByClient(filters: StatsFilters | null) {
  return useQuery({
    queryKey: statsKeys.byClient(filters ?? IDLE_FILTERS),
    queryFn: ({ signal }) =>
      statsApi.byClient(filters as StatsFilters, signal),
    enabled: filters !== null,
    staleTime: 5 * 60_000,
  });
}

export function useStatsByDay(filters: StatsFilters | null) {
  return useQuery({
    queryKey: statsKeys.byDay(filters ?? IDLE_FILTERS),
    queryFn: ({ signal }) => statsApi.byDay(filters as StatsFilters, signal),
    enabled: filters !== null,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });
}
