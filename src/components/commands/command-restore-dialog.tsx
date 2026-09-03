import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, PackageCheck, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCommandError } from "@/components/commands/use-command-error";
import { useToast } from "@/app/toast-context";
import { useRestoreSouffranceCommands } from "@/features/commands";
import { packageKeys } from "@/features/packages";
import { tourKeys } from "@/features/tours";

interface CommandRestoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commandIds: string[];
  onDone: () => void;
}

export function CommandRestoreDialog({
  open,
  onOpenChange,
  commandIds,
  onDone,
}: CommandRestoreDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const describeError = useCommandError();
  const restore = useRestoreSouffranceCommands();
  const toast = useToast();

  const close = (next: boolean) => {
    if (restore.isPending) return;
    onOpenChange(next);
  };

  const confirm = () => {
    restore.mutate(
      { commandIds },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: tourKeys.all });
          void queryClient.invalidateQueries({ queryKey: packageKeys.all });
          onOpenChange(false);
          onDone();
        },
        onError: (cause) => toast.error(describeError(cause)),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("souffrance.restore.title")}</DialogTitle>
          <DialogDescription>
            {t("souffrance.restore.subtitleCommands", {
              count: commandIds.length,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Alert variant="warning">
            <TriangleAlert />
            <AlertDescription>
              <ul className="list-disc space-y-1 pl-4">
                <li>{t("souffrance.restore.warnTour")}</li>
                <li>{t("souffrance.restore.warnPackages")}</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 lg:min-h-10"
            disabled={restore.isPending}
            onClick={() => close(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            className="min-h-11 lg:min-h-10"
            disabled={restore.isPending || commandIds.length === 0}
            onClick={confirm}
          >
            {restore.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <PackageCheck className="size-4" />
            )}
            {t("souffrance.restore.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
