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

export const LEGAL_FORMS = [
  "EI",
  "EURL",
  "SARL",
  "SASU",
  "SAS",
  "SA",
  "SNC",
  "SCOP",
  "ASSOCIATION",
  "OTHER",
] as const;

export type LegalForm = (typeof LEGAL_FORMS)[number];

export const VAT_REGIMES = ["STANDARD", "FRANCHISE"] as const;

export type VatRegime = (typeof VAT_REGIMES)[number];

export const VAT_RATES = [20, 10, 8.5, 5.5, 2.1, 0.9, 0] as const;

export const SHARE_CAPITAL_FORMS: readonly LegalForm[] = [
  "EURL",
  "SARL",
  "SASU",
  "SAS",
  "SA",
  "SCOP",
];

export const RCS_FORMS: readonly LegalForm[] = [
  "EURL",
  "SARL",
  "SASU",
  "SAS",
  "SA",
  "SNC",
  "SCOP",
];

export const BILLING_LEGAL_NAME_MAX = 255;
export const BILLING_RCS_CITY_MAX = 128;
export const BILLING_INVOICE_PREFIX_MAX = 16;
export const BILLING_INVOICE_FOOTER_MAX = 1000;
export const BILLING_PAYMENT_TERM_MAX = 60;
export const BILLING_LATE_PENALTY_MAX = 100;

export interface AccountBillingInput {
  legalName: string | null;
  legalForm: LegalForm | null;
  shareCapital: number | null;
  siret: string | null;
  rcsCity: string | null;
  apeCode: string | null;
  vatNumber: string | null;
  vatRegime: VatRegime | null;
  vatOnDebits: boolean | null;
  defaultVatRate: number | null;
  address1: string | null;
  address2: string | null;
  postalCode: string | null;
  city: string | null;
  email: string | null;
  phone: string | null;
  iban: string | null;
  bic: string | null;
  paymentTermDays: number | null;
  latePenaltyRate: number | null;
  earlyPaymentDiscount: string | null;
  invoicePrefix: string | null;
  invoiceFooter: string | null;
}

export type AccountBillingField = keyof AccountBillingInput;

export interface AccountBilling extends AccountBillingInput {
  siren: string | null;
  updatedAt: string | null;
  complete: boolean;
  missingFields: string[];
}

export type BillingErrorCode =
  | "INVALID_FORMAT"
  | "INVALID_CHECKSUM"
  | "SIREN_MISMATCH"
  | "OUT_OF_RANGE"
  | "NOT_ALLOWED"
  | "TOO_LONG";
