import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, MailPlus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState, LoadingState } from "@/components/states";
import { EmailRecipientDialog } from "@/components/email/email-recipient-dialog";
import { useToast } from "@/app/toast-context";
import { apiErrorText } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { useAnomalyTypes } from "@/features/anomalies";
import {
  useDeleteEmailRecipient,
  useEmailEventTypes,
  useEmailRecipients,
  type EmailRecipient,
} from "@/features/email";

export function EmailRecipientsCard() {
  const { t } = useTranslation();
  const toast = useToast();
  const recipientsQuery = useEmailRecipients();
  const eventTypesQuery = useEmailEventTypes();
  const anomalyTypesQuery = useAnomalyTypes();
  const remove = useDeleteEmailRecipient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EmailRecipient | null>(null);
  const [deleting, setDeleting] = useState<EmailRecipient | null>(null);

  const eventLabels = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of eventTypesQuery.data ?? []) {
      map.set(entry.code, entry.label || entry.code);
    }
    return map;
  }, [eventTypesQuery.data]);

  const typeNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of anomalyTypesQuery.data ?? []) {
      map.set(entry.code, entry.name || entry.code);
    }
    return map;
  }, [anomalyTypesQuery.data]);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (recipient: EmailRecipient) => {
    setEditing(recipient);
    setDialogOpen(true);
  };

  const handleDelete = () => {
    if (!deleting) return;
    remove.mutate(deleting.id, {
      onSuccess: () => {
        setDeleting(null);
        toast.success(t("emailNotifications.recipients.deleted"));
      },
      onError: (cause) => {
        setDeleting(null);
        toast.error(
          apiErrorText(cause) ??
            t("emailNotifications.recipients.errors.deleteFailed")
        );
      },
    });
  };

  const recipients = recipientsQuery.data ?? [];

  const renderContent = () => {
    if (recipientsQuery.isLoading) return <LoadingState />;
    if (recipientsQuery.isError) {
      return (
        <Alert variant="warning">
          <AlertDescription>
            {apiErrorText(recipientsQuery.error) ??
              t("emailNotifications.recipients.errors.loadFailed")}
          </AlertDescription>
        </Alert>
      );
    }
    if (recipients.length === 0) {
      return (
        <div className="flex flex-col items-center gap-3">
          <EmptyState
            message={t("emailNotifications.recipients.empty")}
            icon={<MailPlus className="size-8" />}
            className="py-10"
          />
          <Button
            type="button"
            className="min-h-11 lg:min-h-10"
            onClick={openCreate}
          >
            <MailPlus />
            {t("emailNotifications.recipients.add")}
          </Button>
        </div>
      );
    }

    return (
      <ul className="flex flex-col divide-y rounded-xl border">
        {recipients.map((recipient) => {
          const noSubscription = recipient.subscriptions.length === 0;
          return (
            <li
              key={recipient.id}
              className="flex items-start gap-2 p-3 sm:items-center"
            >
              <div
                className={cn(
                  "flex min-w-0 flex-1 flex-col gap-1.5",
                  !recipient.active && "opacity-50"
                )}
              >
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium">
                    {recipient.email}
                  </span>
                  {!recipient.active && (
                    <Badge variant="outline">
                      {t("emailNotifications.recipients.inactive")}
                    </Badge>
                  )}
                </div>
                {recipient.label && (
                  <span className="truncate text-xs text-muted-foreground">
                    {recipient.label}
                  </span>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {recipient.subscriptions.map((code) => (
                    <Badge key={code} variant="secondary">
                      {eventLabels.get(code) ?? code}
                    </Badge>
                  ))}
                  <Badge variant="outline">
                    {recipient.anomalieTypeCodes.length === 0
                      ? t("emailNotifications.recipients.allTypes")
                      : recipient.anomalieTypeCodes
                          .map((code) => typeNames.get(code) ?? code)
                          .join(", ")}
                  </Badge>
                </div>
                {noSubscription && (
                  <p className="text-xs leading-4 text-status-warning-text">
                    {t("emailNotifications.recipients.noSubscriptions")}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-11 lg:size-8"
                  onClick={() => openEdit(recipient)}
                  aria-label={t("emailNotifications.recipients.editAria", {
                    email: recipient.email,
                  })}
                >
                  <Pencil />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-11 lg:size-8"
                  onClick={() => setDeleting(recipient)}
                  aria-label={t("emailNotifications.recipients.deleteAria", {
                    email: recipient.email,
                  })}
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <CardTitle className="text-base">
            {t("emailNotifications.recipients.title")}
          </CardTitle>
          <CardDescription>
            {t("emailNotifications.recipients.subtitle")}
          </CardDescription>
        </div>
        {recipients.length > 0 && (
          <Button
            type="button"
            variant="outline"
            className="min-h-11 shrink-0 lg:min-h-10"
            onClick={openCreate}
          >
            <MailPlus />
            {t("emailNotifications.recipients.add")}
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {renderContent()}
      </CardContent>

      <EmailRecipientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        recipient={editing}
      />

      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("emailNotifications.recipients.deleteTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("emailNotifications.recipients.deleteDescription", {
                email: deleting?.email ?? "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 lg:min-h-10"
              onClick={() => setDeleting(null)}
              disabled={remove.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="min-h-11 lg:min-h-10"
              onClick={handleDelete}
              disabled={remove.isPending}
            >
              {remove.isPending && <Loader2 className="size-4 animate-spin" />}
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
