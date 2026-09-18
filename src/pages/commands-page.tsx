import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import {
  SearchFilters,
  type SearchFiltersState,
} from "@/components/search-filters";
import { CommandSearchTable } from "@/components/commands/command-search-table";
import { dayEndIso, dayStartIso, todayApiDate } from "@/lib/date";
import {
  COMMAND_PAGE_SIZE,
  COMMAND_PAGE_SIZES,
  COMMAND_QUERY_MAX_WORDS,
  useCommandSearch,
  type CommandSearchInput,
} from "@/features/commands";

export function CommandsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const requestedSize = Number(searchParams.get("size") ?? "");
  const size = COMMAND_PAGE_SIZES.includes(
    requestedSize as (typeof COMMAND_PAGE_SIZES)[number]
  )
    ? requestedSize
    : COMMAND_PAGE_SIZE;

  const filters: SearchFiltersState = {
    mode: searchParams.get("mode") === "detailed" ? "detailed" : "simple",
    query: searchParams.get("q") ?? "",
    barcode: "",
    name: searchParams.get("n") ?? "",
    city: searchParams.get("city") ?? "",
    postalCode: searchParams.get("cp") ?? "",
    cip: searchParams.get("cip") ?? "",
    clientId: searchParams.get("client") ?? "",
    address: searchParams.get("adr") ?? "",
    commandId: searchParams.get("cmd") ?? "",
    from: searchParams.get("from") ?? "",
    to: searchParams.get("to") ?? "",
    size,
  };

  const ordererId = (searchParams.get("orderer") ?? "").trim();
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

  const updateFilters = (patch: Partial<SearchFiltersState>) => {
    const mapped: Record<string, string | null> = { page: null };
    const text = (value: string | undefined) => (value?.trim() ? value : null);

    if ("mode" in patch) {
      mapped.mode = patch.mode === "detailed" ? "detailed" : null;
    }
    if ("query" in patch) mapped.q = text(patch.query);
    if ("name" in patch) mapped.n = text(patch.name);
    if ("city" in patch) mapped.city = text(patch.city);
    if ("postalCode" in patch) mapped.cp = text(patch.postalCode);
    if ("cip" in patch) mapped.cip = text(patch.cip);
    if ("clientId" in patch) mapped.client = text(patch.clientId);
    if ("address" in patch) mapped.adr = text(patch.address);
    if ("commandId" in patch) mapped.cmd = text(patch.commandId);
    if ("from" in patch) {
      mapped.from = text(patch.from);
      if (!mapped.from) mapped.to = null;
    }
    if ("to" in patch) mapped.to = text(patch.to);
    if ("size" in patch) {
      mapped.size =
        patch.size && patch.size !== COMMAND_PAGE_SIZE
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
      client: null,
      orderer: null,
      adr: null,
      cmd: null,
      from: null,
      to: null,
      page: null,
    });

  const searchInput = useMemo<CommandSearchInput>(() => {
    const input: CommandSearchInput = { page: page - 1, size: filters.size };

    if (filters.clientId.trim()) input.clientId = filters.clientId.trim();
    if (ordererId) input.ordererId = ordererId;

    if (filters.mode === "detailed") {
      if (filters.name.trim()) input.pharmacyName = filters.name.trim();
      if (filters.city.trim()) input.pharmacyCity = filters.city.trim();
      if (filters.postalCode.trim()) {
        input.pharmacyPostalCode = filters.postalCode.trim();
      }
      if (filters.cip.trim()) input.pharmacyCip = filters.cip.trim();
      if (filters.address.trim()) input.pharmacyAddress = filters.address.trim();
      if (filters.commandId.trim()) input.commandId = filters.commandId.trim();
    } else if (filters.query.trim()) {
      input.query = filters.query
        .trim()
        .split(/\s+/)
        .slice(0, COMMAND_QUERY_MAX_WORDS)
        .join(" ");
    }

    if (filters.from) {
      input.startDate = dayStartIso(filters.from);
      input.endDate = dayEndIso(filters.to || todayApiDate());
    }

    return input;
  }, [
    filters.mode,
    filters.query,
    filters.name,
    filters.city,
    filters.postalCode,
    filters.cip,
    filters.clientId,
    ordererId,
    filters.address,
    filters.commandId,
    filters.from,
    filters.to,
    filters.size,
    page,
  ]);

  const searchQuery = useCommandSearch(searchInput);
  const rows = useMemo(() => searchQuery.data ?? [], [searchQuery.data]);

  const hasFilters =
    filters.query.trim() !== "" ||
    filters.name.trim() !== "" ||
    filters.city.trim() !== "" ||
    filters.postalCode.trim() !== "" ||
    filters.cip.trim() !== "" ||
    filters.clientId.trim() !== "" ||
    ordererId !== "" ||
    filters.address.trim() !== "" ||
    filters.commandId.trim() !== "" ||
    filters.from !== "";

  const isLastPage = rows.length < filters.size;

  return (
    <div className="flex w-full flex-col">
      <PageHeader
        title={t("commands.title")}
        subtitle={t("commands.subtitle")}
        actions={
          <Button
            className="min-h-11 sm:min-h-10"
            onClick={() => navigate("/app/commands/new")}
          >
            <Plus />
            {t("commands.create.action")}
          </Button>
        }
      />

      <div className="flex flex-col gap-4">
        <SearchFilters
          value={filters}
          onChange={updateFilters}
          onClear={clearFilters}
          sizes={COMMAND_PAGE_SIZES}
          maxWords={COMMAND_QUERY_MAX_WORDS}
          placeholder={t("commands.searchPlaceholder")}
          detailedHint={t("commands.filters.detailedHint")}
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
              hasFilters ? t("commands.noSearchResults") : t("commands.empty")
            }
            icon={<Package className="size-8" />}
          />
        ) : (
          <div className="flex flex-col">
            <CommandSearchTable
              rows={rows}
              onOpen={(id) => navigate(`/app/commands/${id}`)}
            />
            <Pagination
              page={page}
              count={rows.length}
              hasNext={!isLastPage}
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
