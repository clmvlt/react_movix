import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { exportsApi } from "./exports.api";
import { exportKeys } from "./exports.keys";
import type { TourExportParams } from "./types";

const IDLE_PARAMS: TourExportParams = {
  startDate: "",
  endDate: "",
  closedOnly: false,
};

export function useTourExport(params: TourExportParams | null) {
  return useQuery({
    queryKey: exportKeys.tours(params ?? IDLE_PARAMS),
    queryFn: ({ signal }) =>
      exportsApi.tours(params as TourExportParams, signal),
    enabled: params !== null,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 30 * 60_000,
  });
}

export function useCancelTourExport() {
  const queryClient = useQueryClient();
  return useCallback(
    (params: TourExportParams) =>
      queryClient.cancelQueries({ queryKey: exportKeys.tours(params) }),
    [queryClient]
  );
}
