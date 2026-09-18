import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, ListFilter, Search, X } from "lucide-react";
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
import { ViewSwitch } from "@/components/view-switch";
import {
  FilterSummaryButton,
  FilterToggleButton,
} from "@/components/filter-toggle";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { cn } from "@/lib/utils";

export type SearchMode = "simple" | "detailed";

export type SearchField =
  | "barcode"
  | "name"
  | "city"
  | "postalCode"
  | "cip"
  | "address"
  | "commandId";

export interface SearchFiltersState {
  mode: SearchMode;
  query: string;
  barcode: string;
  name: string;
  city: string;
  postalCode: string;
  cip: string;
  clientId: string;
  address: string;
  commandId: string;
  from: string;
  to: string;
  size: number;
}

type TextFilters = Pick<
  SearchFiltersState,
  | "query"
  | "barcode"
  | "name"
  | "city"
  | "postalCode"
  | "cip"
  | "address"
  | "commandId"
>;

const EMPTY_TEXT: TextFilters = {
  query: "",
  barcode: "",
  name: "",
  city: "",
  postalCode: "",
  cip: "",
  address: "",
  commandId: "",
};

const DEFAULT_SEARCH_FIELDS: SearchField[] = [
  "name",
  "city",
  "postalCode",
  "cip",
  "address",
  "commandId",
];

function textFrom(value: SearchFiltersState): TextFilters {
  return {
    query: value.query,
    barcode: value.barcode,
    name: value.name,
    city: value.city,
    postalCode: value.postalCode,
    cip: value.cip,
    address: value.address,
    commandId: value.commandId,
  };
}

interface SearchFiltersProps {
  value: SearchFiltersState;
  onChange: (patch: Partial<SearchFiltersState>) => void;
  onClear: () => void;
  fields?: SearchField[];
  sizes: readonly number[];
  maxWords: number;
  placeholder: string;
  detailedHint: string;
}

export function SearchFilters({
  value,
  onChange,
  onClear,
  fields = DEFAULT_SEARCH_FIELDS,
  sizes,
  maxWords,
  placeholder,
  detailedHint,
}: SearchFiltersProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<TextFilters>(() => textFrom(value));
  const [open, setOpen] = useState(
    () =>
      value.mode === "detailed" ||
      value.from !== "" ||
      value.to !== "" ||
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

  const setMode = (mode: SearchMode) => {
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
  const tooManyWords = wordCount > maxWords;

  const activeCount =
    Object.values(textFrom(value)).filter((entry) => entry.trim() !== "")
      .length +
    (value.from !== "" ? 1 : 0) +
    (value.to !== "" ? 1 : 0);

  const labels: Record<SearchField, string> = {
    barcode: t("commands.detail.barcode"),
    name: t("commands.filters.pharmacyName"),
    city: t("common.city"),
    postalCode: t("common.postalCode"),
    cip: t("clients.fields.cip"),
    address: t("common.address"),
    commandId: t("commands.filters.commandId"),
  };

  const modeItems = [
    {
      value: "simple" as const,
      label: t("commands.filters.modeSimple"),
      icon: Search,
    },
    {
      value: "detailed" as const,
      label: t("commands.filters.modeDetailed"),
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
                placeholder={placeholder}
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
            label={t("commands.filters.modeDetailed")}
          />
        )}
      </div>

      {!detailed && tooManyWords && (
        <p className="text-xs text-muted-foreground">
          {t("commands.searchTooManyWords", { count: maxWords })}
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
              {fields.map((field) => {
                const id = `search-filter-${field}`;
                return (
                  <div key={field} className="flex min-w-0 flex-col gap-1.5">
                    <Label htmlFor={id}>{labels[field]}</Label>
                    <Input
                      id={id}
                      value={draft[field]}
                      onChange={(event) =>
                        setText({ [field]: event.target.value })
                      }
                      autoComplete="off"
                      className="min-h-11 lg:min-h-10"
                    />
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">{detailedHint}</p>
          </>
        )}

        <div className="grid grid-cols-1 gap-3 border-t pt-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="search-filter-from">
              {t("commands.filters.from")}
            </Label>
            <DateField
              id="search-filter-from"
              value={value.from}
              max={value.to || undefined}
              onChange={(next) => onChange({ from: next })}
              className="min-h-11 lg:min-h-10"
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="search-filter-to">{t("commands.filters.to")}</Label>
            <DateField
              id="search-filter-to"
              value={value.to}
              min={value.from || undefined}
              disabled={value.from === ""}
              onChange={(next) => onChange({ to: next })}
              className="min-h-11 lg:min-h-10"
            />
          </div>
        </div>

        {value.from === "" && (
          <p className="text-xs text-muted-foreground">
            {t("commands.filters.endWithoutStart")}
          </p>
        )}

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
              {sizes.map((size) => (
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
