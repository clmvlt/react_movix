import type { RouteLeg } from "@/features/tours/types";

export interface StatusRef {
  id: number;
  name: string;
  createdAt?: string | null;
}

export interface CommandTour {
  id: string;
  name: string;
  color?: string;
  sorted?: boolean | null;
  routeStale?: boolean | null;
}

export interface ExpeditionPharmacy {
  cip: string;
  name: string;
  address1?: string;
  city?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  color?: string | null;
  numero?: string | null;
  deliveryWindowStart?: string | null;
  deliveryWindowEnd?: string | null;
}

export interface CommandExpedition {
  id: string;
  closeDate?: string | null;
  tourOrder?: number | null;
  expDate: string;
  comment?: string | null;
  newPharmacy: boolean;
  latitude?: number | null;
  longitude?: number | null;
  tour?: CommandTour | null;
  packagesNumber: number;
  totalWeight: number;
  pharmacy?: ExpeditionPharmacy | null;
  pharmacyCommentaire?: string | null;
  pharmacyDeliveryWindowStart?: string | null;
  pharmacyDeliveryWindowEnd?: string | null;
  status?: StatusRef | null;
  previousLeg: RouteLeg;
  nextLeg: RouteLeg;
  cumulativeDistanceKm?: number | null;
  cumulativeDurationMins?: number | null;
  estimatedArrivalTime?: string | null;
}

export interface CommandPackage {
  id?: string | null;
  barcode?: string | null;
  designation?: string | null;
  type?: string | null;
  quantity?: number | null;
  weight?: number | null;
  volume?: number | null;
  num?: string | null;
  zoneName?: string | null;
  cNumTransport?: string | null;
  labelUrl?: string | null;
  fresh?: boolean | null;
  souffrance?: boolean | null;
  status?: StatusRef | null;
}

export interface CommandPicture {
  id: string;
  name: string;
  createdAt?: string | null;
  imagePath: string;
}

export interface CommandDetail {
  id: string;
  closeDate?: string | null;
  expDate?: string;
  tourOrder?: number | null;
  tourColor?: string | null;
  comment?: string | null;
  newPharmacy?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  tarif?: number | null;
  isForced?: boolean;
  souffrance?: boolean;
  souffranceDate?: string | null;
  souffranceByName?: string | null;
  pharmacyCommentaire?: string | null;
  pharmacyDeliveryWindowStart?: string | null;
  pharmacyDeliveryWindowEnd?: string | null;
  pharmacy?: ExpeditionPharmacy & { phone?: string; email?: string };
  tour?: CommandTour | null;
  status?: StatusRef | null;
  packages?: CommandPackage[];
  pictures?: CommandPicture[];
}

export interface CommandBasic {
  id: string;
  closeDate?: string | null;
  tourOrder?: number | null;
  expDate: string;
  comment?: string | null;
  newPharmacy?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  pharmacy?: ExpeditionPharmacy;
}

export interface CommandStatusHistoryEntry {
  id: number;
  name: string;
  createdAt?: string;
  profil?: {
    firstName?: string;
    lastName?: string;
    identifiant?: string | null;
  } | null;
}

export interface CommandSearchResult {
  id: string;
  closeDate?: string | null;
  expDate: string;
  comment?: string | null;
  newPharmacy?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  pharmacyName?: string | null;
  pharmacyCity?: string | null;
  pharmacyCodePostal?: string | null;
  pharmacyAddress1?: string | null;
  pharmacyAddress2?: string | null;
  pharmacyAddress3?: string | null;
  souffranceDate?: string | null;
  souffranceByName?: string | null;
}

export interface CommandSearchInput {
  query?: string;
  pharmacyName?: string;
  pharmacyCity?: string;
  pharmacyCip?: string;
  pharmacyPostalCode?: string;
  pharmacyAddress?: string;
  commandId?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  size: number;
}

export type CommandScope = "active" | "souffrance";

export interface CommandIdsInput {
  commandIds: string[];
}

export interface CommandUpdateInput {
  commandIds: string[];
  expDate?: string;
  comment?: string;
  isForced?: boolean;
}

export interface CommandStatusInput {
  statusId: number;
  commandIds: string[];
  isWeb?: boolean;
  comment?: string;
  latitude?: number;
  longitude?: number;
}

export interface CommandTarifInput {
  commandIds: string[];
  tarif?: number | null;
}

export interface CommandCreatePackageInput {
  id?: string;
  type?: string;
  designation?: string;
  quantity?: number;
  weight?: number;
  volume?: number;
  length?: number;
  width?: number;
  height?: number;
  fresh?: boolean;
  num?: string;
}

export interface CommandCreateBodyInput {
  num_transport: string;
  packages?: CommandCreatePackageInput[];
  close_date?: string;
}

export interface CommandCreateInput {
  expedition_date: string;
  cip: string;
  command: CommandCreateBodyInput;
}

export interface CreatedPackage {
  id?: string | null;
  barcode?: string | null;
  type?: string | null;
  designation?: string | null;
  quantity?: number | null;
  weight?: number | null;
  volume?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  fresh?: boolean | null;
  num?: string | null;
  zoneName?: string | null;
  labelUrl?: string | null;
  status?: StatusRef | null;
  souffrance?: boolean | null;
}

export interface CommandCreateResult {
  status?: string;
  message?: string | null;
  id_command: string;
  packages?: CreatedPackage[];
}
