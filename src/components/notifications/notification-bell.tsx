import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  NotificationList,
  NotificationOfflineHint,
} from "@/components/notifications/notification-list";
import { useNotificationsOffline } from "@/components/notifications/use-notifications-offline";
import { useOpenNotification } from "@/components/notifications/use-open-notification";
import { useNotifications } from "@/app/notifications-context";

export function NotificationBell() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const {
    available,
    notifications,
    unreadCount,
    connected,
    ready,
    isMarking,
    error,
    markAllAsRead,
  } = useNotifications();

  const close = useCallback(() => setOpen(false), []);
  const openNotification = useOpenNotification(close);
  const offline = useNotificationsOffline(connected);

  if (!available) return null;

  const badge = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={
            unreadCount > 0
              ? t("notifications.bellUnread", { count: unreadCount })
              : t("nav.notifications")
          }
        >
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute right-0.5 top-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-destructive-foreground">
              {badge}
            </span>
          )}
          {offline && (
            <span
              className="absolute bottom-1.5 right-1.5 size-2 rounded-full bg-muted-foreground"
              aria-hidden
            />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        collisionPadding={12}
        className="flex max-h-[80dvh] w-[calc(100vw-1.5rem)] flex-col p-0 sm:w-96"
      >
        <div className="flex items-start justify-between gap-2 border-b border-border p-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {t("notifications.title")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("notifications.scope")}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="min-h-10 shrink-0"
              onClick={markAllAsRead}
              disabled={isMarking}
            >
              <CheckCheck />
              {t("notifications.markAllReadShort")}
            </Button>
          )}
        </div>

        <NotificationOfflineHint
          connected={connected}
          className="border-b border-border px-3 py-2"
        />

        {error && (
          <div className="p-3 pb-0">
            <Alert variant="destructive">
              <AlertDescription>
                {t(`notifications.errors.${error}`)}
              </AlertDescription>
            </Alert>
          </div>
        )}

        <NotificationList
          notifications={notifications}
          ready={ready}
          onSelect={openNotification}
          className="min-h-0 flex-1 overflow-y-auto p-2"
        />

        <div className="border-t border-border p-2">
          <Button variant="ghost" size="sm" className="min-h-10 w-full" asChild>
            <Link to="/app/notifications" onClick={close}>
              {t("notifications.viewAll")}
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
