import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { Check, ChevronDown, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, LoadingState } from "@/components/states";
import { Pagination } from "@/components/pagination";
import { StatusBadge } from "@/components/status-badge";
import { useToast } from "@/app/toast-context";
import { ApiError, apiErrorText } from "@/lib/api-error";
import { formatDateTime } from "@/lib/date";
import type { StatusCategory } from "@/lib/colors";
import {
  EMAIL_LOGS_PAGE_SIZE,
  EMAIL_LOG_STATUSES,
  isEmailLogStatus,
  useEmailEventTypes,
  useEmailLogs,
  useRetryEmailLog,
  type EmailLog,
  type EmailLogStatus,
} from "@/features/email";

const STATUS_CATEGORIES: Record<EmailLogStatus, StatusCategory> = {
  PENDING: "neutral",
  SENDING: "progress",
  SENT: "success",
  FAILED: "danger",
};

const PAGE_PARAM = "logPage";
const STATUS_PARAM = "logStatus";
const EVENT_PARAM = "logEvent";

function isAnomalyEvent(log: EmailLog): boolean {
  return Boolean(
    log.relatedEntityId && log.eventType?.toUpperCase().startsWith("ANOMALIE")
  );
}

export function EmailLogsCard() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawStatus = searchParams.get(STATUS_PARAM) ?? "";
  const status: EmailLogStatus | "" = isEmailLogStatus(rawStatus)
    ? rawStatus
    : "";
  const eventType = searchParams.get(EVENT_PARAM) ?? "";
  const rawPage = Number(searchParams.get(PAGE_PARAM));
  const page = Number.isInteger(rawPage) && rawPage > 1 ? rawPage : 1;

  const input = {
    page: page - 1,
    size: EMAIL_LOGS_PAGE_SIZE,
    status,
    eventType,
  };
  const logsQuery = useEmailLogs(input);
  const eventTypesQuery = useEmailEventTypes();
  const retry = useRetryEmailLog();

  const eventTypes = useMemo(
    () => eventTypesQuery.data ?? [],
    [eventTypesQuery.data]
  );
  const eventLabels = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of eventTypes) map.set(entry.code, entry.label || entry.code);
    return map;
  }, [eventTypes]);

  const setParams = (patch: Record<string, string>) => {
    setSearchParams(
      (previous) => {
        const params = new URLSearchParams(previous);
        for (const [key, value] of Object.entries(patch)) {
          if (value) params.set(key, value);
          else params.delete(key);
        }
        return params;
      },
      { replace: true }
    );
  };

  const setStatus = (next: string) =>
    setParams({ [STATUS_PARAM]: next, [PAGE_PARAM]: "" });
  const setEventType = (next: string) =>
    setParams({ [EVENT_PARAM]: next, [PAGE_PARAM]: "" });
  const setPage = (next: number) =>
    setParams({ [PAGE_PARAM]: next > 1 ? String(next) : "" });

  const handleRetry = (log: EmailLog) => {
    retry.mutate(log.id, {
      onSuccess: () => toast.success(t("emailNotifications.logs.retryQueued")),
      onError: (cause) => {
        if (cause instanceof ApiError && cause.status === 404) {
          toast.warning(t("emailNotifications.logs.retryConflict"));
          return;
        }
        toast.error(
          apiErrorText(cause) ?? t("emailNotifications.logs.retryFailed")
        );
      },
    });
  };

  const data = logsQuery.data;
  const logs = data?.content ?? [];
  const hasFilters = status !== "" || eventType !== "";

  const renderContent = () => {
    if (logsQuery.isLoading) return <LoadingState />;
    if (logsQuery.isError) {
      return (
        <Alert variant="warning">
          <AlertDescription>
            {apiErrorText(logsQuery.error) ??
              t("emailNotifications.logs.errors.loadFailed")}
          </AlertDescription>
        </Alert>
      );
    }
    if (logs.length === 0) {
      return (
        <EmptyState
          message={
            hasFilters
              ? t("emailNotifications.logs.noResults")
              : t("emailNotifications.logs.empty")
          }
          className="py-10"
        />
      );
    }

    return (
      <div className="flex flex-col rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("emailNotifications.logs.columns.date")}</TableHead>
              <TableHead>
                {t("emailNotifications.logs.columns.recipient")}
              </TableHead>
              <TableHead>
                {t("emailNotifications.logs.columns.subject")}
              </TableHead>
              <TableHead>{t("emailNotifications.logs.columns.event")}</TableHead>
              <TableHead>
                {t("emailNotifications.logs.columns.status")}
              </TableHead>
              <TableHead className="text-right">
                {t("common.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {formatDateTime(log.sentAt ?? log.createdAt, i18n.language)}
                </TableCell>
                <TableCell className="max-w-48">
                  <span className="block truncate">{log.recipient}</span>
                </TableCell>
                <TableCell className="min-w-56 max-w-md">
                  <span className="block break-words">{log.subject}</span>
                  {isAnomalyEvent(log) && (
                    <Link
                      to={`/app/anomalies/${log.relatedEntityId}`}
                      className="mt-1 inline-flex min-h-6 items-center gap-1 text-xs text-primary underline-offset-2 hover:underline"
                    >
                      <ExternalLink className="size-3" />
                      {t("emailNotifications.logs.openAnomaly")}
                    </Link>
                  )}
                  {log.status === "FAILED" && log.lastError && (
                    <span className="mt-1 block break-words text-xs text-status-danger-text">
                      {log.lastError}
                    </span>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {log.eventType
                    ? (eventLabels.get(log.eventType) ?? log.eventType)
                    : ""}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    label={t(`emailNotifications.logs.status.${log.status}`)}
                    category={STATUS_CATEGORIES[log.status] ?? "neutral"}
                  />
                  {log.status === "PENDING" &&
                    log.attemptCount > 0 &&
                    log.nextRetryAt && (
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {t("emailNotifications.logs.nextRetry", {
                          date: formatDateTime(log.nextRetryAt, i18n.language),
                        })}
                      </span>
                    )}
                  {log.attemptCount > 1 && (
                    <span className="mt-1 block text-xs tabular-nums text-muted-foreground">
                      {t("emailNotifications.logs.attempts", {
                        count: log.attemptCount,
                      })}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {log.status === "FAILED" && (
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 lg:min-h-8"
                      onClick={() => handleRetry(log)}
                      disabled={retry.isPending}
                    >
                      <RefreshCw />
                      {t("emailNotifications.logs.retry")}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Pagination
          page={page}
          onPageChange={setPage}
          totalPages={data?.totalPages}
          totalElements={data?.totalElements}
          count={logs.length}
          isFetching={logsQuery.isFetching}
        />
      </div>
    );
  };

  const statusLabel = status
    ? t(`emailNotifications.logs.status.${status}`)
    : t("emailNotifications.logs.allStatuses");
  const eventLabel = eventType
    ? (eventLabels.get(eventType) ?? eventType)
    : t("emailNotifications.logs.allEvents");

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <CardTitle className="text-base">
            {t("emailNotifications.logs.title")}
          </CardTitle>
          <CardDescription>
            {t("emailNotifications.logs.subtitle")}
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                aria-label={t("emailNotifications.logs.columns.status")}
                className="min-h-11 font-normal lg:min-h-10"
              >
                {statusLabel}
                <ChevronDown className="opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                className="min-h-11 lg:min-h-9"
                onSelect={() => setStatus("")}
              >
                <Check className={status === "" ? "opacity-100" : "opacity-0"} />
                {t("emailNotifications.logs.allStatuses")}
              </DropdownMenuItem>
              {EMAIL_LOG_STATUSES.map((entry) => (
                <DropdownMenuItem
                  key={entry}
                  className="min-h-11 lg:min-h-9"
                  onSelect={() => setStatus(entry)}
                >
                  <Check
                    className={status === entry ? "opacity-100" : "opacity-0"}
                  />
                  {t(`emailNotifications.logs.status.${entry}`)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {eventTypes.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  aria-label={t("emailNotifications.logs.columns.event")}
                  className="min-h-11 font-normal lg:min-h-10"
                >
                  {eventLabel}
                  <ChevronDown className="opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  className="min-h-11 lg:min-h-9"
                  onSelect={() => setEventType("")}
                >
                  <Check
                    className={eventType === "" ? "opacity-100" : "opacity-0"}
                  />
                  {t("emailNotifications.logs.allEvents")}
                </DropdownMenuItem>
                {eventTypes.map((entry) => (
                  <DropdownMenuItem
                    key={entry.code}
                    className="min-h-11 lg:min-h-9"
                    onSelect={() => setEventType(entry.code)}
                  >
                    <Check
                      className={
                        eventType === entry.code ? "opacity-100" : "opacity-0"
                      }
                    />
                    {entry.label || entry.code}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
