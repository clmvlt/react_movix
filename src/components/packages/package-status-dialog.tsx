import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/app/toast-context";
import { apiErrorText } from "@/lib/api-error";
import { getStatusTokens } from "@/lib/colors";
import { packageStatusCategory } from "@/lib/status";
import { commandKeys } from "@/features/commands";
import { PACKAGE_STATUSES, useUpdatePackageStatus } from "@/features/packages";

interface PackageStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barcodes: string[];
  label?: string;
  onDone?: () => void;
}

export function PackageStatusDialog({
  open,
  onOpenChange,
  barcodes,
  label,
  onDone,
}: PackageStatusDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const updateStatus = useUpdatePackageStatus();
  const toast = useToast();

  const close = (next: boolean) => {
    if (updateStatus.isPending) return;
    onOpenChange(next);
  };

  const apply = (statusId: number) => {
    updateStatus.mutate(
      { statusId, barcodes },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: commandKeys.all });
          onOpenChange(false);
          onDone?.();
        },
        onError: (cause) =>
          toast.error(apiErrorText(cause) ?? t("packages.status.failed")),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("packages.status.title")}</DialogTitle>
          <DialogDescription className="tabular-nums">
            {label ?? t("packages.status.subtitle", { count: barcodes.length })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {PACKAGE_STATUSES.map((status) => (
            <Button
              key={status.id}
              variant="outline"
              className="min-h-11 shrink-0 justify-start gap-2.5 px-3 lg:min-h-10"
              disabled={updateStatus.isPending || barcodes.length === 0}
              onClick={() => apply(status.id)}
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: getStatusTokens(
                    packageStatusCategory(status.id)
                  ).strong,
                }}
              />
              <span className="truncate">{status.name}</span>
              {updateStatus.isPending &&
                updateStatus.variables?.statusId === status.id && (
                  <Loader2 className="ml-auto size-4 animate-spin" />
                )}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
