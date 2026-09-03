import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  EMPTY_RECURRENCE,
  WEEKDAYS,
  WORKDAYS,
  type TourRecurrence,
} from "@/features/tour-configs";

interface WeekdayPickerProps {
  value: TourRecurrence;
  onChange: (next: TourRecurrence) => void;
  id?: string;
  disabled?: boolean;
}

export function WeekdayPicker({
  value,
  onChange,
  id,
  disabled = false,
}: WeekdayPickerProps) {
  const { t } = useTranslation();

  const toggle = (day: (typeof WEEKDAYS)[number]) => {
    onChange({ ...value, [day]: !value[day] });
  };

  const setAll = (enabled: boolean) => {
    const next = { ...EMPTY_RECURRENCE };
    for (const day of WEEKDAYS) next[day] = enabled;
    onChange(next);
  };

  const setWorkdays = () => {
    const next = { ...EMPTY_RECURRENCE };
    for (const day of WORKDAYS) next[day] = true;
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2" id={id}>
      <div className="flex flex-wrap gap-2">
        {WEEKDAYS.map((day) => {
          const active = value[day];
          return (
            <button
              key={day}
              type="button"
              aria-pressed={active}
              aria-label={t(`tourConfigs.weekdays.${day}`)}
              disabled={disabled}
              onClick={() => toggle(day)}
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors lg:size-10",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:cursor-default disabled:opacity-60",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {t(`tourConfigs.weekdaysShort.${day}`)}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-10"
          disabled={disabled}
          onClick={setWorkdays}
        >
          {t("tourConfigs.form.weekdays")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-10"
          disabled={disabled}
          onClick={() => setAll(true)}
        >
          {t("tourConfigs.form.everyDay")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-10"
          disabled={disabled}
          onClick={() => setAll(false)}
        >
          {t("tourConfigs.form.clear")}
        </Button>
      </div>
    </div>
  );
}
