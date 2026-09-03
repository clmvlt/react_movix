import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const HOURS = Array.from(
  { length: 24 },
  (_, index) => `${String(index).padStart(2, "0")}:00`
);

interface HourPickerProps {
  value: string;
  onChange: (hour: string) => void;
  ariaLabel: string;
  id?: string;
  disabled?: boolean;
}

export function HourPicker({
  value,
  onChange,
  ariaLabel,
  id,
  disabled = false,
}: HourPickerProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={ariaLabel}
          className="min-h-11 w-full justify-between gap-2 font-normal lg:min-h-10"
        >
          <span className="truncate tabular-nums">{value}</span>
          <ChevronDown className="shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-80 w-40 overflow-y-auto"
      >
        {HOURS.map((hour) => (
          <DropdownMenuItem
            key={hour}
            className="min-h-11 lg:min-h-9"
            onSelect={() => onChange(hour)}
          >
            <Check className={cn("opacity-0", hour === value && "opacity-100")} />
            <span className="tabular-nums">{hour}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
