import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { zoneKeys } from "@/features/zones/zones.keys";
import { commandKeys } from "@/features/commands/commands.keys";
import { tourKeys } from "@/features/tours/tours.keys";
import { pharmacyReportKeys } from "@/features/pharmacy-reports/pharmacy-reports.keys";
import { pharmaciesApi } from "./pharmacies.api";
import { pharmacyKeys } from "./pharmacies.keys";
import type {
  PharmacyCreateInput,
  PharmacyDetail,
  PharmacySearchInput,
  PharmacyUpdateInput,
  PictureUploadInput,
} from "./types";

const EXISTS_STALE_TIME = 30_000;

function invalidatePicture(queryClient: QueryClient, cip: string) {
  void queryClient.invalidateQueries({ queryKey: pharmacyKeys.detail(cip) });
  void queryClient.invalidateQueries({ queryKey: pharmacyKeys.searches() });
}

export function usePharmacySearch(input: PharmacySearchInput | null) {
  return useQuery({
    queryKey: pharmacyKeys.search(input ?? ({ page: 0, size: 0 } as PharmacySearchInput)),
    queryFn: () => pharmaciesApi.search(input as PharmacySearchInput),
    enabled: input !== null,
    placeholderData: keepPreviousData,
  });
}

export function usePharmacy(cip: string | undefined) {
  return useQuery({
    queryKey: pharmacyKeys.detail(cip ?? ""),
    queryFn: () => pharmaciesApi.get(cip as string),
    enabled: Boolean(cip),
  });
}

export function usePharmacyExists(cip: string | null) {
  return useQuery({
    queryKey: pharmacyKeys.exists(cip ?? ""),
    queryFn: () => pharmaciesApi.exists(cip as string),
    enabled: Boolean(cip),
    staleTime: EXISTS_STALE_TIME,
    retry: false,
  });
}

export function useCreatePharmacy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PharmacyCreateInput) => pharmaciesApi.create(input),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: pharmacyKeys.all });
      void queryClient.invalidateQueries({ queryKey: zoneKeys.all });
    },
  });
}

export function useUpdatePharmacy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cip, input }: { cip: string; input: PharmacyUpdateInput }) =>
      pharmaciesApi.update(cip, input),
    onSuccess: (saved, { cip }) => {
      queryClient.setQueryData<PharmacyDetail>(pharmacyKeys.detail(cip), (prev) =>
        prev ? { ...prev, ...saved } : prev
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: pharmacyKeys.all });
      void queryClient.invalidateQueries({ queryKey: zoneKeys.all });
      void queryClient.invalidateQueries({ queryKey: commandKeys.all });
      void queryClient.invalidateQueries({ queryKey: tourKeys.all });
    },
  });
}

export function useAddPharmacyPicture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cip, input }: { cip: string; input: PictureUploadInput }) =>
      pharmaciesApi.addPicture(cip, input),
    onSettled: (_data, _error, variables) =>
      invalidatePicture(queryClient, variables.cip),
  });
}

export function useUpdatePharmacyPicture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      cip,
      id,
      input,
    }: {
      cip: string;
      id: string;
      input: PictureUploadInput;
    }) => pharmaciesApi.updatePicture(cip, id, input),
    onSettled: (_data, _error, variables) =>
      invalidatePicture(queryClient, variables.cip),
  });
}

export interface PictureUploadBatch {
  cip: string;
  items: PictureUploadInput[];
  onProgress?: (done: number) => void;
}

export interface PictureUploadOutcome {
  uploaded: number;
  failed: number;
}

export function useUploadPharmacyPictures() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      cip,
      items,
      onProgress,
    }: PictureUploadBatch): Promise<PictureUploadOutcome> => {
      let uploaded = 0;
      let failed = 0;
      for (const [index, item] of items.entries()) {
        onProgress?.(index);
        try {
          await pharmaciesApi.addPicture(cip, item);
          uploaded += 1;
        } catch {
          failed += 1;
        }
      }
      onProgress?.(items.length);
      return { uploaded, failed };
    },
    onSettled: (_data, _error, variables) =>
      invalidatePicture(queryClient, variables.cip),
  });
}

export function useReorderPharmacyPictures() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ cip, ids }: { cip: string; ids: string[] }) => {
      for (const [index, id] of ids.entries()) {
        await pharmaciesApi.updatePicture(cip, id, { displayOrder: index });
      }
    },
    onSettled: (_data, _error, variables) =>
      invalidatePicture(queryClient, variables.cip),
  });
}

export function useDeletePharmacyPicture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cip, id }: { cip: string; id: string }) =>
      pharmaciesApi.removePicture(cip, id),
    onSettled: (_data, _error, variables) =>
      invalidatePicture(queryClient, variables.cip),
  });
}

export function useTransferReportPicture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cip, pictureId }: { cip: string; pictureId: string }) =>
      pharmaciesApi.transferReportPicture(cip, pictureId),
    onSettled: (_data, _error, variables) => {
      invalidatePicture(queryClient, variables.cip);
      void queryClient.invalidateQueries({ queryKey: pharmacyReportKeys.all });
    },
  });
}

export function useDetachPharmacies() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cips: string[]) => pharmaciesApi.detachFromZone(cips),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: pharmacyKeys.all });
      void queryClient.invalidateQueries({ queryKey: zoneKeys.all });
    },
  });
}
