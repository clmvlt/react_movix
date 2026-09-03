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
import { useDeleteTarif, type Tarif } from "@/features/tarifs";

interface TarifDeleteDialogProps {
  tarif: Tarif | null;
  onOpenChange: (open: boolean) => void;
}

export function TarifDeleteDialog({
  tarif,
  onOpenChange,
}: TarifDeleteDialogProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const deleteTarif = useDeleteTarif();
  const errorMessage = useApiErrorMessage("tarifs");

  const handleDelete = () => {
    if (!tarif) return;
    deleteTarif.mutate(tarif.id, {
      onSuccess: () => onOpenChange(false),
      onError: (err) =>
        toast.error(errorMessage(err, "tarifs.errors.deleteFailed")),
    });
  };

  return (
    <Dialog open={Boolean(tarif)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("tarifs.delete.title")}</DialogTitle>
          <DialogDescription>
            {t("tarifs.delete.confirm", {
              km: tarif?.kmMax ?? 0,
              price: tarif?.prixEuro ?? 0,
            })}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 sm:min-h-10"
            onClick={() => onOpenChange(false)}
            disabled={deleteTarif.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="min-h-11 sm:min-h-10"
            onClick={handleDelete}
            disabled={deleteTarif.isPending}
          >
            {deleteTarif.isPending && (
              <Loader2 className="size-4 animate-spin" />
            )}
            {t("common.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
