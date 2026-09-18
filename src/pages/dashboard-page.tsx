import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  BarChart3,
  CircleSlash,
  FileSpreadsheet,
  PackageSearch,
  Plus,
  Route,
  Search,
  Truck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { KpiCard } from "@/components/dashboard/kpi-card";
import {
  AttentionList,
  type AttentionItem,
} from "@/components/dashboard/attention-list";
import { TourProgressList } from "@/components/dashboard/tour-progress-list";
import { TrendBars } from "@/components/dashboard/trend-bars";
import { useAuth } from "@/app/auth-context";
import { useWorkingDate } from "@/app/working-date-context";
import { profilFullName } from "@/features/auth";
import { useDashboardSummary, type DashboardSummary } from "@/features/dashboard";
import { useStatsByDay, type StatsFilters } from "@/features/stats";
import type { StatusCategory } from "@/lib/colors";
import { addDays, apiDateToDate, formatDate, formatTime } from "@/lib/date";

const TREND_DAYS = 7;

interface AttentionSource {
  id: string;
  count: number;
  to: string;
  category: StatusCategory;
}

function attentionSources(summary: DashboardSummary): AttentionSource[] {
  const { commands, tours, attention } = summary;
  const otherReports = Math.max(
    0,
    attention.pharmacyReportsPending - attention.pharmacyReportsInvalidGeocoding
  );

  return [
    {
      id: "unassigned",
      count: commands.unassigned,
      to: "/app/expeditions",
      category: "warning",
    },
    {
      id: "withoutCoordinates",
      count: commands.withoutCoordinates,
      to: "/app/expeditions",
      category: "danger",
    },
    {
      id: "unsortedTours",
      count: tours.unsorted,
      to: "/app/tours",
      category: "warning",
    },
    {
      id: "routeStaleTours",
      count: tours.routeStale,
      to: "/app/tours",
      category: "warning",
    },
    {
      id: "toursWithoutDriver",
      count: tours.withoutDriver,
      to: "/app/tours",
      category: "pending",
    },
    {
      id: "anomalies",
      count: attention.anomaliesOnDate,
      to: "/app/anomalies",
      category: "danger",
    },
    {
      id: "souffrance",
      count: attention.souffranceTotal,
      to: "/app/souffrance",
      category: "warning",
    },
    {
      id: "invalidGeocoding",
      count: attention.pharmacyReportsInvalidGeocoding,
      to: "/app/client-reports",
      category: "warning",
    },
    {
      id: "clientReports",
      count: otherReports,
      to: "/app/client-reports",
      category: "info",
    },
    {
      id: "newClients",
      count: commands.newPharmacies,
      to: "/app/clients?type=PHARMACY",
      category: "info",
    },
    {
      id: "unpaidSubscriptionInvoices",
      count: attention.unpaidSubscriptionInvoices?.count ?? 0,
      to: "/app/subscription-invoices",
      category: "pending",
    },
  ];
}

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { user } = useAuth();
  const { date, isToday } = useWorkingDate();

  const summaryQuery = useDashboardSummary(date);
  const summary = summaryQuery.data;

  const trendFilters = useMemo<StatsFilters>(
    () => ({ startDate: addDays(date, -(TREND_DAYS - 1)), endDate: date }),
    [date]
  );
  const trendQuery = useStatsByDay(trendFilters);
  const trendDays = trendQuery.data?.days ?? [];

  const attentionItems: AttentionItem[] = summary
    ? attentionSources(summary)
        .filter((source) => source.count > 0)
        .map((source) => ({
          ...source,
          label: t(`dashboard.attention.${source.id}`, {
            count: source.count,
          }),
        }))
    : [];

  const account = user?.account;
  const missingDepot =
    Boolean(account) && (account?.latitude == null || account?.longitude == null);

  const trendTotal = trendDays.reduce((sum, day) => sum + day.totalCommands, 0);
  const trendDelivered = trendDays.reduce(
    (sum, day) => sum + day.deliveredCommands,
    0
  );
  const trendRate =
    trendTotal > 0 ? Math.round((trendDelivered / trendTotal) * 100) : 0;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t("dashboard.welcome", { name: profilFullName(user) })}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("dashboard.dayOf", {
            date: formatDate(apiDateToDate(date), lang),
          })}
          {isToday && summary?.generatedAt && (
            <>
              {" · "}
              {t("dashboard.updatedAt", {
                time: formatTime(summary.generatedAt, lang),
              })}
            </>
          )}
        </p>
      </div>

      {missingDepot && (
        <Alert variant="warning" className="flex flex-col gap-3">
          <AlertTriangle />
          <div>
            <AlertTitle>{t("dashboard.depotAlert.title")}</AlertTitle>
            <AlertDescription>
              {t("dashboard.depotAlert.description")}
            </AlertDescription>
          </div>
          <Button asChild variant="outline" size="sm" className="w-fit">
            <Link to="/app/settings">{t("dashboard.depotAlert.action")}</Link>
          </Button>
        </Alert>
      )}

      {summaryQuery.isPending && <LoadingState />}

      {summaryQuery.isError && (
        <ErrorState
          error={summaryQuery.error}
          retrying={summaryQuery.isFetching}
          onRetry={() => void summaryQuery.refetch()}
        />
      )}

      {summary && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <KpiCard
              to="/app/expeditions"
              icon={Truck}
              label={t("dashboard.kpi.commands")}
              value={String(summary.commands.total)}
              hint={t("dashboard.kpi.commandsHint", {
                parcels: summary.packages.total,
                weight: Math.round(summary.packages.totalWeight),
              })}
            />
            <KpiCard
              to="/app/expeditions"
              icon={CircleSlash}
              label={t("dashboard.kpi.unassigned")}
              value={String(summary.commands.unassigned)}
              tone={summary.commands.unassigned > 0 ? "warning" : undefined}
              hint={t("dashboard.kpi.unassignedHint", {
                assigned: summary.commands.assigned,
              })}
            />
            <KpiCard
              to="/app/tours"
              icon={Route}
              label={t("dashboard.kpi.tours")}
              value={String(summary.tours.total)}
              hint={t("dashboard.kpi.toursHint", {
                closed: summary.tours.closed,
                km: Math.round(summary.tours.estimateKm),
              })}
            />
            <KpiCard
              to="/app/exports"
              icon={BarChart3}
              label={t("dashboard.kpi.deliveryRate")}
              value={`${Math.round(summary.commands.deliveryRate)}%`}
              bar={{
                value: summary.commands.delivered,
                max: summary.commands.total,
              }}
              hint={t("dashboard.kpi.deliveryRateHint", {
                delivered: summary.commands.delivered,
                notDelivered: summary.commands.notDelivered,
              })}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Card className="flex flex-col xl:order-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {t("dashboard.attention.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col px-4 pb-4">
                <AttentionList items={attentionItems} />
              </CardContent>
            </Card>

            <Card className="flex flex-col xl:order-1 xl:col-span-2">
              <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
                <CardTitle className="text-base">
                  {t("dashboard.tours.title")}
                </CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/app/tours">{t("dashboard.tours.seeAll")}</Link>
                </Button>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col px-4 pb-4">
                {summary.tourProgress.length === 0 ? (
                  <EmptyState
                    message={t("dashboard.tours.empty")}
                    icon={<Route className="size-8" />}
                    className="flex-1 py-8"
                  />
                ) : (
                  <TourProgressList tours={summary.tourProgress} />
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {!trendQuery.isError && (
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
            <div className="min-w-0">
              <CardTitle className="text-base">
                {t("dashboard.trend.title", { days: TREND_DAYS })}
              </CardTitle>
              {trendDays.length > 0 && (
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {t("dashboard.trend.summary", {
                    total: trendTotal,
                    rate: trendRate,
                  })}
                </p>
              )}
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/app/exports">{t("dashboard.trend.seeStats")}</Link>
            </Button>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {trendQuery.isPending ? (
              <LoadingState />
            ) : (
              <TrendBars days={trendDays} currentDate={date} />
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        <Button asChild className="min-h-11 lg:min-h-10">
          <Link to="/app/commands/new">
            <Plus className="size-4" />
            {t("dashboard.actions.newCommand")}
          </Link>
        </Button>
        <Button asChild variant="outline" className="min-h-11 lg:min-h-10">
          <Link to="/app/commands">
            <Search className="size-4" />
            {t("dashboard.actions.searchCommand")}
          </Link>
        </Button>
        <Button asChild variant="outline" className="min-h-11 lg:min-h-10">
          <Link to="/app/souffrance">
            <PackageSearch className="size-4" />
            {t("dashboard.actions.souffrance")}
          </Link>
        </Button>
        <Button asChild variant="outline" className="min-h-11 lg:min-h-10">
          <Link to="/app/exports">
            <FileSpreadsheet className="size-4" />
            {t("dashboard.actions.exports")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
