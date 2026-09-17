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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/page-header";
import { Barcode } from "@/components/barcode";
import { FormSaveBar } from "@/components/form-save-bar";
import { useDiscardGuard } from "@/components/discard-guard";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { PharmacyPhotoGallery } from "@/components/pharmacies/pharmacy-photo-gallery";
import { PharmacySections } from "@/components/pharmacies/pharmacy-sections";
import { PharmacyTag } from "@/components/pharmacies/pharmacy-tag";
import { DeliveryWindowBadge } from "@/components/delivery-window-badge";
import { usePharmacyForm } from "@/components/pharmacies/use-pharmacy-form";
import { buildUpdatePayload } from "@/components/pharmacies/pharmacy-form";
import {
  commandMapPoints,
  hasValidLocation,
  labelErrorKey,
  type CommandMapPoint,
} from "@/components/pharmacies/pharmacy-utils";
import { ApiError } from "@/lib/api-error";
import { neutral } from "@/lib/colors";
import { formatDate } from "@/lib/date";
import { useAuth } from "@/app/auth-context";
import { useToast } from "@/app/toast-context";
import { usePdfPreview } from "@/app/pdf-preview-context";
import {
  pharmaciesApi,
  pharmacyKeys,
  pharmacyLabelFilename,
  usePharmacy,
  useUpdatePharmacy,
  type PharmacyDetail,
} from "@/features/pharmacies";
import { useZones, type Zone } from "@/features/zones";
import { usePharmacyLastCommands, type CommandBasic } from "@/features/commands";
import type { LngLat } from "@/components/map";

const EDIT_FORM_ID = "pharmacy-edit-form";
const BACK_FALLBACK = "/app/pharmacies";

function NoLocationBadge() {
  const { t } = useTranslation();
  return (
    <Badge
      variant="outline"
      className="gap-1 border-status-warning-strong/30 bg-status-warning-bg text-status-warning-text"
    >
      <MapPinOff aria-hidden className="size-3" />
      {t("pharmacies.badges.noLocation")}
    </Badge>
  );
}

interface SharedViewProps {
  pharmacy: PharmacyDetail;
  zones: Zone[];
  depot: LngLat | null;
  depotTitle?: string;
  commandPoints: CommandMapPoint[];
  commandsLoading: boolean;
}

interface ReadViewProps extends SharedViewProps {
  recentCommands: CommandBasic[];
  focusEdit: boolean;
  onEdit: () => void;
  onSetPosition: () => void;
}

