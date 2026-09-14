import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ApiError } from "@/lib/api-error";
import { openSseStream, type SseMessage } from "@/lib/sse";
import {
  NOTIFICATION_STREAM_PATH,
  notificationsApi,
} from "./notifications.api";
import { unreadIds } from "./notifications.links";
import type { AppNotification, NotificationStreamPayload } from "./types";

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 3_000;
const AUTH_CHECK_COOLDOWN_MS = 60_000;
const RESYNC_INTERVAL_MS = 15 * 60_000;
const STREAM_END_DELAY_MS = 500;

export type NotificationErrorKind = "markRead" | "markAll";

interface StreamState {
  notifications: AppNotification[];
  unreadCount: number;
  connected: boolean;
  ready: boolean;
}

const EMPTY_STATE: StreamState = {
  notifications: [],
  unreadCount: 0,
  connected: false,
  ready: false,
};

export interface NotificationCenter extends StreamState {
  isMarking: boolean;
  error: NotificationErrorKind | null;
  dismissError: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

function parsePayload(data: string): NotificationStreamPayload | null {
  try {
    const parsed = JSON.parse(data) as NotificationStreamPayload;
    if (!parsed || !Array.isArray(parsed.notifications)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function useMarkNotificationRead() {
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
  });
}

export function useMarkNotificationsBatchRead() {
  return useMutation({
    mutationFn: (ids: string[]) => notificationsApi.markBatchRead(ids),
  });
}

export function useNotificationCenter(
  enabled: boolean,
  onAuthFailure: () => void,
  onEvent?: (message: SseMessage) => void
): NotificationCenter {
  const [state, setState] = useState<StreamState>(EMPTY_STATE);
  const [error, setError] = useState<NotificationErrorKind | null>(null);

  const stateRef = useRef(state);
  const authFailureRef = useRef(onAuthFailure);
  const eventRef = useRef(onEvent);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    authFailureRef.current = onAuthFailure;
  }, [onAuthFailure]);

  useEffect(() => {
    eventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled) {
      setState(EMPTY_STATE);
      return;
    }

    let cancelled = false;
    let controller: AbortController | null = null;
    let sleepTimer: number | null = null;
    let wake: (() => void) | null = null;
    let attempts = 0;

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        const finish = () => {
          if (sleepTimer !== null) {
            window.clearTimeout(sleepTimer);
            sleepTimer = null;
          }
          wake = null;
          resolve();
        };
        wake = finish;
        sleepTimer = window.setTimeout(finish, ms);
      });

    const resync = () => {
      if (cancelled) return;
      attempts = 0;
      controller?.abort();
      wake?.();
    };

    const stop = () => {
      cancelled = true;
      controller?.abort();
      wake?.();
      if (sleepTimer !== null) {
        window.clearTimeout(sleepTimer);
        sleepTimer = null;
      }
    };

    const run = async () => {
      while (!cancelled) {
        const current = new AbortController();
        controller = current;
        try {
          await openSseStream(NOTIFICATION_STREAM_PATH, {
            signal: current.signal,
            onOpen: () => {
              attempts = 0;
              setState((prev) => ({ ...prev, connected: true }));
            },
            onMessage: (message) => {
              if (message.event !== "notifications") {
                eventRef.current?.(message);
                return;
              }
              const payload = parsePayload(message.data);
              if (!payload) return;
              setState({
                notifications: payload.notifications,
                unreadCount: payload.unreadCount ?? 0,
                connected: true,
                ready: true,
              });
            },
          });

          if (cancelled) return;
          setState((prev) => ({ ...prev, connected: false }));
          attempts = 0;
          await sleep(STREAM_END_DELAY_MS);
        } catch (streamError) {
          if (cancelled) return;
          setState((prev) => ({ ...prev, connected: false }));

          if (current.signal.aborted) {
            await sleep(0);
            continue;
          }

          const status =
            streamError instanceof ApiError ? streamError.status : 0;
          if (status === 401 || status === 403) {
            if (status !== 401) authFailureRef.current();
            return;
          }

          attempts += 1;
          if (attempts >= MAX_ATTEMPTS) {
            attempts = 0;
            authFailureRef.current();
            await sleep(AUTH_CHECK_COOLDOWN_MS);
          } else {
            await sleep(RETRY_DELAY_MS * attempts);
          }
        }
      }
    };

    void run();

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") resync();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("online", resync);
    window.addEventListener("beforeunload", stop);
    const interval = window.setInterval(resync, RESYNC_INTERVAL_MS);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("online", resync);
      window.removeEventListener("beforeunload", stop);
      window.clearInterval(interval);
    };
  }, [enabled]);

  const markRead = useMarkNotificationRead();
  const markBatchRead = useMarkNotificationsBatchRead();

  const rollback = useCallback((ids: string[]) => {
    const targets = new Set(ids);
    setState((current) => {
      let restored = 0;
      const notifications = current.notifications.map((item) => {
        if (!targets.has(item.id) || !item.isRead) return item;
        restored += 1;
        return { ...item, isRead: false, readAt: null };
      });
      if (restored === 0) return current;
      return {
        ...current,
        notifications,
        unreadCount: current.unreadCount + restored,
      };
    });
  }, []);

  const markAsRead = useCallback(
    (id: string) => {
      const snapshot = stateRef.current;
      const target = snapshot.notifications.find((item) => item.id === id);
      if (!target || target.isRead) return;

      const readAt = new Date().toISOString();
      setError(null);
      setState({
        ...snapshot,
        notifications: snapshot.notifications.map((item) =>
          item.id === id ? { ...item, isRead: true, readAt } : item
        ),
        unreadCount: Math.max(0, snapshot.unreadCount - 1),
      });

      markRead.mutate(id, {
        onError: () => {
          rollback([id]);
          setError("markRead");
        },
      });
    },
    [markRead, rollback]
  );

  const markAllAsRead = useCallback(() => {
    const snapshot = stateRef.current;
    const ids = unreadIds(snapshot.notifications);
    if (ids.length === 0) return;

    const readAt = new Date().toISOString();
    setError(null);
    setState({
      ...snapshot,
      notifications: snapshot.notifications.map((item) =>
        item.isRead ? item : { ...item, isRead: true, readAt }
      ),
      unreadCount: 0,
    });

    markBatchRead.mutate(ids, {
      onError: () => {
        rollback(ids);
        setError("markAll");
      },
    });
  }, [markBatchRead, rollback]);

  const dismissError = useCallback(() => setError(null), []);

  return useMemo(
    () => ({
      ...state,
      isMarking: markRead.isPending || markBatchRead.isPending,
      error,
      dismissError,
      markAsRead,
      markAllAsRead,
    }),
    [
      state,
      markRead.isPending,
      markBatchRead.isPending,
      error,
      dismissError,
      markAsRead,
      markAllAsRead,
    ]
  );
}
