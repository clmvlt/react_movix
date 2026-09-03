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
import { packageStatusCategory } from "@/lib/status";
import { usePackageHistory } from "@/features/packages";

interface PackageHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barcode: string | null;
  label?: string;
}

export function PackageHistoryDialog({
  open,
  onOpenChange,
  barcode,
  label,
}: PackageHistoryDialogProps) {
  const { t } = useTranslation();
  const history = usePackageHistory(open && barcode ? barcode : undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("packages.history.title")}</DialogTitle>
          <DialogDescription className="tabular-nums">
            {label ? `${label} - ${barcode ?? ""}` : barcode ?? ""}
          </DialogDescription>
        </DialogHeader>

        {history.isLoading ? (
          <LoadingState />
        ) : history.isError ? (
          <ErrorState onRetry={() => void history.refetch()} />
        ) : (
          <StatusTimeline
            entries={history.data ?? []}
            category={packageStatusCategory}
            emptyMessage={t("packages.history.empty")}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
