import { http } from "@/lib/http";
import type {
  TourConfig,
  TourConfigCreateInput,
  TourConfigUpdateInput,
} from "./types";

const RESOURCE = "/tour-config";

function pathId(id: string): string {
  return encodeURIComponent(id.trim());
}

export const tourConfigsApi = {
  list: () => http.get<TourConfig[]>(RESOURCE),

  get: (id: string) => http.get<TourConfig>(`${RESOURCE}/${pathId(id)}`),

  create: (input: TourConfigCreateInput) =>
    http.post<TourConfig>(RESOURCE, input),

  update: (id: string, input: TourConfigUpdateInput) =>
    http.put<TourConfig>(`${RESOURCE}/${pathId(id)}`, input),

  remove: (id: string) => http.delete<string>(`${RESOURCE}/${pathId(id)}`),
};
