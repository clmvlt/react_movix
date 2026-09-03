import { http } from "@/lib/http";
import type { DashboardSummary } from "./types";

const RESOURCE = "/dashboard";

export const dashboardApi = {
  summary: (date: string, signal?: AbortSignal) =>
    http.get<DashboardSummary>(`${RESOURCE}/summary`, {
      query: { date: date || undefined },
      signal,
    }),
};
