import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CalendarClock,
  Copy,
  MoreVertical,
  Pencil,
  Plus,
  ReceiptText,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/page-header";
import { EmptyState, LoadingState } from "@/components/states";
import { useApiErrorMessage } from "@/components/account/use-account-error";
import { fromTourHour } from "@/components/tour-configs/tour-config-form";
import {
  TourConfigFormDialog,
  type TourConfigDialogMode,
} from "@/components/tour-configs/tour-config-form-dialog";
import { TourConfigDeleteDialog } from "@/components/tour-configs/tour-config-delete-dialog";
import { profilFullName } from "@/features/auth";
import { clientRefLabel } from "@/features/clients";
import {
  activeWeekdays,
  isEveryDay,
  isWorkdaysOnly,
  toRecurrence,
  useTourConfigs,
  type TourConfig,
} from "@/features/tour-configs";

export function TourConfigsPage() {
  const { t } = useTranslation();
  const configsQuery = useTourConfigs();
  const errorMessage = useApiErrorMessage("tourConfigs");

  const [dialog, setDialog] = useState<{
    mode: TourConfigDialogMode;
    config: TourConfig | null;
  } | null>(null);
  const [deleting, setDeleting] = useState<TourConfig | null>(null);

  const configs = configsQuery.data ?? [];

  const describeRecurrence = (config: TourConfig): string => {
    const recurrence = toRecurrence(config.recurrence);
    const days = activeWeekdays(recurrence);
    if (days.length === 0) return t("tourConfigs.neverRuns");
    if (isEveryDay(recurrence)) return t("tourConfigs.everyDay");
    if (isWorkdaysOnly(recurrence)) return t("tourConfigs.weekdaysOnly");
    return days.map((day) => t(`tourConfigs.weekdaysShort.${day}`)).join(" ");
  };

  const renderList = () => {
    if (configsQuery.isLoading) return <LoadingState />;
    if (configsQuery.isError) {
      return (
        <Alert variant="warning">
          <AlertDescription>
            {errorMessage(configsQuery.error, "tourConfigs.errors.loadFailed")}
          </AlertDescription>
        </Alert>
      );
    }
    if (configs.length === 0) {
      return (
        <EmptyState
          message={t("tourConfigs.empty")}
          icon={<CalendarClock className="size-8" />}
          className="flex-1"
        />
      );
    }

    return (
      <ul className="grid gap-2 lg:grid-cols-2 xl:grid-cols-3">
        {configs.map((config) => (
          <li
            key={config.id}
            className="flex items-center gap-2 rounded-xl border border-border bg-card p-3"
          >
            <button
              type="button"
              className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left"
              onClick={() => setDialog({ mode: "edit", config })}
            >
              <span className="flex min-w-0 items-center gap-2">
                {config.tourColor && (
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: config.tourColor }}
                  />
                )}
                <span className="truncate text-sm font-medium text-foreground">
                  {config.tourName}
                </span>
              </span>
              <span className="text-xs text-muted-foreground">
                {t("tourConfigs.at", {
                  hour: fromTourHour(config.tourHour),
                })}{" "}
                - {describeRecurrence(config)}
              </span>
              <span className="flex flex-wrap gap-1">
                <Badge variant="outline">
                  {config.zone?.name ?? t("tourConfigs.noZone")}
                </Badge>
                <Badge variant="outline">
                  {config.profil
                    ? profilFullName(config.profil)
                    : t("tourConfigs.noDriver")}
                </Badge>
                {config.client && (
                  <Badge variant="outline" className="max-w-full gap-1">
                    <ReceiptText className="size-3 shrink-0" aria-hidden />
                    <span className="truncate">
                      {clientRefLabel(config.client)}
                    </span>
                  </Badge>
                )}
              </span>
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-11 shrink-0 lg:size-8"
                  aria-label={t("common.actions")}
                >
                  <MoreVertical className="size-5 lg:size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  className="min-h-11 lg:min-h-9"
                  onSelect={() => setDialog({ mode: "edit", config })}
                >
                  <Pencil className="size-4" />
                  {t("common.edit")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="min-h-11 lg:min-h-9"
                  onSelect={() => setDialog({ mode: "duplicate", config })}
                >
                  <Copy className="size-4" />
                  {t("tourConfigs.form.duplicateAction")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="min-h-11 lg:min-h-9"
                  onSelect={() => setDeleting(config)}
                >
                  <Trash2 className="size-4 text-destructive" />
                  {t("common.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="flex w-full flex-1 flex-col">
      <PageHeader
        title={t("tourConfigs.title")}
        subtitle={t("tourConfigs.subtitle")}
        actions={
          <Button
            type="button"
            className="min-h-11 lg:min-h-10"
            onClick={() => setDialog({ mode: "create", config: null })}
          >
            <Plus className="size-4" />
            {t("tourConfigs.create")}
          </Button>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <Alert>
          <AlertDescription>{t("tourConfigs.deferredNotice")}</AlertDescription>
        </Alert>
        {renderList()}
      </div>

      <TourConfigFormDialog
        open={Boolean(dialog)}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
        mode={dialog?.mode ?? "create"}
        config={dialog?.config ?? null}
        configs={configs}
      />
      <TourConfigDeleteDialog
        config={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      />
    </div>
  );
}
