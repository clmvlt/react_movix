import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronDown, ShieldCheck } from "lucide-react";
import { useIsAdmin, useIsHyperadmin } from "@/components/admin-gate";
import {
  ADMIN_NAV_ITEMS,
  HYPERADMIN_NAV_ITEM,
  SETTINGS_NAV_ITEM,
  visibleNavGroups,
} from "@/components/nav/nav-items";
import { NavCountBadge } from "@/components/nav/nav-badge";
import {
  navItemLabel,
  type NavBadges,
} from "@/components/nav/use-nav-badges";
import { useAuth } from "@/app/auth-context";
import { initialsFromLabel } from "@/lib/initials";
import { cn } from "@/lib/utils";

const LABEL_CLASS =
  "min-w-0 truncate whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-has-[:focus-visible]:opacity-100";

const SCROLL_CLASS =
  "flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-2 py-2 [scrollbar-color:rgb(255_255_255/0.3)_transparent] [scrollbar-width:none] group-hover:[scrollbar-width:thin] group-has-[:focus-visible]:[scrollbar-width:thin] [&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar]:w-1.5 group-hover:[&::-webkit-scrollbar]:block group-has-[:focus-visible]:[&::-webkit-scrollbar]:block [&::-webkit-scrollbar-thumb]:border-0 [&::-webkit-scrollbar-thumb]:bg-white/30 [&::-webkit-scrollbar-thumb:hover]:bg-white/50";

const ITEM_CLASS =
  "flex h-10 shrink-0 items-center gap-3 rounded-md px-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/60";

export function AppSideRail({ badges }: { badges: NavBadges }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const isHyperadmin = useIsHyperadmin();
  const groups = visibleNavGroups(isAdmin);
  const company = user?.account?.societe ?? t("common.appName");
  const location = useLocation();
  const [adminOpen, setAdminOpen] = useState(() =>
    ADMIN_NAV_ITEMS.some((item) => location.pathname.startsWith(item.to))
  );

  return (
    <div className="relative hidden w-14 shrink-0 lg:block">
      <nav
        aria-label={t("nav.menu")}
        className="group absolute inset-y-0 left-0 z-30 flex w-14 flex-col overflow-hidden bg-brand-600 transition-[width] duration-200 ease-out hover:w-60 hover:shadow-xl has-[:focus-visible]:w-60 has-[:focus-visible]:shadow-xl"
      >
        <NavLink
          to="/app"
          end
          aria-label={company}
          title={company}
          className="flex h-14 shrink-0 items-center gap-3 border-b border-white/10 px-2"
        >
          <span className="flex size-10 shrink-0 items-center justify-center">
            <span className="flex size-9 items-center justify-center rounded-md bg-white/15 text-xs font-semibold text-white">
              {initialsFromLabel(company)}
            </span>
          </span>
          <span
            className={cn(
              LABEL_CLASS,
              "text-sm font-semibold tracking-tight text-white"
            )}
          >
            {company}
          </span>
        </NavLink>

        <div className={SCROLL_CLASS}>
          {groups.map((group, groupIndex) => (
            <div
              key={group.id}
              className={cn(
                "flex flex-col gap-1",
                groupIndex > 0 && "mt-2 border-t border-white/10 pt-2"
              )}
            >
              {group.items.map((item) => {
                const badge = item.badge ? badges[item.badge] : undefined;
                const label = navItemLabel(t(item.labelKey), badge, t);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    title={label}
                    aria-label={label}
                    className={({ isActive }) =>
                      cn(ITEM_CLASS, isActive && "bg-white/15 text-white")
                    }
                  >
                    <span className="relative flex shrink-0">
                      <item.icon className="size-5 shrink-0" />
                      {badge && (
                        <NavCountBadge
                          count={badge.count}
                          className="absolute -right-2.5 -top-2 ring-2 ring-brand-600"
                        />
                      )}
                    </span>
                    <span className={LABEL_CLASS}>{t(item.labelKey)}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}

          {isAdmin && (
            <div className="mt-2 flex flex-col gap-1 border-t border-white/10 pt-2">
              <button
                type="button"
                onClick={() => setAdminOpen((open) => !open)}
                aria-expanded={adminOpen}
                title={t("nav.admin")}
                aria-label={t("nav.admin")}
                className={ITEM_CLASS}
              >
                <ShieldCheck className="size-5 shrink-0 text-status-danger-bg dark:text-white/70" />
                <span className={cn(LABEL_CLASS, "flex-1 text-left")}>
                  {t("nav.admin")}
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 opacity-0 transition-[opacity,transform] duration-150 group-hover:opacity-100 group-has-[:focus-visible]:opacity-100",
                    adminOpen && "rotate-180"
                  )}
                />
              </button>
              {adminOpen &&
                ADMIN_NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    title={t(item.labelKey)}
                    aria-label={t(item.labelKey)}
                    className={({ isActive }) =>
                      cn(ITEM_CLASS, isActive && "bg-white/15 text-white")
                    }
                  >
                    <item.icon className="size-5 shrink-0" />
                    <span className={LABEL_CLASS}>{t(item.labelKey)}</span>
                  </NavLink>
                ))}
            </div>
          )}

          {isHyperadmin && (
            <div className="mt-2 flex flex-col border-t border-white/10 pt-2">
              <NavLink
                to={HYPERADMIN_NAV_ITEM.to}
                title={t(HYPERADMIN_NAV_ITEM.labelKey)}
                aria-label={t(HYPERADMIN_NAV_ITEM.labelKey)}
                className={({ isActive }) =>
                  cn(ITEM_CLASS, isActive && "bg-white/15 text-white")
                }
              >
                <HYPERADMIN_NAV_ITEM.icon className="size-5 shrink-0 text-status-warning-bg dark:text-white/70" />
                <span className={LABEL_CLASS}>
                  {t(HYPERADMIN_NAV_ITEM.labelKey)}
                </span>
              </NavLink>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-white/10 px-2 py-2">
          <NavLink
            to={SETTINGS_NAV_ITEM.to}
            title={t(SETTINGS_NAV_ITEM.labelKey)}
            aria-label={t(SETTINGS_NAV_ITEM.labelKey)}
            className={({ isActive }) =>
              cn(ITEM_CLASS, isActive && "bg-white/15 text-white")
            }
          >
            <SETTINGS_NAV_ITEM.icon className="size-5 shrink-0" />
            <span className={LABEL_CLASS}>{t(SETTINGS_NAV_ITEM.labelKey)}</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
