import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AccountDeletionResult } from "@/features/admin-accounts";

const COMPANIES_PATH = "/app/hyperadmin?tab=companies";

export function AccountDeletionResultCard({
  result,
}: {
  result: AccountDeletionResult;
}) {
  const { t, i18n } = useTranslation();
  const format = new Intl.NumberFormat(i18n.language);
  const rows = Object.entries(result.deletedRows ?? {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <CheckCircle2 className="size-5 shrink-0 text-status-success-strong" />
          {t("hyperadmin.companies.confirm.doneTitle")}
        </CardTitle>
        <CardDescription>
          {t("hyperadmin.companies.confirm.doneSubtitle", {
            societe: result.societe ?? "",
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-xs uppercase text-muted-foreground">
              {t("hyperadmin.companies.confirm.totalRows")}
            </p>
            <p className="text-2xl font-semibold tabular-nums text-foreground">
              {format.format(result.totalDeletedRows)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-xs uppercase text-muted-foreground">
              {t("hyperadmin.companies.confirm.filesDeleted")}
            </p>
            <p className="text-2xl font-semibold tabular-nums text-foreground">
              {format.format(result.filesDeleted)}
            </p>
          </div>
        </div>

        {rows.length > 0 && (
          <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
            <ul className="divide-y divide-border">
              {rows.map(([table, count]) => (
                <li
                  key={table}
                  className="flex items-baseline justify-between gap-3 px-3 py-2 text-xs"
                >
                  <span className="min-w-0 truncate font-mono text-muted-foreground">
                    {table}
                  </span>
                  <span className="shrink-0 font-medium tabular-nums text-foreground">
                    {format.format(count)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button asChild className="min-h-11 lg:min-h-10">
          <Link to={COMPANIES_PATH}>
            {t("hyperadmin.companies.backToList")}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
