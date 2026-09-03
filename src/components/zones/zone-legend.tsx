import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { unassignedColor } from "@/lib/colors";
import { UNASSIGNED, type Zone } from "@/features/zones";

interface ZoneLegendProps {
  zones: Zone[];
  colors: Record<string, string>;
  isolate: string | null;
  onIsolate: (value: string | null) => void;
  hiddenCount: number;
  className?: string;
}

export function ZoneLegend({
  zones,
  colors,
  isolate,
  onIsolate,
  hiddenCount,
  className,
}: ZoneLegendProps) {
  const { t } = useTranslation();
  if (zones.length === 0) return null;

  const entries = [
    { key: UNASSIGNED, label: t("zones.unassigned"), color: unassignedColor },
    ...zones.map((zone) => ({
      key: zone.id.toLowerCase(),
      label: zone.name?.trim() || t("zones.untitled"),
      color: colors[zone.id.toLowerCase()] ?? unassignedColor,
    })),
  ];

  return (
    <div
      className={cn(
        "absolute inset-x-2 bottom-2 z-10 rounded-xl border bg-card/95 p-1.5 shadow-sm backdrop-blur lg:inset-x-auto lg:bottom-3 lg:left-3 lg:max-h-56 lg:w-56 lg:overflow-y-auto lg:p-2",
        className
      )}
    >
      <div className="flex gap-1.5 overflow-x-auto lg:flex-col lg:overflow-x-visible">
        {isolate && (
          <button
            type="button"
            onClick={() => onIsolate(null)}
            className="flex min-h-9 shrink-0 items-center rounded-lg px-2 text-xs font-medium text-primary transition-colors hover:bg-accent lg:min-h-8 lg:w-full lg:justify-start"
          >
            {t("zones.legend.showAll")}
          </button>
        )}
        {entries.map((entry) => {
          const active = isolate === entry.key;
          return (
            <button
              key={entry.key}
              type="button"
              onClick={() => onIsolate(active ? null : entry.key)}
              aria-pressed={active}
              title={t("zones.legend.isolate")}
              aria-label={`${entry.label} - ${t("zones.legend.isolate")}`}
              className={cn(
                "flex min-h-9 shrink-0 items-center gap-2 rounded-lg px-2 text-xs transition-colors lg:min-h-8 lg:w-full",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent"
              )}
            >
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="truncate">{entry.label}</span>
            </button>
          );
        })}
      </div>
      {hiddenCount > 0 && (
        <p className="mt-1 hidden px-2 text-[11px] leading-4 text-muted-foreground lg:block">
          {t("zones.legend.withoutCoordinates", { count: hiddenCount })}
        </p>
      )}
    </div>
  );
}
