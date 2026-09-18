import type { CommandScope, CommandSearchInput } from "./types";

export const commandKeys = {
  all: ["commands"] as const,
  byDates: () => [...commandKeys.all, "by-date"] as const,
  byDate: (date: string) => [...commandKeys.byDates(), date] as const,
  unassignedCounts: () => [...commandKeys.all, "unassigned-count"] as const,
  unassignedCount: (date: string) =>
    [...commandKeys.unassignedCounts(), date] as const,
  details: () => [...commandKeys.all, "detail"] as const,
  detail: (id: string) => [...commandKeys.details(), id] as const,
  history: (id: string) => [...commandKeys.all, "history", id] as const,
  souffranceFlag: (id: string) =>
    [...commandKeys.all, "souffrance-flag", id] as const,
  searches: () => [...commandKeys.all, "search"] as const,
  search: (scope: CommandScope, input: CommandSearchInput) =>
    [...commandKeys.searches(), scope, input] as const,
  lastByClient: (clientId: string) =>
    [...commandKeys.all, "last-by-client", clientId] as const,
};
