export interface Account {
  id: string;
  societe: string;
  code?: string;
  address1?: string;
  address2?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  latitude?: number;
  longitude?: number;
  maxProfiles?: number;
  isScanCIP?: boolean;
  autoSendAnomalieEmails?: boolean;
  senderName?: string;
  senderAddress?: string;
  senderPostalCode?: string;
  senderCity?: string;
  senderCountry?: string;
  isLabelLandscape?: boolean;
  logoUrl?: string;
  defaultTourDepartureTime?: string | null;
}

export interface Profil {
  id: string;
  identifiant: string;
  firstName?: string;
  lastName?: string;
  birthday?: string;
  createdAt?: string;
  updatedAt?: string;
  isAdmin: boolean;
  isWeb: boolean;
  isMobile: boolean;
  isStock?: boolean;
  isActive: boolean;
  email?: string;
  isEmailVerified?: boolean;
  emailVerifiedAt?: string | null;
  profilPicture?: string;
  googleLinked?: boolean;
  googleEmail?: string | null;
  userId?: string | null;
}

export interface AccountMembership {
  profilId: string;
  isAdmin: boolean;
  isWeb: boolean;
  isMobile: boolean;
  isStock?: boolean;
  isActive: boolean;
  identifiant?: string | null;
  account: Account;
}

export interface TermsStatus {
  accepted: boolean;
  acceptedAt: string | null;
  acceptedVersion: string | null;
  currentVersion: string;
}

export interface ProfilAuth extends Profil {
  token?: string;
  hyperadmin?: boolean;
  account: Account | null;
  accounts?: AccountMembership[];
  terms?: TermsStatus | null;
}

export function needsTermsAcceptance(
  user: ProfilAuth | null | undefined
): boolean {
  return user?.terms?.accepted === false;
}

export function webMemberships(
  user: ProfilAuth | null | undefined
): AccountMembership[] {
  if (!user?.userId || !user.accounts) return [];
  return user.accounts.filter((m) => m.isWeb && m.isActive);
}

export function applyMembership(
  user: ProfilAuth,
  membership: AccountMembership
): ProfilAuth {
  return {
    ...user,
    id: membership.profilId,
    identifiant: membership.identifiant ?? user.identifiant,
    isAdmin: membership.isAdmin,
    isWeb: membership.isWeb,
    isMobile: membership.isMobile,
    isStock: membership.isStock,
    isActive: membership.isActive,
    account: membership.account,
  };
}

export function canAccessWeb(user: ProfilAuth): boolean {
  return user.isWeb === true || Boolean(user.userId);
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  birthday?: string;
  acceptedTerms: boolean;
}

export interface GoogleLoginInput {
  idToken: string;
  acceptedTerms?: boolean;
}

export interface ProfilRef {
  id: string;
  identifiant?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  isActive?: boolean;
  isAdmin?: boolean;
}

export function profilFullName(
  profil:
    | {
        firstName?: string | null;
        lastName?: string | null;
        identifiant?: string | null;
      }
    | null
    | undefined
): string {
  if (!profil) return "";
  const parts = [profil.firstName, profil.lastName].filter(Boolean);
  return parts.length ? parts.join(" ") : (profil.identifiant ?? "");
}

export function isDeletedProfil(
  profil: { identifiant?: string | null } | null | undefined
): boolean {
  return Boolean(profil) && profil!.identifiant === null;
}

export interface RegistrationPending {
  email: string;
  emailSent: boolean;
  retryAfterSeconds: number;
  expiresAt: string | null;
}

export interface ConfirmRegistrationInput {
  token: string;
}

export interface ResendRegistrationInput {
  email: string;
}
