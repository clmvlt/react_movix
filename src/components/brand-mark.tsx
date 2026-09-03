import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import logoUrl from "@/assets/images/logo.png";

interface BrandMarkProps {
  compact?: boolean;
  inverted?: boolean;
  className?: string;
}

export function BrandMark({
  compact = false,
  inverted = false,
  className,
}: BrandMarkProps) {
  const { t } = useTranslation();
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <img
        src={logoUrl}
        alt={compact ? t("common.appName") : ""}
        className={cn(
          "size-8 shrink-0 object-contain",
          inverted ? "brightness-0 invert" : "dark:brightness-0 dark:invert"
        )}
      />
      {!compact && (
        <span
          className={cn(
            "text-lg font-semibold tracking-tight",
            inverted ? "text-white" : "text-foreground"
          )}
        >
          {t("common.appName")}
        </span>
      )}
    </span>
  );
}
