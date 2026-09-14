import { http } from "@/lib/http";
import { ApiError } from "@/lib/api-error";
import type { TourRoute } from "@/features/tours/types";
import { commandIds, isCommandId } from "./commands.constants";
import type {
  CommandBasic,
  CommandCreateInput,
  CommandCreatePackageInput,
  CommandCreateResult,
  CommandDetail,
  CommandExpedition,
  CommandIdsInput,
  CommandSearchInput,
  CommandSearchResult,
  CommandStatusHistoryEntry,
  CommandStatusInput,
  CommandTarifInput,
  CommandUnassignedCount,
  CommandUpdateInput,
} from "./types";

const RESOURCE = "/commands";
const SOUFFRANCE_TIMEOUT = 120_000;

function pathId(id: string): string {
  if (!isCommandId(id)) {
    throw new ApiError(400, "Invalid uuid format", null);
  }
  return id.trim().toLowerCase();
}

const PACKAGE_FIELDS = [
  "id",
  "type",
  "designation",
  "quantity",
  "weight",
  "volume",
  "length",
  "width",
  "height",
  "fresh",
  "num",
] as const;

const CLOSE_DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?([+-]\d{2}:\d{2}|Z)$/;

function cleanPackage(input: CommandCreatePackageInput): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const field of PACKAGE_FIELDS) {
    const value = input[field];
    if (value === undefined || value === null) continue;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) result[field] = trimmed;
      continue;
    }
    if (typeof value === "number" && !Number.isFinite(value)) continue;
    result[field] = value;
  }
  return result;
}

function buildCreateBody(input: CommandCreateInput): Record<string, unknown> {
  const expeditionDate = input.expedition_date?.trim() ?? "";
  const cip = input.cip?.trim() ?? "";
  const numTransport = input.command?.num_transport?.trim() ?? "";

  if (!expeditionDate) {
    throw new ApiError(400, "expedition_date is required", null);
  }
  if (!cip) {
    throw new ApiError(400, "cip is required", null);
  }
  if (!numTransport) {
    throw new ApiError(400, "command.num_transport is required", null);
  }

  const command: Record<string, unknown> = {
    num_transport: numTransport,
    packages: (input.command.packages ?? []).map(cleanPackage),
  };

  const closeDate = input.command.close_date?.trim();
  if (closeDate) {
    if (!CLOSE_DATE_PATTERN.test(closeDate)) {
      throw new ApiError(400, "command.close_date has an invalid format", null);
    }
    command.close_date = closeDate;
  }

  return { expedition_date: expeditionDate, cip, command };
}

function requireIds(ids: string[]): string[] {
  const valid = commandIds(ids);
  if (valid.length === 0) {
    throw new ApiError(400, "commandIds can't be empty", null);
  }
  return valid;
}

export const commandsApi = {
  create: (input: CommandCreateInput) =>
    http.post<CommandCreateResult>(RESOURCE, buildCreateBody(input)),

  byDate: (date: string) =>
    http.get<CommandExpedition[]>(`${RESOURCE}/by-date/${date}`),

  unassignedCount: (date: string, signal?: AbortSignal) =>
    http.get<CommandUnassignedCount>(`${RESOURCE}/unassigned-count/${date}`, {
      signal,
    }),

  get: (id: string) => http.get<CommandDetail>(`${RESOURCE}/${pathId(id)}`),

  getSouffrance: (id: string) =>
    http.get<CommandDetail>(`${RESOURCE}/souffrance/${pathId(id)}`),

  getAny: async (id: string): Promise<CommandDetail> => {
    try {
      return await commandsApi.get(id);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return commandsApi.getSouffrance(id);
      }
      throw error;
    }
  },

  isSouffrance: async (id: string): Promise<boolean> => {
    try {
      await commandsApi.getSouffrance(id);
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return false;
      throw error;
    }
  },

  history: (id: string) =>
    http.get<CommandStatusHistoryEntry[]>(`${RESOURCE}/history/${pathId(id)}`),

  lastByPharmacy: (cip: string) =>
    http.get<CommandBasic[]>(
      `${RESOURCE}/pharmacy/${encodeURIComponent(cip)}/last-commands`
    ),

  search: (input: CommandSearchInput) =>
    http.post<CommandSearchResult[]>(`${RESOURCE}/search`, input),

  searchSouffrance: (input: CommandSearchInput) =>
    http.post<CommandSearchResult[]>(`${RESOURCE}/souffrance/search`, input),

  update: ({ commandIds: ids, ...rest }: CommandUpdateInput) =>
    http.put<void>(RESOURCE, { commandIds: requireIds(ids), ...rest }),

  updateState: ({ commandIds: ids, ...rest }: CommandStatusInput) =>
    http.put<void>(`${RESOURCE}/state`, {
      isWeb: true,
      commandIds: requireIds(ids),
      ...rest,
    }),

  updateTarif: ({ commandIds: ids, tarif }: CommandTarifInput) =>
    http.put<void>(`${RESOURCE}/tarif`, {
      commandIds: requireIds(ids),
      tarif: tarif ?? null,
    }),

  assign: (tourId: string, { commandIds: ids }: CommandIdsInput) =>
    http.put<TourRoute[]>(`${RESOURCE}/assign/${pathId(tourId)}`, {
      commandIds: requireIds(ids),
    }),

  unassign: ({ commandIds: ids }: CommandIdsInput) =>
    http.put<TourRoute[]>(`${RESOURCE}/unassign`, {
      commandIds: requireIds(ids),
    }),

  souffrance: ({ commandIds: ids }: CommandIdsInput) =>
    http.put<void>(
      `${RESOURCE}/souffrance`,
      { commandIds: requireIds(ids) },
      { timeoutMs: SOUFFRANCE_TIMEOUT }
    ),

  restoreSouffrance: ({ commandIds: ids }: CommandIdsInput) =>
    http.put<void>(`${RESOURCE}/souffrance/restore`, {
      commandIds: requireIds(ids),
    }),
};
