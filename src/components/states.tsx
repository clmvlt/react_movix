import type { ReactNode } from "react";
import { AlertCircle, Inbox } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InlineSpinner } from "@/components/full-page-spinner";
import { cn } from "@/lib/utils";

export function LoadingState() {
  return <InlineSpinner />;
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <Alert variant="destructive" className="flex flex-col gap-3">
      <AlertCircle />
      <div>
        <AlertTitle>{t("common.error")}</AlertTitle>
        <AlertDescription>{t("errors.loadFailed")}</AlertDescription>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="w-fit">
          {t("common.retry")}
        </Button>
      )}
    </Alert>
  );
}

export function EmptyState({
  message,
  icon,
  className,
}: {
  message: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6 py-16 text-center text-muted-foreground",
        className
      )}
    >
      {icon ?? <Inbox className="size-8" />}
      <p className="text-sm">{message}</p>
    </div>
  );
}
