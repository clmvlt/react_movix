import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/app/notifications-context";
import {
  notificationTarget,
  type AppNotification,
} from "@/features/notifications";

export function useOpenNotification(beforeNavigate?: () => void) {
  const navigate = useNavigate();
  const { markAsRead } = useNotifications();

  return useCallback(
    (notification: AppNotification) => {
      if (!notification.isRead) markAsRead(notification.id);
      const target = notificationTarget(notification);
      if (!target) return;
      beforeNavigate?.();
      navigate(target);
    },
    [beforeNavigate, markAsRead, navigate]
  );
}
