import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Building2,
  CircleCheck,
  CircleSlash,
  ImageOff,
  LayoutGrid,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ViewSwitch } from "@/components/view-switch";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { AccountDeleteDialog } from "@/components/hyperadmin/account-delete-dialog";
import { AccountStatusDialog } from "@/components/hyperadmin/account-status-dialog";
import { useHyperError } from "@/components/hyperadmin/use-hyper-error";
import { formatDate } from "@/lib/date";
import { imageUrl } from "@/lib/images";
import { cn } from "@/lib/utils";
import {
  isUnlimitedProfiles,
  useAdminAccounts,
  type AdminAccount,
} from "@/features/admin-accounts";

type StatusFilter = "all" | "active" | "inactive";

function parseStatus(raw: string | null): StatusFilter {
  return raw === "active" || raw === "inactive" ? raw : "all";
}

function matches(account: AdminAccount, needle: string): boolean {
  if (!needle) return true;
  return [account.societe, account.code, account.city]
    .filter((part): part is string => Boolean(part))
    .some((part) => part.toLowerCase().includes(needle));
}

export function HyperCompaniesPanel() {
  const { t } = useTranslation();
  const errorMessage = useHyperError();
  const [searchParams, setSearchParams] = useSearchParams();
  const accountsQuery = useAdminAccounts();

  const [deleteTarget, setDeleteTarget] = useState<AdminAccount | null>(null);
  const [statusTarget, setStatusTarget] = useState<AdminAccount | null>(null);

  const query = searchParams.get("q") ?? "";
  const status = parseStatus(searchParams.get("state"));

  const setParam = (key: string, value: string) => {
    setSearchParams(
      (previous) => {
        const params = new URLSearchParams(previous);
        if (value) params.set(key, value);
        else params.delete(key);
        return params;
      },
      { replace: true }
    );
  };

  const accounts = accountsQuery.data ?? [];

  const activeCount = accounts.filter(
    (account) => account.isActive !== false
  ).length;
  const counts = {
    all: accounts.length,
    active: activeCount,
    inactive: accounts.length - activeCount,
  };

  const needle = query.trim().toLowerCase();
  const visible = accounts
    .filter((account) => matches(account, needle))
    .filter((account) => {
      if (status === "active") return account.isActive !== false;
      if (status === "inactive") return account.isActive === false;
      return true;
    })
    .sort((a, b) => a.societe.localeCompare(b.societe));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setParam("q", event.target.value)}
              placeholder={t("hyperadmin.companies.searchPlaceholder")}
              aria-label={t("hyperadmin.companies.searchPlaceholder")}
              className="min-h-11 pl-9 lg:min-h-10"
            />
          </div>
          <Button asChild className="min-h-11 shrink-0 lg:min-h-10">
            <Link to="/app/hyperadmin/companies/new">
              <Plus className="size-4" />
              <span className="hidden sm:inline">
                {t("hyperadmin.companies.createAction")}
              </span>
              <span className="sr-only sm:hidden">
                {t("hyperadmin.companies.createAction")}
              </span>
            </Link>
          </Button>
        </div>

        <ViewSwitch
          value={status}
          onChange={(next) => setParam("state", next === "all" ? "" : next)}
          items={[
            {
              value: "all",
              label: t("hyperadmin.companies.filters.all"),
              icon: LayoutGrid,
              count: counts.all,
            },
            {
              value: "active",
              label: t("hyperadmin.companies.filters.active"),
              icon: CircleCheck,
              count: counts.active,
            },
            {
              value: "inactive",
              label: t("hyperadmin.companies.filters.inactive"),
              icon: CircleSlash,
              count: counts.inactive,
            },
          ]}
        />
      </div>

      {accountsQuery.isLoading ? (
        <LoadingState />
      ) : accountsQuery.isError ? (
        <>
          <Alert variant="warning">
            <AlertDescription>
              {errorMessage(
                accountsQuery.error,
                "hyperadmin.companies.errors.loadFailed"
              )}
            </AlertDescription>
          </Alert>
          <ErrorState
            error={accountsQuery.error}
            retrying={accountsQuery.isFetching}
            onRetry={() => void accountsQuery.refetch()}
          />
        </>
      ) : visible.length === 0 ? (
        <EmptyState
          message={
            accounts.length === 0
              ? t("hyperadmin.companies.empty")
              : t("hyperadmin.companies.noResults")
          }
          icon={<Building2 className="size-8" />}
          action={
            accounts.length === 0 ? (
              <Button asChild className="min-h-11 lg:min-h-10">
                <Link to="/app/hyperadmin/companies/new">
                  <Plus className="size-4" />
                  {t("hyperadmin.companies.createAction")}
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {visible.map((account) => (
            <CompanyRow
              key={account.id}
              account={account}
              onToggleStatus={() => setStatusTarget(account)}
              onDelete={() => setDeleteTarget(account)}
            />
          ))}
        </ul>
      )}

      <AccountStatusDialog
        target={
          statusTarget
            ? {
                id: statusTarget.id,
                societe: statusTarget.societe,
                isActive: statusTarget.isActive !== false,
              }
            : null
        }
        onClose={() => setStatusTarget(null)}
      />

      <AccountDeleteDialog
        target={
          deleteTarget
            ? { id: deleteTarget.id, societe: deleteTarget.societe }
            : null
        }
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function CompanyRow({
  account,
  onToggleStatus,
  onDelete,
}: {
  account: AdminAccount;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  const { t, i18n } = useTranslation();
  const active = account.isActive !== false;
  const logo = imageUrl(account.logoUrl);
  const editPath = `/app/hyperadmin/companies/${account.id}`;

  const secondary = [
    account.city,
    account.createdAt
      ? t("hyperadmin.companies.createdOn", {
          date: formatDate(account.createdAt, i18n.language),
        })
      : null,
    isUnlimitedProfiles(account.maxProfiles)
      ? t("hyperadmin.companies.quotaUnlimited")
      : t("hyperadmin.companies.quotaValue", { count: account.maxProfiles ?? 0 }),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border bg-card p-3",
        !active && "border-dashed"
      )}
    >
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted",
          !active && "opacity-60"
        )}
      >
        {logo ? (
          <img
            src={logo}
            alt=""
            className="size-full object-contain"
            loading="lazy"
          />
        ) : (
          <ImageOff className="size-4 text-muted-foreground" aria-hidden />
        )}
      </span>

      <Link
        to={editPath}
        className="flex min-w-0 flex-1 flex-col rounded-md py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground">
            {account.societe}
          </span>
          {!active && (
            <Badge variant="outline" className="shrink-0 text-destructive">
              {t("hyperadmin.companies.filters.inactive")}
            </Badge>
          )}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {secondary}
        </span>
        {account.code && (
          <span className="mt-1 font-mono text-xs tabular-nums text-muted-foreground">
            {t("hyperadmin.companies.codeShort", { code: account.code })}
          </span>
        )}
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 shrink-0 lg:size-9"
            aria-label={t("hyperadmin.companies.rowActions", {
              societe: account.societe,
            })}
          >
            <MoreVertical className="size-5 lg:size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild className="min-h-11 lg:min-h-9">
            <Link to={editPath}>
              <Pencil className="size-4" />
              {t("common.edit")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="min-h-11 lg:min-h-9"
            onSelect={onToggleStatus}
          >
            {active ? (
              <CircleSlash className="size-4" />
            ) : (
              <CircleCheck className="size-4" />
            )}
            {active
              ? t("hyperadmin.companies.status.disableAction")
              : t("hyperadmin.companies.status.enableAction")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="min-h-11 text-destructive lg:min-h-9"
            onSelect={onDelete}
          >
            <Trash2 className="size-4" />
            {t("hyperadmin.companies.delete.action")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
