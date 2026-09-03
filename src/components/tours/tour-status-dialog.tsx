import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getStatusTokens } from "@/lib/colors";
import { tourStatusCategory } from "@/lib/status";
import { TOUR_STATUSES, useUpdateTourStatus } from "@/features/tours";

export function TourStatusDialog({
  open,
  onOpenChange,
  tourId,
  tourName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tourId: string;
  tourName: string;
}) {
  const { t } = useTranslation();
  const updateStatus = useUpdateTourStatus();
  const apply = (statusId: number) =>
    updateStatus.mutate(
      { statusId, tourIds: [tourId] },
      { onSuccess: () => onOpenChange(false) }
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("tours.statusDialog.title")}</DialogTitle>
          <DialogDescription>{tourName}</DialogDescription>
        </DialogHeader>
        <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
          {TOUR_STATUSES.map((status) => (
            <Button
              key={status.id}
              variant="outline"
              className="min-h-11 shrink-0 justify-start gap-2.5 px-3 lg:min-h-10"
              disabled={updateStatus.isPending}
              onClick={() => apply(status.id)}
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: getStatusTokens(
                    tourStatusCategory(status.id)
                  ).strong,
                }}
              />
              <span className="truncate">{status.name}</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
