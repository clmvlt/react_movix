import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api-error";
import { updatesApi, type UploadUpdateInput } from "./updates.api";
import { updateKeys } from "./updates.keys";
import type { MobileUpdate, MobileUpdateEdit } from "./types";

const STALE_TIME = 5 * 60_000;

export function useLatestUpdate() {
  return useQuery({
    queryKey: updateKeys.latest(),
    queryFn: async (): Promise<MobileUpdate | null> => {
      try {
        return await updatesApi.latest();
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
    staleTime: STALE_TIME,
  });
}

export function useMobileUpdates(enabled = true) {
  return useQuery({
    queryKey: updateKeys.lists(),
    queryFn: () => updatesApi.list(),
    enabled,
    staleTime: STALE_TIME,
  });
}

export function useUploadMobileUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UploadUpdateInput) => updatesApi.upload(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: updateKeys.all });
    },
  });
}

export function useEditMobileUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      version,
      ...body
    }: MobileUpdateEdit & { version: string }) =>
      updatesApi.edit(version, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: updateKeys.all });
    },
  });
}

export function useDeleteMobileUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (version: string) => updatesApi.remove(version),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: updateKeys.all });
    },
  });
}
