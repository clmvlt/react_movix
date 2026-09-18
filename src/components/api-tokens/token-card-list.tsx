import { useTranslation } from "react-i18next";
import { Building2, Lock, ReceiptText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useIsBeta } from "@/components/beta-only";
import { useIsHyperadmin } from "@/components/admin-gate";
import { formatDateTime } from "@/lib/date";
import { cn } from "@/lib/utils";
import { clientRefLabel } from "@/features/clients";
import type { ImporterToken } from "@/features/importer-tokens";
import { TokenValue } from "./token-value";
import { TokenActions } from "./token-actions";

interface TokenCardListProps {
  tokens: ImporterToken[];
  pendingId: string | null;
  highlightId: string | null;
  onEdit: (token: ImporterToken) => void;
  onToggle: (token: ImporterToken) => void;
  onDelete: (token: ImporterToken) => void;
}

export function TokenCardList({
  tokens,
  pendingId,
  highlightId,
  onEdit,
  onToggle,
  onDelete,
}: TokenCardListProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language;
  const isHyperadmin = useIsHyperadmin();
  const showProxy = useIsBeta() || isHyperadmin;

  return (
    <ul className="flex flex-col gap-3 lg:hidden">
      {tokens.map((token) => (
        <li
          key={token.id}
          className={cn(
            "flex flex-col gap-3 rounded-xl border border-border bg-card p-3",
            highlightId === token.id && "border-primary"
          )}
        >
          <div className="flex min-w-0 items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {token.name}
              </p>
              {token.description && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {token.description}
                </p>
              )}
              {token.client && (
                <Badge variant="outline" className="mt-1 max-w-full gap-1">
                  <ReceiptText className="size-3 shrink-0" />
                  <span className="truncate">
                    {clientRefLabel(token.client)}
                  </span>
                </Badge>
              )}
            </div>
            <Badge
              variant={token.isActive ? "secondary" : "outline"}
              className="shrink-0"
            >
              {token.isActive
                ? t("apiTokens.status.active")
                : t("apiTokens.status.inactive")}
            </Badge>
          </div>

          <TokenValue token={token.token} />

          <dl className="grid grid-cols-2 gap-2 text-xs">
            <div className="min-w-0">
              <dt className="text-muted-foreground">
                {t("apiTokens.columns.lastUsed")}
              </dt>
              <dd className="truncate text-foreground">
                {formatDateTime(token.lastUsedAt, lang) ||
                  t("apiTokens.neverUsed")}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-muted-foreground">
                {t("apiTokens.columns.createdAt")}
              </dt>
              <dd className="truncate text-foreground">
                {formatDateTime(token.createdAt, lang) || "-"}
              </dd>
            </div>
          </dl>

          {(showProxy && token.isBetaProxy) ||
          (isHyperadmin && token.accountName) ? (
            <div className="flex flex-wrap gap-1.5">
              {showProxy && token.isBetaProxy && (
                <Badge variant="outline" className="w-fit">
                  {t("apiTokens.proxyOn")}
                </Badge>
              )}
              {isHyperadmin && token.accountName && (
                <Badge variant="outline" className="w-fit gap-1">
                  <Building2 className="size-3" />
                  {token.accountName}
                </Badge>
              )}
            </div>
          ) : null}

          {token.nonDeletable && (
            <p className="flex items-start gap-1.5 rounded-lg bg-muted p-2 text-xs text-muted-foreground">
              <Lock className="mt-0.5 size-3.5 shrink-0" />
              {t("apiTokens.managedHint")}
            </p>
          )}

          <TokenActions
            token={token}
            pending={pendingId === token.id}
            onEdit={onEdit}
            onToggle={onToggle}
            onDelete={onDelete}
            className="justify-end border-t border-border pt-2"
          />
        </li>
      ))}
    </ul>
  );
}
