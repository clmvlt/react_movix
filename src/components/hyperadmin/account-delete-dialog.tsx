import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Loader2,
  MailCheck,
  MailWarning,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import { ErrorState, LoadingState } from "@/components/states";
import { AccountDeletionCounts } from "@/components/hyperadmin/account-deletion-counts";
import { useHyperError } from "@/components/hyperadmin/use-hyper-error";
import { useToast } from "@/app/toast-context";
import { useRemainingSeconds } from "@/hooks/use-remaining-seconds";
import { formatDateTime } from "@/lib/date";
import {
  useAccountDeletionPreview,
  useCancelAccountDeletion,
  useRequestAccountDeletion,
  useResendAccountDeletion,
  type AccountDeletionRequest,
} from "@/features/admin-accounts";

interface DeleteTarget {
  id: string;
  societe: string;
}

interface PendingState {
  request: AccountDeletionRequest;
  receivedAt: number;
}

export function AccountDeleteDialog({
  target,
  onClose,
}: {
  target: DeleteTarget | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={Boolean(target)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-2xl">
        {target && (
          <AccountDeleteBody
            key={target.id}
            target={target}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function AccountDeleteBody({
  target,
  onClose,
}: {
  target: DeleteTarget;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const errorMessage = useHyperError();

  const previewQuery = useAccountDeletionPreview(target.id);
  const requestDeletion = useRequestAccountDeletion();

  const [confirmName, setConfirmName] = useState("");
  const [pending, setPending] = useState<PendingState | null>(null);

  const serverPending = previewQuery.data?.pendingRequest ?? null;

  useEffect(() => {
    if (serverPending) {
      setPending({ request: serverPending, receivedAt: Date.now() });
    }
  }, [serverPending]);

  const nameMatches =
    confirmName.trim().toLowerCase() === target.societe.trim().toLowerCase();

  const handleRequest = () => {
    requestDeletion.mutate(target.id, {
      onSuccess: (request) => {
        setPending({ request, receivedAt: Date.now() });
      },
      onError: (error) => {
        toast.error(
          errorMessage(error, "hyperadmin.companies.errors.requestFailed")
        );
      },
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("hyperadmin.companies.delete.title")}</DialogTitle>
        <DialogDescription>{target.societe}</DialogDescription>
      </DialogHeader>

      {previewQuery.isLoading ? (
        <LoadingState />
      ) : previewQuery.isError ? (
        <ErrorState
          error={previewQuery.error}
          retrying={previewQuery.isFetching}
          onRetry={() => void previewQuery.refetch()}
        />
      ) : pending ? (
        <DeletionPendingPanel
          target={target}
          pending={pending}
          onPending={setPending}
          onCancelled={onClose}
        />
      ) : previewQuery.data ? (
        <div className="flex flex-col gap-4">
          <Alert variant="warning">
            <ShieldAlert />
            <AlertTitle>
              {t("hyperadmin.companies.delete.preferDisableTitle")}
            </AlertTitle>
            <AlertDescription>
              {t("hyperadmin.companies.delete.preferDisableHint")}
            </AlertDescription>
          </Alert>

          <AccountDeletionCounts preview={previewQuery.data} />

          <p className="rounded-lg border border-border bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
            {t("hyperadmin.companies.delete.survivors")}
          </p>

          <FormField
            label={t("hyperadmin.companies.delete.confirmLabel", {
              societe: target.societe,
            })}
            htmlFor="account-delete-confirm"
            hint={t("hyperadmin.companies.delete.confirmHint")}
          >
            <Input
              id="account-delete-confirm"
              value={confirmName}
              onChange={(event) => setConfirmName(event.target.value)}
              autoComplete="off"
              className="min-h-11 lg:min-h-10"
            />
          </FormField>
        </div>
      ) : null}

      {!pending && !previewQuery.isLoading && !previewQuery.isError && (
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 sm:min-h-10"
            onClick={onClose}
            disabled={requestDeletion.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="min-h-11 sm:min-h-10"
            disabled={!nameMatches || requestDeletion.isPending}
            onClick={handleRequest}
          >
            {requestDeletion.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            {t("hyperadmin.companies.delete.requestAction")}
          </Button>
        </DialogFooter>
      )}
    </>
  );
}

function DeletionPendingPanel({
  target,
  pending,
  onPending,
  onCancelled,
}: {
  target: DeleteTarget;
  pending: PendingState;
  onPending: (state: PendingState) => void;
  onCancelled: () => void;
}) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const errorMessage = useHyperError();
  const resend = useResendAccountDeletion();
  const cancel = useCancelAccountDeletion();

  const request = pending.request;
  const deadline = pending.receivedAt + request.retryAfterSeconds * 1000;
  const remaining = useRemainingSeconds(deadline);

  const handleResend = () => {
    resend.mutate(target.id, {
      onSuccess: (next) => {
        onPending({ request: next, receivedAt: Date.now() });
        if (next.emailSent) {
          toast.success(t("hyperadmin.companies.delete.resent"));
        }
      },
      onError: (error) => {
        toast.error(
          errorMessage(error, "hyperadmin.companies.errors.resendFailed")
        );
      },
    });
  };

  const handleCancel = () => {
    cancel.mutate(target.id, {
      onSuccess: () => {
        toast.success(t("hyperadmin.companies.delete.cancelled"));
        onCancelled();
      },
      onError: (error) => {
        toast.error(
          errorMessage(error, "hyperadmin.companies.errors.cancelFailed")
        );
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Alert variant="warning">
        <MailCheck />
        <AlertTitle>{t("hyperadmin.companies.delete.sentTitle")}</AlertTitle>
        <AlertDescription>
          {t("hyperadmin.companies.delete.sentHint", {
            email: request.requesterEmail,
            date: formatDateTime(request.expiresAt, i18n.language),
          })}
        </AlertDescription>
      </Alert>

      {!request.emailSent && remaining > 0 && (
        <Alert>
          <MailWarning />
          <AlertDescription>
            {t("hyperadmin.companies.delete.rateLimited", { count: remaining })}
          </AlertDescription>
        </Alert>
      )}

      <p className="text-xs leading-5 text-muted-foreground">
        {t("hyperadmin.companies.delete.pendingHint")}
      </p>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 text-destructive sm:min-h-10"
          disabled={cancel.isPending || resend.isPending}
          onClick={handleCancel}
        >
          {cancel.isPending && <Loader2 className="size-4 animate-spin" />}
          {t("hyperadmin.companies.delete.cancelAction")}
        </Button>
        <Button
          type="button"
          className="min-h-11 sm:min-h-10"
          disabled={resend.isPending || cancel.isPending || remaining > 0}
          onClick={handleResend}
        >
          {resend.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <MailCheck className="size-4" />
          )}
          {remaining > 0
            ? t("hyperadmin.companies.delete.resendIn", { count: remaining })
            : t("hyperadmin.companies.delete.resendAction")}
        </Button>
      </DialogFooter>
    </div>
  );
}
