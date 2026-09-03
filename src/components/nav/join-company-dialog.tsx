import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, LogIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import { ApiError, apiErrorText } from "@/lib/api-error";
import { useAuth } from "@/app/auth-context";
import {
  INVITATION_CODE_LENGTH,
  normalizeInvitationCode,
  useJoinAccount,
} from "@/features/invitations";

interface JoinCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinCompanyDialog({
  open,
  onOpenChange,
}: JoinCompanyDialogProps) {
  const { t } = useTranslation();
  const { applyNewMembership } = useAuth();
  const joinAccount = useJoinAccount();

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setCode("");
      setError(null);
    }
  }, [open]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const normalized = normalizeInvitationCode(code);
    if (normalized.length !== INVITATION_CODE_LENGTH) {
      setError(t("joinCompany.errors.length", { count: INVITATION_CODE_LENGTH }));
      return;
    }

    joinAccount.mutate(
      { code: normalized },
      {
        onSuccess: (membership) => {
          onOpenChange(false);
          applyNewMembership(membership);
        },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 404) {
            setError(t("joinCompany.errors.invalid"));
          } else if (err instanceof ApiError && err.status === 409) {
            setError(t("joinCompany.errors.alreadyMember"));
          } else if (err instanceof ApiError && err.status === 429) {
            setError(t("joinCompany.errors.rateLimited"));
          } else {
            setError(apiErrorText(err) ?? t("common.error"));
          }
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("joinCompany.title")}</DialogTitle>
          <DialogDescription>{t("joinCompany.subtitle")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-1" noValidate>
          <FormField
            label={t("joinCompany.codeLabel")}
            htmlFor="join-code"
            error={error ?? undefined}
            required
          >
            <Input
              id="join-code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError(null);
              }}
              placeholder={t("joinCompany.codePlaceholder")}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={16}
              className="min-h-11 text-center font-mono text-lg uppercase tracking-widest placeholder:normal-case lg:min-h-10"
            />
          </FormField>

          <DialogFooter className="mt-3">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 sm:min-h-10"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              className="min-h-11 sm:min-h-10"
              disabled={joinAccount.isPending}
            >
              {joinAccount.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LogIn className="size-4" />
              )}
              {t("joinCompany.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
