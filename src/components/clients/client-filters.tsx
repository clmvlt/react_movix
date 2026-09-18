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
import { ZoneSelect } from "@/components/zone-select";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { cn } from "@/lib/utils";
import {
  CLIENT_PAGE_SIZES,
  CLIENT_QUERY_MAX_WORDS,
  CLIENT_TYPES,
  NO_ZONE,
  type ClientType,
} from "@/features/clients";
import { ClientTypeIcon } from "./client-type-icon";
import type { Zone } from "@/features/zones";

export type ClientSearchMode = "simple" | "detailed";

export interface ClientFiltersState {
  mode: ClientSearchMode;
  type: ClientType | null;
  query: string;
  name: string;
  city: string;
  postalCode: string;
  cip: string;
  address: string;
  email: string;
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
  email: string;
}

const EMPTY_TEXT: TextFilters = {
  query: "",
  name: "",
  city: "",
  postalCode: "",
  cip: "",
  address: "",
  email: "",
};

function textFrom(value: ClientFiltersState): TextFilters {
  return {
    query: value.query,
    name: value.name,
    city: value.city,
    postalCode: value.postalCode,
    cip: value.cip,
    address: value.address,
    email: value.email,
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

interface ClientFiltersProps {
  value: ClientFiltersState;
  onChange: (patch: Partial<ClientFiltersState>) => void;
  onClear: () => void;
  zones: Zone[];
}

export function ClientFilters({
  value,
  onChange,
  onClear,
  zones,
}: ClientFiltersProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<TextFilters>(() => textFrom(value));
  const [open, setOpen] = useState(
    () =>
      value.mode === "detailed" ||
      value.zone !== null ||
      value.type !== null ||
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
    setDraft((previous) => ({ ...previous, ...patch }));

  const setMode = (mode: ClientSearchMode) => {
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
  const tooManyWords = wordCount > CLIENT_QUERY_MAX_WORDS;

  const activeCount =
    Object.values(textFrom(value)).filter((entry) => entry.trim() !== "")
      .length +
    (value.zone !== null ? 1 : 0) +
    (value.type !== null ? 1 : 0) +
    (value.hasPhotos ? 1 : 0) +
    (value.hasOrdered ? 1 : 0) +
    (value.locationInvalid ? 1 : 0);

  const detailedFields = [
    { key: "name" as const, label: t("clients.fields.name"), id: "client-filter-name" },
    { key: "city" as const, label: t("clients.fields.city"), id: "client-filter-city" },
    {
      key: "postalCode" as const,
      label: t("clients.fields.postalCode"),
      id: "client-filter-postal",
    },
    {
      key: "cip" as const,
      label: t("clients.fields.cip"),
      id: "client-filter-cip",
    },
    {
      key: "address" as const,
      label: t("clients.fields.address1"),
      id: "client-filter-address",
    },
    {
      key: "email" as const,
      label: t("clients.fields.email"),
      id: "client-filter-email",
    },
  ];

  const modeItems = [
    {
      value: "simple" as const,
      label: t("clients.filters.modeSimple"),
      icon: Search,
    },
    {
      value: "detailed" as const,
      label: t("clients.filters.modeDetailed"),
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
                placeholder={t("clients.searchPlaceholder")}
                aria-label={t("common.search")}
                className="min-h-11 pl-9 lg:min-h-10"
              />
            </div>
            <FilterToggleButton
              open={open}
              onToggle={() => setOpen((previous) => !previous)}
              count={activeCount}
            />
          </>
        ) : (
          <FilterSummaryButton
            open={open}
            onToggle={() => setOpen((previous) => !previous)}
            count={activeCount}
            label={t("clients.filters.modeDetailed")}
          />
        )}
      </div>

      {!detailed && tooManyWords && (
        <p className="text-xs text-muted-foreground">
          {t("clients.searchTooManyWords", { count: CLIENT_QUERY_MAX_WORDS })}
        </p>
      )}

      <div className={cn("flex-col gap-3", open ? "flex" : "hidden", "lg:flex")}>
        <ViewSwitch
          className="lg:hidden"
          value={value.mode}
          onChange={setMode}
          items={modeItems}
        />

        <div className="flex flex-wrap items-center gap-2">
          {CLIENT_TYPES.map((option) => (
            <FilterChip
              key={option}
              active={value.type === option}
              onToggle={() =>
                onChange({ type: value.type === option ? null : option })
              }
              icon={<ClientTypeIcon type={option} className="size-4" />}
              label={t(`clients.types.${option}`)}
            />
          ))}
        </div>

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
              {t("clients.filters.detailedHint")}
            </p>
          </>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t pt-3">
          <ZoneSelect
            value={value.zone}
            onChange={(next) => onChange({ zone: next })}
            zones={zones}
            neutralLabel={t("clients.filters.anyZone")}
            extraOption={{ value: NO_ZONE, label: t("clients.filters.noZone") }}
            ariaLabel={t("clients.fields.zone")}
            className="w-full sm:w-52"
          />

          <FilterChip
            active={value.hasPhotos}
            onToggle={() => onChange({ hasPhotos: !value.hasPhotos })}
            icon={<Images />}
            label={t("clients.filters.hasPhotos")}
          />

          <FilterChip
            active={value.hasOrdered}
            onToggle={() => onChange({ hasOrdered: !value.hasOrdered })}
            icon={<Sparkles />}
            label={t("clients.filters.hasOrderedShort")}
          />

          {detailed && (
            <FilterChip
              active={value.locationInvalid}
              onToggle={() =>
                onChange({ locationInvalid: !value.locationInvalid })
              }
              icon={<MapPinOff />}
              label={t("clients.filters.locationInvalid")}
            />
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                aria-label={t("clients.filters.pageSize")}
                className="min-h-11 shrink-0 font-normal sm:ml-auto lg:min-h-10"
              >
                {t("clients.filters.pageSizeValue", { count: value.size })}
                <ChevronDown className="opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {CLIENT_PAGE_SIZES.map((size) => (
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
                  {t("clients.filters.pageSizeValue", { count: size })}
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
            {t("clients.filters.hasOrderedHint")}
          </p>
        )}
      </div>
    </div>
  );
}
