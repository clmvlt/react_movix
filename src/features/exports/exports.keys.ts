import type { TourExportParams } from "./types";

export const exportKeys = {
  all: ["exports"] as const,
  tours: (params: TourExportParams) =>
    [
      ...exportKeys.all,
      "tours",
      params.startDate,
      params.endDate,
      params.closedOnly,
    ] as const,
};
