import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { commandsApi } from "./commands.api";
import { commandKeys } from "./commands.keys";
import type {
  CommandAssignBatchResult,
  CommandAssignGroup,
  CommandCreateInput,
  CommandIdsInput,
  CommandScope,
  CommandSearchInput,
  CommandStatusInput,
  CommandTarifInput,
  CommandUpdateInput,
} from "./types";

export function useExpeditions(date: string) {
  return useQuery({
    queryKey: commandKeys.byDate(date),
    queryFn: () => commandsApi.byDate(date),
    enabled: Boolean(date),
    placeholderData: keepPreviousData,
  });
}

const UNASSIGNED_COUNT_POLL_MS = 60_000;
const UNASSIGNED_COUNT_PUSHED_POLL_MS = 5 * 60_000;

export function useUnassignedCommandsCount(
  date: string,
  enabled: boolean,
  pushed: boolean
) {
  return useQuery({
    queryKey: commandKeys.unassignedCount(date),
    queryFn: ({ signal }) => commandsApi.unassignedCount(date, signal),
    enabled: enabled && Boolean(date),
    select: (result) => result.count,
    refetchInterval: pushed
      ? UNASSIGNED_COUNT_PUSHED_POLL_MS
      : UNASSIGNED_COUNT_POLL_MS,
    refetchOnWindowFocus: true,
  });
}

export function useCommand(id: string | undefined) {
  return useQuery({
    queryKey: commandKeys.detail(id ?? ""),
    queryFn: () => commandsApi.getAny(id as string),
    enabled: Boolean(id),
    retry: false,
  });
}

export function useCommandHistory(id: string | undefined) {
  return useQuery({
    queryKey: commandKeys.history(id ?? ""),
    queryFn: () => commandsApi.history(id as string),
    enabled: Boolean(id),
    retry: false,
  });
}

export function useSouffranceCommandFlags(ids: string[], enabled: boolean) {
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: commandKeys.souffranceFlag(id),
      queryFn: () => commandsApi.isSouffrance(id),
      enabled: enabled && id.length > 0,
      retry: false,
    })),
  });
}

export function useCommandSearch(
  input: CommandSearchInput,
  scope: CommandScope = "active",
  enabled = true
) {
  return useQuery({
    queryKey: commandKeys.search(scope, input),
    queryFn: () =>
      scope === "souffrance"
        ? commandsApi.searchSouffrance(input)
        : commandsApi.search(input),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useClientLastCommands(clientId: string | undefined) {
  return useQuery({
    queryKey: commandKeys.lastByClient(clientId ?? ""),
    queryFn: () => commandsApi.lastByClient(clientId as string),
    enabled: Boolean(clientId),
    retry: false,
  });
}

function invalidateCommands(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: commandKeys.all });
}

export function useCreateCommand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CommandCreateInput) => commandsApi.create(input),
    onSuccess: () => invalidateCommands(queryClient),
  });
}

export function useUpdateCommands() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CommandUpdateInput) => commandsApi.update(input),
    onSuccess: () => invalidateCommands(queryClient),
  });
}

export function useUpdateCommandStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CommandStatusInput) => commandsApi.updateState(input),
    onSuccess: () => invalidateCommands(queryClient),
  });
}

export function useUpdateCommandTarif() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CommandTarifInput) => commandsApi.updateTarif(input),
    onSuccess: () => invalidateCommands(queryClient),
  });
}

export function useAssignCommands() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tourId,
      commandIds,
    }: {
      tourId: string;
      commandIds: string[];
    }) => commandsApi.assign(tourId, { commandIds }),
    onSuccess: () => invalidateCommands(queryClient),
  });
}

export function useAssignCommandsByTour() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      groups: CommandAssignGroup[]
    ): Promise<CommandAssignBatchResult> => {
      const result: CommandAssignBatchResult = { assigned: [], failed: [] };
      for (const group of groups) {
        try {
          await commandsApi.assign(group.tourId, {
            commandIds: group.commandIds,
          });
          result.assigned.push(group);
        } catch (error) {
          result.failed.push({ ...group, error });
        }
      }
      return result;
    },
    onSettled: () => invalidateCommands(queryClient),
  });
}

export function useUnassignCommands() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CommandIdsInput) => commandsApi.unassign(input),
    onSuccess: () => invalidateCommands(queryClient),
  });
}

export function useSouffranceCommands() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CommandIdsInput) => commandsApi.souffrance(input),
    onSuccess: () => invalidateCommands(queryClient),
  });
}

export function useRestoreSouffranceCommands() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CommandIdsInput) =>
      commandsApi.restoreSouffrance(input),
    onSuccess: () => invalidateCommands(queryClient),
  });
}
