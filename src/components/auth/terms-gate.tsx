import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { Loader2, LogOut, ScrollText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/app/auth-context";
import { useToast } from "@/app/toast-context";
import { ApiError, apiErrorText } from "@/lib/api-error";
import { needsTermsAcceptance, useAcceptTerms, useLogout } from "@/features/auth";

const CHECKBOX_ID = "terms-gate-accept";

function TermsGateDialog() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const acceptTerms = useAcceptTerms();
  const logout = useLogout();
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUpdate = Boolean(user?.terms?.acceptedVersion);

  const handleAccept = () => {
    if (!checked) {
      setError(t("terms.required"));
      return;
    }
    setError(null);
    acceptTerms.mutate(undefined, {
      onError: (err) => {
        if (err instanceof ApiError && err.isEmailNotVerified) {
          setError(t("auth.verify.notVerified"));
        } else {
          setError(apiErrorText(err) ?? t("common.error"));
        }
      },
    });
  };

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => navigate("/login", { replace: true }),
      onError: () => toast.error(t("common.error")),
    });
  };

  return (
    <Dialog open>
      <DialogContent
        hideClose
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <div className="mb-1 flex justify-center sm:justify-start">
            <span className="flex size-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <ScrollText className="size-5" aria-hidden />
            </span>
          </div>
          <DialogTitle>
            {isUpdate ? t("terms.gate.titleUpdate") : t("terms.gate.title")}
          </DialogTitle>
          <DialogDescription>
            {isUpdate
              ? t("terms.gate.descriptionUpdate")
              : t("terms.gate.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-start gap-3 rounded-lg border border-border px-3 py-3">
            <Checkbox
              id={CHECKBOX_ID}
              checked={checked}
              onCheckedChange={(value) => {
                setChecked(value === true);
                setError(null);
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={`${CHECKBOX_ID}-message`}
              className="mt-0.5"
            />
            <Label
              htmlFor={CHECKBOX_ID}
              className="cursor-pointer text-sm font-normal leading-5"
            >
              <Trans
                i18nKey="terms.acceptLabel"
                components={{
                  terms: (
                    <Link
                      to="/legal/terms"
                      target="_blank"
                      rel="noopener"
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    />
                  ),
                  privacy: (
                    <Link
                      to="/legal/privacy"
                      target="_blank"
                      rel="noopener"
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    />
                  ),
                }}
              />
            </Label>
          </div>
          <p
            id={`${CHECKBOX_ID}-message`}
            role={error ? "alert" : undefined}
            className="min-h-4 text-xs leading-4 text-destructive"
          >
            {error ?? ""}
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 lg:min-h-10"
            onClick={handleLogout}
            disabled={logout.isPending || acceptTerms.isPending}
          >
            {logout.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LogOut className="size-4" />
            )}
            {t("auth.logout")}
          </Button>
          <Button
            type="button"
            className="min-h-11 lg:min-h-10"
            onClick={handleAccept}
            disabled={acceptTerms.isPending || logout.isPending}
          >
            {acceptTerms.isPending && (
              <Loader2 className="size-4 animate-spin" />
            )}
            {t("terms.gate.accept")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TermsGate() {
  const { user } = useAuth();
  if (!user || !needsTermsAcceptance(user)) return null;
  if (user.isEmailVerified === false) return null;
  return <TermsGateDialog />;
}
