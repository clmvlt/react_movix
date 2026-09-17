import { useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/app/toast-context";
import { FormField } from "@/components/form-field";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { ApiError, apiErrorText } from "@/lib/api-error";
import { clearSession } from "@/lib/auth";
import { usePageSeo } from "@/lib/seo";
import {
  authKeys,
  canAccessWeb,
  useGoogleLogin,
  useLogin,
  type ProfilAuth,
} from "@/features/auth";

export function LoginPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const queryClient = useQueryClient();
  const login = useLogin();
  const googleLogin = useGoogleLogin();
  const toast = useToast();

  usePageSeo({
    title: t("auth.login.documentTitle"),
    description: t("auth.login.metaDescription"),
    path: "/login",
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleError, setGoogleError] = useState<string | null>(null);

  const completeLogin = (profil: ProfilAuth) => {
    if (canAccessWeb(profil)) return;
    clearSession();
    queryClient.removeQueries({ queryKey: authKeys.all });
    toast.error(t("auth.login.webOnly"));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setGoogleError(null);
    login.mutate(
      { email: email.trim(), password },
      {
        onSuccess: completeLogin,
        onError: (err) => {
          if (err instanceof ApiError && err.status === 401) {
            toast.error(t("auth.login.invalidCredentials"));
          } else {
            toast.error(t("common.error"));
          }
        },
      }
    );
  };

  const handleGoogleCredential = (idToken: string) => {
    setGoogleError(null);
    googleLogin.mutate(
      { idToken },
      {
        onSuccess: completeLogin,
        onError: (err) => {
          if (err instanceof ApiError && err.errorCode === "GOOGLE_NO_PROFILE") {
            setGoogleError(t("auth.login.googleNoProfile"));
          } else if (err instanceof ApiError && err.isGoogleEmailUsed) {
            setGoogleError(t("auth.login.googleEmailUsed"));
          } else if (err instanceof ApiError && err.status === 401) {
            toast.error(t("auth.login.googleFailed"));
          } else {
            toast.error(apiErrorText(err) ?? t("common.error"));
          }
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t("auth.login.title")}</CardTitle>
        <CardDescription>{t("auth.login.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-1" noValidate>
          <FormField label={t("auth.login.email")} htmlFor="email" required>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.login.emailPlaceholder")}
              autoComplete="email"
              autoFocus
              required
            />
          </FormField>
          <FormField
            label={t("auth.login.password")}
            htmlFor="password"
            required
          >
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.login.passwordPlaceholder")}
              autoComplete="current-password"
              required
            />
          </FormField>
          <Button
            type="submit"
            className="mt-2 w-full"
            disabled={login.isPending}
          >
            {login.isPending && <Loader2 className="size-4 animate-spin" />}
            {login.isPending
              ? t("auth.login.submitting")
              : t("auth.login.submit")}
          </Button>
          <div className="mt-3 text-center">
            <Link
              to="/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              {t("auth.login.forgotPassword")}
            </Link>
          </div>
          <div className="mt-2 text-center text-sm text-muted-foreground">
            {t("auth.login.noAccount")}{" "}
            <Link
              to="/register"
              state={location.state}
              className="text-primary hover:underline"
            >
              {t("auth.login.createAccount")}
            </Link>
          </div>
        </form>
        <GoogleAuthButton
          className="mt-4"
          text="continue_with"
          onCredential={handleGoogleCredential}
          busy={googleLogin.isPending}
          before={
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs uppercase text-muted-foreground">
                {t("auth.login.or")}
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>
          }
        />
        {googleError && (
          <Alert variant="destructive" className="mt-3">
            <AlertDescription>{googleError}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
