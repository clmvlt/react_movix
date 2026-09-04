import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { KeyRound, ListFilter, Plus, Power, PowerOff, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/page-header";
import { AdminGate } from "@/components/admin-gate";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { ViewSwitch } from "@/components/view-switch";
import { useTokenError } from "@/components/api-tokens/use-token-error";
import { useToast } from "@/app/toast-context";
import { TokenTable } from "@/components/api-tokens/token-table";
import { TokenCardList } from "@/components/api-tokens/token-card-list";
import { TokenFormDialog } from "@/components/api-tokens/token-form-dialog";
import { TokenDeleteDialog } from "@/components/api-tokens/token-delete-dialog";
import {
  matchesTokenSearch,
  useImporterTokens,
  useUpdateImporterToken,
  type ImporterToken,
} from "@/features/importer-tokens";

type StatusFilter = "all" | "active" | "inactive";

function parseStatus(raw: string | null): StatusFilter {
  return raw === "active" || raw === "inactive" ? raw : "all";
}

function ApiTokensContent() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const errorMessage = useTokenError();

  const q = searchParams.get("q") ?? "";
  const status = parseStatus(searchParams.get("status"));

  const tokensQuery = useImporterTokens();
  const updateToken = useUpdateImporterToken();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ImporterToken | null>(null);
  const [deleting, setDeleting] = useState<ImporterToken | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (!highlightId) return;
    const timer = window.setTimeout(() => setHighlightId(null), 6000);
    return () => window.clearTimeout(timer);
  }, [highlightId]);

  const setParam = (key: string, value: string, fallback: string) => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value && value !== fallback) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true }
    );
  };

  const tokens = useMemo(() => tokensQuery.data ?? [], [tokensQuery.data]);

  const counts = useMemo(
    () => ({
      all: tokens.length,
      active: tokens.filter((token) => token.isActive).length,
      inactive: tokens.filter((token) => !token.isActive).length,
    }),
    [tokens]
  );

  const rows = useMemo(
    () =>
      tokens
        .filter((token) =>
          status === "all"
            ? true
            : status === "active"
              ? token.isActive
              : !token.isActive
        )
        .filter((token) => matchesTokenSearch(token, q)),
    [tokens, status, q]
  );

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (token: ImporterToken) => {
    setEditing(token);
    setFormOpen(true);
  };

  const toggleActive = (token: ImporterToken) => {
    updateToken.mutate(
      { id: token.id, input: { isActive: !token.isActive } },
      {
        onError: (error) =>
          toast.error(errorMessage(error, "apiTokens.errors.saveFailed")),
      }
    );
  };

  const pendingId = updateToken.isPending
    ? (updateToken.variables?.id ?? null)
    : null;

  const listProps = {
    tokens: rows,
    pendingId,
    highlightId,
    onEdit: openEdit,
    onToggle: toggleActive,
    onDelete: setDeleting,
  };

  const renderList = () => {
    if (tokensQuery.isLoading) return <LoadingState />;
    if (tokensQuery.isError) {
      return (
        <>
          <Alert variant="warning" className="mb-4">
            <AlertDescription>
              {errorMessage(tokensQuery.error, "apiTokens.errors.loadFailed")}
            </AlertDescription>
          </Alert>
          <ErrorState
            error={tokensQuery.error}
            retrying={tokensQuery.isFetching}
            onRetry={() => void tokensQuery.refetch()}
          />
        </>
      );
    }
    if (tokens.length === 0) {
      return (
        <EmptyState
          message={t("apiTokens.empty")}
          icon={<KeyRound className="size-8" />}
          className="flex-1"
        />
      );
    }
    if (rows.length === 0) {
      return (
        <EmptyState
          message={t("apiTokens.noMatch")}
          icon={<ListFilter className="size-8" />}
          className="flex-1"
        />
      );
    }
    return (
      <>
        <TokenTable {...listProps} />
        <TokenCardList {...listProps} />
      </>
    );
  };

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title={t("apiTokens.title")}
        subtitle={t("apiTokens.subtitle")}
        actions={
          <Button className="min-h-11 lg:min-h-10" onClick={openCreate}>
            <Plus className="size-4" />
            <span className="hidden sm:inline">{t("apiTokens.create")}</span>
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(event) => setParam("q", event.target.value, "")}
            placeholder={t("apiTokens.searchPlaceholder")}
            aria-label={t("common.search")}
            className="min-h-11 pl-9 lg:min-h-10"
          />
        </div>
        <ViewSwitch
          className="shrink-0 sm:w-96"
          value={status}
          onChange={(next) => setParam("status", next, "all")}
          items={[
            {
              value: "all",
              label: t("common.all"),
              icon: ListFilter,
              count: counts.all,
            },
            {
              value: "active",
              label: t("apiTokens.status.active"),
              icon: Power,
              count: counts.active,
            },
            {
              value: "inactive",
              label: t("apiTokens.status.inactive"),
              icon: PowerOff,
              count: counts.inactive,
            },
          ]}
        />
      </div>

      {renderList()}

      <TokenFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        token={editing}
        onCreated={(created) => setHighlightId(created.id)}
      />
      <TokenDeleteDialog
        token={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      />
    </div>
  );
}

export function ApiTokensPage() {
  return (
    <AdminGate>
      <ApiTokensContent />
    </AdminGate>
  );
}
