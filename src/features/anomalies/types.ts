import type { ProfilRef } from "@/features/auth/types";
import type { CommandPackage, StatusRef } from "@/features/commands/types";
import type { Pharmacy } from "@/features/pharmacies/types";

export const ANOMALY_PAGE_SIZE = 50;
export const ANOMALY_PAGE_SIZES = [25, 50, 100, 200] as const;
export const ANOMALY_LIST_MAX_SIZE = 500;
export const ANOMALY_QUERY_MAX_WORDS = 5;
export const ANOMALY_COMMENT_MAX = 1000;
export const ANOMALY_DESCRIPTION_MAX = 2000;
export const ANOMALY_ACTIONS_MAX = 1000;
export const ANOMALY_PICTURE_MAX = 10;

export const ANOMALY_TYPE_CODES = [
  "c_dev",
  "c_end",
  "c_per",
  "excu_temp",
  "other",
] as const;

export type AnomalyTypeCode = (typeof ANOMALY_TYPE_CODES)[number];

export function isKnownAnomalyType(code: string | null | undefined): boolean {
  return (
    typeof code === "string" &&
    (ANOMALY_TYPE_CODES as readonly string[]).includes(code)
  );
}

export interface AnomalyType {
  code: string;
  name?: string | null;
}

export interface AnomalyPicture {
  id: string;
  name: string;
  createdAt?: string | null;
  imagePath: string;
}

export interface AnomalyCommand {
  id: string;
  closeDate?: string | null;
  expDate?: string | null;
  status?: StatusRef | null;
}

export interface Anomaly {
  id: string;
  other?: string | null;
  actions?: string | null;
  createdAt: string;
  pharmacy?: Pharmacy | null;
  typeAnomalie?: AnomalyType | null;
  profil?: ProfilRef | null;
  commandId?: string | null;
}

export interface AnomalyDetail extends Anomaly {
  pictures?: AnomalyPicture[];
  packages?: CommandPackage[];
  command?: AnomalyCommand | null;
}

export interface AnomalyListInput {
  page: number;
  size: number;
}

export interface AnomalySearchInput {
  query?: string;
  userId?: string;
  cip?: string;
  typeCode?: string;
  dateDebut?: string;
  dateFin?: string;
  page: number;
  size: number;
}

export interface AnomalyPictureInput {
  base64: string;
}

export interface AnomalyGenerateInput {
  code: string;
  commandId?: string;
  cip?: string;
  barcodes?: string[];
  other?: string;
  actions?: string;
  pictures?: AnomalyPictureInput[];
  sendEmail?: boolean | null;
  recipientEmails?: string[];
}

export interface AnomalyCommentInput {
  id: string;
  comment: string;
}

export interface AnomalyEmailInput {
  id: string;
  emails: string[];
}
