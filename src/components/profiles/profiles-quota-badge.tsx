import { useTranslation } from "react-i18next";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProfilesQuotaBadgeProps {
  used: number;
  max?: number | null;
  className?: string;
}

export function ProfilesQuotaBadge({
  used,
  max,
  className,
}: ProfilesQuotaBadgeProps) {
  const { t } = useTranslation();
  const limit = max && max > 0 ? max : 0;
  const unlimited = limit === 0;
  const reached = !unlimited && used >= limit;

  const label = unlimited
    ? t("profiles.quota.unlimited", { count: used })
    : t("profiles.quota.value", { count: limit, used });
  const detail = unlimited
    ? t("profiles.quota.unlimitedHint")
    : reached
      ? t("profiles.quota.reachedHint")
      : t("profiles.quota.hint", { used, max: limit });

  return (
    <Badge
      variant={reached ? "outline" : "secondary"}
      className={cn(
        "gap-1",
        reached &&
          "border-status-warning-strong/30 bg-status-warning-bg text-status-warning-text",
        className
      )}
      title={detail}
      aria-label={`${label}. ${detail}`}
    >
      <Users aria-hidden className="size-3" />
      {label}
    </Badge>
  );
}
