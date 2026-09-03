export interface Invitation {
  id: string;
  code: string;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  createdAt: string;
  createdByName?: string | null;
  usable: boolean;
  targetProfilId?: string | null;
  targetProfilName?: string | null;
}

export interface InvitationCreateInput {
  maxUses?: number;
  expiresInDays?: number;
  profilId?: string;
}

export interface JoinAccountInput {
  code: string;
}

export interface InvitationPreview {
  societe: string;
  targetsExistingProfile: boolean;
  targetProfileName?: string | null;
}

export const INVITATION_CODE_LENGTH = 10;
export const INVITATION_MAX_USES_MAX = 100;
export const INVITATION_EXPIRES_DAYS_MAX = 90;
export const INVITATION_DEFAULT_MAX_USES = 1;
export const INVITATION_DEFAULT_EXPIRES_DAYS = 7;

export function normalizeInvitationCode(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

export function invitationJoinLink(code: string): string {
  return `${window.location.origin}/join?code=${encodeURIComponent(code)}`;
}
