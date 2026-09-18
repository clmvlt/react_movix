import { ApiError } from "@/lib/api-error";
import { isPharmacyClient, type Client } from "./types";

function slug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export function clientLabelFilename(client: Client): string {
  const cip = isPharmacyClient(client) ? client.cip : "";
  const parts = ["etiquette", slug(client.name ?? ""), slug(cip)];
  return `${parts.filter(Boolean).join("-")}.pdf`;
}

export function labelErrorKey(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isEmailNotVerified) return "clients.label.errors.emailNotVerified";
    if (error.errorCode === "CLIENT_NOT_A_PHARMACY") {
      return "clients.label.errors.notAPharmacy";
    }
    if (error.status === 404) return "clients.label.errors.notFound";
    if (error.status === 401 || error.status === 403) {
      return "clients.label.errors.forbidden";
    }
  }
  return "clients.label.errors.failed";
}
