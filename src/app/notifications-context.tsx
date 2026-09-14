import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authKeys } from "@/features/auth";
import {
  COMMANDS_CHANGED_EVENT,
  invalidateCommandDates,
  parseCommandsChangedDates,
} from "@/features/commands";
import {
  useNotificationCenter,
  type NotificationCenter,
} from "@/features/notifications";
import { useAuth } from "@/app/auth-context";
import type { SseMessage } from "@/lib/sse";

interface NotificationsContextValue extends NotificationCenter {
  available: boolean;
}

const NotificationsContext = createContext<
  NotificationsContextValue | undefined
>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const available = Boolean(user && (user.isWeb || user.isAdmin));

  const handleAuthFailure = useCallback(() => {
    void queryClient.refetchQueries({ queryKey: authKeys.me() });
  }, [queryClient]);

  const handleStreamEvent = useCallback(
    (message: SseMessage) => {
      if (message.event !== COMMANDS_CHANGED_EVENT) return;
      invalidateCommandDates(
        queryClient,
        parseCommandsChangedDates(message.data)
      );
    },
    [queryClient]
  );

  const center = useNotificationCenter(
    available,
    handleAuthFailure,
    handleStreamEvent
  );

  const value = useMemo<NotificationsContextValue>(
    () => ({ ...center, available }),
    [center, available]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return ctx;
}
