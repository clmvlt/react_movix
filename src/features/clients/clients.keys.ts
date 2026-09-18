import type { ClientListFilters, ClientSearchInput } from "./types";

export const clientKeys = {
  all: ["clients"] as const,
  lists: () => [...clientKeys.all, "list"] as const,
  list: (filters: ClientListFilters) =>
    [...clientKeys.lists(), filters] as const,
  searches: () => [...clientKeys.all, "search"] as const,
  search: (input: ClientSearchInput) =>
    [...clientKeys.searches(), input] as const,
  details: () => [...clientKeys.all, "detail"] as const,
  detail: (id: string) => [...clientKeys.details(), id] as const,
  byCip: (cip: string) => [...clientKeys.all, "by-cip", cip] as const,
  exists: (cip: string) => [...clientKeys.all, "exists", cip] as const,
  label: (id: string) => [...clientKeys.all, "label", id] as const,
};
