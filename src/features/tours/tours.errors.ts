import { ApiError } from "@/lib/api-error";
import type { TourDispatchStale, TourRouteFailure } from "./types";

function objectBody(error: unknown): Record<string, unknown> | null {
  if (!(error instanceof ApiError)) return null;
  let body = error.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body) as unknown;
    } catch {
      return null;
    }
  }
  return body && typeof body === "object"
    ? (body as Record<string, unknown>)
    : null;
}

export function tourRouteFailureOf(error: unknown): TourRouteFailure | null {
  const body = objectBody(error);
  if (!body || typeof body.reason !== "string") return null;
  return body as unknown as TourRouteFailure;
}

export function dispatchStaleOf(error: unknown): TourDispatchStale | null {
  if (!(error instanceof ApiError) || error.status !== 409) return null;
  const body = objectBody(error);
  return body?.error === "DISPATCH_STALE"
    ? (body as unknown as TourDispatchStale)
    : null;
}
