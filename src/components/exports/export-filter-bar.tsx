import { useTranslation } from "react-i18next";
import { CalendarRange, RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { DateField } from "@/components/date-field";
import { cn } from "@/lib/utils";
import { DATE_PRESETS, type ExportFiltersApi } from "./use-export-filters";

export function ExportFilterBar({ api }: { api: ExportFiltersApi }) {
  const { t } = useTranslation();
  const {
    filters,
    setFilter,
    rangeDaysInclusive,
    rangeError,
    rangeWarning,
    rangeDays,
    activePreset,
    applyPreset,
    reset,
  } = api;

  const status = rangeError
    ? {
        tone: "text-destructive",
        alert: true,
        message: t(`exports.filters.errors.${rangeError}`),
      }
    : rangeWarning
      ? {
          tone: "text-status-warning-text",
          alert: true,
          message: t(`exports.filters.warnings.${rangeWarning}`, {
            count: rangeDays,
          }),
        }
      : {
          tone: "text-muted-foreground",
          alert: false,
          message: t("exports.filters.rangeSummary", {
            count: rangeDaysInclusive,
          }),
        };

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <CalendarRange className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-sm font-semibold">
              {t("exports.filters.title")}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="min-h-10 shrink-0 text-muted-foreground"
            onClick={reset}
          >
            <RotateCcw className="size-3.5" />
            {t("exports.filters.reset")}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="export-start-date">
              {t("exports.filters.startDate")}
            </Label>
            <DateField
              id="export-start-date"
              value={filters.startDate}
              max={filters.endDate || undefined}
              onChange={(value) => setFilter("startDate", value)}
              className="min-h-11 lg:min-h-10"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="export-end-date">
              {t("exports.filters.endDate")}
            </Label>
            <DateField
              id="export-end-date"
              value={filters.endDate}
              min={filters.startDate || undefined}
              onChange={(value) => setFilter("endDate", value)}
              className="min-h-11 lg:min-h-10"
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>{t("exports.filters.presets")}</Label>
            <div className="flex flex-wrap gap-2">
              {DATE_PRESETS.map((preset) => (
                <Button
                  key={preset}
                  variant={activePreset === preset ? "default" : "outline"}
                  className="min-h-11 flex-1 px-3 sm:flex-none lg:min-h-10"
                  onClick={() => applyPreset(preset)}
                >
                  {t(`exports.filters.preset.${preset}`)}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <p className={cn("flex min-h-5 items-start gap-1.5 text-xs", status.tone)}>
          {status.alert && (
            <TriangleAlert className="mt-px size-3.5 shrink-0" />
          )}
          <span>{status.message}</span>
        </p>
      </CardContent>
    </Card>
  );
}
