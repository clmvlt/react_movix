import { ApiError } from "@/lib/api-error";
import type { ProblemDetail } from "./types";

export function orsProblem(error: unknown): ProblemDetail | null {
  if (!(error instanceof ApiError)) return null;
  const body = error.body;
  if (body && typeof body === "object") {
    const problem = body as ProblemDetail & {
      error?: string;
      path?: string;
    };
    return {
      type: problem.type,
      title: problem.title ?? problem.error,
      status: problem.status ?? error.status,
      detail: problem.detail ?? problem.error ?? error.message,
      instance: problem.instance ?? problem.path,
    };
  }
  return {
    status: error.status,
    detail: typeof body === "string" && body.trim() ? body : error.message,
  };
}

export function isOrsUnavailable(error: unknown): boolean {
  return error instanceof ApiError && error.status === 503;
}

export function isOrsInvalidRequest(error: unknown): boolean {
  return error instanceof ApiError && error.status === 400;
}
