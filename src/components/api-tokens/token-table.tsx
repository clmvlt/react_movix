import { useTranslation } from "react-i18next";
import { Building2, Lock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useIsBeta } from "@/components/beta-only";
import { useIsHyperadmin } from "@/components/admin-gate";
import { formatDateTime } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { ImporterToken } from "@/features/importer-tokens";
import { TokenValue } from "./token-value";
import { TokenActions } from "./token-actions";

interface TokenTableProps {
  tokens: ImporterToken[];
  pendingId: string | null;
  highlightId: string | null;
  onEdit: (token: ImporterToken) => void;
  onToggle: (token: ImporterToken) => void;
  onDelete: (token: ImporterToken) => void;
}

export function TokenTable({
  tokens,
  pendingId,
  highlightId,
  onEdit,
  onToggle,
  onDelete,
}: TokenTableProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language;
  const isHyperadmin = useIsHyperadmin();
  const showProxy = useIsBeta() || isHyperadmin;

  return (
    <div className="hidden w-full rounded-xl border border-border lg:block">
      <Table className={showProxy ? "min-w-[1080px]" : "min-w-[960px]"}>
        <TableHeader>
          <TableRow>
            <TableHead>{t("common.name")}</TableHead>
            <TableHead>{t("apiTokens.columns.token")}</TableHead>
            <TableHead>{t("common.status")}</TableHead>
            {showProxy && (
              <TableHead>{t("apiTokens.columns.betaProxy")}</TableHead>
            )}
            <TableHead>{t("apiTokens.columns.lastUsed")}</TableHead>
            <TableHead>{t("apiTokens.columns.createdAt")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tokens.map((token) => (
            <TableRow
              key={token.id}
              className={cn(highlightId === token.id && "bg-primary/5")}
            >
              <TableCell className="max-w-[240px] py-3">
                <p className="truncate font-medium text-foreground">
                  {token.name}
                </p>
                {token.description && (
                  <p className="truncate text-xs text-muted-foreground">
                    {token.description}
                  </p>
                )}
                {token.nonDeletable && (
                  <Badge variant="outline" className="mt-1 gap-1">
                    <Lock className="size-3" />
                    {t("apiTokens.managed")}
                  </Badge>
                )}
                {isHyperadmin && token.accountName && (
                  <Badge variant="outline" className="mt-1 gap-1">
                    <Building2 className="size-3" />
                    {token.accountName}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="w-[280px] py-3">
                <TokenValue token={token.token} />
              </TableCell>
              <TableCell className="py-3">
                <Badge variant={token.isActive ? "secondary" : "outline"}>
                  {token.isActive
                    ? t("apiTokens.status.active")
                    : t("apiTokens.status.inactive")}
                </Badge>
              </TableCell>
              {showProxy && (
                <TableCell className="py-3 text-muted-foreground">
                  {token.isBetaProxy ? (
                    <Badge variant="outline">{t("apiTokens.proxyOn")}</Badge>
                  ) : (
                    "-"
                  )}
                </TableCell>
              )}
              <TableCell className="py-3 text-sm text-muted-foreground">
                {formatDateTime(token.lastUsedAt, lang) ||
                  t("apiTokens.neverUsed")}
              </TableCell>
              <TableCell className="py-3 text-sm text-muted-foreground">
                {formatDateTime(token.createdAt, lang) || "-"}
              </TableCell>
              <TableCell className="py-3">
                <TokenActions
                  token={token}
                  pending={pendingId === token.id}
                  onEdit={onEdit}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  className="justify-end"
                  compact
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
