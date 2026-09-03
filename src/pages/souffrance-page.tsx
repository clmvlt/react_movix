import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Package, PackageCheck, PackageX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { SelectionBar } from "@/components/selection-bar";
import { ViewSwitch } from "@/components/view-switch";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import {
  SearchFilters,
  type SearchFiltersState,
} from "@/components/search-filters";
import { SouffranceCommandsTable } from "@/components/souffrance/souffrance-commands-table";
import { SouffrancePackagesTable } from "@/components/souffrance/souffrance-packages-table";
import { PackageRestoreDialog } from "@/components/souffrance/package-restore-dialog";
import { CommandRestoreDialog } from "@/components/commands/command-restore-dialog";
import { dayEndIso, dayStartIso, todayApiDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import {
  COMMAND_PAGE_SIZE,
  COMMAND_PAGE_SIZES,
  COMMAND_QUERY_MAX_WORDS,
  useCommandSearch,
  type CommandSearchInput,
} from "@/features/commands";
import {
  useSouffrancePackageSearch,
  type PackageSouffranceSearchInput,
} from "@/features/packages";

type SouffranceTab = "commands" | "packages";

export function SouffrancePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [restoreOpen, setRestoreOpen] = useState(false);

  const tab: SouffranceTab =
    searchParams.get("tab") === "packages" ? "packages" : "commands";

  const requestedSize = Number(searchParams.get("size") ?? "");
  const size = COMMAND_PAGE_SIZES.includes(
    requestedSize as (typeof COMMAND_PAGE_SIZES)[number]
  )
    ? requestedSize
    : COMMAND_PAGE_SIZE;

  const filters: SearchFiltersState = {
    mode: searchParams.get("mode") === "detailed" ? "detailed" : "simple",
    query: searchParams.get("q") ?? "",
    barcode: searchParams.get("bc") ?? "",
    name: searchParams.get("n") ?? "",
    city: searchParams.get("city") ?? "",
    postalCode: searchParams.get("cp") ?? "",
    cip: searchParams.get("cip") ?? "",
    address: searchParams.get("adr") ?? "",
    commandId: searchParams.get("cmd") ?? "",
    from: searchParams.get("from") ?? "",
    to: searchParams.get("to") ?? "",
    size,
  };

  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const setParams = (patch: Record<string, string | null>) => {
    setSelected(new Set());
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
    if ("barcode" in patch) mapped.bc = text(patch.barcode);
    if ("name" in patch) mapped.n = text(patch.name);
    if ("city" in patch) mapped.city = text(patch.city);
    if ("postalCode" in patch) mapped.cp = text(patch.postalCode);
    if ("cip" in patch) mapped.cip = text(patch.cip);
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
      bc: null,
      n: null,
      city: null,
      cp: null,
      cip: null,
      adr: null,
      cmd: null,
      from: null,
      to: null,
      page: null,
    });

  const period = useMemo(() => {
    if (!filters.from) return null;
    return {
      startDate: dayStartIso(filters.from),
      endDate: dayEndIso(filters.to || todayApiDate()),
    };
  }, [filters.from, filters.to]);

  const commandInput = useMemo<CommandSearchInput>(() => {
    const input: CommandSearchInput = { page: page - 1, size: filters.size };

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

    if (period) {
      input.startDate = period.startDate;
      input.endDate = period.endDate;
    }

    return input;
  }, [
    filters.mode,
    filters.query,
    filters.name,
    filters.city,
    filters.postalCode,
    filters.cip,
    filters.address,
    filters.commandId,
    filters.size,
    period,
    page,
  ]);

  const packageInput = useMemo<PackageSouffranceSearchInput>(() => {
    const input: PackageSouffranceSearchInput = {
      page: page - 1,
      size: filters.size,
    };

    if (filters.mode === "detailed") {
      if (filters.barcode.trim()) input.barcode = filters.barcode.trim();
      if (filters.name.trim()) input.pharmacyName = filters.name.trim();
      if (filters.city.trim()) input.pharmacyCity = filters.city.trim();
      if (filters.postalCode.trim()) {
        input.pharmacyPostalCode = filters.postalCode.trim();
      }
      if (filters.cip.trim()) input.pharmacyCip = filters.cip.trim();
      if (filters.commandId.trim()) input.commandId = filters.commandId.trim();
    } else if (filters.query.trim()) {
      input.query = filters.query
        .trim()
        .split(/\s+/)
        .slice(0, COMMAND_QUERY_MAX_WORDS)
        .join(" ");
    }

    if (period) {
      input.startDate = period.startDate;
      input.endDate = period.endDate;
    }

    return input;
  }, [
    filters.mode,
    filters.query,
    filters.barcode,
    filters.name,
    filters.city,
    filters.postalCode,
    filters.cip,
    filters.commandId,
    filters.size,
    period,
    page,
  ]);

  const commandsQuery = useCommandSearch(
    commandInput,
    "souffrance",
    tab === "commands"
  );
  const packagesQuery = useSouffrancePackageSearch(
    packageInput,
    tab === "packages"
  );

  const activeQuery = tab === "commands" ? commandsQuery : packagesQuery;
  const commandRows = useMemo(
    () => commandsQuery.data ?? [],
    [commandsQuery.data]
  );
  const packageRows = useMemo(
    () => packagesQuery.data ?? [],
    [packagesQuery.data]
  );
  const count = tab === "commands" ? commandRows.length : packageRows.length;

  const hasFilters =
    filters.query.trim() !== "" ||
    filters.barcode.trim() !== "" ||
    filters.name.trim() !== "" ||
    filters.city.trim() !== "" ||
    filters.postalCode.trim() !== "" ||
    filters.cip.trim() !== "" ||
    filters.address.trim() !== "" ||
    filters.commandId.trim() !== "" ||
    filters.from !== "";

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const toggleAll = () => {
    const keys =
      tab === "commands"
        ? commandRows.map((row) => row.id)
        : packageRows.map((row) => row.barcode);
    setSelected((prev) =>
      keys.every((key) => prev.has(key)) ? new Set() : new Set(keys)
    );
  };

  const selectedIds = useMemo(() => Array.from(selected), [selected]);
  const selectedPackages = useMemo(
    () => packageRows.filter((row) => selected.has(row.barcode)),
    [packageRows, selected]
  );

  const afterRestore = () => {
    setSelected(new Set());
    void activeQuery.refetch();
  };

  const restoreLabel = t("souffrance.restore.action");

  const restoreButton = (layout: "inline" | "bar") => (
    <Button
      variant="outline"
      className={
        layout === "bar"
          ? "min-h-11 shrink-0 gap-1.5 px-3"
          : "min-h-11 shrink-0 gap-1.5 px-3 lg:min-h-10"
      }
      disabled={selected.size === 0}
      aria-label={restoreLabel}
      onClick={() => setRestoreOpen(true)}
    >
      <PackageCheck className="size-4" />
      {t("souffrance.restore.actionShort")}
    </Button>
  );

  return (
    <div className="flex w-full flex-col">
      <PageHeader
        title={t("souffrance.title")}
        subtitle={t("souffrance.subtitle")}
      />

      <div className="flex flex-col gap-4">
        <ViewSwitch
          className="w-full sm:w-96"
          value={tab}
          onChange={(next: SouffranceTab) =>
            setParams({ tab: next === "packages" ? "packages" : null, page: null })
          }
          items={[
            {
              value: "commands",
              label: t("souffrance.tabs.commands"),
              icon: Package,
            },
            {
              value: "packages",
              label: t("souffrance.tabs.packages"),
              icon: PackageX,
            },
          ]}
        />

        <SearchFilters
          value={filters}
          onChange={updateFilters}
          onClear={clearFilters}
          sizes={COMMAND_PAGE_SIZES}
          maxWords={COMMAND_QUERY_MAX_WORDS}
          fields={
            tab === "packages"
              ? ["barcode", "name", "city", "postalCode", "cip", "commandId"]
              : ["name", "city", "postalCode", "cip", "address", "commandId"]
          }
          placeholder={
            tab === "packages"
              ? t("souffrance.searchPlaceholderPackages")
              : t("souffrance.searchPlaceholderCommands")
          }
          detailedHint={
            tab === "packages"
              ? t("souffrance.detailedHintPackages")
              : t("commands.filters.detailedHint")
          }
        />

        <p className="text-xs text-muted-foreground">
          {t("souffrance.expDateHint")}
        </p>

        {activeQuery.isLoading ? (
          <LoadingState />
        ) : activeQuery.isError ? (
          <ErrorState onRetry={() => void activeQuery.refetch()} />
        ) : count === 0 ? (
          <EmptyState
            message={
              hasFilters
                ? t("souffrance.noResults")
                : tab === "packages"
                  ? t("souffrance.emptyPackages")
                  : t("souffrance.emptyCommands")
            }
            icon={<PackageX className="size-8" />}
          />
        ) : (
          <div
            className={cn(
              "flex flex-col gap-3",
              selected.size > 0 && "pb-28 lg:pb-0"
            )}
          >
            <div className="hidden items-center gap-2 lg:flex">
              <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                {selected.size > 0
                  ? t("expeditions.selected", { count: selected.size })
                  : t("souffrance.selectHint")}
              </span>
              {restoreButton("inline")}
            </div>

            <div className="flex flex-col">
              {tab === "commands" ? (
                <SouffranceCommandsTable
                  rows={commandRows}
                  selected={selected}
                  onToggle={toggle}
                  onToggleAll={toggleAll}
                  onOpen={(id) => navigate(`/app/commands/${id}`)}
                />
              ) : (
                <SouffrancePackagesTable
                  rows={packageRows}
                  selected={selected}
                  onToggle={toggle}
                  onToggleAll={toggleAll}
                  onOpenCommand={(id) => navigate(`/app/commands/${id}`)}
                />
              )}
              <Pagination
                page={page}
                count={count}
                hasNext={count === filters.size}
                onPageChange={(next) =>
                  setParams({ page: next <= 1 ? null : String(next) })
                }
                isFetching={activeQuery.isFetching}
                className="rounded-b-xl border-x border-b"
              />
            </div>
          </div>
        )}
      </div>

      <SelectionBar count={selected.size} onClear={() => setSelected(new Set())}>
        {restoreButton("bar")}
      </SelectionBar>

      {tab === "commands" ? (
        <CommandRestoreDialog
          open={restoreOpen}
          onOpenChange={setRestoreOpen}
          commandIds={selectedIds}
          onDone={afterRestore}
        />
      ) : (
        <PackageRestoreDialog
          open={restoreOpen}
          onOpenChange={setRestoreOpen}
          packages={selectedPackages}
          onDone={afterRestore}
        />
      )}
    </div>
  );
}
