import { http } from "@/lib/http";
import { ApiError } from "@/lib/api-error";
import {
  ANOMALY_LIST_MAX_SIZE,
  type Anomaly,
  type AnomalyDetail,
  type AnomalyGenerateInput,
  type AnomalyListInput,
  type AnomalySearchInput,
  type AnomalyType,
} from "./types";

const RESOURCE = "/anomalies";
const EMAIL_TIMEOUT = 120_000;
const PDF_TIMEOUT = 60_000;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isAnomalyId(value: string | null | undefined): boolean {
  return typeof value === "string" && UUID_PATTERN.test(value.trim());
}

function pathId(id: string): string {
  if (!isAnomalyId(id)) {
    throw new ApiError(400, "Invalid uuid format", null);
  }
  return id.trim().toLowerCase();
}

function listQuery({ page, size }: AnomalyListInput) {
  const safeSize = Math.min(
    ANOMALY_LIST_MAX_SIZE,
    Math.max(1, Math.trunc(Number(size) || 1))
  );
  const safePage = Math.max(0, Math.trunc(Number(page) || 0));
  return { page: safePage, size: safeSize };
}

function rawBase64(value: string): string {
  const separator = value.indexOf(",");
  return value.startsWith("data:") && separator > 0
    ? value.slice(separator + 1)
    : value;
}

export function generatePayload(
  input: AnomalyGenerateInput
): Record<string, unknown> {
  const payload: Record<string, unknown> = { code: input.code };

  if (input.commandId) payload.commandId = input.commandId;
  if (input.cip?.trim()) payload.cip = input.cip.trim();
  if (input.barcodes?.length) payload.barcodes = input.barcodes;
  if (input.other?.trim()) payload.other = input.other.trim();
  if (input.actions?.trim()) payload.actions = input.actions.trim();
  if (input.pictures?.length) {
    payload.pictures = input.pictures.map((picture) => ({
      base64: rawBase64(picture.base64),
    }));
  }
  if (input.sendEmail === true || input.sendEmail === false) {
    payload.sendEmail = input.sendEmail;
  }
  if (input.recipientEmails?.length) {
    payload.recipientEmails = input.recipientEmails;
  }

  return payload;
}

export const anomaliesApi = {
  list: (input: AnomalyListInput) =>
    http.get<Anomaly[]>(RESOURCE, { query: listQuery(input) }),

  types: () => http.get<AnomalyType[]>(`${RESOURCE}/types`),

  get: (id: string) => http.get<AnomalyDetail>(`${RESOURCE}/${pathId(id)}`),

  search: (input: AnomalySearchInput) =>
    http.post<Anomaly[]>(`${RESOURCE}/search`, input),

  generate: (input: AnomalyGenerateInput) =>
    http.post<AnomalyDetail>(`${RESOURCE}/generate`, generatePayload(input)),

  updateComment: (id: string, comment: string) =>
    http.put<AnomalyDetail>(`${RESOURCE}/${pathId(id)}`, { comment }),

  sendEmail: (id: string, emails: string[]) =>
    http.post<string>(
      `${RESOURCE}/${pathId(id)}/send-email`,
      { emails },
      { timeoutMs: EMAIL_TIMEOUT }
    ),

  pdf: (id: string) =>
    http.blob(`${RESOURCE}/${pathId(id)}/pdf`, {
      body: {},
      headers: { Accept: "application/pdf" },
      timeoutMs: PDF_TIMEOUT,
    }),
};
