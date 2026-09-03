export interface PackageStatusHistoryEntry {
  id: number;
  name: string;
  createdAt?: string;
  profil?: {
    firstName?: string;
    lastName?: string;
    identifiant?: string | null;
  } | null;
}

export interface PackageStatusInput {
  statusId: number;
  barcodes: string[];
}

export interface PackageSouffranceResult {
  barcode: string;
  type?: string | null;
  designation?: string | null;
  quantity?: number | null;
  weight?: number | null;
  zoneName?: string | null;
  commandId?: string | null;
  closeDate?: string | null;
  expDate?: string | null;
  pharmacyName?: string | null;
  pharmacyCity?: string | null;
  pharmacyCodePostal?: string | null;
}

export interface PackageSouffranceSearchInput {
  query?: string;
  barcode?: string;
  pharmacyName?: string;
  pharmacyCity?: string;
  pharmacyCip?: string;
  pharmacyPostalCode?: string;
  commandId?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  size: number;
}

export interface PackageBarcodesInput {
  barcodes: string[];
}
