import type { AddressSearchParams } from "./types";

export const orsKeys = {
  all: ["ors"] as const,
  status: () => [...orsKeys.all, "status"] as const,
  routingStatus: () => [...orsKeys.all, "routing", "status"] as const,
  geocodingStatus: () => [...orsKeys.all, "geocoding", "status"] as const,
  search: () => [...orsKeys.all, "geocoding", "search"] as const,
  searchQuery: (params: AddressSearchParams) =>
    [...orsKeys.search(), params] as const,
};
