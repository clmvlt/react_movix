import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SelectionBarProps {
  count: number;
  onClear: () => void;
  children: ReactNode;
}

export function SelectionBar({ count, onClear, children }: SelectionBarProps) {
  const { t } = useTranslation();
  if (count === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-lg backdrop-blur lg:hidden">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
          {t("expeditions.selected", { count })}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-10 shrink-0"
          onClick={onClear}
          aria-label={t("expeditions.clearSelection")}
        >
          <X className="size-5" />
        </Button>
      </div>
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {children}
      </div>
    </div>
  );
}
