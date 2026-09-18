import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/app/toast-context";
import { useDeleteClientReport } from "@/features/client-reports";

interface ReportDeleteDialogProps {
  reportId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function ReportDeleteDialog({
  reportId,
  open,
  onOpenChange,
  onDeleted,
}: ReportDeleteDialogProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const deleteReport = useDeleteClientReport();

  const handleDelete = () => {
    deleteReport.mutate(reportId, {
      onSuccess: () => {
        onOpenChange(false);
        onDeleted?.();
      },
      onError: () => toast.error(t("clientReports.deleteFailed")),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("clientReports.markHandledTitle")}</DialogTitle>
          <DialogDescription>
            {t("clientReports.markHandledConfirm")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 sm:min-h-10"
            onClick={() => onOpenChange(false)}
            disabled={deleteReport.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            className="min-h-11 sm:min-h-10"
            onClick={handleDelete}
            disabled={deleteReport.isPending}
          >
            {deleteReport.isPending && <Loader2 className="animate-spin" />}
            {t("common.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
