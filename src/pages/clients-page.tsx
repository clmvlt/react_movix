import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, Plus, Receipt, TriangleAlert, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Pagination } from "@/components/pagination";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import {
  ClientFilters,
  type ClientFiltersState,
} from "@/components/clients/client-filters";
import { ClientTable } from "@/components/clients/client-table";
import { useIsAdmin } from "@/components/admin-gate";
import { useInvoiceError } from "@/components/invoices/use-invoice-error";
import { usePdfPreview } from "@/app/pdf-preview-context";
import { useToast } from "@/app/toast-context";
import { ApiError } from "@/lib/api-error";
import {
  CLIENT_PAGE_SIZE,
  CLIENT_PAGE_SIZES,
  CLIENT_QUERY_MAX_WORDS,
  CLIENT_TYPES,
  clientKeys,
  clientLabel,
  clientLabelFilename,
  clientsApi,
  isPharmacyClient,
  labelErrorKey,
  useClientSearch,
  useDeleteClient,
  type Client,
  type ClientSearchInput,
  type ClientType,
} from "@/features/clients";
import { useZones } from "@/features/zones";

function parseType(value: string | null): ClientType | null {
  return CLIENT_TYPES.find((type) => type === value) ?? null;
}

export function ClientsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const isAdmin = useIsAdmin();
  const describeError = useInvoiceError();
  const openPdfPreview = usePdfPreview();
  const [searchParams, setSearchParams] = useSearchParams();

  const deleteClient = useDeleteClient();
  const [deleting, setDeleting] = useState<Client | null>(null);
  const [deleteBlocked, setDeleteBlocked] = useState(false);

  const requestedSize = Number(searchParams.get("size") ?? "");
  const size = CLIENT_PAGE_SIZES.includes(
    requestedSize as (typeof CLIENT_PAGE_SIZES)[number]
  )
    ? requestedSize
    : CLIENT_PAGE_SIZE;

  const filters: ClientFiltersState = {
    mode: searchParams.get("mode") === "detailed" ? "detailed" : "simple",
    type: parseType(searchParams.get("type")),
    query: searchParams.get("q") ?? "",
    name: searchParams.get("n") ?? "",
    city: searchParams.get("city") ?? "",
    postalCode: searchParams.get("cp") ?? "",
    cip: searchParams.get("cip") ?? "",
    address: searchParams.get("adr") ?? "",
    email: searchParams.get("mail") ?? "",
    zone: (searchParams.get("zone") ?? "").trim().toLowerCase() || null,
    hasPhotos: searchParams.get("photos") === "1",
    hasOrdered: searchParams.get("ordered") === "1",
    locationInvalid: searchParams.get("geo") === "invalid",
    size,
  };

  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const setParams = (patch: Record<string, string | null>) => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        for (const [key, value] of Object.entries(patch)) {
          if (value === null) next.delete(key);
          else next.set(key, value);
        }
        return next;
      },
      { replace: true }
    );
  };

  const updateFilters = (patch: Partial<ClientFiltersState>) => {
    const mapped: Record<string, string | null> = { page: null };
    const text = (value: string | undefined) => (value?.trim() ? value : null);

    if ("mode" in patch) {
      mapped.mode = patch.mode === "detailed" ? "detailed" : null;
    }
    if ("type" in patch) mapped.type = patch.type ?? null;
    if ("query" in patch) mapped.q = text(patch.query);
    if ("name" in patch) mapped.n = text(patch.name);
    if ("city" in patch) mapped.city = text(patch.city);
    if ("postalCode" in patch) mapped.cp = text(patch.postalCode);
    if ("cip" in patch) mapped.cip = text(patch.cip);
    if ("address" in patch) mapped.adr = text(patch.address);
    if ("email" in patch) mapped.mail = text(patch.email);
    if ("zone" in patch) mapped.zone = patch.zone ?? null;
    if ("hasPhotos" in patch) mapped.photos = patch.hasPhotos ? "1" : null;
    if ("hasOrdered" in patch) mapped.ordered = patch.hasOrdered ? "1" : null;
    if ("locationInvalid" in patch) {
      mapped.geo = patch.locationInvalid ? "invalid" : null;
    }
    if ("size" in patch) {
      mapped.size =
        patch.size && patch.size !== CLIENT_PAGE_SIZE
          ? String(patch.size)
          : null;
    }
    setParams(mapped);
  };

  const clearFilters = () =>
    setParams({
      q: null,
      n: null,
      city: null,
      cp: null,
      cip: null,
      adr: null,
      mail: null,
      zone: null,
      type: null,
      photos: null,
      ordered: null,
      geo: null,
      page: null,
    });

  const zonesQuery = useZones();
  const zones = useMemo(() => zonesQuery.data ?? [], [zonesQuery.data]);

  const searchInput = useMemo<ClientSearchInput>(() => {
    const input: ClientSearchInput = {
      page: page - 1,
      size: filters.size,
    };

    if (filters.type) input.type = filters.type;

    if (filters.mode === "detailed") {
      if (filters.name.trim()) input.name = filters.name.trim();
      if (filters.city.trim()) input.city = filters.city.trim();
      if (filters.postalCode.trim()) {
        input.postalCode = filters.postalCode.trim();
      }
      if (filters.cip.trim()) input.cip = filters.cip.trim();
      if (filters.address.trim()) input.address = filters.address.trim();
      if (filters.email.trim()) input.email = filters.email.trim();
      if (filters.locationInvalid) input.isLocationValid = false;
    } else if (filters.query.trim()) {
      input.query = filters.query
        .trim()
        .split(/\s+/)
        .slice(0, CLIENT_QUERY_MAX_WORDS)
        .join(" ");
    }

    if (filters.zone) input.zoneId = filters.zone;
    if (filters.hasPhotos) input.hasPhotos = true;
    if (filters.hasOrdered) input.hasOrdered = true;

    return input;
  }, [
    filters.mode,
    filters.type,
    filters.query,
    filters.name,
    filters.city,
    filters.postalCode,
    filters.cip,
    filters.address,
    filters.email,
    filters.zone,
    filters.hasPhotos,
    filters.hasOrdered,
    filters.locationInvalid,
    filters.size,
    page,
  ]);

  const searchQuery = useClientSearch(searchInput);
  const rows = searchQuery.data?.content ?? [];
  const hasFilters =
    filters.query.trim() !== "" ||
    filters.name.trim() !== "" ||
    filters.city.trim() !== "" ||
    filters.postalCode.trim() !== "" ||
    filters.cip.trim() !== "" ||
    filters.address.trim() !== "" ||
    filters.email.trim() !== "" ||
    filters.zone !== null ||
    filters.type !== null ||
    filters.hasPhotos ||
    filters.hasOrdered ||
    filters.locationInvalid;

  const openClient = (client: Client) =>
    navigate(`/app/clients/${encodeURIComponent(client.id)}`);

  const handleLabel = (client: Client) => {
    openPdfPreview({
      key: clientKeys.label(client.id),
      title: t("clients.label.title"),
      subtitle: clientLabel(client),
      filename: clientLabelFilename(client),
      load: () => clientsApi.label(client.id),
      describeError: (error) => t(labelErrorKey(error)),
    });
  };

  const confirmDelete = () => {
    if (!deleting) return;
    deleteClient.mutate(deleting.id, {
      onSuccess: () => {
        toast.success(t("clients.deleted"));
        setDeleting(null);
      },
      onError: (error) => {
        if (
          error instanceof ApiError &&
          error.errorCode === "CLIENT_HAS_INVOICES"
        ) {
          setDeleteBlocked(true);
          return;
        }
        toast.error(describeError(error, "clients.errors.deleteFailed"));
      },
    });
  };

  return (
    <div className="flex w-full flex-col">
      <PageHeader
        title={t("clients.title")}
        subtitle={t("clients.subtitle")}
        actions={
          isAdmin ? (
            <>
              <Button
                variant="outline"
                className="min-h-11 shrink-0 sm:min-h-10"
                asChild
              >
                <Link to="/app/invoices">
                  <Receipt className="size-4" />
                  {t("nav.invoices")}
                </Link>
              </Button>
              <Button
                className="min-h-11 shrink-0 sm:min-h-10"
                onClick={() => navigate("/app/clients/new")}
              >
                <Plus />
                {t("clients.create")}
              </Button>
            </>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-4">
        <ClientFilters
          value={filters}
          onChange={updateFilters}
          onClear={clearFilters}
          zones={zones}
        />

        {searchQuery.isLoading ? (
          <LoadingState />
        ) : searchQuery.isError ? (
          <ErrorState
            error={searchQuery.error}
            retrying={searchQuery.isFetching}
            onRetry={() => void searchQuery.refetch()}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            message={hasFilters ? t("clients.noMatch") : t("clients.empty")}
            icon={<UsersRound className="size-8" />}
          />
        ) : (
          <div className="flex flex-col">
            <ClientTable
              rows={rows}
              canEdit={isAdmin}
              onOpen={openClient}
              onEdit={(client) =>
                navigate(`/app/clients/${encodeURIComponent(client.id)}?edit=1`)
              }
              onLabel={handleLabel}
              onOrders={(client) =>
                navigate(
                  isPharmacyClient(client)
                    ? `/app/commands?mode=detailed&cip=${encodeURIComponent(client.cip)}`
                    : "/app/commands"
                )
              }
              onDelete={(client) => {
                setDeleteBlocked(false);
                setDeleting(client);
              }}
              onCreateOrder={(client) =>
                navigate(
                  isPharmacyClient(client)
                    ? `/app/commands/new?cip=${encodeURIComponent(client.cip)}`
                    : "/app/commands/new"
                )
              }
            />
            <Pagination
              page={page}
              totalPages={searchQuery.data?.totalPages ?? 1}
              totalElements={searchQuery.data?.totalElements ?? 0}
              onPageChange={(next) =>
                setParams({ page: next <= 1 ? null : String(next) })
              }
              isFetching={searchQuery.isFetching}
              className="rounded-b-xl border-x border-b"
            />
          </div>
        )}
      </div>

      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open && !deleteClient.isPending) setDeleting(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("clients.delete.title")}</DialogTitle>
            <DialogDescription>
              {t("clients.delete.confirm", {
                name: deleting ? clientLabel(deleting) : "",
              })}
            </DialogDescription>
          </DialogHeader>
          {deleteBlocked && deleting && (
            <Alert variant="warning">
              <TriangleAlert />
              <AlertDescription className="flex flex-col items-start gap-2">
                <span>{t("clients.delete.hasInvoices")}</span>
                <Link
                  to={`/app/invoices?customer=${encodeURIComponent(deleting.id)}`}
                  className="inline-flex min-h-10 items-center font-medium underline underline-offset-2"
                >
                  {t("clients.delete.seeInvoices")}
                </Link>
              </AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 sm:min-h-10"
              disabled={deleteClient.isPending}
              onClick={() => setDeleting(null)}
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
                {deleteClient.isPending && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                {t("common.delete")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
