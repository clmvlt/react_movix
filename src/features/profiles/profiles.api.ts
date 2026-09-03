import { http } from "@/lib/http";
import type { Profil } from "@/features/auth/types";
import type {
  EmailAvailability,
  ForgotPasswordInput,
  GoogleLinkInput,
  IdentifiantAvailability,
  PasswordChangeInput,
  ProfilCreateInput,
  ProfilSelfUpdateInput,
  ProfilUpdateInput,
  ResetPasswordInput,
  VerifyEmailResponse,
} from "./types";

const RESOURCE = "/profiles";

export const profilesApi = {
  list: () => http.get<Profil[]>(RESOURCE),

  get: (id: string) => http.get<Profil>(`${RESOURCE}/${id}`),

  create: (input: ProfilCreateInput) => http.post<Profil>(RESOURCE, input),

  update: (id: string, input: ProfilUpdateInput) =>
    http.put<void>(`${RESOURCE}/${id}`, input),

  remove: (id: string) => http.delete<void>(`${RESOURCE}/${id}`),

  updateMyProfil: (input: ProfilSelfUpdateInput) =>
    http.put<Profil>(`${RESOURCE}/update-profil`, input),

  changePassword: (input: PasswordChangeInput) =>
    http.put<void>(`${RESOURCE}/change-password`, input),

  linkGoogle: (input: GoogleLinkInput) =>
    http.post<Profil>(`${RESOURCE}/link-google`, input, {
      handleUnauthorized: false,
    }),

  unlinkGoogle: () => http.delete<void>(`${RESOURCE}/link-google`),

  forgotPassword: (input: ForgotPasswordInput) =>
    http.post<void>(`${RESOURCE}/forgot-password`, input, { auth: false }),

  resetPassword: (input: ResetPasswordInput) =>
    http.post<void>(`${RESOURCE}/reset-password`, input, { auth: false }),

  verifyEmail: (token: string) =>
    http.get<VerifyEmailResponse>(`${RESOURCE}/verify-email`, {
      query: { token },
      auth: false,
    }),

  resendVerification: () => http.post<void>(`${RESOURCE}/resend-verification`),

  checkIdentifiant: (identifiant: string) =>
    http.get<IdentifiantAvailability>(
      `${RESOURCE}/check-identifiant/${encodeURIComponent(identifiant)}`
    ),

  checkEmail: (email: string) =>
    http.get<EmailAvailability>(
      `${RESOURCE}/check-email/${encodeURIComponent(email)}`
    ),
};
