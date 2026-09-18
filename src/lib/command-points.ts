import { formatDate } from "@/lib/date";
import type { CommandBasic } from "@/features/commands";

export interface CommandMapPoint {
  id: string;
  longitude: number;
  latitude: number;
  label: number;
  title: string;
}

export function commandMapPoints(
  commands: CommandBasic[],
  lang: string
): CommandMapPoint[] {
  return commands
    .map((command, index) => ({
      id: command.id,
      longitude: command.longitude,
      latitude: command.latitude,
      label: index + 1,
      title: formatDate(command.expDate, lang),
    }))
    .filter(
      (point): point is CommandMapPoint =>
        point.longitude != null &&
        point.latitude != null &&
        point.longitude !== 0 &&
        point.latitude !== 0
    );
}
