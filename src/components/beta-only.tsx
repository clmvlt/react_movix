import type { ReactNode } from "react";
import { config } from "@/lib/config";

export function useIsBeta(): boolean {
  return config.isBeta;
}

export function BetaOnly({ children }: { children: ReactNode }) {
  return useIsBeta() ? <>{children}</> : null;
}
