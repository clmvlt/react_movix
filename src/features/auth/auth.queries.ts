import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { hasSession, setSession, clearSession } from "@/lib/auth";
import { authApi } from "./auth.api";
import { authKeys } from "./auth.keys";
import type {
  GoogleLoginInput,
  LoginInput,
  ProfilAuth,
  RegisterInput,
  ResendRegistrationInput,
  TermsStatus,
} from "./types";

export function useMe() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: authApi.me,
    enabled: hasSession(),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: (profil) => {
      setSession(profil.token);
      queryClient.setQueryData(authKeys.me(), profil);
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),
  });
}

export function useConfirmRegistration(token: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: authKeys.confirmRegistration(token),
    queryFn: async () => {
      const profil = await authApi.confirmRegistration({ token });
      clearSession();
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== authKeys.all[0],
      });
      setSession(profil.token);
      queryClient.setQueryData(authKeys.me(), profil);
      return profil;
    },
    enabled: Boolean(token),
    retry: false,
    staleTime: Infinity,
  });
}

export function useResendRegistration() {
  return useMutation({
    mutationFn: (input: ResendRegistrationInput) =>
      authApi.resendRegistration(input),
  });
}

export function useGoogleLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GoogleLoginInput) => authApi.loginGoogle(input),
    onSuccess: (profil) => {
      setSession(profil.token);
      queryClient.setQueryData(authKeys.me(), profil);
    },
  });
}

export function useAcceptTerms() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.acceptTerms(),
    onSuccess: (terms) => {
      queryClient.setQueryData<ProfilAuth>(authKeys.me(), (current) =>
        current ? { ...current, terms: normalizeTerms(terms) } : current
      );
      void queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}

function normalizeTerms(terms: TermsStatus | undefined): TermsStatus {
  if (terms && typeof terms === "object" && "accepted" in terms) return terms;
  return {
    accepted: true,
    acceptedAt: new Date().toISOString(),
    acceptedVersion: null,
    currentVersion: "",
  };
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clearSession();
      queryClient.removeQueries({ queryKey: authKeys.all });
    },
  });
}
