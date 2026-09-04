export const tourKeys = {
  all: ["tours"] as const,
  byDates: () => [...tourKeys.all, "by-date"] as const,
  byDate: (date: string) => [...tourKeys.byDates(), date] as const,
  details: () => [...tourKeys.all, "detail"] as const,
  detail: (id: string) => [...tourKeys.details(), id] as const,
  history: (id: string) => [...tourKeys.all, "history", id] as const,
  route: (id: string) => [...tourKeys.all, "route", id] as const,
  routePreview: (id: string, order: string) =>
    [...tourKeys.all, "route-preview", id, order] as const,
};
