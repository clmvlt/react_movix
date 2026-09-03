import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  Clock,
  GripVertical,
  Hourglass,
  MapPin,
  Redo2,
  RotateCcw,
  Route as RouteIcon,
  Save,
  Undo2,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { AppFrame } from "@/components/landing/app-frame";
import { MockMap } from "@/components/landing/mock-map";
import {
  MockCheckbox,
  MockRail,
  MockTopbar,
} from "@/components/landing/mock-chrome";
import {
  DEPOT,
  MOCK_STOPS,
  ORDERED_PINS,
  ROUTE_NORTH_LOOP,
  TOUR_COLORS,
} from "@/components/landing/mock-data";
import { formatDuration } from "@/lib/date";
import { formatWindowBadge } from "@/lib/delivery-window";
import { cn } from "@/lib/utils";

const WINDOW_TONES = {
  success: {
    icon: CircleCheck,
    className: "bg-status-success-bg text-status-success-text",
  },
  warning: {
    icon: Hourglass,
    className: "bg-status-warning-bg text-status-warning-text",
  },
} as const;

function MockStatChip({ icon: Icon, value }: { icon: LucideIcon; value: string }) {
  return (
    <span className="flex shrink-0 items-center gap-1 rounded-md border bg-card px-1.5 py-0.5 text-[9px] font-semibold tabular-nums text-foreground">
      <Icon className="size-2.5 shrink-0 text-muted-foreground" />
      {value}
    </span>
  );
}

