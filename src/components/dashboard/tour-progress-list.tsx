import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { ColorDot } from "@/components/color-dot";
import { StatusBadge } from "@/components/status-badge";
import { StatBar } from "@/components/dashboard/stat-bar";
import type { DashboardTourProgress } from "@/features/dashboard";
import { useAuth } from "@/app/auth-context";
import { safeCategoryColor } from "@/lib/colors";
import { tourStatusCategory } from "@/lib/status";
import {
  formatDuration,
  formatRelativeDateTime,
  formatTime,
  frTimeToTimeInput,
} from "@/lib/date";

function TourFlag({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      {label}
    </span>
  );
}

export function TourProgressList({
  tours,
}: {
  tours: DashboardTourProgress[];
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { user } = useAuth();
  const estimatedDeparture = frTimeToTimeInput(
    user?.account?.defaultTourDepartureTime
  );

  return (
    <ul className="flex flex-col gap-1">
      {tours.map((tour) => {
        const done = tour.delivered + tour.notDelivered;
        const meta = [
          tour.driver?.name ?? t("dashboard.tours.noDriver"),
          t("dashboard.tours.stops", { count: tour.commandCount }),
          t("dashboard.tours.parcels", { count: tour.packagesCount }),
        ].join(" · ");

        const footer = [
          tour.departureTime
            ? t("dashboard.tours.startsAt", {
                time: tour.departureTime,
              })
            : estimatedDeparture
              ? t("dashboard.tours.startsAtEstimated", {
                  time: estimatedDeparture,
                })
              : null,
          tour.estimatedEndTime
            ? t("dashboard.tours.endsAt", {
                time: formatTime(tour.estimatedEndTime, lang),
              })
            : null,
          tour.estimateKm != null
            ? t("dashboard.tours.km", { km: Math.round(tour.estimateKm) })
            : null,
          tour.estimateMins != null ? formatDuration(tour.estimateMins) : null,
          tour.lastActivityAt
            ? formatRelativeDateTime(tour.lastActivityAt, lang)
            : null,
        ].filter(Boolean);

        return (
          <li key={tour.id}>
            <Link
              to={`/app/tours?tour=${tour.id}`}
              className="flex flex-col gap-2 rounded-lg px-2 py-3 transition-colors hover:bg-accent"
            >
              <div className="flex items-center gap-2">
                <ColorDot color={safeCategoryColor(tour.color)} size="md" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                  {tour.name}
                </span>
                {tour.status && (
                  <StatusBadge
                    label={tour.status.name}
                    category={tourStatusCategory(tour.status.id)}
                    className="hidden shrink-0 sm:inline-flex"
                  />
                )}
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              </div>

              <p className="truncate text-xs text-muted-foreground">{meta}</p>

              <div className="flex items-center gap-3">
                <StatBar
                  value={done}
                  max={tour.commandCount}
                  category={tour.notDelivered > 0 ? "warning" : "success"}
                  className="flex-1"
                />
                <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                  {done}/{tour.commandCount}
                </span>
              </div>

              {(footer.length > 0 ||
                !tour.sorted ||
                tour.routeStale ||
                !tour.driver) && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  {footer.length > 0 && (
                    <span className="truncate text-xs text-muted-foreground">
                      {footer.join(" · ")}
                    </span>
                  )}
                  {!tour.sorted && (
                    <TourFlag label={t("dashboard.tours.unsorted")} />
                  )}
                  {tour.routeStale && (
                    <TourFlag label={t("dashboard.tours.routeStale")} />
                  )}
                  {!tour.driver && (
                    <TourFlag label={t("dashboard.tours.withoutDriver")} />
                  )}
                </div>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
