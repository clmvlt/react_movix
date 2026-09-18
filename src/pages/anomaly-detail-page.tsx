import { useMemo, useState } from "react";
import {
  clientLabel,
  isPharmacyClient,
} from "@/features/clients";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Building2,
  FileText,
  Mail,
  PackageSearch,
  Pencil,
  TriangleAlert,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { DetailField } from "@/components/detail-field";
import { StatusBadge } from "@/components/status-badge";
import { PictureGrid } from "@/components/picture-grid";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { CommandParcelsTable } from "@/components/commands/command-parcels-table";
import { AnomalyTypeBadge } from "@/components/anomalies/anomaly-type";
import { AnomalyCommentDialog } from "@/components/anomalies/anomaly-comment-dialog";
import { AnomalyEmailDialog } from "@/components/anomalies/anomaly-email-dialog";
import { useAnomalyError } from "@/components/anomalies/use-anomaly-error";
import { commandStatusCategory } from "@/lib/status";
import { formatDate, formatDateTime } from "@/lib/date";
import { ApiError } from "@/lib/api-error";
import { profilFullName } from "@/features/auth";
import { usePdfPreview } from "@/app/pdf-preview-context";
import { DeletedProfilBadge } from "@/components/deleted-profil-badge";
import { anomaliesApi, anomalyKeys, useAnomaly } from "@/features/anomalies";

export function AnomalyDetailPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const lang = i18n.resolvedLanguage ?? "en";

  const [commentOpen, setCommentOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  const { data, isLoading, isError, error, refetch, isFetching } =
    useAnomaly(id);
  const openPdfPreview = usePdfPreview();
  const describeError = useAnomalyError();

  const parcels = useMemo(() => data?.packages ?? [], [data?.packages]);
  const pictures = useMemo(() => data?.pictures ?? [], [data?.pictures]);

  const notFound = isError && error instanceof ApiError && error.status === 404;

  const client = data?.client ?? null;
  const clientName = client ? clientLabel(client) : null;
  const clientCip =
    client && isPharmacyClient(client) ? client.cip : null;
  const address = [client?.address1, client?.postalCode, client?.city]
    .filter(Boolean)
    .join(", ");

  const showPdf = () => {
    if (!id) return;
    openPdfPreview({
      key: [...anomalyKeys.all, "pdf", id],
      title: t("anomalies.pdf.title"),
      subtitle: clientName ?? undefined,
      filename: `anomalie_${id}.pdf`,
      load: () => anomaliesApi.pdf(id),
      describeError,
    });
  };

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title={clientName ?? t("nav.anomalies")}
        subtitle={client?.city ?? undefined}
        backFallback="/app/anomalies"
        actions={
          data && (
            <>
              <Button
                variant="outline"
                className="min-h-11 lg:min-h-10"
                onClick={() => setCommentOpen(true)}
              >
                <Pencil className="size-4" />
                {t("anomalies.comment.action")}
              </Button>
              <Button
                variant="outline"
                className="min-h-11 lg:min-h-10"
                onClick={() => setEmailOpen(true)}
              >
                <Mail className="size-4" />
                {t("anomalies.email.action")}
              </Button>
              <Button
                variant="outline"
                className="min-h-11 lg:min-h-10"
                onClick={showPdf}
              >
                <FileText className="size-4" />
                {t("anomalies.pdf.action")}
              </Button>
            </>
          )
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : notFound ? (
        <EmptyState
          message={t("anomalies.errors.notFoundDetail")}
          icon={<TriangleAlert className="size-8" />}
        />
      ) : isError || !data ? (
        <ErrorState
          error={error}
          retrying={isFetching}
          onRetry={() => void refetch()}
        />
      ) : (
        <div className="flex flex-1 flex-col gap-4">
          <Card>
            <CardContent className="pt-6">
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DetailField label={t("anomalies.columns.type")}>
                  <AnomalyTypeBadge type={data.typeAnomalie} />
                </DetailField>
                <DetailField label={t("anomalies.columns.createdAt")}>
                  {formatDateTime(data.createdAt, lang)}
                </DetailField>
                <DetailField label={t("anomalies.columns.declaredBy")}>
                  <span className="inline-flex flex-wrap items-center gap-1.5">
                    {profilFullName(data.profil)}
                    <DeletedProfilBadge profil={data.profil} />
                  </span>
                </DetailField>
                <DetailField label={t("anomalies.detail.command")}>
                  {data.command?.status ? (
                    <StatusBadge
                      label={data.command.status.name}
                      category={commandStatusCategory(data.command.status.id)}
                    />
                  ) : data.commandId ? (
                    t("anomalies.detail.commandLinked")
                  ) : (
                    t("anomalies.detail.noCommand")
                  )}
                </DetailField>
                <DetailField label={t("clients.fields.cip")}>
                  {clientCip}
                </DetailField>
                <DetailField label={t("common.address")}>{address}</DetailField>
                <DetailField label={t("common.phone")}>
                  {client?.phone}
                </DetailField>
                <DetailField label={t("commands.expDate")}>
                  {formatDate(data.command?.expDate, lang)}
                </DetailField>
                <DetailField
                  label={t("anomalies.form.description")}
                  className="sm:col-span-2"
                >
                  {data.other ? (
                    <span className="whitespace-pre-wrap">{data.other}</span>
                  ) : null}
                </DetailField>
                <DetailField
                  label={t("anomalies.form.actions")}
                  className="sm:col-span-2"
                >
                  {data.actions ? (
                    <span className="whitespace-pre-wrap">{data.actions}</span>
                  ) : null}
                </DetailField>
              </dl>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
                {client && (
                  <Button
                    variant="outline"
                    className="min-h-11 lg:min-h-10"
                    onClick={() =>
                      navigate(
                        `/app/clients/${encodeURIComponent(client.id)}`
                      )
                    }
                  >
                    <Building2 className="size-4" />
                    {t("commands.openPharmacy")}
                  </Button>
                )}
                {data.commandId && (
                  <Button
                    variant="outline"
                    className="min-h-11 lg:min-h-10"
                    onClick={() => navigate(`/app/commands/${data.commandId}`)}
                  >
                    <PackageSearch className="size-4" />
                    {t("anomalies.detail.openCommand")}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-1 flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t("commands.detail.parcels")} ({parcels.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {parcels.length === 0 ? (
                  <EmptyState message={t("anomalies.detail.noParcels")} />
                ) : (
                  <CommandParcelsTable parcels={parcels} />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t("commands.detail.pictures")} ({pictures.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PictureGrid
                  pictures={pictures}
                  emptyMessage={t("anomalies.detail.noPictures")}
                  hint={t("anomalies.detail.purgeNotice")}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {id && data && (
        <>
          <AnomalyCommentDialog
            open={commentOpen}
            onOpenChange={setCommentOpen}
            anomalyId={id}
            initialComment={data.other}
          />
          <AnomalyEmailDialog
            open={emailOpen}
            onOpenChange={setEmailOpen}
            anomalyId={id}
          />
        </>
      )}
    </div>
  );
}
