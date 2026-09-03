import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { emailApi } from "./email.api";
import { emailKeys } from "./email.keys";
import type {
  EmailLogsInput,
  EmailRecipient,
  EmailRecipientCreateInput,
  EmailRecipientUpdateInput,
} from "./types";

const EVENT_TYPES_STALE_TIME = 5 * 60_000;
const LOGS_STALE_TIME = 15_000;

export function useEmailRecipients(enabled = true) {
  return useQuery({
    queryKey: emailKeys.recipients(),
    queryFn: () => emailApi.recipients(),
    enabled,
    retry: false,
  });
}

export function useEmailEventTypes(enabled = true) {
  return useQuery({
    queryKey: emailKeys.eventTypes(),
    queryFn: () => emailApi.eventTypes(),
    enabled,
    retry: false,
    staleTime: EVENT_TYPES_STALE_TIME,
  });
}

export function useCreateEmailRecipient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EmailRecipientCreateInput) =>
      emailApi.createRecipient(input),
    onSuccess: (created) => {
      queryClient.setQueryData<EmailRecipient[]>(
        emailKeys.recipients(),
        (previous) => (previous ? [...previous, created] : previous)
      );
      void queryClient.invalidateQueries({ queryKey: emailKeys.recipients() });
    },
  });
}

export function useUpdateEmailRecipient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: EmailRecipientUpdateInput;
    }) => emailApi.updateRecipient(id, input),
    onSuccess: (updated) => {
      queryClient.setQueryData<EmailRecipient[]>(
        emailKeys.recipients(),
        (previous) =>
          previous?.map((entry) => (entry.id === updated.id ? updated : entry))
      );
      void queryClient.invalidateQueries({ queryKey: emailKeys.recipients() });
    },
  });
}

export function useDeleteEmailRecipient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => emailApi.deleteRecipient(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<EmailRecipient[]>(
        emailKeys.recipients(),
        (previous) => previous?.filter((entry) => entry.id !== id)
      );
      void queryClient.invalidateQueries({ queryKey: emailKeys.recipients() });
    },
  });
}

export function useEmailLogs(input: EmailLogsInput, enabled = true) {
  return useQuery({
    queryKey: emailKeys.logsPage(input),
    queryFn: () => emailApi.logs(input),
    enabled,
    retry: false,
    staleTime: LOGS_STALE_TIME,
    placeholderData: keepPreviousData,
  });
}

export function useRetryEmailLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => emailApi.retryLog(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: emailKeys.logs() });
    },
  });
}
