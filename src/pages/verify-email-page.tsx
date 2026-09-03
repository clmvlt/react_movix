import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/auth-context";
import { peekAuthRedirect } from "@/lib/auth-redirect";
import { authKeys } from "@/features/auth";
import { profileKeys, profilesApi } from "@/features/profiles";

export function VerifyEmailPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const token = searchParams.get("token") ?? "";

  const verifyQuery = useQuery({
    queryKey: profileKeys.verifyEmail(token),
    queryFn: () => profilesApi.verifyEmail(token),
    enabled: Boolean(token),
    retry: false,
    staleTime: Infinity,
  });

  const verified = verifyQuery.isSuccess;
  const continueTo = peekAuthRedirect() ?? "/app";

  useEffect(() => {
    if (!verified) return;
    void queryClient.invalidateQueries({ queryKey: authKeys.me() });
  }, [verified, queryClient]);

  let status: "loading" | "success" | "error" = "loading";
  if (!token || verifyQuery.isError) status = "error";
  else if (verified) status = "success";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t("auth.verify.title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 py-6 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="size-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {t("auth.verify.verifying")}
            </p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="size-10 text-status-success-strong" />
            <p className="text-sm text-foreground">{t("auth.verify.done")}</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="size-10 text-destructive" />
            <p className="text-sm text-foreground">{t("auth.verify.failed")}</p>
          </>
        )}
        {isAuthenticated ? (
          <Button asChild variant="outline" className="mt-2 w-full">
            <Link to={continueTo}>
              {continueTo === "/app"
                ? t("joinPage.openApp")
                : t("common.continue")}
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline" className="mt-2 w-full">
            <Link to="/login">{t("auth.forgot.backToLogin")}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
