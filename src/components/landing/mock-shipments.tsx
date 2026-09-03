import { useTranslation } from "react-i18next";
import { Layers, Spline, Truck, X } from "lucide-react";
import { AppFrame } from "@/components/landing/app-frame";
import { MockMap } from "@/components/landing/mock-map";
import {
  MockCommandRow,
  MockRail,
  MockSearch,
  MockTopbar,
} from "@/components/landing/mock-chrome";
import {
  ALL_ROUTES,
  DEPOT,
  MOCK_COMMANDS,
  SCATTER_PINS,
} from "@/components/landing/mock-data";
import { cn } from "@/lib/utils";

export function MockShipments({ className }: { className?: string }) {
  const { t } = useTranslation();
  const selectedCount = MOCK_COMMANDS.filter((item) => item.selected).length;

  return (
    <AppFrame
      url={t("landing.mock.urlShipments")}
      caption={t("landing.mock.shipmentsCaption")}
      className={className}
    >
      <div className="flex aspect-[16/10] w-full overflow-hidden lg:aspect-[16/9]">
        <MockRail activeIndex={1} />
        <div className="flex min-w-0 flex-1 flex-col">
          <MockTopbar />
          <div className="flex min-h-0 flex-1 flex-col gap-2 p-2.5">
            <div className="flex shrink-0 items-center gap-2">
              <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-foreground">
                <Truck className="size-3.5 text-muted-foreground" />
                {t("nav.expeditions")}
              </span>
              <MockSearch placeholder={t("common.search")} />
            </div>

            <div className="flex min-h-0 flex-1 gap-2.5">
              <div className="flex w-[40%] min-w-0 shrink-0 flex-col gap-1.5">
                <div className="flex h-7 shrink-0 items-center gap-1.5 rounded-lg border bg-card px-1.5">
                  <span className="flex min-w-0 flex-1 items-center gap-1.5">
                    <span className="truncate text-[10px] font-medium text-foreground">
                      {t("expeditions.selected", { count: selectedCount })}
                    </span>
                    <X className="size-3 shrink-0 text-muted-foreground" />
                  </span>
                  <span className="h-3 w-px shrink-0 bg-border" />
                  <span className="shrink-0 rounded-md bg-primary px-1.5 py-0.5 text-[9px] font-medium text-primary-foreground">
                    {t("tours.assign")}
                  </span>
                  <span className="h-3 w-px shrink-0 bg-border" />
                  <span className="flex size-4 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground">
                    <Layers className="size-2.5" />
                  </span>
                  <span className="flex size-4 shrink-0 items-center justify-center rounded border text-muted-foreground">
                    <Spline className="size-2.5" />
                  </span>
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
                  {MOCK_COMMANDS.map((command) => (
                    <MockCommandRow key={command.name} command={command} />
                  ))}
                </div>
              </div>

              <div className="min-w-0 flex-1 overflow-hidden rounded-lg border">
                <MockMap
                  className={cn("size-full")}
                  pins={SCATTER_PINS}
                  routes={ALL_ROUTES}
                  depot={DEPOT}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppFrame>
  );
}
