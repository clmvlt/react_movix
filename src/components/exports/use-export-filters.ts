import { useCallback, useMemo, useState } from "react";
import { addDays, isValidApiDate, todayApiDate } from "@/lib/date";

export interface ExportFilters {
  startDate: string;
  endDate: string;
  closedOnly: boolean;
  pharmacyCip: string;
  profilId: string;
}

export type DatePresetId = "thisMonth" | "lastMonth" | "last7Days";

export const DATE_PRESETS: DatePresetId[] = [
  "thisMonth",
  "lastMonth",
  "last7Days",
];

export function diffInDays(startDate: string, endDate: string): number | null {
  if (!isValidApiDate(startDate) || !isValidApiDate(endDate)) return null;
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  return Math.round((end - start) / 86_400_000);
}

function firstDayOfMonth(apiDate: string): string {
  return `${apiDate.slice(0, 7)}-01`;
}

export function presetRange(preset: DatePresetId): {
  startDate: string;
  endDate: string;
} {
  const today = todayApiDate();
  switch (preset) {
    case "thisMonth":
      return { startDate: firstDayOfMonth(today), endDate: today };
    case "lastMonth": {
      const lastDayOfPrevMonth = addDays(firstDayOfMonth(today), -1);
      return {
        startDate: firstDayOfMonth(lastDayOfPrevMonth),
        endDate: lastDayOfPrevMonth,
      };
    }
    default:
      return { startDate: addDays(today, -6), endDate: today };
  }
}

export type RangeErrorKind = "missing" | "invalid" | "reversed";

export interface ExportFiltersApi {
  filters: ExportFilters;
  setFilter: <K extends keyof ExportFilters>(
    key: K,
    value: ExportFilters[K]
  ) => void;
  rangeDays: number;
  rangeDaysInclusive: number;
  rangeError: RangeErrorKind | null;
  rangeWarning: "warning" | "danger" | null;
  activePreset: DatePresetId | null;
  applyPreset: (preset: DatePresetId) => void;
  reset: () => void;
}

function initialFilters(): ExportFilters {
  const range = presetRange("thisMonth");
  return {
    startDate: range.startDate,
    endDate: range.endDate,
    closedOnly: false,
    pharmacyCip: "",
    profilId: "",
  };
}

export function useExportFilters(): ExportFiltersApi {
  const [filters, setFilters] = useState<ExportFilters>(initialFilters);

  const setFilter = useCallback(
    <K extends keyof ExportFilters>(key: K, value: ExportFilters[K]) => {
      setFilters((previous) => ({ ...previous, [key]: value }));
    },
    []
  );

  const rangeError = useMemo<RangeErrorKind | null>(() => {
    if (!filters.startDate || !filters.endDate) return "missing";
    if (!isValidApiDate(filters.startDate) || !isValidApiDate(filters.endDate)) {
      return "invalid";
    }
    const days = diffInDays(filters.startDate, filters.endDate);
    if (days === null) return "invalid";
    if (days < 0) return "reversed";
    return null;
  }, [filters.startDate, filters.endDate]);

  const rangeDays = useMemo(() => {
    if (rangeError) return 0;
    return diffInDays(filters.startDate, filters.endDate) ?? 0;
  }, [rangeError, filters.startDate, filters.endDate]);

  const rangeWarning = useMemo<"warning" | "danger" | null>(() => {
    if (rangeError) return null;
    if (rangeDays > 90) return "danger";
    if (rangeDays > 30) return "warning";
    return null;
  }, [rangeError, rangeDays]);

  const activePreset = useMemo<DatePresetId | null>(() => {
    const match = DATE_PRESETS.find((preset) => {
      const range = presetRange(preset);
      return (
        range.startDate === filters.startDate && range.endDate === filters.endDate
      );
    });
    return match ?? null;
  }, [filters.startDate, filters.endDate]);

  const applyPreset = useCallback((preset: DatePresetId) => {
    const range = presetRange(preset);
    setFilters((previous) => ({
      ...previous,
      startDate: range.startDate,
      endDate: range.endDate,
    }));
  }, []);

  const reset = useCallback(() => setFilters(initialFilters()), []);

  return {
    filters,
    setFilter,
    rangeDays,
    rangeDaysInclusive: rangeError ? 0 : rangeDays + 1,
    rangeError,
    rangeWarning,
    activePreset,
    applyPreset,
    reset,
  };
}
