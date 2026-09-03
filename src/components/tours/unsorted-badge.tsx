import { useTranslation } from "react-i18next";
import { ArrowDownUp } from "lucide-react";
import { getStatusTokens } from "@/lib/colors";
import { cn } from "@/lib/utils";

export function UnsortedBadge({ className }: { className?: string }) {
  const { t } = useTranslation();
  const tokens = getStatusTokens("pending");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        className
      )}
      style={{ backgroundColor: tokens.badgeBg, color: tokens.badgeText }}
    >
      <ArrowDownUp className="size-3 shrink-0" aria-hidden />
      {t("tours.unsorted")}
    </span>
  );
}
