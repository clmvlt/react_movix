export const CLOSED_TOUR_STATUS_ID = 5;
export const DEBRIEF_TOUR_STATUS_ID = 4;

export function isTourClosed(
  status: { id: number } | null | undefined
): boolean {
  return status?.id === CLOSED_TOUR_STATUS_ID;
}

export function isTourDebrief(
  status: { id: number } | null | undefined
): boolean {
  return status?.id === DEBRIEF_TOUR_STATUS_ID;
}

export function isTourUnsorted(tour: {
  sorted?: boolean;
  commands?: unknown[];
}): boolean {
  return tour.sorted === false && (tour.commands?.length ?? 0) > 0;
}

export interface TourStatusOption {
  id: number;
  name: string;
}

export const TOUR_STATUSES: TourStatusOption[] = [
  { id: 1, name: "Création" },
  { id: 2, name: "Chargement" },
  { id: 3, name: "Livraison" },
  { id: 4, name: "Debrief" },
  { id: 5, name: "Clôturé" },
];
