export const TARIF_KM_MAX = 100_000;
export const TARIF_PRICE_MAX = 100_000;

export interface Tarif {
  id: string;
  kmMax: number;
  prixEuro: number;
}

export interface TarifInput {
  kmMax: number;
  prixEuro: number;
}

export function sortTarifs(tarifs: Tarif[]): Tarif[] {
  return [...tarifs].sort((a, b) => a.kmMax - b.kmMax);
}

export function findTarifTier(
  tarifs: Tarif[],
  distanceKm: number
): Tarif | null {
  return sortTarifs(tarifs).find((tarif) => tarif.kmMax >= distanceKm) ?? null;
}
