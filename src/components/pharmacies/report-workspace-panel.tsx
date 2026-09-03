import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Building2, MapPinOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ErrorState, LoadingState } from "@/components/states";
import { ReportSection } from "@/components/pharmacies/report-section";
import { ReportPhotosSection } from "@/components/pharmacies/report-photos-section";
import { ReportPharmacyInfoSection } from "@/components/pharmacies/report-pharmacy-info-section";
import { ReportPositionEditor } from "@/components/pharmacies/report-position-editor";
import { ReportDeleteDialog } from "@/components/pharmacies/report-delete-dialog";
import { DeletedProfilBadge } from "@/components/deleted-profil-badge";
import { ApiError } from "@/lib/api-error";
import { formatDateTime } from "@/lib/date";
import { usePharmacy } from "@/features/pharmacies";
import type { PharmacyReport } from "@/features/pharmacy-reports";

interface ReportWorkspacePanelProps {
  report: PharmacyReport;
  onDirtyChange: (dirty: boolean) => void;
  onDeleted: () => void;
  onOpenPharmacy: (cip: string) => void;
}

export function ReportWorkspacePanel({
  report,
  onDirtyChange,
  onDeleted,
  onOpenPharmacy,
}: ReportWorkspacePanelProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? "en";

  const cip = report.pharmacy?.cip ?? null;
  const pharmacyQuery = usePharmacy(cip ?? undefined);
  const pharmacy = pharmacyQuery.data;

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

  const pharmacyGone =
    pharmacyQuery.isError &&
    pharmacyQuery.error instanceof ApiError &&
    pharmacyQuery.error.status === 404;

  const pharmacyName =
    (pharmacy?.name ?? report.pharmacy?.name)?.trim() ||
    t("pharmacies.reports.noPharmacy");
  const location = [
    pharmacy?.postalCode ?? report.pharmacy?.postalCode,
    pharmacy?.city ?? report.pharmacy?.city,
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
              <span className="truncate">{pharmacyName}</span>
            </p>
            {location && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {location}
              </p>
            )}
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("pharmacies.reports.author")}{" "}
              {author || t("pharmacies.reports.unknownAuthor")}{" "}
              <DeletedProfilBadge profil={report.profil} className="mr-1" />-{" "}
              {formatDateTime(report.createdAt, lang)}
            </p>
          </div>
          {report.invalidGeocodage === true && (
            <Badge variant="outline" className="w-fit shrink-0">
              <MapPinOff className="size-3" />
              {t("pharmacies.reports.invalidGeocodage")}
            </Badge>
          )}
        </div>
        {report.commentaire?.trim() && (
          <p className="mt-3 whitespace-pre-line break-words border-t pt-3 text-sm text-foreground">
            {report.commentaire}
          </p>
        )}
      </div>

      {pharmacyGone && (
        <Alert variant="destructive">
          <AlertDescription>
            {t("pharmacies.reports.pharmacyGone")}
          </AlertDescription>
        </Alert>
      )}

      <ReportSection
        title={t("pharmacies.reports.photosSection")}
        count={report.pictures.length}
        defaultOpen={report.pictures.length > 0}
      >
        <ReportPhotosSection
          report={report}
          cip={pharmacyGone ? null : cip}
          pharmacy={pharmacy}
        />
      </ReportSection>

      {cip && !pharmacyGone && (
        <>
          {pharmacyQuery.isLoading ? (
            <LoadingState />
          ) : pharmacyQuery.isError ? (
            <ErrorState onRetry={() => void pharmacyQuery.refetch()} />
          ) : pharmacy ? (
            <>
              <ReportSection
                title={t("pharmacies.reports.positionSection")}
                defaultOpen={report.invalidGeocodage === true}
              >
                <ReportPositionEditor
                  pharmacy={pharmacy}
                  onDirtyChange={setPositionDirty}
                />
              </ReportSection>
              <ReportSection title={t("pharmacies.reports.infoSection")}>
                <ReportPharmacyInfoSection
                  pharmacy={pharmacy}
                  onDirtyChange={setInfoDirty}
                />
              </ReportSection>
            </>
          ) : null}
        </>
      )}

      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:justify-end">
        {cip && !pharmacyGone && (
          <Button
            type="button"
            variant="outline"
            className="min-h-11 lg:min-h-10"
            onClick={() => onOpenPharmacy(cip)}
          >
            {t("pharmacies.reports.openPharmacy")}
            <ArrowRight />
          </Button>
        )}
        <Button
          type="button"
          variant="destructive"
          className="min-h-11 lg:min-h-10"
          onClick={() => setConfirmOpen(true)}
        >
          {t("pharmacies.reports.markHandled")}
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
