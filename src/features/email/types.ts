export const EMAIL_LOGS_PAGE_SIZE = 50;

export const EMAIL_LOG_STATUSES = [
  "PENDING",
  "SENDING",
  "SENT",
  "FAILED",
] as const;

export type EmailLogStatus = (typeof EMAIL_LOG_STATUSES)[number];

export interface EmailRecipient {
  id: string;
  email: string;
  label?: string | null;
  active: boolean;
  subscriptions: string[];
  anomalieTypeCodes: string[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface EmailRecipientCreateInput {
  email: string;
  label?: string;
  active?: boolean;
  subscriptions?: string[];
  anomalieTypeCodes?: string[];
}

export interface EmailRecipientUpdateInput {
  email?: string;
  label?: string;
  active?: boolean;
  subscriptions?: string[];
  anomalieTypeCodes?: string[];
}

export interface EmailEventType {
  code: string;
  label?: string | null;
}

export interface EmailLog {
  id: string;
  recipient: string;
  subject?: string | null;
  eventType?: string | null;
  relatedEntityId?: string | null;
  status: EmailLogStatus;
  attemptCount: number;
  lastError?: string | null;
  nextRetryAt?: string | null;
  sentAt?: string | null;
  createdAt: string;
}

export interface EmailLogsInput {
  page: number;
  size: number;
  status?: EmailLogStatus | "";
  eventType?: string;
}

export interface EmailLogsPage {
  content: EmailLog[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export function isEmailLogStatus(
  value: string | null | undefined
): value is EmailLogStatus {
  return (
    typeof value === "string" &&
    (EMAIL_LOG_STATUSES as readonly string[]).includes(value)
  );
}
