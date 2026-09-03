import { useTranslation } from "react-i18next";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/page-header";
import {
  NotificationList,
  NotificationOfflineHint,
} from "@/components/notifications/notification-list";
import { useOpenNotification } from "@/components/notifications/use-open-notification";
import { useNotifications } from "@/app/notifications-context";

export function NotificationsPage() {
  const { t } = useTranslation();
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
  const openNotification = useOpenNotification();
  const isReady = ready || !available;

  return (
    <div className="flex w-full flex-1 flex-col">
      <PageHeader
        title={t("notifications.title")}
        subtitle={t("notifications.scope")}
        actions={
          unreadCount > 0 && (
            <Button
              variant="outline"
              className="min-h-11 lg:min-h-10"
              onClick={markAllAsRead}
              disabled={isMarking}
            >
              <CheckCheck className="size-4" />
              {t("notifications.markAllRead")}
            </Button>
          )
        }
      />

      <div className="flex flex-1 flex-col gap-3">
        {available && <NotificationOfflineHint connected={connected} />}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              {t(`notifications.errors.${error}`)}
            </AlertDescription>
          </Alert>
        )}

        {unreadCount > 0 && (
          <p className="text-sm text-muted-foreground">
            {t("notifications.unread", { count: unreadCount })}
          </p>
        )}

        <NotificationList
          notifications={notifications}
          ready={isReady}
          onSelect={openNotification}
          className={
            !isReady || notifications.length > 0
              ? "gap-1 rounded-xl border border-border bg-card p-2"
              : undefined
          }
        />
      </div>
    </div>
  );
}
