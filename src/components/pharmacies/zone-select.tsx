import { useMemo } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { zoneColorMap } from "@/lib/colors";
import type { Zone } from "@/features/zones";

interface ZoneSelectOption {
  value: string;
  label: string;
}

interface ZoneSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  zones: Zone[];
  neutralLabel: string;
  extraOption?: ZoneSelectOption;
  ariaLabel: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

export function ZoneSelect({
  value,
  onChange,
  zones,
  neutralLabel,
  extraOption,
  ariaLabel,
  id,
  disabled,
  className,
}: ZoneSelectProps) {
  const colors = useMemo(
    () => zoneColorMap(zones.map((zone) => zone.id)),
    [zones]
  );

  const selectedZone = value
    ? zones.find((zone) => zone.id.toLowerCase() === value.toLowerCase())
    : undefined;

  const currentLabel = selectedZone
    ? selectedZone.name
    : value && extraOption && value === extraOption.value
      ? extraOption.label
      : neutralLabel;

  const dotColor = selectedZone
    ? colors[selectedZone.id.toLowerCase()]
    : undefined;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={ariaLabel}
          className={cn(
            "min-h-11 w-full justify-between gap-2 font-normal lg:min-h-10",
            className
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            {dotColor && (
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: dotColor }}
              />
            )}
            <span className="truncate">{currentLabel}</span>
          </span>
          <ChevronDown className="shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 w-64 overflow-y-auto">
        <DropdownMenuItem
          className="min-h-11 lg:min-h-9"
          onSelect={() => onChange(null)}
        >
          <Check
            className={cn("opacity-0", value === null && "opacity-100")}
          />
          <span className="truncate">{neutralLabel}</span>
        </DropdownMenuItem>

        {extraOption && (
          <DropdownMenuItem
            className="min-h-11 lg:min-h-9"
            onSelect={() => onChange(extraOption.value)}
          >
            <Check
              className={cn(
                "opacity-0",
                value === extraOption.value && "opacity-100"
              )}
            />
            <span className="truncate">{extraOption.label}</span>
          </DropdownMenuItem>
        )}

        {zones.length > 0 && <DropdownMenuSeparator />}

        {zones.map((zone) => {
          const active = zone.id.toLowerCase() === (value ?? "").toLowerCase();
          return (
            <DropdownMenuItem
              key={zone.id}
              className="min-h-11 lg:min-h-9"
              onSelect={() => onChange(zone.id)}
            >
              <Check className={cn("opacity-0", active && "opacity-100")} />
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: colors[zone.id.toLowerCase()] }}
              />
              <span className="truncate">{zone.name}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
