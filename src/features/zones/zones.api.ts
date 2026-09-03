import { http, type Paged } from "@/lib/http";
import { chunk } from "@/lib/async";
import type { Pharmacy } from "@/features/pharmacies/types";
import type {
  Zone,
  ZoneInput,
  ZoneMapPharmacy,
  ZonePharmaciesParams,
} from "./types";
import { ZONE_ASSIGN_CHUNK } from "./types";

const RESOURCE = "/zones";
const MAP_TIMEOUT = 45_000;

function pathId(id: string): string {
  return id.trim().toLowerCase();
}

export const zonesApi = {
  list: () => http.get<Zone[]>(RESOURCE),

  map: () =>
    http.get<ZoneMapPharmacy[]>(`${RESOURCE}/map`, { timeoutMs: MAP_TIMEOUT }),

  pharmacies: (id: string, params: ZonePharmaciesParams) =>
    http.get<Paged<Pharmacy>>(`${RESOURCE}/${pathId(id)}/pharmacies`, {
      query: {
        page: params.page,
        size: params.size,
        search: params.search?.trim() || undefined,
      },
    }),

  create: (input: ZoneInput) =>
    http.post<Zone>(RESOURCE, { name: input.name.trim() }),

  update: (id: string, input: ZoneInput) =>
    http.put<Zone>(`${RESOURCE}/${pathId(id)}`, { name: input.name.trim() }),

  remove: (id: string) => http.delete<void>(`${RESOURCE}/${pathId(id)}`),

  assign: async (id: string, cips: string[]): Promise<void> => {
    for (const part of chunk(cips, ZONE_ASSIGN_CHUNK)) {
      await http.put<void>(`${RESOURCE}/assign/${pathId(id)}`, { CIPs: part });
    }
  },
};
