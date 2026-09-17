export const MAX_PROFILES_UNLIMITED = 0;
export const FR_TIME_PATTERN = /^([01]?\d|2[0-3])h[0-5]\d$/;

export interface AdminAccount {
  id: string;
  societe: string;
  code: string | null;
  address1: string | null;
  address2: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  isActive: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
  latitude: number | null;
  longitude: number | null;
  maxProfiles: number | null;
  anomaliesEmails: string | null;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUsername: string | null;
  smtpPassword: string | null;
  smtpEnable: boolean | null;
  smtpUseTls: boolean | null;
  smtpUseSsl: boolean | null;
  isScanCIP: boolean | null;
  autoSendAnomalieEmails: boolean | null;
  isLabelLandscape: boolean | null;
  defaultTourDepartureTime: string | null;
  senderName: string | null;
  senderAddress: string | null;
  senderPostalCode: string | null;
  senderCity: string | null;
  senderCountry: string | null;
  logoUrl: string | null;
}

export interface AdminAccountCreateInput {
  societe: string;
  address1: string;
  address2?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  maxProfiles?: number;
  isActive?: boolean;
  anomaliesEmails?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpEnable?: boolean;
  smtpUseTls?: boolean;
  smtpUseSsl?: boolean;
  isScanCIP?: boolean;
  autoSendAnomalieEmails?: boolean;
  isLabelLandscape?: boolean;
  defaultTourDepartureTime?: string;
  senderName?: string;
  senderAddress?: string;
  senderPostalCode?: string;
  senderCity?: string;
  senderCountry?: string;
}

export interface AdminAccountUpdateInput
  extends Partial<Omit<AdminAccountCreateInput, "anomaliesEmails">> {
  anomaliesEmails: string | null;
  logo?: string;
}

export interface AccountDeletionRequest {
  accountId: string;
  societe: string | null;
  requesterEmail: string;
  requesterName: string | null;
  emailSent: boolean;
  retryAfterSeconds: number;
  expiresAt: string;
  lastSentAt: string | null;
  createdAt: string | null;
}

export const DELETION_COUNT_KEYS = [
  "profiles",
  "tours",
  "commands",
  "packages",
  "anomalies",
  "pharmacies",
  "pharmacyReports",
  "zones",
  "tourConfigs",
  "factures",
  "tarifs",
  "emailRecipients",
  "emailLogs",
  "invitations",
  "importerTokens",
  "files",
] as const;

export type AccountDeletionCountKey = (typeof DELETION_COUNT_KEYS)[number];

export type AccountDeletionCounts = Record<AccountDeletionCountKey, number>;

export interface AccountDeletionPreview extends AccountDeletionCounts {
  accountId: string;
  societe: string | null;
  pendingRequest: AccountDeletionRequest | null;
}

export interface AccountDeletionResult {
  accountId: string;
  societe: string | null;
  totalDeletedRows: number;
  deletedRows: Record<string, number>;
  filesDeleted: number;
}

export function deletionTotal(preview: AccountDeletionPreview): number {
  return DELETION_COUNT_KEYS.reduce(
    (total, key) => total + (preview[key] ?? 0),
    0
  );
}

export function isUnlimitedProfiles(
  maxProfiles: number | null | undefined
): boolean {
  return (maxProfiles ?? MAX_PROFILES_UNLIMITED) === MAX_PROFILES_UNLIMITED;
}

export function normalizeAccountId(accountId: string): string {
  return accountId.trim().toLowerCase();
}
