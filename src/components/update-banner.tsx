import { useTranslation } from "react-i18next";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppUpdate } from "@/lib/use-app-update";

export function UpdateBanner() {
  const { t } = useTranslation();
  const { deployedVersion, updateAvailable, applyUpdate, dismiss } =
    useAppUpdate();

  if (!updateAvailable || !deployedVersion) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-96 sm:max-w-[calc(100vw-2rem)] sm:p-0">
      <div className="rounded-lg border border-border bg-card p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
            <RefreshCw className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              {t("appUpdate.title")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("appUpdate.description", { version: deployedVersion })}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-10 shrink-0 lg:size-8"
            onClick={dismiss}
            title={t("appUpdate.dismiss")}
            aria-label={t("appUpdate.dismiss")}
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            className="min-h-11 w-full sm:w-auto lg:min-h-10"
            onClick={applyUpdate}
          >
            <RefreshCw className="size-4" />
            {t("appUpdate.action")}
          </Button>
        </div>
      </div>
    </div>
  );
}
