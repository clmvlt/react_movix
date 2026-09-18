import { useTranslation } from "react-i18next";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/app/toast-context";
import { ApiError } from "@/lib/api-error";
import { useDeleteZone, type Zone } from "@/features/zones";

interface ZoneDeleteDialogProps {
  zone: Zone | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: (zone: Zone) => void;
  onGone: () => void;
}

export function ZoneDeleteDialog({
  zone,
  onOpenChange,
  onDeleted,
  onGone,
}: ZoneDeleteDialogProps) {
  const { t } = useTranslation();
  const deleteZone = useDeleteZone();
  const toast = useToast();

  const clientCount = zone?.clientCount ?? 0;

  const confirmDelete = () => {
    if (!zone) return;
    deleteZone.mutate(zone.id, {
      onSuccess: () => {
        onOpenChange(false);
        onDeleted(zone);
      },
      onError: (cause) => {
        if (cause instanceof ApiError && cause.status === 404) {
          onOpenChange(false);
          onGone();
          return;
        }
        toast.error(t("zones.delete.failed"));
      },
    });
  };

  return (
    <Dialog open={Boolean(zone)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("zones.delete.title")}</DialogTitle>
          <DialogDescription>
            {t("zones.delete.confirm", { name: zone?.name ?? "" })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {clientCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {t("zones.delete.detach", { count: clientCount })}
            </p>
          )}

          <Alert variant="destructive">
            <AlertTriangle />
            <AlertDescription>{t("zones.delete.cascade")}</AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteZone.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={confirmDelete}
            disabled={deleteZone.isPending}
          >
            {deleteZone.isPending && <Loader2 className="size-4 animate-spin" />}
            {t("common.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
