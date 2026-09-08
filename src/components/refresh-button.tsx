import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RefreshButtonProps {
  onRefresh: () => void | Promise<unknown>;
  refreshing?: boolean;
  className?: string;
  iconClassName?: string;
  variant?: "outline" | "ghost";
}

export function RefreshButton({
  onRefresh,
  refreshing = false,
  className,
  iconClassName,
  variant = "outline",
}: Readonly<RefreshButtonProps>) {
  const { t } = useTranslation();
  return (
    <Button
      type="button"
      variant={variant}
      size="icon"
      className={cn("shrink-0", className)}
      title={t("common.refresh")}
      aria-label={t("common.refresh")}
      aria-busy={refreshing}
      disabled={refreshing}
      onClick={() => void onRefresh()}
    >
      <RefreshCw
        className={cn("size-4", refreshing && "animate-spin", iconClassName)}
      />
    </Button>
  );
}