export function MockTourOrder({ className }: { className?: string }) {
  const { t } = useTranslation();

  return (
    <AppFrame
      url={t("landing.mock.urlTourOrder")}
      caption={t("landing.mock.tourOrderCaption")}
      className={className}
    >
      <div className="flex aspect-[4/5] w-full overflow-hidden sm:aspect-[16/10]">
        <MockRail activeIndex={2} />
        <div className="flex min-w-0 flex-1 flex-col">
          <MockTopbar showDate={false} />
          <div className="flex min-h-0 flex-1 flex-col gap-2 p-2.5">
            <div className="flex shrink-0 flex-wrap items-center gap-1.5">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-md border bg-card">
                <ArrowLeft className="size-2.5 text-foreground" />
              </span>
              <span
                className="size-2 shrink-0 rounded-full border border-border"
                style={{ backgroundColor: TOUR_COLORS.north }}
              />
              <span className="truncate text-[11px] font-semibold text-foreground">
                {t("landing.mock.tourName")}
              </span>
              <span className="hidden items-center gap-1 md:flex">
                <MockStatChip
                  icon={MapPin}
                  value={t("tours.order.stops", { count: MOCK_STOPS.length })}
                />
                <MockStatChip
                  icon={RouteIcon}
                  value={t("tours.order.distance", { value: 42 })}
                />
                <MockStatChip icon={Clock} value={formatDuration(146)} />
              </span>
              <span className="shrink-0 rounded-md border px-1.5 py-0.5 text-[8px] font-medium text-foreground">
                {t("tours.order.toSort")}
              </span>
              <span className="ml-auto flex shrink-0 items-center gap-1">
                <span className="flex h-5 items-center gap-1 rounded-md border bg-card px-1.5 text-[9px] font-medium text-foreground">
                  <RotateCcw className="size-2.5" />
                  <span className="hidden lg:inline">
                    {t("tours.order.reset")}
                  </span>
                </span>
                <span className="flex h-5 items-center gap-1 rounded-md bg-primary px-1.5 text-[9px] font-medium text-primary-foreground">
                  <Save className="size-2.5" />
                  {t("tours.order.save")}
                </span>
              </span>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-1.5">
              <span className="flex h-5 items-center gap-1 rounded-md bg-primary px-1.5 text-[9px] font-medium text-primary-foreground">
                <Wand2 className="size-2.5" />
                {t("tours.order.autoSort")}
              </span>
              <span className="flex h-5 items-center gap-1 rounded-md border bg-card px-1.5 text-[9px] font-medium text-foreground">
                <ArrowLeftRight className="size-2.5" />
                <span className="hidden lg:inline">
                  {t("tours.order.reverse")}
                </span>
              </span>
              <span className="flex size-5 items-center justify-center rounded-md border bg-card text-muted-foreground">
                <Undo2 className="size-2.5" />
              </span>
              <span className="flex size-5 items-center justify-center rounded-md border bg-card text-muted-foreground">
                <Redo2 className="size-2.5" />
              </span>
              <span className="ml-auto flex shrink-0 items-center gap-1.5">
                <span className="hidden text-[9px] text-muted-foreground lg:inline">
                  {t("tours.order.departureTime")}
                </span>
                <span className="flex h-5 items-center gap-1 rounded-md border bg-card px-1.5 text-[9px] font-medium tabular-nums text-foreground">
                  <Clock className="size-2.5 text-muted-foreground lg:hidden" />
                  08:00
                </span>
                <span className="flex h-5 items-center gap-1 rounded-md border bg-card px-1.5 text-[9px] text-muted-foreground">
                  <ArrowRight className="size-2.5" />
                  <span className="hidden md:inline">
                    {t("tours.order.estimatedReturn")}
                  </span>
                  <span className="font-semibold tabular-nums text-foreground">
                    10:26
                  </span>
                </span>
              </span>
            </div>

            <div className="flex min-h-0 flex-1 gap-2.5">
              <div className="flex w-full min-w-0 shrink-0 flex-col overflow-hidden rounded-lg border sm:w-[52%]">
                <div className="flex h-6 shrink-0 items-center gap-1.5 border-b px-1.5">
                  <MockCheckbox />
                  <span className="min-w-0 flex-1 truncate text-[10px] font-semibold text-foreground">
                    {t("tours.order.listTitle")}
                  </span>
                  <span className="shrink-0 text-[8px] text-muted-foreground">
                    {t("tours.order.unsaved")}
                  </span>
                </div>
                <div className="min-h-0 flex-1 overflow-hidden">
                  {MOCK_STOPS.map((stop) => {
                    const tone = stop.window
                      ? WINDOW_TONES[stop.window.tone]
                      : null;
                    const WindowIcon = tone?.icon;
                    return (
                      <div
                        key={stop.order}
                        className={cn(
                          "flex h-6.5 items-center gap-1 border-b px-1.5 last:border-b-0",
                          stop.selected && "bg-primary/10"
                        )}
                      >
                        <MockCheckbox checked={stop.selected} />
                        <GripVertical className="hidden size-2.5 shrink-0 text-muted-foreground sm:block" />
                        <span
                          className="flex size-4 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white"
                          style={{ backgroundColor: TOUR_COLORS.north }}
                        >
                          {stop.order}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[10px]">
                          <span className="font-medium text-foreground">
                            {stop.name}
                          </span>
                          <span className="text-muted-foreground">
                            {" "}
                            {stop.city}
                          </span>
                        </span>
                        {stop.window && tone && WindowIcon && (
                          <span
                            className={cn(
                              "flex shrink-0 items-center gap-0.5 rounded px-1 py-px text-[8px] font-medium tabular-nums",
                              tone.className
                            )}
                          >
                            <WindowIcon className="size-2 shrink-0" />
                            <span className="lg:hidden xl:inline">
                              {formatWindowBadge(
                                stop.window.start ?? null,
                                stop.window.end ?? null,
                                t
                              )}
                            </span>
                          </span>
                        )}
                        <span className="shrink-0 rounded bg-muted px-1 py-px text-[9px] font-medium tabular-nums text-foreground">
                          {stop.eta}
                        </span>
                        <span className="flex shrink-0 flex-col items-center text-muted-foreground">
                          <ChevronUp className="size-2.5" />
                          <ChevronDown className="size-2.5" />
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="hidden min-w-0 flex-1 overflow-hidden rounded-lg border sm:block">
                <MockMap
                  className="size-full"
                  pins={ORDERED_PINS}
                  routes={[
                    { points: ROUTE_NORTH_LOOP, color: TOUR_COLORS.north },
                  ]}
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
