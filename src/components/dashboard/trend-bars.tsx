import { useTranslation } from "react-i18next";
import type { StatsDailyItem } from "@/features/stats";
import { getStatusTokens } from "@/lib/colors";
import { apiDateToDate, formatDate, formatWeekdayNarrow } from "@/lib/date";
import { cn } from "@/lib/utils";

const MIN_BAR_PERCENT = 2;

export function TrendBars({
  days,
  currentDate,
}: {
  days: StatsDailyItem[];
  currentDate: string;
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const success = getStatusTokens("success").strong;
  const max = days.reduce((peak, day) => Math.max(peak, day.totalCommands), 0);

  return (
    <div className="flex h-32 items-stretch gap-1 sm:gap-2">
      {days.map((day) => {
        const date = apiDateToDate(day.date);
        const height =
          max > 0
            ? Math.max(MIN_BAR_PERCENT, (day.totalCommands / max) * 100)
            : MIN_BAR_PERCENT;
        const deliveredHeight =
          day.totalCommands > 0
            ? (day.deliveredCommands / day.totalCommands) * 100
            : 0;
        const isCurrent = day.date === currentDate;
        const label = t("dashboard.trend.dayLabel", {
          date: formatDate(date, lang),
          total: day.totalCommands,
          delivered: day.deliveredCommands,
        });

        return (
          <div
            key={day.date}
            className="flex min-w-0 flex-1 flex-col items-center gap-1"
            title={label}
            aria-label={label}
          >
            <div className="flex w-full flex-1 items-end">
              <div
                className={cn(
                  "flex w-full flex-col justify-end overflow-hidden rounded-sm bg-muted",
                  isCurrent && "ring-2 ring-primary/40"
                )}
                style={{ height: `${height}%` }}
              >
                <div
                  style={{
                    height: `${deliveredHeight}%`,
                    backgroundColor: success,
                  }}
                />
              </div>
            </div>
            <span
              className={cn(
                "text-[11px] uppercase",
                isCurrent
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {formatWeekdayNarrow(date, lang)}
            </span>
            <span className="w-full truncate text-center text-[10px] tabular-nums text-muted-foreground">
              {day.totalCommands}
            </span>
          </div>
        );
      })}
    </div>
  );
}
