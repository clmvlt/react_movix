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
import { profilFullName, type Profil } from "@/features/auth";

interface ProfilSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  profiles: Profil[];
  neutralLabel: string;
  allowNeutral: boolean;
  ariaLabel: string;
  id?: string;
  disabled?: boolean;
}

export function ProfilSelect({
  value,
  onChange,
  profiles,
  neutralLabel,
  allowNeutral,
  ariaLabel,
  id,
  disabled = false,
}: ProfilSelectProps) {
  const selected = value
    ? profiles.find((profil) => profil.id === value)
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
          className="min-h-11 w-full justify-between gap-2 font-normal lg:min-h-10"
        >
          <span className="truncate">
            {selected ? profilFullName(selected) : neutralLabel}
          </span>
          <ChevronDown className="shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-80 w-64 overflow-y-auto"
      >
        {allowNeutral && (
          <>
            <DropdownMenuItem
              className="min-h-11 lg:min-h-9"
              onSelect={() => onChange(null)}
            >
              <Check className={cn("opacity-0", value === null && "opacity-100")} />
              <span className="truncate">{neutralLabel}</span>
            </DropdownMenuItem>
            {profiles.length > 0 && <DropdownMenuSeparator />}
          </>
        )}

        {profiles.map((profil) => (
          <DropdownMenuItem
            key={profil.id}
            className="min-h-11 lg:min-h-9"
            onSelect={() => onChange(profil.id)}
          >
            <Check
              className={cn("opacity-0", profil.id === value && "opacity-100")}
            />
            <span className="truncate">{profilFullName(profil)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
