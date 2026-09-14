import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  ArrowLeftRight,
  Boxes,
  ChevronDown,
  Clock,
  Hourglass,
  MapPin,
  Package,
  Route as RouteIcon,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColorPicker } from "@/components/color-picker";
import { DeliveryWindowBadge } from "@/components/delivery-window-badge";
import { contrastTextOn, safeCategoryColor } from "@/lib/colors";
import { formatTime } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { TourDispatchProposal } from "@/features/tours";
import {
  formatKilometers,
  formatMinutes,
  routeDurationMins,
  type ProposalStop,
} from "./dispatch-plan";

interface DispatchTourCardProps {
  proposal: TourDispatchProposal;
  stops: ProposalStop[];
  name: string;
  color: string;
  focused: boolean;
  reorganizing: boolean;
  onNameChange: (name: string) => void;
  onColorChange: (color: string) => void;
  onFocus: () => void;
}

export function DispatchTourCard({
  proposal,
  stops,
  name,
  color,
  focused,
  reorganizing,
  onNameChange,
  onColorChange,
  onFocus,
}: DispatchTourCardProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? "en";
  const [expanded, setExpanded] = useState(false);
  const route = proposal.route;
  const swatch = safeCategoryColor(color);
  const existing = proposal.matchedTourId !== null;
  const invalid = !existing && name.trim().length === 0;
  const returnTime = formatTime(route.returnLeg?.arrivalTime, lang);
  const packages = stops.reduce((sum, stop) => sum + stop.packages, 0);
  const issues = stops.filter((stop) => stop.issue !== null).length;
  const focusLabel = t("expeditions.dispatch.result.focus");

  return (
    <section
      className={cn(
        "shrink-0 rounded-xl border border-border bg-card",
        focused && "border-primary ring-1 ring-primary"
      )}
    >
      <div className="flex items-center gap-2 p-3 pb-2">
        {existing ? (
          <>
            <span
              className="size-11 shrink-0 rounded-full border-2 border-border lg:size-9"
              style={{ backgroundColor: swatch }}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {proposal.unchanged
                  ? t("expeditions.dispatch.result.unchanged")
                  : t("expeditions.dispatch.result.existing")}
              </p>
            </div>
          </>
        ) : (
          <>
            <ColorPicker
              value={swatch}
              onChange={onColorChange}
              swatches={false}
              manage={false}
              label={t("expeditions.dispatch.result.tourColor")}
              className="shrink-0 flex-nowrap"
              triggerClassName="size-11 lg:size-9"
            />
            <Input
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              aria-label={t("expeditions.dispatch.result.tourName")}
              aria-invalid={invalid || undefined}
              className={cn(
                "min-h-11 lg:h-9 lg:min-h-9",
                invalid && "border-destructive"
              )}
            />
          </>
        )}
        <Button
          type="button"
          variant={focused ? "default" : "outline"}
          size="icon"
          className="size-11 shrink-0 lg:size-9"
          aria-pressed={focused}
          aria-label={focusLabel}
          title={focusLabel}
          onClick={onFocus}
        >
          <MapPin />
        </Button>
      </div>
      {invalid && (
        <p className="px-3 pb-1 text-xs text-destructive" role="alert">
          {t("expeditions.dispatch.result.nameRequired")}
        </p>
      )}
      {!existing && reorganizing && (
        <p className="px-3 pb-1 text-xs text-muted-foreground">
          {t("expeditions.dispatch.result.newTour")}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 pb-3 text-xs text-muted-foreground">
        <Stat
          icon={MapPin}
          text={t("expeditions.dispatch.result.stops", { count: stops.length })}
        />
        <Stat
          icon={Package}
          text={t("expeditions.dispatch.result.commands", {
            count: proposal.commandIds.length,
          })}
        />
        <Stat
          icon={Boxes}
          text={t("expeditions.dispatch.result.packages", { count: packages })}
        />
        <Stat
          icon={Clock}
          text={formatMinutes(routeDurationMins(route))}
          label={t("expeditions.dispatch.result.duration")}
        />
        <Stat
          icon={RouteIcon}
          text={formatKilometers(route.estimateKm ?? 0, lang)}
          label={t("expeditions.dispatch.result.distance")}
        />
        {returnTime && (
          <span className="tabular-nums">
            {t("expeditions.dispatch.result.returnAt", { time: returnTime })}
          </span>
        )}
        {existing && !proposal.unchanged && (
          <Stat
            icon={ArrowLeftRight}
            text={t("expeditions.dispatch.result.moves", {
              kept: proposal.kept,
              incoming: proposal.incoming,
              outgoing: proposal.outgoing,
            })}
          />
        )}
        {issues > 0 && (
          <span className="inline-flex items-center gap-1 font-medium text-destructive">
            <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
            {t("expeditions.dispatch.result.issues", { count: issues })}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className={cn(
          "flex min-h-11 w-full items-center justify-between gap-2 border-t border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent lg:min-h-10",
          !expanded && "rounded-b-xl"
        )}
      >
        {expanded
          ? t("expeditions.dispatch.result.hideStops")
          : t("expeditions.dispatch.result.showStops")}
        <ChevronDown
          className={cn(
            "size-4 shrink-0 transition-transform",
            expanded && "rotate-180"
          )}
        />
      </button>
      {expanded && (
        <ol className="divide-y divide-border border-t border-border">
          {stops.map((stop, index) => (
            <StopRow
              key={`${stop.key}-${index}`}
              stop={stop}
              index={index}
              color={swatch}
              lang={lang}
            />
          ))}
        </ol>
      )}
    </section>
  );
}

function Stat({
  icon: Icon,
  text,
  label,
}: {
  icon: LucideIcon;
  text: string;
  label?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 tabular-nums"
      aria-label={label ? `${label} ${text}` : undefined}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {text}
    </span>
  );
}

function StopRow({
  stop,
  index,
  color,
  lang,
}: {
  stop: ProposalStop;
  index: number;
  color: string;
  lang: string;
}) {
  const { t } = useTranslation();
  const arrival = formatTime(stop.arrival, lang);
  const count = stop.commandIds.length;
  const details = [
    stop.city,
    count > 1 ? t("expeditions.dispatch.result.commands", { count }) : null,
  ]
    .filter(Boolean)
    .join(" - ");

  const hasWindow = Boolean(stop.windowStart || stop.windowEnd);

  return (
    <li className="flex items-start gap-2.5 px-3 py-2">
      <span
        className="mt-px flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums"
        style={{ backgroundColor: color, color: contrastTextOn(color) }}
      >
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="min-w-0 truncate text-sm font-medium text-foreground">
            {stop.name || t("commands.noPharmacy")}
          </p>
          {arrival && (
            <span
              className={cn(
                "shrink-0 text-xs tabular-nums text-muted-foreground",
                stop.issue === "late" && "font-medium text-destructive"
              )}
              aria-label={t("expeditions.dispatch.result.arrival", {
                time: arrival,
              })}
            >
              {arrival}
            </span>
          )}
        </div>
        {details && (
          <p className="truncate text-xs text-muted-foreground">{details}</p>
        )}
        {(hasWindow || stop.issue) && (
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <DeliveryWindowBadge start={stop.windowStart} end={stop.windowEnd} />
            {stop.issue === "late" && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                <AlertTriangle className="size-3 shrink-0" aria-hidden />
                {t("expeditions.dispatch.result.late", { minutes: stop.lateMins })}
              </span>
            )}
            {stop.issue === "waiting" && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-status-warning-text">
                <Hourglass className="size-3 shrink-0" aria-hidden />
                {t("expeditions.dispatch.result.waitingTooLong", {
                  minutes: stop.waitingMins,
                })}
              </span>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
