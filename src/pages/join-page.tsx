import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Building2,
  Loader2,
  LogIn,
  MailCheck,
  TicketX,
  UserPlus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-mark";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { ApiError, apiErrorText } from "@/lib/api-error";
import { clearAuthRedirect, saveAuthRedirect } from "@/lib/auth-redirect";
import { useAuth } from "@/app/auth-context";
import { useToast } from "@/app/toast-context";
import { useResendVerification } from "@/features/profiles";
import {
  INVITATION_CODE_LENGTH,
  normalizeInvitationCode,
  useInvitationPreview,
  useJoinAccount,
} from "@/features/invitations";

type JoinStep = "joining" | "verifyEmail" | "error";

export function JoinPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const { user, isLoading, applyNewMembership } = useAuth();
  const joinAccount = useJoinAccount();
  const resendVerification = useResendVerification();

  const code = normalizeInvitationCode(searchParams.get("code") ?? "");
  const validCode = code.length === INVITATION_CODE_LENGTH;

  const previewQuery = useInvitationPreview(code, validCode);
  const preview = previewQuery.data ?? null;
  const joinPath = `/join?code=${code}`;

  const [step, setStep] = useState<JoinStep>("joining");
  const [joinError, setJoinError] = useState<string | null>(null);
  const attemptedRef = useRef(false);

  const attemptJoin = useCallback(() => {
    setStep("joining");
    setJoinError(null);
    joinAccount.mutate(
      { code },
      {
        onSuccess: (membership) => {
          clearAuthRedirect(joinPath);
          navigate("/app", { replace: true });
          applyNewMembership(membership);
        },
        onError: (err) => {
          if (err instanceof ApiError && err.isEmailNotVerified) {
            saveAuthRedirect(joinPath);
            setStep("verifyEmail");
            return;
          }
          clearAuthRedirect(joinPath);
          setStep("error");
          if (err instanceof ApiError && err.status === 404) {
            setJoinError(t("joinPage.invalid"));
          } else if (err instanceof ApiError && err.status === 409) {
            setJoinError(t("joinCompany.errors.alreadyMember"));
          } else if (err instanceof ApiError && err.status === 429) {
            setJoinError(t("joinCompany.errors.rateLimited"));
          } else {
            setJoinError(apiErrorText(err) ?? t("common.error"));
          }
        },
      }
    );
  }, [code, joinPath, joinAccount, navigate, applyNewMembership, t]);

  useEffect(() => {
    if (!user || !preview || attemptedRef.current) return;
    attemptedRef.current = true;
    attemptJoin();
  }, [user, preview, attemptJoin]);

  const previewFailed = !validCode || previewQuery.isError;
  const awaitingAuth = !isLoading && !user && Boolean(preview);

  useEffect(() => {
    if (awaitingAuth) saveAuthRedirect(joinPath);
    else if (previewFailed) clearAuthRedirect(joinPath);
  }, [awaitingAuth, previewFailed, joinPath]);

  const handleResend = () => {
    resendVerification.mutate(undefined, {
      onSuccess: () => toast.success(t("auth.verify.resent")),
      onError: () => toast.error(t("common.error")),
    });
  };

  const authRedirect = { from: { pathname: joinPath } };

  const renderBody = () => {
    if (!validCode) {
      return (
        <InvalidCard
          message={t("joinPage.invalid")}
          authenticated={Boolean(user)}
        />
      );
    }
    if (previewQuery.isLoading || isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      );
    }
    if (previewQuery.isError || !preview) {
      const rateLimited =
        previewQuery.error instanceof ApiError &&
        previewQuery.error.status === 429;
      return (
        <InvalidCard
          message={
            rateLimited
              ? t("joinCompany.errors.rateLimited")
              : t("joinPage.invalid")
          }
          authenticated={Boolean(user)}
        />
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="size-5 shrink-0 text-primary" />
            {t("joinPage.inviteTitle", { societe: preview.societe })}
          </CardTitle>
          <CardDescription>
            {preview.targetsExistingProfile && preview.targetProfileName
              ? t("joinPage.inviteProfile", {
                  name: preview.targetProfileName,
                })
              : t("joinPage.inviteHint")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!user ? (
            <>
              <Button
                type="button"
                className="min-h-11 w-full lg:min-h-10"
                onClick={() =>
                  navigate("/register", { state: authRedirect })
                }
              >
                <UserPlus className="size-4" />
                {t("auth.login.createAccount")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 w-full lg:min-h-10"
                onClick={() => navigate("/login", { state: authRedirect })}
              >
                <LogIn className="size-4" />
                {t("joinPage.haveAccount")}
              </Button>
            </>
          ) : step === "verifyEmail" ? (
            <Alert variant="warning" className="flex flex-col items-start gap-2">
              <div>
                <AlertTitle>{t("noCompany.verifyTitle")}</AlertTitle>
                <AlertDescription>
                  {t("noCompany.verifyHint", { email: user.email ?? "" })}
                </AlertDescription>
              </div>
              <div className="flex flex-wrap gap-2">
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
                <Button
                  type="button"
                  size="sm"
                  className="min-h-10"
                  disabled={joinAccount.isPending}
                  onClick={attemptJoin}
                >
                  {t("joinPage.verifiedContinue")}
                </Button>
              </div>
            </Alert>
          ) : step === "error" ? (
            <>
              <Alert variant="destructive">
                <AlertDescription>{joinError}</AlertDescription>
              </Alert>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 w-full sm:w-fit lg:min-h-10"
                onClick={() => navigate("/app")}
              >
                {t("joinPage.openApp")}
              </Button>
            </>
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 shrink-0 animate-spin" />
              {t("joinPage.joining", { societe: preview.societe })}
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex min-h-dvh w-full flex-col bg-background">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <BrandMark />
        <div className="flex items-center gap-1">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-8 sm:items-center sm:py-12">
        <div className="w-full max-w-md">{renderBody()}</div>
      </main>
    </div>
  );
}

function InvalidCard({
  message,
  authenticated,
}: {
  message: string;
  authenticated: boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
      <TicketX className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{message}</p>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 lg:min-h-10"
          onClick={() => navigate(authenticated ? "/app" : "/login")}
        >
          {authenticated ? t("joinPage.openApp") : t("joinPage.goToLogin")}
        </Button>
      </CardContent>
    </Card>
  );
}
