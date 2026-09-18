import { http, type Paged } from "@/lib/http";
import type { Client } from "@/features/clients/types";
import type {
  Zone,
  ZoneClientsParams,
  ZoneInput,
  ZoneMapClient,
} from "./types";

const RESOURCE = "/zones";
const MAP_TIMEOUT = 45_000;

function pathId(id: string): string {
  return id.trim().toLowerCase();
}

export const zonesApi = {
  list: () => http.get<Zone[]>(RESOURCE),

  map: () =>
    http.get<ZoneMapClient[]>(`${RESOURCE}/map`, { timeoutMs: MAP_TIMEOUT }),

  clients: (id: string, params: ZoneClientsParams) =>
    http.get<Paged<Client>>(`${RESOURCE}/${pathId(id)}/clients`, {
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

};
