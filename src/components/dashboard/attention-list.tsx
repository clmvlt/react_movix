import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight, CircleCheck } from "lucide-react";
import { getStatusTokens, type StatusCategory } from "@/lib/colors";

export interface AttentionItem {
  id: string;
  to: string;
  label: string;
  count: number;
  category: StatusCategory;
}

export function AttentionList({ items }: { items: AttentionItem[] }) {
  const { t } = useTranslation();

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
        <CircleCheck
          className="size-8"
          style={{ color: getStatusTokens("success").strong }}
          aria-hidden
        />
        <p className="text-sm font-medium text-foreground">
          {t("dashboard.attention.empty")}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("dashboard.attention.emptyHint")}
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col">
      {items.map((item) => {
        const tokens = getStatusTokens(item.category);
        return (
          <li key={item.id}>
            <Link
              to={item.to}
              className="flex min-h-11 items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent lg:min-h-10"
            >
              <span
                className="flex h-6 min-w-8 shrink-0 items-center justify-center rounded-full px-2 text-xs font-semibold tabular-nums"
                style={{
                  backgroundColor: tokens.badgeBg,
                  color: tokens.badgeText,
                }}
              >
                {item.count}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                {item.label}
              </span>
              <ChevronRight
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
