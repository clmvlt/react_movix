import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { statsApi } from "./stats.api";
import { statsKeys } from "./stats.keys";
import type { PharmacyStatsParams, StatsFilters } from "./types";

const IDLE_FILTERS: StatsFilters = { startDate: "", endDate: "" };

export function buildStatsFilters(params: PharmacyStatsParams): StatsFilters {
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

export function useStatsByPharmacy(filters: StatsFilters | null) {
  return useQuery({
    queryKey: statsKeys.byPharmacy(filters ?? IDLE_FILTERS),
    queryFn: ({ signal }) =>
      statsApi.byPharmacy(filters as StatsFilters, signal),
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
