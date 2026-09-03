import type { AnomalyListInput, AnomalySearchInput } from "./types";

export const anomalyKeys = {
  all: ["anomalies"] as const,
  types: () => [...anomalyKeys.all, "types"] as const,
  lists: () => [...anomalyKeys.all, "list"] as const,
  list: (input: AnomalyListInput) => [...anomalyKeys.lists(), input] as const,
  searches: () => [...anomalyKeys.all, "search"] as const,
  search: (input: AnomalySearchInput) =>
    [...anomalyKeys.searches(), input] as const,
  details: () => [...anomalyKeys.all, "detail"] as const,
  detail: (id: string) => [...anomalyKeys.details(), id] as const,
};
