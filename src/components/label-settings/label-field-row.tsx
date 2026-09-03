import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  fontSizeFallback,
  type LabelFieldCatalogEntry,
  type LabelFieldConfig,
} from "@/features/label-settings";
import { LabelFontSizeControl } from "./label-font-size-control";

interface LabelFieldRowProps {
  entry: LabelFieldCatalogEntry;
  field: LabelFieldConfig;
  effectiveVisible: boolean;
  lockedReason: string | null;
  hint: string | null;
  error: string | null;
  disabled: boolean;
  onChange: (patch: Partial<LabelFieldConfig>) => void;
}

export function LabelFieldRow({
  entry,
  field,
  effectiveVisible,
  lockedReason,
  hint,
  error,
  disabled,
  onChange,
}: LabelFieldRowProps) {
  const { t } = useTranslation();

  const locked = lockedReason !== null;
  const visibleId = `label-field-${entry.key}-visible`;
  const autoId = `label-field-${entry.key}-auto`;
  const boldId = `label-field-${entry.key}-bold`;
  const sizeId = `label-field-${entry.key}-size`;

  const auto = entry.autoFit && field.fontSize === null;
  const showControls =
    effectiveVisible && (entry.supportsFontSize || entry.supportsBold);

  const rangeHint =
    showControls &&
    entry.supportsFontSize &&
    !auto &&
    entry.minFontSize !== null &&
    entry.maxFontSize !== null
      ? t(
          entry.autoFit
            ? "labelSettings.fields.capRange"
            : "labelSettings.fields.sizeRange",
          { min: entry.minFontSize, max: entry.maxFontSize }
        )
      : null;

  const detail = error ?? lockedReason ?? hint ?? rangeHint ?? "";

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card px-3 py-2">
      <div className="flex min-h-11 items-center gap-3">
        <Checkbox
          id={visibleId}
          className="size-5 shrink-0"
          checked={effectiveVisible}
          disabled={disabled || locked}
          onCheckedChange={(value) => onChange({ visible: value === true })}
        />
        <Label
          htmlFor={visibleId}
          className={cn(
            "flex-1 cursor-pointer text-sm",
            !effectiveVisible && "text-muted-foreground"
          )}
        >
          {entry.label}
        </Label>
      </div>

      {showControls && (
        <div className="flex flex-col gap-2 pl-8">
          {entry.supportsFontSize && entry.autoFit && (
            <div className="flex min-h-11 items-center gap-3 lg:min-h-9">
              <Checkbox
                id={autoId}
                className="size-5 shrink-0"
                checked={auto}
                disabled={disabled}
                onCheckedChange={(value) =>
                  onChange({
                    fontSize: value === true ? null : fontSizeFallback(entry),
                  })
                }
              />
              <Label htmlFor={autoId} className="cursor-pointer text-sm font-normal">
                {t("labelSettings.fields.autoSize")}
              </Label>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {entry.supportsFontSize && !auto && (
              <LabelFontSizeControl
                id={sizeId}
                value={field.fontSize ?? fontSizeFallback(entry)}
                min={entry.minFontSize}
                max={entry.maxFontSize}
                label={entry.label}
                disabled={disabled}
                onChange={(value) => onChange({ fontSize: value })}
              />
            )}
            {entry.supportsBold && (
              <div className="flex min-h-11 items-center gap-3 lg:min-h-9">
                <Checkbox
                  id={boldId}
                  className="size-5 shrink-0"
                  checked={field.bold}
                  disabled={disabled}
                  onCheckedChange={(value) => onChange({ bold: value === true })}
                />
                <Label
                  htmlFor={boldId}
                  className="cursor-pointer text-sm font-normal"
                >
                  {t("labelSettings.fields.bold")}
                </Label>
              </div>
            )}
          </div>
        </div>
      )}

      <p
        className={cn(
          "min-h-4 pl-8 text-xs leading-4",
          error ? "text-destructive" : "text-muted-foreground"
        )}
      >
        {detail}
      </p>
    </div>
  );
}
