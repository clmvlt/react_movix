const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseEmails(raw: string): string[] {
  return raw
    .split(/[;,\s]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function invalidEmails(entries: string[]): string[] {
  return entries.filter((entry) => !EMAIL_PATTERN.test(entry));
}
