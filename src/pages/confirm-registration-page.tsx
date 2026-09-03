import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-error";
import { consumeAuthRedirect } from "@/lib/auth-redirect";
import { usePageSeo } from "@/lib/seo";
import { useConfirmRegistration } from "@/features/auth";

type Status = "loading" | "success" | "invalid" | "conflict" | "error";

export function ConfirmRegistrationPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const confirm = useConfirmRegistration(token);

  usePageSeo({
    title: t("auth.confirm.documentTitle"),
    description: t("auth.confirm.metaDescription"),
    path: "/confirm-registration",
  });

  const confirmed = confirm.isSuccess;

  useEffect(() => {
    if (!confirmed) return;
    navigate(consumeAuthRedirect() ?? "/app", { replace: true });
  }, [confirmed, navigate]);

  let status: Status = "loading";
  if (!token) status = "invalid";
  else if (confirm.isSuccess) status = "success";
  else if (confirm.isError) {
    const err = confirm.error;
    if (err instanceof ApiError && err.status === 409) status = "conflict";
    else if (
      err instanceof ApiError &&
      (err.isRegistrationTokenInvalid || err.status === 400)
    ) {
      status = "invalid";
    } else status = "error";
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t("auth.confirm.title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 py-6 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="size-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {t("auth.confirm.confirming")}
            </p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="size-10 text-status-success-strong" />
            <p className="text-sm text-foreground">{t("auth.confirm.done")}</p>
          </>
        )}
        {status === "invalid" && (
          <>
            <XCircle className="size-10 text-destructive" />
            <p className="text-sm text-foreground">{t("auth.confirm.invalid")}</p>
            <Button asChild className="mt-2 min-h-11 w-full">
              <Link to="/register">{t("auth.register.pending.restart")}</Link>
            </Button>
            <Button asChild variant="outline" className="min-h-11 w-full">
              <Link to="/login">{t("auth.register.signIn")}</Link>
            </Button>
          </>
        )}
        {status === "conflict" && (
          <>
            <XCircle className="size-10 text-destructive" />
            <p className="text-sm text-foreground">
              {t("auth.confirm.conflict")}
            </p>
            <Button asChild className="mt-2 min-h-11 w-full">
              <Link to="/login">{t("auth.register.signIn")}</Link>
            </Button>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="size-10 text-destructive" />
            <p className="text-sm text-foreground">{t("auth.confirm.failed")}</p>
            <Button asChild variant="outline" className="mt-2 min-h-11 w-full">
              <Link to="/register">{t("auth.register.pending.restart")}</Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
