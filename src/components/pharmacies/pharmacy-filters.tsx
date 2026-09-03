import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Check,
  ChevronDown,
  Images,
  ListFilter,
  MapPinOff,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ViewSwitch } from "@/components/view-switch";
import {
  FilterSummaryButton,
  FilterToggleButton,
} from "@/components/filter-toggle";
import { ZoneSelect } from "@/components/pharmacies/zone-select";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { cn } from "@/lib/utils";
import {
  NO_ZONE,
  PHARMACY_PAGE_SIZES,
  PHARMACY_QUERY_MAX_WORDS,
} from "@/features/pharmacies";
import type { Zone } from "@/features/zones";

export type PharmacySearchMode = "simple" | "detailed";

export interface PharmacyFiltersState {
  mode: PharmacySearchMode;
  query: string;
  name: string;
  city: string;
  postalCode: string;
  cip: string;
  address: string;
  zone: string | null;
  hasPhotos: boolean;
  hasOrdered: boolean;
  locationInvalid: boolean;
  size: number;
}

interface TextFilters {
  query: string;
  name: string;
  city: string;
  postalCode: string;
  cip: string;
  address: string;
}

const EMPTY_TEXT: TextFilters = {
  query: "",
  name: "",
  city: "",
  postalCode: "",
  cip: "",
  address: "",
};

function textFrom(value: PharmacyFiltersState): TextFilters {
  return {
    query: value.query,
    name: value.name,
    city: value.city,
    postalCode: value.postalCode,
    cip: value.cip,
    address: value.address,
  };
}

interface FilterChipProps {
  active: boolean;
  onToggle: () => void;
  icon: ReactNode;
  label: string;
}

function FilterChip({ active, onToggle, icon, label }: FilterChipProps) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      onClick={onToggle}
      aria-pressed={active}
      className="min-h-11 shrink-0 font-normal lg:min-h-10"
    >
      {icon}
      {label}
    </Button>
  );
}

interface PharmacyFiltersProps {
  value: PharmacyFiltersState;
  onChange: (patch: Partial<PharmacyFiltersState>) => void;
  onClear: () => void;
  zones: Zone[];
}

