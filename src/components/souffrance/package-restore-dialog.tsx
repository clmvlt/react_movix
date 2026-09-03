import { useMemo } from "react";
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
import { useToast } from "@/app/toast-context";
import { usePackageError } from "@/components/souffrance/use-package-error";
import { commandKeys, useSouffranceCommandFlags } from "@/features/commands";
import { useRestoreSouffrancePackages } from "@/features/packages";

export interface RestorablePackage {
  barcode: string;
  commandId?: string | null;
}

interface PackageRestoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packages: RestorablePackage[];
  onDone: () => void;
}

export function PackageRestoreDialog({
  open,
  onOpenChange,
  packages,
  onDone,
}: PackageRestoreDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const describeError = usePackageError();
  const restore = useRestoreSouffrancePackages();
  const toast = useToast();

  const commandIds = useMemo(
    () =>
      Array.from(
        new Set(
          packages
            .map((entry) => entry.commandId?.trim() ?? "")
            .filter((id) => id !== "")
        )
      ),
    [packages]
  );

  const flags = useSouffranceCommandFlags(commandIds, open);
  const checking = flags.some((flag) => flag.isLoading);

  const blockedCommands = new Set<string>();
  commandIds.forEach((id, index) => {
    if (flags[index]?.data === true) blockedCommands.add(id);
  });

  const eligible = packages.filter(
    (entry) => !blockedCommands.has(entry.commandId?.trim() ?? "")
  );
  const blockedCount = packages.length - eligible.length;

  const close = (next: boolean) => {
    if (restore.isPending) return;
    onOpenChange(next);
  };

  const confirm = () => {
    restore.mutate(
      { barcodes: eligible.map((entry) => entry.barcode) },
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
          <DialogTitle>{t("souffrance.restore.title")}</DialogTitle>
          <DialogDescription>
            {t("souffrance.restore.subtitlePackages", {
              count: packages.length,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {checking ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 shrink-0 animate-spin" />
              {t("souffrance.restore.checkingParents")}
            </p>
          ) : blockedCount > 0 ? (
            <Alert variant="warning">
              <TriangleAlert />
              <AlertDescription>
                {t("souffrance.restore.blockedParents", {
                  count: blockedCount,
                })}
              </AlertDescription>
            </Alert>
          ) : null}

          {!checking && eligible.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {t("souffrance.restore.packagesHint", { count: eligible.length })}
            </p>
          )}
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
            disabled={restore.isPending || checking || eligible.length === 0}
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
