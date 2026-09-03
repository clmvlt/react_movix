export const UNASSIGNED = "none";
export const ZONE_NAME_MAX = 100;
export const ZONE_PAGE_SIZE = 50;
export const ZONE_ASSIGN_CHUNK = 100;

export interface Zone {
  id: string;
  name: string;
  pharmacyCount: number | null;
}

export interface ZoneMapPharmacy {
  cip: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  postalCode: string | null;
  zoneId: string | null;
  zoneName: string | null;
}

export interface ZoneInput {
  name: string;
}

export interface ZonePharmaciesParams {
  page: number;
  size: number;
  search?: string;
}

export interface ZoneAssignResult {
  requested: number;
  applied: number;
  unknown: number;
}
