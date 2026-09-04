import { useEffect, useState, type ReactNode } from "react";
import { Link, Navigate, useLocation, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CheckCircle2,
  Loader2,
  ShieldAlert,
  TicketX,
  Trash2,
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
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import { BrandMark } from "@/components/brand-mark";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { AccountDeletionCounts } from "@/components/hyperadmin/account-deletion-counts";
import { AccountDeletionResultCard } from "@/components/hyperadmin/account-deletion-result-card";
import { useAuth } from "@/app/auth-context";
import { useToast } from "@/app/toast-context";
import { ApiError, apiErrorText } from "@/lib/api-error";
import { clearAuthRedirect, saveAuthRedirect } from "@/lib/auth-redirect";
import { formatDateTime } from "@/lib/date";
import { usePageSeo } from "@/lib/seo";
import {
  useAccountDeletionByToken,
  useConfirmAccountDeletion,
  useRequestAccountDeletion,
  type AccountDeletionResult,
} from "@/features/admin-accounts";

const COMPANIES_PATH = "/app/hyperadmin?tab=companies";

type ConfirmError = "forbidden" | "gone" | "expired" | "failed";

export function ConfirmAccountDeletionPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, isLoading } = useAuth();

  const token = searchParams.get("token") ?? "";
  const path = `/confirm-account-deletion${location.search}`;

  usePageSeo({
    title: t("hyperadmin.companies.confirm.documentTitle"),
    description: t("hyperadmin.companies.confirm.metaDescription"),
    path: "/confirm-account-deletion",
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated && token) saveAuthRedirect(path);
  }, [isLoading, isAuthenticated, token, path]);

  useEffect(() => {
    if (isAuthenticated) clearAuthRedirect(path);
  }, [isAuthenticated, path]);

  let body: ReactNode;
  if (isLoading) {
    body = (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  } else if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  } else if (user?.hyperadmin !== true) {
    body = (
      <MessageCard
        tone="error"
        title={t("hyperadmin.companies.confirm.title")}
        message={t("errors.hyperadminOnly")}
      />
    );
  } else if (!token) {
    body = (
      <MessageCard
        tone="error"
        title={t("hyperadmin.companies.confirm.title")}
        message={t("hyperadmin.companies.confirm.invalid")}
      />
    );
  } else {
    body = <ConfirmPanel token={token} />;
  }

  return (
    <div className="flex min-h-dvh w-full flex-col bg-background">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <BrandMark />
        <div className="flex items-center gap-1">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-2xl">{body}</div>
      </main>
    </div>
  );
}

