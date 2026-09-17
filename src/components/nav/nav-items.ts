import {
  Building2,
  CalendarClock,
  ClipboardList,
  Crown,
  FileSpreadsheet,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  MapPinned,
  PackageSearch,
  PackageX,
  Receipt,
  ReceiptText,
  Route,
  Settings,
  Smartphone,
  TriangleAlert,
  Truck,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { config } from "@/lib/config";

export type NavBadge = "unassignedCommands";

export interface NavItem {
  to: string;
  labelKey: string;
  icon: LucideIcon;
  end?: boolean;
  adminOnly?: boolean;
  badge?: NavBadge;
}

export interface NavGroup {
  id: string;
  labelKey: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    id: "beta",
    labelKey: "nav.groups.beta",
    items: config.betaFeatures
      ? [{ to: "/app/todos", labelKey: "nav.todos", icon: ListChecks }]
      : [],
  },
  {
    id: "operations",
    labelKey: "nav.groups.operations",
    items: [
      {
        to: "/app",
        labelKey: "nav.dashboard",
        icon: LayoutDashboard,
        end: true,
      },
      {
        to: "/app/expeditions",
        labelKey: "nav.expeditions",
        icon: Truck,
        badge: "unassignedCommands",
      },
      { to: "/app/tours", labelKey: "nav.tours", icon: Route },
      {
        to: "/app/tour-configs",
        labelKey: "nav.tourConfigs",
        icon: CalendarClock,
      },
    ],
  },
  {
    id: "tracking",
    labelKey: "nav.groups.tracking",
    items: [
      { to: "/app/commands", labelKey: "nav.commands", icon: PackageSearch },
      { to: "/app/souffrance", labelKey: "nav.souffrance", icon: PackageX },
      { to: "/app/anomalies", labelKey: "nav.anomalies", icon: TriangleAlert },
    ],
  },
  {
    id: "directory",
    labelKey: "nav.groups.directory",
    items: [
      { to: "/app/pharmacies", labelKey: "nav.pharmacies", icon: Building2 },
      {
        to: "/app/pharmacy-reports",
        labelKey: "nav.pharmacyReports",
        icon: ClipboardList,
      },
      { to: "/app/zones", labelKey: "nav.zones", icon: MapPinned },
    ],
  },
  {
    id: "billing",
    labelKey: "nav.groups.billing",
    items: [
      {
        to: "/app/invoices",
        labelKey: "nav.invoices",
        icon: ReceiptText,
        adminOnly: true,
      },
      {
        to: "/app/billing-customers",
        labelKey: "nav.billingCustomers",
        icon: UsersRound,
        adminOnly: true,
      },
    ],
  },
  {
    id: "administration",
    labelKey: "nav.groups.administration",
    items: [
      { to: "/app/profiles", labelKey: "nav.profiles", icon: Users },
      {
        to: "/app/mobile-app",
        labelKey: "nav.mobileApp",
        icon: Smartphone,
      },
    ],
  },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { to: "/app/exports", labelKey: "nav.exports", icon: FileSpreadsheet },
  { to: "/app/api-tokens", labelKey: "nav.apiTokens", icon: KeyRound },
  {
    to: "/app/subscription-invoices",
    labelKey: "nav.subscriptionInvoices",
    icon: Receipt,
  },
];

export const SETTINGS_NAV_ITEM: NavItem = {
  to: "/app/settings",
  labelKey: "nav.settings",
  icon: Settings,
};

export const HYPERADMIN_NAV_ITEM: NavItem = {
  to: "/app/hyperadmin",
  labelKey: "nav.hyperadmin",
  icon: Crown,
};

export const NAV_GROUPS: NavGroup[] = GROUPS.filter(
  (group) => group.items.length > 0
);

export function visibleNavGroups(isAdmin: boolean): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => isAdmin || !item.adminOnly),
  })).filter((group) => group.items.length > 0);
}
