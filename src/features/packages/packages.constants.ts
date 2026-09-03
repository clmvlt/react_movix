export interface PackageStatusOption {
  id: number;
  name: string;
}

export const PACKAGE_STATUSES: PackageStatusOption[] = [
  { id: 1, name: "À enlever" },
  { id: 2, name: "Chargé" },
  { id: 3, name: "Livré" },
  { id: 4, name: "Non Livré" },
  { id: 5, name: "Non chargé - MANQUANT" },
];

export const PACKAGE_PAGE_SIZE = 50;
export const PACKAGE_PAGE_SIZES = [25, 50, 100, 200] as const;
export const PACKAGE_QUERY_MAX_WORDS = 5;

export function packageBarcodes(values: string[]): string[] {
  return values.map((value) => value.trim()).filter((value) => value !== "");
}
