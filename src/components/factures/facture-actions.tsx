import { useTranslation } from "react-i18next";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Facture } from "@/features/factures";

interface FactureActionsProps {
  facture: Facture;
  onPreview: (facture: Facture) => void;
  className?: string;
  compact?: boolean;
}

export function FactureActions({
  facture,
  onPreview,
  className,
  compact,
}: FactureActionsProps) {
  const { t } = useTranslation();

  if (!facture.pdfUrl) {
    return (
      <span
        className={cn(
          "block text-xs text-muted-foreground",
          compact && "text-right",
          className
        )}
      >
        {t("factures.noPdf")}
      </span>
    );
  }

  const size = compact ? "size-8" : "size-11 lg:size-8";
  const icon = compact ? "size-4" : "size-5 lg:size-4";

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("shrink-0", size)}
        aria-label={t("factures.actions.preview")}
        title={t("factures.actions.preview")}
        onClick={() => onPreview(facture)}
      >
        <Eye className={icon} />
      </Button>
    </div>
  );
}
