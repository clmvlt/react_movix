import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatWindowBadge } from "@/lib/delivery-window";
import { cn } from "@/lib/utils";

interface DeliveryWindowBadgeProps {
  start: string | null | undefined;
  end: string | null | undefined;
  size?: "sm" | "md";
  className?: string;
}

export function DeliveryWindowBadge({
  start,
  end,
  size = "sm",
  className,
}: DeliveryWindowBadgeProps) {
  const { t } = useTranslation();
  const text = formatWindowBadge(start, end, t);
  if (!text) return null;
  const label = `${t("deliveryWindow.label")} ${text}`;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-status-info-strong/30 bg-status-info-bg font-medium tabular-nums text-status-info-text",
        size === "md" ? "px-2.5 py-0.5 text-sm" : "px-2 py-0.5 text-xs",
        className
      )}
      title={label}
      aria-label={label}
    >
      <Clock aria-hidden className={size === "md" ? "size-3.5" : "size-3"} />
      {text}
    </span>
  );
}
