import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarDays } from "lucide-react";
import type { Matcher } from "react-day-picker";
import { enGB, fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { apiDateToDate, dateToApiDate, isValidApiDate } from "@/lib/date";

type DateFieldProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  name?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  surfaceClassName?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
};

export function DateField({
  value,
  onChange,
  id,
  name,
  min,
  max,
  disabled,
  required,
  className,
  surfaceClassName,
  ...rest
}: DateFieldProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const selected = isValidApiDate(value) ? apiDateToDate(value) : undefined;

  const outOfRange: Matcher[] = [];
  if (min && isValidApiDate(min)) outOfRange.push({ before: apiDateToDate(min) });
  if (max && isValidApiDate(max)) outOfRange.push({ after: apiDateToDate(max) });

  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type="date"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "[&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden",
          surfaceClassName,
          className
        )}
        {...rest}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            disabled={disabled}
            className={cn(
              "absolute inset-y-px right-px h-auto w-11 rounded-l-none bg-background px-0 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-100 lg:w-10",
              surfaceClassName
            )}
            aria-label={t("common.pickDate")}
          >
            <CalendarDays className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            locale={i18n.language.startsWith("fr") ? fr : enGB}
            weekStartsOn={1}
            disabled={outOfRange.length > 0 ? outOfRange : undefined}
            onSelect={(next) => {
              if (next) onChange(dateToApiDate(next));
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
