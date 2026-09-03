import type { ZonePharmaciesParams } from "./types";

export const zoneKeys = {
  all: ["zones"] as const,
  lists: () => [...zoneKeys.all, "list"] as const,
  map: () => [...zoneKeys.all, "map"] as const,
  pharmacies: (id: string) => [...zoneKeys.all, id, "pharmacies"] as const,
  pharmaciesPage: (id: string, params: ZonePharmaciesParams) =>
    [...zoneKeys.pharmacies(id), params] as const,
};
