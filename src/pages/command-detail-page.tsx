import { useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { PackageCheck, PackageX, ReceiptText, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader } from "@/components/page-header";
import { DeliveryWindowBadge } from "@/components/delivery-window-badge";
import { StatusBadge } from "@/components/status-badge";
import { CommandExpDateDialog } from "@/components/command-actions";
import { CommandCommentDialog } from "@/components/commands/command-comment-dialog";
import { CommandRestoreDialog } from "@/components/commands/command-restore-dialog";
import { CommandSections } from "@/components/commands/command-sections";
import { CommandSouffranceDialog } from "@/components/commands/command-souffrance-dialog";
import { CommandStatusDialog } from "@/components/commands/command-status-dialog";
import { CommandTarifDialog } from "@/components/commands/command-tarif-dialog";
import { useCommandError } from "@/components/commands/use-command-error";
import { AnomalyCreateDialog } from "@/components/anomalies/anomaly-create-dialog";
import { InvoiceGenerateDialog } from "@/components/invoices/invoice-generate-dialog";
import { InvoicedBadges } from "@/components/invoices/invoiced-badges";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { useAuth } from "@/app/auth-context";
import { useToast } from "@/app/toast-context";
import { useWorkingDate } from "@/app/working-date-context";
import { commandStatusCategory } from "@/lib/status";
import { dateToApiDate, formatDate, formatDateTime, parseDate } from "@/lib/date";
import { ApiError } from "@/lib/api-error";
import type { LngLat } from "@/components/map";
import {
  commandRecipient,
  partyLabel,
  useClientLastCommands,
  useCommand,
  useUpdateCommands,
} from "@/features/commands";
import { useSouffrancePackagesOfCommand } from "@/features/packages";
import { tourKeys } from "@/features/tours";

export function CommandDetailPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { setDate } = useWorkingDate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const lang = i18n.resolvedLanguage ?? "en";

  const [statusOpen, setStatusOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [tarifOpen, setTarifOpen] = useState(false);
  const [souffranceOpen, setSouffranceOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [anomalyOpen, setAnomalyOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  const { data, isLoading, isError, error, refetch, isFetching } =
    useCommand(id);
  const updateCommand = useUpdateCommands();
  const describeError = useCommandError();

  const souffrance = data?.souffrance === true;
  const isAdmin = user?.isAdmin === true;
  const parcels = useMemo(() => data?.packages ?? [], [data?.packages]);

  const hiddenParcels = useSouffrancePackagesOfCommand(
    id,
    Boolean(data) && !souffrance
  );
  const hiddenParcelCount = hiddenParcels.data?.length ?? 0;

  const recipient = useMemo(() => commandRecipient(data), [data]);
  const recipientClientId = recipient?.linked ? recipient.clientId : null;

  const lastCommands = useClientLastCommands(recipientClientId ?? undefined);
  const otherCommands = useMemo(
    () => (lastCommands.data ?? []).filter((command) => command.id !== id),
    [lastCommands.data, id]
  );

  const notFound = isError && error instanceof ApiError && error.status === 404;

  const refresh = () => {
    void refetch();
  };

  const done = () => {
    void queryClient.invalidateQueries({ queryKey: tourKeys.all });
    refresh();
  };

  const toggleForced = (checked: boolean) => {
    if (!id) return;
    updateCommand.mutate(
      { commandIds: [id], isForced: checked },
      {
        onSuccess: refresh,
        onError: (cause) => toast.error(describeError(cause)),
      }
    );
  };

  const openTour = () => {
    const tourId = data?.tour?.id;
    if (!tourId) return;
    const day = parseDate(data?.expDate);
    if (day) setDate(dateToApiDate(day));
    navigate(`/app/tours?tour=${encodeURIComponent(tourId)}`);
  };

  const openPharmacyOrders = () => {
    if (!recipientClientId) return;
    navigate(
      `/app/commands?mode=detailed&client=${encodeURIComponent(recipientClientId)}`
    );
  };

  const account = user?.account;
  const depot: LngLat | null =
    account?.longitude != null && account?.latitude != null
      ? [account.longitude, account.latitude]
      : null;

  const title = data
    ? (partyLabel(recipient) || t("commands.noPharmacy"))
    : t("nav.commands");
  const subtitle = data?.expDate
    ? t("commands.detail.subtitle", { date: formatDate(data.expDate, lang) })
    : undefined;

  let headerActions: ReactNode;
  if (id && data && souffrance) {
    headerActions = (
      <Button
        variant="outline"
        className="min-h-11 shrink-0 gap-1.5 px-3 lg:min-h-10"
        aria-label={t("souffrance.restore.action")}
        onClick={() => setRestoreOpen(true)}
      >
        <PackageCheck className="size-4" />
        {t("souffrance.restore.actionShort")}
      </Button>
    );
  } else if (id && data) {
    headerActions = (
      <>
        <Button
          variant="outline"
          className="min-h-11 shrink-0 gap-1.5 px-3 lg:min-h-10"
          onClick={() => setAnomalyOpen(true)}
        >
          <TriangleAlert className="size-4" />
          {t("anomalies.declare")}
        </Button>
        <Button
          variant="outline"
          className="min-h-11 shrink-0 gap-1.5 px-3 lg:min-h-10"
          onClick={() => setSouffranceOpen(true)}
        >
          <PackageX className="size-4" />
          {t("expeditions.souffrance")}
        </Button>
        {isAdmin && (
          <Button
            variant="outline"
            className="min-h-11 shrink-0 gap-1.5 px-3 lg:min-h-10"
            onClick={() => setInvoiceOpen(true)}
          >
            <ReceiptText className="size-4" />
            {t("invoices.generate.actionShort")}
          </Button>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title={title}
        titleExtra={
          data ? (
            <span className="flex flex-wrap items-center gap-2">
              {data.status && (
                <StatusBadge
                  label={data.status.name}
                  category={commandStatusCategory(data.status.id)}
                />
              )}
              <DeliveryWindowBadge
                start={data.pharmacyDeliveryWindowStart}
                end={data.pharmacyDeliveryWindowEnd}
                size="md"
              />
              <InvoicedBadges commandId={data.id} />
            </span>
          ) : undefined
        }
        subtitle={subtitle}
        backFallback={souffrance ? "/app/souffrance" : "/app/commands"}
        actions={headerActions}
      />

      {isLoading ? (
        <LoadingState />
      ) : notFound ? (
        <EmptyState
          message={t("commands.errors.notFoundDetail")}
          icon={<PackageX className="size-8" />}
        />
      ) : isError || !data ? (
        <ErrorState
          error={error}
          retrying={isFetching}
          onRetry={() => void refetch()}
        />
      ) : (
        <div className="flex flex-1 flex-col gap-4">
          {souffrance && (
            <Alert>
              <PackageX />
              <div>
                <AlertTitle>{t("commands.souffrance.title")}</AlertTitle>
                <AlertDescription>
                  {t("commands.souffrance.description", {
                    date: formatDateTime(data.souffranceDate, lang),
                    name:
                      data.souffranceByName ??
                      t("commands.souffrance.unknownAuthor"),
                  })}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {!souffrance && hiddenParcelCount > 0 && (
            <Alert variant="warning">
              <TriangleAlert />
              <div>
                <AlertTitle>{t("souffrance.hiddenParcels.title")}</AlertTitle>
                <AlertDescription>
                  {t("souffrance.hiddenParcels.description", {
                    count: hiddenParcelCount,
                  })}
                </AlertDescription>
              </div>
            </Alert>
          )}

          <CommandSections
            command={data}
            locked={souffrance}
            isAdmin={isAdmin}
            depot={depot}
            depotTitle={account?.societe}
            recentCommands={otherCommands}
            recentLoading={lastCommands.isLoading}
            forcedPending={updateCommand.isPending}
            onChangeDate={() => setDateOpen(true)}
            onChangeStatus={() => setStatusOpen(true)}
            onEditComment={() => setCommentOpen(true)}
            onEditTarif={() => setTarifOpen(true)}
            onToggleForced={toggleForced}
            onOpenTour={openTour}
            onRefresh={refresh}
            onOpenCommand={(commandId) => navigate(`/app/commands/${commandId}`)}
            onOpenPharmacyOrders={openPharmacyOrders}
          />
        </div>
      )}

      {id && (
        <>
          <CommandStatusDialog
            open={statusOpen}
            onOpenChange={setStatusOpen}
            commandIds={[id]}
            onDone={done}
          />
          <CommandExpDateDialog
            open={dateOpen}
            onOpenChange={setDateOpen}
            commandIds={[id]}
            currentExpDate={data?.expDate}
            onDone={() => {
              toast.success(t("commands.detail.expDateSaved"));
              done();
            }}
          />
          <CommandCommentDialog
            open={commentOpen}
            onOpenChange={setCommentOpen}
            commandId={id}
            initialComment={data?.comment}
            onDone={refresh}
          />
          {isAdmin && (
            <CommandTarifDialog
              open={tarifOpen}
              onOpenChange={setTarifOpen}
              commandIds={[id]}
              initialTarif={data?.tarif}
              onDone={refresh}
            />
          )}
          <CommandSouffranceDialog
            open={souffranceOpen}
            onOpenChange={setSouffranceOpen}
            commandIds={[id]}
            onDone={done}
          />
          <CommandRestoreDialog
            open={restoreOpen}
            onOpenChange={setRestoreOpen}
            commandIds={[id]}
            onDone={done}
          />
          {isAdmin && (
            <InvoiceGenerateDialog
              open={invoiceOpen}
              onOpenChange={setInvoiceOpen}
              commandIds={[id]}
            />
          )}
          <AnomalyCreateDialog
            open={anomalyOpen}
            onOpenChange={setAnomalyOpen}
            commandId={id}
            commandClient={data?.client ?? null}
            packages={parcels}
            onCreated={(created) => navigate(`/app/anomalies/${created.id}`)}
          />
        </>
      )}
    </div>
  );
}
