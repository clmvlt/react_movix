import { http } from "@/lib/http";
import {
  EMAIL_LOGS_PAGE_SIZE,
  type EmailEventType,
  type EmailLog,
  type EmailLogsInput,
  type EmailLogsPage,
  type EmailRecipient,
  type EmailRecipientCreateInput,
  type EmailRecipientUpdateInput,
} from "./types";

const RESOURCE = "/email";

function logsQuery({ page, size, status, eventType }: EmailLogsInput) {
  return {
    page: Math.max(0, Math.trunc(Number(page) || 0)),
    size: Math.max(1, Math.trunc(Number(size) || EMAIL_LOGS_PAGE_SIZE)),
    status: status || undefined,
    eventType: eventType || undefined,
  };
}

export const emailApi = {
  recipients: () => http.get<EmailRecipient[]>(`${RESOURCE}/recipients`),

  createRecipient: (input: EmailRecipientCreateInput) =>
    http.post<EmailRecipient>(`${RESOURCE}/recipients`, input),

  updateRecipient: (id: string, input: EmailRecipientUpdateInput) =>
    http.put<EmailRecipient>(`${RESOURCE}/recipients/${id}`, input),

  deleteRecipient: (id: string) =>
    http.delete<void>(`${RESOURCE}/recipients/${id}`),

  eventTypes: () => http.get<EmailEventType[]>(`${RESOURCE}/event-types`),

  logs: (input: EmailLogsInput) =>
    http.get<EmailLogsPage>(`${RESOURCE}/logs`, { query: logsQuery(input) }),

  retryLog: (id: string) => http.post<EmailLog>(`${RESOURCE}/logs/${id}/retry`),
};
