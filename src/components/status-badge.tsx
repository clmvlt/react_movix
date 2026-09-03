import { Pencil } from "lucide-react";
import { getStatusTokens, type StatusCategory } from "@/lib/colors";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  label: string;
  category: StatusCategory;
  className?: string;
  onEdit?: () => void;
  editLabel?: string;
  disabled?: boolean;
}

export function StatusBadge({
  label,
  category,
  className,
  onEdit,
  editLabel,
  disabled = false,
}: StatusBadgeProps) {
  const tokens = getStatusTokens(category);
  const content = (
    <>
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: tokens.strong }}
        aria-hidden
      />
      {label}
    </>
  );
  const base =
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium";
  const style = { backgroundColor: tokens.badgeBg, color: tokens.badgeText };

  if (!onEdit) {
    return (
      <span className={cn(base, className)} style={style}>
        {content}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onEdit}
      disabled={disabled}
      title={editLabel}
      aria-label={editLabel ? `${editLabel} : ${label}` : label}
      className={cn(
        base,
        "cursor-pointer transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-default disabled:opacity-60",
        className
      )}
      style={style}
    >
      {content}
      <Pencil className="size-3 shrink-0 opacity-70" aria-hidden />
    </button>
  );
}
