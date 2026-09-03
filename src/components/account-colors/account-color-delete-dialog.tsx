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
import { useToast } from "@/app/toast-context";
import { ApiError } from "@/lib/api-error";
import {
  useDeleteAccountColor,
  type AccountColor,
} from "@/features/account-colors";

interface AccountColorDeleteDialogProps {
  color: AccountColor | null;
  onOpenChange: (open: boolean) => void;
}

export function AccountColorDeleteDialog({
  color,
  onOpenChange,
}: AccountColorDeleteDialogProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const deleteColor = useDeleteAccountColor();

  const confirmDelete = () => {
    if (!color) return;
    deleteColor.mutate(color.id, {
      onSuccess: () => onOpenChange(false),
      onError: (cause) => {
        if (cause instanceof ApiError && cause.status === 404) {
          onOpenChange(false);
          return;
        }
        toast.error(t("accountColors.delete.failed"));
      },
    });
  };

  return (
    <Dialog open={Boolean(color)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("accountColors.delete.title")}</DialogTitle>
          <DialogDescription>
            {t("accountColors.delete.confirm", {
              name: color?.name || color?.color || "",
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span
              className="size-6 shrink-0 rounded-full border border-border"
              style={{ backgroundColor: color?.color }}
              aria-hidden
            />
            <span className="text-sm uppercase text-muted-foreground">
              {color?.color}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("accountColors.delete.keepUsage")}
          </p>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 lg:min-h-10"
            onClick={() => onOpenChange(false)}
            disabled={deleteColor.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="min-h-11 lg:min-h-10"
            onClick={confirmDelete}
            disabled={deleteColor.isPending}
          >
            {deleteColor.isPending && <Loader2 className="size-4 animate-spin" />}
            {t("common.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
