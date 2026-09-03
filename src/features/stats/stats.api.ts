import { http } from "@/lib/http";
import type {
  StatsByPharmacy,
  StatsDaily,
  StatsFilters,
  StatsOverview,
} from "./types";

const RESOURCE = "/stats";

export const statsApi = {
  overview: (filters: StatsFilters, signal?: AbortSignal) =>
    http.post<StatsOverview>(`${RESOURCE}/overview`, filters, { signal }),

  byPharmacy: (filters: StatsFilters, signal?: AbortSignal) =>
    http.post<StatsByPharmacy>(`${RESOURCE}/by-pharmacy`, filters, { signal }),

  byDay: (filters: StatsFilters, signal?: AbortSignal) =>
    http.post<StatsDaily>(`${RESOURCE}/by-day`, filters, { signal }),
};
