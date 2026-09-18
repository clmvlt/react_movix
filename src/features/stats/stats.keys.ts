import type { StatsFilters } from "./types";

function filterKey(filters: StatsFilters) {
  return [
    filters.startDate,
    filters.endDate,
    filters.pharmacyCip ?? null,
    filters.tourId ?? null,
    filters.profilId ?? null,
  ] as const;
}

export const statsKeys = {
  all: ["stats"] as const,
  overview: (filters: StatsFilters) =>
    [...statsKeys.all, "overview", ...filterKey(filters)] as const,
  byClient: (filters: StatsFilters) =>
    [...statsKeys.all, "by-pharmacy", ...filterKey(filters)] as const,
  byDay: (filters: StatsFilters) =>
    [...statsKeys.all, "by-day", ...filterKey(filters)] as const,
};
