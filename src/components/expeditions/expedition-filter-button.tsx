import { useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getStatusTokens } from "@/lib/colors";
import { commandStatusCategory } from "@/lib/status";
import { COMMAND_STATUSES, type CommandExpedition } from "@/features/commands";
import { UNASSIGNED, type Zone } from "@/features/zones";
import {
  EMPTY_EXPEDITION_FILTERS,
  commandZoneId,
  normalizeZoneId,
  toggleFilterValue,
  type ExpeditionFilters,
} from "./expedition-filters";

interface FilterRowProps {
  checked: boolean;
  onToggle: () => void;
  count: number;
  dot?: string;
  children: ReactNode;
}

function FilterRow({ checked, onToggle, count, dot, children }: FilterRowProps) {
  return (
    <label className="flex min-h-10 cursor-pointer select-none items-center gap-2.5 rounded-md px-2 text-sm hover:bg-accent lg:min-h-8">
      <Checkbox checked={checked} onCheckedChange={onToggle} />
      {dot && (
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: dot }}
          aria-hidden
        />
      )}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {count}
      </span>
    </label>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="px-2 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}

interface ExpeditionFilterButtonProps {
  filters: ExpeditionFilters;
  onChange: (next: ExpeditionFilters) => void;
  commands: CommandExpedition[];
  zones: Zone[];
  className?: string;
  iconClassName?: string;
}

export function ExpeditionFilterButton({
  filters,
  onChange,
  commands,
  zones,
  className,
  iconClassName,
}: ExpeditionFilterButtonProps) {
  const { t } = useTranslation();
  const activeCount = filters.statusIds.length + filters.zoneIds.length;
  const active = activeCount > 0;

  const counts = useMemo(() => {
    const byStatus = new Map<number, number>();
    const byZone = new Map<string, number>();
    for (const command of commands) {
      const statusId = command.status?.id;
      if (statusId != null) {
        byStatus.set(statusId, (byStatus.get(statusId) ?? 0) + 1);
      }
      const zoneId = commandZoneId(command);
      byZone.set(zoneId, (byZone.get(zoneId) ?? 0) + 1);
    }
    return { byStatus, byZone };
  }, [commands]);

  const zoneOptions = useMemo(
    () =>
      zones.map((zone) => ({
        id: normalizeZoneId(zone.id),
        name: zone.name,
      })),
    [zones]
  );
  const showZones =
    zoneOptions.length > 0 ||
    filters.zoneIds.length > 0 ||
    counts.byZone.size > 1;

  const label = active
    ? t("expeditions.filters.active", { count: activeCount })
    : t("common.filters");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={active ? "default" : "outline"}
          size="icon"
          className={cn("relative shrink-0", className)}
          title={label}
          aria-label={label}
        >
          <ListFilter className={iconClassName} />
          {active && (
            <span
              className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full border border-primary bg-background text-[11px] font-semibold tabular-nums text-primary"
              aria-hidden
            >
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        collisionPadding={8}
        className="flex max-h-[var(--radix-popover-content-available-height)] w-72 flex-col overflow-y-auto p-2"
      >
        <div className="flex items-center justify-between gap-2 px-2 py-1">
          <span className="text-sm font-medium">{t("common.filters")}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            disabled={!active}
            onClick={() => onChange(EMPTY_EXPEDITION_FILTERS)}
          >
            {t("common.clearFilters")}
          </Button>
        </div>

        <FilterGroup title={t("common.status")}>
          {COMMAND_STATUSES.map((status) => (
            <FilterRow
              key={status.id}
              checked={filters.statusIds.includes(status.id)}
              onToggle={() =>
                onChange({
                  ...filters,
                  statusIds: toggleFilterValue(filters.statusIds, status.id),
                })
              }
              count={counts.byStatus.get(status.id) ?? 0}
              dot={getStatusTokens(commandStatusCategory(status.id)).strong}
            >
              {status.name}
            </FilterRow>
          ))}
        </FilterGroup>

        {showZones && (
          <FilterGroup title={t("expeditions.filters.zone")}>
            {zoneOptions.map((zone) => (
              <FilterRow
                key={zone.id}
                checked={filters.zoneIds.includes(zone.id)}
                onToggle={() =>
                  onChange({
                    ...filters,
                    zoneIds: toggleFilterValue(filters.zoneIds, zone.id),
                  })
                }
                count={counts.byZone.get(zone.id) ?? 0}
              >
                {zone.name}
              </FilterRow>
            ))}
            <FilterRow
              checked={filters.zoneIds.includes(UNASSIGNED)}
              onToggle={() =>
                onChange({
                  ...filters,
                  zoneIds: toggleFilterValue(filters.zoneIds, UNASSIGNED),
                })
              }
              count={counts.byZone.get(UNASSIGNED) ?? 0}
            >
              {t("expeditions.filters.noZone")}
            </FilterRow>
          </FilterGroup>
        )}
      </PopoverContent>
    </Popover>
  );
}
