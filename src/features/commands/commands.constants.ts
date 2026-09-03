import type { StatusRef } from "./types";

export const COMMAND_STATUSES: StatusRef[] = [
  { id: 1, name: "À enlever" },
  { id: 2, name: "Chargé" },
  { id: 3, name: "Livré" },
  { id: 4, name: "Non Livré" },
  { id: 5, name: "Livré incomplet" },
  { id: 6, name: "Chargé incomplet" },
  { id: 7, name: "Non chargé - MANQUANT" },
  { id: 8, name: "Non livré - Inaccessible" },
  { id: 9, name: "Non livré - Instructions invalides" },
];

export const COMMAND_PAGE_SIZE = 50;
export const COMMAND_PAGE_SIZES = [25, 50, 100, 200] as const;
export const COMMAND_QUERY_MAX_WORDS = 5;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isCommandId(value: string | null | undefined): boolean {
  return typeof value === "string" && UUID_PATTERN.test(value.trim());
}

export function expDateIso(apiDate: string): string {
  return `${apiDate}T08:00:00Z`;
}

export function commandIds(values: string[]): string[] {
  return values
    .map((value) => value.trim().toLowerCase())
    .filter((value) => UUID_PATTERN.test(value));
}
