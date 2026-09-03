export const NO_ZONE = "none";
export const PHARMACY_PAGE_SIZE = 50;
export const PHARMACY_PAGE_SIZES = [25, 50, 100] as const;
export const PHARMACY_QUERY_MAX_WORDS = 5;
export const PHARMACY_TEXT_MAX = 4000;
export const PICTURE_MAX_BYTES = 10 * 1024 * 1024;
export const PICTURE_MAX_EDGE = 1600;
export const PICTURE_QUALITY = 0.8;
export const PICTURE_PASSTHROUGH_BYTES = 1024 * 1024;

export interface PharmacyZoneRef {
  id: string;
  name: string;
}

export interface Pharmacy {
  cip: string;
  name: string | null;
  address1?: string | null;
  address2?: string | null;
  address3?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  informations?: string | null;
  phone?: string | null;
  fax?: string | null;
  email?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  quality?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  neverOrdered?: boolean | null;
  commentaire?: string | null;
  color?: string | null;
  numero?: string | null;
  doubleCleTransporteur?: boolean | null;
  doubleCleExpediteur?: boolean | null;
  deliveryWindowStart?: string | null;
  deliveryWindowEnd?: string | null;
  zone?: PharmacyZoneRef | null;
  accountId?: string | null;
}

export interface PharmacyPicture {
  id: string;
  name: string;
  displayOrder: number | null;
  mimeType: string;
  originalName: string | null;
  createdAt: string;
  imagePath: string;
}

export interface PharmacyDetail extends Pharmacy {
  pictures: PharmacyPicture[];
}

export interface PharmacySearchInput {
  query?: string;
  name?: string;
  city?: string;
  postalCode?: string;
  cip?: string;
  address?: string;
  isLocationValid?: boolean;
  zoneId?: string;
  hasOrdered?: boolean;
  hasPhotos?: boolean;
  page: number;
  size: number;
}

export interface PharmacyFormInput {
  name?: string | null;
  address1?: string | null;
  address2?: string | null;
  address3?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  informations?: string | null;
  phone?: string | null;
  fax?: string | null;
  email?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  quality?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  commentaire?: string | null;
  color?: string | null;
  numero?: string | null;
  doubleCleTransporteur?: boolean | null;
  doubleCleExpediteur?: boolean | null;
  deliveryWindowStart?: string | null;
  deliveryWindowEnd?: string | null;
  zoneId?: string | null;
}

export interface PharmacyCreateInput extends PharmacyFormInput {
  cip: string;
}

export type PharmacyUpdateInput = PharmacyFormInput;

export interface PictureUploadInput {
  base64?: string;
  displayOrder?: number | null;
  name?: string | null;
}

export interface PharmacyDetachResult {
  requested: number;
  detached: number;
  failed: string[];
}
