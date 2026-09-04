import { COMMAND_STATUSES, type CommandExpedition } from "@/features/commands";
import { UNASSIGNED } from "@/features/zones";

const STATUS_PARAM = "status";
const ZONE_PARAM = "zone";

export interface ExpeditionFilters {
  statusIds: number[];
  zoneIds: string[];
}

export const EMPTY_EXPEDITION_FILTERS: ExpeditionFilters = {
  statusIds: [],
  zoneIds: [],
};

const KNOWN_STATUS_IDS = new Set(COMMAND_STATUSES.map((status) => status.id));

export function normalizeZoneId(id: string): string {
  return id.trim().toLowerCase();
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

export function parseExpeditionFilters(
  params: URLSearchParams
): ExpeditionFilters {
  const statusIds = (params.get(STATUS_PARAM) ?? "")
    .split(",")
    .map((raw) => Number.parseInt(raw, 10))
    .filter((id) => KNOWN_STATUS_IDS.has(id));
  const zoneIds = (params.get(ZONE_PARAM) ?? "")
    .split(",")
    .map(normalizeZoneId)
    .filter(Boolean);
  return { statusIds: unique(statusIds), zoneIds: unique(zoneIds) };
}

export function writeExpeditionFilters(
  params: URLSearchParams,
  filters: ExpeditionFilters
): void {
  if (filters.statusIds.length > 0) {
    params.set(STATUS_PARAM, filters.statusIds.join(","));
  } else {
    params.delete(STATUS_PARAM);
  }
  if (filters.zoneIds.length > 0) {
    params.set(ZONE_PARAM, filters.zoneIds.join(","));
  } else {
    params.delete(ZONE_PARAM);
  }
}

export function hasExpeditionFilters(filters: ExpeditionFilters): boolean {
  return filters.statusIds.length > 0 || filters.zoneIds.length > 0;
}

export function commandZoneId(command: CommandExpedition): string {
  const id = command.pharmacy?.zone?.id;
  return id ? normalizeZoneId(id) : UNASSIGNED;
}

export function matchesExpeditionFilters(
  command: CommandExpedition,
  filters: ExpeditionFilters
): boolean {
  if (
    filters.statusIds.length > 0 &&
    (command.status == null || !filters.statusIds.includes(command.status.id))
  ) {
    return false;
  }
  if (
    filters.zoneIds.length > 0 &&
    !filters.zoneIds.includes(commandZoneId(command))
  ) {
    return false;
  }
  return true;
}

export function toggleFilterValue<T>(values: T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}
