import { ApiError } from "@/lib/api-error";
import { defaultCategoryColor } from "@/lib/colors";
import {
  dateToApiDate,
  isValidApiDate,
  isValidTimeInput,
  localOffsetIso,
  parseDate,
  toTimeInput,
} from "@/lib/date";
import type { Tour, TourUpdateInput } from "@/features/tours";

export interface TourForm {
  name: string;
  immat: string;
  color: string;
  startKm: string;
  endKm: string;
  startDay: string;
  startTime: string;
  endDay: string;
  endTime: string;
  initialDate: string;
}

export function initialTourForm(tour: Tour): TourForm {
  const start = parseDate(tour.startDate);
  const end = parseDate(tour.endDate);
  return {
    name: tour.name,
    immat: tour.immat ?? "",
    color: tour.color ?? defaultCategoryColor,
    startKm: tour.startKm?.toString() ?? "",
    endKm: tour.endKm?.toString() ?? "",
    startDay: start ? dateToApiDate(start) : "",
    startTime: start ? toTimeInput(start) : "",
    endDay: end ? dateToApiDate(end) : "",
    endTime: end ? toTimeInput(end) : "",
    initialDate: tour.initialDate ?? "",
  };
}

function toApiDateTime(day: string, time: string): string {
  if (!isValidApiDate(day)) return "";
  return localOffsetIso(day, isValidTimeInput(time) ? time : "00:00");
}

export function tourFormToUpdateInput(form: TourForm): TourUpdateInput {
  return {
    name: form.name.trim() || undefined,
    immat: form.immat.trim(),
    color: form.color,
    startKm: form.startKm === "" ? -1 : Number(form.startKm),
    endKm: form.endKm === "" ? -1 : Number(form.endKm),
    startDate: toApiDateTime(form.startDay, form.startTime),
    endDate: toApiDateTime(form.endDay, form.endTime),
    initialDate: form.initialDate || undefined,
  };
}

export function pdfErrorKey(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isEmailNotVerified) return "tours.pdfErrors.emailNotVerified";
    if (error.status === 401) return "tours.pdfErrors.unauthorized";
    if (error.status === 403) return "tours.pdfErrors.forbidden";
    if (error.status === 404) return "tours.pdfErrors.notFound";
  }
  return "tours.pdfErrors.failed";
}
