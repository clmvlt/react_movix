import type { PharmacySearchInput } from "./types";

export const pharmacyKeys = {
  all: ["pharmacies"] as const,
  searches: () => [...pharmacyKeys.all, "search"] as const,
  search: (input: PharmacySearchInput) =>
    [...pharmacyKeys.searches(), input] as const,
  details: () => [...pharmacyKeys.all, "detail"] as const,
  detail: (cip: string) => [...pharmacyKeys.details(), cip] as const,
  exists: (cip: string) => [...pharmacyKeys.all, "exists", cip] as const,
};
