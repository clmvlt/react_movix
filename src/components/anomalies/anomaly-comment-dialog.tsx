import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/app/toast-context";
import { FormField } from "@/components/form-field";
import { useAnomalyError } from "@/components/anomalies/use-anomaly-error";
import {
  ANOMALY_COMMENT_MAX,
  useUpdateAnomalyComment,
} from "@/features/anomalies";

interface AnomalyCommentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anomalyId: string;
  initialComment?: string | null;
}

export function AnomalyCommentDialog({
  open,
  onOpenChange,
  anomalyId,
  initialComment,
}: AnomalyCommentDialogProps) {
  const { t } = useTranslation();
  const update = useUpdateAnomalyComment();
  const describeError = useAnomalyError();
  const toast = useToast();

  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setComment(initialComment ?? "");
    setSubmitted(false);
  }, [open, initialComment]);

  const emptyError =
    submitted && !comment.trim() ? t("anomalies.comment.required") : undefined;
  const tooLongError =
    comment.length > ANOMALY_COMMENT_MAX
      ? t("anomalies.form.tooLong", { count: ANOMALY_COMMENT_MAX })
      : undefined;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!comment.trim() || tooLongError) return;

    update.mutate(
      { id: anomalyId, comment },
      {
        onSuccess: () => onOpenChange(false),
        onError: (cause) => toast.error(describeError(cause)),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("anomalies.comment.title")}</DialogTitle>
          <DialogDescription>
            {t("anomalies.comment.subtitle")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <Alert>
            <AlertTriangle />
            <AlertDescription>
              {t("anomalies.comment.replaceWarning")}
            </AlertDescription>
          </Alert>

          <FormField
            label={t("anomalies.form.description")}
            htmlFor="anomaly-comment"
            error={emptyError ?? tooLongError}
            hint={t("anomalies.form.counter", {
              count: comment.length,
              max: ANOMALY_COMMENT_MAX,
            })}
            required
          >
            <Textarea
              id="anomaly-comment"
              value={comment}
              maxLength={ANOMALY_COMMENT_MAX}
              onChange={(event) => setComment(event.target.value)}
              className="min-h-32"
            />
          </FormField>

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
              disabled={update.isPending}
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
