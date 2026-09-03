import { config } from "./config";
import { ApiError } from "./api-error";
import { emitUnauthorized, getAuthToken } from "./auth";
import { getSelectedAccountId } from "./account-selection";
import { currentLanguage } from "@/i18n";

export interface SseMessage {
  event: string;
  data: string;
}

export interface SseOptions {
  baseUrl?: string;
  auth?: boolean;
  credentials?: RequestCredentials;
  signal: AbortSignal;
  onOpen?: () => void;
  onMessage: (message: SseMessage) => void;
}

function parseFrame(raw: string): SseMessage | null {
  let event = "message";
  const data: string[] = [];

  for (const line of raw.split("\n")) {
    if (!line || line.startsWith(":")) continue;
    const separator = line.indexOf(":");
    const field = separator === -1 ? line : line.slice(0, separator);
    let value = separator === -1 ? "" : line.slice(separator + 1);
    if (value.startsWith(" ")) value = value.slice(1);
    if (field === "event") event = value;
    else if (field === "data") data.push(value);
  }

  if (data.length === 0) return null;
  return { event, data: data.join("\n") };
}

export async function openSseStream(
  path: string,
  options: SseOptions
): Promise<void> {
  const {
    baseUrl = config.apiBaseUrl,
    auth = true,
    credentials = "include",
    signal,
    onOpen,
    onMessage,
  } = options;

  const base = baseUrl.replace(/\/+$/, "");
  const url = `${base}/${path.replace(/^\/+/, "")}`;

  const headers: Record<string, string> = {
    Accept: "text/event-stream",
    "Accept-Language": currentLanguage(),
  };
  if (auth) {
    const token = getAuthToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const accountId = getSelectedAccountId();
    if (accountId) headers["X-Account-Id"] = accountId;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers,
      credentials,
      cache: "no-store",
      signal,
    });
  } catch {
    if (signal.aborted) throw new ApiError(0, "Stream aborted", null);
    throw new ApiError(0, "Network error", null);
  }

  if (!response.ok || !response.body) {
    const body = await response.text().catch(() => "");
    if (response.status === 401 && auth) emitUnauthorized();
    throw new ApiError(
      response.status,
      body.trim() || `HTTP ${response.status}`,
      body || null
    );
  }

  onOpen?.();

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n?/g, "\n");

      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        const frame = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const message = parseFrame(frame);
        if (message) onMessage(message);
        boundary = buffer.indexOf("\n\n");
      }
    }
  } catch {
    if (signal.aborted) throw new ApiError(0, "Stream aborted", null);
    throw new ApiError(0, "Stream error", null);
  } finally {
    void reader.cancel().catch(() => undefined);
  }
}
