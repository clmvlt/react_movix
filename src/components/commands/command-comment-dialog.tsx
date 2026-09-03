import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Eraser, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/form-field";
import { useCommandError } from "@/components/commands/use-command-error";
import { useToast } from "@/app/toast-context";
import { useUpdateCommands } from "@/features/commands";

interface CommandCommentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commandId: string;
  initialComment?: string | null;
  onDone: () => void;
}

export function CommandCommentDialog({
  open,
  onOpenChange,
  commandId,
  initialComment,
  onDone,
}: CommandCommentDialogProps) {
  const { t } = useTranslation();
  const update = useUpdateCommands();
  const describeError = useCommandError();
  const toast = useToast();

  const baseline = (initialComment ?? "").trim();
  const [comment, setComment] = useState(initialComment ?? "");

  useEffect(() => {
    if (!open) return;
    setComment(initialComment ?? "");
  }, [open, initialComment]);

  const unchanged = comment.trim() === baseline;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (unchanged) return;
    update.mutate(
      { commandIds: [commandId], comment: comment.trim() },
      {
        onSuccess: () => {
          toast.success(t("commands.commentDialog.saved"));
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
          <DialogTitle>
            {t(
              baseline
                ? "commands.commentDialog.editTitle"
                : "commands.commentDialog.addTitle"
            )}
          </DialogTitle>
          <DialogDescription>
            {t("commands.commentDialog.subtitle")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <FormField
            label={t("common.comment")}
            htmlFor="command-comment"
            hint={t("commands.commentDialog.hint")}
          >
            <Textarea
              id="command-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              className="min-h-32"
              aria-describedby="command-comment-message"
            />
          </FormField>

          {comment.trim() !== "" && (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                className="min-h-10"
                disabled={update.isPending}
                onClick={() => setComment("")}
              >
                <Eraser className="size-4" />
                {t("common.clear")}
              </Button>
            </div>
          )}

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 lg:min-h-10"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              className="min-h-11 lg:min-h-10"
              disabled={update.isPending || unchanged}
            >
              {update.isPending && <Loader2 className="size-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
