import { http } from "@/lib/http";
import type {
  ImporterToken,
  ImporterTokenCreateInput,
  ImporterTokenUpdateInput,
} from "./types";

const ADMIN_RESOURCE = "/admin/importer-tokens";

function pathId(id: string): string {
  return encodeURIComponent(id.trim());
}

function trimmed(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  return value.trim();
}

function createBody(input: ImporterTokenCreateInput) {
  const body: Record<string, unknown> = { name: input.name.trim() };
  const description = trimmed(input.description);
  if (description !== undefined) body.description = description;
  if (input.accountId) body.accountId = input.accountId;
  if (input.isBetaProxy !== undefined) body.isBetaProxy = input.isBetaProxy;
  if (input.clientId) body.clientId = input.clientId;
  return body;
}

function updateBody(input: ImporterTokenUpdateInput) {
  const body: Record<string, unknown> = {};
  if (input.name !== undefined) body.name = input.name.trim();
  if (input.description !== undefined) body.description = input.description.trim();
  if (input.isActive !== undefined) body.isActive = input.isActive;
  if (input.isBetaProxy !== undefined) body.isBetaProxy = input.isBetaProxy;
  if (input.clientId) body.clientId = input.clientId;
  if (input.clearClient) body.clearClient = true;
  return body;
}

export const importerTokensApi = {
  list: () => http.get<ImporterToken[]>(ADMIN_RESOURCE),

  create: (input: ImporterTokenCreateInput) =>
    http.post<ImporterToken>(ADMIN_RESOURCE, createBody(input)),

  update: (id: string, input: ImporterTokenUpdateInput) =>
    http.put<ImporterToken>(`${ADMIN_RESOURCE}/${pathId(id)}`, updateBody(input)),

  remove: (id: string) =>
    http.delete<string>(`${ADMIN_RESOURCE}/${pathId(id)}`),
};
