import type { CommandScope, CommandSearchInput } from "./types";

export const commandKeys = {
  all: ["commands"] as const,
  byDate: (date: string) => [...commandKeys.all, "by-date", date] as const,
  details: () => [...commandKeys.all, "detail"] as const,
  detail: (id: string) => [...commandKeys.details(), id] as const,
  history: (id: string) => [...commandKeys.all, "history", id] as const,
  souffranceFlag: (id: string) =>
    [...commandKeys.all, "souffrance-flag", id] as const,
  searches: () => [...commandKeys.all, "search"] as const,
  search: (scope: CommandScope, input: CommandSearchInput) =>
    [...commandKeys.searches(), scope, input] as const,
  lastByPharmacy: (cip: string) =>
    [...commandKeys.all, "last-by-pharmacy", cip] as const,
};
