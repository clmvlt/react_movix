import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Search, TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/pagination";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { cn } from "@/lib/utils";
import {
  CLIENT_PICKER_SIZE,
  CLIENT_QUERY_MAX_WORDS,
  clientLabel,
  clientPlace,
  isPharmacyClient,
  useClientSearch,
  type Client,
  type ClientSearchInput,
  type ClientType,
} from "@/features/clients";
import { ClientTypeIcon } from "./client-type-icon";

interface ClientSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (client: Client) => void;
  title?: string;
  description?: string;
  type?: ClientType;
}

export function ClientSearchDialog({
  open,
  onOpenChange,
  onSelect,
  title,
  description,
  type,
}: ClientSearchDialogProps) {
  const { t } = useTranslation();
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(1);

  const query = useDebouncedValue(term.trim(), 250);

  useEffect(() => {
    if (open) return;
    setTerm("");
    setPage(1);
  }, [open]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const input = useMemo<ClientSearchInput | null>(() => {
    if (!open) return null;
    const criteria: ClientSearchInput = {
      page: page - 1,
      size: CLIENT_PICKER_SIZE,
    };
    if (type) criteria.type = type;
    if (query) {
      criteria.query = query
        .split(/\s+/)
        .slice(0, CLIENT_QUERY_MAX_WORDS)
        .join(" ");
    }
    return criteria;
  }, [open, page, query, type]);

  const searchQuery = useClientSearch(input);
  const results = searchQuery.data?.content ?? [];

  const message = searchQuery.isPending
    ? t("clients.picker.loading")
    : searchQuery.isError
      ? t("clients.errors.loadFailed")
      : results.length === 0
        ? t("clients.picker.noResults")
        : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-3 sm:gap-4">
        <DialogHeader>
          <DialogTitle>{title ?? t("clients.search.title")}</DialogTitle>
          <DialogDescription>
            {description ?? t("clients.search.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder={t("clients.search.placeholder")}
            aria-label={t("clients.search.placeholder")}
            autoComplete="off"
            className="min-h-11 pl-9 pr-10 lg:min-h-10"
          />
          {term && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 size-9 -translate-y-1/2 lg:size-8"
              onClick={() => setTerm("")}
              aria-label={t("clients.picker.clear")}
            >
              {searchQuery.isFetching ? (
                <Loader2 className="animate-spin" />
              ) : (
                <X />
              )}
            </Button>
          )}
        </div>

        <div className="flex min-h-0 flex-col rounded-md border border-border">
          <div className="max-h-[50dvh] min-h-40 overflow-y-auto">
            {results.map((client) => {
              const place = clientPlace(client);
              const cip = isPharmacyClient(client) ? client.cip : null;
              const code = client.code?.trim() || null;
              const secondary = [code, cip, place].filter(Boolean).join(" - ");
              return (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => {
                    onSelect(client);
                    onOpenChange(false);
                  }}
                  className={cn(
                    "flex min-h-11 w-full items-center gap-2 border-b border-border px-3 py-2 text-left transition-colors last:border-b-0",
                    "hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:outline-none"
                  )}
                >
                  <ClientTypeIcon
                    type={client.type}
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">
                      {clientLabel(client)}
                    </span>
                    {secondary && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {secondary}
                      </span>
                    )}
                  </span>
                  {client.missingFields.length > 0 && (
                    <TriangleAlert
                      className="size-4 shrink-0 text-status-warning-strong"
                      aria-label={t("clients.incomplete")}
                    />
                  )}
                </button>
              );
            })}

            {message && (
              <p className="px-3 py-3 text-sm text-muted-foreground">
                {message}
              </p>
            )}
          </div>

          <Pagination
            page={page}
            onPageChange={setPage}
            totalPages={searchQuery.data?.totalPages}
            totalElements={searchQuery.data?.totalElements}
            count={results.length}
            isFetching={searchQuery.isFetching}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
