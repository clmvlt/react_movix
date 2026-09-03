import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { pharmacyKeys } from "@/features/pharmacies/pharmacies.keys";
import { tourKeys } from "@/features/tours/tours.keys";
import { zonesApi } from "./zones.api";
import { zoneKeys } from "./zones.keys";
import type {
  ZoneAssignResult,
  ZoneInput,
  ZoneMapPharmacy,
  ZonePharmaciesParams,
} from "./types";

const LIST_STALE_TIME = 60_000;
const MAP_STALE_TIME = 5 * 60_000;
const MAP_GC_TIME = 15 * 60_000;

function invalidateZonePharmacies(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    predicate: (query) =>
      query.queryKey[0] === "zones" && query.queryKey[2] === "pharmacies",
  });
}

export function useZones() {
  return useQuery({
    queryKey: zoneKeys.lists(),
    queryFn: () => zonesApi.list(),
    staleTime: LIST_STALE_TIME,
  });
}

export function useZonesMap() {
  return useQuery({
    queryKey: zoneKeys.map(),
    queryFn: () => zonesApi.map(),
    staleTime: MAP_STALE_TIME,
    gcTime: MAP_GC_TIME,
  });
}

export function useZonePharmacies(
  id: string | null,
  params: ZonePharmaciesParams,
  enabled = true
) {
  return useQuery({
    queryKey: zoneKeys.pharmaciesPage(id ?? "", params),
    queryFn: () => zonesApi.pharmacies(id as string, params),
    enabled: enabled && Boolean(id),
    placeholderData: keepPreviousData,
  });
}

export function useCreateZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ZoneInput) => zonesApi.create(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: zoneKeys.lists() }),
  });
}

export function useRenameZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ZoneInput }) =>
      zonesApi.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: zoneKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: zoneKeys.map() });
    },
  });
}

export function useDeleteZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => zonesApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: zoneKeys.all });
      void queryClient.invalidateQueries({ queryKey: pharmacyKeys.all });
      void queryClient.invalidateQueries({ queryKey: tourKeys.all });
    },
  });
}

interface AssignVariables {
  zoneId: string;
  cips: string[];
}

interface AssignOutcome extends ZoneAssignResult {
  map: ZoneMapPharmacy[];
}

export function useAssignPharmaciesToZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      zoneId,
      cips,
    }: AssignVariables): Promise<AssignOutcome> => {
      await zonesApi.assign(zoneId, cips);

      const map = await zonesApi.map();
      const target = zoneId.trim().toLowerCase();
      const wanted = new Set(cips);
      const known = new Set(
        map.filter((entry) => wanted.has(entry.cip)).map((entry) => entry.cip)
      );
      const applied = map.filter(
        (entry) =>
          wanted.has(entry.cip) &&
          (entry.zoneId ?? "").trim().toLowerCase() === target
      ).length;

      return {
        requested: cips.length,
        applied,
        unknown: cips.length - known.size,
        map,
      };
    },
    onSuccess: (result) => {
      queryClient.setQueryData<ZoneMapPharmacy[]>(zoneKeys.map(), result.map);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: zoneKeys.lists() });
      void invalidateZonePharmacies(queryClient);
      void queryClient.invalidateQueries({ queryKey: pharmacyKeys.all });
    },
  });
}
