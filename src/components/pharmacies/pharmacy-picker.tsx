import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Building2, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PharmacyTag } from "@/components/pharmacies/pharmacy-tag";
import { DeliveryWindowBadge } from "@/components/delivery-window-badge";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { cn } from "@/lib/utils";
import { usePharmacySearch, type Pharmacy } from "@/features/pharmacies";

const MIN_TERM_LENGTH = 2;
const RESULT_SIZE = 6;

interface PharmacyPickerProps {
  id: string;
  value: string;
  selected: Pharmacy | null;
  onSelect: (pharmacy: Pharmacy | null) => void;
  disabled?: boolean;
  invalid?: boolean;
  loading?: boolean;
}

export function PharmacyPicker({
  id,
  value,
  selected,
  onSelect,
  disabled = false,
  invalid = false,
  loading = false,
}: PharmacyPickerProps) {
  const { t } = useTranslation();
  const [term, setTerm] = useState("");
  const debounced = useDebouncedValue(term, 300);
  const query = debounced.trim();

  const search = usePharmacySearch(
    !disabled && !selected && query.length >= MIN_TERM_LENGTH
      ? { query, page: 0, size: RESULT_SIZE }
      : null
  );

  const results = search.data?.content ?? [];

  if (selected) {
    return (
      <div className="flex min-h-11 items-center gap-2 rounded-md border border-input bg-background px-3 py-2 lg:min-h-10">
        <Building2 className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-sm text-foreground">
          {selected.name || value}
          <span className="ml-2 text-xs tabular-nums text-muted-foreground">
            {selected.cip}
          </span>
        </span>
        {!disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={() => {
              setTerm("");
              onSelect(null);
            }}
            title={t("pharmacies.picker.clear")}
            aria-label={t("pharmacies.picker.clear")}
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          value={term}
          disabled={disabled || loading}
          onChange={(event) => setTerm(event.target.value)}
          placeholder={t("pharmacies.picker.placeholder")}
          autoComplete="off"
          className={cn(
            "min-h-11 pl-9 lg:min-h-10",
            invalid && "border-destructive"
          )}
        />
        {(search.isFetching || loading) && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {query.length >= MIN_TERM_LENGTH && !search.isLoading && (
        <ul className="max-h-56 overflow-y-auto rounded-md border">
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              {t("pharmacies.picker.none")}
            </li>
          ) : (
            results.map((pharmacy) => (
              <li key={pharmacy.id}>
                <button
                  type="button"
                  onClick={() => onSelect(pharmacy)}
                  className="flex min-h-11 w-full flex-col items-start gap-0.5 px-3 py-2 text-left transition-colors hover:bg-accent/50"
                >
                  <span className="flex w-full items-center gap-1.5">
                    <span className="min-w-0 truncate text-sm text-foreground">
                      {pharmacy.name || pharmacy.cip}
                    </span>
                    <PharmacyTag
                      color={pharmacy.color}
                      numero={pharmacy.numero}
                    />
                    <DeliveryWindowBadge
                      start={pharmacy.deliveryWindowStart}
                      end={pharmacy.deliveryWindowEnd}
                    />
                  </span>
                  <span className="w-full truncate text-xs text-muted-foreground">
                    {[pharmacy.cip, pharmacy.postalCode, pharmacy.city]
                      .filter(Boolean)
                      .join(" - ")}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
