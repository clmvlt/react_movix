import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useAuth } from "@/app/auth-context";
import { useNotifications } from "@/app/notifications-context";
import { useWorkingDate } from "@/app/working-date-context";
import { useUnassignedCommandsCount } from "@/features/commands";
import type { NavBadge } from "@/components/nav/nav-items";
import { apiDateToDate, formatDate } from "@/lib/date";

export interface NavBadgeInfo {
  count: number;
  label: string;
}

export type NavBadges = Partial<Record<NavBadge, NavBadgeInfo>>;

export function useNavBadges(): NavBadges {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { date } = useWorkingDate();
  const { connected } = useNotifications();
  const { data: count } = useUnassignedCommandsCount(
    date,
    Boolean(user?.account),
    connected
  );

  if (!count || count <= 0) return {};
  return {
    unassignedCommands: {
      count,
      label: t("nav.badges.unassignedCommands", {
        count,
        date: formatDate(apiDateToDate(date), i18n.language),
      }),
    },
  };
}

export function navBadgesTotal(badges: NavBadges): number {
  return Object.values(badges).reduce(
    (sum, badge) => sum + (badge?.count ?? 0),
    0
  );
}

export function navItemLabel(
  label: string,
  badge: NavBadgeInfo | undefined,
  t: TFunction
): string {
  return badge ? t("nav.itemWithBadge", { label, badge: badge.label }) : label;
}
