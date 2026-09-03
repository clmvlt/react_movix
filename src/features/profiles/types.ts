export interface ProfilCreateInput {
  identifiant?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  birthday?: string;
  isAdmin?: boolean;
  isWeb?: boolean;
  isMobile?: boolean;
  email?: string;
  isStock?: boolean;
  isActive?: boolean;
  profilPicture?: string;
}

export interface ProfilUpdateInput {
  identifiant?: string;
  firstName?: string;
  lastName?: string;
  birthday?: string;
  isAdmin?: boolean;
  isWeb?: boolean;
  isMobile?: boolean;
  email?: string;
  isStock?: boolean;
  isActive?: boolean;
  profilPicture?: string;
  password?: string;
}

export interface ProfilSelfUpdateInput {
  firstName?: string;
  lastName?: string;
  birthday?: string;
  email?: string;
  profilPicture?: string;
}

export const PROFIL_PICTURE_MAX_EDGE = 512;
export const PROFIL_PICTURE_QUALITY = 0.85;
export const PROFIL_PICTURE_MAX_BYTES = 10 * 1024 * 1024;
export const PROFIL_PICTURE_INPUT_MAX_BYTES = 25 * 1024 * 1024;

export interface GoogleLinkInput {
  idToken: string;
}

export interface PasswordChangeInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface IdentifiantAvailability {
  identifiant: string;
  isUsed: boolean;
}

export interface EmailAvailability {
  email: string;
  isUsed: boolean;
}

export interface VerifyEmailResponse {
  message: string;
}
