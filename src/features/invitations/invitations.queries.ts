import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invitationsApi } from "./invitations.api";
import { invitationKeys } from "./invitations.keys";
import type { InvitationCreateInput, JoinAccountInput } from "./types";

export function useInvitations(enabled = true) {
  return useQuery({
    queryKey: invitationKeys.lists(),
    queryFn: () => invitationsApi.list(),
    enabled,
  });
}

export function useCreateInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: InvitationCreateInput) => invitationsApi.create(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: invitationKeys.lists() }),
  });
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invitationsApi.revoke(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: invitationKeys.lists() }),
  });
}

export function useJoinAccount() {
  return useMutation({
    mutationFn: (input: JoinAccountInput) => invitationsApi.join(input),
  });
}

export function useInvitationPreview(code: string, enabled = true) {
  return useQuery({
    queryKey: invitationKeys.preview(code),
    queryFn: () => invitationsApi.preview(code),
    enabled: enabled && Boolean(code),
    retry: false,
    staleTime: 60_000,
  });
}
