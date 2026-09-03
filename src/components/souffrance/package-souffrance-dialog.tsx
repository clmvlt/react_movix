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
import { useToast } from "@/app/toast-context";
import { usePackageError } from "@/components/souffrance/use-package-error";
import { commandKeys } from "@/features/commands";
import { useSouffrancePackages } from "@/features/packages";

interface PackageSouffranceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barcodes: string[];
  label?: string;
  onDone: () => void;
}

export function PackageSouffranceDialog({
  open,
  onOpenChange,
  barcodes,
  label,
  onDone,
}: PackageSouffranceDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const describeError = usePackageError();
  const souffrance = useSouffrancePackages();
  const toast = useToast();

  const close = (next: boolean) => {
    if (souffrance.isPending) return;
    onOpenChange(next);
  };

  const confirm = () => {
    souffrance.mutate(
      { barcodes },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: commandKeys.all });
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
          <DialogTitle>{t("souffrance.flagPackages.title")}</DialogTitle>
          <DialogDescription>
            {label ??
              t("souffrance.flagPackages.subtitle", { count: barcodes.length })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Alert variant="warning">
            <TriangleAlert />
            <AlertDescription>
              <ul className="list-disc space-y-1 pl-4">
                <li>{t("souffrance.flagPackages.warnCommand")}</li>
                <li>{t("souffrance.flagPackages.warnTrace")}</li>
              </ul>
            </AlertDescription>
          </Alert>
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
            disabled={souffrance.isPending || barcodes.length === 0}
            onClick={confirm}
          >
            {souffrance.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <PackageX className="size-4" />
            )}
            {t("souffrance.flagPackages.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
