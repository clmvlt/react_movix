function localeFor(lang: string): string {
  return lang.startsWith("fr") ? "fr-FR" : "en-GB";
}

const SPACED_DATE_TIME = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

export function parseDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const normalized = SPACED_DATE_TIME.test(value)
    ? value.replace(" ", "T")
    : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(
  value: string | Date | null | undefined,
  lang = "en"
): string {
  const date = parseDate(value);
  if (!date) return "";
  return date.toLocaleDateString(localeFor(lang), {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export function formatDateTime(
  value: string | Date | null | undefined,
  lang = "en"
): string {
  const date = parseDate(value);
  if (!date) return "";
  return date.toLocaleString(localeFor(lang), {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function formatRelativeDateTime(
  value: string | Date | null | undefined,
  lang = "en"
): string {
  const date = parseDate(value);
  if (!date) return "";
  const elapsed = Date.now() - date.getTime();
  if (elapsed < 0 || elapsed >= DAY_MS) return formatDateTime(value, lang);

  const formatter = new Intl.RelativeTimeFormat(localeFor(lang), {
    numeric: "auto",
  });
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 60) return formatter.format(-Math.max(1, minutes), "minute");
  return formatter.format(-Math.floor(minutes / 60), "hour");
}

export function formatWeekdayNarrow(
  value: string | Date | null | undefined,
  lang = "en"
): string {
  const date = parseDate(value);
  if (!date) return "";
  return date.toLocaleDateString(localeFor(lang), { weekday: "narrow" });
}

export function formatTime(
  value: string | Date | null | undefined,
  lang = "en"
): string {
  const date = parseDate(value);
  if (!date) return "";
  return date.toLocaleTimeString(localeFor(lang), {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toApiDate(value: Date): string {
  return dateToApiDate(value);
}

export function todayApiDate(): string {
  return toApiDate(new Date());
}

export function apiDateToDate(apiDate: string): Date {
  const [year, month, day] = apiDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function dateToApiDate(value: Date): string {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function dayStartIso(apiDate: string): string {
  return `${apiDate}T00:00:00Z`;
}

export function dayEndIso(apiDate: string): string {
  return `${apiDate}T23:59:59Z`;
}

export function localOffsetIso(apiDate: string, time = "08:00"): string {
  const [year, month, day] = apiDate.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date(
    year,
    month - 1,
    day,
    Number.isFinite(hours) ? hours : 0,
    Number.isFinite(minutes) ? minutes : 0,
    0,
    0
  );
  const offset = -date.getTimezoneOffset();
  const sign = offset < 0 ? "-" : "+";
  const absolute = Math.abs(offset);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${dateToApiDate(date)}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}:00${sign}${pad(Math.floor(absolute / 60))}:${pad(absolute % 60)}`;
}

export function isValidTimeInput(value: string | null | undefined): boolean {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

const FR_TIME_PATTERN = /^([01]?\d|2[0-3])h([0-5]\d)$/;

export function frTimeToTimeInput(
  value: string | null | undefined
): string | null {
  if (!value) return null;
  const match = FR_TIME_PATTERN.exec(value.trim());
  if (!match) return null;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

export function timeInputToFrTime(value: string): string | null {
  if (!isValidTimeInput(value)) return null;
  const [hours, minutes] = value.split(":");
  return `${hours}h${minutes}`;
}

export function isValidApiDate(value: string | null | undefined): boolean {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function addDays(apiDate: string, delta: number): string {
  const [year, month, day] = apiDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + delta);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isTodayApiDate(apiDate: string): boolean {
  return apiDate === todayApiDate();
}

export function addMinutes(value: Date, minutes: number): Date {
  return new Date(value.getTime() + minutes * 60000);
}

export function toTimeInput(value: Date): string {
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function withTime(value: Date, time: string): Date | null {
  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  const date = new Date(value);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export function formatDuration(
  minutes: number | null | undefined
): string {
  if (minutes == null || Number.isNaN(minutes)) return "";
  const total = Math.round(minutes);
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours === 0) return `${mins} min`;
  return `${hours}h${String(mins).padStart(2, "0")}`;
}