function PharmacyReadView({
  pharmacy,
  zones,
  depot,
  depotTitle,
  commandPoints,
  commandsLoading,
  recentCommands,
  focusEdit,
  onEdit,
  onSetPosition,
}: ReadViewProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const openPdfPreview = usePdfPreview();
  const lang = i18n.resolvedLanguage ?? "en";
  const editRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (focusEdit) editRef.current?.focus({ preventScroll: true });
  }, [focusEdit]);

  const title = pharmacy.name?.trim() || t("pharmacies.untitled");
  const located = hasValidLocation(pharmacy);

  const handleLabel = () => {
    openPdfPreview({
      key: pharmacyKeys.label(pharmacy.id),
      title: t("pharmacies.label.title"),
      subtitle: title,
      filename: pharmacyLabelFilename(pharmacy),
      load: () => pharmaciesApi.label(pharmacy.cip),
      describeError: (error) => t(labelErrorKey(error)),
    });
  };

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title={title}
        titleExtra={
          <span className="flex flex-wrap items-center gap-2">
            <PharmacyTag
              color={pharmacy.color}
              numero={pharmacy.numero}
              size="md"
            />
            <DeliveryWindowBadge
              start={pharmacy.deliveryWindowStart}
              end={pharmacy.deliveryWindowEnd}
              size="md"
            />
            {!located && <NoLocationBadge />}
          </span>
        }
        subtitle={pharmacy.cip}
        backFallback={BACK_FALLBACK}
        actions={
          <Button ref={editRef} className="min-h-11 sm:min-h-10" onClick={onEdit}>
            <Pencil />
            {t("common.edit")}
          </Button>
        }
      />

      <div className="flex flex-1 flex-col gap-4">
        <PharmacySections
          mode="view"
          pharmacy={pharmacy}
          zones={zones}
          depot={depot}
          depotTitle={depotTitle}
          title={title}
          commands={commandPoints}
          commandsLoading={commandsLoading}
          onSetPosition={onSetPosition}
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 p-4 pb-3 sm:p-6 sm:pb-4">
              <CardTitle className="text-base">
                {t("pharmacies.orders.section")} ({recentCommands.length})
              </CardTitle>
              <div className="flex flex-wrap gap-2">
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
                  {t("pharmacies.orders.create")}
                </Button>
                <Button
                  variant="outline"
                  className="min-h-11 lg:min-h-9"
                  onClick={() =>
                    navigate(
                      `/app/commands?mode=detailed&cip=${encodeURIComponent(
                        pharmacy.cip
                      )}`
                    )
                  }
                >
                  <Package className="size-4" />
                  {t("pharmacies.orders.all")}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              {commandsLoading ? (
                <LoadingState />
              ) : recentCommands.length === 0 ? (
                <EmptyState
                  message={t("pharmacies.orders.empty")}
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

          <Card>
            <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
              <CardTitle className="text-base">
                {t("pharmacies.label.download")}
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
                  ariaLabel={`${t("pharmacies.columns.cip")} ${pharmacy.cip}`}
                />
              </div>
              <Button
                variant="outline"
                className="min-h-11 w-full lg:min-h-10"
                onClick={handleLabel}
              >
                <FileText className="size-4" />
                {t("pharmacies.label.downloadLong")}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
            <CardTitle className="text-base">
              {t("pharmacies.sections.photos")} ({pharmacy.pictures.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <PharmacyPhotoGallery
              cip={pharmacy.cip}
              pictures={pharmacy.pictures}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface EditViewProps extends SharedViewProps {
  focusPosition: boolean;
  onExit: () => void;
}

function PharmacyEditView({
  pharmacy,
  zones,
  depot,
  depotTitle,
  commandPoints,
  commandsLoading,
  focusPosition,
  onExit,
}: EditViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const updatePharmacy = useUpdatePharmacy();
  const api = usePharmacyForm({
    baseline: pharmacy,
    mode: "edit",
    idPrefix: "edit",
  });
  const guard = useDiscardGuard({ dirty: api.dirty, onLeave: onExit });
  const pending = updatePharmacy.isPending;
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!focusPosition) rootRef.current?.focus({ preventScroll: true });
  }, [focusPosition]);

  const title = api.form.name.trim() || t("pharmacies.untitled");
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
    const payload = buildUpdatePayload(api.form, pharmacy);
    if (Object.keys(payload).length === 0) {
      onExit();
      return;
    }
    updatePharmacy.mutate(
      { cip: pharmacy.cip, input: payload },
      {
        onSuccess: (saved) => {
          toast.success(t("pharmacies.form.saved"));
          if (saved.cip && saved.cip !== pharmacy.cip) {
            navigate(`/app/pharmacies/${encodeURIComponent(saved.cip)}`, {
              replace: true,
            });
            return;
          }
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
            <PharmacyTag
              color={api.form.color}
              numero={api.form.numero}
              size="md"
            />
            <DeliveryWindowBadge start={windowStart} end={windowEnd} size="md" />
            {!api.position && <NoLocationBadge />}
          </span>
        }
        subtitle={pharmacy.cip}
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

        <PharmacySections
          mode="edit"
          pharmacy={pharmacy}
          api={api}
          zones={zones}
          depot={depot}
          depotTitle={depotTitle}
          title={title}
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
          status={api.dirty ? t("pharmacies.form.dirtyStatus") : undefined}
        />
      </form>

      {guard.dialog}
    </div>
  );
}

export function PharmacyDetailPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { cip } = useParams<{ cip: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const lang = i18n.resolvedLanguage ?? "en";

  const pharmacyQuery = usePharmacy(cip);
  const zonesQuery = useZones();
  const lastCommands = usePharmacyLastCommands(cip);

  const pharmacy = pharmacyQuery.data;
  const zones = useMemo(() => zonesQuery.data ?? [], [zonesQuery.data]);
  const recentCommands = useMemo(
    () => lastCommands.data ?? [],
    [lastCommands.data]
  );
  const commandPoints = useMemo(
    () => commandMapPoints(recentCommands, lang),
    [recentCommands, lang]
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
      (prev) => {
        const params = new URLSearchParams(prev);
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
      (prev) => {
        const params = new URLSearchParams(prev);
        params.delete("edit");
        params.delete("focus");
        return params;
      },
      { replace: true }
    );
  };

  const notFound =
    pharmacyQuery.isError &&
    pharmacyQuery.error instanceof ApiError &&
    pharmacyQuery.error.status === 404;

  if (
    pharmacyQuery.isLoading ||
    notFound ||
    pharmacyQuery.isError ||
    !pharmacy
  ) {
    return (
      <div className="flex flex-1 flex-col">
        <PageHeader
          title={
            notFound ? t("pharmacies.errors.notFound") : t("pharmacies.title")
          }
          backFallback={BACK_FALLBACK}
        />
        {pharmacyQuery.isLoading ? (
          <LoadingState />
        ) : notFound ? (
          <EmptyState
            message={t("pharmacies.errors.notFoundDesc")}
            icon={<Building2 className="size-8" />}
          />
        ) : (
          <ErrorState
            error={pharmacyQuery.error}
            retrying={pharmacyQuery.isFetching}
            onRetry={() => void pharmacyQuery.refetch()}
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
    pharmacy,
    zones,
    depot,
    depotTitle: account?.societe,
    commandPoints,
    commandsLoading: lastCommands.isLoading,
  };

  if (wantsEdit) {
    return (
      <PharmacyEditView
        key={pharmacy.id}
        {...shared}
        focusPosition={focusPosition}
        onExit={stopEditing}
      />
    );
  }

  return (
    <PharmacyReadView
      {...shared}
      recentCommands={recentCommands}
      focusEdit={returnFocus}
      onEdit={() => startEditing()}
      onSetPosition={() => startEditing("position")}
    />
  );
}
