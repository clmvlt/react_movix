import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { labelSettingsApi } from "./label-settings.api";
import { labelSettingsKeys } from "./label-settings.keys";
import { labelConfigSignature } from "./label-settings.config";
import type { LabelConfigPayload } from "./types";

const CATALOG_STALE_TIME = 30 * 60_000;
const SETTINGS_STALE_TIME = 60_000;
const PREVIEW_GC_TIME = 5 * 60_000;

export function useLabelFieldCatalog(enabled = true) {
  return useQuery({
    queryKey: labelSettingsKeys.catalog(),
    queryFn: () => labelSettingsApi.catalog(),
    enabled,
    retry: false,
    staleTime: CATALOG_STALE_TIME,
  });
}

export function useLabelSettings(enabled = true) {
  return useQuery({
    queryKey: labelSettingsKeys.settings(),
    queryFn: () => labelSettingsApi.get(),
    enabled,
    retry: false,
    staleTime: SETTINGS_STALE_TIME,
  });
}

export function useLabelPreview(config: LabelConfigPayload | null) {
  return useQuery({
    queryKey: labelSettingsKeys.preview(labelConfigSignature(config)),
    queryFn: ({ signal }) =>
      labelSettingsApi.preview(config as LabelConfigPayload, "png", signal),
    enabled: Boolean(config),
    retry: false,
    staleTime: Infinity,
    gcTime: PREVIEW_GC_TIME,
    placeholderData: keepPreviousData,
  });
}

export function useUpdateLabelSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: LabelConfigPayload) =>
      labelSettingsApi.update(config),
    onSuccess: (settings) => {
      queryClient.setQueryData(labelSettingsKeys.settings(), settings);
    },
  });
}

export function useResetLabelSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => labelSettingsApi.reset(),
    onSuccess: (settings) => {
      queryClient.setQueryData(labelSettingsKeys.settings(), settings);
    },
  });
}
