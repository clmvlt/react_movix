import { http } from "@/lib/http";
import type { Tarif, TarifInput } from "./types";

const RESOURCE = "/tarifs";

function pathId(id: string): string {
  return encodeURIComponent(id.trim());
}

export const tarifsApi = {
  list: () => http.get<Tarif[]>(RESOURCE),

  create: (input: TarifInput) =>
    http.post<Tarif>(RESOURCE, {
      kmMax: input.kmMax,
      prixEuro: input.prixEuro,
    }),

  remove: (id: string) => http.delete<void>(`${RESOURCE}/${pathId(id)}`),
};
