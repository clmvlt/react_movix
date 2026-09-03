import type { ProfilRef } from "@/features/auth/types";

export interface StatusRef {
  id: number;
  name: string;
  createdAt?: string;
  profil?: ProfilRef | null;
}

export interface ZoneRef {
  id: string;
  name: string;
}

export interface TourCommandPharmacy {
  cip: string;
  name: string;
  address1?: string;
  city?: string;
  postalCode?: string;
  latitude?: number | null;
  longitude?: number | null;
  color?: string | null;
  numero?: string | null;
  deliveryWindowStart?: string | null;
  deliveryWindowEnd?: string | null;
}

export interface RouteLeg {
  distanceKm: number | null;
  durationMins: number | null;
}

export interface TourCommand {
  id: string;
  tourOrder?: number | null;
  expDate?: string;
  closeDate?: string | null;
  comment?: string | null;
  newPharmacy?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  pharmacy?: TourCommandPharmacy | null;
  pharmacyDeliveryWindowStart?: string | null;
  pharmacyDeliveryWindowEnd?: string | null;
  status?: StatusRef | null;
  packages?: unknown[];
  packagesNumber?: number;
  previousLeg: RouteLeg;
  nextLeg: RouteLeg;
}

export interface CommandTourHistory {
  id: string;
  commandId: string;
  action: string;
  createdAt?: string;
  profil?: ProfilRef | null;
  commandPharmacy?: TourCommandPharmacy | null;
}

export interface Tour {
  id: string;
  name: string;
  immat?: string;
  startKm?: number;
  endKm?: number;
  initialDate?: string;
  startDate?: string;
  endDate?: string;
  color?: string;
  estimateMins?: number;
  estimateKm?: number;
  geometry?: string;
  returnDistanceKm?: number | null;
  returnDurationMins?: number | null;
  routeStale?: boolean;
  routeUpdatedAt?: string | null;
  loadingTimeMinutes?: number | null;
  sorted?: boolean;
  profil?: ProfilRef | null;
  status?: StatusRef | null;
  zone?: ZoneRef | null;
  commands?: TourCommand[];
  commandTourHistories?: CommandTourHistory[];
}

export interface TourCreateInput {
  name: string;
  initialDate: string;
  color?: string;
  zoneId?: string;
}

export interface TourUpdateInput {
  name?: string;
  immat?: string;
  startKm?: number;
  endKm?: number;
  initialDate?: string;
  startDate?: string;
  endDate?: string;
  color?: string;
  estimateMins?: number;
  estimateKm?: number;
  geometry?: string;
  zoneId?: string;
}

export interface TourStop {
  commandId: string;
  tourOrder: number;
  pharmacyCip?: string | null;
  pharmacyName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  previousLeg: RouteLeg;
  nextLeg: RouteLeg;
  cumulativeDistanceKm?: number | null;
  cumulativeDurationMins?: number | null;
  estimatedArrivalTime?: string | null;
  estimatedServiceStartTime?: string | null;
  deliveryWindowStart?: string | null;
  deliveryWindowEnd?: string | null;
  waitingMins?: number | null;
  lateMins?: number | null;
  late?: boolean | null;
}

export interface TourReturnLeg {
  distanceKm?: number | null;
  durationMins?: number | null;
  arrivalTime?: string | null;
}

export interface TourRoute {
  tourId: string;
  geometry?: string | null;
  estimateKm?: number | null;
  estimateMins?: number | null;
  routeStale: boolean;
  routeUpdatedAt?: string | null;
  departureTime?: string | null;
  feasible?: boolean | null;
  timeWindowViolations?: number | null;
  waitingTimeMins?: number | null;
  stops: TourStop[];
  returnLeg?: TourReturnLeg | null;
}

export type SkippedVisitReason = "UNROUTABLE" | "TOO_FAR";

export interface SkippedVisit {
  visitId: string;
  name?: string | null;
  lat?: number | null;
  lon?: number | null;
  reason: SkippedVisitReason;
  snapDistanceMeters?: number | null;
}

export interface TourOptimizeInput {
  apply?: boolean;
  departureTime?: string;
}

export interface TourOptimizeResult {
  applied: boolean;
  departureTime?: string | null;
  feasible?: boolean | null;
  timeWindowViolations?: number | null;
  waitingTimeMins?: number | null;
  order: string[];
  previewGeometry?: string | null;
  skippedVisits?: SkippedVisit[] | null;
  commandsWithoutCoordinates?: string[] | null;
  route?: TourRoute | null;
  previewRoute?: TourRoute | null;
}

export type TourRouteFailureReason =
  | "ORS_UNREACHABLE"
  | "ORS_CIRCUIT_OPEN"
  | "ENGINE_REJECTED"
  | "NO_ROUTE_RETURNED"
  | "NO_ROUTABLE_STOP"
  | "UNEXPECTED_ERROR";

export interface TourRouteFailure {
  tourId?: string;
  reason: TourRouteFailureReason;
  detail?: string | null;
  correlationId?: string | null;
  retryable?: boolean | null;
}

export interface TourCommandOrder {
  commandId: string;
  tourOrder: number;
}

export interface TourUpdateOrderInput {
  commands: TourCommandOrder[];
}

export interface TourStatusInput {
  statusId: number;
  tourIds: string[];
}

export interface TourAssignInput {
  profilId?: string;
}
