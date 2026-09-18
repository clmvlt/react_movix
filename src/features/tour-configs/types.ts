import type { ClientRef } from "@/features/clients/types";

export const TOUR_CONFIG_NAME_MAX = 100;
export const DEFAULT_TOUR_HOUR = "08:00";

export const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

export type TourRecurrence = Record<Weekday, boolean>;

export const EMPTY_RECURRENCE: TourRecurrence = {
  monday: false,
  tuesday: false,
  wednesday: false,
  thursday: false,
  friday: false,
  saturday: false,
  sunday: false,
};

export const WORKDAYS: Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
];

export interface TourConfigZoneRef {
  id: string;
  name: string;
}

export interface TourConfigProfilRef {
  id: string;
  identifiant?: string | null;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  isActive?: boolean;
  isAdmin?: boolean;
}

export interface TourConfigAccountRef {
  id: string;
  societe?: string;
  address1?: string;
  address2?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  isActive?: boolean;
}

export interface TourConfig {
  id: string;
  account?: TourConfigAccountRef;
  tourName: string;
  tourColor?: string | null;
  zone?: TourConfigZoneRef | null;
  profil?: TourConfigProfilRef | null;
  recurrence?: Partial<TourRecurrence> | null;
  tourHour?: string | null;
  client?: ClientRef | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TourConfigCreateInput {
  tourName: string;
  tourColor?: string;
  zone?: { id: string };
  profil?: { id: string };
  recurrence: TourRecurrence;
  tourHour?: string;
  clientId?: string;
}

export interface TourConfigUpdateInput
  extends Partial<TourConfigCreateInput> {
  clearClient?: boolean;
}

export function toRecurrence(
  value: Partial<TourRecurrence> | null | undefined
): TourRecurrence {
  const result = { ...EMPTY_RECURRENCE };
  if (!value) return result;
  for (const day of WEEKDAYS) {
    result[day] = value[day] === true;
  }
  return result;
}

export function activeWeekdays(recurrence: TourRecurrence): Weekday[] {
  return WEEKDAYS.filter((day) => recurrence[day]);
}

export function isEveryDay(recurrence: TourRecurrence): boolean {
  return WEEKDAYS.every((day) => recurrence[day]);
}

export function isWorkdaysOnly(recurrence: TourRecurrence): boolean {
  return (
    WORKDAYS.every((day) => recurrence[day]) &&
    !recurrence.saturday &&
    !recurrence.sunday
  );
}
