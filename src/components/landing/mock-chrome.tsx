import { useTranslation } from "react-i18next";
import { Bell, Check, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { NAV_GROUPS } from "@/components/nav/nav-items";
import { StatusBadge } from "@/components/status-badge";
import { initialsFromLabel } from "@/lib/initials";
import { formatDate } from "@/lib/date";
import type { StatusCategory } from "@/lib/colors";
import { cn } from "@/lib/utils";
import logoUrl from "@/assets/images/logo.png";
import type { MockCommand } from "@/components/landing/mock-data";

const RAIL_ITEMS = NAV_GROUPS.flatMap((group) => group.items).slice(0, 8);

const STATUS_MAP: Record<
  MockCommand["statusKey"],
  { labelKey: string; category: StatusCategory }
> = {
  delivered: { labelKey: "landing.mock.status.delivered", category: "success" },
  loaded: { labelKey: "landing.mock.status.loaded", category: "progress" },
  toDeliver: { labelKey: "landing.mock.status.toDeliver", category: "pending" },
  preparing: { labelKey: "landing.mock.status.preparing", category: "neutral" },
};

export function MockRail({ activeIndex = 1 }: { activeIndex?: number }) {
  const { t } = useTranslation();
  const company = t("landing.mock.company");

  return (
    <div className="hidden w-10 shrink-0 flex-col items-center overflow-hidden bg-brand-600 sm:flex">
      <div className="flex h-9 w-full shrink-0 items-center justify-center border-b border-white/10">
        <span className="flex size-6 items-center justify-center rounded-md bg-white/15 text-[8px] font-semibold text-white">
          {initialsFromLabel(company)}
        </span>
      </div>
      <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-0.5 overflow-hidden py-1.5">
        {RAIL_ITEMS.map((item, index) => (
          <span
            key={item.to}
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-md text-white/70",
              index === activeIndex && "bg-white/15 text-white"
            )}
          >
            <item.icon className="size-3" />
          </span>
        ))}
      </div>
    </div>
  );
}

export function MockTopbar({ showDate = true }: { showDate?: boolean }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? "en";

  return (
    <div className="flex h-9 shrink-0 items-center justify-between gap-3 border-b bg-card px-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex shrink-0 items-center gap-1.5">
          <img
            src={logoUrl}
            alt=""
            className="size-4 object-contain dark:brightness-0 dark:invert"
          />
          <span className="text-[11px] font-semibold tracking-tight text-foreground">
            {t("common.appName")}
          </span>
        </span>
        {showDate && (
          <span className="hidden items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] text-foreground md:flex">
            <ChevronLeft className="size-2.5 text-muted-foreground" />
            <span className="tabular-nums">{formatDate(new Date(), lang)}</span>
            <ChevronRight className="size-2.5 text-muted-foreground" />
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="relative flex size-5 items-center justify-center text-muted-foreground">
          <Bell className="size-3.5" />
          <span className="absolute -right-0.5 -top-0.5 flex size-2.5 items-center justify-center rounded-full bg-destructive text-[6px] font-bold text-destructive-foreground">
            3
          </span>
        </span>
        <span className="flex size-5 items-center justify-center rounded-full bg-accent text-[8px] font-medium text-accent-foreground">
          {initialsFromLabel(t("landing.mock.user"))}
        </span>
      </div>
    </div>
  );
}

export function MockSearch({ placeholder }: { placeholder: string }) {
  return (
    <span className="flex h-6 min-w-0 flex-1 items-center gap-1.5 rounded-md border bg-card px-2 text-[10px] text-muted-foreground">
      <Search className="size-3 shrink-0" />
      <span className="truncate">{placeholder}</span>
    </span>
  );
}

export function MockCheckbox({ checked }: { checked?: boolean }) {
  return (
    <span
      className={cn(
        "flex size-3 shrink-0 items-center justify-center rounded-[3px] border",
        checked ? "border-primary bg-primary" : "border-input bg-card"
      )}
    >
      {checked && <Check className="size-2 text-primary-foreground" />}
    </span>
  );
}

export function MockCommandRow({
  command,
  showStatus = true,
}: {
  command: MockCommand;
  showStatus?: boolean;
}) {
  const { t } = useTranslation();
  const status = STATUS_MAP[command.statusKey];

  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 rounded-lg border bg-card px-2 py-1.5",
        command.selected && "border-primary bg-accent/50"
      )}
    >
      <div className="flex items-center gap-1.5">
        <MockCheckbox checked={command.selected} />
        {command.tourColor && (
          <span
            className="size-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: command.tourColor }}
          />
        )}
        <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-foreground">
          {command.name}
        </span>
        {command.isNew && (
          <span className="shrink-0 rounded-full bg-primary px-1.5 text-[8px] font-medium uppercase leading-4 text-primary-foreground">
            {t("commands.newPharmacy")}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="min-w-0 flex-1 truncate text-[10px] text-muted-foreground">
          {command.location} · {command.packages} {t("expeditions.packages")}
        </span>
        {showStatus && (
          <StatusBadge
            label={t(status.labelKey)}
            category={status.category}
            className="shrink-0 px-1.5 py-0 text-[9px]"
          />
        )}
      </div>
    </div>
  );
}