function ConfirmPanel({ token }: { token: string }) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const previewQuery = useAccountDeletionByToken(token);
  const confirmDeletion = useConfirmAccountDeletion();
  const requestDeletion = useRequestAccountDeletion();

  const [confirmName, setConfirmName] = useState("");
  const [result, setResult] = useState<AccountDeletionResult | null>(null);
  const [error, setError] = useState<ConfirmError | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  if (result) {
    return <AccountDeletionResultCard result={result} />;
  }

  if (previewQuery.isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (previewQuery.isError) {
    const status =
      previewQuery.error instanceof ApiError ? previewQuery.error.status : 0;
    return (
      <MessageCard
        tone="error"
        title={t("hyperadmin.companies.confirm.title")}
        message={
          status === 410
            ? t("hyperadmin.companies.confirm.expired")
            : status === 404
              ? t("hyperadmin.companies.confirm.gone")
              : (apiErrorText(previewQuery.error) ??
                t("hyperadmin.companies.errors.loadFailed"))
        }
      />
    );
  }

  const preview = previewQuery.data;
  if (!preview) return null;

  const societe = preview.societe ?? "";
  const request = preview.pendingRequest;
  const nameMatches =
    confirmName.trim().toLowerCase() === societe.trim().toLowerCase();

  const handleConfirm = () => {
    setError(null);
    setErrorDetail(null);
    confirmDeletion.mutate(token, {
      onSuccess: (deletion) => setResult(deletion),
      onError: (err) => {
        const status = err instanceof ApiError ? err.status : 0;
        if (status === 403) setError("forbidden");
        else if (status === 404) setError("gone");
        else if (status === 410) setError("expired");
        else {
          setError("failed");
          setErrorDetail(apiErrorText(err));
        }
      },
    });
  };

  const handleRelaunch = () => {
    requestDeletion.mutate(preview.accountId, {
      onSuccess: (next) => {
        toast.success(
          t("hyperadmin.companies.delete.sentHint", {
            email: next.requesterEmail,
            date: formatDateTime(next.expiresAt, i18n.language),
          })
        );
      },
      onError: (err) => {
        toast.error(
          apiErrorText(err) ??
            t("hyperadmin.companies.errors.requestFailed")
        );
      },
    });
  };

  const errorText =
    error === "forbidden"
      ? t("hyperadmin.companies.confirm.forbidden")
      : error === "gone"
        ? t("hyperadmin.companies.confirm.gone")
        : error === "expired"
          ? t("hyperadmin.companies.confirm.expired")
          : error === "failed"
            ? (errorDetail ?? t("hyperadmin.companies.errors.deleteFailed"))
            : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">
          {t("hyperadmin.companies.confirm.title")}
        </CardTitle>
        <CardDescription>
          {t("hyperadmin.companies.confirm.subtitle", { societe })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Alert variant="destructive">
          <ShieldAlert />
          <AlertTitle>
            {t("hyperadmin.companies.confirm.warningTitle")}
          </AlertTitle>
          <AlertDescription>
            {t("hyperadmin.companies.confirm.warningHint")}
          </AlertDescription>
        </Alert>

        {request && (
          <dl className="grid grid-cols-1 gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm sm:grid-cols-2">
            <div className="min-w-0">
              <dt className="text-xs uppercase text-muted-foreground">
                {t("hyperadmin.companies.confirm.requestedBy")}
              </dt>
              <dd className="truncate text-foreground">
                {request.requesterName
                  ? `${request.requesterName} (${request.requesterEmail})`
                  : request.requesterEmail}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs uppercase text-muted-foreground">
                {t("hyperadmin.companies.confirm.expiresAt")}
              </dt>
              <dd className="truncate text-foreground">
                {formatDateTime(request.expiresAt, i18n.language)}
              </dd>
            </div>
          </dl>
        )}

        <AccountDeletionCounts preview={preview} />

        <p className="rounded-lg border border-border bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
          {t("hyperadmin.companies.delete.survivors")}
        </p>

        {errorText && (
          <Alert variant="destructive">
            <AlertDescription>{errorText}</AlertDescription>
          </Alert>
        )}

        {error === "expired" || error === "gone" ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            {error === "expired" && (
              <Button
                type="button"
                className="min-h-11 lg:min-h-10"
                disabled={requestDeletion.isPending}
                onClick={handleRelaunch}
              >
                {requestDeletion.isPending && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                {t("hyperadmin.companies.confirm.relaunch")}
              </Button>
            )}
            <Button asChild variant="outline" className="min-h-11 lg:min-h-10">
              <Link to={COMPANIES_PATH}>
                {t("hyperadmin.companies.backToList")}
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <FormField
              label={t("hyperadmin.companies.delete.confirmLabel", { societe })}
              htmlFor="confirm-account-deletion-name"
              hint={t("hyperadmin.companies.delete.confirmHint")}
            >
              <Input
                id="confirm-account-deletion-name"
                value={confirmName}
                onChange={(event) => setConfirmName(event.target.value)}
                autoComplete="off"
                className="min-h-11 lg:min-h-10"
              />
            </FormField>
            <div className="flex flex-col gap-2 sm:flex-row-reverse">
              <Button
                type="button"
                variant="destructive"
                className="min-h-11 lg:min-h-10"
                disabled={!nameMatches || confirmDeletion.isPending}
                onClick={handleConfirm}
              >
                {confirmDeletion.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                {t("hyperadmin.companies.confirm.action")}
              </Button>
              <Button
                asChild
                variant="outline"
                className="min-h-11 lg:min-h-10"
              >
                <Link to={COMPANIES_PATH}>{t("common.cancel")}</Link>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function MessageCard({
  tone,
  title,
  message,
}: {
  tone: "error" | "success";
  title: string;
  message: string;
}) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 py-6 text-center">
        {tone === "error" ? (
          <TicketX className="size-10 text-muted-foreground" />
        ) : (
          <CheckCircle2 className="size-10 text-status-success-strong" />
        )}
        <p className="text-sm text-foreground">{message}</p>
        <Button asChild variant="outline" className="min-h-11 lg:min-h-10">
          <Link to={COMPANIES_PATH}>
            {t("hyperadmin.companies.backToList")}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
