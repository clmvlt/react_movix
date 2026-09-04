export const brand = {
  50: "#EFF5FF",
  100: "#DBE8FE",
  200: "#BFD5FE",
  400: "#60A5FA",
  500: "#2563EB",
  600: "#1D4ED8",
  800: "#1E3A8A",
} as const;

export const neutral = {
  white: "#FFFFFF",
  50: "#F7F8FA",
  100: "#EDEFF3",
  200: "#D9DDE5",
  400: "#9AA1AE",
  700: "#4A5160",
  900: "#161A22",
} as const;

export const semantic = {
  primary: brand[500],
  primaryHover: brand[600],
  primaryPressed: brand[800],
  text: neutral[900],
  textMuted: neutral[400],
  textTertiary: neutral[700],
  textBrand: brand[800],
  bg: neutral[50],
  surface: neutral.white,
  border: neutral[200],
} as const;

export const categoryPalette = [
  "#2563EB",
  "#0E7490",
  "#15803D",
  "#CA8A04",
  "#EA580C",
  "#DC2626",
  "#DB2777",
  "#7C3AED",
  "#57534E",
] as const;

export const defaultCategoryColor = categoryPalette[0];

export const mockMap = {
  land: "#F2EFE9",
  water: "#9FC7E8",
  park: "#CBE5AE",
  building: "#E8E4DA",
  roadCasing: "#DFDBD2",
  road: "#FFFFFF",
  avenue: "#FBDF9C",
  avenueCasing: "#E8C97E",
  label: "#847A64",
  selectedPin: "#7C3AED",
} as const;

export const unassignedColor = neutral[400];

function hashKey(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function zoneColor(zoneId: string | null | undefined): string {
  if (!zoneId) return unassignedColor;
  const key = zoneId.trim().toLowerCase();
  if (!key) return unassignedColor;
  return categoryPalette[hashKey(key) % categoryPalette.length];
}

export function zoneColorMap(
  zoneIds: readonly string[]
): Record<string, string> {
  const used = new Set<string>();
  const result: Record<string, string> = {};
  const pending: string[] = [];

  for (const rawId of zoneIds) {
    const key = rawId.trim().toLowerCase();
    if (!key || result[key]) continue;
    const preferred = zoneColor(key);
    if (used.has(preferred)) {
      pending.push(key);
      continue;
    }
    used.add(preferred);
    result[key] = preferred;
  }

  for (const key of pending) {
    const free = categoryPalette.find((color) => !used.has(color));
    if (free) used.add(free);
    result[key] = free ?? zoneColor(key);
  }

  return result;
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export function isHexColor(value: string | null | undefined): boolean {
  return typeof value === "string" && HEX_COLOR.test(value.trim());
}

export function safeCategoryColor(value: string | null | undefined): string {
  return isHexColor(value) ? (value as string).trim() : defaultCategoryColor;
}

const HEX_COLOR_SHORT = /^#[0-9a-fA-F]{3}$/;

export function normalizeHexColor(
  value: string | null | undefined
): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (HEX_COLOR.test(trimmed)) return trimmed;
  if (!HEX_COLOR_SHORT.test(trimmed)) return null;
  const [, r, g, b] = trimmed;
  return `#${r}${r}${g}${g}${b}${b}`;
}

export function contrastTextOn(value: string): string {
  const hex = isHexColor(value) ? value.trim().slice(1) : "000000";
  const channel = (start: number) => {
    const ratio = parseInt(hex.slice(start, start + 2), 16) / 255;
    return ratio <= 0.03928
      ? ratio / 12.92
      : Math.pow((ratio + 0.055) / 1.055, 2.4);
  };
  const luminance =
    0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
  return luminance > 0.45 ? neutral[900] : neutral.white;
}

export interface StatusToken {
  strong: string;
  badgeBg: string;
  badgeText: string;
}

export const status = {
  neutral: { strong: "#57534E", badgeBg: "#F5F5F4", badgeText: "#44403C" },
  pending: { strong: "#B45309", badgeBg: "#FEF3C7", badgeText: "#92400E" },
  progress: { strong: "#1D4ED8", badgeBg: "#DBEAFE", badgeText: "#1E40AF" },
  info: { strong: "#0E7490", badgeBg: "#CFFAFE", badgeText: "#155E75" },
  success: { strong: "#15803D", badgeBg: "#DCFCE7", badgeText: "#166534" },
  warning: { strong: "#C2410C", badgeBg: "#FFEDD5", badgeText: "#9A3412" },
  danger: { strong: "#B91C1C", badgeBg: "#FEE2E2", badgeText: "#991B1B" },
} as const;

export type StatusCategory = keyof typeof status;

export type ColorScheme = "light" | "dark";

export const statusDark: Record<StatusCategory, StatusToken> = {
  neutral: { strong: "#A8A29E", badgeBg: "#3B3D44", badgeText: "#D6D3D1" },
  pending: { strong: "#FBBF24", badgeBg: "#4D4429", badgeText: "#FCD34D" },
  progress: { strong: "#60A5FA", badgeBg: "#2B3E59", badgeText: "#93C5FD" },
  info: { strong: "#22D3EE", badgeBg: "#1D4856", badgeText: "#67E8F9" },
  success: { strong: "#4ADE80", badgeBg: "#264B3E", badgeText: "#86EFAC" },
  warning: { strong: "#FB923C", badgeBg: "#4D3A2F", badgeText: "#FDBA74" },
  danger: { strong: "#F87171", badgeBg: "#4C333A", badgeText: "#FCA5A5" },
};

export const statusOrder: StatusCategory[] = [
  "neutral",
  "pending",
  "progress",
  "info",
  "success",
  "warning",
  "danger",
];

function cssStatusToken(category: StatusCategory): StatusToken {
  return {
    strong: `var(--color-status-${category}-strong)`,
    badgeBg: `var(--color-status-${category}-bg)`,
    badgeText: `var(--color-status-${category}-text)`,
  };
}

const statusCssTokens = Object.fromEntries(
  statusOrder.map((category) => [category, cssStatusToken(category)])
) as Record<StatusCategory, StatusToken>;

export function getStatusTokens(
  category: StatusCategory | null | undefined
): StatusToken {
  if (category && category in statusCssTokens) {
    return statusCssTokens[category];
  }
  return statusCssTokens.neutral;
}

export function getStatusPalette(
  category: StatusCategory | null | undefined,
  scheme: ColorScheme = "light"
): StatusToken {
  const palette = scheme === "dark" ? statusDark : status;
  if (category && category in palette) return palette[category];
  return palette.neutral;
}

function toKebab(scale: string, key: string): string {
  return `--color-${scale}-${key}`;
}

export function applyColorTokens(scheme: ColorScheme = "light"): void {
  const root = document.documentElement;
  const palette = scheme === "dark" ? statusDark : status;

  for (const [key, value] of Object.entries(brand)) {
    root.style.setProperty(toKebab("brand", key), value);
  }
  for (const [key, value] of Object.entries(neutral)) {
    root.style.setProperty(toKebab("neutral", key), value);
  }
  for (const [key, value] of Object.entries(semantic)) {
    root.style.setProperty(`--color-semantic-${key}`, value);
  }
  for (const [key, token] of Object.entries(palette)) {
    root.style.setProperty(`--color-status-${key.toLowerCase()}-strong`, token.strong);
    root.style.setProperty(`--color-status-${key.toLowerCase()}-bg`, token.badgeBg);
    root.style.setProperty(`--color-status-${key.toLowerCase()}-text`, token.badgeText);
  }
}
