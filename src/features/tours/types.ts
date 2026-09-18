import type { ProfilRef } from "@/features/auth/types";
import type { Client, ClientRef, ClientType } from "@/features/clients/types";

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
  client?: Client | null;
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
  commandClient?: Client | null;
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
  client?: ClientRef | null;
  commands?: TourCommand[];
  commandTourHistories?: CommandTourHistory[];
}

export interface TourCreateInput {
  name: string;
  initialDate: string;
  color?: string;
  zoneId?: string;
  clientId?: string;
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
  clientId?: string;
  clearClient?: boolean;
}

export interface TourStop {
  commandId: string;
  tourOrder: number;
  clientId?: string | null;
  clientType?: ClientType | null;
  clientName?: string | null;
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

export interface TourDispatchPreviewInput {
  date: string;
  commandIds: string[];
  vehicleCount: number;
  departureTime?: string;
  stopServiceSeconds?: number;
  maxSolvingSeconds?: number;
}

export interface TourDispatchWorkload {
  tours: number;
  commands: number;
  drivingMins: number;
  serviceMins: number;
  waitingMins: number;
  distanceKm: number;
  timeWindowViolations: number;
  spreadMins: number;
}

export interface TourDispatchProposal {
  key: string;
  matchedTourId: string | null;
  matchedTourName: string | null;
  matchedTourColor: string | null;
  kept: number;
  incoming: number;
  outgoing: number;
  unchanged: boolean;
  commandIds: string[];
  route: TourRoute;
}

export interface TourDispatchReleasedTour {
  tourId: string;
  name: string | null;
  outgoing: number;
}

export type TourDispatchSkipReason =
  | "UNROUTABLE"
  | "TOO_FAR"
  | "NO_COORDINATES"
  | "NOT_RETURNED_BY_ENGINE";

export interface TourDispatchSkipped {
  commandId: string;
  clientId: string | null;
  clientType: ClientType | null;
  clientName: string | null;
  pharmacyCip: string | null;
  pharmacyName: string | null;
  reason: TourDispatchSkipReason;
  snapDistanceMeters: number | null;
}

export type TourDispatchExclusionReason =
  | "TOUR_LOCKED"
  | "NOT_FOUND"
  | "SOUFFRANCE"
  | "OTHER_DAY";

export interface TourDispatchExcluded {
  commandId: string;
  reason: TourDispatchExclusionReason;
}

export interface TourDispatchExpected {
  commandId: string;
  tourId: string | null;
}

export interface TourDispatchPreview {
  date: string;
  departureTime: string | null;
  stopServiceSeconds: number;
  solvingTimeSeconds: number;
  feasible: boolean;
  timeWindowViolations: number;
  proposed: TourDispatchWorkload;
  current: TourDispatchWorkload | null;
  tours: TourDispatchProposal[];
  releasedTours: TourDispatchReleasedTour[];
  skipped: TourDispatchSkipped[];
  excludedCommands: TourDispatchExcluded[];
  expected: TourDispatchExpected[];
}

export interface TourDispatchApplyTour {
  tourId: string | null;
  name?: string;
  color?: string;
  commandIds: string[];
}

export interface TourDispatchApplyInput {
  date: string;
  tours: TourDispatchApplyTour[];
  expected: TourDispatchExpected[];
}

export interface TourDispatchApplyResult {
  createdTourIds: string[];
  updatedTourIds: string[];
  routes: TourRoute[];
  routeFailures: TourRouteFailure[];
}

export interface TourDispatchStale {
  error: "DISPATCH_STALE";
  message?: string | null;
  commands?: string[] | null;
}
