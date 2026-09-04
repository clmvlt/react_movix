import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Building2, Loader2, LogIn, LogOut, MailCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandMark } from "@/components/brand-mark";
import { FormField } from "@/components/form-field";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { AccountProfileTab } from "@/components/account/account-profile-tab";
import { ApiError, apiErrorText } from "@/lib/api-error";
import { useAuth } from "@/app/auth-context";
import { useToast } from "@/app/toast-context";
import { useLogout } from "@/features/auth";
import { useResendVerification } from "@/features/profiles";
import {
  INVITATION_CODE_LENGTH,
  normalizeInvitationCode,
  useJoinAccount,
} from "@/features/invitations";

function JoinCard() {
  const { t } = useTranslation();
  const { applyNewMembership } = useAuth();
  const joinAccount = useJoinAccount();

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const normalized = normalizeInvitationCode(code);
    if (normalized.length !== INVITATION_CODE_LENGTH) {
      setError(
        t("joinCompany.errors.length", { count: INVITATION_CODE_LENGTH })
      );
      return;
    }

    joinAccount.mutate(
      { code: normalized },
      {
        onSuccess: (membership) => {
          applyNewMembership(membership);
        },
        onError: (err) => {
          if (err instanceof ApiError && err.isEmailNotVerified) {
            setError(t("noCompany.verifyFirst"));
          } else if (err instanceof ApiError && err.status === 404) {
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="size-5 shrink-0 text-primary" />
          {t("noCompany.title")}
        </CardTitle>
        <CardDescription>{t("noCompany.hint")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-1 sm:max-w-sm"
          noValidate
        >
          <FormField
            label={t("joinCompany.codeLabel")}
            htmlFor="nc-join-code"
            error={error ?? undefined}
            required
          >
            <Input
              id="nc-join-code"
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
          <Button
            type="submit"
            className="min-h-11 lg:min-h-10"
            disabled={joinAccount.isPending}
          >
            {joinAccount.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LogIn className="size-4" />
            )}
            {t("joinCompany.submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function VerifyEmailAlert() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const resendVerification = useResendVerification();

  const handleResend = () => {
    resendVerification.mutate(undefined, {
      onSuccess: () => toast.success(t("auth.verify.resent")),
      onError: () => toast.error(t("common.error")),
    });
  };

  return (
    <Alert variant="warning" className="flex flex-col items-start gap-2">
      <div>
        <AlertTitle>{t("noCompany.verifyTitle")}</AlertTitle>
        <AlertDescription>
          {t("noCompany.verifyHint", { email: user?.email ?? "" })}
        </AlertDescription>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-h-10"
        disabled={resendVerification.isPending}
        onClick={handleResend}
      >
        {resendVerification.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <MailCheck className="size-4" />
        )}
        {t("auth.verify.resend")}
      </Button>
    </Alert>
  );
}

export function NoCompanyPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => navigate("/login", { replace: true }),
    });
  };

  return (
    <div className="min-h-dvh w-full bg-background">
      <header className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-2 px-4 sm:px-6">
        <BrandMark />
        <div className="flex items-center gap-1">
          <ThemeSwitcher className="size-10" />
          <LanguageSwitcher className="size-10" />
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 lg:min-h-10"
            onClick={handleLogout}
            disabled={logout.isPending}
            aria-label={t("auth.logout")}
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">{t("auth.logout")}</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pb-10 pt-2 sm:px-6">
        {user?.isEmailVerified === false && <VerifyEmailAlert />}
        <JoinCard />

        <section className="flex flex-col gap-3">
          <h2 className="px-1 text-xs font-medium uppercase text-muted-foreground">
            {t("noCompany.accountTitle")}
          </h2>
          <AccountProfileTab />
        </section>
      </main>
    </div>
  );
}
