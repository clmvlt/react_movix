import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export interface KpiTileProps {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
}

export function KpiTile({ label, value, hint, icon: Icon }: KpiTileProps) {
  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-bold break-words sm:text-2xl">
              {value || "-"}
            </p>
            {hint && (
              <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
            )}
          </div>
          {Icon && (
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Icon className="size-4 text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
