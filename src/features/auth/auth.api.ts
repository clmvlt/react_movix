import { http } from "@/lib/http";
import type {
  ConfirmRegistrationInput,
  GoogleLoginInput,
  LoginInput,
  ProfilAuth,
  RegisterInput,
  RegistrationPending,
  ResendRegistrationInput,
  TermsStatus,
} from "./types";

const RESOURCE = "/auth";

export const authApi = {
  login: (input: LoginInput) =>
    http.post<ProfilAuth>(`${RESOURCE}/login`, input, { auth: false }),

  register: (input: RegisterInput) =>
    http.post<RegistrationPending>(`${RESOURCE}/register`, input, {
      auth: false,
    }),

  confirmRegistration: (input: ConfirmRegistrationInput) =>
    http.post<ProfilAuth>(`${RESOURCE}/register/confirm`, input, {
      auth: false,
    }),

  resendRegistration: (input: ResendRegistrationInput) =>
    http.post<RegistrationPending>(`${RESOURCE}/register/resend`, input, {
      auth: false,
    }),

  loginGoogle: (input: GoogleLoginInput) =>
    http.post<ProfilAuth>(`${RESOURCE}/login/google`, input, { auth: false }),

  me: () => http.get<ProfilAuth>(`${RESOURCE}/me`),

  acceptTerms: () => http.post<TermsStatus>(`${RESOURCE}/accept-terms`),

  logout: () => http.post<void>(`${RESOURCE}/logout`, undefined, { auth: false }),
};
