import type { Pharmacy } from "@/features/pharmacies/types";

export interface PharmacyReportPicture {
  id: string;
  name: string;
  displayOrder: number | null;
  createdAt: string;
  imagePath: string;
}

export interface PharmacyReportAuthor {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  identifiant?: string | null;
}

export interface PharmacyReport {
  id: string;
  commentaire: string | null;
  invalidGeocodage: boolean | null;
  createdAt: string;
  updatedAt: string;
  pharmacy: Pharmacy | null;
  profil: PharmacyReportAuthor | null;
  pictures: PharmacyReportPicture[];
}
