import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  DELETION_COUNT_KEYS,
  deletionTotal,
  type AccountDeletionPreview,
} from "@/features/admin-accounts";

export function AccountDeletionCounts({
  preview,
  className,
}: {
  preview: AccountDeletionPreview;
  className?: string;
}) {
  const { t, i18n } = useTranslation();
  const format = new Intl.NumberFormat(i18n.language);
  const total = deletionTotal(preview);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <p className="text-sm text-foreground">
        {t("hyperadmin.companies.delete.impact", {
          count: total,
          total: format.format(total),
        })}
      </p>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
        {DELETION_COUNT_KEYS.map((key) => {
          const value = preview[key] ?? 0;
          return (
            <li
              key={key}
              className={cn(
                "flex items-baseline justify-between gap-2 border-b border-border py-1 text-xs",
                value === 0 && "text-muted-foreground"
              )}
            >
              <span className="min-w-0 truncate">
                {t(`hyperadmin.companies.delete.counts.${key}`)}
              </span>
              <span className="shrink-0 font-medium tabular-nums">
                {format.format(value)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
