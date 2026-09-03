export const APK_MAX_BYTES = 150 * 1024 * 1024;

const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;

export function isValidSemver(version: string): boolean {
  return SEMVER_PATTERN.test(version.trim());
}

export interface MobileUpdate {
  id: string;
  version: string;
  createdAt?: string | null;
  versionCode?: number | null;
  size?: number | null;
  sha256?: string | null;
  changelog?: string | null;
  mandatory?: boolean | null;
  downloadUrl?: string | null;
}

export interface MobileUpdateEdit {
  changelog?: string;
  mandatory?: boolean;
}

export function isSameUpdate(
  a: MobileUpdate | null | undefined,
  b: MobileUpdate | null | undefined
): boolean {
  if (!a || !b) return false;
  return a.id === b.id;
}
