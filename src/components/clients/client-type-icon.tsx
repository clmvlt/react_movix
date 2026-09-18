import { Building2, Pill } from "lucide-react";
import type { ClientType } from "@/features/clients";

interface ClientTypeIconProps {
  type: ClientType;
  className?: string;
}

export function ClientTypeIcon({ type, className }: ClientTypeIconProps) {
  const Icon = type === "PHARMACY" ? Pill : Building2;
  return <Icon aria-hidden className={className} />;
}
