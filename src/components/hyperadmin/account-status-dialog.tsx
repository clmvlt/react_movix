import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useHyperError } from "@/components/hyperadmin/use-hyper-error";
import { useToast } from "@/app/toast-context";
import { useSetAdminAccountStatus } from "@/features/admin-accounts";

interface StatusTarget {
  id: string;
  societe: string;
  isActive: boolean;
}

export function AccountStatusDialog({
  target,
  onClose,
}: {
  target: StatusTarget | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const errorMessage = useHyperError();
  const setStatus = useSetAdminAccountStatus();

  const disabling = target?.isActive === true;

  const confirm = () => {
    if (!target) return;
    setStatus.mutate(
      { accountId: target.id, isActive: !target.isActive },
      {
        onSuccess: () => {
          onClose();
          toast.success(
            disabling
              ? t("hyperadmin.companies.status.disabled", {
                  societe: target.societe,
                })
              : t("hyperadmin.companies.status.enabled", {
                  societe: target.societe,
                })
          );
        },
        onError: (error) => {
          toast.error(
            errorMessage(error, "hyperadmin.companies.errors.statusFailed")
          );
        },
      }
    );
  };

  return (
    <Dialog
      open={Boolean(target)}
      onOpenChange={(open) => {
        if (!open && !setStatus.isPending) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {disabling
              ? t("hyperadmin.companies.status.disableTitle", {
                  societe: target?.societe ?? "",
                })
              : t("hyperadmin.companies.status.enableTitle", {
                  societe: target?.societe ?? "",
                })}
          </DialogTitle>
          <DialogDescription>
            {disabling
              ? t("hyperadmin.companies.status.disableHint")
              : t("hyperadmin.companies.status.enableHint")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 sm:min-h-10"
            onClick={onClose}
            disabled={setStatus.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            className="min-h-11 sm:min-h-10"
            onClick={confirm}
            disabled={setStatus.isPending}
          >
            {setStatus.isPending && <Loader2 className="size-4 animate-spin" />}
            {disabling
              ? t("hyperadmin.companies.status.disableAction")
              : t("hyperadmin.companies.status.enableAction")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
