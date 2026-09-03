import { useTranslation } from "react-i18next";
import {
  ChevronRight,
  Map as MapIcon,
  MapPinned,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/states";
import { cn } from "@/lib/utils";
import { unassignedColor } from "@/lib/colors";
import { UNASSIGNED, type Zone } from "@/features/zones";

interface ZoneListPanelProps {
  zones: Zone[];
  colors: Record<string, string>;
  unassignedCount: number | null;
  isolate: string | null;
  onIsolate: (value: string | null) => void;
  onSelect: (value: string) => void;
  onCreate: () => void;
  onRename: (zone: Zone) => void;
  onDelete: (zone: Zone) => void;
  className?: string;
}

export function ZoneListPanel({
  zones,
  colors,
  unassignedCount,
  isolate,
  onIsolate,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  className,
}: ZoneListPanelProps) {
  const { t } = useTranslation();

  const isolateButton = (key: string) => {
    const active = isolate === key;
    const label = active ? t("zones.legend.showAll") : t("zones.showOnMap");
    return (
      <Button
        variant={active ? "default" : "ghost"}
        size="icon"
        className="size-11 shrink-0 lg:size-8"
        onClick={() => onIsolate(active ? null : key)}
        aria-pressed={active}
        title={label}
        aria-label={label}
      >
        <MapIcon className="size-5 lg:size-4" />
      </Button>
    );
  };

  return (
    <div className={cn("flex min-h-0 flex-col gap-3", className)}>
      <div className="flex shrink-0 items-center gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-foreground">
            {t("zones.title")}
          </h1>
          <p className="truncate text-xs text-muted-foreground">
            {t("zones.subtitle")}
          </p>
        </div>
        <Button onClick={onCreate} className="min-h-11 shrink-0 lg:min-h-10">
          <Plus className="size-4" />
          {t("zones.create")}
        </Button>
      </div>

      <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
        <li>
          <div className="flex items-center gap-1.5 rounded-xl border border-dashed bg-card px-2 py-2">
            <button
              type="button"
              onClick={() => onSelect(UNASSIGNED)}
              className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg px-1 text-left transition-colors hover:bg-accent"
            >
              <span
                aria-hidden="true"
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: unassignedColor }}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">
                  {t("zones.unassigned")}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {t("zones.unassignedDesc")}
                </span>
              </span>
              {unassignedCount != null && (
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                  {unassignedCount}
                </span>
              )}
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
            {isolateButton(UNASSIGNED)}
          </div>
        </li>

        {zones.length === 0 ? (
          <li className="min-h-0 flex-1">
            <EmptyState
              message={t("zones.empty")}
              icon={<MapPinned className="size-8" />}
              className="h-full"
            />
          </li>
        ) : (
          zones.map((zone) => (
            <li key={zone.id}>
              <div className="flex items-center gap-1.5 rounded-xl border bg-card px-2 py-2">
                <button
                  type="button"
                  onClick={() => onSelect(zone.id)}
                  className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg px-1 text-left transition-colors hover:bg-accent"
                >
                  <span
                    aria-hidden="true"
                    className="size-3 shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        colors[zone.id.toLowerCase()] ?? unassignedColor,
                    }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {zone.name?.trim() || t("zones.untitled")}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {t("zones.pharmacyCount", {
                        count: zone.pharmacyCount ?? 0,
                      })}
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
                {isolateButton(zone.id.toLowerCase())}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 shrink-0 lg:size-8"
                  onClick={() => onRename(zone)}
                  title={t("common.edit")}
                  aria-label={t("common.edit")}
                >
                  <Pencil className="size-5 lg:size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 shrink-0 lg:size-8"
                  onClick={() => onDelete(zone)}
                  title={t("common.delete")}
                  aria-label={t("common.delete")}
                >
                  <Trash2 className="size-5 text-destructive lg:size-4" />
                </Button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
