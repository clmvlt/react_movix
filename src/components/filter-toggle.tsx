import { useTranslation } from "react-i18next";
import { ChevronDown, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FilterCountBadgeProps {
  count: number;
  className?: string;
}

export function FilterCountBadge({ count, className }: FilterCountBadgeProps) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-medium tabular-nums text-primary-foreground",
        className
      )}
    >
      {count}
    </span>
  );
}

interface FilterToggleButtonProps {
  open: boolean;
  onToggle: () => void;
  count: number;
}

export function FilterToggleButton({
  open,
  onToggle,
  count,
}: FilterToggleButtonProps) {
  const { t } = useTranslation();
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={onToggle}
      aria-expanded={open}
      aria-label={t("common.filters")}
      className={cn(
        "relative size-11 shrink-0 lg:hidden",
        open && "bg-accent text-accent-foreground"
      )}
    >
      <ListFilter />
      <FilterCountBadge
        count={count}
        className="absolute -right-1.5 -top-1.5"
      />
    </Button>
  );
}

interface FilterSummaryButtonProps {
  open: boolean;
  onToggle: () => void;
  count: number;
  label: string;
}

export function FilterSummaryButton({
  open,
  onToggle,
  count,
  label,
}: FilterSummaryButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onToggle}
      aria-expanded={open}
      className="min-h-11 min-w-0 flex-1 justify-start font-normal lg:hidden"
    >
      <ListFilter className="text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate text-left">{label}</span>
      <FilterCountBadge count={count} />
      <ChevronDown
        className={cn(
          "text-muted-foreground transition-transform",
          open && "rotate-180"
        )}
      />
    </Button>
  );
}
