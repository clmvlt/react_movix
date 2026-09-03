import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Check, Copy, Link2, Loader2, Ticket, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { ApiError, apiErrorText } from "@/lib/api-error";
import { copyText } from "@/lib/clipboard";
import { formatDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import { useToast } from "@/app/toast-context";
import {
  INVITATION_DEFAULT_EXPIRES_DAYS,
  INVITATION_DEFAULT_MAX_USES,
  INVITATION_EXPIRES_DAYS_MAX,
  INVITATION_MAX_USES_MAX,
  invitationJoinLink,
  useCreateInvitation,
  useInvitations,
  useRevokeInvitation,
  type Invitation,
} from "@/features/invitations";

interface InvitationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function parseBounded(raw: string, max: number): number | null {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > max) return null;
  return value;
}

export function InvitationsDialog({
  open,
  onOpenChange,
}: InvitationsDialogProps) {
  const { t, i18n } = useTranslation();
  const toast = useToast();

  const listQuery = useInvitations(open);
  const createInvitation = useCreateInvitation();
  const revokeInvitation = useRevokeInvitation();

  const [maxUses, setMaxUses] = useState(String(INVITATION_DEFAULT_MAX_USES));
  const [expiresInDays, setExpiresInDays] = useState(
    String(INVITATION_DEFAULT_EXPIRES_DAYS)
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [created, setCreated] = useState<Invitation | null>(null);

  useEffect(() => {
    if (open) {
      setMaxUses(String(INVITATION_DEFAULT_MAX_USES));
      setExpiresInDays(String(INVITATION_DEFAULT_EXPIRES_DAYS));
      setFieldErrors({});
      setCopiedId(null);
      setCreated(null);
    }
  }, [open]);

  useEffect(() => {
    if (!copiedId) return;
    const timer = window.setTimeout(() => setCopiedId(null), 1500);
    return () => window.clearTimeout(timer);
  }, [copiedId]);

  const rows = useMemo(() => {
    const list = listQuery.data ?? [];
    return [...list].sort((a, b) =>
      (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
    );
  }, [listQuery.data]);

  const copyCode = async (invitation: Invitation) => {
    if (await copyText(invitation.code)) {
      setCopiedId(invitation.id);
      toast.success(t("profiles.invitations.copied"));
    } else {
      setCopiedId(null);
      toast.error(t("common.copyFailed"));
    }
  };

  const copyLink = async (invitation: Invitation) => {
    if (await copyText(invitationJoinLink(invitation.code))) {
      setCopiedId(`${invitation.id}-link`);
      toast.success(t("profiles.invitations.linkCopied"));
    } else {
      setCopiedId(null);
      toast.error(t("common.copyFailed"));
    }
  };

  const handleCreate = (event: FormEvent) => {
    event.preventDefault();
    const errors: Record<string, string> = {};
    const uses = parseBounded(maxUses, INVITATION_MAX_USES_MAX);
    const days = parseBounded(expiresInDays, INVITATION_EXPIRES_DAYS_MAX);
    if (uses === null) {
      errors.maxUses = t("profiles.invitations.errors.range", {
        max: INVITATION_MAX_USES_MAX,
      });
    }
    if (days === null) {
      errors.expiresInDays = t("profiles.invitations.errors.range", {
        max: INVITATION_EXPIRES_DAYS_MAX,
      });
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    createInvitation.mutate(
      { maxUses: uses!, expiresInDays: days! },
      {
        onSuccess: (invitation) => {
          setCreated(invitation);
        },
        onError: (err) => {
          toast.error(apiErrorText(err) ?? t("common.error"));
        },
      }
    );
  };

  const handleRevoke = (invitation: Invitation) => {
    revokeInvitation.mutate(invitation.id, {
      onSuccess: () => {
        setCreated((prev) => (prev?.id === invitation.id ? null : prev));
        toast.success(t("profiles.invitations.revoked"));
      },
      onError: (err) => {
        if (err instanceof ApiError && err.status === 404) {
          toast.error(t("profiles.invitations.errors.notFound"));
        } else {
          toast.error(apiErrorText(err) ?? t("common.error"));
        }
      },
    });
  };

  const statusLabel = (invitation: Invitation) =>
    invitation.usedCount >= invitation.maxUses
      ? t("profiles.invitations.exhausted")
      : t("profiles.invitations.expired");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("profiles.invitations.title")}</DialogTitle>
          <DialogDescription>
            {t("profiles.invitations.subtitle")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="flex flex-col gap-1" noValidate>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <FormField
              label={t("profiles.invitations.maxUses")}
              htmlFor="inv-max-uses"
              error={fieldErrors.maxUses}
            >
              <Input
                id="inv-max-uses"
                type="number"
                min={1}
                max={INVITATION_MAX_USES_MAX}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                className="min-h-11 lg:min-h-10"
              />
            </FormField>
            <FormField
              label={t("profiles.invitations.expiresInDays")}
              htmlFor="inv-expires-days"
              error={fieldErrors.expiresInDays}
            >
              <Input
                id="inv-expires-days"
                type="number"
                min={1}
                max={INVITATION_EXPIRES_DAYS_MAX}
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                className="min-h-11 lg:min-h-10"
              />
            </FormField>
          </div>
          <Button
            type="submit"
            className="min-h-11 lg:min-h-10"
            disabled={createInvitation.isPending}
          >
            {createInvitation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Ticket className="size-4" />
            )}
            {t("profiles.invitations.generate")}
          </Button>
        </form>

        {created && (
          <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-border bg-muted/50 p-3">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              {t("profiles.invitations.createdLabel")}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 rounded-md bg-background px-3 py-2 text-center font-mono text-2xl font-semibold tracking-widest text-foreground">
                {created.code}
              </code>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 shrink-0 lg:min-h-10"
                onClick={() => void copyCode(created)}
              >
                {copiedId === created.id ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
                {t("profiles.invitations.copy")}
              </Button>
            </div>
            <div className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-background p-2 pl-3">
              <Link2 className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                {invitationJoinLink(created.code)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 shrink-0 lg:size-8"
                onClick={() => void copyLink(created)}
                aria-label={t("profiles.invitations.copyLink")}
                title={t("profiles.invitations.copyLink")}
              >
                {copiedId === `${created.id}-link` ? (
                  <Check className="size-5 lg:size-4" />
                ) : (
                  <Copy className="size-5 lg:size-4" />
                )}
              </Button>
            </div>
            <p className="text-xs leading-4 text-muted-foreground">
              {t("profiles.invitations.shareHint")}
            </p>
          </div>
        )}

        <div className="flex min-h-0 min-w-0 flex-col gap-2">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            {t("profiles.invitations.listTitle")}
          </p>
          {listQuery.isLoading ? (
            <LoadingState />
          ) : listQuery.isError ? (
            <ErrorState onRetry={() => void listQuery.refetch()} />
          ) : rows.length === 0 ? (
            <EmptyState
              message={t("profiles.invitations.empty")}
              icon={<Ticket className="size-6" />}
              className="py-6"
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {rows.map((invitation) => (
                <li
                  key={invitation.id}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border border-border bg-card p-3",
                    !invitation.usable && "opacity-70"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="font-mono text-sm font-semibold tracking-wider text-foreground">
                        {invitation.code}
                      </code>
                      {invitation.targetProfilName ? (
                        <Badge variant="secondary">
                          {t("profiles.invitations.targeted", {
                            name: invitation.targetProfilName,
                          })}
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          {t("profiles.invitations.generic")}
                        </Badge>
                      )}
                      {!invitation.usable && (
                        <Badge variant="outline">
                          {statusLabel(invitation)}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {[
                        t("profiles.invitations.uses", {
                          used: invitation.usedCount,
                          max: invitation.maxUses,
                        }),
                        t("profiles.invitations.expiresOn", {
                          date: formatDate(invitation.expiresAt, i18n.language),
                        }),
                        invitation.createdByName
                          ? t("profiles.invitations.createdBy", {
                              name: invitation.createdByName,
                            })
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-11 shrink-0 lg:size-8"
                    onClick={() => void copyCode(invitation)}
                    aria-label={t("profiles.invitations.copy")}
                    title={t("profiles.invitations.copy")}
                  >
                    {copiedId === invitation.id ? (
                      <Check className="size-5 lg:size-4" />
                    ) : (
                      <Copy className="size-5 lg:size-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-11 shrink-0 lg:size-8"
                    onClick={() => handleRevoke(invitation)}
                    disabled={revokeInvitation.isPending}
                    aria-label={t("profiles.invitations.revoke")}
                    title={t("profiles.invitations.revoke")}
                  >
                    <Trash2 className="size-5 text-destructive lg:size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
