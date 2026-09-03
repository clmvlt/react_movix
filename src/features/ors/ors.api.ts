import { config } from "@/lib/config";
import { http, type RequestOptions } from "@/lib/http";
import {
  ORS_SEARCH_LIMIT_DEFAULT,
  ORS_SEARCH_LIMIT_MAX,
  ORS_SEARCH_LIMIT_MIN,
  type AddressResult,
  type AddressSearchParams,
  type GeocodingStatus,
  type MatrixRequest,
  type MatrixResponse,
  type OptimizeRequest,
  type OptimizeResponse,
  type OrsStatus,
  type RouteRequest,
  type RouteResponse,
  type RoutingStatus,
} from "./types";

const ROUTING = "/routing";
const OPTIMIZATION = "/optimization";
const GEOCODING = "/geocoding";

const STATUS_TIMEOUT = 10_000;
const SEARCH_TIMEOUT = 15_000;
const ROUTE_TIMEOUT = 30_000;
const OPTIMIZE_TIMEOUT = 120_000;

function orsOptions(extra: RequestOptions = {}): RequestOptions {
  return {
    baseUrl: config.orsBaseUrl,
    auth: false,
    credentials: "omit",
    ...extra,
  };
}

function clampLimit(limit: number | undefined): number {
  if (limit == null || !Number.isFinite(limit)) return ORS_SEARCH_LIMIT_DEFAULT;
  return Math.min(
    ORS_SEARCH_LIMIT_MAX,
    Math.max(ORS_SEARCH_LIMIT_MIN, Math.trunc(limit))
  );
}

function hasPosition(params: AddressSearchParams): boolean {
  return (
    typeof params.lat === "number" &&
    Number.isFinite(params.lat) &&
    params.lat >= -90 &&
    params.lat <= 90 &&
    typeof params.lon === "number" &&
    Number.isFinite(params.lon) &&
    params.lon >= -180 &&
    params.lon <= 180
  );
}

export const orsApi = {
  status: (signal?: AbortSignal) =>
    http.get<OrsStatus>("/status", orsOptions({ signal, timeoutMs: STATUS_TIMEOUT })),

  routingStatus: (signal?: AbortSignal) =>
    http.get<RoutingStatus>(
      `${ROUTING}/status`,
      orsOptions({ signal, timeoutMs: STATUS_TIMEOUT })
    ),

  route: (input: RouteRequest, signal?: AbortSignal) => {
    const body: RouteRequest =
      input.points && input.points.length >= 2
        ? {
            points: input.points,
            geometryFormat: input.geometryFormat ?? "POINTS",
          }
        : {
            from: input.from,
            to: input.to,
            geometryFormat: input.geometryFormat ?? "POINTS",
          };
    return http.post<RouteResponse>(
      `${ROUTING}/route`,
      body,
      orsOptions({ signal, timeoutMs: ROUTE_TIMEOUT })
    );
  },

  matrix: (input: MatrixRequest, signal?: AbortSignal) =>
    http.post<MatrixResponse>(
      `${ROUTING}/matrix`,
      { points: input.points },
      orsOptions({ signal, timeoutMs: ROUTE_TIMEOUT })
    ),

  optimize: (input: OptimizeRequest, signal?: AbortSignal) => {
    const body: OptimizeRequest = {
      depot: input.depot,
      visits: input.visits,
      geometryFormat: input.geometryFormat ?? "POINTS",
    };
    if (input.vehicleCount != null) {
      body.vehicleCount = Math.max(1, Math.trunc(input.vehicleCount));
    }
    if (input.vehicleCapacity != null) {
      body.vehicleCapacity = Math.trunc(input.vehicleCapacity);
    }
    if (input.departureTime) body.departureTime = input.departureTime;
    return http.post<OptimizeResponse>(
      `${OPTIMIZATION}/optimize`,
      body,
      orsOptions({ signal, timeoutMs: OPTIMIZE_TIMEOUT })
    );
  },

  geocodingStatus: (signal?: AbortSignal) =>
    http.get<GeocodingStatus>(
      `${GEOCODING}/status`,
      orsOptions({ signal, timeoutMs: STATUS_TIMEOUT })
    ),

  search: (params: AddressSearchParams, signal?: AbortSignal) => {
    const positioned = hasPosition(params);
    return http.get<AddressResult[]>(
      `${GEOCODING}/search`,
      orsOptions({
        signal,
        timeoutMs: SEARCH_TIMEOUT,
        query: {
          q: params.q.trim(),
          limit: clampLimit(params.limit),
          lat: positioned ? params.lat : undefined,
          lon: positioned ? params.lon : undefined,
        },
      })
    );
  },
};
