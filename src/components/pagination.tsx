import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  onPageChange: (page: number) => void;
  totalPages?: number;
  totalElements?: number;
  count?: number;
  hasNext?: boolean;
  isFetching?: boolean;
  className?: string;
}

export function Pagination({
  page,
  onPageChange,
  totalPages,
  totalElements,
  count = 0,
  hasNext = false,
  isFetching = false,
  className,
}: PaginationProps) {
  const { t } = useTranslation();
  const knownTotal = totalPages != null && totalElements != null;
  const lastPage = Math.max(1, totalPages ?? 1);
  const results = knownTotal ? totalElements : count;
  const isLastPage = knownTotal ? page >= lastPage : !hasNext;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-2 border-t px-2 py-2",
        className
      )}
    >
      <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-xs text-muted-foreground">
        {isFetching && <Loader2 className="size-3.5 shrink-0 animate-spin" />}
        <span className="truncate tabular-nums">
          {results} {t("common.results")}
        </span>
      </span>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {knownTotal ? `${page} / ${lastPage}` : t("common.page", { page })}
      </span>
      <Button
        variant="outline"
        size="icon"
        className="size-11 shrink-0 lg:size-9"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        title={t("common.previous")}
        aria-label={t("common.previous")}
      >
        <ChevronLeft className="size-5 lg:size-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="size-11 shrink-0 lg:size-9"
        onClick={() => onPageChange(page + 1)}
        disabled={isLastPage}
        title={t("common.next")}
        aria-label={t("common.next")}
      >
        <ChevronRight className="size-5 lg:size-4" />
      </Button>
    </div>
  );
}
