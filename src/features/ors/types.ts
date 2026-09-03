export const ORS_SEARCH_LIMIT_MIN = 1;
export const ORS_SEARCH_LIMIT_MAX = 50;
export const ORS_SEARCH_LIMIT_DEFAULT = 10;
export const ORS_SEARCH_MIN_CHARS = 3;

export interface Coordinate {
  lat: number;
  lon: number;
}

export type GeometryFormat = "POINTS" | "POLYLINE" | "NONE";

export type OrsPoint = [number, number];

export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
}

export interface RoutingStatus {
  ready: boolean;
  profile: string;
}

export interface GeocodingStatus {
  ready: boolean;
}

export interface RouteRequest {
  from?: Coordinate | null;
  to?: Coordinate | null;
  points?: Coordinate[] | null;
  geometryFormat?: GeometryFormat;
}

export interface RouteResponse {
  distanceMeters: number;
  durationSeconds: number;
  geometryFormat: string;
  geometry: OrsPoint[] | null;
  geometryPolyline: string | null;
}

export interface MatrixRequest {
  points: Coordinate[];
}

export interface MatrixResponse {
  size: number;
  durationsSeconds: number[][];
}

export interface VisitInput {
  id?: string | null;
  name?: string | null;
  lat: number;
  lon: number;
  demand?: number | null;
  serviceDurationSeconds?: number | null;
}

export interface OptimizeRequest {
  depot: Coordinate;
  vehicleCount?: number | null;
  vehicleCapacity?: number | null;
  departureTime?: string | null;
  geometryFormat?: GeometryFormat;
  includeGeometry?: boolean | null;
  visits: VisitInput[];
}

export interface Leg {
  distanceMeters: number;
  durationSeconds: number;
  geometry: OrsPoint[] | null;
  geometryPolyline: string | null;
}

export interface Stop {
  visitId: string;
  name: string;
  lat: number;
  lon: number;
  legFromPrevious: Leg;
  cumulativeDistanceMeters: number;
  cumulativeDrivingSeconds: number;
  arrivalTime: string;
  departureTime: string;
  demand: number;
}

export interface OptimizedRoute {
  vehicleId: string;
  departureTime: string;
  returnTime: string;
  drivingTimeSeconds: number;
  serviceTimeSeconds: number;
  distanceMeters: number;
  totalDemand: number;
  stops: Stop[];
  returnLeg: Leg;
  geometry: OrsPoint[] | null;
  geometryPolyline: string | null;
}

export type SkippedVisitReason = "UNROUTABLE" | "TOO_FAR";

export interface SkippedVisit {
  visitId: string;
  name: string | null;
  lat: number;
  lon: number;
  reason: SkippedVisitReason;
  snapDistanceMeters: number | null;
}

export interface OptimizeResponse {
  score: string;
  totalDrivingTimeSeconds: number;
  totalDistanceMeters: number;
  routes: OptimizedRoute[];
  skippedVisits: SkippedVisit[];
}

export type AddressType = "street" | "housenumber";

export interface AddressSearchParams {
  q: string;
  limit?: number;
  lat?: number;
  lon?: number;
}

export interface AddressResult {
  label: string;
  houseNumber: string;
  street: string;
  postcode: string;
  city: string;
  lat: number;
  lon: number;
  type: AddressType;
  distanceMeters: number | null;
  score: number;
}

export type ComponentState =
  | "WAITING"
  | "DOWNLOADING"
  | "INITIALIZING"
  | "READY"
  | "DISABLED"
  | "ERROR";

export interface OrsComponent {
  name: string;
  state: ComponentState;
  detail: string;
  ready: boolean;
}

export interface OrsDownload {
  name: string;
  downloadedBytes: number;
  totalBytes: number;
  percent: number;
  done: boolean;
}

export interface OrsDataFile {
  name: string;
  path: string;
  present: boolean;
  sizeBytes: number;
}

export interface OrsJvm {
  javaVersion: string;
  pid: number;
  cpuCores: number;
  memUsedBytes: number;
  memMaxBytes: number;
  memUsedPercent: number;
}

export interface OrsStatus {
  application: string;
  status: "UP" | "STARTING" | "DEGRADED";
  uptimeSeconds: number;
  startedAtMillis: number;
  routingProfile: string;
  addressCount: number;
  jvm: OrsJvm;
  components: OrsComponent[];
  downloads: OrsDownload[];
  data: OrsDataFile[];
  links: {
    swaggerUi: string;
    openApi: string;
  };
}
