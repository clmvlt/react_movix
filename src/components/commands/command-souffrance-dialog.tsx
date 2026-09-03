import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, PackageX, TriangleAlert } from "lucide-react";
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
import { useSouffranceCommands } from "@/features/commands";
import { packageKeys } from "@/features/packages";
import { tourKeys } from "@/features/tours";

interface CommandSouffranceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commandIds: string[];
  onDone: () => void;
}

export function CommandSouffranceDialog({
  open,
  onOpenChange,
  commandIds,
  onDone,
}: CommandSouffranceDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const describeError = useCommandError();
  const souffrance = useSouffranceCommands();
  const toast = useToast();

  const close = (next: boolean) => {
    if (souffrance.isPending) return;
    onOpenChange(next);
  };

  const confirm = () => {
    souffrance.mutate(
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
          <DialogTitle>{t("souffrance.flag.title")}</DialogTitle>
          <DialogDescription>
            {t("souffrance.flag.subtitle", { count: commandIds.length })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Alert variant="warning">
            <TriangleAlert />
            <AlertDescription>
              <ul className="list-disc space-y-1 pl-4">
                <li>{t("souffrance.flag.warnTour")}</li>
                <li>{t("souffrance.flag.warnPackages")}</li>
                <li>{t("souffrance.flag.warnClosedTour")}</li>
              </ul>
            </AlertDescription>
          </Alert>

          {souffrance.isPending && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 shrink-0 animate-spin" />
              {t("souffrance.flag.pending")}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 lg:min-h-10"
            disabled={souffrance.isPending}
            onClick={() => close(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            className="min-h-11 lg:min-h-10"
            disabled={souffrance.isPending || commandIds.length === 0}
            onClick={confirm}
          >
            {souffrance.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <PackageX className="size-4" />
            )}
            {t("souffrance.flag.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
