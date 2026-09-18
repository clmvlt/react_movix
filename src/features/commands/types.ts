import type { RouteLeg } from "@/features/tours/types";
import type { Client, ClientType } from "@/features/clients/types";

export const COMMAND_PARTY_ROLES = ["orderer", "sender", "recipient"] as const;

export type CommandPartyRole = (typeof COMMAND_PARTY_ROLES)[number];

export interface CommandParty {
  linked: boolean;
  clientId: string | null;
  clientType: ClientType | null;
  cip: string | null;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  address1: string | null;
  address2: string | null;
  address3: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface CommandProof {
  at: string | null;
  latitude: number | null;
  longitude: number | null;
  signatureName: string | null;
  signatureAt: string | null;
  signatureImageUrl: string | null;
}

export interface StatusRef {
  id: number;
  name: string;
  createdAt?: string | null;
}

export interface CommandUnassignedCount {
  date: string;
  count: number;
}

export interface CommandAssignGroup {
  tourId: string;
  commandIds: string[];
}

export interface CommandAssignGroupFailure extends CommandAssignGroup {
  error: unknown;
}

export interface CommandAssignBatchResult {
  assigned: CommandAssignGroup[];
  failed: CommandAssignGroupFailure[];
}

export interface CommandTour {
  id: string;
  name: string;
  color?: string;
  sorted?: boolean | null;
  routeStale?: boolean | null;
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
  client?: Client | null;
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
  orderer?: Client | null;
  sender?: CommandParty | null;
  recipient?: CommandParty | null;
  loading?: CommandProof | null;
  delivery?: CommandProof | null;
  client?: Client | null;
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
  orderer?: Client | null;
  sender?: CommandParty | null;
  recipient?: CommandParty | null;
  client?: Client | null;
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
  clientId?: string | null;
  clientType?: ClientType | null;
  clientCip?: string | null;
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
  clientId?: string;
  ordererId?: string;
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

export interface CommandPartyInput {
  clientId?: string;
  cip?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  address1?: string;
  address2?: string;
  address3?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
}

export interface CommandCreateInput {
  expedition_date: string;
  ordererId: string;
  sender?: CommandPartyInput | null;
  recipient?: CommandPartyInput | null;
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
