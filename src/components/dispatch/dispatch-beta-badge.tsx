import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export function DispatchBetaBadge({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border border-status-info-strong/30 bg-status-info-bg px-2 py-0.5 text-xs font-medium text-status-info-text",
        className
      )}
    >
      {t("expeditions.dispatch.beta")}
    </span>
  );
}
