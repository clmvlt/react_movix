import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrCode } from "@/components/qr-code";
import { cn } from "@/lib/utils";

interface StoreCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  qrValue: string | null;
  qrLabel: string;
  recommended?: boolean;
  meta?: ReactNode;
  note?: ReactNode;
  fallback?: ReactNode;
  action: ReactNode;
}

export function StoreCard({
  icon: Icon,
  title,
  description,
  qrValue,
  qrLabel,
  recommended = false,
  meta,
  note,
  fallback,
  action,
}: StoreCardProps) {
  const { t } = useTranslation();

  return (
    <Card
      className={cn(
        "flex h-full flex-col",
        recommended && "border-primary ring-1 ring-primary/30"
      )}
    >
      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold text-foreground">{title}</h2>
              {recommended && (
                <Badge variant="secondary">{t("mobileApp.recommended")}</Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        {meta}

        {qrValue ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-full max-w-[190px]">
              <QrCode value={qrValue} label={qrLabel} />
            </div>
            <p className="text-center text-xs text-muted-foreground">
              {t("mobileApp.scanHint")}
            </p>
          </div>
        ) : (
          fallback
        )}

        {note}

        <div className="mt-auto pt-1">{action}</div>
      </CardContent>
    </Card>
  );
}
