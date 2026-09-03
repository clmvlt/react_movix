import { Clock, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { PharmacyFormState } from "@/components/pharmacies/pharmacy-form";

type WindowKey = "deliveryWindowStart" | "deliveryWindowEnd";

interface DeliveryWindowFieldsProps {
  idPrefix: string;
  form: Pick<
    PharmacyFormState,
    "deliveryWindowEnabled" | "deliveryWindowStart" | "deliveryWindowEnd"
  >;
  errors: Record<string, string>;
  onChange: <K extends WindowKey | "deliveryWindowEnabled">(
    key: K,
    value: PharmacyFormState[K]
  ) => void;
  className?: string;
}

export function DeliveryWindowFields({
  idPrefix,
  form,
  errors,
  onChange,
  className,
}: DeliveryWindowFieldsProps) {
  const { t } = useTranslation();
  const toggleId = `${idPrefix}-delivery-window`;
  const enabled = form.deliveryWindowEnabled;
  const start = form.deliveryWindowStart;
  const end = form.deliveryWindowEnd;
  const error = errors.deliveryWindowStart ?? errors.deliveryWindowEnd;

  const summary = !enabled
    ? t("deliveryWindow.none")
    : start && end
      ? t("deliveryWindow.summaryRange", { start, end })
      : start
        ? t("deliveryWindow.summaryFrom", { start })
        : end
          ? t("deliveryWindow.summaryUntil", { end })
          : t("deliveryWindow.summaryEmpty");

  const timeField = (key: WindowKey, label: string) => (
    <span className="inline-flex items-center gap-1">
      <Input
        id={`${idPrefix}-${key}`}
        type="time"
        step={60}
        value={form[key]}
        onChange={(event) => onChange(key, event.target.value)}
        aria-label={label}
        aria-invalid={errors[key] ? true : undefined}
        className={cn(
          "min-h-11 w-30 shrink-0 lg:min-h-10",
          errors[key] && "border-destructive"
        )}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("size-11 shrink-0 lg:size-10", !form[key] && "invisible")}
        onClick={() => onChange(key, "")}
        aria-label={`${t("deliveryWindow.clear")} ${label}`}
        title={t("deliveryWindow.clear")}
      >
        <X className="size-4" />
      </Button>
    </span>
  );

  return (
    <div
      className={cn(
        "rounded-lg border border-border",
        enabled && "border-primary/40",
        className
      )}
    >
      <label
        htmlFor={toggleId}
        className="flex min-h-14 cursor-pointer items-center gap-3 px-3 py-2"
      >
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            enabled
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          )}
        >
          <Clock aria-hidden className="size-4" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm font-medium">{t("deliveryWindow.label")}</span>
          <span className="truncate text-xs text-muted-foreground">
            {summary}
          </span>
        </span>
        <Switch
          id={toggleId}
          checked={enabled}
          onCheckedChange={(checked) => onChange("deliveryWindowEnabled", checked)}
          aria-label={t("deliveryWindow.label")}
        />
      </label>

      {enabled && (
        <div className="border-t border-border px-3 pb-3 pt-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-2">
              <span>{t("deliveryWindow.between")}</span>
              {timeField("deliveryWindowStart", t("deliveryWindow.notBefore"))}
            </span>
            <span className="inline-flex items-center gap-2">
              <span>{t("deliveryWindow.and")}</span>
              {timeField("deliveryWindowEnd", t("deliveryWindow.atLatest"))}
            </span>
          </div>
          <p
            className={cn(
              "mt-2 min-h-4 text-xs leading-4",
              error ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {error ?? t("deliveryWindow.hint")}
          </p>
        </div>
      )}
    </div>
  );
}
