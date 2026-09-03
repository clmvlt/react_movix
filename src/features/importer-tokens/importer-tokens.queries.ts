import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { importerTokensApi } from "./importer-tokens.api";
import { importerTokenKeys } from "./importer-tokens.keys";
import {
  sortImporterTokens,
  type ImporterToken,
  type ImporterTokenCreateInput,
  type ImporterTokenUpdateInput,
} from "./types";

const LIST_STALE_TIME = 60_000;

export function useImporterTokens(enabled = true) {
  return useQuery({
    queryKey: importerTokenKeys.lists(),
    queryFn: async () => sortImporterTokens(await importerTokensApi.list()),
    enabled,
    retry: false,
    staleTime: LIST_STALE_TIME,
  });
}

export function useCreateImporterToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ImporterTokenCreateInput) =>
      importerTokensApi.create(input),
    onSuccess: (created) => {
      queryClient.setQueryData<ImporterToken[]>(
        importerTokenKeys.lists(),
        (previous) =>
          previous ? sortImporterTokens([...previous, created]) : [created]
      );
    },
  });
}

export function useUpdateImporterToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: ImporterTokenUpdateInput;
    }) => importerTokensApi.update(id, input),
    onSuccess: (updated) => {
      queryClient.setQueryData<ImporterToken[]>(
        importerTokenKeys.lists(),
        (previous) =>
          previous
            ? sortImporterTokens(
                previous.map((token) =>
                  token.id === updated.id ? updated : token
                )
              )
            : [updated]
      );
    },
  });
}

export function useDeleteImporterToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => importerTokensApi.remove(id),
    onSuccess: (_result, id) => {
      queryClient.setQueryData<ImporterToken[]>(
        importerTokenKeys.lists(),
        (previous) => previous?.filter((token) => token.id !== id)
      );
    },
  });
}
