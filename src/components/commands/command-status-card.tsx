import { useTranslation } from "react-i18next";
import { CircleDot, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { StatusTimeline } from "@/components/status-timeline";
import { ErrorState, LoadingState } from "@/components/states";
import { commandStatusCategory } from "@/lib/status";
import { useCommandHistory, type CommandDetail } from "@/features/commands";

interface CommandStatusCardProps {
  command: CommandDetail;
  locked: boolean;
  onChangeStatus: () => void;
  className?: string;
}

export function CommandStatusCard({
  command,
  locked,
  onChangeStatus,
  className,
}: CommandStatusCardProps) {
  const { t } = useTranslation();
  const history = useCommandHistory(command.id);

  return (
    <SectionCard
      title={t("common.status")}
      description={t("commands.detail.historySubtitle")}
      icon={History}
      className={className}
      contentClassName="flex flex-col gap-4"
      extra={
        command.status ? (
          <StatusBadge
            label={command.status.name}
            category={commandStatusCategory(command.status.id)}
            className="shrink-0"
          />
        ) : undefined
      }
    >
      <Button
        type="button"
        variant="outline"
        className="min-h-11 w-full sm:w-fit lg:min-h-10"
        disabled={locked}
        onClick={onChangeStatus}
      >
        <CircleDot className="size-4" />
        {t("expeditions.changeStatus")}
      </Button>

      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase text-muted-foreground">
          {t("commands.detail.history")}
        </p>
        {history.isLoading ? (
          <LoadingState />
        ) : history.isError ? (
          <ErrorState onRetry={() => void history.refetch()} />
        ) : (
          <StatusTimeline
            entries={history.data ?? []}
            category={commandStatusCategory}
            emptyMessage={t("commands.detail.noHistory")}
          />
        )}
      </div>
    </SectionCard>
  );
}
