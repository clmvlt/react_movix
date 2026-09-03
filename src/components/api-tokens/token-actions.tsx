import { useTranslation } from "react-i18next";
import { Loader2, Pencil, Power, PowerOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ImporterToken } from "@/features/importer-tokens";

interface TokenActionsProps {
  token: ImporterToken;
  pending: boolean;
  onEdit: (token: ImporterToken) => void;
  onToggle: (token: ImporterToken) => void;
  onDelete: (token: ImporterToken) => void;
  className?: string;
  compact?: boolean;
}

export function TokenActions({
  token,
  pending,
  onEdit,
  onToggle,
  onDelete,
  className,
  compact,
}: TokenActionsProps) {
  const { t } = useTranslation();

  const toggleLabel = token.isActive
    ? t("apiTokens.actions.deactivate")
    : t("apiTokens.actions.activate");
  const deleteLabel = token.nonDeletable
    ? t("apiTokens.actions.protected")
    : t("common.delete");

  const size = compact ? "size-8" : "size-11 lg:size-8";
  const icon = compact ? "size-4" : "size-5 lg:size-4";

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("shrink-0", size)}
        aria-label={toggleLabel}
        title={toggleLabel}
        disabled={pending}
        onClick={() => onToggle(token)}
      >
        {pending ? (
          <Loader2 className={cn("animate-spin", icon)} />
        ) : token.isActive ? (
          <PowerOff className={icon} />
        ) : (
          <Power className={icon} />
        )}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("shrink-0", size)}
        aria-label={t("common.edit")}
        title={t("common.edit")}
        disabled={pending}
        onClick={() => onEdit(token)}
      >
        <Pencil className={icon} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("shrink-0", size)}
        aria-label={deleteLabel}
        title={deleteLabel}
        disabled={pending || token.nonDeletable}
        onClick={() => onDelete(token)}
      >
        <Trash2 className={cn("text-destructive", icon)} />
      </Button>
    </div>
  );
}
