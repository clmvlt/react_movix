export const UNASSIGNED = "none";
export const ZONE_NAME_MAX = 100;
export const ZONE_PAGE_SIZE = 50;

export interface Zone {
  id: string;
  name: string;
  clientCount: number | null;
}

export interface ZoneMapClient {
  id: string;
  type: "GENERIC" | "PHARMACY";
  cip: string | null;
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

export interface ZoneClientsParams {
  page: number;
  size: number;
  search?: string;
}

