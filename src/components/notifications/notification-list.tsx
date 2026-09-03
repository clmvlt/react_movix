import { useTranslation } from "react-i18next";
import { Bell, WifiOff } from "lucide-react";
import { EmptyState } from "@/components/states";
import { NotificationItem } from "@/components/notifications/notification-item";
import { useNotificationsOffline } from "@/components/notifications/use-notifications-offline";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/features/notifications";

export function NotificationOfflineHint({
  connected,
  className,
}: {
  connected: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const offline = useNotificationsOffline(connected);

  if (!offline) return null;

  return (
    <p
      className={cn(
        "flex items-center gap-2 text-xs text-muted-foreground",
        className
      )}
    >
      <WifiOff className="size-3.5 shrink-0" aria-hidden />
      {t("notifications.offline")}
    </p>
  );
}

function NotificationSkeleton() {
  return (
    <li className="flex items-start gap-3 px-3 py-3">
      <span className="size-9 shrink-0 animate-pulse rounded-full bg-muted" />
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="h-3.5 w-2/3 animate-pulse rounded bg-muted" />
        <span className="h-3 w-full animate-pulse rounded bg-muted" />
        <span className="h-3 w-1/3 animate-pulse rounded bg-muted" />
      </span>
    </li>
  );
}

interface NotificationListProps {
  notifications: AppNotification[];
  ready: boolean;
  onSelect: (notification: AppNotification) => void;
  className?: string;
}

export function NotificationList({
  notifications,
  ready,
  onSelect,
  className,
}: NotificationListProps) {
  const { t } = useTranslation();

  if (!ready) {
    return (
      <ul className={cn("flex flex-col", className)}>
        {[0, 1, 2].map((index) => (
          <NotificationSkeleton key={index} />
        ))}
      </ul>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className={cn("p-3", className)}>
        <EmptyState
          message={t("notifications.empty")}
          icon={<Bell className="size-8" />}
          className="py-10"
        />
      </div>
    );
  }

  return (
    <ul className={cn("flex flex-col", className)}>
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}
