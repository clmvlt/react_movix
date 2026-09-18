import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientReportsApi } from "./client-reports.api";
import { clientReportKeys } from "./client-reports.keys";

const LIST_STALE_TIME = 60_000;

export function useClientReports() {
  return useQuery({
    queryKey: clientReportKeys.lists(),
    queryFn: () => clientReportsApi.list(),
    staleTime: LIST_STALE_TIME,
  });
}

export function useDeleteClientReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientReportsApi.remove(id),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: clientReportKeys.all }),
  });
}
