import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Building2,
  FileText,
  MapPinOff,
  Package,
  Pencil,
  Plus,
  ReceiptText,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/page-header";
import { Barcode } from "@/components/barcode";
import { FormSaveBar } from "@/components/form-save-bar";
import { useDiscardGuard } from "@/components/discard-guard";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { DeliveryWindowBadge } from "@/components/delivery-window-badge";
import { KeyTag } from "@/components/key-tag";
import { ClientSections } from "@/components/clients/client-sections";
import { useClientForm } from "@/components/clients/use-client-form";
import { useIsAdmin } from "@/components/admin-gate";
import { useAuth } from "@/app/auth-context";
import { useToast } from "@/app/toast-context";
import { ApiError } from "@/lib/api-error";
import { neutral } from "@/lib/colors";
import { formatDate } from "@/lib/date";
import { commandMapPoints } from "@/lib/command-points";
import { usePdfPreview } from "@/app/pdf-preview-context";
import { hasValidLocation } from "@/lib/address-form";
import {
  clientKeys,
  clientLabel,
  clientLabelFilename,
  clientsApi,
  isPharmacyClient,
  labelErrorKey,
  useClient,
  useDeleteClient,
  useUpdateClient,
  type Client,
} from "@/features/clients";
import { useClientLastCommands, type CommandBasic } from "@/features/commands";
import { useZones, type Zone } from "@/features/zones";
import type { CommandMapPoint } from "@/lib/command-points";
import type { LngLat } from "@/components/map";

const EDIT_FORM_ID = "client-edit-form";
const BACK_FALLBACK = "/app/clients";

function NoLocationBadge() {
  const { t } = useTranslation();
  return (
    <Badge
      variant="outline"
      className="gap-1 border-status-warning-strong/30 bg-status-warning-bg text-status-warning-text"
    >
      <MapPinOff aria-hidden className="size-3" />
      {t("clients.badges.noLocation")}
    </Badge>
  );
}

interface SharedViewProps {
  client: Client;
  zones: Zone[];
  depot: LngLat | null;
  depotTitle?: string;
  commandPoints: CommandMapPoint[];
  commandsLoading: boolean;
}

interface ReadViewProps extends SharedViewProps {
  canEdit: boolean;
  focusEdit: boolean;
  recentCommands: CommandBasic[];
  onEdit: () => void;
  onSetPosition: () => void;
  onDelete: () => void;
}

