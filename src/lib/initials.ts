export function initialsFromName(
  first?: string | null,
  last?: string | null,
  fallback?: string | null
): string {
  const a = (first ?? "").trim();
  const b = (last ?? "").trim();
  if (a || b) {
    return `${a.charAt(0)}${b.charAt(0)}`.toUpperCase();
  }
  return (fallback ?? "").trim().slice(0, 2).toUpperCase();
}

export function initialsFromLabel(label?: string | null): string {
  const words = (label ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
}
