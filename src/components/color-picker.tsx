import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { HexColorPicker, HexColorInput } from "react-colorful";
import { Check, Pipette, Settings } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  categoryPalette,
  contrastTextOn,
  isHexColor,
  safeCategoryColor,
} from "@/lib/colors";
import { useAccountColors } from "@/features/account-colors";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  id?: string;
  label?: string;
  swatches?: boolean;
  accountPalette?: boolean;
  manage?: boolean;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
}

interface SwatchEntry {
  color: string;
  name: string | null;
}

export function ColorPicker({
  value,
  onChange,
  id,
  label,
  swatches = true,
  accountPalette = true,
  manage = true,
  disabled = false,
  className,
  triggerClassName,
}: ColorPickerProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const paletteQuery = useAccountColors(accountPalette);
  const color = safeCategoryColor(value);
  const groupLabel = label ?? t("common.color");

  const accountEntries: SwatchEntry[] = accountPalette
    ? (paletteQuery.data ?? [])
        .filter((entry) => isHexColor(entry.color))
        .map((entry) => ({ color: entry.color.trim(), name: entry.name }))
    : [];
  const quickSwatches: SwatchEntry[] =
    accountEntries.length > 0
      ? accountEntries
      : categoryPalette.map((swatch) => ({ color: swatch, name: null }));

  const manageButton = accountPalette && manage ? (
    <button
      type="button"
      disabled={disabled}
      title={t("accountColors.manage")}
      aria-label={t("accountColors.manage")}
      onClick={() => navigate("/app/settings?tab=colors")}
      className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border lg:size-8 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-default disabled:opacity-60"
    >
      <Settings className="size-4" />
    </button>
  ) : null;

  return (
    <div
      role="group"
      aria-label={groupLabel}
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      {swatches &&
        quickSwatches.map((swatch) => (
          <Swatch
            key={swatch.color}
            color={swatch.color}
            name={swatch.name}
            active={swatch.color.toLowerCase() === color.toLowerCase()}
            disabled={disabled}
            onSelect={() => onChange(swatch.color)}
          />
        ))}

      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger asChild>
          <button
            type="button"
            id={id}
            disabled={disabled}
            title={t("common.customColor")}
            aria-label={t("common.customColor")}
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-border transition-transform hover:scale-105 lg:size-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-default disabled:opacity-60 disabled:hover:scale-100",
              triggerClassName
            )}
            style={{ backgroundColor: color }}
          >
            <Pipette className="size-4" style={{ color: contrastTextOn(color) }} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="pointer-events-auto w-64 space-y-3"
        >
          <HexColorPicker
            color={color}
            onChange={onChange}
            style={{ width: "100%", height: 160 }}
          />
          <div className="flex items-center gap-2">
            <span
              className="size-8 shrink-0 rounded-full border border-border"
              style={{ backgroundColor: color }}
              aria-hidden
            />
            <HexColorInput
              color={color}
              onChange={onChange}
              prefixed
              aria-label={t("common.customColor")}
              className="h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 py-1 text-sm uppercase lg:h-9 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          {!swatches && (
            <div className="flex flex-wrap gap-2">
              {quickSwatches.map((swatch) => (
                <Swatch
                  key={swatch.color}
                  color={swatch.color}
                  name={swatch.name}
                  active={swatch.color.toLowerCase() === color.toLowerCase()}
                  onSelect={() => onChange(swatch.color)}
                />
              ))}
              {manageButton}
            </div>
          )}
        </PopoverContent>
      </Popover>
      {swatches && manageButton}
    </div>
  );
}

function Swatch({
  color,
  name,
  active,
  disabled = false,
  onSelect,
}: {
  color: string;
  name?: string | null;
  active: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      title={name ?? undefined}
      aria-label={name ?? color}
      aria-pressed={active}
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition-transform focus-visible:outline-none lg:size-8 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-default disabled:opacity-60 disabled:hover:scale-100",
        active ? "scale-110 border-foreground" : "border-transparent hover:scale-105"
      )}
      style={{ backgroundColor: color }}
    >
      {active && (
        <Check className="size-4" style={{ color: contrastTextOn(color) }} />
      )}
    </button>
  );
}
