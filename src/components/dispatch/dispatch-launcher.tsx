import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ExpeditionFilters } from "@/components/expeditions/expedition-filters";
import type { LngLat } from "@/components/map";
import { cn } from "@/lib/utils";
import type { CommandExpedition } from "@/features/commands";
import type { Tour } from "@/features/tours";
import { DispatchBetaBadge } from "./dispatch-beta-badge";
import { DispatchDialog } from "./dispatch-dialog";

interface DispatchLauncherProps {
  date: string;
  expeditions: CommandExpedition[];
  filters: ExpeditionFilters;
  existingTours: Tour[];
  depot: LngLat | null;
  depotLabel: string;
  className?: string;
}

export function DispatchLauncher({ className, ...props }: DispatchLauncherProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const label = t("expeditions.dispatch.openLabel");

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={cn("min-h-11 gap-2 bg-card px-3 shadow-md lg:min-h-9", className)}
        aria-label={label}
        title={label}
        onClick={() => setOpen(true)}
      >
        <Sparkles className="text-primary" />
        <span className="sm:hidden">{t("expeditions.dispatch.openShort")}</span>
        <span className="hidden sm:inline">{t("expeditions.dispatch.open")}</span>
        <DispatchBetaBadge />
      </Button>
      <DispatchDialog open={open} onOpenChange={setOpen} {...props} />
    </>
  );
}
