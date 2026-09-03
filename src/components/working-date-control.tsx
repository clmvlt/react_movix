import { useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/date-field";
import { cn } from "@/lib/utils";
import { useWorkingDate } from "@/app/working-date-context";
import { isValidApiDate } from "@/lib/date";

export function WorkingDateControl({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { date, isToday, setDate, goToPreviousDay, goToNextDay, resetToToday } =
    useWorkingDate();

  const [draft, setDraft] = useState(date);
  const [lastDate, setLastDate] = useState(date);

  if (date !== lastDate) {
    setLastDate(date);
    setDraft(date);
  }

  const handleChange = (value: string) => {
    setDraft(value);
    if (isValidApiDate(value)) setDate(value);
  };

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      role="group"
      aria-label={t("workingDate.label")}
    >
      <Button
        variant="ghost"
        size="icon"
        className="hidden shrink-0 md:inline-flex"
        onClick={goToPreviousDay}
        title={t("workingDate.previous")}
        aria-label={t("workingDate.previous")}
      >
        <ChevronLeft className="size-4" />
      </Button>

      <DateField
        value={draft}
        onChange={handleChange}
        aria-label={t("workingDate.label")}
        className="w-[9rem] pl-2 font-medium sm:pl-3"
        surfaceClassName={
          isToday
            ? undefined
            : "border-status-pending-strong/40 bg-status-pending-bg"
        }
      />

      <Button
        variant="ghost"
        size="icon"
        className="hidden shrink-0 md:inline-flex"
        onClick={goToNextDay}
        title={t("workingDate.next")}
        aria-label={t("workingDate.next")}
      >
        <ChevronRight className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="hidden shrink-0 md:inline-flex"
        onClick={resetToToday}
        disabled={isToday}
        title={t("workingDate.today")}
        aria-label={t("workingDate.today")}
      >
        <RotateCcw className="size-4" />
      </Button>
    </div>
  );
}
