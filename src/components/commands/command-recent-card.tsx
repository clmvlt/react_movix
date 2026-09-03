import { useTranslation } from "react-i18next";
import { ChevronRight, ClipboardList, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/section-card";
import { EmptyState, LoadingState } from "@/components/states";
import { formatDate } from "@/lib/date";
import type { CommandBasic } from "@/features/commands";

interface CommandRecentCardProps {
  commands: CommandBasic[];
  loading: boolean;
  hasPharmacy: boolean;
  onOpen: (id: string) => void;
  onOpenAll: () => void;
  className?: string;
}

export function CommandRecentCard({
  commands,
  loading,
  hasPharmacy,
  onOpen,
  onOpenAll,
  className,
}: CommandRecentCardProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? "en";

  return (
    <SectionCard
      title={t("commands.detail.recent")}
      icon={ClipboardList}
      className={className}
      contentClassName="flex flex-col gap-4"
    >
      {loading ? (
        <LoadingState />
      ) : commands.length === 0 ? (
        <EmptyState message={t("commands.detail.noRecent")} />
      ) : (
        <ul className="flex flex-col gap-1.5">
          {commands.map((command) => (
            <li key={command.id}>
              <button
                type="button"
                onClick={() => onOpen(command.id)}
                className="flex min-h-11 w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-left transition-colors hover:border-primary/40 hover:bg-accent/30"
              >
                <span className="shrink-0 text-sm font-medium tabular-nums text-foreground">
                  {formatDate(command.expDate, lang)}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                  {command.comment?.trim() ?? ""}
                </span>
                <ChevronRight
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
      {hasPharmacy && (
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full sm:w-fit lg:min-h-10"
          onClick={onOpenAll}
        >
          <Package className="size-4" />
          {t("commands.pharmacyOrders")}
        </Button>
      )}
    </SectionCard>
  );
}
