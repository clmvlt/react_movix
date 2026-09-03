import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { config } from "./config";
import { fetchDeployedVersion } from "./app-version";

const CHECK_INTERVAL_MS = 5 * 60_000;
const DISMISSED_KEY = "movix.dismissedVersion";

function readDismissed(): string | null {
  try {
    return window.localStorage.getItem(DISMISSED_KEY);
  } catch {
    return null;
  }
}

function writeDismissed(version: string | null) {
  try {
    if (version === null) window.localStorage.removeItem(DISMISSED_KEY);
    else window.localStorage.setItem(DISMISSED_KEY, version);
  } catch {
    return;
  }
}

export function useAppUpdate() {
  const [dismissedVersion, setDismissedVersion] = useState(readDismissed);

  const { data } = useQuery({
    queryKey: ["app-version"],
    queryFn: ({ signal }) => fetchDeployedVersion(signal),
    enabled: !config.isDev,
    staleTime: 0,
    gcTime: CHECK_INTERVAL_MS,
    refetchInterval: CHECK_INTERVAL_MS,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: false,
  });

  const deployedVersion = data?.version ?? null;
  const updateAvailable =
    deployedVersion !== null &&
    deployedVersion !== config.appVersion &&
    deployedVersion !== dismissedVersion;

  const applyUpdate = useCallback(() => {
    writeDismissed(null);
    window.location.reload();
  }, []);

  const dismiss = useCallback(() => {
    if (!deployedVersion) return;
    writeDismissed(deployedVersion);
    setDismissedVersion(deployedVersion);
  }, [deployedVersion]);

  return {
    currentVersion: config.appVersion,
    deployedVersion,
    updateAvailable,
    applyUpdate,
    dismiss,
  };
}
