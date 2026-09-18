import { Navigate, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { ApiError } from "@/lib/api-error";
import { useClientByCip } from "@/features/clients";

export function ClientByCipPage() {
  const { t } = useTranslation();
  const { cip } = useParams<{ cip: string }>();
  const { search, hash } = useLocation();
  const clientQuery = useClientByCip(cip);

  if (clientQuery.data) {
    return (
      <Navigate
        to={`/app/clients/${encodeURIComponent(clientQuery.data.id)}${search}${hash}`}
        replace
      />
    );
  }

  const notFound =
    clientQuery.isError &&
    clientQuery.error instanceof ApiError &&
    clientQuery.error.status === 404;

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title={notFound ? t("clients.errors.notFound") : t("clients.title")}
        backFallback="/app/clients"
      />
      {clientQuery.isLoading ? (
        <LoadingState />
      ) : notFound ? (
        <EmptyState
          message={t("clients.errors.notFoundDesc")}
          icon={<Building2 className="size-8" />}
        />
      ) : (
        <ErrorState
          error={clientQuery.error}
          retrying={clientQuery.isFetching}
          onRetry={() => void clientQuery.refetch()}
        />
      )}
    </div>
  );
}
