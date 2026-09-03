import { useId, useRef, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, MapPin, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import {
  ORS_SEARCH_MIN_CHARS,
  isOrsUnavailable,
  useAddressSearch,
  useGeocodingStatus,
  type AddressResult,
} from "@/features/ors";
import type { LngLat } from "@/components/map";

interface AddressSearchProps {
  onSelect: (result: AddressResult) => void;
  near?: LngLat | null;
  limit?: number;
  placeholder?: string;
  ariaLabel?: string;
  id?: string;
  defaultTerm?: string;
  autoFocus?: boolean;
  className?: string;
  inputClassName?: string;
  listClassName?: string;
}

function formatDistance(meters: number | null): string {
  if (meters == null || !Number.isFinite(meters)) return "";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function secondaryLine(result: AddressResult): string {
  return [result.postcode, result.city].filter(Boolean).join(" ");
}

export function AddressSearch({
  onSelect,
  near,
  limit = 8,
  placeholder,
  ariaLabel,
  id,
  defaultTerm = "",
  autoFocus = false,
  className,
  inputClassName,
  listClassName,
}: AddressSearchProps) {
  const { t } = useTranslation();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [term, setTerm] = useState(defaultTerm);
  const [touched, setTouched] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const debouncedTerm = useDebouncedValue(term, 300);
  const statusQuery = useGeocodingStatus();
  const ready = statusQuery.data?.ready !== false;

  const searchQuery = useAddressSearch(
    {
      q: debouncedTerm,
      limit,
      lat: near ? near[1] : undefined,
      lon: near ? near[0] : undefined,
    },
    ready && touched
  );

  const results = searchQuery.data ?? [];
  const trimmed = debouncedTerm.trim();
  const tooShort = trimmed.length < ORS_SEARCH_MIN_CHARS;
  const searching = searchQuery.isFetching && !tooShort;

  const select = (result: AddressResult) => {
    onSelect(result);
    setTerm(result.label);
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
  };

  const clear = () => {
    setTerm("");
    setTouched(true);
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (results.length === 0) return;
      event.preventDefault();
      setOpen(true);
      setActiveIndex((prev) => {
        const step = event.key === "ArrowDown" ? 1 : -1;
        const next = prev + step;
        if (next < 0) return results.length - 1;
        if (next >= results.length) return 0;
        return next;
      });
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const target = results[activeIndex] ?? results[0];
      if (open && target) select(target);
      else if (results.length > 0) setOpen(true);
    }
  };

  const activeId =
    open && activeIndex >= 0 && activeIndex < results.length
      ? `${listId}-opt-${activeIndex}`
      : undefined;

  const message = !ready
    ? t("address.unavailable")
    : searchQuery.isError
      ? isOrsUnavailable(searchQuery.error)
        ? t("address.unavailable")
        : t("address.failed")
      : tooShort
        ? t("address.minChars", { count: ORS_SEARCH_MIN_CHARS })
        : searching
          ? t("address.searching")
          : results.length === 0
            ? t("address.noResults")
            : null;

  return (
    <div
      className={cn("relative", className)}
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
          return;
        }
        setOpen(false);
        setActiveIndex(-1);
      }}
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          id={id}
          autoFocus={autoFocus}
          value={term}
          onChange={(event) => {
            setTerm(event.target.value);
            setTouched(true);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => {
            if (touched) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? t("address.placeholder")}
          aria-label={ariaLabel ?? t("address.search")}
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={activeId}
          aria-autocomplete="list"
          role="combobox"
          autoComplete="off"
          enterKeyHint="search"
          className={cn(
            "min-h-11 bg-background pl-9 pr-10 shadow-md lg:min-h-10",
            inputClassName
          )}
        />
        {term && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 size-10 -translate-y-1/2 lg:size-8"
            onClick={clear}
            aria-label={t("common.close")}
          >
            {searching ? <Loader2 className="animate-spin" /> : <X />}
          </Button>
        )}
      </div>

      {open && term.trim() !== "" && (
        <div
          className={cn(
            "absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-y-auto overscroll-contain rounded-md border border-border bg-popover text-popover-foreground shadow-lg",
            listClassName
          )}
        >
          <div id={listId} role="listbox">
          {results.map((result, index) => {
            const distance = formatDistance(result.distanceMeters);
            return (
              <button
                key={`${result.label}-${result.lat}-${result.lon}-${index}`}
                id={`${listId}-opt-${index}`}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => select(result)}
                className={cn(
                  "flex w-full items-start gap-2 border-b border-border px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-accent hover:text-accent-foreground",
                  index === activeIndex && "bg-accent text-accent-foreground"
                )}
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{result.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {secondaryLine(result)}
                  </span>
                </span>
                {distance && (
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {distance}
                  </span>
                )}
              </button>
            );
          })}
          </div>

          {message && (
            <p className="px-3 py-2.5 text-xs text-muted-foreground">
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
