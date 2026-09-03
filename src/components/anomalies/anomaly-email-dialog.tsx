import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Loader2, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { invalidEmails, parseEmails } from "@/components/anomalies/anomaly-emails";
import { useAnomalyError } from "@/components/anomalies/use-anomaly-error";
import { ApiError } from "@/lib/api-error";
import { useSendAnomalyEmail } from "@/features/anomalies";

interface AnomalyEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anomalyId: string;
}

export function AnomalyEmailDialog({
  open,
  onOpenChange,
  anomalyId,
}: AnomalyEmailDialogProps) {
  const { t } = useTranslation();
  const send = useSendAnomalyEmail();
  const describeError = useAnomalyError();
  const toast = useToast();

  const [recipients, setRecipients] = useState("");
  const [noRecipients, setNoRecipients] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRecipients("");
    setNoRecipients(false);
  }, [open]);

  const parsed = parseEmails(recipients);
  const invalid = invalidEmails(parsed);
  const recipientsError =
    invalid.length > 0
      ? t("anomalies.form.invalidEmails", { list: invalid.join(", ") })
      : undefined;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setNoRecipients(false);
    if (recipientsError) return;

    send.mutate(
      { id: anomalyId, emails: parsed },
      {
        onSuccess: () => {
          toast.success(t("anomalies.email.queued"));
          onOpenChange(false);
        },
        onError: (cause) => {
          setNoRecipients(
            cause instanceof ApiError &&
              cause.status === 404 &&
              parsed.length === 0
          );
          toast.error(describeError(cause, "anomalies.errors.sendNotFound"));
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("anomalies.email.title")}</DialogTitle>
          <DialogDescription>{t("anomalies.email.subtitle")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <FormField
            label={t("anomalies.email.recipients")}
            htmlFor="anomaly-email-recipients"
            error={recipientsError}
            hint={t("anomalies.email.recipientsHint")}
          >
            <Input
              id="anomaly-email-recipients"
              value={recipients}
              onChange={(event) => setRecipients(event.target.value)}
              autoComplete="off"
              className="min-h-11 lg:min-h-10"
            />
          </FormField>

          <p className="text-xs text-muted-foreground">
            {t("anomalies.email.asyncNotice")}
          </p>

          {noRecipients && (
            <Button
              asChild
              type="button"
              variant="outline"
              className="min-h-11 lg:min-h-10"
            >
              <Link to="/app/settings?tab=emails">
                <Settings2 />
                {t("anomalies.email.configureRecipients")}
              </Link>
            </Button>
          )}

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 lg:min-h-10"
              onClick={() => onOpenChange(false)}
              disabled={send.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              className="min-h-11 lg:min-h-10"
              disabled={send.isPending}
            >
              {send.isPending && <Loader2 className="size-4 animate-spin" />}
              {t("anomalies.email.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
