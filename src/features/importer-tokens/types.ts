import type { ClientRef } from "@/features/clients/types";

export interface ImporterToken {
  id: string;
  name: string;
  token: string;
  description?: string | null;
  isActive: boolean;
  isBetaProxy: boolean;
  accountId?: string | null;
  accountName?: string | null;
  nonDeletable: boolean;
  client?: ClientRef | null;
  createdAt?: string | null;
  lastUsedAt?: string | null;
}

export interface ImporterTokenCreateInput {
  name: string;
  description?: string;
  accountId?: string;
  isBetaProxy?: boolean;
  clientId?: string;
}

export interface ImporterTokenUpdateInput {
  name?: string;
  description?: string;
  isActive?: boolean;
  isBetaProxy?: boolean;
  clientId?: string;
  clearClient?: boolean;
}

export const TOKEN_NAME_MAX = 120;
export const TOKEN_DESCRIPTION_MAX = 500;

const TOKEN_VISIBLE_CHARS = 6;

export function maskToken(token: string | null | undefined): string {
  const value = token ?? "";
  if (!value) return "";
  if (value.length <= TOKEN_VISIBLE_CHARS) return "•".repeat(value.length);
  return `${"•".repeat(8)}${value.slice(-TOKEN_VISIBLE_CHARS)}`;
}

export function sortImporterTokens(tokens: ImporterToken[]): ImporterToken[] {
  return [...tokens].sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export function matchesTokenSearch(
  token: ImporterToken,
  term: string
): boolean {
  const needle = term.trim().toLowerCase();
  if (!needle) return true;
  return [token.name, token.description, token.accountName]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLowerCase().includes(needle));
}
