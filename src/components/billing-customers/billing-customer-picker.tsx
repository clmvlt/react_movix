import { useId, useRef, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Plus, Search, TriangleAlert, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { cn } from "@/lib/utils";
import {
  useBillingCustomers,
  type BillingCustomer,
} from "@/features/billing-customers";
import { BillingCustomerFormDialog } from "./billing-customer-form-dialog";

export interface BillingCustomerOption {
  id: string;
  name: string;
}

interface BillingCustomerPickerProps {
  value: BillingCustomerOption | null;
  onChange: (customer: BillingCustomer | null) => void;
  id?: string;
  disabled?: boolean;
  invalid?: boolean;
  allowCreate?: boolean;
  inlineResults?: boolean;
  placeholder?: string;
  className?: string;
}

export function BillingCustomerPicker({
  value,
  onChange,
  id,
  disabled,
  invalid,
  allowCreate = true,
  inlineResults = false,
  placeholder,
  className,
}: BillingCustomerPickerProps) {
  const { t } = useTranslation();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");

  const search = useDebouncedValue(term, 250);
  const customersQuery = useBillingCustomers(search, open);
  const results = customersQuery.data ?? [];

  const close = () => {
    setOpen(false);
    setActiveIndex(-1);
    setTerm("");
  };

  const select = (customer: BillingCustomer) => {
    onChange(customer);
    close();
    inputRef.current?.blur();
  };

  const startCreate = () => {
    setCreateName(term.trim());
    close();
    setCreateOpen(true);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      if (open) event.stopPropagation();
      close();
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (results.length === 0) return;
      event.preventDefault();
      setOpen(true);
      setActiveIndex((previous) => {
        const next = previous + (event.key === "ArrowDown" ? 1 : -1);
        if (next < 0) return results.length - 1;
        if (next >= results.length) return 0;
        return next;
      });
      return;
    }
    if (event.key === "Enter" && open) {
      const target = results[activeIndex] ?? results[0];
      if (target) {
        event.preventDefault();
        select(target);
      }
    }
  };

  const displayValue = open || term ? term : (value?.name ?? "");

  const message = customersQuery.isPending
    ? t("billingCustomers.picker.loading")
    : customersQuery.isError
      ? t("billingCustomers.errors.loadFailed")
      : results.length === 0
        ? t("billingCustomers.picker.noResults")
        : null;

  return (
    <div
      className={cn("relative", className)}
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
          return;
        }
        close();
      }}
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          id={id}
          value={displayValue}
          disabled={disabled}
          onChange={(event) => {
            setTerm(event.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? t("billingCustomers.picker.placeholder")}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-invalid={invalid || undefined}
          aria-describedby={id ? `${id}-message` : undefined}
          role="combobox"
          autoComplete="off"
          className={cn(
            "min-h-11 pl-9 pr-10 lg:min-h-10",
            invalid && "border-destructive"
          )}
        />
        {(value || term) && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 size-9 -translate-y-1/2 lg:size-8"
            onClick={() => {
              onChange(null);
              setTerm("");
              inputRef.current?.focus();
            }}
            aria-label={t("billingCustomers.picker.clear")}
          >
            {customersQuery.isFetching && open ? (
              <Loader2 className="animate-spin" />
            ) : (
              <X />
            )}
          </Button>
        )}
      </div>

      {open && (
        <div
          id={listId}
          role="listbox"
          className={cn(
            "max-h-72 overflow-y-auto rounded-md border border-border bg-popover text-popover-foreground",
            inlineResults
              ? "mt-1"
              : "absolute inset-x-0 top-full z-20 mt-1 shadow-lg"
          )}
        >
          {results.map((customer, index) => (
            <button
              key={customer.id}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => select(customer)}
              className={cn(
                "flex min-h-11 w-full items-center gap-2 border-b border-border px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-accent hover:text-accent-foreground",
                index === activeIndex && "bg-accent text-accent-foreground"
              )}
            >
              <UserRound className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{customer.name}</span>
                {(customer.city || customer.postalCode) && (
                  <span className="block truncate text-xs text-muted-foreground">
                    {[customer.postalCode, customer.city]
                      .filter(Boolean)
                      .join(" ")}
                  </span>
                )}
              </span>
              {customer.missingFields.length > 0 && (
                <TriangleAlert
                  className="size-4 shrink-0 text-status-warning-strong"
                  aria-label={t("billingCustomers.incomplete")}
                />
              )}
            </button>
          ))}

          {message && (
            <p className="px-3 py-2.5 text-xs text-muted-foreground">
              {message}
            </p>
          )}

          {allowCreate && (
            <button
              type="button"
              onClick={startCreate}
              className="flex min-h-11 w-full items-center gap-2 border-t border-border px-3 py-2 text-left text-sm font-medium text-primary transition-colors hover:bg-accent"
            >
              <Plus className="size-4 shrink-0" />
              <span className="truncate">
                {term.trim()
                  ? t("billingCustomers.picker.createNamed", {
                      name: term.trim(),
                    })
                  : t("billingCustomers.picker.create")}
              </span>
            </button>
          )}
        </div>
      )}

      {allowCreate && (
        <BillingCustomerFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          customer={null}
          initialName={createName}
          onSaved={(customer) => onChange(customer)}
        />
      )}
    </div>
  );
}
