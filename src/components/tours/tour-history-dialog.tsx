import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ErrorState, LoadingState } from "@/components/states";
import { StatusTimeline } from "@/components/status-timeline";
import { tourStatusCategory } from "@/lib/status";
import { useTourHistory } from "@/features/tours";

export function TourHistoryDialog({
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
  const history = useTourHistory(open ? tourId : undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("tours.history.title")}</DialogTitle>
          <DialogDescription>{tourName}</DialogDescription>
        </DialogHeader>

        {history.isLoading ? (
          <LoadingState />
        ) : history.isError ? (
          <ErrorState onRetry={() => void history.refetch()} />
        ) : (
          <StatusTimeline
            entries={history.data ?? []}
            category={tourStatusCategory}
            emptyMessage={t("tours.history.empty")}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
