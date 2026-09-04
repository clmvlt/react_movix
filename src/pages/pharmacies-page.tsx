import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import {
  PharmacyFilters,
  type PharmacyFiltersState,
} from "@/components/pharmacies/pharmacy-filters";
import { PharmacyTable } from "@/components/pharmacies/pharmacy-table";
import { labelErrorKey } from "@/components/pharmacies/pharmacy-utils";
import { usePdfPreview } from "@/app/pdf-preview-context";
import {
  PHARMACY_PAGE_SIZE,
  PHARMACY_PAGE_SIZES,
  PHARMACY_QUERY_MAX_WORDS,
  pharmaciesApi,
  pharmacyKeys,
  pharmacyLabelFilename,
  usePharmacySearch,
  type Pharmacy,
  type PharmacySearchInput,
} from "@/features/pharmacies";
import { useZones } from "@/features/zones";

export function PharmaciesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const openPdfPreview = usePdfPreview();

  const requestedSize = Number(searchParams.get("size") ?? "");
  const size = PHARMACY_PAGE_SIZES.includes(
    requestedSize as (typeof PHARMACY_PAGE_SIZES)[number]
  )
    ? requestedSize
    : PHARMACY_PAGE_SIZE;

  const filters: PharmacyFiltersState = {
    mode: searchParams.get("mode") === "detailed" ? "detailed" : "simple",
    query: searchParams.get("q") ?? "",
    name: searchParams.get("n") ?? "",
    city: searchParams.get("city") ?? "",
    postalCode: searchParams.get("cp") ?? "",
    cip: searchParams.get("cip") ?? "",
    address: searchParams.get("adr") ?? "",
    zone: (searchParams.get("zone") ?? "").trim().toLowerCase() || null,
    hasPhotos: searchParams.get("photos") === "1",
    hasOrdered: searchParams.get("ordered") === "1",
    locationInvalid: searchParams.get("geo") === "invalid",
    size,
  };

  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const setParams = (patch: Record<string, string | null>) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(patch)) {
          if (value === null) next.delete(key);
          else next.set(key, value);
        }
        return next;
      },
      { replace: true }
    );
  };

  const updateFilters = (patch: Partial<PharmacyFiltersState>) => {
    const mapped: Record<string, string | null> = { page: null };
    const text = (value: string | undefined) =>
      value?.trim() ? value : null;

    if ("mode" in patch) {
      mapped.mode = patch.mode === "detailed" ? "detailed" : null;
    }
    if ("query" in patch) mapped.q = text(patch.query);
    if ("name" in patch) mapped.n = text(patch.name);
    if ("city" in patch) mapped.city = text(patch.city);
    if ("postalCode" in patch) mapped.cp = text(patch.postalCode);
    if ("cip" in patch) mapped.cip = text(patch.cip);
    if ("address" in patch) mapped.adr = text(patch.address);
    if ("zone" in patch) mapped.zone = patch.zone ?? null;
    if ("hasPhotos" in patch) mapped.photos = patch.hasPhotos ? "1" : null;
    if ("hasOrdered" in patch) mapped.ordered = patch.hasOrdered ? "1" : null;
    if ("locationInvalid" in patch) {
      mapped.geo = patch.locationInvalid ? "invalid" : null;
    }
    if ("size" in patch) {
      mapped.size =
        patch.size && patch.size !== PHARMACY_PAGE_SIZE
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
      zone: null,
      photos: null,
      ordered: null,
      geo: null,
      page: null,
    });

  const zonesQuery = useZones();
  const zones = useMemo(() => zonesQuery.data ?? [], [zonesQuery.data]);

  const searchInput = useMemo<PharmacySearchInput>(() => {
    const input: PharmacySearchInput = {
      page: page - 1,
      size: filters.size,
    };

    if (filters.mode === "detailed") {
      if (filters.name.trim()) input.name = filters.name.trim();
      if (filters.city.trim()) input.city = filters.city.trim();
      if (filters.postalCode.trim()) input.postalCode = filters.postalCode.trim();
      if (filters.cip.trim()) input.cip = filters.cip.trim();
      if (filters.address.trim()) input.address = filters.address.trim();
      if (filters.locationInvalid) input.isLocationValid = false;
    } else if (filters.query.trim()) {
      input.query = filters.query
        .trim()
        .split(/\s+/)
        .slice(0, PHARMACY_QUERY_MAX_WORDS)
        .join(" ");
    }

    if (filters.zone) input.zoneId = filters.zone;
    if (filters.hasPhotos) input.hasPhotos = true;
    if (filters.hasOrdered) input.hasOrdered = true;

    return input;
  }, [
    filters.mode,
    filters.query,
    filters.name,
    filters.city,
    filters.postalCode,
    filters.cip,
    filters.address,
    filters.zone,
    filters.hasPhotos,
    filters.hasOrdered,
    filters.locationInvalid,
    filters.size,
    page,
  ]);

  const searchQuery = usePharmacySearch(searchInput);
  const rows = searchQuery.data?.content ?? [];
  const hasFilters =
    filters.query.trim() !== "" ||
    filters.name.trim() !== "" ||
    filters.city.trim() !== "" ||
    filters.postalCode.trim() !== "" ||
    filters.cip.trim() !== "" ||
    filters.address.trim() !== "" ||
    filters.zone !== null ||
    filters.hasPhotos ||
    filters.hasOrdered ||
    filters.locationInvalid;

  const handleLabel = (pharmacy: Pharmacy) => {
    openPdfPreview({
      key: [...pharmacyKeys.all, "label", pharmacy.cip],
      title: t("pharmacies.label.title"),
      subtitle: pharmacy.name?.trim() || pharmacy.cip,
      filename: pharmacyLabelFilename(pharmacy),
      load: () => pharmaciesApi.label(pharmacy.cip),
      describeError: (error) => t(labelErrorKey(error)),
    });
  };

  return (
    <div className="flex w-full flex-col">
      <PageHeader
        title={t("pharmacies.title")}
        subtitle={t("pharmacies.subtitle")}
        actions={
          <Button
            className="min-h-11 sm:min-h-10"
            onClick={() => navigate("/app/pharmacies/new")}
          >
            <Plus />
            {t("pharmacies.create")}
          </Button>
        }
      />

      <div className="flex flex-col gap-4">
        <PharmacyFilters
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
            message={
              hasFilters
                ? t("pharmacies.noSearchResults")
                : t("pharmacies.empty")
            }
            icon={<Building2 className="size-8" />}
          />
        ) : (
          <div className="flex flex-col">
            <PharmacyTable
              rows={rows}
              onOpen={(cip) =>
                navigate(`/app/pharmacies/${encodeURIComponent(cip)}`)
              }
              onEdit={(pharmacy) =>
                navigate(
                  `/app/pharmacies/${encodeURIComponent(pharmacy.cip)}?edit=1`
                )
              }
              onLabel={handleLabel}
              onOrders={(pharmacy) =>
                navigate(
                  `/app/commands?mode=detailed&cip=${encodeURIComponent(
                    pharmacy.cip
                  )}`
                )
              }
              onCreateOrder={(pharmacy) =>
                navigate(
                  `/app/commands/new?cip=${encodeURIComponent(pharmacy.cip)}`
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

    </div>
  );
}
