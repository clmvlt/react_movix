import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { Building2, Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAllAccounts } from "@/features/account";
import type { Account } from "@/features/auth";

interface AccountPickerProps {
  value: Account | null;
  onChange: (account: Account | null) => void;
  id?: string;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  excludeId?: string;
}

function accountLine(account: Account): string {
  return [account.societe, account.city].filter(Boolean).join(" - ");
}

export function AccountPicker({
  value,
  onChange,
  id,
  placeholder,
  ariaLabel,
  className,
  excludeId,
}: AccountPickerProps) {
  const { t } = useTranslation();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const accountsQuery = useAllAccounts();

  const results = useMemo(() => {
    const needle = term.trim().toLowerCase();
    return (accountsQuery.data ?? [])
      .filter((account) => account.id !== excludeId)
      .filter((account) =>
        needle
          ? [account.societe, account.city]
              .filter((part): part is string => Boolean(part))
              .some((part) => part.toLowerCase().includes(needle))
          : true
      )
      .sort((a, b) => a.societe.localeCompare(b.societe));
  }, [accountsQuery.data, term, excludeId]);

  const select = (account: Account) => {
    onChange(account);
    setTerm("");
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
  };

  const clear = () => {
    onChange(null);
    setTerm("");
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
      const target = results[activeIndex] ?? results[0];
      if (open && target) {
        event.preventDefault();
        select(target);
      }
    }
  };

  const message = accountsQuery.isPending
    ? t("hyperadmin.accounts.loading")
    : accountsQuery.isError
      ? t("hyperadmin.accounts.loadFailed")
      : results.length === 0
        ? t("hyperadmin.accounts.noResults")
        : null;

  const displayValue = open || term ? term : value ? accountLine(value) : "";

  return (
    <div
      className={cn("relative", className)}
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
          return;
        }
        setOpen(false);
        setActiveIndex(-1);
        setTerm("");
      }}
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          id={id}
          value={displayValue}
          onChange={(event) => {
            setTerm(event.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? t("hyperadmin.accounts.placeholder")}
          aria-label={ariaLabel ?? t("hyperadmin.accounts.search")}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          role="combobox"
          autoComplete="off"
          className="min-h-11 pl-9 pr-10 lg:min-h-10"
        />
        {(value || term) && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 size-9 -translate-y-1/2 lg:size-8"
            onClick={clear}
            aria-label={t("common.close")}
          >
            {accountsQuery.isFetching && open ? (
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
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-md border border-border bg-popover text-popover-foreground shadow-lg"
        >
          {results.map((account, index) => (
            <button
              key={account.id}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => select(account)}
              className={cn(
                "flex w-full items-center gap-2 border-b border-border px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-accent hover:text-accent-foreground",
                index === activeIndex && "bg-accent text-accent-foreground"
              )}
            >
              <Building2 className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{account.societe}</span>
                {account.city && (
                  <span className="block truncate text-xs text-muted-foreground">
                    {account.city}
                  </span>
                )}
              </span>
              {!account.isActive && (
                <Badge variant="outline" className="shrink-0">
                  {t("hyperadmin.accounts.inactive")}
                </Badge>
              )}
            </button>
          ))}

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
