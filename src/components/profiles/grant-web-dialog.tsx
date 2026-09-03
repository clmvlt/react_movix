import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Copy, Globe, Link2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ApiError, apiErrorText } from "@/lib/api-error";
import { copyText } from "@/lib/clipboard";
import { formatDate } from "@/lib/date";
import { useToast } from "@/app/toast-context";
import { profilFullName, type Profil } from "@/features/auth";
import {
  invitationJoinLink,
  useCreateInvitation,
  type Invitation,
} from "@/features/invitations";

interface GrantWebDialogProps {
  profil: Profil | null;
  onClose: () => void;
}

export function GrantWebDialog({ profil, onClose }: GrantWebDialogProps) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const createInvitation = useCreateInvitation();

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const requestedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!profil) {
      requestedRef.current = null;
      setInvitation(null);
      setError(null);
      setCopiedKey(null);
      return;
    }
    if (requestedRef.current === profil.id) return;
    requestedRef.current = profil.id;
    createInvitation.mutate(
      { profilId: profil.id },
      {
        onSuccess: (created) => {
          setInvitation(created);
        },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 409) {
            setError(t("profiles.grantWeb.alreadyLinked"));
          } else if (err instanceof ApiError && err.status === 404) {
            setError(t("profiles.grantWeb.notFound"));
          } else {
            setError(apiErrorText(err) ?? t("common.error"));
          }
        },
      }
    );
  }, [profil, createInvitation, t]);

  useEffect(() => {
    if (!copiedKey) return;
    const timer = window.setTimeout(() => setCopiedKey(null), 1500);
    return () => window.clearTimeout(timer);
  }, [copiedKey]);

  const copyValue = async (key: string, value: string, toastKey: string) => {
    if (await copyText(value)) {
      setCopiedKey(key);
      toast.success(t(toastKey));
    } else {
      setCopiedKey(null);
      toast.error(t("common.copyFailed"));
    }
  };

  const name =
    profilFullName(profil) || profil?.identifiant || profil?.email || "";
  const link = invitation ? invitationJoinLink(invitation.code) : "";

  return (
    <Dialog
      open={Boolean(profil)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="size-5 shrink-0 text-primary" />
            {t("profiles.grantWeb.title")}
          </DialogTitle>
          <DialogDescription>
            {t("profiles.grantWeb.subtitle", { name })}
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : !invitation ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex min-w-0 flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              {t("profiles.grantWeb.readyHint", { name })}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 rounded-md bg-muted px-3 py-2 text-center font-mono text-2xl font-semibold tracking-widest text-foreground">
                {invitation.code}
              </code>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 shrink-0 lg:min-h-10"
                onClick={() =>
                  void copyValue(
                    "code",
                    invitation.code,
                    "profiles.invitations.copied"
                  )
                }
              >
                {copiedKey === "code" ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
                {t("profiles.invitations.copy")}
              </Button>
            </div>

            <div className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-muted/50 p-2 pl-3">
              <Link2 className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                {link}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 shrink-0 lg:size-8"
                onClick={() =>
                  void copyValue(
                    "link",
                    link,
                    "profiles.invitations.linkCopied"
                  )
                }
                aria-label={t("profiles.invitations.copyLink")}
                title={t("profiles.invitations.copyLink")}
              >
                {copiedKey === "link" ? (
                  <Check className="size-5 lg:size-4" />
                ) : (
                  <Copy className="size-5 lg:size-4" />
                )}
              </Button>
            </div>

            <p className="text-xs leading-4 text-muted-foreground">
              {t("profiles.invitations.expiresOn", {
                date: formatDate(invitation.expiresAt, i18n.language),
              })}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
