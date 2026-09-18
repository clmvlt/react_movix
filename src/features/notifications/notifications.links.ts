import type { AppNotification, NotificationType } from "./types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ENTITY_ROUTES: Record<string, (id: string) => string> = {
  ANOMALIE: (id) => `/app/anomalies/${id}`,
  PHARMACY_INFO: (id) => `/app/client-reports?report=${id}`,
};

const LIST_ROUTES: Record<string, string> = {
  SUBSCRIPTION_INVOICE: "/app/subscription-invoices",
};

export function notificationTarget(
  notification: AppNotification
): string | null {
  const type = notification.relatedEntityType?.trim().toUpperCase();
  if (!type) return null;
  if (LIST_ROUTES[type]) return LIST_ROUTES[type];
  const id = notification.relatedEntityId?.trim();
  if (!id || !UUID_PATTERN.test(id)) return null;
  const build = ENTITY_ROUTES[type];
  return build ? build(id.toLowerCase()) : null;
}

const KNOWN_TYPES: NotificationType[] = [
  "ANOMALIE",
  "INFORMATION",
  "SUBSCRIPTION_INVOICE",
  "OTHER",
];

export function notificationType(
  notification: AppNotification
): NotificationType {
  return KNOWN_TYPES.includes(notification.type) ? notification.type : "OTHER";
}

export function unreadIds(notifications: AppNotification[]): string[] {
  return notifications.filter((item) => !item.isRead).map((item) => item.id);
}
