import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateField } from "@/components/date-field";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AnomalyTypeSelect } from "@/components/anomalies/anomaly-type-select";
import { FilterToggleButton } from "@/components/filter-toggle";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { cn } from "@/lib/utils";
import { profilFullName } from "@/features/auth";
import { useProfiles } from "@/features/profiles";
import {
  ANOMALY_PAGE_SIZES,
  ANOMALY_QUERY_MAX_WORDS,
} from "@/features/anomalies";

export interface AnomalyFiltersState {
  query: string;
  typeCode: string;
  userId: string;
  cip: string;
  from: string;
  to: string;
  size: number;
}

interface TextFilters {
  query: string;
  cip: string;
}

const EMPTY_TEXT: TextFilters = { query: "", cip: "" };

interface AnomalyFiltersProps {
  value: AnomalyFiltersState;
  onChange: (patch: Partial<AnomalyFiltersState>) => void;
  onClear: () => void;
}

export function AnomalyFilters({
  value,
  onChange,
  onClear,
}: AnomalyFiltersProps) {
  const { t } = useTranslation();
  const profiles = useProfiles();
  const [draft, setDraft] = useState<TextFilters>({
    query: value.query,
    cip: value.cip,
  });
  const [open, setOpen] = useState(
    () =>
      value.typeCode !== "" ||
      value.userId !== "" ||
      value.cip.trim() !== "" ||
      value.from !== "" ||
      value.to !== ""
  );
  const debounced = useDebouncedValue(draft, 300);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    onChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const globalSearch = draft.query.trim() !== "";
  const wordCount = draft.query.trim()
    ? draft.query.trim().split(/\s+/).length
    : 0;
  const tooManyWords = wordCount > ANOMALY_QUERY_MAX_WORDS;

  const selectedProfile = (profiles.data ?? []).find(
    (profile) => profile.id === value.userId
  );

  const activeCount = [
    value.query.trim() !== "",
    value.typeCode !== "",
    value.userId !== "",
    value.cip.trim() !== "",
    value.from !== "",
    value.to !== "",
  ].filter(Boolean).length;

  const handleClear = () => {
    setDraft(EMPTY_TEXT);
    onClear();
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-3">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={draft.query}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, query: event.target.value }))
            }
            placeholder={t("anomalies.filters.searchPlaceholder")}
            aria-label={t("common.search")}
            className="min-h-11 pl-9 lg:min-h-10"
          />
        </div>
        <FilterToggleButton
          open={open}
          onToggle={() => setOpen((prev) => !prev)}
          count={activeCount}
        />
      </div>

      {tooManyWords && (
        <p className="text-xs text-muted-foreground">
          {t("anomalies.filters.tooManyWords", {
            count: ANOMALY_QUERY_MAX_WORDS,
          })}
        </p>
      )}

      <div className={cn("flex-col gap-3", open ? "flex" : "hidden", "lg:flex")}>
        {!tooManyWords && (
          <p className="text-xs text-muted-foreground">
            {t("anomalies.filters.searchScope")}
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor="anomaly-filter-type">
            {t("anomalies.columns.type")}
          </Label>
          <AnomalyTypeSelect
            id="anomaly-filter-type"
            value={value.typeCode}
            onChange={(typeCode) => onChange({ typeCode })}
            allowAll
          />
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor="anomaly-filter-user">
            {t("anomalies.columns.declaredBy")}
          </Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                id="anomaly-filter-user"
                type="button"
                variant="outline"
                className={cn(
                  "min-h-11 w-full justify-between font-normal lg:min-h-10",
                  !value.userId && "text-muted-foreground"
                )}
              >
                <span className="truncate">
                  {selectedProfile
                    ? profilFullName(selectedProfile)
                    : t("anomalies.filters.allProfiles")}
                </span>
                <ChevronDown className="opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="max-h-72 w-[min(20rem,90vw)] overflow-y-auto"
            >
              <DropdownMenuItem
                className="min-h-11 lg:min-h-9"
                onSelect={() => onChange({ userId: "" })}
              >
                <Check
                  className={cn("opacity-0", !value.userId && "opacity-100")}
                />
                {t("anomalies.filters.allProfiles")}
              </DropdownMenuItem>
              {(profiles.data ?? []).map((profile) => (
                <DropdownMenuItem
                  key={profile.id}
                  className="min-h-11 lg:min-h-9"
                  onSelect={() => onChange({ userId: profile.id })}
                >
                  <Check
                    className={cn(
                      "opacity-0",
                      value.userId === profile.id && "opacity-100"
                    )}
                  />
                  <span className="truncate">{profilFullName(profile)}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor="anomaly-filter-cip">
            {t("clients.fields.cip")}
          </Label>
          <Input
            id="anomaly-filter-cip"
            value={draft.cip}
            disabled={globalSearch}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, cip: event.target.value }))
            }
            autoComplete="off"
            className="min-h-11 lg:min-h-10"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:col-span-2 sm:grid-cols-2 lg:col-span-1">
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="anomaly-filter-from">
              {t("commands.filters.from")}
            </Label>
            <DateField
              id="anomaly-filter-from"
              value={value.from}
              max={value.to || undefined}
              onChange={(next) => onChange({ from: next })}
              className="min-h-11 lg:min-h-10"
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="anomaly-filter-to">
              {t("commands.filters.to")}
            </Label>
            <DateField
              id="anomaly-filter-to"
              value={value.to}
              min={value.from || undefined}
              onChange={(next) => onChange({ to: next })}
              className="min-h-11 lg:min-h-10"
            />
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {globalSearch
          ? t("anomalies.filters.cipIgnored")
          : t("anomalies.filters.dateHint")}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              aria-label={t("commands.filters.pageSize")}
              className="min-h-11 shrink-0 font-normal lg:min-h-10 sm:ml-auto"
            >
              {t("commands.filters.pageSizeValue", { count: value.size })}
              <ChevronDown className="opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {ANOMALY_PAGE_SIZES.map((size) => (
              <DropdownMenuItem
                key={size}
                className="min-h-11 lg:min-h-9"
                onSelect={() => onChange({ size })}
              >
                <Check
                  className={cn(
                    "opacity-0",
                    size === value.size && "opacity-100"
                  )}
                />
                {t("commands.filters.pageSizeValue", { count: size })}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {activeCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleClear}
            className="min-h-11 shrink-0 lg:min-h-10"
          >
            <X />
            {t("common.clearFilters")}
          </Button>
        )}
        </div>
      </div>
    </div>
  );
}
