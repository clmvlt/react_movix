export type NotificationType =
  | "ANOMALIE"
  | "INFORMATION"
  | "SUBSCRIPTION_INVOICE"
  | "OTHER";

export type NotificationEntityType =
  | "ANOMALIE"
  | "PHARMACY_INFO"
  | "SUBSCRIPTION_INVOICE";

export interface AppNotification {
  id: string;
  profilId?: string;
  type: NotificationType;
  title: string;
  message?: string | null;
  isRead: boolean;
  createdAt?: string | null;
  readAt?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
}

export interface NotificationStreamPayload {
  notifications: AppNotification[];
  unreadCount: number;
}

export interface NotificationBatchResult {
  markedCount: number;
}
