import type { StatusCategory } from "./colors";

const COMMAND_STATUS_CATEGORY: Record<number, StatusCategory> = {
  1: "pending",
  2: "progress",
  3: "success",
  4: "danger",
  5: "warning",
  6: "warning",
  7: "danger",
  8: "danger",
  9: "danger",
};

export function commandStatusCategory(
  id: number | null | undefined
): StatusCategory {
  return (id != null && COMMAND_STATUS_CATEGORY[id]) || "neutral";
}

const COMMAND_STATUS_WITHOUT_TIME = new Set<number>([1, 2, 6, 7]);

export function commandStatusHasTime(id: number | null | undefined): boolean {
  return id != null && !COMMAND_STATUS_WITHOUT_TIME.has(id);
}

const PACKAGE_STATUS_CATEGORY: Record<number, StatusCategory> = {
  1: "pending",
  2: "progress",
  3: "success",
  4: "danger",
  5: "danger",
};

export function packageStatusCategory(
  id: number | null | undefined
): StatusCategory {
  return (id != null && PACKAGE_STATUS_CATEGORY[id]) || "neutral";
}

const TOUR_STATUS_CATEGORY: Record<number, StatusCategory> = {
  1: "neutral",
  2: "progress",
  3: "info",
  4: "pending",
  5: "success",
};

export function tourStatusCategory(
  id: number | null | undefined
): StatusCategory {
  return (id != null && TOUR_STATUS_CATEGORY[id]) || "neutral";
}

const ANOMALY_TYPE_CATEGORY: Record<string, StatusCategory> = {
  c_dev: "info",
  c_end: "warning",
  c_per: "danger",
  excu_temp: "warning",
  other: "neutral",
};

export function anomalyTypeCategory(
  code: string | null | undefined
): StatusCategory {
  return (code != null && ANOMALY_TYPE_CATEGORY[code]) || "neutral";
}
