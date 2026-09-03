import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FormSaveBarProps {
  dirty: boolean;
  pending: boolean;
  onCancel: () => void;
  onSave?: () => void;
  formId?: string;
  saveDisabled?: boolean;
  saveLabel?: string;
  cancelLabel?: string;
  status?: ReactNode;
  className?: string;
}

export function FormSaveBar({
  dirty,
  pending,
  onCancel,
  onSave,
  formId,
  saveDisabled = false,
  saveLabel,
  cancelLabel,
  status,
  className,
}: FormSaveBarProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 -mx-4 -mb-6 flex items-center gap-2 border-t border-border bg-card px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_12px_-6px_rgba(0,0,0,0.15)] sm:-mx-6 sm:-mb-8 sm:px-6 lg:mx-0 lg:justify-end lg:rounded-t-xl lg:border-x",
        className
      )}
    >
      {status != null && (
        <div className="hidden min-w-0 flex-1 text-xs text-muted-foreground lg:block">
          {status}
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        className="min-h-11 flex-1 lg:min-h-10 lg:flex-none"
        disabled={pending}
        onClick={onCancel}
      >
        {cancelLabel ?? t("common.cancel")}
      </Button>
      <Button
        type={formId ? "submit" : "button"}
        form={formId}
        className="min-h-11 flex-[2] lg:min-h-10 lg:flex-none"
        disabled={!dirty || pending || saveDisabled}
        onClick={formId ? undefined : onSave}
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        {saveLabel ?? t("common.save")}
      </Button>
    </div>
  );
}
