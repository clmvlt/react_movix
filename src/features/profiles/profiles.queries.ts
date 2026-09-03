import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { profilesApi } from "./profiles.api";
import { profileKeys } from "./profiles.keys";
import type {
  ForgotPasswordInput,
  GoogleLinkInput,
  PasswordChangeInput,
  ProfilCreateInput,
  ProfilSelfUpdateInput,
  ProfilUpdateInput,
  ResetPasswordInput,
} from "./types";

export function useProfiles(enabled = true) {
  return useQuery({
    queryKey: profileKeys.lists(),
    queryFn: () => profilesApi.list(),
    enabled,
  });
}

export function useProfile(id: string | undefined) {
  return useQuery({
    queryKey: profileKeys.detail(id ?? ""),
    queryFn: () => profilesApi.get(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfilCreateInput) => profilesApi.create(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() }),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProfilUpdateInput }) =>
      profilesApi.update(id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: profileKeys.all }),
  });
}

export function useDeleteProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => profilesApi.remove(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() }),
  });
}

export function useUpdateMyProfil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfilSelfUpdateInput) =>
      profilesApi.updateMyProfil(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() }),
  });
}

export function useLinkGoogle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GoogleLinkInput) => profilesApi.linkGoogle(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() }),
  });
}

export function useUnlinkGoogle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => profilesApi.unlinkGoogle(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() }),
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: () => profilesApi.resendVerification(),
  });
}

export function useEmailAvailability(email: string, enabled = true) {
  return useQuery({
    queryKey: profileKeys.emailAvailability(email.toLowerCase()),
    queryFn: () => profilesApi.checkEmail(email),
    enabled: enabled && Boolean(email),
    staleTime: 30_000,
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: PasswordChangeInput) =>
      profilesApi.changePassword(input),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (input: ForgotPasswordInput) =>
      profilesApi.forgotPassword(input),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (input: ResetPasswordInput) => profilesApi.resetPassword(input),
  });
}