export function PharmacyFilters({
  value,
  onChange,
  onClear,
  zones,
}: PharmacyFiltersProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<TextFilters>(() => textFrom(value));
  const [open, setOpen] = useState(
    () =>
      value.mode === "detailed" ||
      value.zone !== null ||
      value.hasPhotos ||
      value.hasOrdered ||
      value.locationInvalid ||
      Object.entries(textFrom(value)).some(
        ([key, entry]) => key !== "query" && entry.trim() !== ""
      )
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

  const detailed = value.mode === "detailed";

  const setText = (patch: Partial<TextFilters>) =>
    setDraft((prev) => ({ ...prev, ...patch }));

  const setMode = (mode: PharmacySearchMode) => {
    const cleared: TextFilters =
      mode === "detailed"
        ? { ...draft, query: "" }
        : { ...EMPTY_TEXT, query: draft.query };
    setDraft(cleared);
    onChange({ mode, ...cleared });
  };

  const handleClear = () => {
    setDraft(EMPTY_TEXT);
    onClear();
  };

  const wordCount = draft.query.trim()
    ? draft.query.trim().split(/\s+/).length
    : 0;
  const tooManyWords = wordCount > PHARMACY_QUERY_MAX_WORDS;

  const activeCount =
    Object.values(textFrom(value)).filter((entry) => entry.trim() !== "")
      .length +
    (value.zone !== null ? 1 : 0) +
    (value.hasPhotos ? 1 : 0) +
    (value.hasOrdered ? 1 : 0) +
    (value.locationInvalid ? 1 : 0);

  const detailedFields = [
    { key: "name" as const, label: t("common.name"), id: "pharmacy-filter-name" },
    { key: "city" as const, label: t("common.city"), id: "pharmacy-filter-city" },
    {
      key: "postalCode" as const,
      label: t("common.postalCode"),
      id: "pharmacy-filter-postal",
    },
    {
      key: "cip" as const,
      label: t("pharmacies.columns.cip"),
      id: "pharmacy-filter-cip",
    },
    {
      key: "address" as const,
      label: t("common.address"),
      id: "pharmacy-filter-address",
    },
  ];

  const modeItems = [
    {
      value: "simple" as const,
      label: t("pharmacies.filters.modeSimple"),
      icon: Search,
    },
    {
      value: "detailed" as const,
      label: t("pharmacies.filters.modeDetailed"),
      icon: ListFilter,
    },
  ];

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-3">
      <div className="flex items-center gap-2">
        <ViewSwitch
          className="hidden w-64 shrink-0 lg:flex"
          value={value.mode}
          onChange={setMode}
          items={modeItems}
        />

        {!detailed ? (
          <>
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={draft.query}
                onChange={(event) => setText({ query: event.target.value })}
                placeholder={t("pharmacies.searchPlaceholder")}
                aria-label={t("common.search")}
                className="min-h-11 pl-9 lg:min-h-10"
              />
            </div>
            <FilterToggleButton
              open={open}
              onToggle={() => setOpen((prev) => !prev)}
              count={activeCount}
            />
          </>
        ) : (
          <FilterSummaryButton
            open={open}
            onToggle={() => setOpen((prev) => !prev)}
            count={activeCount}
            label={t("pharmacies.filters.modeDetailed")}
          />
        )}
      </div>

      {!detailed && tooManyWords && (
        <p className="text-xs text-muted-foreground">
          {t("pharmacies.searchTooManyWords", {
            count: PHARMACY_QUERY_MAX_WORDS,
          })}
        </p>
      )}

      <div className={cn("flex-col gap-3", open ? "flex" : "hidden", "lg:flex")}>
        <ViewSwitch
          className="lg:hidden"
          value={value.mode}
          onChange={setMode}
          items={modeItems}
        />

        {detailed && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {detailedFields.map((field) => (
              <div key={field.key} className="flex min-w-0 flex-col gap-1.5">
                <Label htmlFor={field.id}>{field.label}</Label>
                <Input
                  id={field.id}
                  value={draft[field.key]}
                  onChange={(event) =>
                    setText({ [field.key]: event.target.value })
                  }
                  autoComplete="off"
                  className="min-h-11 lg:min-h-10"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("pharmacies.filters.detailedHint")}
          </p>
        </>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t pt-3">
        <ZoneSelect
          value={value.zone}
          onChange={(next) => onChange({ zone: next })}
          zones={zones}
          neutralLabel={t("pharmacies.filters.anyZone")}
          extraOption={{ value: NO_ZONE, label: t("pharmacies.filters.noZone") }}
          ariaLabel={t("pharmacies.filters.zone")}
          className="w-full sm:w-52"
        />

        <FilterChip
          active={value.hasPhotos}
          onToggle={() => onChange({ hasPhotos: !value.hasPhotos })}
          icon={<Images />}
          label={t("pharmacies.filters.hasPhotos")}
        />

        <FilterChip
          active={value.hasOrdered}
          onToggle={() => onChange({ hasOrdered: !value.hasOrdered })}
          icon={<Sparkles />}
          label={t("pharmacies.filters.hasOrderedShort")}
        />

        {detailed && (
          <FilterChip
            active={value.locationInvalid}
            onToggle={() =>
              onChange({ locationInvalid: !value.locationInvalid })
            }
            icon={<MapPinOff />}
            label={t("pharmacies.filters.locationInvalid")}
          />
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              aria-label={t("pharmacies.filters.pageSize")}
              className="min-h-11 shrink-0 font-normal lg:min-h-10 sm:ml-auto"
            >
              {t("pharmacies.filters.pageSizeValue", { count: value.size })}
              <ChevronDown className="opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {PHARMACY_PAGE_SIZES.map((size) => (
              <DropdownMenuItem
                key={size}
                className="min-h-11 lg:min-h-9"
                onSelect={() => onChange({ size })}
              >
                <Check
                  className={cn("opacity-0", size === value.size && "opacity-100")}
                />
                {t("pharmacies.filters.pageSizeValue", { count: size })}
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

        {value.hasOrdered && (
          <p className="text-xs text-muted-foreground">
            {t("pharmacies.filters.hasOrderedHint")}
          </p>
        )}
      </div>
    </div>
  );
}
