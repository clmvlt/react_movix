import { ApiError } from "@/lib/api-error";
import { toursApi } from "./tours.api";
import type { Tour } from "./types";

export type TourPdfKind = "standard" | "tarif";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string | undefined | null): boolean {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function canDownloadTourPdf(
  profil: { isAdmin?: boolean; isWeb?: boolean } | null | undefined,
  kind: TourPdfKind
): boolean {
  if (!profil) return false;
  if (kind === "tarif") return profil.isAdmin === true;
  return profil.isAdmin === true || profil.isWeb === true;
}

function slug(value: string): string {
  const normalized = value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return normalized || "tournee";
}

export function tourPdfFilename(
  tour: Pick<Tour, "id" | "name" | "initialDate">,
  kind: TourPdfKind,
  fallbackDate?: string
): string {
  const date = (tour.initialDate ?? fallbackDate ?? "").slice(0, 10);
  const parts = [
    "tournee",
    slug(tour.name ?? ""),
    date,
    kind === "tarif" ? "tarifs" : "",
  ];
  return `${parts.filter(Boolean).join("-")}.pdf`;
}

export const tourPdfService = {
  fetch: async (tourId: string, kind: TourPdfKind): Promise<Blob> => {
    if (!isUuid(tourId)) throw new ApiError(400, "Invalid tour id", null);
    return kind === "tarif" ? toursApi.pdfTarif(tourId) : toursApi.pdf(tourId);
  },
};
