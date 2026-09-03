import { http } from "@/lib/http";
import { ApiError } from "@/lib/api-error";
import { packageBarcodes } from "./packages.constants";
import type {
  PackageBarcodesInput,
  PackageSouffranceResult,
  PackageSouffranceSearchInput,
  PackageStatusHistoryEntry,
  PackageStatusInput,
} from "./types";

const RESOURCE = "/packages";
const LABEL_TIMEOUT = 60_000;

function requireBarcodes(barcodes: string[]): string[] {
  const valid = packageBarcodes(barcodes);
  if (valid.length === 0) {
    throw new ApiError(400, "barcodes can't be empty", null);
  }
  return valid;
}

export const packagesApi = {
  history: (barcode: string) =>
    http.get<PackageStatusHistoryEntry[]>(
      `${RESOURCE}/history/${encodeURIComponent(barcode)}`
    ),

  updateState: ({ statusId, barcodes }: PackageStatusInput) =>
    http.put<void>(`${RESOURCE}/state`, {
      statusId,
      packageBarcodes: requireBarcodes(barcodes),
    }),

  label: (barcode: string) =>
    http.blob(`${RESOURCE}/label/${encodeURIComponent(barcode)}`, {
      body: {},
      headers: { Accept: "application/pdf" },
      timeoutMs: LABEL_TIMEOUT,
    }),

  searchSouffrance: (input: PackageSouffranceSearchInput) =>
    http.post<PackageSouffranceResult[]>(`${RESOURCE}/souffrance/search`, input),

  souffrance: ({ barcodes }: PackageBarcodesInput) =>
    http.put<void>(`${RESOURCE}/souffrance`, {
      barcodes: requireBarcodes(barcodes),
    }),

  restoreSouffrance: ({ barcodes }: PackageBarcodesInput) =>
    http.put<void>(`${RESOURCE}/souffrance/restore`, {
      barcodes: requireBarcodes(barcodes),
    }),
};
