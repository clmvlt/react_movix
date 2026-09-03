import { useTranslation } from "react-i18next";
import { CalendarDays, List, Map, Menu, Route, X } from "lucide-react";
import { MockCommandRow } from "@/components/landing/mock-chrome";
import { MOCK_COMMANDS } from "@/components/landing/mock-data";
import { initialsFromLabel } from "@/lib/initials";
import { formatDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import logoUrl from "@/assets/images/logo.png";

export function MockPhone({ className }: { className?: string }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? "en";
  const items = MOCK_COMMANDS.slice(0, 6);
  const selectedCount = items.filter((item) => item.selected).length;

  return (
    <figure className={cn("mx-auto w-full max-w-[264px]", className)}>
      <div className="overflow-hidden rounded-[2rem] border-[6px] border-neutral-900 bg-background shadow-2xl">
        <div className="relative flex aspect-[9/19] flex-col" aria-hidden>
          <div className="flex h-5 shrink-0 items-center justify-center bg-card">
            <span className="h-1 w-12 rounded-full bg-neutral-200" />
          </div>

          <div className="flex h-9 shrink-0 items-center justify-between gap-2 border-b bg-card px-2.5">
            <span className="flex items-center gap-1.5">
              <img
                src={logoUrl}
                alt=""
                className="size-4 object-contain dark:brightness-0 dark:invert"
              />
              <span className="text-[11px] font-semibold tracking-tight text-foreground">
                {t("common.appName")}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="flex size-5 items-center justify-center rounded-full bg-accent text-[8px] font-medium text-accent-foreground">
                {initialsFromLabel(t("landing.mock.user"))}
              </span>
              <Menu className="size-4 text-muted-foreground" />
            </span>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-1.5 p-2">
            <span className="flex shrink-0 items-center gap-1.5 rounded-lg border bg-card px-2 py-1.5 text-[10px] text-foreground">
              <CalendarDays className="size-3 text-muted-foreground" />
              <span className="tabular-nums">{formatDate(new Date(), lang)}</span>
            </span>

            <div className="flex shrink-0 items-center gap-1 rounded-xl border bg-card p-1">
              <span className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary px-2 py-1.5 text-[10px] font-medium text-primary-foreground">
                <List className="size-3" />
                {t("common.views.list")}
              </span>
              <span className="flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-medium text-muted-foreground">
                <Map className="size-3" />
                {t("common.views.map")}
              </span>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
              {items.map((command) => (
                <MockCommandRow
                  key={command.name}
                  command={command}
                  showStatus={false}
                />
              ))}
            </div>
          </div>

          <div className="shrink-0 border-t bg-card px-2 pb-2 pt-1.5 shadow-lg">
            <div className="mb-1.5 flex items-center gap-2 px-0.5">
              <span className="min-w-0 flex-1 truncate text-[10px] font-medium text-foreground">
                {t("expeditions.selected", { count: selectedCount })}
              </span>
              <X className="size-3.5 shrink-0 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="flex flex-1 items-center justify-center gap-1 rounded-md bg-primary px-2 py-1.5 text-[10px] font-medium text-primary-foreground">
                <Route className="size-3" />
                {t("expeditions.actionsShort.assign")}
              </span>
              <span className="flex flex-1 items-center justify-center rounded-md border px-2 py-1.5 text-[10px] font-medium text-foreground">
                {t("expeditions.actionsShort.status")}
              </span>
              <span className="flex flex-1 items-center justify-center rounded-md border px-2 py-1.5 text-[10px] font-medium text-foreground">
                {t("expeditions.actionsShort.expDate")}
              </span>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="sr-only">{t("landing.mock.phoneCaption")}</figcaption>
    </figure>
  );
}
