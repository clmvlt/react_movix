import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/form-field";
import { LoadingState } from "@/components/states";
import { invalidEmails } from "@/components/anomalies/anomaly-emails";
import { useToast } from "@/app/toast-context";
import { ApiError, apiErrorText } from "@/lib/api-error";
import { useAnomalyTypes } from "@/features/anomalies";
import {
  useCreateEmailRecipient,
  useEmailEventTypes,
  useUpdateEmailRecipient,
  type EmailRecipient,
} from "@/features/email";

const DEFAULT_SUBSCRIPTION = "ANOMALIE_CREATED";

interface EmailRecipientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipient: EmailRecipient | null;
}

export function EmailRecipientDialog({
  open,
  onOpenChange,
  recipient,
}: EmailRecipientDialogProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const eventTypesQuery = useEmailEventTypes(open);
  const anomalyTypesQuery = useAnomalyTypes(open);
  const create = useCreateEmailRecipient();
  const update = useUpdateEmailRecipient();
  const pending = create.isPending || update.isPending;

  const [email, setEmail] = useState("");
  const [label, setLabel] = useState("");
  const [active, setActive] = useState(true);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [typeCodes, setTypeCodes] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEmail(recipient?.email ?? "");
    setLabel(recipient?.label ?? "");
    setActive(recipient ? recipient.active : true);
    setSubscriptions(recipient ? recipient.subscriptions : [DEFAULT_SUBSCRIPTION]);
    setTypeCodes(recipient?.anomalieTypeCodes ?? []);
    setSubmitted(false);
  }, [open, recipient]);

  const eventTypes = eventTypesQuery.data ?? [];
  const anomalyTypes = anomalyTypesQuery.data ?? [];
  const referencesLoading =
    eventTypesQuery.isLoading || anomalyTypesQuery.isLoading;

  const trimmedEmail = email.trim();
  const emailError = submitted
    ? !trimmedEmail
      ? t("common.required")
      : invalidEmails([trimmedEmail]).length > 0
        ? t("emailNotifications.recipients.dialog.invalidEmail")
        : undefined
    : undefined;

  const toggleSubscription = (code: string) =>
    setSubscriptions((previous) =>
      previous.includes(code)
        ? previous.filter((entry) => entry !== code)
        : [...previous, code]
    );

  const toggleTypeCode = (code: string) =>
    setTypeCodes((previous) =>
      previous.includes(code)
        ? previous.filter((entry) => entry !== code)
        : [...previous, code]
    );

  const describeError = (cause: unknown): string => {
    if (cause instanceof ApiError && cause.status === 409) {
      return t("emailNotifications.recipients.errors.duplicate");
    }
    return (
      apiErrorText(cause) ?? t("emailNotifications.recipients.errors.saveFailed")
    );
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!trimmedEmail || invalidEmails([trimmedEmail]).length > 0) return;

    const input = {
      email: trimmedEmail,
      label: label.trim(),
      active,
      subscriptions,
      anomalieTypeCodes: typeCodes,
    };
    const options = {
      onSuccess: () => onOpenChange(false),
      onError: (cause: unknown) => toast.error(describeError(cause)),
    };

    if (recipient) update.mutate({ id: recipient.id, input }, options);
    else create.mutate(input, options);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {recipient
              ? t("emailNotifications.recipients.dialog.editTitle")
              : t("emailNotifications.recipients.dialog.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("emailNotifications.recipients.dialog.subtitle")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <FormField
            label={t("emailNotifications.recipients.dialog.email")}
            htmlFor="email-recipient-address"
            error={emailError}
            required
          >
            <Input
              id="email-recipient-address"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="off"
              className="min-h-11 lg:min-h-10"
            />
          </FormField>

          <FormField
            label={t("emailNotifications.recipients.dialog.label")}
            htmlFor="email-recipient-label"
            hint={t("emailNotifications.recipients.dialog.labelHint")}
          >
            <Input
              id="email-recipient-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              autoComplete="off"
              className="min-h-11 lg:min-h-10"
            />
          </FormField>

          <div className="flex min-h-11 items-center gap-3">
            <Checkbox
              id="email-recipient-active"
              className="size-5"
              checked={active}
              onCheckedChange={(value) => setActive(value === true)}
            />
            <Label htmlFor="email-recipient-active" className="cursor-pointer">
              {t("emailNotifications.recipients.dialog.active")}
            </Label>
          </div>
          {!active && (
            <p className="text-xs leading-4 text-muted-foreground">
              {t("emailNotifications.recipients.dialog.inactiveHint")}
            </p>
          )}

          {referencesLoading ? (
            <LoadingState />
          ) : (
            <>
              <div className="flex flex-col gap-1.5 border-t pt-3">
                <Label>{t("emailNotifications.recipients.dialog.events")}</Label>
                {eventTypes.map((eventType) => {
                  const id = `email-recipient-event-${eventType.code}`;
                  return (
                    <div
                      key={eventType.code}
                      className="flex min-h-10 items-center gap-3"
                    >
                      <Checkbox
                        id={id}
                        className="size-5"
                        checked={subscriptions.includes(eventType.code)}
                        onCheckedChange={() => toggleSubscription(eventType.code)}
                      />
                      <Label htmlFor={id} className="cursor-pointer font-normal">
                        {eventType.label || eventType.code}
                      </Label>
                    </div>
                  );
                })}
                {subscriptions.length === 0 && (
                  <Alert variant="warning">
                    <AlertDescription>
                      {t(
                        "emailNotifications.recipients.dialog.noSubscriptions"
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="flex flex-col gap-1.5 border-t pt-3">
                <Label>
                  {t("emailNotifications.recipients.dialog.anomalyTypes")}
                </Label>
                <div className="flex min-h-10 items-center gap-3">
                  <Checkbox
                    id="email-recipient-all-types"
                    className="size-5"
                    checked={typeCodes.length === 0}
                    onCheckedChange={() => setTypeCodes([])}
                    disabled={typeCodes.length === 0}
                  />
                  <Label
                    htmlFor="email-recipient-all-types"
                    className="cursor-pointer font-normal"
                  >
                    {t("emailNotifications.recipients.allTypes")}
                  </Label>
                </div>
                {anomalyTypes.map((anomalyType) => {
                  const id = `email-recipient-type-${anomalyType.code}`;
                  return (
                    <div
                      key={anomalyType.code}
                      className="flex min-h-10 items-center gap-3"
                    >
                      <Checkbox
                        id={id}
                        className="size-5"
                        checked={typeCodes.includes(anomalyType.code)}
                        onCheckedChange={() => toggleTypeCode(anomalyType.code)}
                      />
                      <Label htmlFor={id} className="cursor-pointer font-normal">
                        {anomalyType.name || anomalyType.code}
                      </Label>
                    </div>
                  );
                })}
                <p className="min-h-[1rem] text-xs leading-4 text-muted-foreground">
                  {t("emailNotifications.recipients.dialog.typesHint")}
                </p>
              </div>
            </>
          )}

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 lg:min-h-10"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              className="min-h-11 lg:min-h-10"
              disabled={pending}
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              {recipient ? t("common.save") : t("common.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
