import type { Pharmacy } from "./types";

function slug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export function pharmacyLabelFilename(
  pharmacy: Pick<Pharmacy, "cip" | "name">
): string {
  const parts = ["etiquette", slug(pharmacy.name ?? ""), slug(pharmacy.cip)];
  return `${parts.filter(Boolean).join("-")}.pdf`;
}
