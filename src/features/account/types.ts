import type { Account } from "@/features/auth/types";

export const LOGO_MAX_BYTES = 512 * 1024;
export const LOGO_MAX_EDGE = 512;
export const LOGO_INPUT_MAX_BYTES = 10 * 1024 * 1024;
export const SMTP_PORT_MIN = 1;
export const SMTP_PORT_MAX = 65535;
export const TEXT_FIELD_MAX = 255;
export const CITY_FIELD_MAX = 100;
export const POSTAL_CODE_MAX = 20;

export interface AccountDetail extends Account {
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpEnable?: boolean;
  smtpUseTls?: boolean;
  smtpUseSsl?: boolean;
}

export interface AccountUpdateInput {
  societe?: string;
  address1?: string;
  address2?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  autoSendAnomalieEmails?: boolean;
  isScanCIP?: boolean;
  defaultTourDepartureTime?: string;
  senderName?: string;
  senderAddress?: string;
  senderPostalCode?: string;
  senderCity?: string;
  senderCountry?: string;
  isLabelLandscape?: boolean;
  logo?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpEnable?: boolean;
  smtpUseTls?: boolean;
  smtpUseSsl?: boolean;
}

export type AccountUpdatePatch = Partial<AccountUpdateInput>;

export type EmailTestStatus = "SUCCESS" | "ERROR";

export interface EmailTestResult {
  status: EmailTestStatus;
  message: string;
}
