import type { QueryClient } from "@tanstack/react-query";
import { isValidApiDate } from "@/lib/date";
import { commandKeys } from "./commands.keys";

export const COMMANDS_CHANGED_EVENT = "commands-changed";

export function parseCommandsChangedDates(data: string): string[] | null {
  try {
    const parsed = JSON.parse(data) as { dates?: unknown } | null;
    if (!Array.isArray(parsed?.dates)) return null;
    return parsed.dates.filter(
      (date): date is string => typeof date === "string" && isValidApiDate(date)
    );
  } catch {
    return null;
  }
}

export function invalidateCommandDates(
  queryClient: QueryClient,
  dates: string[] | null
) {
  if (!dates) {
    void queryClient.invalidateQueries({
      queryKey: commandKeys.unassignedCounts(),
    });
    void queryClient.invalidateQueries({ queryKey: commandKeys.byDates() });
    return;
  }
  for (const date of dates) {
    void queryClient.invalidateQueries({
      queryKey: commandKeys.unassignedCount(date),
    });
    void queryClient.invalidateQueries({ queryKey: commandKeys.byDate(date) });
  }
}
