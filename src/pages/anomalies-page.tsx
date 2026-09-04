import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import {
  AnomalyFilters,
  type AnomalyFiltersState,
} from "@/components/anomalies/anomaly-filters";
import { AnomalyTable } from "@/components/anomalies/anomaly-table";
import { AnomalyCreateDialog } from "@/components/anomalies/anomaly-create-dialog";
import { AnomalyEmailDialog } from "@/components/anomalies/anomaly-email-dialog";
import { useAnomalyError } from "@/components/anomalies/use-anomaly-error";
import { usePdfPreview } from "@/app/pdf-preview-context";
import {
  ANOMALY_PAGE_SIZE,
  ANOMALY_PAGE_SIZES,
  ANOMALY_QUERY_MAX_WORDS,
  anomaliesApi,
  anomalyKeys,
  useAnomalies,
  type AnomalyListMode,
  type AnomalySearchInput,
} from "@/features/anomalies";

export function AnomaliesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [emailId, setEmailId] = useState<string | null>(null);
  const openPdfPreview = usePdfPreview();
  const describeError = useAnomalyError();

  const requestedSize = Number(searchParams.get("size") ?? "");
  const size = ANOMALY_PAGE_SIZES.includes(
    requestedSize as (typeof ANOMALY_PAGE_SIZES)[number]
  )
    ? requestedSize
    : ANOMALY_PAGE_SIZE;

  const filters: AnomalyFiltersState = {
    query: searchParams.get("q") ?? "",
    typeCode: searchParams.get("type") ?? "",
    userId: searchParams.get("user") ?? "",
    cip: searchParams.get("cip") ?? "",
    from: searchParams.get("from") ?? "",
    to: searchParams.get("to") ?? "",
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

  const updateFilters = (patch: Partial<AnomalyFiltersState>) => {
    const mapped: Record<string, string | null> = { page: null };
    const text = (value: string | undefined) => (value?.trim() ? value : null);

    if ("query" in patch) mapped.q = text(patch.query);
    if ("typeCode" in patch) mapped.type = text(patch.typeCode);
    if ("userId" in patch) mapped.user = text(patch.userId);
    if ("cip" in patch) mapped.cip = text(patch.cip);
    if ("from" in patch) mapped.from = text(patch.from);
    if ("to" in patch) mapped.to = text(patch.to);
    if ("size" in patch) {
      mapped.size =
        patch.size && patch.size !== ANOMALY_PAGE_SIZE
          ? String(patch.size)
          : null;
    }
    setParams(mapped);
  };

  const clearFilters = () =>
    setParams({
      q: null,
      type: null,
      user: null,
      cip: null,
      from: null,
      to: null,
      page: null,
    });

  const hasFilters =
    filters.query.trim() !== "" ||
    filters.typeCode !== "" ||
    filters.userId !== "" ||
    filters.cip.trim() !== "" ||
    filters.from !== "" ||
    filters.to !== "";

  const mode: AnomalyListMode = hasFilters ? "search" : "list";

  const searchInput = useMemo<AnomalySearchInput>(() => {
    const input: AnomalySearchInput = { page: page - 1, size: filters.size };
    const query = filters.query.trim();

    if (query) {
      input.query = query
        .split(/\s+/)
        .slice(0, ANOMALY_QUERY_MAX_WORDS)
        .join(" ");
    } else if (filters.cip.trim()) {
      input.cip = filters.cip.trim();
    }

    if (filters.typeCode) input.typeCode = filters.typeCode;
    if (filters.userId) input.userId = filters.userId;
    if (filters.from) input.dateDebut = filters.from;
    if (filters.to) input.dateFin = filters.to;

    return input;
  }, [
    filters.query,
    filters.cip,
    filters.typeCode,
    filters.userId,
    filters.from,
    filters.to,
    filters.size,
    page,
  ]);

  const anomalies = useAnomalies(searchInput, mode);
  const rows = anomalies.data ?? [];

  const showPdf = (id: string) => {
    const row = rows.find((anomaly) => anomaly.id === id);
    openPdfPreview({
      key: [...anomalyKeys.all, "pdf", id],
      title: t("anomalies.pdf.title"),
      subtitle: row?.pharmacy?.name?.trim() || undefined,
      filename: `anomalie_${id}.pdf`,
      load: () => anomaliesApi.pdf(id),
      describeError,
    });
  };

  return (
    <div className="flex w-full flex-col">
      <PageHeader
        title={t("anomalies.title")}
        subtitle={t("anomalies.subtitle")}
        actions={
          <Button
            className="min-h-11 lg:min-h-10"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-4" />
            {t("anomalies.declare")}
          </Button>
        }
      />

      <div className="flex flex-col gap-4">
        <AnomalyFilters
          value={filters}
          onChange={updateFilters}
          onClear={clearFilters}
        />

        {anomalies.isLoading ? (
          <LoadingState />
        ) : anomalies.isError ? (
          <ErrorState
            error={anomalies.error}
            retrying={anomalies.isFetching}
            onRetry={() => void anomalies.refetch()}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            message={
              hasFilters ? t("anomalies.noResults") : t("anomalies.empty")
            }
            icon={<TriangleAlert className="size-8" />}
          />
        ) : (
          <div className="flex flex-col">
            <AnomalyTable
              rows={rows}
              onOpen={(id) => navigate(`/app/anomalies/${id}`)}
              onEmail={setEmailId}
              onPdf={showPdf}
            />
            <Pagination
              page={page}
              count={rows.length}
              hasNext={rows.length >= filters.size}
              onPageChange={(next) =>
                setParams({ page: next <= 1 ? null : String(next) })
              }
              isFetching={anomalies.isFetching}
              className="rounded-b-xl border-x border-b"
            />
          </div>
        )}
      </div>

      <AnomalyCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(created) => navigate(`/app/anomalies/${created.id}`)}
      />

      <AnomalyEmailDialog
        open={emailId !== null}
        onOpenChange={(open) => !open && setEmailId(null)}
        anomalyId={emailId ?? ""}
      />
    </div>
  );
}
