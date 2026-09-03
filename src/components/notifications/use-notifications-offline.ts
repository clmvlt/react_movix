import { useEffect, useState } from "react";

const OFFLINE_HINT_DELAY_MS = 15_000;

export function useDelayedFlag(active: boolean, delay: number): boolean {
  const [flag, setFlag] = useState(false);

  useEffect(() => {
    if (!active) {
      setFlag(false);
      return;
    }
    const timer = window.setTimeout(() => setFlag(true), delay);
    return () => window.clearTimeout(timer);
  }, [active, delay]);

  return flag;
}

export function useNotificationsOffline(connected: boolean): boolean {
  return useDelayedFlag(!connected, OFFLINE_HINT_DELAY_MS);
}
