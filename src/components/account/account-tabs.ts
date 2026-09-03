import {
  Building2,
  Euro,
  LayoutTemplate,
  Mail,
  Palette,
  Server,
  SlidersHorizontal,
  Tag,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

export interface SettingsTabDef {
  value: SettingsTab;
  labelKey: string;
  icon: LucideIcon;
  adminOnly: boolean;
}

export type SettingsTab =
  | "company"
  | "depot"
  | "labels"
  | "labelLayout"
  | "emails"
  | "smtp"
  | "options"
  | "tarifs"
  | "colors";

export const SETTINGS_TABS: SettingsTabDef[] = [
  { value: "company", labelKey: "account.tabs.company", icon: Building2, adminOnly: false },
  { value: "depot", labelKey: "account.tabs.depot", icon: Warehouse, adminOnly: true },
  { value: "labels", labelKey: "account.tabs.labels", icon: Tag, adminOnly: true },
  { value: "labelLayout", labelKey: "account.tabs.labelLayout", icon: LayoutTemplate, adminOnly: false },
  { value: "emails", labelKey: "account.tabs.emails", icon: Mail, adminOnly: true },
  { value: "smtp", labelKey: "account.tabs.smtp", icon: Server, adminOnly: true },
  { value: "options", labelKey: "account.tabs.options", icon: SlidersHorizontal, adminOnly: true },
  { value: "tarifs", labelKey: "account.tabs.tarifs", icon: Euro, adminOnly: true },
  { value: "colors", labelKey: "account.tabs.colors", icon: Palette, adminOnly: false },
];

export const DEFAULT_TAB: SettingsTab = "company";

export const ACCOUNT_TABS: SettingsTab[] = [
  "company",
  "depot",
  "labels",
  "emails",
  "smtp",
  "options",
];

export function visibleTabs(isAdmin: boolean): SettingsTabDef[] {
  return SETTINGS_TABS.filter((tab) => isAdmin || !tab.adminOnly);
}

export function parseSettingsTab(
  raw: string | null,
  isAdmin: boolean
): SettingsTab {
  const match = visibleTabs(isAdmin).find((tab) => tab.value === raw);
  return match?.value ?? DEFAULT_TAB;
}

export function isAccountTab(tab: SettingsTab): boolean {
  return ACCOUNT_TABS.includes(tab);
}
