import type { PackageSouffranceSearchInput } from "./types";

export const packageKeys = {
  all: ["packages"] as const,
  history: (barcode: string) =>
    [...packageKeys.all, "history", barcode] as const,
  label: (barcode: string) => [...packageKeys.all, "label", barcode] as const,
  souffrance: () => [...packageKeys.all, "souffrance"] as const,
  souffranceSearches: () => [...packageKeys.souffrance(), "search"] as const,
  souffranceSearch: (input: PackageSouffranceSearchInput) =>
    [...packageKeys.souffranceSearches(), input] as const,
  souffranceByCommand: (commandId: string) =>
    [...packageKeys.souffrance(), "by-command", commandId] as const,
};
