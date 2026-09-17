import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Building2,
  Map as MapIcon,
  MapPin,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/pagination";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { hasValidLocation } from "@/components/pharmacies/pharmacy-utils";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { cn } from "@/lib/utils";
import type { Paged } from "@/lib/http";
import type { Pharmacy } from "@/features/pharmacies";

interface ZonePharmaciesPanelProps {
  title: string;
  isUnassigned: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  page: number;
  onPageChange: (page: number) => void;
  data: Paged<Pharmacy> | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  onRetry: () => void;
  selected: Set<string>;
  onToggle: (cip: string) => void;
  onTogglePage: (cips: string[], checked: boolean) => void;
  onSelectAllInZone: () => void;
  allInZoneCount: number;
  onBack: () => void;
  onLocate: (pharmacy: Pharmacy) => void;
  isolated: boolean;
  onIsolate: (isolated: boolean) => void;
  onRename?: () => void;
  onDelete?: () => void;
  hasSelection: boolean;
  className?: string;
}

export function ZonePharmaciesPanel({
  title,
  isUnassigned,
  search,
  onSearchChange,
  page,
  onPageChange,
  data,
  isLoading,
  isFetching,
  isError,
  onRetry,
  selected,
  onToggle,
  onTogglePage,
  onSelectAllInZone,
  allInZoneCount,
  onBack,
  onLocate,
  isolated,
  onIsolate,
  onRename,
  onDelete,
  hasSelection,
  className,
}: ZonePharmaciesPanelProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(search);
  const debounced = useDebouncedValue(draft, 300);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    onSearchChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const rows = data?.content ?? [];
  const pageCips = rows.map((row) => row.cip);
  const selectedOnPage = pageCips.filter((cip) => selected.has(cip)).length;
  const headerState =
    selectedOnPage === 0
      ? false
      : selectedOnPage === pageCips.length
        ? true
        : "indeterminate";

  return (
    <div className={cn("flex min-h-0 flex-col gap-3", className)}>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          className="size-11 shrink-0 lg:size-9"
          onClick={onBack}
          title={t("zones.backToZones")}
          aria-label={t("zones.backToZones")}
        >
          <ArrowLeft className="size-5 lg:size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-foreground">
            {title}
          </h1>
          <p className="truncate text-xs text-muted-foreground">
            {t("zones.pharmacyCount", { count: data?.totalElements ?? 0 })}
          </p>
        </div>
        <Button
          variant={isolated ? "default" : "ghost"}
          size="icon"
          className="size-11 shrink-0 lg:size-9"
          onClick={() => onIsolate(!isolated)}
          aria-pressed={isolated}
          title={isolated ? t("zones.legend.showAll") : t("zones.showOnMap")}
          aria-label={
            isolated ? t("zones.legend.showAll") : t("zones.showOnMap")
          }
        >
          <MapIcon className="size-5 lg:size-4" />
        </Button>
        {!isUnassigned && onRename && (
          <Button
            variant="ghost"
            size="icon"
            className="size-11 shrink-0 lg:size-9"
            onClick={onRename}
            title={t("common.edit")}
            aria-label={t("common.edit")}
          >
            <Pencil className="size-5 lg:size-4" />
          </Button>
        )}
        {!isUnassigned && onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="size-11 shrink-0 lg:size-9"
            onClick={onDelete}
            title={t("common.delete")}
            aria-label={t("common.delete")}
          >
            <Trash2 className="size-5 text-destructive lg:size-4" />
          </Button>
        )}
      </div>

      <div className="relative shrink-0">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t("zones.searchPlaceholder")}
          className="pl-9"
          aria-label={t("common.search")}
        />
      </div>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState onRetry={onRetry} />
      ) : rows.length === 0 ? (
        <EmptyState
          message={
            search ? t("zones.noSearchResults") : t("zones.noPharmacies")
          }
          icon={<Building2 className="size-8" />}
          className="min-h-0 flex-1"
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col rounded-xl border">
          <div
            className={cn(
              "min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]",
              hasSelection && "pb-28 lg:pb-0"
            )}
          >
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={headerState}
                      onCheckedChange={(value) =>
                        onTogglePage(pageCips, value === true)
                      }
                      aria-label={t("zones.selectAllOnPage")}
                      className="size-5"
                    />
                  </TableHead>
                  <TableHead className="truncate">{t("common.name")}</TableHead>
                  <TableHead className="hidden w-[120px] truncate sm:table-cell">
                    {t("common.city")}
                  </TableHead>
                  <TableHead className="w-[108px] truncate">
                    {t("zones.columns.cip")}
                  </TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">{t("zones.locate")}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const checked = selected.has(row.cip);
                  const label = row.name?.trim() || t("pharmacies.untitled");
                  return (
                    <TableRow
                      key={row.id}
                      data-state={checked ? "selected" : undefined}
                      className="cursor-pointer"
                      onClick={() => onToggle(row.cip)}
                    >
                      <TableCell className="w-10">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => onToggle(row.cip)}
                          onClick={(event) => event.stopPropagation()}
                          aria-label={label}
                          className="size-5"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <span className="block truncate" title={label}>
                          {label}
                        </span>
                      </TableCell>
                      <TableCell className="hidden w-[120px] text-muted-foreground sm:table-cell">
                        <span className="block truncate">
                          {[row.postalCode, row.city]
                            .filter(Boolean)
                            .join(" ")}
                        </span>
                      </TableCell>
                      <TableCell className="w-[108px] text-muted-foreground">
                        <span className="block truncate tabular-nums">
                          {row.cip}
                        </span>
                      </TableCell>
                      <TableCell className="w-12 p-1 text-right">
                        {hasValidLocation(row) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-10 lg:size-8"
                            onClick={(event) => {
                              event.stopPropagation();
                              onLocate(row);
                            }}
                            title={t("zones.locate")}
                            aria-label={t("zones.locate")}
                          >
                            <MapPin className="size-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {allInZoneCount > 0 && (
            <div className="shrink-0 border-t px-2 py-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="min-h-10 w-full justify-start lg:min-h-9"
                onClick={onSelectAllInZone}
              >
                {t("zones.selectAllInZone", { count: allInZoneCount })}
              </Button>
            </div>
          )}

          <Pagination
            page={page}
            totalPages={data?.totalPages ?? 1}
            totalElements={data?.totalElements ?? 0}
            onPageChange={onPageChange}
            isFetching={isFetching}
          />
        </div>
      )}
    </div>
  );
}
