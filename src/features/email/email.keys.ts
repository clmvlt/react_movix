import type { EmailLogsInput } from "./types";

export const emailKeys = {
  all: ["email"] as const,
  recipients: () => [...emailKeys.all, "recipients"] as const,
  eventTypes: () => [...emailKeys.all, "event-types"] as const,
  logs: () => [...emailKeys.all, "logs"] as const,
  logsPage: (input: EmailLogsInput) => [...emailKeys.logs(), input] as const,
};
