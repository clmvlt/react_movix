import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useBack } from "@/lib/use-back";

interface PageHeaderProps {
  title: string;
  titleExtra?: ReactNode;
  subtitle?: string;
  backFallback?: string;
  onBack?: () => void;
  actions?: ReactNode;
}

export function PageHeader({
  title,
  titleExtra,
  subtitle,
  backFallback,
  onBack,
  actions,
}: PageHeaderProps) {
  const { t } = useTranslation();
  const goBack = useBack(backFallback ?? "/app");
  const handleBack = onBack ?? goBack;

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {backFallback && (
          <Button
            variant="outline"
            size="icon"
            onClick={handleBack}
            aria-label={t("common.back")}
            className="mt-0.5 shrink-0"
          >
            <ArrowLeft className="size-4" />
          </Button>
        )}
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <h1 className="min-w-0 truncate text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            {titleExtra}
          </div>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:shrink-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {actions}
        </div>
      )}
    </div>
  );
}
