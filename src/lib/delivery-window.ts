import { parseDate, toTimeInput } from "@/lib/date";

export type Translate = (key: string, options?: Record<string, unknown>) => string;

export interface DeliveryWindow {
  start: string | null;
  end: string | null;
}

export function hasDeliveryWindow(
  start: string | null | undefined,
  end: string | null | undefined
): boolean {
  return Boolean(start) || Boolean(end);
}

export function formatWindowBadge(
  start: string | null | undefined,
  end: string | null | undefined,
  t: Translate
): string | null {
  if (start && end) return t("deliveryWindow.range", { start, end });
  if (start) return t("deliveryWindow.from", { start });
  if (end) return t("deliveryWindow.until", { end });
  return null;
}

export function formatStopWindow(
  start: string | null | undefined,
  end: string | null | undefined,
  t: Translate
): string | null {
  if (start && end) return t("tours.order.windows.range", { start, end });
  if (start) return t("tours.order.windows.from", { start });
  if (end) return t("tours.order.windows.until", { end });
  return null;
}

export function formatStopTime(
  value: Date | string | null | undefined
): string | null {
  const date = parseDate(value);
  return date ? toTimeInput(date) : null;
}
