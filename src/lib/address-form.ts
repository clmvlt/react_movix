import type { AddressResult } from "@/features/ors";
import type { LngLat } from "@/components/map";

export interface AddressFormFields {
  address1: string;
  postalCode: string;
  city: string;
}

export interface CoordinateFormFields {
  latitude: string;
  longitude: string;
}

export interface AddressSource {
  address1?: string | null;
  address2?: string | null;
  address3?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
}

export interface PositionSource {
  latitude?: number | null;
  longitude?: number | null;
}

export function formatCoordinate(value: number): string {
  return value.toFixed(6);
}

export function parseCoordinateInput(value: string): number | null {
  const raw = value.trim().replace(",", ".");
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formPosition(form: CoordinateFormFields): LngLat | null {
  const latitude = parseCoordinateInput(form.latitude);
  const longitude = parseCoordinateInput(form.longitude);
  if (latitude == null || longitude == null) return null;
  if (latitude === 0 && longitude === 0) return null;
  return [longitude, latitude];
}

export function samePosition(a: LngLat | null, b: LngLat | null): boolean {
  if (a === null || b === null) return a === b;
  return a[0] === b[0] && a[1] === b[1];
}

export function entityPosition(
  source: PositionSource | null | undefined
): LngLat | null {
  if (!source) return null;
  const { latitude, longitude } = source;
  if (latitude == null || longitude == null) return null;
  if (latitude === 0 && longitude === 0) return null;
  return [longitude, latitude];
}

export function hasValidLocation(
  source: PositionSource | null | undefined
): boolean {
  return entityPosition(source) !== null;
}

export function addressResultPatch(
  result: AddressResult
): AddressFormFields & CoordinateFormFields {
  const street = [result.houseNumber, result.street]
    .map((part) => part?.trim() ?? "")
    .filter(Boolean)
    .join(" ");
  return {
    address1: street || result.label,
    postalCode: result.postcode?.trim() ?? "",
    city: result.city?.trim() ?? "",
    latitude: formatCoordinate(result.lat),
    longitude: formatCoordinate(result.lon),
  };
}

export function addressSummary(form: AddressFormFields): string {
  return [form.address1, form.postalCode, form.city]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
}

export function addressKey(form: AddressFormFields): string {
  return addressSummary(form).replace(/\s+/g, " ").toLowerCase();
}

export function addressLines(source: AddressSource): string[] {
  const lines = [
    source.address1,
    source.address2,
    source.address3,
    [source.postalCode, source.city].filter((part) => part?.trim()).join(" "),
    source.country,
  ];
  return lines.map((line) => line?.trim() ?? "").filter((line) => line !== "");
}
