import { useState, type ReactNode } from "react";
import { AlertCircle, Inbox, Loader2, RefreshCw, WifiOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { InlineSpinner } from "@/components/full-page-spinner";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { apiErrorText, isNetworkError } from "@/lib/api-error";
import { cn } from "@/lib/utils";

export function LoadingState({
  className,
  label,
}: Readonly<{ className?: string; label?: string }>) {
  return <InlineSpinner className={className} label={label} />;
}

interface ErrorStateProps {
  onRetry?: () => void | Promise<unknown>;
  error?: unknown;
  retrying?: boolean;
  className?: string;
}

export function ErrorState({
  onRetry,
  error,
  retrying = false,
  className,
}: Readonly<ErrorStateProps>) {
  const { t } = useTranslation();
  const online = useOnlineStatus();
  const [busy, setBusy] = useState(false);
  const network = !online || isNetworkError(error);
  const pending = retrying || busy;

  const handleRetry = async () => {
    if (!onRetry || pending) return;
    setBusy(true);
    try {
      await onRetry();
    } finally {
      setBusy(false);
    }
  };

  let title = t("common.error");
  let description = apiErrorText(error) ?? t("errors.loadFailed");
  if (!online) {
    title = t("errors.network.offlineTitle");
    description = t("errors.network.offlineDescription");
  } else if (network) {
    title = t("errors.network.title");
    description = t("errors.network.description");
  }
  const Icon = network ? WifiOff : AlertCircle;

  return (
    <div
      role="alert"
      className={cn(
        "flex w-full flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border p-6 py-12 text-center",
        className
      )}
    >
      <span
        className={cn(
          "flex size-12 items-center justify-center rounded-full",
          network
            ? "bg-status-warning-bg text-status-warning-strong"
            : "bg-destructive/10 text-destructive"
        )}
      >
        <Icon className="size-6" aria-hidden />
      </span>
      <div className="flex max-w-md flex-col gap-1">
        <p className="text-base font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          onClick={() => void handleRetry()}
          disabled={pending}
          className="min-h-11 lg:min-h-10"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          {pending ? t("common.retrying") : t("common.retry")}
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  message,
  icon,
  action,
  className,
}: {
  message: string;
  icon?: ReactNode;
  action?: ReactNode;
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
      {action}
    </div>
  );
}
