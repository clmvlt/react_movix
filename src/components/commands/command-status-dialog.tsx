import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCommandError } from "@/components/commands/use-command-error";
import { useToast } from "@/app/toast-context";
import { getStatusTokens } from "@/lib/colors";
import { commandStatusCategory } from "@/lib/status";
import { COMMAND_STATUSES, useUpdateCommandStatus } from "@/features/commands";
import { tourKeys } from "@/features/tours";

interface CommandStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commandIds: string[];
  onDone: () => void;
}

export function CommandStatusDialog({
  open,
  onOpenChange,
  commandIds,
  onDone,
}: CommandStatusDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const updateStatus = useUpdateCommandStatus();
  const describeError = useCommandError();
  const toast = useToast();

  const apply = (statusId: number) => {
    updateStatus.mutate(
      { statusId, commandIds },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: tourKeys.all });
          onOpenChange(false);
          onDone();
        },
        onError: (cause) => toast.error(describeError(cause)),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("expeditions.statusDialog.title")}</DialogTitle>
          <DialogDescription>
            {t("expeditions.statusDialog.subtitle", {
              count: commandIds.length,
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
          {COMMAND_STATUSES.map((status) => (
            <Button
              key={status.id}
              variant="outline"
              className="min-h-11 shrink-0 justify-start gap-2.5 px-3 lg:min-h-10"
              disabled={updateStatus.isPending || commandIds.length === 0}
              onClick={() => apply(status.id)}
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: getStatusTokens(
                    commandStatusCategory(status.id)
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
