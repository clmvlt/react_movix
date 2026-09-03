import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatBar } from "@/components/dashboard/stat-bar";
import { getStatusTokens, type StatusCategory } from "@/lib/colors";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  to: string;
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: StatusCategory;
  bar?: { value: number; max: number; category?: StatusCategory };
}

export function KpiCard({
  to,
  label,
  value,
  hint,
  icon: Icon,
  tone,
  bar,
}: KpiCardProps) {
  const tokens = tone ? getStatusTokens(tone) : null;

  return (
    <Link to={to} className="group block">
      <Card className="h-full transition-colors group-hover:border-primary/40 group-hover:bg-accent/40">
        <CardContent className="flex h-full flex-col gap-3 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p
                className={cn(
                  "mt-1 text-2xl font-semibold tabular-nums",
                  !tokens && "text-foreground"
                )}
                style={tokens ? { color: tokens.strong } : undefined}
              >
                {value}
              </p>
            </div>
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-lg"
              style={
                tokens
                  ? { backgroundColor: tokens.badgeBg, color: tokens.badgeText }
                  : undefined
              }
            >
              <Icon
                className={cn("size-5", !tokens && "text-muted-foreground")}
              />
            </span>
          </div>

          {bar && <StatBar {...bar} />}

          {hint && (
            <p className="mt-auto truncate text-xs text-muted-foreground">
              {hint}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
