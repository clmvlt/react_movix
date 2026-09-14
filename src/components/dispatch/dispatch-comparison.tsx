import { Fragment, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TourDispatchWorkload } from "@/features/tours";
import {
  formatKilometers,
  formatMinutes,
  roundKilometers,
  workloadDurationMins,
} from "./dispatch-plan";

interface DispatchComparisonProps {
  current: TourDispatchWorkload;
  proposed: TourDispatchWorkload;
  lang: string;
}

interface ComparisonRow {
  key: string;
  label: string;
  current: number;
  proposed: number;
  format: (value: number) => string;
  round: (value: number) => number;
  neutral?: boolean;
}

export function DispatchComparison({
  current,
  proposed,
  lang,
}: DispatchComparisonProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const prefix = "expeditions.dispatch.result.comparison";
  const km = (value: number) => formatKilometers(value, lang);

  const rows: ComparisonRow[] = [
    {
      key: "tours",
      label: t(`${prefix}.tours`),
      current: current.tours,
      proposed: proposed.tours,
      format: String,
      round: Math.round,
      neutral: true,
    },
    {
      key: "commands",
      label: t(`${prefix}.commands`),
      current: current.commands,
      proposed: proposed.commands,
      format: String,
      round: Math.round,
      neutral: true,
    },
    {
      key: "duration",
      label: t(`${prefix}.duration`),
      current: workloadDurationMins(current),
      proposed: workloadDurationMins(proposed),
      format: formatMinutes,
      round: Math.round,
    },
    {
      key: "driving",
      label: t(`${prefix}.driving`),
      current: current.drivingMins,
      proposed: proposed.drivingMins,
      format: formatMinutes,
      round: Math.round,
    },
    {
      key: "distance",
      label: t(`${prefix}.distance`),
      current: current.distanceKm,
      proposed: proposed.distanceKm,
      format: km,
      round: roundKilometers,
    },
    {
      key: "waiting",
      label: t(`${prefix}.waiting`),
      current: current.waitingMins,
      proposed: proposed.waitingMins,
      format: formatMinutes,
      round: Math.round,
    },
    {
      key: "violations",
      label: t(`${prefix}.violations`),
      current: current.timeWindowViolations,
      proposed: proposed.timeWindowViolations,
      format: String,
      round: Math.round,
    },
    {
      key: "spread",
      label: t(`${prefix}.spread`),
      current: current.spreadMins,
      proposed: proposed.spreadMins,
      format: formatMinutes,
      round: Math.round,
    },
  ];

  const sameCommands = current.commands === proposed.commands;
  const currentDuration = Math.round(workloadDurationMins(current));
  const saved = currentDuration - Math.round(workloadDurationMins(proposed));
  const percent =
    currentDuration > 0 ? Math.round((saved / currentDuration) * 100) : 0;

  let headline = t(`${prefix}.noGain`);
  if (!sameCommands) {
    headline = t(`${prefix}.moreCommands`, {
      count: proposed.commands - current.commands,
    });
  } else if (saved > 0) {
    headline = t(`${prefix}.gain`, { duration: formatMinutes(saved), percent });
  }

  return (
    <section className="rounded-lg border border-border bg-muted/40 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-sm font-medium text-foreground">
            {t(`${prefix}.title`)}
          </p>
          <p
            className={cn(
              "text-sm font-medium",
              sameCommands && saved > 0
                ? "text-status-success-text"
                : "text-muted-foreground"
            )}
          >
            {headline}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-10 shrink-0 self-start sm:self-center lg:min-h-9"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? t(`${prefix}.hideDetails`) : t(`${prefix}.showDetails`)}
          <ChevronDown
            className={cn("transition-transform", expanded && "rotate-180")}
            aria-hidden
          />
        </Button>
      </div>
      {expanded && (
        <div
          id={panelId}
          className="mt-3 flex max-w-2xl flex-col gap-2 border-t border-border pt-3"
        >
          <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-baseline gap-x-3 gap-y-1.5 text-sm tabular-nums sm:gap-x-6">
            <span />
            <span className="text-right text-xs text-muted-foreground">
              {t(`${prefix}.current`)}
            </span>
            <span className="text-right text-xs text-muted-foreground">
              {t(`${prefix}.proposed`)}
            </span>
            <span className="text-right text-xs text-muted-foreground">
              {t(`${prefix}.difference`)}
            </span>
            {rows.map((row) => {
              const delta = row.round(row.proposed - row.current);
              let text = "=";
              if (delta !== 0) {
                text = `${delta > 0 ? "+" : "-"}${row.format(Math.abs(delta))}`;
              }
              let tone = "text-muted-foreground";
              if (!row.neutral && delta < 0) tone = "text-status-success-text";
              if (!row.neutral && delta > 0) tone = "text-destructive";
              return (
                <Fragment key={row.key}>
                  <span className="min-w-0 text-xs leading-tight text-muted-foreground sm:text-sm">
                    {row.label}
                  </span>
                  <span className="text-right text-foreground">
                    {row.format(row.current)}
                  </span>
                  <span className="text-right font-medium text-foreground">
                    {row.format(row.proposed)}
                  </span>
                  <span className={cn("text-right text-xs font-medium", tone)}>
                    {text}
                  </span>
                </Fragment>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">{t(`${prefix}.note`)}</p>
        </div>
      )}
    </section>
  );
}