function ClientReadView({
  client,
  zones,
  depot,
  depotTitle,
  commandPoints,
  commandsLoading,
  canEdit,
  focusEdit,
  recentCommands,
  onEdit,
  onSetPosition,
  onDelete,
}: ReadViewProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const openPdfPreview = usePdfPreview();
  const lang = i18n.resolvedLanguage ?? "en";
  const editRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (focusEdit) editRef.current?.focus({ preventScroll: true });
  }, [focusEdit]);

  const title = clientLabel(client) || t("clients.untitled");
  const pharmacy = isPharmacyClient(client) ? client : null;

  const handleLabel = () => {
    openPdfPreview({
      key: clientKeys.label(client.id),
      title: t("clients.label.title"),
      subtitle: title,
      filename: clientLabelFilename(client),
      load: () => clientsApi.label(client.id),
      describeError: (error) => t(labelErrorKey(error)),
    });
  };

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title={title}
        titleExtra={
          <span className="flex flex-wrap items-center gap-2">
            {pharmacy && (
              <KeyTag
                color={pharmacy.color}
                numero={pharmacy.numero}
                size="md"
              />
            )}
            <DeliveryWindowBadge
              start={client.deliveryWindowStart}
              end={client.deliveryWindowEnd}
              size="md"
            />
            {!hasValidLocation(client) && <NoLocationBadge />}
            {client.missingFields.length > 0 && (
              <Badge
                variant="outline"
                className="border-status-warning-strong/30 bg-status-warning-bg text-status-warning-text"
              >
                {t("clients.incomplete")}
              </Badge>
            )}
          </span>
        }
        subtitle={pharmacy ? pharmacy.cip : t(`clients.types.${client.type}`)}
        backFallback={BACK_FALLBACK}
        actions={
          <>
            <Button
              variant="outline"
              className="min-h-11 shrink-0 sm:min-h-10"
              onClick={() =>
                navigate(`/app/invoices?customer=${encodeURIComponent(client.id)}`)
              }
            >
              <ReceiptText className="size-4" />
              {t("clients.actions.invoices")}
            </Button>
            {canEdit && !pharmacy && (
              <Button
                variant="outline"
                className="min-h-11 shrink-0 sm:min-h-10"
                onClick={onDelete}
              >
                <Trash2 className="size-4 text-destructive" />
                {t("common.delete")}
              </Button>
            )}
            {canEdit && (
              <Button
                ref={editRef}
                className="min-h-11 shrink-0 sm:min-h-10"
                onClick={onEdit}
              >
                <Pencil className="size-4" />
                {t("common.edit")}
              </Button>
            )}
          </>
        }
      />

      <div className="flex flex-1 flex-col gap-4">
        <ClientSections
          mode="view"
          client={client}
          type={client.type}
          zones={zones}
          depot={depot}
          depotTitle={depotTitle}
          title={title}
          pictures={client.pictures ?? []}
          canEdit={canEdit}
          commands={commandPoints}
          commandsLoading={commandsLoading}
          onSetPosition={canEdit ? onSetPosition : undefined}
        />

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
          <Card className={pharmacy ? "lg:col-span-2" : "lg:col-span-3"}>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 p-4 pb-3 sm:p-6 sm:pb-4">
              <CardTitle className="text-base">
                {t("clients.orders.section")} ({recentCommands.length})
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                {pharmacy && (
                  <Button
                    variant="outline"
                    className="min-h-11 lg:min-h-9"
                    onClick={() =>
                      navigate(
                        `/app/commands/new?cip=${encodeURIComponent(pharmacy.cip)}`
                      )
                    }
                  >
                    <Plus className="size-4" />
                    {t("clients.orders.create")}
                  </Button>
                )}
                {pharmacy && (
                  <Button
                    variant="outline"
                    className="min-h-11 lg:min-h-9"
                    onClick={() =>
                      navigate(
                        `/app/commands?mode=detailed&cip=${encodeURIComponent(pharmacy.cip)}`
                      )
                    }
                  >
                    <Package className="size-4" />
                    {t("clients.orders.all")}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              {commandsLoading ? (
                <LoadingState />
              ) : recentCommands.length === 0 ? (
                <EmptyState
                  message={t("clients.orders.empty")}
                  icon={<Package className="size-8" />}
                />
              ) : (
                <ul className="space-y-1.5">
                  {recentCommands.map((command) => (
                    <li key={command.id}>
                      <button
                        type="button"
                        onClick={() => navigate(`/app/commands/${command.id}`)}
                        className="flex min-h-11 w-full items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left transition-colors hover:border-primary/40 hover:bg-accent/30"
                      >
                        <span className="min-w-0 flex-1 truncate text-sm tabular-nums text-foreground">
                          {formatDate(command.expDate, lang)}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                          {command.comment ?? ""}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {pharmacy && (
            <Card>
              <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
                <CardTitle className="text-base">
                  {t("clients.label.download")}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4 p-4 pt-0 sm:p-6 sm:pt-0">
                <div
                  className="flex aspect-square w-full max-w-56 flex-col items-center justify-between gap-3 rounded-lg border border-border p-3"
                  style={{ backgroundColor: neutral.white, color: neutral[900] }}
                >
                  <span className="flex min-h-0 flex-1 items-center justify-center break-words text-center text-sm font-semibold leading-tight">
                    {title}
                  </span>
                  <Barcode
                    value={pharmacy.cip}
                    className="h-12 shrink-0"
                    ariaLabel={`${t("clients.fields.cip")} ${pharmacy.cip}`}
                  />
                </div>
                <Button
                  variant="outline"
                  className="min-h-11 w-full lg:min-h-10"
                  onClick={handleLabel}
                >
                  <FileText className="size-4" />
                  {t("clients.label.downloadLong")}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

interface EditViewProps extends SharedViewProps {
  focusPosition: boolean;
  onExit: () => void;
}

function ClientEditView({
  client,
  zones,
  depot,
  depotTitle,
  commandPoints,
  commandsLoading,
  focusPosition,
  onExit,
}: EditViewProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const updateClient = useUpdateClient();
  const api = useClientForm({
    baseline: client,
    mode: "edit",
    idPrefix: "edit",
    type: client.type,
  });
  const guard = useDiscardGuard({ dirty: api.dirty, onLeave: onExit });
  const pending = updateClient.isPending;
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!focusPosition) rootRef.current?.focus({ preventScroll: true });
  }, [focusPosition]);

  const title = api.form.name.trim() || clientLabel(client) || t("clients.untitled");
  const windowStart = api.form.deliveryWindowEnabled
    ? api.form.deliveryWindowStart.trim() || null
    : null;
  const windowEnd = api.form.deliveryWindowEnabled
    ? api.form.deliveryWindowEnd.trim() || null
    : null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (pending) return;
    if (!api.validate()) return;
    if (!api.dirty) {
      onExit();
      return;
    }
    updateClient.mutate(
      { id: client.id, input: api.toInput() },
      {
        onSuccess: () => {
          toast.success(t("clients.saved"));
          onExit();
        },
        onError: api.applyApiError,
      }
    );
  };

  return (
    <div ref={rootRef} tabIndex={-1} className="flex flex-1 flex-col outline-none">
      <PageHeader
        title={title}
        titleExtra={
          <span className="flex flex-wrap items-center gap-2">
            {api.form.type === "PHARMACY" && (
              <KeyTag
                color={api.form.color}
                numero={api.form.numero}
                size="md"
              />
            )}
            <DeliveryWindowBadge start={windowStart} end={windowEnd} size="md" />
            {!api.position && <NoLocationBadge />}
          </span>
        }
        subtitle={
          api.form.type === "PHARMACY"
            ? api.form.cip
            : t(`clients.types.${client.type}`)
        }
        backFallback={BACK_FALLBACK}
        onBack={guard.requestLeave}
      />

      <form
        id={EDIT_FORM_ID}
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-1 flex-col gap-4"
      >
        {api.formError && (
          <Alert variant="destructive">
            <AlertDescription className="whitespace-pre-line">
              {api.formError}
            </AlertDescription>
          </Alert>
        )}

        <ClientSections
          mode="edit"
          client={client}
          type={client.type}
          api={api}
          zones={zones}
          depot={depot}
          depotTitle={depotTitle}
          title={title}
          canEdit
          commands={commandPoints}
          commandsLoading={commandsLoading}
          disabled={pending}
          autoFocusSearch={focusPosition}
        />

        <FormSaveBar
          dirty={api.dirty}
          pending={pending}
          formId={EDIT_FORM_ID}
          onCancel={guard.requestLeave}
          status={api.dirty ? t("clients.form.dirtyStatus") : undefined}
        />
      </form>

      {guard.dialog}
    </div>
  );
}

export function ClientDetailPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const isAdmin = useIsAdmin();

  const clientQuery = useClient(id);
  const zonesQuery = useZones();
  const lastCommands = useClientLastCommands(id);
  const deleteClient = useDeleteClient();
  const toast = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBlocked, setDeleteBlocked] = useState(false);

  const client = clientQuery.data;
  const zones = useMemo(() => zonesQuery.data ?? [], [zonesQuery.data]);
  const recentCommands = useMemo(
    () => lastCommands.data ?? [],
    [lastCommands.data]
  );
  const commandPoints = useMemo(
    () => commandMapPoints(recentCommands, i18n.resolvedLanguage ?? "en"),
    [recentCommands, i18n]
  );

  const wantsEdit = searchParams.get("edit") === "1";
  const focusPosition = searchParams.get("focus") === "position";
  const pushedEditRef = useRef(false);
  const [returnFocus, setReturnFocus] = useState(false);

  useEffect(() => {
    if (!wantsEdit) pushedEditRef.current = false;
  }, [wantsEdit]);

  const startEditing = (focus?: "position") => {
    pushedEditRef.current = true;
    setReturnFocus(false);
    setSearchParams(
      (previous) => {
        const params = new URLSearchParams(previous);
        params.set("edit", "1");
        if (focus) params.set("focus", focus);
        else params.delete("focus");
        return params;
      },
      { replace: false }
    );
  };

  const stopEditing = () => {
    setReturnFocus(true);
    if (pushedEditRef.current) {
      pushedEditRef.current = false;
      navigate(-1);
      return;
    }
    setSearchParams(
      (previous) => {
        const params = new URLSearchParams(previous);
        params.delete("edit");
        params.delete("focus");
        return params;
      },
      { replace: true }
    );
  };

  const notFound =
    clientQuery.isError &&
    clientQuery.error instanceof ApiError &&
    clientQuery.error.status === 404;

  if (clientQuery.isLoading || clientQuery.isError || !client) {
    return (
      <div className="flex flex-1 flex-col">
        <PageHeader
          title={notFound ? t("clients.errors.notFound") : t("clients.title")}
          backFallback={BACK_FALLBACK}
        />
        {clientQuery.isLoading ? (
          <LoadingState />
        ) : notFound ? (
          <EmptyState
            message={t("clients.errors.notFoundDesc")}
            icon={<Building2 className="size-8" />}
          />
        ) : (
          <ErrorState
            error={clientQuery.error}
            retrying={clientQuery.isFetching}
            onRetry={() => void clientQuery.refetch()}
          />
        )}
      </div>
    );
  }

  const account = user?.account;
  const depot: LngLat | null =
    account?.longitude != null && account?.latitude != null
      ? [account.longitude, account.latitude]
      : null;

  const shared: SharedViewProps = {
    client,
    zones,
    depot,
    depotTitle: account?.societe,
    commandPoints,
    commandsLoading: lastCommands.isLoading,
  };

  const confirmDelete = () => {
    deleteClient.mutate(client.id, {
      onSuccess: () => {
        toast.success(t("clients.deleted"));
        navigate("/app/clients", { replace: true });
      },
      onError: (error) => {
        if (
          error instanceof ApiError &&
          error.errorCode === "CLIENT_HAS_INVOICES"
        ) {
          setDeleteBlocked(true);
          return;
        }
        toast.error(t("clients.errors.deleteFailed"));
      },
    });
  };

  const deleteDialog = (
    <Dialog
      open={deleteOpen}
      onOpenChange={(open) => {
        if (!open && !deleteClient.isPending) setDeleteOpen(false);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("clients.delete.title")}</DialogTitle>
          <DialogDescription>
            {t("clients.delete.confirm", { name: clientLabel(client) })}
          </DialogDescription>
        </DialogHeader>
        {deleteBlocked && (
          <Alert variant="warning">
            <AlertDescription>
              {t("clients.delete.hasInvoices")}
            </AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 sm:min-h-10"
            disabled={deleteClient.isPending}
            onClick={() => setDeleteOpen(false)}
          >
            {deleteBlocked ? t("common.close") : t("common.cancel")}
          </Button>
          {!deleteBlocked && (
            <Button
              type="button"
              variant="destructive"
              className="min-h-11 sm:min-h-10"
              disabled={deleteClient.isPending}
              onClick={confirmDelete}
            >
              {t("common.delete")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (wantsEdit && isAdmin) {
    return (
      <ClientEditView
        key={client.id}
        {...shared}
        focusPosition={focusPosition}
        onExit={stopEditing}
      />
    );
  }

  return (
    <>
      <ClientReadView
        {...shared}
        canEdit={isAdmin}
        focusEdit={returnFocus}
        recentCommands={recentCommands}
        onEdit={() => startEditing()}
        onSetPosition={() => startEditing("position")}
        onDelete={() => {
          setDeleteBlocked(false);
          setDeleteOpen(true);
        }}
      />
      {deleteDialog}
    </>
  );
}
