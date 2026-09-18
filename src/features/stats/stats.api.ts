import { http } from "@/lib/http";
import type {
  StatsByClient,
  StatsDaily,
  StatsFilters,
  StatsOverview,
} from "./types";

const RESOURCE = "/stats";

export const statsApi = {
  overview: (filters: StatsFilters, signal?: AbortSignal) =>
    http.post<StatsOverview>(`${RESOURCE}/overview`, filters, { signal }),

  byClient: (filters: StatsFilters, signal?: AbortSignal) =>
    http.post<StatsByClient>(`${RESOURCE}/by-pharmacy`, filters, { signal }),

  byDay: (filters: StatsFilters, signal?: AbortSignal) =>
    http.post<StatsDaily>(`${RESOURCE}/by-day`, filters, { signal }),
};
