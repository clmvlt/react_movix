import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { isTodayApiDate } from "@/lib/date";
import { dashboardApi } from "./dashboard.api";
import { dashboardKeys } from "./dashboard.keys";

const LIVE_REFETCH_MS = 60_000;

export function useDashboardSummary(date: string) {
  const live = isTodayApiDate(date);
  return useQuery({
    queryKey: dashboardKeys.summary(date),
    queryFn: ({ signal }) => dashboardApi.summary(date, signal),
    enabled: Boolean(date),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    refetchInterval: live ? LIVE_REFETCH_MS : false,
    refetchOnWindowFocus: live,
  });
}
