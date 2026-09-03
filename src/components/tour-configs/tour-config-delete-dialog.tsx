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
import { useApiErrorMessage } from "@/components/account/use-account-error";
import { useToast } from "@/app/toast-context";
import { useDeleteTourConfig, type TourConfig } from "@/features/tour-configs";

interface TourConfigDeleteDialogProps {
  config: TourConfig | null;
  onOpenChange: (open: boolean) => void;
}

export function TourConfigDeleteDialog({
  config,
  onOpenChange,
}: TourConfigDeleteDialogProps) {
  const { t } = useTranslation();
  const deleteConfig = useDeleteTourConfig();
  const errorMessage = useApiErrorMessage("tourConfigs");
  const toast = useToast();

  const handleDelete = () => {
    if (!config) return;
    deleteConfig.mutate(config.id, {
      onSuccess: () => onOpenChange(false),
      onError: (err) =>
        toast.error(errorMessage(err, "tourConfigs.errors.deleteFailed")),
    });
  };

  return (
    <Dialog open={Boolean(config)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("tourConfigs.delete.title")}</DialogTitle>
          <DialogDescription>
            {t("tourConfigs.delete.confirm", { name: config?.tourName ?? "" })}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 sm:min-h-10"
            onClick={() => onOpenChange(false)}
            disabled={deleteConfig.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="min-h-11 sm:min-h-10"
            onClick={handleDelete}
            disabled={deleteConfig.isPending}
          >
            {deleteConfig.isPending && (
              <Loader2 className="size-4 animate-spin" />
            )}
            {t("common.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
