import { http } from "@/lib/http";
import type { AppNotification, NotificationBatchResult } from "./types";

const RESOURCE = "/notifications";

export const NOTIFICATION_STREAM_PATH = `${RESOURCE}/stream`;

export const notificationsApi = {
  markRead: (notificationId: string) =>
    http.put<AppNotification>(`${RESOURCE}/${notificationId}/read`),

  markBatchRead: (notificationIds: string[]) =>
    http.put<NotificationBatchResult>(`${RESOURCE}/read-batch`, notificationIds),
};
