import { useTranslation } from "react-i18next";
import {
  Bell,
  ChevronRight,
  FileText,
  Info,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeDateTime } from "@/lib/date";
import {
  notificationTarget,
  notificationType,
  type AppNotification,
  type NotificationType,
} from "@/features/notifications";

const TYPE_STYLES: Record<
  NotificationType,
  { icon: LucideIcon; className: string }
> = {
  ANOMALIE: {
    icon: TriangleAlert,
    className: "bg-status-danger-bg text-status-danger-strong",
  },
  INFORMATION: {
    icon: Info,
    className: "bg-status-info-bg text-status-info-strong",
  },
  SUBSCRIPTION_INVOICE: {
    icon: FileText,
    className: "bg-status-success-bg text-status-success-strong",
  },
  OTHER: {
    icon: Bell,
    className: "bg-status-neutral-bg text-status-neutral-strong",
  },
};

interface NotificationItemProps {
  notification: AppNotification;
  onSelect: (notification: AppNotification) => void;
}

export function NotificationItem({
  notification,
  onSelect,
}: NotificationItemProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? "en";

  const type = notificationType(notification);
  const { icon: Icon, className } = TYPE_STYLES[type];
  const target = notificationTarget(notification);
  const isUnread = !notification.isRead;
  const message = notification.message?.trim();

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(notification)}
        className={cn(
          "flex min-h-11 w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isUnread && "bg-accent/50"
        )}
      >
        <span
          className={cn(
            "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
            className
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex items-start gap-2">
            <span
              className={cn(
                "min-w-0 flex-1 break-words text-sm text-foreground",
                isUnread && "font-semibold"
              )}
            >
              {notification.title}
            </span>
            {isUnread && (
              <span
                className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                aria-hidden
              />
            )}
          </span>

          {message && (
            <span className="line-clamp-2 break-words text-sm text-muted-foreground">
              {message}
            </span>
          )}

          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{t(`notifications.types.${type}`)}</span>
            <span aria-hidden>-</span>
            <time dateTime={notification.createdAt ?? undefined}>
              {formatRelativeDateTime(notification.createdAt, lang)}
            </time>
            {target && (
              <ChevronRight className="ml-auto size-4 shrink-0" aria-hidden />
            )}
          </span>
        </span>
      </button>
    </li>
  );
}
