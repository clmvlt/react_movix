import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pharmacyReportsApi } from "./pharmacy-reports.api";
import { pharmacyReportKeys } from "./pharmacy-reports.keys";

const LIST_STALE_TIME = 60_000;

export function usePharmacyReports() {
  return useQuery({
    queryKey: pharmacyReportKeys.lists(),
    queryFn: () => pharmacyReportsApi.list(),
    staleTime: LIST_STALE_TIME,
  });
}

export function useDeletePharmacyReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pharmacyReportsApi.remove(id),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: pharmacyReportKeys.all }),
  });
}
