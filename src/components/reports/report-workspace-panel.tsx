import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Building2, MapPinOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ErrorState, LoadingState } from "@/components/states";
import { ReportSection } from "@/components/reports/report-section";
import { ReportPhotosSection } from "@/components/reports/report-photos-section";
import { ReportClientInfoSection } from "@/components/reports/report-client-info-section";
import { ReportPositionEditor } from "@/components/reports/report-position-editor";
import { ReportDeleteDialog } from "@/components/reports/report-delete-dialog";
import { DeletedProfilBadge } from "@/components/deleted-profil-badge";
import { ApiError } from "@/lib/api-error";
import { formatDateTime } from "@/lib/date";
import { clientLabel, useClient } from "@/features/clients";
import { useIsAdmin } from "@/components/admin-gate";
import type { ClientReport } from "@/features/client-reports";

interface ReportWorkspacePanelProps {
  report: ClientReport;
  onDirtyChange: (dirty: boolean) => void;
  onDeleted: () => void;
  onOpenClient: (clientId: string) => void;
}

export function ReportWorkspacePanel({
  report,
  onDirtyChange,
  onDeleted,
  onOpenClient,
}: ReportWorkspacePanelProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? "en";

  const isAdmin = useIsAdmin();
  const clientId = report.client?.id ?? null;
  const clientQuery = useClient(clientId);
  const client = clientQuery.data;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dirtyParts, setDirtyParts] = useState({
    info: false,
    position: false,
  });

  useEffect(() => {
    onDirtyChange(dirtyParts.info || dirtyParts.position);
  }, [dirtyParts, onDirtyChange]);

  const setInfoDirty = useCallback(
    (dirty: boolean) =>
      setDirtyParts((prev) =>
        prev.info === dirty ? prev : { ...prev, info: dirty }
      ),
    []
  );
  const setPositionDirty = useCallback(
    (dirty: boolean) =>
      setDirtyParts((prev) =>
        prev.position === dirty ? prev : { ...prev, position: dirty }
      ),
    []
  );

  const clientGone =
    clientQuery.isError &&
    clientQuery.error instanceof ApiError &&
    clientQuery.error.status === 404;

  const clientName =
    (client ? clientLabel(client) : null) ??
    (report.client ? clientLabel(report.client) : null) ??
    t("clientReports.noPharmacy");
  const location = [
    client?.postalCode ?? report.client?.postalCode,
    client?.city ?? report.client?.city,
  ]
    .filter(Boolean)
    .join(" ");
  const author = [report.profil?.firstName, report.profil?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-4 lg:pr-1">
      <div className="shrink-0 rounded-xl border bg-card p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
              <Building2 className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{clientName}</span>
            </p>
            {location && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {location}
              </p>
            )}
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("clientReports.author")}{" "}
              {author || t("clientReports.unknownAuthor")}{" "}
              <DeletedProfilBadge profil={report.profil} className="mr-1" />-{" "}
              {formatDateTime(report.createdAt, lang)}
            </p>
          </div>
          {report.invalidGeocodage === true && (
            <Badge variant="outline" className="w-fit shrink-0">
              <MapPinOff className="size-3" />
              {t("clientReports.invalidGeocodage")}
            </Badge>
          )}
        </div>
        {report.commentaire?.trim() && (
          <p className="mt-3 whitespace-pre-line break-words border-t pt-3 text-sm text-foreground">
            {report.commentaire}
          </p>
        )}
      </div>

      {clientGone && (
        <Alert variant="destructive">
          <AlertDescription>
            {t("clientReports.pharmacyGone")}
          </AlertDescription>
        </Alert>
      )}

      <ReportSection
        title={t("clientReports.photosSection")}
        count={report.pictures.length}
        defaultOpen={report.pictures.length > 0}
      >
        <ReportPhotosSection
          report={report}
          clientId={clientGone ? null : clientId}
          client={client}
          canEdit={isAdmin}
        />
      </ReportSection>

      {clientId && !clientGone && (
        <>
          {clientQuery.isLoading ? (
            <LoadingState />
          ) : clientQuery.isError ? (
            <ErrorState
              error={clientQuery.error}
              retrying={clientQuery.isFetching}
              onRetry={() => void clientQuery.refetch()}
            />
          ) : client && isAdmin ? (
            <>
              <ReportSection
                title={t("clientReports.positionSection")}
                defaultOpen={report.invalidGeocodage === true}
              >
                <ReportPositionEditor
                  client={client}
                  onDirtyChange={setPositionDirty}
                />
              </ReportSection>
              <ReportSection title={t("clientReports.infoSection")}>
                <ReportClientInfoSection
                  client={client}
                  onDirtyChange={setInfoDirty}
                />
              </ReportSection>
            </>
          ) : null}
        </>
      )}

      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:justify-end">
        {clientId && !clientGone && (
          <Button
            type="button"
            variant="outline"
            className="min-h-11 lg:min-h-10"
            onClick={() => onOpenClient(clientId)}
          >
            {t("clientReports.openPharmacy")}
            <ArrowRight />
          </Button>
        )}
        <Button
          type="button"
          variant="destructive"
          className="min-h-11 lg:min-h-10"
          onClick={() => setConfirmOpen(true)}
        >
          {t("clientReports.markHandled")}
        </Button>
      </div>

      <ReportDeleteDialog
        reportId={report.id}
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onDeleted={onDeleted}
      />
    </div>
  );
}
