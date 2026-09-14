import { categoryPalette, isHexColor } from "@/lib/colors";
import { formatDuration, isValidTimeInput } from "@/lib/date";
import { formatStopTime } from "@/lib/delivery-window";
import type { LngLat } from "@/lib/polyline";
import type { CommandExpedition } from "@/features/commands";
import type {
  TourDispatchWorkload,
  TourRoute,
  TourStop,
} from "@/features/tours";

export const DISPATCH_DEFAULT_VEHICLES = 3;
export const DISPATCH_MAX_VEHICLES = 30;
export const DISPATCH_DEFAULT_SERVICE_MINUTES = 3;
export const DISPATCH_MAX_SERVICE_MINUTES = 120;
export const DISPATCH_LARGE_SCOPE = 300;
export const DISPATCH_WAITING_ALERT_MINS = 60;

export type DispatchQuality = "fast" | "standard" | "precise";

export const DISPATCH_QUALITIES: DispatchQuality[] = [
  "fast",
  "standard",
  "precise",
];

export const DISPATCH_QUALITY_SECONDS: Record<DispatchQuality, number> = {
  fast: 10,
  standard: 20,
  precise: 45,
};

export interface DispatchScopeSummary {
  commandIds: string[];
  pharmacies: number;
  packages: number;
  assigned: number;
  assignedTours: number;
}

export type StopIssue = "late" | "waiting" | null;

export interface ProposalStop {
  key: string;
  name: string;
  city: string;
  commandIds: string[];
  packages: number;
  position: LngLat | null;
  arrival: string | null;
  windowStart: string | null;
  windowEnd: string | null;
  lateMins: number;
  waitingMins: number;
  issue: StopIssue;
}

export function summarizeScope(
  commands: CommandExpedition[]
): DispatchScopeSummary {
  const pharmacies = new Set<string>();
  const tours = new Set<string>();
  let packages = 0;
  let assigned = 0;
  for (const command of commands) {
    pharmacies.add(command.pharmacy?.cip?.trim() || command.id);
    packages += command.packagesNumber ?? 0;
    if (command.tour) {
      assigned += 1;
      tours.add(command.tour.id);
    }
  }
  return {
    commandIds: commands.map((command) => command.id),
    pharmacies: pharmacies.size,
    packages,
    assigned,
    assignedTours: tours.size,
  };
}

export function maxVehicleCount(pharmacies: number): number {
  return Math.min(DISPATCH_MAX_VEHICLES, Math.max(1, pharmacies));
}

function positionOf(stop: TourStop): LngLat | null {
  const lat = stop.latitude;
  const lon = stop.longitude;
  if (typeof lat !== "number" || typeof lon !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat === 0 && lon === 0) return null;
  return [lon, lat];
}

export function windowLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed.includes("T") && isValidTimeInput(trimmed.slice(0, 5))) {
    return trimmed.slice(0, 5);
  }
  return formatStopTime(trimmed);
}

function issueOf(lateMins: number, waitingMins: number): StopIssue {
  if (lateMins > 0) return "late";
  if (waitingMins > DISPATCH_WAITING_ALERT_MINS) return "waiting";
  return null;
}

export function proposalStops(
  route: TourRoute,
  commands: Map<string, CommandExpedition>
): ProposalStop[] {
  const ordered = [...(route.stops ?? [])].sort(
    (left, right) => left.tourOrder - right.tourOrder
  );
  const result: ProposalStop[] = [];
  for (const stop of ordered) {
    const command = commands.get(stop.commandId);
    const cip = stop.pharmacyCip?.trim() || command?.pharmacy?.cip?.trim();
    const key = cip ? `cip:${cip}` : `command:${stop.commandId}`;
    const rawLate = Math.round(stop.lateMins ?? 0);
    const lateMins = stop.late === true || rawLate > 0 ? Math.max(1, rawLate) : 0;
    const waitingMins = Math.max(0, Math.round(stop.waitingMins ?? 0));
    const previous = result.at(-1);
    if (previous && previous.key === key) {
      previous.commandIds.push(stop.commandId);
      previous.packages += command?.packagesNumber ?? 0;
      previous.lateMins = Math.max(previous.lateMins, lateMins);
      previous.issue = issueOf(previous.lateMins, previous.waitingMins);
      continue;
    }
    result.push({
      key,
      name: stop.pharmacyName?.trim() || command?.pharmacy?.name?.trim() || "",
      city: command?.pharmacy?.city?.trim() ?? "",
      commandIds: [stop.commandId],
      packages: command?.packagesNumber ?? 0,
      position: positionOf(stop),
      arrival: stop.estimatedArrivalTime ?? null,
      windowStart: windowLabel(stop.deliveryWindowStart),
      windowEnd: windowLabel(stop.deliveryWindowEnd),
      lateMins,
      waitingMins,
      issue: issueOf(lateMins, waitingMins),
    });
  }
  return result;
}

export function routeDurationMins(route: TourRoute): number {
  return (route.estimateMins ?? 0) + (route.waitingTimeMins ?? 0);
}

export function workloadDurationMins(workload: TourDispatchWorkload): number {
  return workload.drivingMins + workload.serviceMins + workload.waitingMins;
}

export function suggestTourNames(
  count: number,
  taken: string[],
  label: (index: number) => string
): string[] {
  const used = new Set(taken.map((name) => name.trim().toLowerCase()));
  const names: string[] = [];
  const limit = count + used.size + 1;
  for (let index = 1; names.length < count && index <= limit; index += 1) {
    const name = label(index);
    const key = name.trim().toLowerCase();
    if (used.has(key)) continue;
    used.add(key);
    names.push(name);
  }
  while (names.length < count) names.push(label(names.length + 1));
  return names;
}

export function suggestTourColors(
  count: number,
  taken: (string | null | undefined)[]
): string[] {
  const used = new Set(
    taken
      .filter((color): color is string => isHexColor(color))
      .map((color) => color.trim().toLowerCase())
  );
  const pool: string[] = [
    ...categoryPalette.filter((color) => !used.has(color.toLowerCase())),
    ...categoryPalette.filter((color) => used.has(color.toLowerCase())),
  ];
  return Array.from({ length: count }, (_, index) => pool[index % pool.length]);
}

export function formatMinutes(minutes: number): string {
  return formatDuration(Math.round(minutes));
}

export function roundKilometers(km: number): number {
  return km < 10 ? Math.round(km * 10) / 10 : Math.round(km);
}

export function formatKilometers(km: number, lang: string): string {
  const locale = lang.startsWith("fr") ? "fr-FR" : "en-GB";
  return `${roundKilometers(km).toLocaleString(locale, {
    maximumFractionDigits: 1,
  })} km`;
}
