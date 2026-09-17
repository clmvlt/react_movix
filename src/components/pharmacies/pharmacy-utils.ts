import { ApiError } from "@/lib/api-error";
import { formatDate } from "@/lib/date";
import type { Pharmacy } from "@/features/pharmacies";
import type { CommandBasic } from "@/features/commands";

export interface CommandMapPoint {
  id: string;
  longitude: number;
  latitude: number;
  label: number;
  title: string;
}

export function commandMapPoints(
  commands: CommandBasic[],
  lang: string
): CommandMapPoint[] {
  return commands
    .map((command, index) => ({
      id: command.id,
      longitude: command.longitude,
      latitude: command.latitude,
      label: index + 1,
      title: formatDate(command.expDate, lang),
    }))
    .filter(
      (point): point is CommandMapPoint =>
        point.longitude != null &&
        point.latitude != null &&
        point.longitude !== 0 &&
        point.latitude !== 0
    );
}

export function addressLines(
  source: Pick<
    Pharmacy,
    "address1" | "address2" | "address3" | "postalCode" | "city" | "country"
  >
): string[] {
  const lines = [
    source.address1,
    source.address2,
    source.address3,
    [source.postalCode, source.city].filter((part) => part?.trim()).join(" "),
    source.country,
  ];
  return lines
    .map((line) => line?.trim() ?? "")
    .filter((line) => line !== "");
}

export function hasValidLocation(
  pharmacy: Pick<Pharmacy, "latitude" | "longitude"> | null | undefined
): boolean {
  if (!pharmacy) return false;
  const { latitude, longitude } = pharmacy;
  return (
    latitude != null &&
    longitude != null &&
    latitude !== 0 &&
    longitude !== 0
  );
}

export function labelErrorKey(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isEmailNotVerified) {
      return "pharmacies.label.errors.emailNotVerified";
    }
    if (error.status === 404) return "pharmacies.label.errors.notFound";
    if (error.status === 401 || error.status === 403) {
      return "pharmacies.label.errors.forbidden";
    }
  }
  return "pharmacies.label.errors.failed";
}
