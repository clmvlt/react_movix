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
import { clientReportKeys } from "@/features/client-reports/client-reports.keys";
import { clientsApi } from "./clients.api";
import { clientKeys } from "./clients.keys";
import type {
  Client,
  ClientInput,
  ClientListFilters,
  ClientSearchInput,
  ClientZoneAssignInput,
  PictureUploadInput,
} from "./types";

const LIST_STALE_TIME = 30_000;

function storeClient(queryClient: QueryClient, client: Client) {
  queryClient.setQueryData<Client>(clientKeys.detail(client.id), (previous) =>
    previous ? { ...previous, ...client } : client
  );
  void queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
  void queryClient.invalidateQueries({ queryKey: clientKeys.searches() });
}

function invalidatePictures(queryClient: QueryClient, id: string) {
  void queryClient.invalidateQueries({ queryKey: clientKeys.detail(id) });
  void queryClient.invalidateQueries({ queryKey: clientKeys.searches() });
}

export function useClients(filters: ClientListFilters, enabled = true) {
  const normalized: ClientListFilters = {
    ...filters,
    search: filters.search.trim(),
  };
  return useQuery({
    queryKey: clientKeys.list(normalized),
    queryFn: () => clientsApi.list(normalized),
    enabled,
    retry: false,
    staleTime: LIST_STALE_TIME,
    placeholderData: (previous) => previous,
  });
}

export function useClientSearch(input: ClientSearchInput | null) {
  return useQuery({
    queryKey: clientKeys.search(
      input ?? ({ page: 0, size: 0 } as ClientSearchInput)
    ),
    queryFn: () => clientsApi.search(input as ClientSearchInput),
    enabled: input !== null,
    placeholderData: keepPreviousData,
  });
}

export function useClient(id: string | null | undefined) {
  return useQuery({
    queryKey: clientKeys.detail(id ?? ""),
    queryFn: () => clientsApi.get(id as string),
    enabled: Boolean(id),
    retry: false,
  });
}

export function useClientByCip(cip: string | null | undefined) {
  return useQuery({
    queryKey: clientKeys.byCip(cip ?? ""),
    queryFn: () => clientsApi.getByCip(cip as string),
    enabled: Boolean(cip),
    retry: false,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ClientInput) => clientsApi.create(input),
    onSuccess: (client) => storeClient(queryClient, client),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: zoneKeys.all });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ClientInput }) =>
      clientsApi.update(id, input),
    onSuccess: (client) => storeClient(queryClient, client),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: zoneKeys.all });
      void queryClient.invalidateQueries({ queryKey: commandKeys.all });
      void queryClient.invalidateQueries({ queryKey: tourKeys.all });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientsApi.remove(id),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: clientKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: clientKeys.searches() });
      void queryClient.invalidateQueries({ queryKey: zoneKeys.all });
    },
  });
}

export function useAddClientPicture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PictureUploadInput }) =>
      clientsApi.addPicture(id, input),
    onSettled: (_data, _error, variables) =>
      invalidatePictures(queryClient, variables.id),
  });
}

export function useUpdateClientPicture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      pictureId,
      input,
    }: {
      id: string;
      pictureId: string;
      input: PictureUploadInput;
    }) => clientsApi.updatePicture(id, pictureId, input),
    onSettled: (_data, _error, variables) =>
      invalidatePictures(queryClient, variables.id),
  });
}

export interface PictureUploadBatch {
  id: string;
  items: PictureUploadInput[];
  onProgress?: (done: number) => void;
}

export interface PictureUploadOutcome {
  uploaded: number;
  failed: number;
}

export function useUploadClientPictures() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      items,
      onProgress,
    }: PictureUploadBatch): Promise<PictureUploadOutcome> => {
      let uploaded = 0;
      let failed = 0;
      for (const [index, item] of items.entries()) {
        onProgress?.(index);
        try {
          await clientsApi.addPicture(id, item);
          uploaded += 1;
        } catch {
          failed += 1;
        }
      }
      onProgress?.(items.length);
      return { uploaded, failed };
    },
    onSettled: (_data, _error, variables) =>
      invalidatePictures(queryClient, variables.id),
  });
}

export function useReorderClientPictures() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, pictureIds }: { id: string; pictureIds: string[] }) =>
      clientsApi.reorderPictures(id, pictureIds),
    onSettled: (_data, _error, variables) =>
      invalidatePictures(queryClient, variables.id),
  });
}

export function useDeleteClientPicture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, pictureId }: { id: string; pictureId: string }) =>
      clientsApi.removePicture(id, pictureId),
    onSettled: (_data, _error, variables) =>
      invalidatePictures(queryClient, variables.id),
  });
}

export function useTransferReportPicture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      reportPictureId,
    }: {
      id: string;
      reportPictureId: string;
    }) => clientsApi.transferReportPicture(id, reportPictureId),
    onSettled: (_data, _error, variables) => {
      invalidatePictures(queryClient, variables.id);
      void queryClient.invalidateQueries({ queryKey: clientReportKeys.all });
    },
  });
}

export function useAssignClientsToZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ClientZoneAssignInput) => clientsApi.assignZone(input),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: clientKeys.all });
      void queryClient.invalidateQueries({ queryKey: zoneKeys.all });
    },
  });
}
