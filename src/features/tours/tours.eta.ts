import { addMinutes, parseDate } from "@/lib/date";
import type { Tour, TourCommand } from "./types";

export const DELIVERING_TOUR_STATUS_ID = 3;

const VISITED_STATUS_IDS = new Set([3, 4, 5, 8, 9]);
const PENDING_DELIVERY_STATUS_IDS = new Set([2, 6]);

export function isTourDelivering(
  status: { id: number } | null | undefined
): boolean {
  return status?.id === DELIVERING_TOUR_STATUS_ID;
}

function orderOf(command: TourCommand): number {
  return command.tourOrder ?? Number.MAX_SAFE_INTEGER;
}

function visitedAt(command: TourCommand): Date | null {
  if (!VISITED_STATUS_IDS.has(command.status?.id ?? -1)) return null;
  return parseDate(command.status?.createdAt);
}

export function tourArrivalEstimates(
  tour: Tour | null | undefined
): Map<string, Date> {
  const estimates = new Map<string, Date>();
  if (!tour || !isTourDelivering(tour.status)) return estimates;

  const ordered = [...(tour.commands ?? [])].sort(
    (left, right) => orderOf(left) - orderOf(right)
  );

  let anchor = parseDate(tour.startDate);

  for (const command of ordered) {
    const visited = visitedAt(command);
    if (visited) {
      anchor = visited;
      continue;
    }

    const legMins = command.previousLeg?.durationMins;
    if (legMins == null || !anchor) continue;

    anchor = addMinutes(anchor, legMins);
    if (PENDING_DELIVERY_STATUS_IDS.has(command.status?.id ?? -1)) {
      estimates.set(command.id, anchor);
    }
  }

  return estimates;
}
