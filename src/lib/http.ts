import { config } from "./config";
import { ApiError } from "./api-error";
import { emitUnauthorized, getAuthToken } from "./auth";
import {
  emitNoAccountAccess,
  getSelectedAccountId,
} from "./account-selection";
import { currentLanguage } from "@/i18n";

type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue | QueryValue[]>;

export interface Paged<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface RequestOptions {
  query?: QueryParams;
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean;
  baseUrl?: string;
  credentials?: RequestCredentials;
  cache?: RequestCache;
  signal?: AbortSignal;
  timeoutMs?: number;
  handleUnauthorized?: boolean;
}

const DEFAULT_TIMEOUT = 20_000;

function buildUrl(path: string, baseUrl: string, query?: QueryParams): string {
  const base = baseUrl.replace(/\/+$/, "");
  const normalizedPath = path.replace(/^\/+/, "");
  const url = new URL(`${base}/${normalizedPath}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === null || value === undefined) continue;
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item === null || item === undefined) continue;
          url.searchParams.append(key, String(item));
        }
      } else {
        url.searchParams.append(key, String(value));
      }
    }
  }

  return url.toString();
}

function resolveSignal(
  timeoutMs: number,
  external?: AbortSignal
): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs);
  if (!external) return timeout;
  return AbortSignal.any([timeout, external]);
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function messageFromBody(body: unknown, status: number): string {
  if (typeof body === "string" && body.trim()) return body;
  if (body && typeof body === "object") {
    const obj = body as {
      message?: string;
      error?: string;
      detail?: string;
      title?: string;
    };
    if (obj.message) return obj.message;
    if (obj.error) return obj.error;
    if (obj.detail) return obj.detail;
    if (obj.title) return obj.title;
  }
  return `HTTP ${status}`;
}

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    query,
    body,
    headers = {},
    auth = true,
    baseUrl = config.apiBaseUrl,
    credentials = "include",
    cache,
    signal,
    timeoutMs = DEFAULT_TIMEOUT,
    handleUnauthorized = true,
  } = options;

  const url = buildUrl(path, baseUrl, query);
  const isRawBody = body instanceof FormData || body instanceof Blob;

  const finalHeaders: Record<string, string> = {
    "Accept-Language": currentLanguage(),
    ...headers,
  };

  if (auth) {
    const token = getAuthToken();
    if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
    const accountId = getSelectedAccountId();
    if (accountId && !finalHeaders["X-Account-Id"]) {
      finalHeaders["X-Account-Id"] = accountId;
    }
  }

  let payload: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (isRawBody) {
      payload = body as BodyInit;
    } else {
      finalHeaders["Content-Type"] =
        finalHeaders["Content-Type"] ?? "application/json";
      payload = JSON.stringify(body);
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: payload,
      credentials,
      cache,
      signal: resolveSignal(timeoutMs, signal),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new ApiError(408, "Request timeout", null);
    }
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(0, "Request aborted", null);
    }
    throw new ApiError(0, "Network error", null);
  }

  if (!response.ok) {
    const errorBody = await parseBody(response);
    if (response.status === 401 && auth && handleUnauthorized) {
      emitUnauthorized();
    }
    const error = new ApiError(
      response.status,
      messageFromBody(errorBody, response.status),
      errorBody
    );
    if (response.status === 403 && auth && error.isNoAccountAccess) {
      emitNoAccountAccess();
    }
    throw error;
  }

  return (await parseBody(response)) as T;
}

async function blob(path: string, options: RequestOptions = {}): Promise<Blob> {
  const {
    query,
    body,
    headers = {},
    baseUrl = config.apiBaseUrl,
    credentials = "include",
    signal,
    timeoutMs = DEFAULT_TIMEOUT,
    auth = true,
    handleUnauthorized = true,
  } = options;

  const url = buildUrl(path, baseUrl, query);
  const method = body !== undefined && body !== null ? "POST" : "GET";
  const isFormData = body instanceof FormData;

  const finalHeaders: Record<string, string> = {
    "Accept-Language": currentLanguage(),
    ...headers,
  };

  if (auth) {
    const token = getAuthToken();
    if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
    const accountId = getSelectedAccountId();
    if (accountId && !finalHeaders["X-Account-Id"]) {
      finalHeaders["X-Account-Id"] = accountId;
    }
  }

  let payload: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (isFormData) {
      payload = body;
    } else {
      finalHeaders["Content-Type"] =
        finalHeaders["Content-Type"] ?? "application/json";
      payload = JSON.stringify(body);
    }
  }

  const response = await fetch(url, {
    method,
    headers: finalHeaders,
    body: payload,
    credentials,
    signal: resolveSignal(timeoutMs, signal),
  });

  if (!response.ok) {
    const errorBody = await parseBody(response);
    if (response.status === 401 && auth && handleUnauthorized) {
      emitUnauthorized();
    }
    const error = new ApiError(
      response.status,
      messageFromBody(errorBody, response.status),
      errorBody
    );
    if (response.status === 403 && auth && error.isNoAccountAccess) {
      emitNoAccountAccess();
    }
    throw error;
  }

  return response.blob();
}

export const http = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>("GET", path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, { ...options, body }),
  delete: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("DELETE", path, { ...options, body }),
  blob,
};
