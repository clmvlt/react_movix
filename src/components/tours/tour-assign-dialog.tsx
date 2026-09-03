import { useTranslation } from "react-i18next";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { profilFullName, type Profil } from "@/features/auth";
import { useAssignTour, useUnassignTour } from "@/features/tours";

export function TourAssignDialog({
  open,
  onOpenChange,
  tourId,
  tourName,
  drivers,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tourId: string;
  tourName: string;
  drivers: Profil[];
}) {
  const { t } = useTranslation();
  const assign = useAssignTour();
  const unassign = useUnassignTour();
  const pending = assign.isPending || unassign.isPending;
  const close = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("tours.assignDialog.title")}</DialogTitle>
          <DialogDescription>{tourName}</DialogDescription>
        </DialogHeader>
        <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
          {drivers.length === 0 ? (
            <p className="px-1 py-4 text-center text-sm text-muted-foreground">
              {t("tours.noDrivers")}
            </p>
          ) : (
            drivers.map((driver) => (
              <Button
                key={driver.id}
                variant="outline"
                className="min-h-11 shrink-0 justify-start gap-2.5 px-3 lg:min-h-10"
                disabled={pending}
                onClick={() =>
                  assign.mutate(
                    { id: tourId, input: { profilId: driver.id } },
                    { onSuccess: close }
                  )
                }
              >
                <span className="truncate">{profilFullName(driver)}</span>
              </Button>
            ))
          )}
        </div>
        <DialogFooter className="border-t pt-4">
          <Button
            variant="outline"
            className="min-h-11 text-destructive lg:min-h-10"
            disabled={pending}
            onClick={() => unassign.mutate(tourId, { onSuccess: close })}
          >
            <Ban className="size-4" />
            {t("tours.unassign")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
