import { http } from "@/lib/http";
import { ApiError } from "@/lib/api-error";
import type { PharmacyReport } from "./types";

const RESOURCE = "/pharmacy-infos";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function pathId(id: string): string {
  const normalized = id.trim().toLowerCase();
  if (!UUID_PATTERN.test(normalized)) {
    throw new ApiError(400, "Invalid report id", null);
  }
  return normalized;
}

export const pharmacyReportsApi = {
  list: () => http.get<PharmacyReport[]>(RESOURCE),

  remove: (id: string) => http.delete<void>(`${RESOURCE}/${pathId(id)}`),
};
