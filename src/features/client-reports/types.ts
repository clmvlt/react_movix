import type { Client } from "@/features/clients";

export interface ClientReportPicture {
  id: string;
  name: string;
  displayOrder: number | null;
  createdAt: string;
  imagePath: string;
}

export interface ClientReportAuthor {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  identifiant?: string | null;
}

export interface ClientReport {
  id: string;
  commentaire: string | null;
  invalidGeocodage: boolean | null;
  createdAt: string;
  updatedAt: string;
  client: Client | null;
  profil: ClientReportAuthor | null;
  pictures: ClientReportPicture[];
}
