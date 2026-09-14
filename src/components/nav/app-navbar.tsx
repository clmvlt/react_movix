import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ChevronDown,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  UserPlus,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AccountSwitcher } from "@/components/nav/account-switcher";
import { JoinCompanyDialog } from "@/components/nav/join-company-dialog";
import { BrandMark } from "@/components/brand-mark";
import { InitialsImage } from "@/components/initials-image";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { WorkingDateControl } from "@/components/working-date-control";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useIsAdmin, useIsHyperadmin } from "@/components/admin-gate";
import {
  ADMIN_NAV_ITEMS,
  HYPERADMIN_NAV_ITEM,
  SETTINGS_NAV_ITEM,
  visibleNavGroups,
} from "@/components/nav/nav-items";
import { NavCountBadge } from "@/components/nav/nav-badge";
import {
  navBadgesTotal,
  navItemLabel,
  type NavBadges,
} from "@/components/nav/use-nav-badges";
import { useAuth } from "@/app/auth-context";
import { profilFullName, useLogout } from "@/features/auth";
import { profilPictureUrl } from "@/lib/images";
import { initialsFromName } from "@/lib/initials";
import { cn } from "@/lib/utils";

function MobileNav({
  onNavigate,
  badges,
}: {
  onNavigate: () => void;
  badges: NavBadges;
}) {
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();
  const isHyperadmin = useIsHyperadmin();
  const groups = visibleNavGroups(isAdmin);
  const location = useLocation();
  const [adminOpen, setAdminOpen] = useState(() =>
    ADMIN_NAV_ITEMS.some((item) => location.pathname.startsWith(item.to))
  );

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pb-6">
        {groups.map((group) => (
          <div key={group.id} className="flex flex-col gap-1">
            <p className="px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t(group.labelKey)}
            </p>
            {group.items.map((item) => {
              const badge = item.badge ? badges[item.badge] : undefined;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  aria-label={navItemLabel(t(item.labelKey), badge, t)}
                  className={({ isActive }) =>
                    cn(
                      "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent",
                      isActive && "bg-accent text-accent-foreground"
                    )
                  }
                >
                  <item.icon className="size-5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{t(item.labelKey)}</span>
                  {badge && (
                    <NavCountBadge count={badge.count} className="ml-auto" />
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}

        {isAdmin && (
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setAdminOpen((open) => !open)}
              aria-expanded={adminOpen}
              className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <ShieldCheck className="size-5 shrink-0 text-destructive" />
              <span className="flex-1 truncate text-left">
                {t("nav.admin")}
              </span>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform",
                  adminOpen && "rotate-180"
                )}
              />
            </button>
            {adminOpen &&
              ADMIN_NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "flex min-h-11 items-center gap-3 rounded-md py-2 pl-11 pr-3 text-sm font-medium text-foreground transition-colors hover:bg-accent",
                      isActive && "bg-accent text-accent-foreground"
                    )
                  }
                >
                  <item.icon className="size-5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{t(item.labelKey)}</span>
                </NavLink>
              ))}
          </div>
        )}

        {isHyperadmin && (
          <div className="flex flex-col gap-1">
            <NavLink
              to={HYPERADMIN_NAV_ITEM.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent",
                  isActive && "bg-accent text-accent-foreground"
                )
              }
            >
              <HYPERADMIN_NAV_ITEM.icon className="size-5 shrink-0 text-muted-foreground" />
              <span className="truncate">
                {t(HYPERADMIN_NAV_ITEM.labelKey)}
              </span>
            </NavLink>
          </div>
        )}
      </div>
      <div className="shrink-0 border-t border-border px-4 py-2">
        <NavLink
          to={SETTINGS_NAV_ITEM.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent",
              isActive && "bg-accent text-accent-foreground"
            )
          }
        >
          <SETTINGS_NAV_ITEM.icon className="size-5 shrink-0 text-muted-foreground" />
          <span className="truncate">{t(SETTINGS_NAV_ITEM.labelKey)}</span>
        </NavLink>
      </div>
    </>
  );
}

export function AppNavbar({ badges }: { badges: NavBadges }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, accounts } = useAuth();
  const logout = useLogout();
  const [menuOpen, setMenuOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const multiCompany = accounts.length > 1;
  const badgeTotal = navBadgesTotal(badges);

  const fullName = profilFullName(user);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => navigate("/login", { replace: true }),
    });
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative size-11 shrink-0 lg:hidden"
              aria-label={
                badgeTotal > 0
                  ? t("nav.menuWithBadge", { count: badgeTotal })
                  : t("nav.menu")
              }
            >
              <Menu className="size-5" />
              {badgeTotal > 0 && (
                <NavCountBadge
                  count={badgeTotal}
                  className="absolute right-1 top-1.5 ring-2 ring-card"
                />
              )}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="flex w-[17rem] flex-col gap-0 p-0"
          >
            <SheetHeader className="shrink-0 border-b border-border px-4 py-4">
              <SheetTitle asChild>
                <span>
                  <BrandMark />
                </span>
              </SheetTitle>
            </SheetHeader>
            <MobileNav
              onNavigate={() => setMenuOpen(false)}
              badges={badges}
            />
            <div className="flex shrink-0 flex-col border-t border-border px-4 py-2 sm:hidden">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">
                  {t("language.label")}
                </span>
                <LanguageSwitcher className="size-11" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">
                  {t("theme.label")}
                </span>
                <ThemeSwitcher className="size-11" />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Link
          to="/app"
          className={cn(
            "flex shrink-0 items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            multiCompany && "hidden sm:flex"
          )}
        >
          <BrandMark className="hidden sm:flex" />
          {!multiCompany && <BrandMark compact className="sm:hidden" />}
        </Link>

        <AccountSwitcher onJoinCompany={() => setJoinOpen(true)} />

        <WorkingDateControl className="min-w-0" />
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <ThemeSwitcher className="hidden size-10 sm:inline-flex" />
        <LanguageSwitcher className="hidden size-10 sm:inline-flex" />
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-11 shrink-0 lg:size-10"
              aria-label={t("nav.profile")}
            >
              <InitialsImage
                src={profilPictureUrl(user?.profilPicture)}
                initials={initialsFromName(
                  user?.firstName,
                  user?.lastName,
                  user?.identifiant
                )}
                alt={fullName}
                className="size-8 rounded-full object-cover"
                fallbackClassName="bg-accent text-xs font-medium text-accent-foreground"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="truncate text-sm font-medium text-foreground">
                {fullName}
              </span>
              {user?.account?.societe && (
                <span className="truncate text-xs font-normal text-muted-foreground">
                  {user.account.societe}
                </span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/app/account">
                <UserRound className="size-4" />
                {t("nav.account")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/app/settings">
                <Settings className="size-4" />
                {t("nav.settings")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setJoinOpen(true)}>
              <UserPlus className="size-4" />
              {t("nav.joinCompany")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={handleLogout}
              disabled={logout.isPending}
            >
              <LogOut className="size-4" />
              {t("auth.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <JoinCompanyDialog open={joinOpen} onOpenChange={setJoinOpen} />
    </header>
  );
}
