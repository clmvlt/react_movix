import { http } from "@/lib/http";
import type { TourExportDTO, TourExportParams } from "./types";

const RESOURCE = "/tours";

export const TOUR_EXPORT_TIMEOUT_MS = 120_000;

export const exportsApi = {
  tours: (params: TourExportParams, signal?: AbortSignal) =>
    http.get<TourExportDTO>(`${RESOURCE}/export`, {
      query: {
        startDate: params.startDate,
        endDate: params.endDate,
        closedOnly: params.closedOnly,
      },
      signal,
      timeoutMs: TOUR_EXPORT_TIMEOUT_MS,
    }),
};
