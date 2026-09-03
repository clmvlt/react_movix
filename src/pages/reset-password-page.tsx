import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/app/toast-context";
import { FormField } from "@/components/form-field";
import { ApiError } from "@/lib/api-error";
import { useResetPassword } from "@/features/profiles";

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const reset = useResetPassword();
  const toast = useToast();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(t("auth.reset.mismatch"));
      return;
    }
    reset.mutate(
      { token, newPassword, confirmPassword },
      {
        onError: (err) => {
          if (err instanceof ApiError && err.status === 400) {
            toast.error(err.message || t("auth.reset.invalidToken"));
          } else {
            toast.error(t("auth.reset.invalidToken"));
          }
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t("auth.reset.title")}</CardTitle>
        <CardDescription>{t("auth.reset.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        {reset.isSuccess ? (
          <div className="flex flex-col gap-4">
            <Alert variant="success">
              <CheckCircle2 />
              <AlertDescription>{t("auth.reset.done")}</AlertDescription>
            </Alert>
            <Button asChild className="w-full">
              <Link to="/login">{t("auth.forgot.backToLogin")}</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-1" noValidate>
            <FormField
              label={t("auth.reset.newPassword")}
              htmlFor="newPassword"
              required
            >
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </FormField>
            <FormField
              label={t("auth.reset.confirmPassword")}
              htmlFor="confirmPassword"
              required
            >
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </FormField>
            <Button
              type="submit"
              className="mt-2 w-full"
              disabled={reset.isPending || !token}
            >
              {reset.isPending && <Loader2 className="size-4 animate-spin" />}
              {reset.isPending
                ? t("auth.reset.submitting")
                : t("auth.reset.submit")}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
